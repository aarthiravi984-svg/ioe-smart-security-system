// Type definitions for IoE Smart Security & Intelligent Monitoring System

export type SecuritySeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type EventSource = 
  | 'ARDUINO_PIR' 
  | 'ARDUINO_DHT' 
  | 'ARDUINO_ULTRASONIC' 
  | 'CAMERA_CV' 
  | 'RULE_ENGINE_FUSION' 
  | 'OPERATOR_ACTION' 
  | 'HARDWARE_SIMULATOR';

export interface SecurityEvent {
  id: string;
  timestamp: string; // ISO string
  formattedTime: string;
  type: string;
  severity: SecuritySeverity;
  source: EventSource;
  description: string;
  isSimulated: boolean;
  acknowledged: boolean;
  snapshotUrl?: string;
  telemetrySnapshot?: {
    temperature: number;
    humidity: number;
    distance: number;
    motion: boolean;
  };
  emailSent?: boolean;
}

export interface SensorTelemetry {
  temperature: number;      // Celsius
  humidity: number;         // Relative %
  motion: boolean;          // PIR trigger
  distance: number;         // Ultrasonic cm
  alarm: boolean;           // Arduino local buzzer status
  armed: boolean;           // Arduino armed state
  lastUpdated: number;      // Timestamp ms
  isHardwareReal: boolean;  // True if from real Web Serial, false if simulated
}

export interface EmailConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
  recipientEmail: string;
  cooldownSeconds: number;
}

export interface SecurityRuleConfig {
  tempHighThreshold: number;        // e.g. 40°C
  tempLowThreshold: number;         // e.g. 5°C
  distanceBreachThreshold: number;  // e.g. 30cm
  motionCorrelationWindow: number;  // e.g. 4 seconds
  alarmDurationSeconds: number;     // e.g. 15 seconds
  audioBuzzerMuted: boolean;
  autoEmailAlerts: boolean;
}

export interface IoELayerInfo {
  layer: number;
  name: string;
  subtitle: string;
  components: string[];
  role: string;
}

export interface DispatchedEmail {
  id: string;
  timestamp: string;
  formattedTime: string;
  to: string;
  from: string;
  subject: string;
  severity: SecuritySeverity;
  eventType: string;
  body: string;
  status: 'DELIVERED_REAL_EMAILJS' | 'DELIVERED_SIMULATED_INBOX' | 'FAILED';
  deliveryNote: string;
  telemetry?: {
    temperature: number;
    humidity: number;
    distance: number;
    motion: boolean;
  };
}
