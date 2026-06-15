# Changelog

All notable changes to Safe-Concurrency Sensor Fusion project.

---

## [3.0.0] — 2026-06-15

### Added
- **N-Sensor Scalability**: Configurable `N_SENSORS` const, auto-computed `VOTING_QUORUM = N/2 + 1`
- **Adaptive Lockout**: `FaultSeverity` enum (Minor=500ms, Critical=2000ms)
- **Event-Triggered Polling**: `SystemStatus` tracking, evaluate on state change only, idle heartbeat
- **Power Management**: ESP32-S3 light sleep via RTC timer after 3 idle cycles
- **CI/CD Pipeline**: GitHub Actions workflow — auto check + build + artifact upload
- **Proteus Wiring Guide**: Instructions for modifying schematic in README

### Changed
- **Framework**: `esp-hal` 0.22 → 1.1.1, `xtensa-lx-rt` 0.17 → 0.22
- **Dependencies**: `esp-backtrace` 0.15 → 0.19, `esp-println` 0.13 → 0.17
- **API**: `#[entry]` → `#[main]`, `Output`/`Input` GPIO types, `Timer` trait, `Instant.elapsed()`
- **CSV format**: Status now shows severity `FAULT_DETECTED(MINOR,2/3)` or `FAULT_DETECTED(CRITICAL,3/3)`
- **Simulation ports**: MicroPython + Arduino C++ updated to v3.0 feature parity

### Fixed
- Compiler compatibility with Rust nightly 1.95 (espup toolchain)
- `cargo build` now requires `.cargo/config.toml` with `linkall.x` linker script

---

## [2.0.0] — 2026-05-28

### Added
- Initial release: 3-sensor voting redundancy (temperature, pressure, vibration)
- 2-of-3 majority voting (`VOTING_QUORUM = 2`)
- Fixed 2000ms hardware-timed lockout (TIMG0 @ 80 MHz)
- `Mutex<RefCell<T>>` + `critical_section` concurrency
- `FaultEvaluation` named struct
- Zero `unsafe` code guarantee
- GNUPlot 5-panel visualizations
- LaTeX IEEE-style report with 25 Scopus/WoS references
- MicroPython + Arduino C++ simulation ports for Proteus

---

## Version Convention

- **Major**: Breaking changes (framework upgrade, API changes)
- **Minor**: New features (new algorithm, new sensor support)
- **Patch**: Bug fixes, documentation updates
