# Internet of Everything (IoE)-Based Smart Security and Intelligent Monitoring System

## 1. Project Abstract
Modern security paradigms necessitate moving beyond isolated IoT devices to an integrated **Internet of Everything (IoE)** ecosystem where **People**, **Things**, **Data**, and **Processes** collaborate autonomously. This college capstone project develops an intelligent multi-sensor perimeter defense and environmental monitoring system. An Arduino Uno microcontroller captures real-time physical telemetry (HC-SR501 PIR motion sensor, DHT11 temperature/humidity sensor, HC-SR04 ultrasonic rangefinder, piezo buzzer, and dual status LEDs) and transmits structured RFC8259 JSON packets across the W3C Web Serial API to a unified web dashboard. 

The dashboard integrates real-time optical surveillance with an in-browser luminance frame-differencing Computer Vision motion detector. An intelligent multi-sensor fusion engine cross-verifies PIR infrared detection with optical camera movement to eliminate false alarms, automatically activates physical and synthesized audio sirens, captures evidence snapshots, records immutable audit trails with CSV export, and dispatches rate-limited alerts via EmailJS.

---

## 2. Project Architecture & The 4 Pillars of IoE

### The 4 Pillars of IoE
1. **Things (Physical Layer):**
   - Arduino Uno microcontroller board.
   - HC-SR501 Passive Infrared (PIR) motion sensor on Pin 2.
   - DHT11 / DHT22 temperature and humidity sensor on Pin 4.
   - HC-SR04 Ultrasonic rangefinder (Trig Pin 7, Echo Pin 8).
   - Piezoelectric buzzer on Pin 9.
   - Red (Alarm) LED on Pin 10, Green (Armed/Normal) LED on Pin 11.
   - High-definition USB camera / webcam.
2. **People (Human-in-the-Loop):**
   - Security Operators and Facility Administrators.
   - Multi-role dashboard with acknowledge/resolve workflows.
   - Real-time Email notifications to designated security personnel.
3. **Data (Telemetry & Evidence):**
   - Real-time JSON telemetry: `{"temperature": 24.5, "humidity": 55.0, "motion": true, "distance": 120.0, "alarm": false}`.
   - Optical pixel differential heatmaps and target bounding boxes.
   - Incident snapshots stored as evidence.
   - Chronological audit logs with CSV export.
4. **Processes (Rule Engine & Automation):**
   - Dual-sensor fusion: PIR Motion + Optical Camera Motion within 4s = **CRITICAL INTRUSION**.
   - Thermal hazard rule: Temperature ≥ 40.0°C = **FIRE/OVERHEAT ALARM**.
   - Perimeter proximity breach: Ultrasonic distance ≤ 30cm while armed.
   - Cooldown throttling: Prevents email notification flooding during ongoing incidents.

### 5-Layer Architectural Stack
- **Layer 5 (People & Services):** Security operator, administrator, EmailJS notification delivery.
- **Layer 4 (Application & Visualization):** Reactive dashboard, telemetry gauges, interactive test bench, CSV export.
- **Layer 3 (Data Processing & Fusion):** Computer vision frame differencing, multi-sensor correlation engine.
- **Layer 2 (Connectivity & Transport):** W3C Web Serial API (9600 baud), MediaDevices WebRTC video stream.
- **Layer 1 (Perception & Actuation):** Physical sensors, buzzer, and dual LEDs.

---

## 3. Hardware Circuit & Pin Mapping Table

| Component | Arduino Pin | Signal Type | Connection Notes |
| :--- | :--- | :--- | :--- |
| **PIR Motion Sensor (HC-SR501)** | Digital Pin 2 | Digital Input | VCC to 5V, GND to GND, Jumper on 'H' (Repeat Trigger) |
| **DHT11 / DHT22 Sensor** | Digital Pin 4 | 1-Wire Digital | VCC to 5V, GND to GND, 10kΩ pull-up resistor |
| **HC-SR04 Ultrasonic Trig** | Digital Pin 7 | Digital Output | 10μs trigger pulse |
| **HC-SR04 Ultrasonic Echo** | Digital Pin 8 | Digital Input | Measures round-trip sound duration |
| **Active Buzzer** | Digital Pin 9 | Digital Output / PWM | Positive to Pin 9, negative to GND |
| **Red Security LED** | Digital Pin 10 | Digital Output | Anode via 220Ω resistor, cathode to GND |
| **Green Normal LED** | Digital Pin 11 | Digital Output | Anode via 220Ω resistor, cathode to GND |
| **Power Distribution** | 5V & GND | Power Rail | Breadboard power distribution rails |

---

## 4. Project File Structure
```
/
├── pin/
│   ├── arduino/
│   │   └── ioe_security_system.ino     # Complete Arduino C++ sketch
│   └── web-app/
│       ├── index.html                  # Standalone HTML dashboard
│       ├── app.js                      # Vanilla JS controller & rule engine
│       ├── camera.js                   # Computer vision motion detection
│       ├── email.js                    # EmailJS notification client
│       ├── serial.js                   # Web Serial API manager
│       └── style.css                   # Dark theme responsive dashboard CSS
├── src/                                # Modern React + Tailwind + TypeScript app
│   ├── components/
│   │   ├── Header.tsx                  # System status, arm/disarm, panic siren
│   │   ├── MetricCards.tsx             # Real-time telemetry cards
│   │   ├── CameraFeed.tsx              # Webcam CV frame differencing & snapshots
│   │   ├── HardwareSimulator.tsx       # Virtual Arduino & sensor test bench
│   │   ├── HardwareConsole.tsx         # Web Serial terminal & command console
│   │   ├── EventAuditLog.tsx           # Searchable incident log with CSV export
│   │   ├── AnalyticsCharts.tsx         # Severity & telemetry charts
│   │   ├── EmailConfigModal.tsx        # EmailJS credentials & cooldown settings
│   │   ├── DocumentationTab.tsx        # In-app architecture, circuit & viva guide
│   │   └── TestingChecklist.tsx        # Interactive evaluation protocol
│   ├── services/
│   │   ├── audioAlert.ts               # Web Audio API siren synthesizer
│   │   ├── serialConnection.ts         # Robust Web Serial API driver
│   │   └── emailService.ts             # EmailJS alert dispatcher
│   └── types/
│       └── security.ts                 # TypeScript type interfaces
└── README.md                           # Master project guide
```

---

## 5. Step-by-Step Setup Instructions

### Hardware Setup
1. Mount the Arduino Uno on a breadboard.
2. Wire the sensors and LEDs according to the pin mapping table in Section 3.
3. Plug the Arduino Uno into your computer via a USB cable.

### Flashing the Arduino
1. Download and open the **Arduino IDE** (v2.x or v1.8.x).
2. Open `pin/arduino/ioe_security_system.ino`.
3. In the menu, go to **Tools** -> **Board** -> **Arduino Uno**.
4. In **Tools** -> **Port**, select your Arduino COM port (e.g. `COM3` on Windows or `/dev/ttyUSB0` on Linux/macOS).
5. Click the **Upload** button (Arrow icon). The green LED on Pin 11 will illuminate and a chirp will sound.

### Running the Web Dashboard Locally
1. Ensure Node.js (v18+) is installed.
2. Run development server:
   ```bash
   npm run dev
   ```
3. Open **Google Chrome** or **Microsoft Edge** at `http://localhost:3000`. *(Chromium is required for the Web Serial API)*.
4. Click **Connect Arduino** in the header or Hardware tab, select your Arduino COM port, and click **Connect**.
5. Click **Start Webcam** to activate computer vision motion tracking.
6. Configure EmailJS by clicking **EmailJS: Setup** and entering your free EmailJS Service ID, Template ID, and Public Key.
