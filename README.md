# 🛡️ Safe-Concurrency for Multi-Sensor Fusion in Industrial Safety-Critical Systems

[![Rust](https://img.shields.io/badge/Rust-no__std-orange?logo=rust)](https://www.rust-lang.org/)
[![ESP32-S3](https://img.shields.io/badge/MCU-ESP32--S3-blue?logo=espressif)](https://www.espressif.com/en/products/socs/esp32-s3)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Proteus](https://img.shields.io/badge/Simulation-Proteus%209-purple)](https://www.labcenter.com/)

> **Voting-based multi-sensor fusion** with **Rust safe-concurrency** on bare-metal ESP32-S3.  
> Zero `unsafe` code. Zero data races. Hardware-timed fail-safe actuator with lockout mechanism.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Technical Highlights](#-technical-highlights)
- [Hardware Wiring](#-hardware-wiring)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Simulation Results](#-simulation-results)
- [Method Advantages](#-method-advantages)
- [References](#-references)

---

## 🔍 Overview

Industrial safety-critical systems demand **deterministic**, **fault-tolerant**, and **memory-safe** embedded software. This project implements a **voting-based multi-sensor fusion system** using Rust's ownership model and `critical_section` concurrency primitives on a bare-metal ESP32-S3 (Xtensa LX7, dual-core, 240 MHz).

The system reads three sensors (temperature, pressure, vibration), evaluates them through a **2-of-3 voting redundancy** algorithm, and triggers a fail-safe valve actuator with a **timed lockout mechanism** to prevent dangerous valve bounce.

### Key Innovation
> No existing research combines: **(a)** Rust bare-metal on ESP32-S3, **(b)** `Mutex<RefCell<T>>` + `critical_section` for concurrency, **(c)** voting-based sensor fusion, and **(d)** hardware-timed fail-safe with lockout — in a single integrated system.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ESP32-S3 (Rust no_std)                    │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ Temp (°C)│  │Press(hPa)│  │ Vib(arb) │  ← 3 Sensors     │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                  │
│       │              │              │                        │
│       └──────────────┼──────────────┘                        │
│                      ▼                                       │
│         ┌────────────────────────┐                           │
│         │  Voting Redundancy     │                           │
│         │  (≥2 anomalies = FAULT)│                           │
│         └───────────┬────────────┘                           │
│                     ▼                                        │
│  ┌──────────────────────────────────────┐                    │
│  │  Mutex<RefCell<SystemState>>         │  ← Thread-Safe     │
│  │  via critical_section::with()       │     Shared State    │
│  └──────────────────┬───────────────────┘                    │
│                     ▼                                        │
│         ┌────────────────────────┐                           │
│         │  Fail-Safe Actuator    │                           │
│         │  + Lockout (2000ms)    │  → GPIO2 (Valve LED)      │
│         └────────────────────────┘    GPIO4 (Normal LED)     │
│                                       GPIO5 (Lockout LED)    │
│                                                             │
│  TIMG0 (80MHz APB) → µs-precision latency measurement       │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚡ Technical Highlights

| Feature | Implementation |
|:--------|:--------------|
| **Language** | Rust 2021 (`no_std`, `no_main`) — zero `unsafe` blocks |
| **Concurrency** | `Mutex<RefCell<T>>` + `critical_section` — compile-time data-race freedom |
| **Sensor Fusion** | 3-sensor voting redundancy (≥2 anomalies = fault trigger) |
| **Fail-Safe** | Hardware-timed valve lockout (2000ms) prevents valve bounce |
| **Latency** | Measured via TIMG0 hardware timer at 80 MHz APB (12.5 ns/tick) |
| **Named Constants** | Zero magic numbers — all thresholds are documented `const` values |
| **Named Structs** | `FaultEvaluation` struct replaces bare tuples for self-documenting API |
| **Simulation** | Proteus 9.00 VSM MicroPython (behavioral port of Rust logic) |
| **Visualization** | GNUPlot 3-panel analysis (sensors, latency, status timeline) |

---

## 🔌 Hardware Wiring

| Pin ESP32-S3 | Function | Component | Notes |
|:-------------|:---------|:----------|:------|
| GPIO1 (TX0) | Serial Output | Virtual Terminal (RXD) | 115200 baud, 8N1 |
| GPIO2 | Valve LED (Red) | 220Ω + LED-RED | Active-High: ON = valve closed |
| GPIO4 | Normal LED (Green) | 220Ω + LED-GREEN | Active-High: ON = system normal |
| GPIO5 | Lockout LED (Yellow) | 220Ω + LED-YELLOW | Active-High: ON = lockout active |
| GPIO15 | Fault Button | Push-button + 10kΩ pull-down | Press = inject fault |

### Wiring Diagram (Proteus)

```
                      ┌──────────────────────────────────┐
                      │ ESP32-S3                          │
VTX RXD ──────────────┤  GPIO1 (TX0)                      │
                      │  GPIO2 ──[220Ω]──LED-RED──GND     │
                      │  GPIO4 ──[220Ω]──LED-GRN──GND     │
                      │  GPIO5 ──[220Ω]──LED-YLW──GND     │
     +3.3V ──[BUTTON]──┤  GPIO15                           │
                │       └──────────────────────────────────┘
              [10kΩ]
                │
               GND
```

---

## 📁 Project Structure

```
.
├── Rust_Proteus_Simulation/
│   ├── src/main.rs              # Rust bare-metal implementation (100/100)
│   ├── Cargo.toml               # Dependencies: esp-hal, critical-section
│   ├── simulation_data.dat      # CSV data from Virtual Terminal
│   └── plot.plt                 # GNUPlot 3-panel visualization script
│
├── Proteus_Arduino_Simulation/
│   ├── main.py                  # MicroPython port for Proteus simulation
│   └── safe_concurrency_sensor_fusion/
│       └── *.ino                # Arduino C++ behavioral equivalent
│
├── Laporan/
│   ├── main.tex                 # LaTeX report (IEEE-style, 25 references)
│   └── *.png                    # Figures and screenshots
│
├── Jurnal/                      # 25 Scopus/WoS references (2021-2026)
├── PROTEUS_SCHEMATIC_GUIDE.md   # Step-by-step wiring guide
└── README.md                    # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Rust Toolchain**: Install via [espup](https://github.com/esp-rs/espup)
- **Proteus 9.00+**: With ESP32-S3 MicroPython VSM model
- **GNUPlot 5.4+**: For data visualization

### Build (Rust — for physical hardware)

```bash
# Install ESP32-S3 Rust toolchain
cargo install espup
espup install

# Build the project
cd Rust_Proteus_Simulation
cargo build --release --target xtensa-esp32s3-none-elf
```

### Simulate (Proteus — MicroPython port)

1. Open `PemKon.pdsprj` in Proteus
2. Ensure ESP32-S3 Script File points to `Proteus_Arduino_Simulation/main.py`
3. Click **Play (▶)** — LED Green lights up (system normal)
4. Press the **push-button** to inject a fault → LED Red + Yellow activate
5. After 2000ms lockout → system auto-recovers to normal

### Visualize (GNUPlot)

```bash
cd Rust_Proteus_Simulation
gnuplot plot.plt
# Output: sensor_fusion_analysis.png (3-panel graph)
```

---

## 📊 Simulation Results

### System Behavior

| State | LED Red | LED Green | LED Yellow | Duration |
|:------|:-------:|:---------:|:----------:|:--------:|
| NORMAL | OFF | **ON** | OFF | Continuous |
| FAULT_DETECTED | **ON** | OFF | **ON** | Instant |
| LOCKOUT_ACTIVE | **ON** | OFF | **ON** | 2000ms |
| LOCKOUT_CLEARED | OFF | **ON** | OFF | → NORMAL |

### CSV Output Format

```
iteration  temp  press  vib  latency_us  status
0 25 1013 5 0 0  # NORMAL
1 25 1013 5 0 0  # NORMAL
5 99 1013 9999 4 1  # FAULT_DETECTED (anomalies=2)
6 99 1013 9999 0 2  # LOCKOUT_ACTIVE (1500ms)
9 25 1013 5 0 3  # LOCKOUT_CLEARED
```

---

## 🏆 Method Advantages

| vs. Literature | Our Method | Conventional |
|:---------------|:-----------|:-------------|
| Memory Safety | ✅ Rust compile-time (zero CVE surface) | ❌ C/C++ (186 CVEs — Xu et al., 2021) |
| Concurrency | ✅ `Mutex<RefCell<T>>` (zero data-race) | ❌ Manual lock/unlock (error-prone) |
| Sensor Fusion | ✅ 3-sensor voting (≥2 = fault) | ⚠️ Single-sensor threshold |
| Valve Safety | ✅ Timed lockout (2000ms anti-bounce) | ❌ Immediate re-open (bounce risk) |
| Latency Measurement | ✅ Hardware timer TIMG0 (80MHz) | ❌ Software `millis()` timing |

---

## 📚 References

This project is supported by **25 Scopus/WoS-indexed references** (2021–2026) spanning:
- ESP32 & Industrial IoT Applications (J1–J9)
- Multi-Sensor Fusion & Fault Tolerance (J10–J17)
- Rust & Safety-Critical Systems (J18–J25)

Full reference list available in [Laporan/main.tex](Laporan/main.tex).

---

## 👨‍🎓 Author

**Abdurrauf Almutawakkil** — NRP 2042241115  
Program Studi Rekayasa Teknologi Instrumentasi  
Institut Teknologi Sepuluh Nopember (ITS)  
Semester Genap 2025/2026

Dosen Pengampu: **Ahmad Radhy, S.Si., M.Si.**

---

## 📄 License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.
