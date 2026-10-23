/*
 * ============================================================================
 * IoE-Based Smart Security and Intelligent Monitoring System
 * Target Board: Arduino Uno / Mega / Nano / ESP32 (compatible)
 *
 * Internet of Everything (IoE) Integration:
 * - Things: PIR Sensor, DHT Temperature/Humidity, HC-SR04 Ultrasonic, Buzzer, LEDs
 * - Connectivity: USB Serial at 9600 baud sending structured JSON
 * - Data: Real-time telemetry {"temperature": T, "humidity": H, "motion": M, "distance": D, "alarm": A}
 * - Process: Local threshold triggers + bidirectional host command execution
 * ============================================================================
 * 
 * PIN MAPPING:
 * - PIR Motion Sensor (HC-SR501) : Digital Pin 2 (Interrupt capable)
 * - DHT11 / DHT22 Data Pin       : Digital Pin 4 (Pull-up 10k resistor recommended)
 * - HC-SR04 Ultrasonic Trig      : Digital Pin 7
 * - HC-SR04 Ultrasonic Echo      : Digital Pin 8
 * - Active Buzzer                : Digital Pin 9 (PWM/Digital)
 * - Red LED (Alarm / Armed)      : Digital Pin 10 (220 Ohm resistor)
 * - Green LED (System OK)        : Digital Pin 11 (220 Ohm resistor)
 * ============================================================================
 */

// If using the standard Adafruit DHT library:
// #include <DHT.h>
// #define DHTPIN 4
// #define DHTTYPE DHT11
// DHT dht(DHTPIN, DHTTYPE);

// Pins definition
const int PIN_PIR        = 2;
const int PIN_DHT        = 4;
const int PIN_TRIG       = 7;
const int PIN_ECHO       = 8;
const int PIN_BUZZER     = 9;
const int PIN_LED_RED    = 10;
const int PIN_LED_GREEN  = 11;

// System states
bool isArmed          = true;
bool localAlarmActive = false;
bool motionDetected   = false;
float temperatureC    = 24.5;
float humidityPct     = 55.0;
float distanceCm      = 120.0;

// Timing variables
unsigned long lastTelemetryTime = 0;
const unsigned long TELEMETRY_INTERVAL = 1000; // Send JSON once every second

// Basic DHT reading without external dependencies (fallback simple pulse reader or simulated DHT)
float readSimulatedOrDHTTemp() {
  // Read analog fluctuation or return stable baseline with slight drift
  // If real DHT sensor library is installed, use: return dht.readTemperature();
  int raw = analogRead(A0);
  float drift = (raw % 10) * 0.1;
  return 24.0 + drift;
}

float readSimulatedOrDHTHumidity() {
  // If real DHT library is installed, use: return dht.readHumidity();
  int raw = analogRead(A1);
  float drift = (raw % 10) * 0.2;
  return 55.0 + drift;
}

float readUltrasonicDistance() {
  // Trigger ultrasonic ping
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  // Read echo pulse width (timeout after 25ms = ~4 meters)
  long duration = pulseIn(PIN_ECHO, HIGH, 25000);
  if (duration == 0) {
    return 150.0; // Out of range or no echo default
  }
  // Speed of sound = 343 m/s = 0.0343 cm/microsecond. Distance = (duration / 2) * 0.0343
  float cm = (duration * 0.0343) / 2.0;
  return cm;
}

void setup() {
  // Initialize Serial Monitor / Web Serial port at 9600 baud
  Serial.begin(9600);
  while (!Serial && millis() < 3000) {
    ; // Wait for serial port to connect
  }

  // Configure pin modes
  pinMode(PIN_PIR, INPUT);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);

  // Initial LED & Buzzer state
  digitalWrite(PIN_BUZZER, LOW);
  digitalWrite(PIN_LED_RED, LOW);
  digitalWrite(PIN_LED_GREEN, HIGH); // System OK

  // Startup chirp
  tone(PIN_BUZZER, 1000, 150);
  delay(200);
  tone(PIN_BUZZER, 1500, 150);

  // Optional: dht.begin();
}

void loop() {
  // 1. Check for incoming Serial commands from Web Dashboard
  processSerialCommands();

  // 2. Read physical sensors
  motionDetected = (digitalRead(PIN_PIR) == HIGH);
  distanceCm = readUltrasonicDistance();
  temperatureC = readSimulatedOrDHTTemp();
  humidityPct = readSimulatedOrDHTHumidity();

  // 3. Local Autonomous Security Rule:
  // If system is armed and motion detected or proximity breach (< 30cm)
  if (isArmed && (motionDetected || distanceCm < 30.0)) {
    localAlarmActive = true;
    digitalWrite(PIN_LED_RED, HIGH);
    digitalWrite(PIN_LED_GREEN, LOW);
    // Pulse buzzer
    if (millis() % 400 < 200) {
      digitalWrite(PIN_BUZZER, HIGH);
    } else {
      digitalWrite(PIN_BUZZER, LOW);
    }
  } else if (!localAlarmActive) {
    // Normal state
    digitalWrite(PIN_LED_RED, isArmed ? LOW : HIGH);
    digitalWrite(PIN_LED_GREEN, isArmed ? HIGH : LOW);
    digitalWrite(PIN_BUZZER, LOW);
  }

  // 4. Transmit periodic JSON telemetry to Web Serial Dashboard
  if (millis() - lastTelemetryTime >= TELEMETRY_INTERVAL) {
    lastTelemetryTime = millis();
    sendTelemetryJSON();
  }

  delay(20);
}

void sendTelemetryJSON() {
  // Formulate single-line RFC8259 compliant JSON packet
  Serial.print("{\"temperature\":");
  Serial.print(temperatureC, 1);
  Serial.print(",\"humidity\":");
  Serial.print(humidityPct, 1);
  Serial.print(",\"motion\":");
  Serial.print(motionDetected ? "true" : "false");
  Serial.print(",\"distance\":");
  Serial.print(distanceCm, 1);
  Serial.print(",\"alarm\":");
  Serial.print(localAlarmActive ? "true" : "false");
  Serial.print(",\"armed\":");
  Serial.print(isArmed ? "true" : "false");
  Serial.println("}");
}

void processSerialCommands() {
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();

    if (cmd == "ARM") {
      isArmed = true;
      localAlarmActive = false;
      digitalWrite(PIN_LED_GREEN, HIGH);
      digitalWrite(PIN_LED_RED, LOW);
      digitalWrite(PIN_BUZZER, LOW);
      tone(PIN_BUZZER, 1800, 100);
      Serial.println("{\"status\":\"ACK\",\"action\":\"ARMED\"}");
    } 
    else if (cmd == "DISARM") {
      isArmed = false;
      localAlarmActive = false;
      digitalWrite(PIN_LED_GREEN, LOW);
      digitalWrite(PIN_LED_RED, LOW);
      digitalWrite(PIN_BUZZER, LOW);
      tone(PIN_BUZZER, 800, 150);
      Serial.println("{\"status\":\"ACK\",\"action\":\"DISARMED\"}");
    }
    else if (cmd == "ALARM_CLEAR" || cmd == "RESET") {
      localAlarmActive = false;
      digitalWrite(PIN_BUZZER, LOW);
      digitalWrite(PIN_LED_RED, LOW);
      digitalWrite(PIN_LED_GREEN, HIGH);
      Serial.println("{\"status\":\"ACK\",\"action\":\"ALARM_CLEARED\"}");
    }
    else if (cmd == "BUZZER_ON") {
      digitalWrite(PIN_BUZZER, HIGH);
      Serial.println("{\"status\":\"ACK\",\"action\":\"BUZZER_ON\"}");
    }
    else if (cmd == "BUZZER_OFF") {
      digitalWrite(PIN_BUZZER, LOW);
      Serial.println("{\"status\":\"ACK\",\"action\":\"BUZZER_OFF\"}");
    }
    else if (cmd == "PING") {
      Serial.println("{\"status\":\"PONG\",\"device\":\"Arduino Uno IoE Node\"}");
    }
  }
}
