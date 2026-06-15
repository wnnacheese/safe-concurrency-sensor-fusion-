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
// CSV Output Format:
//   iter  temp  press  vib  latency_us  status
//   Status: NORMAL, FAULT_DETECTED(MINOR|CRITICAL,count/3), LOCKOUT_ACTIVE, LOCKOUT_CLEARED
// ============================================================================

// ── Pin Definitions ─────────────────────────────────────────────────────────
const uint8_t PIN_VALVE_LED    = 2;   // LED Merah: valve indicator
const uint8_t PIN_NORMAL_LED   = 4;   // LED Hijau: system normal
const uint8_t PIN_LOCKOUT_LED  = 5;   // LED Kuning: lockout period
const uint8_t PIN_FAULT_BUTTON = 15;  // Push-button: fault injection

// ── Configuration Constants ─────────────────────────────────────────────────
const uint32_t N_SENSORS                     = 3;
const uint32_t VOTING_QUORUM                 = 2;    // Majority: N/2 + 1
const uint32_t TEMPERATURE_ANOMALY_THRESHOLD = 80;
const uint32_t VIBRATION_ANOMALY_THRESHOLD   = 500;
const uint32_t LOCKOUT_MINOR_MS              = 500;   // Minor: quorum met, redundancy exists
const uint32_t LOCKOUT_CRITICAL_MS           = 2000;  // Critical: all sensors anomalous
const uint32_t SENSOR_POLL_INTERVAL_MS       = 500;

// ── Adaptive Lockout ────────────────────────────────────────────────────────
enum FaultSeverity { MINOR, CRITICAL };

FaultSeverity classifySeverity(uint32_t anomaly_count) {
  return (anomaly_count >= N_SENSORS) ? CRITICAL : MINOR;
}

uint32_t lockoutDuration(FaultSeverity severity) {
  return (severity == CRITICAL) ? LOCKOUT_CRITICAL_MS : LOCKOUT_MINOR_MS;
}

const char* severityLabel(FaultSeverity severity) {
  return (severity == CRITICAL) ? "CRITICAL" : "MINOR";
}

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
  result.is_fault      = (anomaly_count >= VOTING_QUORUM);
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
  Serial.println(F("  Safe-Concurrency Multi-Sensor Fusion System v3.0"));
  Serial.println(F("  Platform: ESP32-S3 | Arduino C++ (Proteus Sim)"));
  Serial.println(F("  Logic: N-Sensor Voting + Adaptive Lockout + Event-Triggered"));
  Serial.println(F("===================================================="));
  Serial.println(F("CONFIG:"));
  Serial.print(F("  Vib Threshold  : "));
  Serial.println(VIBRATION_ANOMALY_THRESHOLD);
  Serial.print(F("  Temp Threshold : "));
  Serial.print(TEMPERATURE_ANOMALY_THRESHOLD);
  Serial.println(F(" C"));
  Serial.print(F("  Lockout        : Adaptive (Minor="));
  Serial.print(LOCKOUT_MINOR_MS);
  Serial.print(F("ms, Critical="));
  Serial.print(LOCKOUT_CRITICAL_MS);
  Serial.println(F("ms)"));
  Serial.print(F("  Poll Interval  : "));
  Serial.print(SENSOR_POLL_INTERVAL_MS);
  Serial.println(F(" ms"));
  Serial.println(F("----------------------------------------------------"));
  Serial.println(F("DATA FORMAT: iter, temp, press, vib, latency_us, status"));
  Serial.println(F("===================================================="));
}

// ── Main Loop (Event-Triggered) ────────────────────────────────────────────
void loop() {
  static uint32_t iteration = 0;
  static bool was_pressed = false;

  // ── STEP 1: Detect Input Event (button rising edge) ────────────────────
  bool button_pressed = (digitalRead(PIN_FAULT_BUTTON) == HIGH);
  bool event = button_pressed && !was_pressed;
  was_pressed = button_pressed;

  if (button_pressed) {
    g_state.sensor_vib  = 9999;
    g_state.sensor_temp = 99;
  }

  // ── STEP 2: Read state ─────────────────────────────────────────────────
  uint32_t temp              = g_state.sensor_temp;
  uint32_t press             = g_state.sensor_press;
  uint32_t vib               = g_state.sensor_vib;
  uint32_t lockout_remaining = g_state.lockout_remaining_ms;

  bool is_lockout = (lockout_remaining > 0);

  // ── STEP 3: Event-Driven Evaluation ────────────────────────────────────
  // Only evaluate on: button press event, state transition, or lockout countdown
  static bool prev_lockout = false;
  bool transition = (is_lockout != prev_lockout) || event;

  if (transition || lockout_remaining > 0) {
    FaultResult result = evaluateSensorRedundancy(temp, press, vib);

    if (result.is_fault && lockout_remaining == 0) {
      // ── FAULT TRIGGER (Adaptive Lockout) ─────────────────────────────
      FaultSeverity severity = classifySeverity(result.anomaly_count);
      uint32_t lockout_ms    = lockoutDuration(severity);

      unsigned long t_start = micros();
      digitalWrite(PIN_VALVE_LED, HIGH);
      digitalWrite(PIN_NORMAL_LED, LOW);
      unsigned long t_end   = micros();
      uint32_t latency_us   = (uint32_t)(t_end - t_start);

      g_state.fault_active         = true;
      g_state.lockout_remaining_ms = lockout_ms;
      updateLEDs(true, lockout_ms);

      Serial.print(iteration);
      Serial.print(' ');
      Serial.print(temp);
      Serial.print(' ');
      Serial.print(press);
      Serial.print(' ');
      Serial.print(vib);
      Serial.print(' ');
      Serial.print(latency_us);
      Serial.print(F(" FAULT_DETECTED("));
      Serial.print(severityLabel(severity));
      Serial.print(',');
      Serial.print(result.anomaly_count);
      Serial.print('/');
      Serial.print(N_SENSORS);
      Serial.println(')');

    } else if (lockout_remaining > 0) {
      // ── LOCKOUT COUNTDOWN ────────────────────────────────────────────
      uint32_t new_remaining;
      if (lockout_remaining > SENSOR_POLL_INTERVAL_MS) {
        new_remaining = lockout_remaining - SENSOR_POLL_INTERVAL_MS;
      } else {
        new_remaining = 0;
      }
      g_state.lockout_remaining_ms = new_remaining;

      if (new_remaining == 0) {
        g_state.fault_active = false;
        g_state.sensor_vib   = 5;
        g_state.sensor_temp  = 25;
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
        Serial.println(F(" 0 LOCKOUT_CLEARED"));
      } else {
        updateLEDs(true, new_remaining);
        if (transition) {
          Serial.print(iteration);
          Serial.print(' ');
          Serial.print(temp);
          Serial.print(' ');
          Serial.print(press);
          Serial.print(' ');
          Serial.print(vib);
          Serial.print(F(" 0 LOCKOUT_ACTIVE("));
          Serial.print(new_remaining);
          Serial.println(F("ms)"));
        }
      }

    } else {
      // ── NORMAL (transition only) ─────────────────────────────────────
      updateLEDs(false, 0);
      if (transition) {
        Serial.print(iteration);
        Serial.print(' ');
        Serial.print(temp);
        Serial.print(' ');
        Serial.print(press);
        Serial.print(' ');
        Serial.print(vib);
        Serial.println(F(" 0 NORMAL (event-triggered)"));
      }
    }

    prev_lockout = is_lockout;
  } else {
    // ── IDLE: No event, no transition ───────────────────────────────────
    if (iteration % 10 == 0) {
      Serial.print(F(". "));
      Serial.println(iteration);
    }
  }

  iteration++;
  delay(SENSOR_POLL_INTERVAL_MS);
}
