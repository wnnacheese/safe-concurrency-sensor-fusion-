# Mekanisme Simulasi & Parameter Input

> Safe-Concurrency Multi-Sensor Fusion — Proteus ESP32-S3 MicroPython VSM

---

## 1. BIG PICTURE: Apa yang Terjadi Saat Simulasi?

```
┌─────────────────────────────────────────────────────────────────┐
│                        ALUR SIMULASI                             │
│                                                                  │
│  [Tombol Ditekan] ──→ [Sensor Diinjeksi] ──→ [Voting 2/3]       │
│                                                   │              │
│                                          ≥2 anomali?             │
│                                        ┌──────┴──────┐          │
│                                        │             │          │
│                                       YA           TIDAK        │
│                                        │             │          │
│                                  [FAULT]         [NORMAL]       │
│                                     │                            │
│                              Cek durasi tekan                    │
│                            ┌────────┴────────┐                  │
│                            │                 │                  │
│                         <5 detik          ≥5 detik               │
│                            │                 │                  │
│                         MINOR             CRITICAL              │
│                      2 sensor anomali   3 sensor anomali         │
│                      lockout 500ms      lockout 2000ms           │
│                            │                 │                  │
│                            └────────┬────────┘                  │
│                                     │                            │
│                              [LOCKOUT]                           │
│                           LED Merah ON                           │
│                          LED Kuning ON                           │
│                          LED Hijau OFF                           │
│                                     │                            │
│                           Countdown selesai                      │
│                                     │                            │
│                              [CLEARED]                           │
│                           LED Merah OFF                          │
│                          LED Kuning OFF                          │
│                           LED Hijau ON                           │
│                          Sensor di-reset                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. PARAMETER INPUT — Semua Angka yang Masuk ke Sistem

### 2.1 Threshold (Ambang Batas Anomali)

| Sensor | Threshold | Kondisi Anomali |
|--------|-----------|-----------------|
| Suhu (Temperature) | 80°C | nilai > 80°C |
| Tekanan (Pressure) | 900–1200 hPa | nilai < 900 ATAU > 1200 |
| Vibrasi (Vibration) | 500 | nilai > 500 |

> **Quorum:** ≥2 dari 3 sensor harus anomali untuk mendeklarasikan fault.

### 2.2 Nilai Sensor — Normal vs Injeksi

| Sensor | Nilai Normal | Injeksi MINOR (klik <5s) | Injeksi CRITICAL (tahan ≥5s) |
|--------|-------------|--------------------------|------------------------------|
| Suhu | 25°C | **99°C** (melebihi threshold) | **99°C** (melebihi threshold) |
| Tekanan | 1013 hPa | 1013 hPa (tetap normal) | **0 hPa** (di luar range) |
| Vibrasi | 5 | **9999** (melebihi threshold) | **9999** (melebihi threshold) |
| **Sensor anomali** | 0/3 | **2/3** (suhu + vibrasi) | **3/3** (semua sensor) |

> **Kenapa tekanan 1013 hPa normal tapi 0 hPa anomali?**
> Range normal tekanan adalah 900–1200 hPa (tekanan atmosfer standar ± variasi).
> Nilai 0 hPa mensimulasikan kegagalan total sensor tekanan (kabel putus, dsb).

### 2.3 Durasi Lockout (Adaptive)

| Severity | Durasi | Iterasi (@100ms) | LED yang Menyala |
|----------|--------|-------------------|------------------|
| MINOR (2/3) | **500 ms** | 5 iterasi | Merah + Kuning |
| CRITICAL (3/3) | **2000 ms** | 20 iterasi | Merah + Kuning |

> **Kenapa adaptive?** Minor = masih ada redundansi (1 sensor normal), jadi lockout lebih singkat.
> Critical = semua sensor rusak, butuh waktu lebih lama untuk memastikan keamanan.

### 2.4 Parameter Timing

| Parameter | Nilai | Keterangan |
|-----------|-------|------------|
| Poll Interval | **100 ms** | Kecepatan pembacaan sensor & tombol |
| Hold Threshold | **5 detik** (50 siklus) | Batas klik singkat vs tahan lama |
| Startup Grace | **4 siklus** (~400ms) | Abaikan tombol saat startup |

---

## 3. MEKANISME HOLD-DURATION — Bagaimana Sistem Bedakan Klik vs Tahan?

```
Tombol Ditekan
      │
      ▼
┌─────────────┐
│ hold_count++ │   ← Setiap 100ms, counter naik 1
│ latch = TRUE │   ← Sticky latch: sekali HIGH tetap TRUE
└─────────────┘
      │
      ▼
┌─────────────────┐
│ hold_count < 50? │
└────┬────────┬────┘
     │        │
    YA      TIDAK (≥50 = 5 detik)
     │        │
     ▼        ▼
  MINOR    CRITICAL
 (2/3)     (3/3)
  │         │
  │    sensor_press = 0  ← Tekanan diinjeksi
  │                        (jadi 3 sensor anomali)
  ▼
sensor_temp = 99
sensor_vib  = 9999
(sensor_press tetap 1013)
```

> **Sticky Latch:** Begitu tombol pernah HIGH, latch tetap TRUE meskipun tombol
> dilepas. Ini mengatasi masalah timing di Proteus di mana klik mouse cuma
> beberapa milidetik tapi polling tiap 100ms. Latch hanya di-reset saat fault
> terdeteksi atau lockout selesai.

### Timeline Contoh

```
Waktu (detik)  0    0.5   1.0   1.5   2.0   ...   5.0   5.5   7.0
               ├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
Tombol         ████████████████████████████████████████████████████  (ditahan)
               │
hold_count     1     5    10    15    20    ...   50    55    70
               │                                   │
               │                                   ▼
               │                            CRITICAL TRIGGER
               │                            press=0, lockout 2000ms
               ▼
          MINOR TRIGGER
          press=1013, lockout 500ms → clear → MINOR lagi → ... → CRITICAL
```

---

## 4. ALUR DATA — Dari Tombol ke CSV Output

```
┌──────────┐    ┌──────────────┐    ┌───────────┐    ┌──────────┐
│  BUTTON   │───→│  SENSOR      │───→│  VOTING   │───→│  FAULT   │
│  GPIO15   │    │  INJECTION   │    │  ≥2/3?    │    │  DECISION │
└──────────┘    └──────────────┘    └───────────┘    └──────────┘
     │                │                   │                │
     │         temp=99, vib=9999    2 dari 3 anomali    MINOR/CRITICAL
     │         (press=0 if ≥5s)          │                │
     │                                    │                ▼
     │                                    │         ┌──────────┐
     │                                    │         │ LOCKOUT  │
     │                                    │         │ COUNTDOWN│
     │                                    │         └──────────┘
     │                                    │                │
     ▼                                    ▼                ▼
┌──────────────────────────────────────────────────────────────┐
│                      CSV OUTPUT (debug console)               │
│                                                               │
│  4  99  1013  9999  45  FAULT_DETECTED(MINOR,2/3)            │
│  5  99  1013  9999  0   LOCKOUT_ACTIVE(400ms)                 │
│  6  99  1013  9999  0   LOCKOUT_ACTIVE(300ms)                 │
│  7  99  1013  9999  0   LOCKOUT_ACTIVE(200ms)                 │
│  8  99  1013  9999  0   LOCKOUT_ACTIVE(100ms)                 │
│  9  99  1013  9999  0   LOCKOUT_CLEARED                       │
│  ↑    ↑    ↑     ↑    ↑     ↑                                │
│ iter temp press vib  lat   status                             │
└──────────────────────────────────────────────────────────────┘
```

**Format CSV:** `iterasi suhu tekanan vibrasi latensi(µs) status`

---

## 5. BUKTI ADAPTIVE LOCKOUT — Perbandingan MINOR vs CRITICAL

| Parameter | MINOR | CRITICAL |
|-----------|-------|----------|
| **Trigger** | Klik <5 detik | Tahan ≥5 detik |
| **Sensor anomali** | Suhu + Vibrasi (2/3) | Suhu + Vibrasi + Tekanan (3/3) |
| **Tekanan** | 1013 hPa (normal) | 0 hPa (anomali) |
| **Lockout** | 500 ms | 2000 ms |
| **Iterasi lockout** | 5 iterasi | 20 iterasi |
| **LED** | Merah ON + Kuning ON | Merah ON + Kuning ON |
| **Output khas** | `FAULT_DETECTED(MINOR,2/3)` | `FAULT_DETECTED(CRITICAL,3/3)` |

### Data Asli dari Simulasi

**MINOR (klik singkat):**
```
iter 4:  99 1013 9999 45 FAULT_DETECTED(MINOR,2/3)     ← fault
iter 5:  99 1013 9999 0  LOCKOUT_ACTIVE(400ms)          ← lockout
iter 6:  99 1013 9999 0  LOCKOUT_ACTIVE(300ms)
iter 7:  99 1013 9999 0  LOCKOUT_ACTIVE(200ms)
iter 8:  99 1013 9999 0  LOCKOUT_ACTIVE(100ms)
iter 9:  99 1013 9999 0  LOCKOUT_CLEARED                ← 500ms = 5 iterasi ✓
```

**CRITICAL (tahan ≥5 detik):**
```
iter 107: 99 0 9999 45 FAULT_DETECTED(CRITICAL,3/3)    ← fault
iter 108: 99 0 9999 0  LOCKOUT_ACTIVE(1900ms)           ← lockout
iter 109: 99 0 9999 0  LOCKOUT_ACTIVE(1800ms)
iter 110: 99 0 9999 0  LOCKOUT_ACTIVE(1700ms)
...
iter 126: 99 0 9999 0  LOCKOUT_ACTIVE(100ms)
iter 127: 99 0 9999 0  LOCKOUT_CLEARED                  ← 2000ms = 20 iterasi ✓
```

---

## 6. RINGKASAN — Jawaban untuk Pertanyaan Dosen

| Pertanyaan | Jawaban |
|------------|---------|
| **Bagaimana sistem tahu ada fault?** | Voting: ≥2 dari 3 sensor melebihi threshold |
| **Threshold-nya berapa?** | Suhu>80°C, Tekanan<900 atau >1200 hPa, Vibrasi>500 |
| **Kenapa 2/3 bukan 1/3?** | Hindari false positive — 1 sensor rusak masih ditoleransi |
| **Apa beda MINOR vs CRITICAL?** | MINOR = 2 sensor anomali (500ms), CRITICAL = 3 sensor (2000ms) |
| **Bagaimana sistem membedakan?** | Durasi tekan tombol: <5 detik = MINOR, ≥5 detik = CRITICAL |
| **Kenapa pakai lockout?** | Cegah valve bounce — osilasi buka/tutup yang berbahaya |
| **Darimana data input simulasi?** | Tombol GPIO15 → injeksi nilai sensor di kode MicroPython |
| **Apa buktinya genuine?** | Semua data dari output debug console Proteus, tanpa modifikasi |
