// ============================================================================
// Safe-Concurrency Multi-Sensor Fusion — Arduino C++ (Proteus Simulation)
// ============================================================================
// Platform  : ESP32-S3 DevKit (third-party library, Proteus 8)
// Framework : Arduino
// Purpose   : Behavioral equivalent of Rust safe-concurrency implementation
//             for Proteus simulation. Proteus does NOT support:
//               - Rust no_std esp-hal (hardware timer, critical_section, ADC)
//               - Therefore a C++/Arduino version is used for simulation.
//
// Wiring (ACTIVE-HIGH for all LEDs):
//   GPIO15 ← Button (pull-down 10kΩ, press → HIGH = fault injection)
//   GPIO2  → LED Merah  (valve closed / fault active)
//   GPIO4  → LED Hijau  (system normal)
//   GPIO5  → LED Kuning (lockout period)
//   GPIO1  → Virtual Terminal TX (Serial, 115200 baud)
//
// CSV Output Format (compatible with plot.plt):
//   iteration, temp, press, vib, latency_us, status_code
//   Status codes: 0=NORMAL, 1=FAULT_DETECTED, 2=LOCKOUT_ACTIVE, 3=LOCKOUT_CLEARED
// ============================================================================

// ── Pin Definitions ─────────────────────────────────────────────────────────
const uint8_t PIN_VALVE_LED    = 2;   // LED Merah: valve indicator
const uint8_t PIN_NORMAL_LED   = 4;   // LED Hijau: system normal
const uint8_t PIN_LOCKOUT_LED  = 5;   // LED Kuning: lockout period
const uint8_t PIN_FAULT_BUTTON = 15;  // Push-button: fault injection

// ── Configuration Constants ─────────────────────────────────────────────────
const uint32_t TEMPERATURE_ANOMALY_THRESHOLD = 80;
const uint32_t VIBRATION_ANOMALY_THRESHOLD   = 500;
const uint32_t LOCKOUT_DURATION_MS           = 2000;
const uint32_t SENSOR_POLL_INTERVAL_MS       = 500;

// ── System State ────────────────────────────────────────────────────────────
struct SystemState {
  uint32_t sensor_temp;
  uint32_t sensor_press;
  uint32_t sensor_vib;
  bool     fault_active;
  uint32_t lockout_remaining_ms;
};

SystemState g_state = {
  25,     // sensor_temp (°C)
  1013,   // sensor_press (hPa)
  5,      // sensor_vib (arbitrary)
  false,  // fault_active
  0       // lockout_remaining_ms
};

// ── Voting-Based Redundancy ─────────────────────────────────────────────────
// Returns: (is_fault, anomaly_count)
// Fault declared if ≥ 2 sensors indicate anomaly.
struct FaultResult {
  bool is_fault;
  uint32_t anomaly_count;
};

FaultResult evaluateSensorRedundancy(uint32_t temp, uint32_t press, uint32_t vib) {
  uint32_t anomaly_count = 0;

  if (temp > TEMPERATURE_ANOMALY_THRESHOLD) anomaly_count++;
  if (press < 900 || press > 1200)          anomaly_count++;
  if (vib > VIBRATION_ANOMALY_THRESHOLD)    anomaly_count++;

  FaultResult result;
  result.is_fault      = (anomaly_count >= 2);
  result.anomaly_count = anomaly_count;
  return result;
}

// ── LED Control Helpers ─────────────────────────────────────────────────────
void updateLEDs(bool fault_active, uint32_t lockout_remaining) {
  if (fault_active) {
    if (lockout_remaining > 0) {
      digitalWrite(PIN_VALVE_LED,   HIGH);  // Valve closed
      digitalWrite(PIN_NORMAL_LED,  LOW);
      digitalWrite(PIN_LOCKOUT_LED, HIGH);  // Lockout active
    } else {
      digitalWrite(PIN_VALVE_LED,   HIGH);
      digitalWrite(PIN_NORMAL_LED,  LOW);
      digitalWrite(PIN_LOCKOUT_LED, LOW);
    }
  } else {
    digitalWrite(PIN_VALVE_LED,   LOW);   // Valve open (normal)
    digitalWrite(PIN_NORMAL_LED,  HIGH);  // System normal
    digitalWrite(PIN_LOCKOUT_LED, LOW);
  }
}

// ── Setup ───────────────────────────────────────────────────────────────────
void setup() {
  // Initialize pins
  pinMode(PIN_VALVE_LED,    OUTPUT);
  pinMode(PIN_NORMAL_LED,   OUTPUT);
  pinMode(PIN_LOCKOUT_LED,  OUTPUT);
  pinMode(PIN_FAULT_BUTTON, INPUT);  // External pull-down resistor

  // Initial LED state: normal operation
  digitalWrite(PIN_VALVE_LED,   LOW);
  digitalWrite(PIN_NORMAL_LED,  HIGH);
  digitalWrite(PIN_LOCKOUT_LED, LOW);

  // Serial for Virtual Terminal
  Serial.begin(115200);
  delay(100);  // Allow UART to stabilize

  // ── Boot Header ─────────────────────────────────────────────────────────
  Serial.println(F("===================================================="));
  Serial.println(F("  Safe-Concurrency Multi-Sensor Fusion System v2.0"));
  Serial.println(F("  Platform: ESP32-S3 | Arduino C++ (Proteus Sim)"));
  Serial.println(F("  Logic: Voting-Based Redundancy (>=2 sensors)"));
  Serial.println(F("===================================================="));
  Serial.println(F("CONFIG:"));
  Serial.print(F("  Vib Threshold  : "));
  Serial.println(VIBRATION_ANOMALY_THRESHOLD);
  Serial.print(F("  Temp Threshold : "));
  Serial.print(TEMPERATURE_ANOMALY_THRESHOLD);
  Serial.println(F(" C"));
  Serial.print(F("  Lockout Time   : "));
  Serial.print(LOCKOUT_DURATION_MS);
  Serial.println(F(" ms"));
  Serial.print(F("  Poll Interval  : "));
  Serial.print(SENSOR_POLL_INTERVAL_MS);
  Serial.println(F(" ms"));
  Serial.println(F("----------------------------------------------------"));
  Serial.println(F("DATA FORMAT: iter, temp, press, vib, latency_us, status"));
  Serial.println(F("===================================================="));
}

// ── Main Loop ──────────────────────────────────────────────────────────────
void loop() {
  static uint32_t iteration = 0;

  // ── STEP 1: Fault Injection via GPIO15 ──────────────────────────────────
  if (digitalRead(PIN_FAULT_BUTTON) == HIGH) {
    g_state.sensor_vib  = 9999;  // Inject vibration anomaly
    g_state.sensor_temp = 99;    // Inject temperature anomaly
  }

  // ── STEP 2: Read sensor state ───────────────────────────────────────────
  uint32_t temp             = g_state.sensor_temp;
  uint32_t press            = g_state.sensor_press;
  uint32_t vib              = g_state.sensor_vib;
  uint32_t lockout_remaining = g_state.lockout_remaining_ms;

  // ── STEP 3: Voting-Based Redundancy ─────────────────────────────────────
  FaultResult result = evaluateSensorRedundancy(temp, press, vib);

  // ── STEP 4: State Machine ───────────────────────────────────────────────
  if (result.is_fault && lockout_remaining == 0) {
    // ── STEP 4a: FAIL-SAFE TRIGGER ──────────────────────────────────────
    unsigned long t_start = micros();

    // Close valve (LED ON = active-high)
    digitalWrite(PIN_VALVE_LED, HIGH);
    digitalWrite(PIN_NORMAL_LED, LOW);

    unsigned long t_end   = micros();
    uint32_t latency_us   = (uint32_t)(t_end - t_start);

    // Set lockout
    g_state.fault_active         = true;
    g_state.lockout_remaining_ms = LOCKOUT_DURATION_MS;

    updateLEDs(true, LOCKOUT_DURATION_MS);

    // Clean CSV: iter temp press vib latency_us status_code
    Serial.print(iteration);
    Serial.print(' ');
    Serial.print(temp);
    Serial.print(' ');
    Serial.print(press);
    Serial.print(' ');
    Serial.print(vib);
    Serial.print(' ');
    Serial.print(latency_us);
    Serial.print(F(" 1  # FAULT_DETECTED (anomalies="));
    Serial.print(result.anomaly_count);
    Serial.println(')');

  } else if (lockout_remaining > 0) {
    // ── STEP 4b: LOCKOUT ACTIVE ──────────────────────────────────────────
    uint32_t new_remaining;
    if (lockout_remaining > SENSOR_POLL_INTERVAL_MS) {
      new_remaining = lockout_remaining - SENSOR_POLL_INTERVAL_MS;
    } else {
      new_remaining = 0;
    }

    g_state.lockout_remaining_ms = new_remaining;

    if (new_remaining == 0) {
      // Lockout complete — clear fault
      g_state.fault_active = false;
      g_state.sensor_vib   = 5;    // Reset to normal
      g_state.sensor_temp  = 25;   // Reset to normal

      digitalWrite(PIN_VALVE_LED,   LOW);
      digitalWrite(PIN_NORMAL_LED,  HIGH);
      digitalWrite(PIN_LOCKOUT_LED, LOW);

      Serial.print(iteration);
      Serial.print(' ');
      Serial.print(temp);
      Serial.print(' ');
      Serial.print(press);
      Serial.print(' ');
      Serial.print(vib);
      Serial.println(F(" 0 3  # LOCKOUT_CLEARED"));
    } else {
      updateLEDs(true, new_remaining);

      Serial.print(iteration);
      Serial.print(' ');
      Serial.print(temp);
      Serial.print(' ');
      Serial.print(press);
      Serial.print(' ');
      Serial.print(vib);
      Serial.print(F(" 0 2  # LOCKOUT_ACTIVE ("));
      Serial.print(new_remaining);
      Serial.println(F("ms)"));
    }

  } else {
    // ── STEP 4c: NORMAL OPERATION ────────────────────────────────────────
    updateLEDs(false, 0);

    Serial.print(iteration);
    Serial.print(' ');
    Serial.print(temp);
    Serial.print(' ');
    Serial.print(press);
    Serial.print(' ');
    Serial.print(vib);
    Serial.println(F(" 0 0  # NORMAL"));
  }

  iteration++;
  delay(SENSOR_POLL_INTERVAL_MS);
}
