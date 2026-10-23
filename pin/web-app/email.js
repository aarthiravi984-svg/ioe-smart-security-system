// EmailJS Alert Dispatcher Module
// IoE-Based Smart Security and Intelligent Monitoring System

class EmailAlertManager {
  constructor() {
    this.serviceId = localStorage.getItem('ioe_email_service_id') || '';
    this.templateId = localStorage.getItem('ioe_email_template_id') || '';
    this.publicKey = localStorage.getItem('ioe_email_public_key') || '';
    this.recipientEmail = localStorage.getItem('ioe_email_recipient') || '';
    this.lastAlertTime = 0;
    this.cooldownSeconds = 60; // 60s minimum interval to avoid spamming
    this.isSending = false;
  }

  // Update credentials and persist in localStorage
  saveConfig(serviceId, templateId, publicKey, recipientEmail) {
    this.serviceId = serviceId.trim();
    this.templateId = templateId.trim();
    this.publicKey = publicKey.trim();
    this.recipientEmail = recipientEmail.trim();

    localStorage.setItem('ioe_email_service_id', this.serviceId);
    localStorage.setItem('ioe_email_template_id', this.templateId);
    localStorage.setItem('ioe_email_public_key', this.publicKey);
    localStorage.setItem('ioe_email_recipient', this.recipientEmail);

    if (window.emailjs && this.publicKey) {
      window.emailjs.init(this.publicKey);
    }
  }

  isConfigured() {
    return Boolean(this.serviceId && this.templateId && this.publicKey && this.recipientEmail);
  }

  // Send an alert email for a critical security event
  async sendSecurityAlert(eventDetails, isTest = false) {
    if (!this.isConfigured()) {
      return {
        success: false,
        reason: 'EmailJS is not fully configured. Please fill in Service ID, Template ID, Public Key, and Recipient Email.'
      };
    }

    const now = Date.now();
    if (!isTest && (now - this.lastAlertTime) < (this.cooldownSeconds * 1000)) {
      const waitTime = Math.ceil((this.cooldownSeconds * 1000 - (now - this.lastAlertTime)) / 1000);
      return {
        success: false,
        throttled: true,
        reason: `Alert throttled. Cooldown active for another ${waitTime} seconds to prevent duplicate flooding.`
      };
    }

    this.isSending = true;

    const templateParams = {
      to_email: this.recipientEmail,
      title: `${eventDetails.type || 'Intrusion Alert'} (${eventDetails.severity || 'CRITICAL'})`,
      name: 'IoE Smart Security Node',
      time: eventDetails.timestamp || new Date().toLocaleTimeString(),
      email: this.recipientEmail,
      message: `
🚨 IOE SMART SECURITY ALERT: ${eventDetails.type}
Severity: ${eventDetails.severity}
Time: ${eventDetails.timestamp}
Description: ${eventDetails.description}
Temperature: ${eventDetails.temperature || 'N/A'}
Humidity: ${eventDetails.humidity || 'N/A'}
Distance: ${eventDetails.distance || 'N/A'}
Motion: ${eventDetails.motion ? 'DETECTED' : 'CLEAR'}
      `.trim(),
      event_id: eventDetails.id || `EVT-${Date.now()}`,
      event_type: eventDetails.type || 'Intrusion Alert',
      severity: eventDetails.severity || 'CRITICAL',
      source: eventDetails.source || 'Arduino Sensor + Camera Fusion',
      timestamp: eventDetails.timestamp || new Date().toLocaleString(),
      description: eventDetails.description || 'Motion or threshold breach detected in secure zone.',
      temperature: eventDetails.temperature ? `${eventDetails.temperature}°C` : 'N/A',
      humidity: eventDetails.humidity ? `${eventDetails.humidity}%` : 'N/A',
      motion: eventDetails.motion ? 'ACTIVE' : 'NONE',
      distance: eventDetails.distance ? `${eventDetails.distance} cm` : 'N/A',
      is_simulated: eventDetails.isSimulated ? 'YES (Test Mode)' : 'NO (Live Hardware)'
    };

    try {
      // If emailjs library is loaded
      if (window.emailjs) {
        const response = await window.emailjs.send(
          this.serviceId,
          this.templateId,
          templateParams,
          this.publicKey
        );
        this.lastAlertTime = Date.now();
        this.isSending = false;
        return { success: true, status: response.status, text: response.text };
      } else {
        // Direct REST fallback to EmailJS API endpoint without external script dependency
        const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: this.serviceId,
            template_id: this.templateId,
            user_id: this.publicKey,
            template_params: templateParams
          })
        });

        if (res.ok) {
          this.lastAlertTime = Date.now();
          this.isSending = false;
          return { success: true, status: 200, text: 'OK' };
        } else {
          const errText = await res.text();
          this.isSending = false;
          return { success: false, reason: `EmailJS HTTP ${res.status}: ${errText}` };
        }
      }
    } catch (error) {
      this.isSending = false;
      return { success: false, reason: error.message };
    }
  }
}

window.emailAlertManager = new EmailAlertManager();
