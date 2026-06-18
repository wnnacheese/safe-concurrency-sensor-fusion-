# Firmware Build Guide — Safe-Concurrency Multi-Sensor Fusion

## Hardware Target

- **MCU:** ESP32-S3 (Xtensa LX7, dual-core, 240 MHz)
- **Board:** ESP32-S3 DevKit (or Proteus VSM simulation)

## Prerequisites

### Rust Toolchain (ESP32-S3)

```bash
# Install espup — the ESP Rust toolchain installer
cargo install espup
espup install

# Add to PATH (PowerShell)
$env:Path += ";$env:USERPROFILE\.rustup\toolchains\esp\xtensa-esp-elf\bin"
$env:Path += ";$env:USERPROFILE\.cargo\bin"
```

### Verify Installation

```bash
rustup toolchain list | grep esp
# Expected: esp (default)
#           xtensa-esp32s3-none-elf
```

## Build (Rust Bare-Metal)

```bash
cd Rust_Simulation

# Check compilation (fast, no binary)
cargo +esp check --target xtensa-esp32s3-none-elf

# Build release binary
cargo +esp build --release \
    -Zbuild-std=core,alloc \
    --target xtensa-esp32s3-none-elf

# Binary location:
# target/xtensa-esp32s3-none-elf/release/safe-concurrency-sensor-fusion
```

## Flash to Hardware

```bash
# Using espflash
cargo install espflash
espflash flash \
    --target xtensa-esp32s3-none-elf \
    target/xtensa-esp32s3-none-elf/release/safe-concurrency-sensor-fusion

# Monitor serial output
espflash monitor
```

## Simulate in Proteus

1. Open `Proteus_Simulation/PemKon.pdsprj` in Proteus 9.00+
2. Right-click ESP32-S3 → Properties → Script File
3. Browse to `Proteus_Simulation/main.py`
4. Click **Play (▶)** to start simulation

### Expected Behavior

| LED | GPIO | State |
|-----|------|-------|
| Green (D2) | GPIO4 | ON = system normal |
| Red (D1) | GPIO3 | ON = fault active, valve closed |
| Yellow (D3) | GPIO5 | ON = lockout period active |

### Button Operation

| Action | Result |
|--------|--------|
| Short press (<5s) | MINOR fault (2/3 sensors), 500ms lockout |
| Long press (≥5s) | CRITICAL fault (3/3 sensors), 2000ms lockout |

## Project Structure

```
.
├── Rust_Simulation/
│   ├── src/main.rs           # Rust firmware (esp-hal 1.1.1)
│   ├── Cargo.toml            # Dependencies
│   └── .cargo/config.toml    # Linker config for Xtensa
│
├── Proteus_Simulation/
│   ├── main.py               # MicroPython port (Proteus VSM)
│   └── PemKon.pdsprj         # Proteus project
│
├── GNUPLOT/                   # Data + visualization scripts
│   ├── simulation_data.dat   # CSV simulation output
│   └── plot*.plt             # GNUPlot scripts
│
├── python/
│   └── analyze.py            # Metrics & analysis
│
└── Laporan/
    ├── main.tex              # LaTeX report
    └── ETS_PemKom.pdf        # Compiled PDF
```

## CI/CD (GitHub Actions)

On every push to `main`:
1. Install `espup` toolchain
2. `cargo +esp check` — verify compilation
3. `cargo +esp build --release` — produce binary
4. Upload `.elf` binary as build artifact
