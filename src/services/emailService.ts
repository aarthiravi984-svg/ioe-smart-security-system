// EmailJS Alert Service
// Manages alert delivery, credential validation, cooldown rate-limiting, and template formatting

import emailjs from '@emailjs/browser';
import { EmailConfig, SecurityEvent, DispatchedEmail } from '../types/security';

const DEFAULT_CONFIG_KEY = 'ioe_email_config_v2';
const MAILBOX_KEY = 'ioe_security_mailbox_v2';

export class EmailAlertService {
  private config: EmailConfig = {
    serviceId: '',
    templateId: '',
    publicKey: '',
    recipientEmail: 'aarthiravi984@gmail.com',
    cooldownSeconds: 60
  };

  private lastSentTime = 0;
  private lastSentEventId = '';
  private mailbox: DispatchedEmail[] = [];
  private listeners: ((emails: DispatchedEmail[]) => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(DEFAULT_CONFIG_KEY);
      if (stored) {
        this.config = { ...this.config, ...JSON.parse(stored) };
      }
      const storedMails = localStorage.getItem(MAILBOX_KEY);
      if (storedMails) {
        this.mailbox = JSON.parse(storedMails);
      }
    } catch (e) {
      console.warn('Failed to load email config from localStorage', e);
    }
  }

  public getConfig(): EmailConfig {
    return { ...this.config };
  }

  public getMailbox(): DispatchedEmail[] {
    return [...this.mailbox];
  }

  public onMailboxUpdate(cb: (emails: DispatchedEmail[]) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(cb => cb(this.getMailbox()));
  }

  public saveConfig(cfg: Partial<EmailConfig>) {
    this.config = { ...this.config, ...cfg };
    try {
      localStorage.setItem(DEFAULT_CONFIG_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.warn('Failed to save email config to localStorage', e);
    }
  }

  public clearMailbox() {
    this.mailbox = [];
    localStorage.removeItem(MAILBOX_KEY);
    this.notifyListeners();
  }

  public isConfigured(): boolean {
    return Boolean(
      this.config.serviceId.trim() &&
      this.config.templateId.trim() &&
      this.config.publicKey.trim() &&
      this.config.recipientEmail.trim()
    );
  }

  // Send an alert notification
  public async sendAlert(
    event: SecurityEvent,
    isManualTest = false
  ): Promise<{ success: boolean; message: string; throttled?: boolean; isVirtual?: boolean }> {
    const now = Date.now();
    const recipient = this.config.recipientEmail || 'aarthiravi984@gmail.com';

    // Cooldown check unless it's an explicit manual test
    if (!isManualTest) {
      if (this.lastSentEventId === event.id) {
        return {
          success: false,
          throttled: true,
          message: 'Suppressed duplicate notification for identical event ID.'
        };
      }

      const elapsed = (now - this.lastSentTime) / 1000;
      if (elapsed < this.config.cooldownSeconds) {
        const remaining = Math.ceil(this.config.cooldownSeconds - elapsed);
        return {
          success: false,
          throttled: true,
          message: `Email alert throttled to prevent spam. Cooldown active for another ${remaining}s.`
        };
      }
    }

    const formattedBody = `
======================================================
🚨 IOE SMART SECURITY ALERT: ${event.type}
======================================================
Date & Time: ${event.formattedTime || new Date().toLocaleString()}
Incident ID: ${event.id}
Severity Level: ${event.severity}
Detection Source: ${event.source}

INCIDENT SUMMARY:
${event.description}

REAL-TIME SENSOR TELEMETRY AT TIME OF INCIDENT:
- Ambient Temperature : ${event.telemetrySnapshot?.temperature !== undefined ? `${event.telemetrySnapshot.temperature}°C` : 'N/A'}
- Relative Humidity   : ${event.telemetrySnapshot?.humidity !== undefined ? `${event.telemetrySnapshot.humidity}%` : 'N/A'}
- Ultrasonic Distance : ${event.telemetrySnapshot?.distance !== undefined ? `${event.telemetrySnapshot.distance} cm` : 'N/A'}
- PIR Motion Sensor   : ${event.telemetrySnapshot?.motion ? 'DETECTED' : 'CLEAR'}
- Environment Mode    : ${event.isSimulated ? 'Simulated Virtual Test' : 'Physical Hardware Device'}

SECURITY PROTOCOL ACTION:
1. Review live surveillance video stream immediately.
2. Acknowledge or silence siren in IoE dashboard.
======================================================
`.trim();

    const templateParams: Record<string, string> = {
      // Standard Contact Us template fields in EmailJS (matching user's template variables)
      title: `${event.type} (${event.severity})`,
      name: 'IoE Smart Security System',
      time: event.formattedTime || new Date().toLocaleTimeString(),
      email: recipient,
      message: formattedBody,
      from_name: 'IoE Smart Security Node',
      to_name: 'Security Officer',
      reply_to: recipient,
      subject: `🚨 [${event.severity}] ${event.type} - IoE Security Node`,

      // Detailed individual fields if custom template is used
      to_email: recipient,
      event_id: event.id,
      event_type: event.type,
      severity: event.severity,
      source: event.source,
      timestamp: event.formattedTime || new Date().toLocaleString(),
      description: event.description,
      temperature: event.telemetrySnapshot?.temperature !== undefined ? `${event.telemetrySnapshot.temperature}°C` : 'N/A',
      humidity: event.telemetrySnapshot?.humidity !== undefined ? `${event.telemetrySnapshot.humidity}%` : 'N/A',
      distance: event.telemetrySnapshot?.distance !== undefined ? `${event.telemetrySnapshot.distance} cm` : 'N/A',
      motion: event.telemetrySnapshot?.motion ? 'DETECTED' : 'CLEAR',
    };

    // Case 1: Real EmailJS credentials provided
    if (this.isConfigured()) {
      try {
        await emailjs.send(
          this.config.serviceId.trim(),
          this.config.templateId.trim(),
          templateParams,
          this.config.publicKey.trim()
        );

        this.lastSentTime = now;
        this.lastSentEventId = event.id;

        const dispatched: DispatchedEmail = {
          id: `MAIL-${Date.now().toString().slice(-6)}`,
          timestamp: new Date().toISOString(),
          formattedTime: new Date().toLocaleTimeString(),
          to: recipient,
          from: 'ioe-security-node@gateway.local',
          subject: `🚨 [${event.severity}] ${event.type} - IoE Security Node`,
          severity: event.severity,
          eventType: event.type,
          body: formattedBody,
          status: 'DELIVERED_REAL_EMAILJS',
          deliveryNote: `Dispatched to external Gmail (${recipient}) via EmailJS service ${this.config.serviceId}`,
          telemetry: event.telemetrySnapshot
        };

        this.mailbox.unshift(dispatched);
        localStorage.setItem(MAILBOX_KEY, JSON.stringify(this.mailbox.slice(0, 50)));
        this.notifyListeners();

        return {
          success: true,
          message: `Alert dispatched successfully to ${recipient} via EmailJS!`
        };
      } catch (err: any) {
        console.error('EmailJS send failure:', err);
        return {
          success: false,
          message: `EmailJS error: ${err.text || err.message || 'Check your Service ID / Template ID / Public Key'}`
        };
      }
    } else {
      // Case 2: EmailJS keys not entered yet -> deliver to in-app Security Mailbox
      this.lastSentTime = now;
      this.lastSentEventId = event.id;

      const dispatched: DispatchedEmail = {
        id: `MAIL-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        formattedTime: new Date().toLocaleTimeString(),
        to: recipient,
        from: 'ioe-security-node@gateway.local',
        subject: `🚨 [${event.severity}] ${event.type} - IoE Security Node`,
        severity: event.severity,
        eventType: event.type,
        body: formattedBody,
        status: 'DELIVERED_SIMULATED_INBOX',
        deliveryNote: `Saved to Security Mailbox for ${recipient}. (Add free EmailJS keys to also receive it on your physical phone/Gmail!)`,
        telemetry: event.telemetrySnapshot
      };

      this.mailbox.unshift(dispatched);
      localStorage.setItem(MAILBOX_KEY, JSON.stringify(this.mailbox.slice(0, 50)));
      this.notifyListeners();

      return {
        success: true,
        isVirtual: true,
        message: `Security Email delivered to Security Mailbox for ${recipient}! (Add EmailJS keys to also send to real Gmail inbox)`
      };
    }
  }
}

export const emailAlertService = new EmailAlertService();
