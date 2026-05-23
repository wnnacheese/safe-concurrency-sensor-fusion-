# ============================================================================
# Safe-Concurrency Multi-Sensor Fusion - MicroPython (Proteus ESP32-S3)
# ============================================================================
# Platform  : ESP32-S3 DevKit (Proteus MicroPython VSM)
# Purpose   : Port from Arduino C++ / Rust to MicroPython for simulation.
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
#   GPIO2  -> LED Red  (valve closed / fault active)
#   GPIO4  -> LED Green  (system normal)
#   GPIO5  -> LED Yellow (lockout period)
#   UART0 TX (GPIO1) -> Virtual Terminal (115200 baud)
#
# CSV Output Format:
#   iteration  temp  press  vib  latency_us  status_code
#   Status: 0=NORMAL, 1=FAULT_DETECTED, 2=LOCKOUT_ACTIVE, 3=LOCKOUT_CLEARED
# ============================================================================

# pyrefly: ignore [missing-import]
from machine import Pin
import time

# -- Pin Definitions ---------------------------------------------------------
PIN_VALVE   = Pin(2,  Pin.OUT)   # LED Red
PIN_NORMAL  = Pin(4,  Pin.OUT)   # LED Green
PIN_LOCKOUT = Pin(5,  Pin.OUT)   # LED Yellow
PIN_BUTTON  = Pin(15, Pin.IN)    # Button (external pull-down)

# -- Configuration -----------------------------------------------------------
TEMP_THRESHOLD   = 80    # Temperature threshold (C)
VIB_THRESHOLD    = 500   # Vibration threshold (arbitrary)
LOCKOUT_MS       = 2000  # Lockout duration (ms)
POLL_INTERVAL_MS = 500   # Polling interval (ms)

# -- System State -------------------------------------------------------------
sensor_temp  = 25
sensor_press = 1013
sensor_vib   = 5
fault_active = False
lockout_remaining = 0


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
print("  Safe-Concurrency Multi-Sensor Fusion System v2.0")
print("  Platform: ESP32-S3 | MicroPython (Proteus VSM)")
print("  Logic: Voting-Based Redundancy (>=2 sensors)")
print("====================================================")
print("CONFIG:")
print("  Vib Threshold  : " + str(VIB_THRESHOLD))
print("  Temp Threshold : " + str(TEMP_THRESHOLD) + " C")
print("  Lockout Time   : " + str(LOCKOUT_MS) + " ms")
print("  Poll Interval  : " + str(POLL_INTERVAL_MS) + " ms")
print("----------------------------------------------------")
print("DATA FORMAT: iter, temp, press, vib, latency_us, status")
print("====================================================")

# -- Main Loop ----------------------------------------------------------------
iteration = 0

while True:
    # STEP 1: Fault Injection via GPIO15
    if PIN_BUTTON.value() == 1:
        sensor_vib  = 9999
        sensor_temp = 99

    temp = sensor_temp
    press = sensor_press
    vib = sensor_vib
    lockout_rem = lockout_remaining

    # STEP 2: Evaluate
    is_fault, anomaly_count = evaluate_redundancy(temp, press, vib)

    # STEP 3: State Machine
    if is_fault and lockout_rem == 0:
        t_start = time.ticks_us()

        PIN_VALVE.on()
        PIN_NORMAL.off()

        t_end = time.ticks_us()
        latency_us = time.ticks_diff(t_end, t_start)

        fault_active = True
        lockout_remaining = LOCKOUT_MS
        update_leds(True, LOCKOUT_MS)

        print(str(iteration) + " " + str(temp) + " " + str(press) + " " + str(vib) + " " + str(latency_us) + " 1  # FAULT_DETECTED (anomalies=" + str(anomaly_count) + ")")

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

            PIN_VALVE.off()
            PIN_NORMAL.on()
            PIN_LOCKOUT.off()

            print(str(iteration) + " " + str(temp) + " " + str(press) + " " + str(vib) + " 0 3  # LOCKOUT_CLEARED")
        else:
            update_leds(True, new_remaining)
            print(str(iteration) + " " + str(temp) + " " + str(press) + " " + str(vib) + " 0 2  # LOCKOUT_ACTIVE (" + str(new_remaining) + "ms)")

    else:
        update_leds(False, 0)
        print(str(iteration) + " " + str(temp) + " " + str(press) + " " + str(vib) + " 0 0  # NORMAL")

    iteration = iteration + 1
    time.sleep_ms(POLL_INTERVAL_MS)
