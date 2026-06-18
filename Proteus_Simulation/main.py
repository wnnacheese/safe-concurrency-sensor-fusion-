# ============================================================================
# Safe-Concurrency Multi-Sensor Fusion - MicroPython (Proteus ESP32-S3)
# ============================================================================
# Platform  : ESP32-S3 DevKit (Proteus MicroPython VSM)
# Purpose   : Port from Rust no_std to MicroPython for Proteus simulation.
#             Proteus ESP32-S3 (MicroPython category) only accepts .py.
#
# COMPATIBILITY NOTE:
#   This script does NOT use f-strings (f"...") because the MicroPython VM
#   in Proteus ESP32-S3 does not support them.
#   All outputs use standard str(), +, or .format().
#   This file is 100% pure ASCII to prevent parser encoding crashes.
#
# Wiring (ACTIVE-HIGH for all LEDs):
#   GPIO15 <- Button  (pull-down 10k, press -> HIGH = fault injection)
#   GPIO3  -> LED Red  (valve closed / fault active)
#   GPIO4  -> LED Green  (system normal)
#   GPIO5  -> LED Yellow (lockout period)
#
# Output: print() to Proteus debug console
#   Format: iter  temp  press  vib  latency_us  status
#   Status: NORMAL, FAULT_DETECTED(MINOR|CRITICAL,count/N),
#           LOCKOUT_ACTIVE, LOCKOUT_CLEARED
# ============================================================================

# pyrefly: ignore [missing-import]
from machine import Pin
import time

# -- Pin Definitions ---------------------------------------------------------
PIN_VALVE   = Pin(3,  Pin.OUT)   # LED Red
PIN_NORMAL  = Pin(4,  Pin.OUT)   # LED Green
PIN_LOCKOUT = Pin(5,  Pin.OUT)   # LED Yellow
PIN_BUTTON  = Pin(15, Pin.IN)    # Button (external pull-down)

# -- Configuration -----------------------------------------------------------
TEMP_THRESHOLD   = 80    # Temperature threshold (C)
VIB_THRESHOLD    = 500   # Vibration threshold (arbitrary)
LOCKOUT_MINOR_MS    = 500   # Minor fault lockout (quorum met, redundancy exists)
LOCKOUT_CRITICAL_MS = 2000  # Critical fault lockout (all sensors anomalous)
POLL_INTERVAL_MS    = 100   # Polling interval (ms) — fast polling for reliable button detection

# -- System State -------------------------------------------------------------
sensor_temp  = 25
sensor_press = 1013
sensor_vib   = 5
fault_active = False
lockout_remaining = 0


# -- Adaptive Lockout ---------------------------------------------------------
def lockout_duration(anomaly_count):
    """Return lockout duration based on severity."""
    if anomaly_count >= 3:  # All 3 sensors anomalous
        return LOCKOUT_CRITICAL_MS
    else:
        return LOCKOUT_MINOR_MS


def severity_label(anomaly_count):
    """Return severity label for CSV output."""
    if anomaly_count >= 3:
        return "CRITICAL"
    else:
        return "MINOR"


# -- Voting-Based Redundancy --------------------------------------------------
def evaluate_redundancy(temp, press, vib):
    anomalies = 0
    if temp > TEMP_THRESHOLD:
        anomalies = anomalies + 1
    if press < 900 or press > 1200:
        anomalies = anomalies + 1
    if vib > VIB_THRESHOLD:
        anomalies = anomalies + 1
    return (anomalies >= 2), anomalies


# -- LED Update ---------------------------------------------------------------
def update_leds(fault, lockout_rem):
    if fault:
        PIN_VALVE.on()      # Red ON
        PIN_NORMAL.off()    # Green OFF
        if lockout_rem > 0:
            PIN_LOCKOUT.on()   # Yellow ON
        else:
            PIN_LOCKOUT.off()
    else:
        PIN_VALVE.off()     # Red OFF
        PIN_NORMAL.on()     # Green ON
        PIN_LOCKOUT.off()   # Yellow OFF


# -- Initial State -----------------------------------------------------------
PIN_VALVE.off()
PIN_NORMAL.on()
PIN_LOCKOUT.off()

# -- Boot Header --------------------------------------------------------------
print("====================================================")
print("  Safe-Concurrency Multi-Sensor Fusion System")
print("  Platform: ESP32-S3 | MicroPython (Proteus VSM)")
print("  Logic: N-Sensor Voting + Adaptive Lockout + Event-Triggered")
print("====================================================")
print("CONFIG:")
print("  Vib Threshold  : " + str(VIB_THRESHOLD))
print("  Temp Threshold : " + str(TEMP_THRESHOLD) + " C")
print("  Lockout        : Adaptive (Minor=" + str(LOCKOUT_MINOR_MS) + "ms, Critical=" + str(LOCKOUT_CRITICAL_MS) + "ms)")
print("  Poll Interval  : " + str(POLL_INTERVAL_MS) + " ms")
print("----------------------------------------------------")
print("DATA FORMAT: iter, temp, press, vib, latency_us, status")
print("====================================================")

# -- Startup Delay (let Proteus simulation stabilize) -------------------------
time.sleep_ms(1000)

# -- Main Loop (Event-Triggered) -----------------------------------------------
iteration = 0
prev_status = "NORMAL"
was_pressed = False
STARTUP_GRACE = 4  # Ignore button for first 4 iterations (~2s)
button_latched = False  # Sticky latch for Proteus short-press timing
button_hold_count = 0   # Consecutive cycles button held (for CRITICAL detection)

while True:
    # STEP 1: Detect Input Event (button press)
    # Skip button read during startup grace period to avoid Proteus GPIO glitch
    if iteration < STARTUP_GRACE:
        button_raw = False
    else:
        button_raw = (PIN_BUTTON.value() == 1)

    # Track consecutive hold duration (for MINOR vs CRITICAL)
    if button_raw:
        button_hold_count = button_hold_count + 1
    else:
        button_hold_count = 0

    # Sticky latch: capture brief button presses (<500ms poll interval)
    if button_raw:
        button_latched = True
    elif lockout_remaining == 0:
        # Clear latch on release when not in lockout (ready for next press)
        button_latched = False

    # Rising-edge detection on latch (not raw button)
    event = button_latched and not was_pressed
    was_pressed = button_latched

    if button_latched:
        sensor_vib  = 9999
        sensor_temp = 99
        # Long press (>=5s = 50 cycles at 100ms) → CRITICAL
        if button_hold_count >= 50:
            sensor_press = 0

    temp = sensor_temp
    press = sensor_press
    vib = sensor_vib
    lockout_rem = lockout_remaining

    current_status = "LOCKOUT" if lockout_rem > 0 else "NORMAL"
    transition = (current_status != prev_status) or event

    # STEP 2: Event-Driven Evaluation
    if transition or lockout_rem > 0:
        is_fault, anomaly_count = evaluate_redundancy(temp, press, vib)

        if is_fault and lockout_rem == 0:
            button_latched = False  # Consume this press, wait for next
            t_start = time.ticks_us()
            lockout_ms = lockout_duration(anomaly_count)
            sev = severity_label(anomaly_count)

            PIN_VALVE.on()
            PIN_NORMAL.off()

            t_end = time.ticks_us()
            latency_us = time.ticks_diff(t_end, t_start)

            fault_active = True
            lockout_remaining = lockout_ms
            update_leds(True, lockout_ms)

            print(str(iteration) + " " + str(temp) + " " + str(press) + " " + str(vib) + " " + str(latency_us) + " FAULT_DETECTED(" + sev + "," + str(anomaly_count) + "/3)")
            prev_status = "FAULT"

        elif lockout_rem > 0:
            if lockout_rem > POLL_INTERVAL_MS:
                new_remaining = lockout_rem - POLL_INTERVAL_MS
            else:
                new_remaining = 0

            lockout_remaining = new_remaining

            if new_remaining == 0:
                fault_active = False
                sensor_vib  = 5
                sensor_temp = 25
                sensor_press = 1013  # Restore normal pressure after CRITICAL
                button_latched = False  # Clear latch for next press

                PIN_VALVE.off()
                PIN_NORMAL.on()
                PIN_LOCKOUT.off()

                print(str(iteration) + " " + str(temp) + " " + str(press) + " " + str(vib) + " 0 LOCKOUT_CLEARED")
                prev_status = "NORMAL"
            else:
                update_leds(True, new_remaining)
                print(str(iteration) + " " + str(temp) + " " + str(press) + " " + str(vib) + " 0 LOCKOUT_ACTIVE(" + str(new_remaining) + "ms)")
                prev_status = "LOCKOUT"

        else:
            update_leds(False, 0)
            if transition:
                print(str(iteration) + " " + str(temp) + " " + str(press) + " " + str(vib) + " 0 NORMAL (event-triggered)")
            prev_status = "NORMAL"

    else:
        # IDLE: No event, no transition
        if iteration % 10 == 0:
            print(". " + str(iteration))

    iteration = iteration + 1
    time.sleep_ms(POLL_INTERVAL_MS)
