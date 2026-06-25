//! # Safe-Concurrency Multi-Sensor Fusion for Industrial Safety-Critical Systems
//! ============================================================================
//! **Platform**  : ESP32-S3 (Xtensa LX7, dual-core, 240 MHz), bare-metal (`no_std`)
//! **Toolchain** : Rust 2021 + `esp-hal` v1.1.1 (target: `xtensa-esp32s3-none-elf`)
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
//! ## N-Sensor Scalability (v3.0)
//!
//! - Jumlah sensor dikonfigurasi via [`N_SENSORS`]; ubah satu konstanta untuk
//!   scaling dari 3 → N sensor tanpa menyentuh logika inti.
//! - Voting quorum dihitung otomatis sebagai majority: `N_SENSORS / 2 + 1`
//! - Threshold per-sensor disimpan dalam array konstanta: [`SENSOR_LOW`],
//!   [`SENSOR_HIGH`], [`SENSOR_INITIAL`], [`SENSOR_NAMES`]
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
    main,
    gpio::{Input, InputConfig, Level, Output, OutputConfig, Pull},
    timer::timg::TimerGroup,
    delay::Delay,
    timer::Timer,
    rtc_cntl::{Rtc, sleep::TimerWakeupSource},
    Config,
};
use core::cell::RefCell;
use critical_section::Mutex;
use esp_println::{print, println};

// ─────────────────────────────────────────────────────────────────────────────
// KONFIGURASI N-SENSOR (ubah `N_SENSORS` + array dibawah untuk scaling)
// ─────────────────────────────────────────────────────────────────────────────

/// Jumlah sensor dalam array fusi.
/// Harus ≥ 3 untuk majority voting yang bermakna.
/// Voting quorum dihitung otomatis sebagai: `(N_SENSORS / 2) + 1`.
///
/// # Contoh scaling ke 5 sensor
///
/// ```ignore
/// const N_SENSORS: usize = 5;
/// const SENSOR_LOW:  [u32; 5] = [NO_THRESHOLD, 900, NO_THRESHOLD, 0,    NO_THRESHOLD];
/// const SENSOR_HIGH: [u32; 5] = [80,           1200, 500,          100,  200          ];
/// const SENSOR_INITIAL: [u32; 5] = [25, 1013, 5,  50, 100];
/// const SENSOR_NAMES: [&str; 5] = ["TEMP", "PRESS", "VIB", "HUMID", "FLOW"];
/// ```
const N_SENSORS: usize = 3;

/// Voting quorum: jumlah minimum sensor anomali untuk deklarasi fault.
/// Majority rule: ⌈N/2⌉ = floor(N/2) + 1.
const VOTING_QUORUM: u32 = (N_SENSORS as u32 / 2) + 1;

/// Sentinel value: tidak ada threshold check pada arah ini.
const NO_THRESHOLD: u32 = u32::MAX;

/// Lower anomaly threshold per sensor.
const SENSOR_LOW: [u32; N_SENSORS] = [
    NO_THRESHOLD,  // [0] TEMP  — hanya check high-bound
    900,           // [1] PRESS — anomali jika < 900 hPa
    NO_THRESHOLD,  // [2] VIB   — hanya check high-bound
];

/// Upper anomaly threshold per sensor.
const SENSOR_HIGH: [u32; N_SENSORS] = [
    80,            // [0] TEMP  — anomali jika > 80°C
    1200,          // [1] PRESS — anomali jika > 1200 hPa
    500,           // [2] VIB   — anomali jika > 500 (arb.)
];

/// Nilai baseline / initial untuk tiap sensor (operasi normal).
const SENSOR_INITIAL: [u32; N_SENSORS] = [
    25,            // [0] TEMP  — suhu ruangan
    1013,          // [1] PRESS — tekanan atmosfer standar
    5,             // [2] VIB   — vibrasi baseline
];

/// Nama sensor untuk output serial (4-5 karakter, uppercase).
const SENSOR_NAMES: [&str; N_SENSORS] = ["TEMP", "PRESS", "VIB"];

/// Durasi lockout adaptif berdasarkan severity fault (ms).
///
/// - **Minor**: quorum terpenuhi tapi masih ada sensor normal → lockout pendek
/// - **Critical**: semua N sensor anomali → lockout panjang (bahaya maksimum)
const LOCKOUT_MINOR_MS: u32 = 500;
const LOCKOUT_CRITICAL_MS: u32 = 2000;

/// Interval sampling sensor (ms).
const SENSOR_POLL_INTERVAL_MS: u32 = 500;

// ─────────────────────────────────────────────────────────────────────────────
// TIPE DATA: Fault Severity Classification
// ─────────────────────────────────────────────────────────────────────────────

/// Klasifikasi severity fault berdasarkan jumlah sensor anomali.
#[derive(Debug, PartialEq)]
enum FaultSeverity {
    /// Quorum terpenuhi, tapi masih ada sensor yang normal (redundansi tersisa).
    Minor,
    /// Semua N sensor mendeteksi anomali — tidak ada redundansi tersisa.
    Critical,
}

impl FaultSeverity {
    /// Durasi lockout (ms) yang sesuai dengan severity.
    const fn lockout_ms(&self) -> u32 {
        match self {
            FaultSeverity::Minor => LOCKOUT_MINOR_MS,
            FaultSeverity::Critical => LOCKOUT_CRITICAL_MS,
        }
    }

    /// Label untuk output serial.
    const fn label(&self) -> &str {
        match self {
            FaultSeverity::Minor => "MINOR",
            FaultSeverity::Critical => "CRITICAL",
        }
    }
}

/// Klasifikasi severity berdasarkan jumlah anomali vs N_SENSORS.
fn classify_severity(anomaly_count: u32) -> FaultSeverity {
    if anomaly_count >= N_SENSORS as u32 {
        FaultSeverity::Critical
    } else {
        FaultSeverity::Minor
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED STATE (Thread-Safe via Mutex<RefCell<T>>)
// ─────────────────────────────────────────────────────────────────────────────

/// Representasi state sistem yang di-share antar konteks eksekusi.
///
/// Dilindungi oleh [`critical_section::Mutex`] untuk mencegah data-race.
///
/// # Fields
/// - `sensor_values`: Array nilai sensor terbaru, indeks sesuai [`SENSOR_NAMES`]
/// - `fault_active`: `true` jika sistem sedang dalam kondisi fault
/// - `lockout_remaining_ms`: Sisa waktu lockout (ms), 0 jika tidak aktif
#[derive(Debug)]
struct SystemState {
    sensor_values: [u32; N_SENSORS],
    fault_active: bool,
    lockout_remaining_ms: u32,
}

impl SystemState {
    const fn default() -> Self {
        Self {
            sensor_values: SENSOR_INITIAL,
            fault_active: false,
            lockout_remaining_ms: 0,
        }
    }
}

/// Global shared state, dilindungi oleh critical-section Mutex.
static STATE: Mutex<RefCell<SystemState>> =
    Mutex::new(RefCell::new(SystemState::default()));

// ─────────────────────────────────────────────────────────────────────────────
// TIPE DATA: Hasil Evaluasi Sensor (Named Struct)
// ─────────────────────────────────────────────────────────────────────────────

/// Hasil evaluasi N-sensor voting-based redundancy check.
#[derive(Debug)]
struct FaultEvaluation {
    is_fault: bool,
    anomaly_count: u32,
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNGSI: N-Sensor Voting-Based Redundancy Check
// ─────────────────────────────────────────────────────────────────────────────

/// Evaluasi N sensor secara paralel-logis menggunakan voting majority.
///
/// Setiap sensor `i` diperiksa terhadap threshold:
/// - Anomali jika `value < SENSOR_LOW[i]` DAN `SENSOR_LOW[i] != NO_THRESHOLD`
/// - Anomali jika `value > SENSOR_HIGH[i]` DAN `SENSOR_HIGH[i] != NO_THRESHOLD`
fn evaluate_sensor_redundancy(values: &[u32; N_SENSORS]) -> FaultEvaluation {
    let mut anomaly_count: u32 = 0;

    for i in 0..N_SENSORS {
        let val = values[i];
        let lo = SENSOR_LOW[i];
        let hi = SENSOR_HIGH[i];

        let is_anomaly = (lo != NO_THRESHOLD && val < lo)
                      || (hi != NO_THRESHOLD && val > hi);

        if is_anomaly {
            anomaly_count += 1;
        }
    }

    FaultEvaluation {
        is_fault: anomaly_count >= VOTING_QUORUM,
        anomaly_count,
    }
}

/// Update status 3 LED berdasarkan state sistem saat ini.
///
/// Logika Active-High:
/// - **Fault + lockout**: Merah ON, Hijau OFF, Kuning ON
/// - **Fault + no lockout**: Merah ON, Hijau OFF, Kuning OFF
/// - **Normal**: Merah OFF, Hijau ON, Kuning OFF
fn update_leds(
    valve_led: &mut Output<'_>,
    normal_led: &mut Output<'_>,
    lockout_led: &mut Output<'_>,
    fault_active: bool,
    lockout_remaining: u32,
) {
    if fault_active {
        valve_led.set_high();     // Merah ON  = valve tertutup
        normal_led.set_low();     // Hijau OFF
        if lockout_remaining > 0 {
            lockout_led.set_high();   // Kuning ON = lockout
        } else {
            lockout_led.set_low();
        }
    } else {
        valve_led.set_low();      // Merah OFF = normal
        normal_led.set_high();    // Hijau ON  = normal
        lockout_led.set_low();    // Kuning OFF
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS: Serial Output Formatting (N-Scalable)
// ─────────────────────────────────────────────────────────────────────────────

/// Print CSV header.
fn print_csv_header() {
    print!("iter");
    for i in 0..N_SENSORS {
        print!(", {}", SENSOR_NAMES[i]);
    }
    println!(", latency_us, status");
}

/// Print CSV data row.
fn print_data_row(iteration: u32, values: &[u32; N_SENSORS], latency_us: u64, status: &str) {
    print!("{}", iteration);
    for i in 0..N_SENSORS {
        print!(", {}", values[i]);
    }
    println!(", {}, {}", latency_us, status);
}

/// Print sensor threshold configuration.
fn print_sensor_config() {
    for i in 0..N_SENSORS {
        let lo = SENSOR_LOW[i];
        let hi = SENSOR_HIGH[i];

        if lo == NO_THRESHOLD && hi == NO_THRESHOLD {
            println!("  [{}] {}: no threshold check", i, SENSOR_NAMES[i]);
        } else if lo == NO_THRESHOLD {
            println!("  [{}] {}: > {} → anomaly", i, SENSOR_NAMES[i], hi);
        } else if hi == NO_THRESHOLD {
            println!("  [{}] {}: < {} → anomaly", i, SENSOR_NAMES[i], lo);
        } else {
            println!("  [{}] {}: < {} or > {} → anomaly", i, SENSOR_NAMES[i], lo, hi);
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────

#[main]
fn main() -> ! {
    // ── Hardware Initialization (esp-hal v1.x) ───────────────────────────
    let peripherals = esp_hal::init(Config::default());

    // Actuator: Valve darurat pada GPIO2 (Active-High = LED merah)
    let mut valve_led = Output::new(peripherals.GPIO2, Level::Low, OutputConfig::default());

    // Status LEDs: GPIO4 (hijau = normal), GPIO5 (kuning = lockout)
    let mut normal_led = Output::new(peripherals.GPIO4, Level::High, OutputConfig::default());
    let mut lockout_led = Output::new(peripherals.GPIO5, Level::Low, OutputConfig::default());

    // Fault Injection Button: Push-button pada GPIO15 (pull-down ekstern)
    let fault_button = Input::new(
        peripherals.GPIO15,
        InputConfig::default().with_pull(Pull::Down),
    );

    // Hardware Timer untuk pengukuran latensi presisi (TIMG0, 80 MHz APB)
    let timg0 = TimerGroup::new(peripherals.TIMG0);
    let timer0 = timg0.timer0;

    // Delay generator untuk polling interval
    let delay = Delay::new();

    // RTC controller untuk power management (light sleep saat idle)
    let mut rtc = Rtc::new(peripherals.LPWR);
    let mut idle_cycles: u32 = 0;
    const IDLE_SLEEP_THRESHOLD: u32 = 3;  // Sleep after 3 idle cycles

    // ── Boot Header ──────────────────────────────────────────────────────
    println!("====================================================");
    println!("  Safe-Concurrency Multi-Sensor Fusion System");
    println!("  Platform: ESP32-S3 | Rust (no_std, bare-metal)");
    println!("  Framework: esp-hal v1.1.1");
    println!("  Concurrency: Mutex<RefCell<T>> + critical_section");
    println!("  Scalability: N-sensor voting (N = {})", N_SENSORS);
    println!("  Voting Quorum: >= {} of {} (majority)", VOTING_QUORUM, N_SENSORS);
    println!("  Lockout       : Adaptive (Minor={}ms, Critical={}ms)", LOCKOUT_MINOR_MS, LOCKOUT_CRITICAL_MS);
    println!("  Power Mgmt    : Light sleep after {} idle cycles", IDLE_SLEEP_THRESHOLD);
    println!("====================================================");
    println!("CONFIG:");
    println!("  Poll Interval  : {} ms", SENSOR_POLL_INTERVAL_MS);
    println!("  Sensor Thresholds:");
    print_sensor_config();
    println!("----------------------------------------------------");
    print_csv_header();
    println!("====================================================");

    // ── Event-Triggered State Tracking ────────────────────────────────────
    #[derive(Debug, PartialEq)]
    enum SystemStatus {
        Normal,
        Fault,
        Lockout,
    }

    let mut prev_status = SystemStatus::Normal;
    let mut iteration: u32 = 0;

    // ── Main Event-Triggered Control Loop ─────────────────────────────────
    loop {
        // ── STEP 1: Detect Input Change (Event Trigger) ──────────────────
        let button_pressed = fault_button.is_high();

        if button_pressed {
            critical_section::with(|cs| {
                let mut state = STATE.borrow_ref_mut(cs);
                state.sensor_values[0] = 99;     // Suhu anomali
                state.sensor_values[2] = 9999;   // Vibrasi anomali
            });
        }

        // ── STEP 2: Read State ───────────────────────────────────────────
        let (sensor_values, lockout_remaining) = critical_section::with(|cs| {
            let state = STATE.borrow_ref(cs);
            (state.sensor_values, state.lockout_remaining_ms)
        });

        let current_status = if lockout_remaining > 0 {
            SystemStatus::Lockout
        } else {
            SystemStatus::Normal
        };

        // ── STEP 3: Event-Driven Evaluation ──────────────────────────────
        let transition = current_status != prev_status || button_pressed;

        if transition || lockout_remaining > 0 {
            idle_cycles = 0;  // Reset sleep counter on activity
            let eval = evaluate_sensor_redundancy(&sensor_values);

            if eval.is_fault && lockout_remaining == 0 {
                // ── FAULT TRIGGER (Adaptive Lockout) ──────────────────────
                let severity = classify_severity(eval.anomaly_count);
                let lockout_ms = severity.lockout_ms();

                let t_start = timer0.now();
                update_leds(&mut valve_led, &mut normal_led, &mut lockout_led, true, lockout_ms);
                let latency_us = t_start.elapsed().as_micros();

                critical_section::with(|cs| {
                    let mut state = STATE.borrow_ref_mut(cs);
                    state.fault_active = true;
                    state.lockout_remaining_ms = lockout_ms;
                });

                print!("{}", iteration);
                for i in 0..N_SENSORS {
                    print!(", {}", sensor_values[i]);
                }
                println!(
                    ", {}, FAULT_DETECTED({},{}/{})",
                    latency_us, severity.label(), eval.anomaly_count, N_SENSORS
                );
                prev_status = SystemStatus::Fault;

            } else if lockout_remaining > 0 {
                // ── LOCKOUT COUNTDOWN ─────────────────────────────────────
                let new_remaining = lockout_remaining.saturating_sub(SENSOR_POLL_INTERVAL_MS);

                critical_section::with(|cs| {
                    let mut state = STATE.borrow_ref_mut(cs);
                    state.lockout_remaining_ms = new_remaining;
                    if new_remaining == 0 {
                        state.fault_active = false;
                        state.sensor_values = SENSOR_INITIAL;
                    }
                });

                if new_remaining == 0 {
                    update_leds(&mut valve_led, &mut normal_led, &mut lockout_led, false, 0);
                    print_data_row(iteration, &sensor_values, 0, "LOCKOUT_CLEARED");
                    prev_status = SystemStatus::Normal;
                } else {
                    update_leds(&mut valve_led, &mut normal_led, &mut lockout_led, true, new_remaining);
                    if transition {
                        print!("{}", iteration);
                        for i in 0..N_SENSORS {
                            print!(", {}", sensor_values[i]);
                        }
                        println!(", 0, LOCKOUT_ACTIVE({}ms)", new_remaining);
                    }
                    prev_status = SystemStatus::Lockout;
                }

            } else {
                // ── NORMAL (transition from non-normal → normal) ──────────
                update_leds(&mut valve_led, &mut normal_led, &mut lockout_led, false, 0);
                if transition {
                    print_data_row(iteration, &sensor_values, 0, "NORMAL (event-triggered)");
                }
                prev_status = SystemStatus::Normal;
            }
        } else {
            // ── IDLE: No event, no transition ────────────────────────────
            idle_cycles += 1;

            if idle_cycles >= IDLE_SLEEP_THRESHOLD {
                // Enter light sleep — wake via RTC timer in ~450ms
                let wake_timer = TimerWakeupSource::new(
                    core::time::Duration::from_micros((SENSOR_POLL_INTERVAL_MS - 50) as u64 * 1000)
                );
                println!(". SLEEP {}", iteration);
                rtc.sleep_light(&[&wake_timer]);
                // Resumes here after wake — reset idle counter
                idle_cycles = 0;
            } else if iteration % 10 == 0 {
                println!(". {}", iteration);
            }
        }

        iteration += 1;
        delay.delay_millis(SENSOR_POLL_INTERVAL_MS);
    }
}
