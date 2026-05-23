# Panduan Wiring Proteus — Safe-Concurrency Multi-Sensor Fusion

> **Status:** 25 Mei 2026 — Ditulis ulang. Akurat 100% sesuai kode `.ino` dan schematic ESP32-S3 Proteus.
> **Proteus:** 8.17+ (ESP32-S3 built-in di kategori MicroPython)

---

## 0. Sebelum Mulai — Baca Ini

1. **ESP32-S3 di Proteus cuma punya 48 pin:** `RST` + `GPIO0`–`GPIO21` + `GPIO26`–`GPIO48`.
2. **Tidak ada pin VIN, GND, atau 3V3** di symbol. Power IC di-handle otomatis oleh Proteus.
3. **Semua LED pakai logika ACTIVE-HIGH.** GPIO = HIGH → LED nyala. Ini konsisten dengan kode.

---

## 1. Daftar Komponen (8 items)

| # | Nama Proteus | Kategori | Qty | Keterangan |
|---|-------------|----------|-----|------------|
| 1 | `ESP32-S3` | MicroPython | 1 | Cari di Pick Devices (P) |
| 2 | `LED-RED` | Optoelectronics | 1 | Indikator fault / valve tertutup |
| 3 | `LED-GREEN` | Optoelectronics | 1 | Indikator sistem normal |
| 4 | `LED-YELLOW` | Optoelectronics | 1 | Indikator lockout |
| 5 | `RES` (220Ω) | Resistors | 3 | Current limiter LED |
| 6 | `RES` (10kΩ) | Resistors | 1 | Pull-down tombol |
| 7 | `BUTTON` | Switches & Relays | 1 | Fault injection trigger |
| 8 | `VIRTUAL TERMINAL` | Virtual Instruments | 1 | Monitor serial (115200 baud) |

---

## 2. Pin Map ESP32-S3

**Ini bukan ASCII art — ini persis tampilan pin di schematic Proteus:**

```
    KIRI (23 pin)         KANAN (23 pin)
   ┌──────────────────────────────────────┐
   │  RST     (pin 1)       GPIO48 (pin 48) │
   │  GPIO0   (pin 2)       GPIO47 (pin 47) │
   │  GPIO1   (pin 3)       GPIO46 (pin 46) │
   │  GPIO2   (pin 4)       GPIO45 (pin 45) │
   │  GPIO3   (pin 5)       GPIO44 (pin 44) │
   │  GPIO4   (pin 6)       GPIO43 (pin 43) │
   │  GPIO5   (pin 7)       GPIO42 (pin 42) │
   │  GPIO6   (pin 8)       GPIO41 (pin 41) │
   │  GPIO7   (pin 9)       GPIO40 (pin 40) │
   │  GPIO8   (pin 10)      GPIO39 (pin 39) │
   │  GPIO9   (pin 11)      GPIO38 (pin 38) │
   │  GPIO10  (pin 12)      GPIO37 (pin 37) │
   │  GPIO11  (pin 13)      GPIO36 (pin 36) │
   │  GPIO12  (pin 14)      GPIO35 (pin 35) │
   │  GPIO13  (pin 15)      GPIO34 (pin 34) │
   │  GPIO14  (pin 16)      GPIO33 (pin 33) │
   │  GPIO15  (pin 17)  ←→  GPIO32 (pin 32) │
   │  GPIO16  (pin 18)      GPIO31 (pin 31) │
   │  GPIO17  (pin 19)      GPIO30 (pin 30) │
   │  GPIO18  (pin 20)      GPIO29 (pin 29) │
   │  GPIO19  (pin 21)      GPIO28 (pin 28) │
   │  GPIO20  (pin 22)      GPIO27 (pin 27) │
   │  GPIO21  (pin 23)      GPIO26 (pin 26) │
   └──────────────────────────────────────┘
              ESP32-S3
```

**Pin yang dipakai (hanya 5 pin):**
- **GPIO1**  → pin 3 kiri  = TX0 (Serial TX)
- **GPIO2**  → pin 4 kiri  = LED Merah
- **GPIO4**  → pin 6 kiri  = LED Hijau
- **GPIO5**  → pin 7 kiri  = LED Kuning
- **GPIO15** → pin 17 kiri = Tombol fault

---

## 3. Wiring — Langkah Demi Langkah

### Wiring 1: LED Merah (Fault Indicator) — GPIO2

```
           GPIO2 (pin 4 kiri ESP32)
              │
          [220Ω]  R_merah
              │
          LED-RED
          (anode ke resistor)
              │
          (katode ke GND)
              │
           === GND
```

**Cek:** GPIO2 → resistor 220Ω → anode LED-RED → katode LED-RED → GND.  
**Logika:** `digitalWrite(2, HIGH)` = LED nyala (fault). `LOW` = LED mati (normal).

---

### Wiring 2: LED Hijau (System Normal) — GPIO4

```
           GPIO4 (pin 6 kiri ESP32)
              │
          [220Ω]  R_hijau
              │
          LED-GREEN
          (anode ke resistor)
              │
          (katode ke GND)
              │
           === GND
```

**Cek:** GPIO4 → resistor 220Ω → anode LED-GREEN → katode LED-GREEN → GND.  
**Logika:** `digitalWrite(4, HIGH)` = LED nyala (normal). `LOW` = LED mati (fault/lockout).

---

### Wiring 3: LED Kuning (Lockout Indicator) — GPIO5

```
           GPIO5 (pin 7 kiri ESP32)
              │
          [220Ω]  R_kuning
              │
          LED-YELLOW
          (anode ke resistor)
              │
          (katode ke GND)
              │
           === GND
```

**Cek:** GPIO5 → resistor 220Ω → anode LED-YELLOW → katode LED-YELLOW → GND.  
**Logika:** `digitalWrite(5, HIGH)` = LED nyala (lockout). `LOW` = LED mati.

---

### Wiring 4: Tombol Fault Injection — GPIO15

```
          +3.3V  (Power Rail — bukan pin ESP32!)
              │
          [BUTTON]
              │
              ├──── GPIO15 (pin 17 kiri ESP32)
              │
          [10kΩ]  R_pulldown
              │
           === GND
```

**Cek:** +3.3V → BUTTON → (node percabangan) → GPIO15 + resistor 10kΩ → GND.  
**Logika:** Tombol TIDAK ditekan → GPIO15 = LOW (ditarik ke GND via 10kΩ).  
Tombol DITEKAN → GPIO15 = HIGH (+3.3V langsung ke pin).  
Kode: `digitalRead(15) == HIGH` = fault injection.

---

### Wiring 5: Virtual Terminal — GPIO1 (TX0)

```
  ESP32 GPIO1 (pin 3 kiri) ──────── RXD (pin input Virtual Terminal)
  
  === GND (Power Rail)    ──────── GND (Virtual Terminal)
```

**Konfigurasi Virtual Terminal (double-click komponen):**
- Baud Rate: **115200**
- Data Bits: 8
- Parity: None
- Stop Bits: 1
- Flow Control: None

**Cek:** GPIO1 ESP32 → pin RX Virtual Terminal. Hanya 1 kabel data. GND opsional.

---

## 4. Verifikasi Lengkap (Checklist Sebelum Simulasi)

Centang semua sebelum klik Play:

```
☐ 1. ESP32-S3 muncul di schematic
☐ 2. GPIO2 → 220Ω → LED-RED (anode) → LED-RED (katode) → GND
☐ 3. GPIO4 → 220Ω → LED-GREEN (anode) → LED-GREEN (katode) → GND
☐ 4. GPIO5 → 220Ω → LED-YELLOW (anode) → LED-YELLOW (katode) → GND
☐ 5. +3.3V → BUTTON → (GPIO15 + 10kΩ → GND)
☐ 6. GPIO1 → Virtual Terminal RXD
☐ 7. Virtual Terminal baud rate = 115200
☐ 8. File .hex sudah di-load ke properti ESP32-S3
```

---

## 5. Diagram Wiring Lengkap

```
                      ┌──────────────────────────────────┐
                      │ ESP32-S3                          │
                      │                                    │
                      │  RST                           GP48│
                      │  GPIO0                         GP47│
VTX RXD ──────────────┤  GPIO1 (TX0)                   GP46│
                      │  GPIO2 ──[220Ω]──LED-RED──GND  GP45│
                      │  GPIO3                         GP44│
                      │  GPIO4 ──[220Ω]──LED-GRN──GND  GP43│
                      │  GPIO5 ──[220Ω]──LED-YLW──GND  GP42│
                      │  GPIO6                         GP41│
                      │  GPIO7                         GP40│
                      │  GPIO8                         GP39│
                      │  GPIO9                         GP38│
                      │  GPIO10                        GP37│
                      │  GPIO11                        GP36│
                      │  GPIO12                        GP35│
                      │  GPIO13                        GP34│
                      │  GPIO14                        GP33│
     +3.3V ──[BUTTON]──┤  GPIO15                        GP32│
                │       │  GPIO16                        GP31│
              [10kΩ]    │  GPIO17                        GP30│
                │       │  GPIO18                        GP29│
               GND      │  GPIO19                        GP28│
                      │  GPIO20                        GP27│
                      │  GPIO21                        GPIO26│
                      │                                    │
                      └──────────────────────────────────┘

   * Power IC otomatis dari Proteus. GND untuk LED & resistor dari Power Rail.*
```

---

## 6. Ekspektasi Output Serial

Setelah Play, Virtual Terminal akan menampilkan:

```
====================================================
  Safe-Concurrency Multi-Sensor Fusion System v2.0
  Platform: ESP32-S3 | Arduino C++ (Proteus Sim)
  Logic: Voting-Based Redundancy (>=2 sensors)
====================================================
CONFIG:
  Vib Threshold  : 500
  Temp Threshold : 80 C
  Lockout Time   : 2000 ms
  Poll Interval  : 500 ms
----------------------------------------------------
DATA FORMAT: iter, temp, press, vib, latency_us, status
====================================================
0 25 1013 5 0 0  # NORMAL
1 25 1013 5 0 0  # NORMAL
...
```

**Saat tombol DITEKAN:**
```
X 99 1013 9999 0 1  # FAULT_DETECTED (anomalies=2)
```
- LED Merah nyala, LED Hijau mati, LED Kuning nyala
- Setelah 2 detik → LED Kuning mati, LED Hijau nyala kembali

---

## 7. Troubleshooting

| Masalah | Solusi |
|---------|--------|
| ESP32-S3 tidak muncul | Pick Devices → cari `ESP32-S3` (kategori MicroPython), bukan ESP32 biasa |
| LED tidak menyala | Cek: anode ke resistor, katode ke GND. Bukan terbalik. |
| Tombol tidak merespon | Cek: BUTTON antara +3.3V dan GPIO15, lalu 10kΩ dari GPIO15 ke GND |
| Virtual Terminal kosong | Cek: baud rate 115200, kabel ke GPIO1 (bukan GPIO3/RXD) |
| Simulasi lambat | System → Set Simulation Speed → Maximum |
