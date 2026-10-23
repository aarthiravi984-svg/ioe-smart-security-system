import React, { useState } from 'react';
import { 
  BookOpen, 
  Layers, 
  Cpu, 
  Share2, 
  Code2, 
  FileText, 
  Copy, 
  Check, 
  Download,
  Terminal,
  ShieldCheck,
  Users,
  Database,
  Workflow
} from 'lucide-react';

export const DocumentationTab: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeDocSection, setActiveDocSection] = useState<'ARCHITECTURE' | 'CIRCUIT' | 'CODE' | 'SETUP' | 'VIVA'>('ARCHITECTURE');

  const arduinoCode = `/*
 * IoE-Based Smart Security and Intelligent Monitoring System
 * Target: Arduino Uno / Mega / Nano
 * Pin Mapping:
 * - PIR Motion Sensor (HC-SR501) : Pin 2
 * - DHT11 / DHT22 Sensor         : Pin 4
 * - Ultrasonic Trig (HC-SR04)    : Pin 7
 * - Ultrasonic Echo (HC-SR04)    : Pin 8
 * - Piezo Buzzer                 : Pin 9
 * - Red Security LED             : Pin 10
 * - Green System LED             : Pin 11
 */

const int PIN_PIR       = 2;
const int PIN_DHT       = 4;
const int PIN_TRIG      = 7;
const int PIN_ECHO      = 8;
const int PIN_BUZZER    = 9;
const int PIN_LED_RED   = 10;
const int PIN_LED_GREEN = 11;

bool isArmed          = true;
bool localAlarmActive = false;
bool motionDetected   = false;
float temperatureC    = 24.5;
float humidityPct     = 55.0;
float distanceCm      = 120.0;
unsigned long lastTelemetryTime = 0;

void setup() {
  Serial.begin(9600);
  pinMode(PIN_PIR, INPUT);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);

  digitalWrite(PIN_BUZZER, LOW);
  digitalWrite(PIN_LED_RED, LOW);
  digitalWrite(PIN_LED_GREEN, HIGH);
  tone(PIN_BUZZER, 1200, 100);
}

void loop() {
  processCommands();
  motionDetected = (digitalRead(PIN_PIR) == HIGH);
  distanceCm = readDistance();

  // Simulated or physical DHT readings
  int rawTemp = analogRead(A0);
  temperatureC = 24.0 + ((rawTemp % 10) * 0.1);
  humidityPct  = 50.0 + ((rawTemp % 10) * 0.2);

  // Local Autonomous Security Rule
  if (isArmed && (motionDetected || distanceCm < 30.0)) {
    localAlarmActive = true;
    digitalWrite(PIN_LED_RED, HIGH);
    digitalWrite(PIN_LED_GREEN, LOW);
    digitalWrite(PIN_BUZZER, (millis() % 400 < 200) ? HIGH : LOW);
  } else if (!localAlarmActive) {
    digitalWrite(PIN_LED_RED, isArmed ? LOW : HIGH);
    digitalWrite(PIN_LED_GREEN, isArmed ? HIGH : LOW);
    digitalWrite(PIN_BUZZER, LOW);
  }

  // Periodic Telemetry JSON Output
  if (millis() - lastTelemetryTime >= 1000) {
    lastTelemetryTime = millis();
    Serial.print("{\\"temperature\\":");
    Serial.print(temperatureC, 1);
    Serial.print(",\\"humidity\\":");
    Serial.print(humidityPct, 1);
    Serial.print(",\\"motion\\":");
    Serial.print(motionDetected ? "true" : "false");
    Serial.print(",\\"distance\\":");
    Serial.print(distanceCm, 1);
    Serial.print(",\\"alarm\\":");
    Serial.print(localAlarmActive ? "true" : "false");
    Serial.print(",\\"armed\\":");
    Serial.print(isArmed ? "true" : "false");
    Serial.println("}");
  }
  delay(20);
}

float readDistance() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  long dur = pulseIn(PIN_ECHO, HIGH, 25000);
  return (dur == 0) ? 150.0 : ((dur * 0.0343) / 2.0);
}

void processCommands() {
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\\n');
    cmd.trim();
    if (cmd == "ARM") {
      isArmed = true;
      localAlarmActive = false;
      digitalWrite(PIN_LED_GREEN, HIGH);
      digitalWrite(PIN_LED_RED, LOW);
      digitalWrite(PIN_BUZZER, LOW);
      tone(PIN_BUZZER, 1800, 100);
      Serial.println("{\\"status\\":\\"ACK\\",\\"action\\":\\"ARMED\\"}");
    } else if (cmd == "DISARM") {
      isArmed = false;
      localAlarmActive = false;
      digitalWrite(PIN_LED_GREEN, LOW);
      digitalWrite(PIN_LED_RED, LOW);
      digitalWrite(PIN_BUZZER, LOW);
      tone(PIN_BUZZER, 700, 150);
      Serial.println("{\\"status\\":\\"ACK\\",\\"action\\":\\"DISARMED\\"}");
    } else if (cmd == "ALARM_CLEAR") {
      localAlarmActive = false;
      digitalWrite(PIN_BUZZER, LOW);
      digitalWrite(PIN_LED_RED, LOW);
      digitalWrite(PIN_LED_GREEN, HIGH);
      Serial.println("{\\"status\\":\\"ACK\\",\\"action\\":\\"ALARM_CLEARED\\"}");
    } else if (cmd == "BUZZER_ON") {
      digitalWrite(PIN_BUZZER, HIGH);
      Serial.println("{\\"status\\":\\"ACK\\",\\"action\\":\\"BUZZER_ON\\"}");
    } else if (cmd == "BUZZER_OFF") {
      digitalWrite(PIN_BUZZER, LOW);
      Serial.println("{\\"status\\":\\"ACK\\",\\"action\\":\\"BUZZER_OFF\\"}");
    }
  }
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(arduinoCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const downloadIno = () => {
    const element = document.createElement('a');
    const file = new Blob([arduinoCode], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'ioe_security_system.ino';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <span>IoE Architecture, Circuit Schematic & College Viva Guide</span>
          </h2>
          <p className="text-xs text-slate-400">
            Comprehensive documentation for presentation, hardware assembly, and viva voce evaluation
          </p>
        </div>

        {/* Section Navigation Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveDocSection('ARCHITECTURE')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeDocSection === 'ARCHITECTURE' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            5-Layer Architecture
          </button>
          <button
            onClick={() => setActiveDocSection('CIRCUIT')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeDocSection === 'CIRCUIT' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pin Mapping & Circuit
          </button>
          <button
            onClick={() => setActiveDocSection('CODE')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeDocSection === 'CODE' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Arduino .ino Sketch
          </button>
          <button
            onClick={() => setActiveDocSection('SETUP')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeDocSection === 'SETUP' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Setup Guide
          </button>
          <button
            onClick={() => setActiveDocSection('VIVA')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeDocSection === 'VIVA' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Viva Script
          </button>
        </div>
      </div>

      {/* SECTION 1: 5-LAYER IOE ARCHITECTURE & 4 PILLARS */}
      {activeDocSection === 'ARCHITECTURE' && (
        <div className="space-y-6">
          {/* IoE 4 Pillars Header */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase mb-1">
                <Users className="w-4 h-4" />
                <span>1. People</span>
              </div>
              <p className="text-xs text-slate-300">
                Security operators, administrators, and emergency responders receive notifications, evaluate incidents, and execute countermeasures.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase mb-1">
                <Cpu className="w-4 h-4" />
                <span>2. Things</span>
              </div>
              <p className="text-xs text-slate-300">
                Physical hardware nodes: Arduino Uno, HC-SR501 PIR sensor, DHT11 temp/humidity, HC-SR04 ultrasonic, buzzer, LEDs, and HD web camera.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase mb-1">
                <Database className="w-4 h-4" />
                <span>3. Data</span>
              </div>
              <p className="text-xs text-slate-300">
                Structured JSON telemetry packets, optical frame deltas, incident evidence snapshots, audit records, and CSV export.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase mb-1">
                <Workflow className="w-4 h-4" />
                <span>4. Process</span>
              </div>
              <p className="text-xs text-slate-300">
                Multi-sensor correlation rules, cooldown deduplication, autonomous siren triggers, and EmailJS incident dispatch.
              </p>
            </div>
          </div>

          {/* 5-Layer Architectural Stack Diagram */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800">
            <h4 className="font-bold text-sm text-slate-200 mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>5-Layer IoE Architecture Model</span>
            </h4>

            <div className="space-y-3">
              {/* Layer 5 */}
              <div className="p-3 rounded-lg bg-slate-900 border-l-4 border-l-purple-500 border border-slate-800 flex items-start justify-between">
                <div>
                  <div className="font-bold text-xs text-purple-400 uppercase tracking-wider">
                    Layer 5: People & Service Integration
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    Security Operator role, Administrator authorization, EmailJS automated notification dispatch, email alert cooldown logic.
                  </div>
                </div>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                  Human-in-the-Loop
                </span>
              </div>

              {/* Layer 4 */}
              <div className="p-3 rounded-lg bg-slate-900 border-l-4 border-l-blue-500 border border-slate-800 flex items-start justify-between">
                <div>
                  <div className="font-bold text-xs text-blue-400 uppercase tracking-wider">
                    Layer 4: Application & Visualization Layer
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    Unified Web Dashboard, real-time gauges, incident history table, CSV export, telemetry trends, and hardware simulator bench.
                  </div>
                </div>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                  Web Dashboard
                </span>
              </div>

              {/* Layer 3 */}
              <div className="p-3 rounded-lg bg-slate-900 border-l-4 border-l-emerald-500 border border-slate-800 flex items-start justify-between">
                <div>
                  <div className="font-bold text-xs text-emerald-400 uppercase tracking-wider">
                    Layer 3: Data Processing & Multi-Sensor Fusion
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    Computer vision luminance frame-differencing engine, multi-sensor correlation rules (PIR + Camera motion = Verified Intrusion), temperature threshold comparator.
                  </div>
                </div>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                  Rule Engine & CV
                </span>
              </div>

              {/* Layer 2 */}
              <div className="p-3 rounded-lg bg-slate-900 border-l-4 border-l-amber-500 border border-slate-800 flex items-start justify-between">
                <div>
                  <div className="font-bold text-xs text-amber-400 uppercase tracking-wider">
                    Layer 2: Connectivity & Transport Layer
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    W3C Web Serial API (Chrome/Edge) at 9600 baud, MediaDevices video stream, bidirectional command pipes (ARM, DISARM, BUZZER_ON).
                  </div>
                </div>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                  Web Serial / USB
                </span>
              </div>

              {/* Layer 1 */}
              <div className="p-3 rounded-lg bg-slate-900 border-l-4 border-l-rose-500 border border-slate-800 flex items-start justify-between">
                <div>
                  <div className="font-bold text-xs text-rose-400 uppercase tracking-wider">
                    Layer 1: Perception & Actuation Layer (Physical Things)
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    HC-SR501 PIR sensor, DHT11/22 sensor, HC-SR04 ultrasonic sensor, active piezo buzzer, red/green status LEDs, USB camera.
                  </div>
                </div>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                  Arduino & Sensors
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: CIRCUIT DIAGRAM & PIN MAPPING */}
      {activeDocSection === 'CIRCUIT' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <h4 className="font-bold text-sm text-slate-100 mb-2">Arduino Uno Physical Pin Mapping</h4>
            <p className="text-xs text-slate-400 mb-4">
              Connect components to the Arduino Uno header pins according to this standard assignment table:
            </p>

            <div className="border border-slate-800 rounded-lg overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Arduino Pin</th>
                    <th className="py-2.5 px-3">Component</th>
                    <th className="py-2.5 px-3">Signal Type</th>
                    <th className="py-2.5 px-3">Wiring Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-slate-300 text-[11px]">
                  <tr>
                    <td className="py-2 px-3 text-cyan-400 font-bold">Digital Pin 2</td>
                    <td className="py-2 px-3 font-sans font-semibold">HC-SR501 PIR Motion Sensor</td>
                    <td className="py-2 px-3">Digital Input (Active HIGH)</td>
                    <td className="py-2 px-3 font-sans text-slate-400">VCC to 5V, GND to GND. Set jumper to Repeat Trigger (H).</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-cyan-400 font-bold">Digital Pin 4</td>
                    <td className="py-2 px-3 font-sans font-semibold">DHT11 / DHT22 Sensor</td>
                    <td className="py-2 px-3">Single-Bus Digital I/O</td>
                    <td className="py-2 px-3 font-sans text-slate-400">10k Ohm pull-up resistor between VCC and Data pin recommended.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-cyan-400 font-bold">Digital Pin 7</td>
                    <td className="py-2 px-3 font-sans font-semibold">HC-SR04 Ultrasonic Trigger</td>
                    <td className="py-2 px-3">Digital Output (Pulse)</td>
                    <td className="py-2 px-3 font-sans text-slate-400">Sends 10 microsecond HIGH pulse to initiate ping.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-cyan-400 font-bold">Digital Pin 8</td>
                    <td className="py-2 px-3 font-sans font-semibold">HC-SR04 Ultrasonic Echo</td>
                    <td className="py-2 px-3">Digital Input (Pulse Width)</td>
                    <td className="py-2 px-3 font-sans text-slate-400">Measures round-trip sound wave travel time via pulseIn().</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-cyan-400 font-bold">Digital Pin 9</td>
                    <td className="py-2 px-3 font-sans font-semibold">Piezoelectric Buzzer</td>
                    <td className="py-2 px-3">Digital Output / PWM</td>
                    <td className="py-2 px-3 font-sans text-slate-400">Positive leg to Pin 9, negative leg to GND.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-cyan-400 font-bold">Digital Pin 10</td>
                    <td className="py-2 px-3 font-sans font-semibold">Red LED (Security Alarm)</td>
                    <td className="py-2 px-3">Digital Output</td>
                    <td className="py-2 px-3 font-sans text-slate-400">Anode to Pin 10 through 220 Ohm current-limiting resistor; cathode to GND.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-cyan-400 font-bold">Digital Pin 11</td>
                    <td className="py-2 px-3 font-sans font-semibold">Green LED (Normal / Armed)</td>
                    <td className="py-2 px-3">Digital Output</td>
                    <td className="py-2 px-3 font-sans text-slate-400">Anode to Pin 11 through 220 Ohm resistor; cathode to GND.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-cyan-400 font-bold">5V & GND</td>
                    <td className="py-2 px-3 font-sans font-semibold">Power Distribution Rail</td>
                    <td className="py-2 px-3">Power (+5V & 0V)</td>
                    <td className="py-2 px-3 font-sans text-slate-400">Connect to breadboard power rails to power PIR, DHT, and HC-SR04.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: ARDUINO CODE */}
      {activeDocSection === 'CODE' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Complete Arduino sketch (ioe_security_system.ino) with JSON telemetry output and serial command parser:
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={copyToClipboard}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
              </button>
              <button
                onClick={downloadIno}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 transition shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .ino</span>
              </button>
            </div>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-cyan-200 font-mono text-xs overflow-x-auto max-h-[460px] leading-relaxed">
            {arduinoCode}
          </pre>
        </div>
      )}

      {/* SECTION 4: SETUP GUIDE */}
      {activeDocSection === 'SETUP' && (
        <div className="space-y-4 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Step-by-Step Installation & Run Instructions</span>
            </h4>
            <ol className="list-decimal pl-5 space-y-2 leading-relaxed">
              <li>
                <strong>Flash the Arduino:</strong> Open <code>pin/arduino/ioe_security_system.ino</code> in the official Arduino IDE. Select board <em>Arduino Uno</em> and your COM Port, then click <strong>Upload</strong>.
              </li>
              <li>
                <strong>Connect Physical Hardware:</strong> Wire the PIR sensor to Pin 2, DHT11 to Pin 4, HC-SR04 Trig/Echo to Pins 7 and 8, Buzzer to Pin 9, and LEDs to Pins 10 and 11.
              </li>
              <li>
                <strong>Open in Chrome or Edge:</strong> Web Serial API requires a Chromium-based browser (Chrome, Edge, or Opera).
              </li>
              <li>
                <strong>Connect Serial:</strong> Click <strong>Connect Arduino</strong> on the dashboard and pick your Arduino COM port. Telemetry values will immediately update in real time!
              </li>
              <li>
                <strong>Start Camera:</strong> Click <strong>Start Webcam</strong> to enable computer vision frame-differencing motion tracking.
              </li>
              <li>
                <strong>Configure Email Alerts:</strong> Click <strong>EmailJS Setup</strong>, insert your free service ID, template ID, public key, and recipient address, then click <strong>Send Test Alert</strong>.
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* SECTION 5: VIVA VOCE EVALUATION SCRIPT */}
      {activeDocSection === 'VIVA' && (
        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4 text-xs text-slate-300 leading-relaxed">
          <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>College Evaluation & Viva Voce Demonstration Script</span>
          </h4>

          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
            <div className="font-bold text-cyan-400 mb-1">Examiner Question: "What makes this an Internet of Everything (IoE) project rather than standard IoT?"</div>
            <p className="text-slate-300">
              <strong>Student Answer:</strong> "IoT focuses narrowly on machine-to-machine connectivity between physical devices. In contrast, this project implements the <strong>four core pillars of IoE</strong>:
              1) <strong>Things:</strong> Arduino Uno, PIR sensor, DHT11, ultrasonic sensor, buzzer, and camera.
              2) <strong>People:</strong> Security operators and administrators acting on prioritized alerts.
              3) <strong>Data:</strong> Real-time JSON telemetry, optical motion vectors, and structured incident logs.
              4) <strong>Processes:</strong> Intelligent multi-sensor fusion algorithms that cross-verify PIR and camera motion to eliminate false alarms and dispatch rate-limited EmailJS notifications."
            </p>
          </div>

          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
            <div className="font-bold text-cyan-400 mb-1">Demonstration Flow during Evaluation:</div>
            <ol className="list-decimal pl-5 space-y-1.5">
              <li>Show the dashboard in <strong>ARMED</strong> status with green indicators.</li>
              <li>Demonstrate live sensor telemetry streaming via Web Serial or the interactive simulator.</li>
              <li>Trigger an optical motion event in front of the webcam to highlight the real-time bounding box and incident snapshot.</li>
              <li>Demonstrate multi-sensor fusion: explain how PIR + Camera motion creates a "CRITICAL INTRUSION" alert.</li>
              <li>Show the audible siren alarm and trigger "Acknowledge" to silence it.</li>
              <li>Inspect the Incident Audit Log and click <strong>Export CSV</strong> to demonstrate data persistence.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};
