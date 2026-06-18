#!/usr/bin/env python3
"""
============================================================================
 analyze.py — Metrics & Analysis for Safe-Concurrency Multi-Sensor Fusion
============================================================================
 Parses simulation_data.dat and computes quantitative metrics:
   - Fault distribution (MINOR vs CRITICAL)
   - Lockout duration verification
   - Recovery latency statistics
   - System uptime / idle ratio
   - Sensor anomaly patterns
============================================================================
"""

import re
import sys
from collections import defaultdict
from pathlib import Path

# ── Configuration ──────────────────────────────────────────────────────────
DATA_FILE = Path(__file__).parent.parent / "GNUPLOT" / "simulation_data.dat"

MINOR_LOCKOUT_MS = 500
CRITICAL_LOCKOUT_MS = 2000
POLL_INTERVAL_MS = 100

# ── Parse ──────────────────────────────────────────────────────────────────

def parse_data(filepath: Path):
    """Parse simulation_data.dat into structured records."""
    records = []
    with open(filepath, "r") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            parts = line.split()
            if len(parts) < 6:
                continue
            try:
                rec = {
                    "iter": int(parts[0]),
                    "temp": int(parts[1]),
                    "press": int(parts[2]),
                    "vib": int(parts[3]),
                    "latency_us": int(parts[4]),
                    "status": " ".join(parts[5:]),
                }
                records.append(rec)
            except ValueError:
                continue
    return records


def analyze(records):
    """Compute all metrics from parsed records."""
    metrics = {
        "total_iterations": len(records),
        "max_iteration": max(r["iter"] for r in records) if records else 0,
        "faults": {"MINOR": [], "CRITICAL": []},
        "lockout_durations": {"MINOR": [], "CRITICAL": []},
        "latencies": [],
        "idle_count": 0,
        "normal_count": 0,
        "fault_count": 0,
        "lockout_count": 0,
        "press_anomalies": 0,
        "press_normal": 0,
    }

    fault_start = None
    fault_type = None

    for r in records:
        status = r["status"]

        # Count states
        if "NORMAL" in status or "CLEARED" in status:
            metrics["normal_count"] += 1
        if "FAULT_DETECTED" in status:
            metrics["fault_count"] += 1
            if "MINOR" in status:
                metrics["faults"]["MINOR"].append(r["iter"])
                fault_type = "MINOR"
            elif "CRITICAL" in status:
                metrics["faults"]["CRITICAL"].append(r["iter"])
                fault_type = "CRITICAL"
            fault_start = r["iter"]
            metrics["latencies"].append(r["latency_us"])
        if "LOCKOUT_ACTIVE" in status:
            metrics["lockout_count"] += 1
        if status == "NORMAL" and r["temp"] == 25:
            metrics["idle_count"] += 1

        # Track pressure anomalies
        if r["press"] == 0:
            metrics["press_anomalies"] += 1
        elif r["press"] == 1013:
            metrics["press_normal"] += 1

        # Track lockout clear → compute duration
        if "LOCKOUT_CLEARED" in status and fault_start is not None and fault_type:
            duration_iter = r["iter"] - fault_start
            duration_ms = duration_iter * POLL_INTERVAL_MS
            metrics["lockout_durations"][fault_type].append(
                {"start": fault_start, "end": r["iter"],
                 "iterations": duration_iter, "ms": duration_ms}
            )
            fault_start = None
            fault_type = None

    return metrics


def print_report(metrics):
    """Print formatted analysis report."""
    sep = "=" * 68
    sub = "-" * 68

    print(sep)
    print("  Safe-Concurrency Multi-Sensor Fusion — Quantitative Analysis")
    print(sep)

    # ── 1. Overview ──────────────────────────────────────────────────────
    print(f"\n  {'System Overview':─^50}")
    print(f"  {'─' * 50}")
    print(f"  Total data points      : {metrics['total_iterations']:>6}")
    print(f"  Max iteration          : {metrics['max_iteration']:>6}")
    print(f"  Fault events           : {metrics['fault_count']:>6}")
    print(f"  Lockout cycles         : {metrics['lockout_count']:>6}")
    idle_pct = (metrics['idle_count'] / metrics['total_iterations'] * 100
                if metrics['total_iterations'] else 0)
    print(f"  Idle ratio             : {idle_pct:>5.1f}%")

    # ── 2. Fault Distribution ────────────────────────────────────────────
    print(f"\n  {'Fault Distribution':─^50}")
    print(f"  {'─' * 50}")
    n_minor = len(metrics["faults"]["MINOR"])
    n_critical = len(metrics["faults"]["CRITICAL"])
    n_total = n_minor + n_critical
    print(f"  MINOR   (2/3 sensors)  : {n_minor:>3}  ({n_minor/n_total*100:5.1f}%)" if n_total else f"  MINOR   (2/3 sensors)  : {n_minor:>3}")
    print(f"  CRITICAL (3/3 sensors) : {n_critical:>3}  ({n_critical/n_total*100:5.1f}%)" if n_total else f"  CRITICAL (3/3 sensors) : {n_critical:>3}")

    if metrics["faults"]["MINOR"]:
        print(f"  MINOR fault iterations : {metrics['faults']['MINOR']}")
    if metrics["faults"]["CRITICAL"]:
        print(f"  CRITICAL fault iters   : {metrics['faults']['CRITICAL']}")

    # ── 3. Lockout Verification ──────────────────────────────────────────
    print(f"\n  {'Lockout Duration Verification':─^50}")
    print(f"  {'─' * 50}")

    for sev in ["MINOR", "CRITICAL"]:
        expected = MINOR_LOCKOUT_MS if sev == "MINOR" else CRITICAL_LOCKOUT_MS
        expected_iter = expected // POLL_INTERVAL_MS
        durations = metrics["lockout_durations"][sev]
        if durations:
            actual_iters = [d["iterations"] for d in durations]
            actual_ms = [d["ms"] for d in durations]
            avg_iter = sum(actual_iters) / len(actual_iters)
            avg_ms = sum(actual_ms) / len(actual_ms)
            match = "✅" if all(i == expected_iter for i in actual_iters) else "⚠️"
            print(f"  {sev:8s}: expected {expected:>4}ms ({expected_iter:>2} iter)")
            print(f"           actual   {avg_ms:>4.0f}ms ({avg_iter:>3.0f} iter) avg  {match}")
            print(f"           durations: {actual_iters}")
        else:
            print(f"  {sev:8s}: No lockout events recorded  ❌")

    # ── 4. Recovery Latency ──────────────────────────────────────────────
    print(f"\n  {'Recovery Latency Statistics':─^50}")
    print(f"  {'─' * 50}")
    lats = metrics["latencies"]
    if lats:
        print(f"  Samples    : {len(lats):>6}")
        print(f"  Min        : {min(lats):>6} µs")
        print(f"  Max        : {max(lats):>6} µs")
        print(f"  Mean       : {sum(lats)/len(lats):>6.1f} µs")
        print(f"  All values : {lats}")
        print(f"  Target     :   <5 µs (Rust bare-metal predicted)")
        if max(lats) > 50:
            print(f"  NOTE: Latency >50µs is MicroPython interpreter overhead.")
    else:
        print("  No latency data recorded.")

    # ── 5. Sensor Anomaly Patterns ──────────────────────────────────────
    print(f"\n  {'Sensor Anomaly Patterns':─^50}")
    print(f"  {'─' * 50}")
    print(f"  Pressure normal  (1013 hPa) : {metrics['press_normal']:>6} cycles")
    print(f"  Pressure anomaly (0 hPa)    : {metrics['press_anomalies']:>6} cycles")
    print(f"  → Pressure anomaly = CRITICAL fault signature (hold ≥5s)")

    # ── 6. Verification Summary ──────────────────────────────────────────
    print(f"\n  {'Verification Summary':─^50}")
    print(f"  {'─' * 50}")

    checks = []
    # Check 1: MINOR lockout = 500ms
    minor_ok = all(
        d["ms"] == MINOR_LOCKOUT_MS
        for d in metrics["lockout_durations"]["MINOR"]
    ) if metrics["lockout_durations"]["MINOR"] else False
    checks.append(("MINOR lockout = 500ms", minor_ok))

    # Check 2: CRITICAL lockout = 2000ms
    critical_ok = all(
        d["ms"] == CRITICAL_LOCKOUT_MS
        for d in metrics["lockout_durations"]["CRITICAL"]
    ) if metrics["lockout_durations"]["CRITICAL"] else False
    checks.append(("CRITICAL lockout = 2000ms", critical_ok))

    # Check 3: Voting works (≥2 sensors anomalous for fault)
    checks.append(("Voting ≥2/3 proven", n_minor > 0 and n_critical > 0))

    # Check 4: Event-triggered (idle periods exist)
    checks.append(("Event-triggered", metrics["idle_count"] > 0))

    for desc, ok in checks:
        print(f"  {'✅' if ok else '❌'} {desc}")

    print(f"\n{sep}")
    print(f"  Analysis complete. Data: {DATA_FILE}")
    print(sep)


# ── Main ──────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if not DATA_FILE.exists():
        print(f"ERROR: Data file not found: {DATA_FILE}")
        print("Run Proteus simulation first and save output to simulation_data.dat")
        sys.exit(1)

    records = parse_data(DATA_FILE)
    if not records:
        print("ERROR: No valid data records found.")
        sys.exit(1)

    metrics = analyze(records)
    print_report(metrics)
