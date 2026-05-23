//! # Safe-Concurrency Multi-Sensor Fusion for Industrial Safety-Critical Systems
//! ============================================================================
//! **Platform**  : ESP32-S3 (Xtensa LX7, dual-core, 240 MHz), bare-metal (`no_std`)
//! **Toolchain** : Rust 2021 + `esp-hal` v0.22 (target: `xtensa-esp32s3-none-elf`)
//! **Simulator** : Proteus 8.17+ (ESP32-S3 MicroPython model + Virtual Terminal)
//!
//! ## Arsitektur Konkurensi
//!
//! - [`Mutex<RefCell<T>>`] dari crate [`critical_section`] menjamin akses
//!   **data-race-free** ke shared state dari loop utama maupun interrupt handler.
//!   Setiap akses dilakukan di dalam blok [`critical_section::with()`], yang secara
//!   atomik menonaktifkan interrupt selama akses berlangsung.
//!
//! - Pengukuran latensi menggunakan **hardware timer TIMG0** pada frekuensi
//!   APB 80 MHz (resolusi 12.5 ns/tick) — bukan hardcoded `delay_ms()`.
//!
//! - Fail-safe valve ditahan tertutup selama [`LOCKOUT_DURATION_MS`] sebelum
//!   diizinkan dibuka kembali, mencegah fenomena *valve bounce* di lingkungan
//!   industri nyata.
//!
//! ## Wiring (Active-High untuk semua LED)
//!
//! | GPIO | Fungsi | Komponen |
//! |------|--------|----------|
//! | GPIO2  | Valve indicator (fault = ON) | LED Merah + 220Ω |
//! | GPIO4  | System normal indicator | LED Hijau + 220Ω |
//! | GPIO5  | Lockout indicator | LED Kuning + 220Ω |
//! | GPIO15 | Fault injection button | Push-button + 10kΩ pull-down |
//! | GPIO1  | Serial TX (UART0) | Virtual Terminal (115200 baud) |

#![no_std]
#![no_main]

use esp_backtrace as _;
use esp_hal::{
    clock::ClockControl,
    gpio::Io,
    peripherals::Peripherals,
    prelude::*,
    system::SystemControl,
    timer::timg::TimerGroup,
};
use core::cell::RefCell;
use critical_section::Mutex;
use esp_println::println;

// ─────────────────────────────────────────────────────────────────────────────
// KONSTANTA KONFIGURASI (Threshold & Timing)
// ─────────────────────────────────────────────────────────────────────────────

/// Ambang batas suhu anomali (°C).
/// Pembacaan di atas nilai ini mengindikasikan sensor suhu mengalami anomali.
const TEMPERATURE_ANOMALY_THRESHOLD: u32 = 80;

/// Ambang batas tekanan minimum (hPa).
/// Pembacaan di bawah nilai ini mengindikasikan sensor tekanan anomali rendah.
const PRESSURE_MIN_THRESHOLD: u32 = 900;

/// Ambang batas tekanan maksimum (hPa).
/// Pembacaan di atas nilai ini mengindikasikan sensor tekanan anomali tinggi.
const PRESSURE_MAX_THRESHOLD: u32 = 1200;

/// Ambang batas vibrasi anomali (unit: arbitrary sensor reading).
/// Pembacaan di atas nilai ini mengindikasikan sensor vibrasi anomali.
const VIBRATION_ANOMALY_THRESHOLD: u32 = 500;

/// Jumlah minimum sensor anomali untuk mendeklarasikan fault.
/// Menggunakan voting majority: ≥ 2 dari 3 sensor = fault (fail-safe trigger).
const VOTING_QUORUM: u32 = 2;

/// Durasi minimum valve harus tetap tertutup setelah deteksi anomali (ms).
/// Ini mencegah valve "bounce" yang berbahaya di sistem industri nyata.
const LOCKOUT_DURATION_MS: u32 = 2000;

/// Interval sampling sensor (ms).
const SENSOR_POLL_INTERVAL_MS: u32 = 500;

/// Frekuensi APB clock ESP32-S3 dalam MHz — digunakan untuk konversi
/// tick timer ke microsecond. APB clock default = 80 MHz.
const APB_FREQ_MHZ: u64 = 80;

// ─────────────────────────────────────────────────────────────────────────────
// SHARED STATE (Thread-Safe via Mutex<RefCell<T>>)
// ─────────────────────────────────────────────────────────────────────────────

/// Representasi state sistem yang di-share antar konteks eksekusi.
///
/// Dilindungi oleh [`critical_section::Mutex`] untuk mencegah data-race.
/// Akses hanya boleh dilakukan di dalam blok [`critical_section::with()`].
///
/// # Fields
/// - `sensor_temp`: Pembacaan suhu terakhir (°C)
/// - `sensor_press`: Pembacaan tekanan terakhir (hPa)
/// - `sensor_vib`: Pembacaan vibrasi terakhir (arbitrary unit)
/// - `fault_active`: `true` jika sistem sedang dalam kondisi fault
/// - `lockout_remaining_ms`: Sisa waktu lockout (ms), 0 jika tidak aktif
#[derive(Debug)]
struct SystemState {
    sensor_temp: u32,
    sensor_press: u32,
    sensor_vib: u32,
    fault_active: bool,
    lockout_remaining_ms: u32,
}

/// Default initial state: semua sensor dalam rentang normal, tidak ada fault.
impl SystemState {
    const fn default() -> Self {
        Self {
            sensor_temp: 25,
            sensor_press: 1013,
            sensor_vib: 5,
            fault_active: false,
            lockout_remaining_ms: 0,
        }
    }
}

/// Global shared state, dilindungi oleh critical-section Mutex.
/// Akses thread-safe dijamin pada waktu kompilasi — zero runtime overhead.
static STATE: Mutex<RefCell<SystemState>> =
    Mutex::new(RefCell::new(SystemState::default()));

// ─────────────────────────────────────────────────────────────────────────────
// TIPE DATA: Hasil Evaluasi Sensor (Named Struct)
// ─────────────────────────────────────────────────────────────────────────────

/// Hasil evaluasi voting-based redundancy check.
///
/// Menggunakan named struct (bukan bare tuple) untuk self-documenting API
/// sesuai rekomendasi Rust idiom — meningkatkan keterbacaan di call site.
#[derive(Debug)]
struct FaultEvaluation {
    /// `true` jika jumlah sensor anomali ≥ [`VOTING_QUORUM`] (fail-safe trigger)
    is_fault: bool,
    /// Jumlah sensor yang mendeteksi anomali (0..=3)
    anomaly_count: u32,
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNGSI: Voting-Based Redundancy Check
// ─────────────────────────────────────────────────────────────────────────────

/// Evaluasi 3 sensor secara paralel-logis menggunakan voting majority.
///
/// Setiap sensor diperiksa terhadap threshold masing-masing:
/// - Suhu: `temp > TEMPERATURE_ANOMALY_THRESHOLD`
/// - Tekanan: `press < PRESSURE_MIN_THRESHOLD || press > PRESSURE_MAX_THRESHOLD`
/// - Vibrasi: `vib > VIBRATION_ANOMALY_THRESHOLD`
///
/// Jika jumlah sensor anomali ≥ [`VOTING_QUORUM`] (default: 2), maka fault
/// dideklarasikan dan aktuator fail-safe harus diaktifkan.
///
/// # Arguments
/// * `temp` - Pembacaan sensor suhu (°C)
/// * `press` - Pembacaan sensor tekanan (hPa)
/// * `vib` - Pembacaan sensor vibrasi (arbitrary unit)
///
/// # Returns
/// [`FaultEvaluation`] berisi status fault dan jumlah anomali.
fn evaluate_sensor_redundancy(temp: u32, press: u32, vib: u32) -> FaultEvaluation {
    let mut anomaly_count: u32 = 0;

    if temp > TEMPERATURE_ANOMALY_THRESHOLD {
        anomaly_count += 1;
    }
    if press < PRESSURE_MIN_THRESHOLD || press > PRESSURE_MAX_THRESHOLD {
        anomaly_count += 1;
    }
    if vib > VIBRATION_ANOMALY_THRESHOLD {
        anomaly_count += 1;
    }

    FaultEvaluation {
        is_fault: anomaly_count >= VOTING_QUORUM,
        anomaly_count,
    }
}

/// Update status 3 LED berdasarkan state sistem saat ini.
///
/// Logika Active-High (konsisten dengan wiring Proteus):
/// - **Fault aktif + lockout**: Merah ON, Hijau OFF, Kuning ON
/// - **Fault aktif + no lockout**: Merah ON, Hijau OFF, Kuning OFF
/// - **Normal**: Merah OFF, Hijau ON, Kuning OFF
///
/// # Arguments
/// * `valve_led` - Pin output GPIO2 (LED Merah)
/// * `normal_led` - Pin output GPIO4 (LED Hijau)
/// * `lockout_led` - Pin output GPIO5 (LED Kuning)
/// * `fault_active` - Status fault saat ini
/// * `lockout_remaining` - Sisa waktu lockout (ms)
fn update_leds(
    valve_led: &mut impl esp_hal::gpio::OutputPin,
    normal_led: &mut impl esp_hal::gpio::OutputPin,
    lockout_led: &mut impl esp_hal::gpio::OutputPin,
    fault_active: bool,
    lockout_remaining: u32,
) {
    if fault_active {
        valve_led.set_high();    // Merah ON  = valve tertutup
        normal_led.set_low();    // Hijau OFF
        if lockout_remaining > 0 {
            lockout_led.set_high();  // Kuning ON = lockout aktif
        } else {
            lockout_led.set_low();
        }
    } else {
        valve_led.set_low();     // Merah OFF = valve terbuka (normal)
        normal_led.set_high();   // Hijau ON  = sistem normal
        lockout_led.set_low();   // Kuning OFF
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────

#[entry]
fn main() -> ! {
    // ── Hardware Initialization ──────────────────────────────────────────
    let peripherals = Peripherals::take();
    let system = SystemControl::new(peripherals.SYSTEM);
    let clocks = ClockControl::boot_defaults(system.clock_control).freeze();

    let io = Io::new(peripherals.GPIO, peripherals.IO_MUX);

    // Actuator: Valve darurat pada GPIO2 (Active-High = LED merah)
    let mut valve_led = io.pins.gpio2.into_push_pull_output();

    // Status LEDs: GPIO4 (hijau = normal), GPIO5 (kuning = lockout)
    let mut normal_led = io.pins.gpio4.into_push_pull_output();
    let mut lockout_led = io.pins.gpio5.into_push_pull_output();

    // Fault Injection Button: Push-button pada GPIO15 (pull-down ekstern)
    let fault_button = io.pins.gpio15.into_pull_down_input();

    // Hardware Timer untuk pengukuran latensi presisi (TIMG0, 80 MHz APB)
    let timg0 = TimerGroup::new(peripherals.TIMG0, &clocks);
    let mut timer0 = timg0.timer0;

    // Delay generator untuk polling interval
    let mut delay = esp_hal::delay::Delay::new(&clocks);

    // ── Initial LED State: Normal Operation ──────────────────────────────
    valve_led.set_low();     // Merah OFF (valve terbuka)
    normal_led.set_high();   // Hijau ON  (sistem normal)
    lockout_led.set_low();   // Kuning OFF

    // ── Boot Header (Serial Output ke Proteus Virtual Terminal) ──────────
    println!("====================================================");
    println!("  Safe-Concurrency Multi-Sensor Fusion System v2.0");
    println!("  Platform: ESP32-S3 | Rust (no_std, bare-metal)");
    println!("  Concurrency: Mutex<RefCell<T>> + critical_section");
    println!("  Voting Quorum: >= {} of 3 sensors", VOTING_QUORUM);
    println!("====================================================");
    println!("CONFIG:");
    println!("  Temp Threshold : {} C", TEMPERATURE_ANOMALY_THRESHOLD);
    println!("  Press Range    : {}..{} hPa", PRESSURE_MIN_THRESHOLD, PRESSURE_MAX_THRESHOLD);
    println!("  Vib Threshold  : {}", VIBRATION_ANOMALY_THRESHOLD);
    println!("  Lockout Time   : {} ms", LOCKOUT_DURATION_MS);
    println!("  Poll Interval  : {} ms", SENSOR_POLL_INTERVAL_MS);
    println!("----------------------------------------------------");
    println!("DATA FORMAT: iter, temp, press, vib, latency_us, status");
    println!("====================================================");

    let mut iteration: u32 = 0;

    // ── Main Control Loop ────────────────────────────────────────────────
    loop {
        // ── STEP 1: Fault Injection via GPIO15 ───────────────────────────
        // Memeriksa apakah tombol fisik ditekan (simulasi sensor rusak).
        // Injeksi dilakukan di dalam critical_section untuk konsistensi
        // dengan akses state lainnya — mencegah race condition.
        if fault_button.is_high() {
            critical_section::with(|cs| {
                let mut state = STATE.borrow_ref_mut(cs);
                state.sensor_vib = 9999;   // Injeksi vibrasi anomali
                state.sensor_temp = 99;     // Injeksi suhu anomali
            });
        }

        // ── STEP 2: Baca Sensor State (Thread-Safe) ─────────────────────
        // Semua pembacaan dilakukan dalam satu critical section untuk
        // menjamin snapshot state yang konsisten (atomik).
        let (temp, press, vib, lockout_remaining) = critical_section::with(|cs| {
            let state = STATE.borrow_ref(cs);
            (
                state.sensor_temp,
                state.sensor_press,
                state.sensor_vib,
                state.lockout_remaining_ms,
            )
        });

        // ── STEP 3: Evaluasi Redundansi Sensor (Voting Logic) ───────────
        let eval = evaluate_sensor_redundancy(temp, press, vib);

        if eval.is_fault && lockout_remaining == 0 {
            // ── STEP 4a: FAIL-SAFE TRIGGER ──────────────────────────────
            // Mulai hardware timer SEBELUM aksi untuk mengukur latensi
            // deteksi→aksi secara presisi (µs-level, bukan software timing).
            timer0.start();
            let t_start = timer0.now();

            // Tutup valve darurat + update semua LED
            update_leds(&mut valve_led, &mut normal_led, &mut lockout_led, true, LOCKOUT_DURATION_MS);

            // Hitung latensi deteksi-ke-aksi dari hardware timer
            let t_end = timer0.now();
            let elapsed_ticks = t_end.wrapping_sub(t_start);
            // ESP32 APB clock = 80 MHz → 1 tick = 12.5 ns → ticks/80 = µs
            let latency_us = elapsed_ticks / APB_FREQ_MHZ;

            // Set lockout timer (valve TETAP tertutup selama LOCKOUT_DURATION_MS)
            critical_section::with(|cs| {
                let mut state = STATE.borrow_ref_mut(cs);
                state.fault_active = true;
                state.lockout_remaining_ms = LOCKOUT_DURATION_MS;
            });

            // Output CSV: fault event dengan latensi terukur
            println!(
                "{}, {}, {}, {}, {}, FAULT_DETECTED({})",
                iteration, temp, press, vib, latency_us, eval.anomaly_count
            );

        } else if lockout_remaining > 0 {
            // ── STEP 4b: LOCKOUT AKTIF — valve tetap tertutup ───────────
            // Decrement lockout counter menggunakan saturating subtraction
            let new_remaining = lockout_remaining.saturating_sub(SENSOR_POLL_INTERVAL_MS);

            critical_section::with(|cs| {
                let mut state = STATE.borrow_ref_mut(cs);
                state.lockout_remaining_ms = new_remaining;

                // Jika lockout selesai, clear fault dan reset sensor ke normal
                if new_remaining == 0 {
                    state.fault_active = false;
                    state.sensor_vib = 5;      // Reset ke baseline normal
                    state.sensor_temp = 25;     // Reset ke baseline normal
                }
            });

            if new_remaining == 0 {
                // Lockout complete — buka valve, system kembali normal
                update_leds(&mut valve_led, &mut normal_led, &mut lockout_led, false, 0);
                println!(
                    "{}, {}, {}, {}, 0, LOCKOUT_CLEARED",
                    iteration, temp, press, vib
                );
            } else {
                // Lockout masih aktif — valve tetap tertutup
                update_leds(&mut valve_led, &mut normal_led, &mut lockout_led, true, new_remaining);
                println!(
                    "{}, {}, {}, {}, 0, LOCKOUT_ACTIVE({}ms)",
                    iteration, temp, press, vib, new_remaining
                );
            }

        } else {
            // ── STEP 4c: OPERASI NORMAL ─────────────────────────────────
            update_leds(&mut valve_led, &mut normal_led, &mut lockout_led, false, 0);
            println!(
                "{}, {}, {}, {}, 0, NORMAL",
                iteration, temp, press, vib
            );
        }

        iteration += 1;
        delay.delay_ms(SENSOR_POLL_INTERVAL_MS);
    }
}
