// Main Application Controller
// IoE-Based Smart Security and Intelligent Monitoring System

document.addEventListener('DOMContentLoaded', () => {
  // UI Elements
  const btnConnectSerial = document.getElementById('btnConnectSerial');
  const btnStartCamera = document.getElementById('btnStartCamera');
  const btnToggleMonitoring = document.getElementById('btnToggleMonitoring');
  const btnTriggerAlarm = document.getElementById('btnTriggerAlarm');
  const btnResetAlarm = document.getElementById('btnResetAlarm');
  const btnSimulateEvent = document.getElementById('btnSimulateEvent');
  const btnSaveEmail = document.getElementById('btnSaveEmail');
  const btnTestEmail = document.getElementById('btnTestEmail');
  const btnExportCsv = document.getElementById('btnExportCsv');

  // Status displays
  const statusSystem = document.getElementById('statusSystem');
  const statusArduino = document.getElementById('statusArduino');
  const statusCamera = document.getElementById('statusCamera');
  const statusEmail = document.getElementById('statusEmail');
  
  // Sensor displays
  const valTemp = document.getElementById('valTemp');
  const valHumidity = document.getElementById('valHumidity');
  const valMotion = document.getElementById('valMotion');
  const valDistance = document.getElementById('valDistance');
  const eventsTableBody = document.getElementById('eventsTableBody');

  const webcamVideo = document.getElementById('webcamVideo');
  const cvCanvas = document.getElementById('cvCanvas');

  // Application state
  let isMonitoring = true;
  let isAlarmActive = false;
  let events = JSON.parse(localStorage.getItem('ioe_security_events') || '[]');

  // Initialize camera manager
  window.cameraManager.init(webcamVideo, cvCanvas);

  // Load email configuration
  document.getElementById('emailServiceId').value = localStorage.getItem('ioe_email_service_id') || '';
  document.getElementById('emailTemplateId').value = localStorage.getItem('ioe_email_template_id') || '';
  document.getElementById('emailPublicKey').value = localStorage.getItem('ioe_email_public_key') || '';
  document.getElementById('emailRecipient').value = localStorage.getItem('ioe_email_recipient') || '';
  updateEmailStatus();

  // Serial callback
  window.serialManager.onStatusChangeCallback = (connected, err) => {
    if (connected) {
      statusArduino.textContent = 'CONNECTED';
      statusArduino.className = 'badge badge-green';
      btnConnectSerial.textContent = 'Disconnect Serial';
      logEvent('SYSTEM', 'Arduino Uno connected via Web Serial', 'LOW', false);
    } else {
      statusArduino.textContent = 'DISCONNECTED';
      statusArduino.className = 'badge badge-red';
      btnConnectSerial.textContent = 'Connect Arduino';
      if (err) {
        logEvent('SYSTEM', `Arduino connection error: ${err}`, 'MEDIUM', false);
      }
    }
  };

  window.serialManager.onDataCallback = (data) => {
    // Validate data object
    if (typeof data.temperature === 'number') {
      valTemp.textContent = `${data.temperature.toFixed(1)} °C`;
    }
    if (typeof data.humidity === 'number') {
      valHumidity.textContent = `${data.humidity.toFixed(1)} %`;
    }
    if (typeof data.distance === 'number') {
      valDistance.textContent = `${data.distance.toFixed(1)} cm`;
    }
    if (typeof data.motion !== 'undefined') {
      valMotion.textContent = data.motion ? 'MOTION DETECTED' : 'CLEAR';
      valMotion.className = data.motion ? 'badge badge-red' : 'badge badge-green';
    }

    // Process intelligent rules
    processSensorData(data);
  };

  // Camera callbacks
  window.cameraManager.onStatusChange = (active, err) => {
    if (active) {
      statusCamera.textContent = 'ACTIVE';
      statusCamera.className = 'badge badge-green';
      btnStartCamera.textContent = 'Stop Camera';
      logEvent('CAMERA', 'Live camera stream started with CV motion analyzer', 'LOW', false);
    } else {
      statusCamera.textContent = 'OFFLINE';
      statusCamera.className = 'badge badge-amber';
      btnStartCamera.textContent = 'Start Camera';
      if (err) {
        logEvent('CAMERA', `Camera error: ${err}`, 'MEDIUM', false);
      }
    }
  };

  window.cameraManager.onMotionDetected = (motionInfo) => {
    if (!isMonitoring) return;
    logEvent(
      'INTRUSION_CAMERA',
      `Computer Vision motion detected! Score: ${motionInfo.motionScore}% (${motionInfo.diffPixels} changed pixels)`,
      'HIGH',
      false
    );
  };

  // Connect Serial Button
  btnConnectSerial.addEventListener('click', async () => {
    if (window.serialManager.isConnected) {
      await window.serialManager.disconnect();
    } else {
      try {
        await window.serialManager.connect(9600);
      } catch (err) {
        alert('Serial connection could not be opened: ' + err.message);
      }
    }
  });

  // Start Camera Button
  btnStartCamera.addEventListener('click', async () => {
    if (window.cameraManager.isActive) {
      window.cameraManager.stopCamera();
    } else {
      try {
        await window.cameraManager.startCamera();
      } catch (err) {
        alert('Webcam could not be opened: ' + err.message);
      }
    }
  });

  // Monitoring toggle
  btnToggleMonitoring.addEventListener('click', () => {
    isMonitoring = !isMonitoring;
    if (isMonitoring) {
      statusSystem.textContent = 'ARMED & MONITORING';
      statusSystem.className = 'badge badge-green';
      btnToggleMonitoring.textContent = 'Disarm System';
      window.serialManager.sendCommand('ARM');
      logEvent('SYSTEM', 'System ARMED for security monitoring', 'LOW', false);
    } else {
      statusSystem.textContent = 'DISARMED';
      statusSystem.className = 'badge badge-amber';
      btnToggleMonitoring.textContent = 'Arm System';
      window.serialManager.sendCommand('DISARM');
      logEvent('SYSTEM', 'System DISARMED by operator', 'LOW', false);
    }
  });

  // Emergency Siren
  btnTriggerAlarm.addEventListener('click', () => {
    triggerAlarmState('MANUAL_PANIC', 'Manual panic alarm triggered by security operator', 'CRITICAL', false);
  });

  // Reset Alarm
  btnResetAlarm.addEventListener('click', () => {
    isAlarmActive = false;
    window.serialManager.sendCommand('ALARM_CLEAR');
    logEvent('SYSTEM', 'Alarm acknowledged and reset by operator', 'LOW', false);
  });

  // Simulation mode
  btnSimulateEvent.addEventListener('click', () => {
    const simTypes = [
      { type: 'PIR_MOTION', desc: 'Simulated intruder passed front PIR sensor', sev: 'HIGH' },
      { type: 'OVERHEAT', desc: 'Simulated ambient temp spike: 46.5°C detected', sev: 'HIGH' },
      { type: 'TAMPER', desc: 'Simulated ultrasonic proximity breach < 15cm', sev: 'CRITICAL' }
    ];
    const pick = simTypes[Math.floor(Math.random() * simTypes.length)];
    logEvent(pick.type, pick.desc, pick.sev, true);
  });

  // Save Email Config
  btnSaveEmail.addEventListener('click', () => {
    const sId = document.getElementById('emailServiceId').value;
    const tId = document.getElementById('emailTemplateId').value;
    const pKey = document.getElementById('emailPublicKey').value;
    const rec = document.getElementById('emailRecipient').value;
    window.emailAlertManager.saveConfig(sId, tId, pKey, rec);
    updateEmailStatus();
    alert('EmailJS settings saved successfully to browser storage.');
  });

  // Test Email
  btnTestEmail.addEventListener('click', async () => {
    if (!window.emailAlertManager.isConfigured()) {
      alert('Please fill in Service ID, Template ID, Public Key, and Recipient Email first.');
      return;
    }
    btnTestEmail.textContent = 'Sending...';
    btnTestEmail.disabled = true;

    const res = await window.emailAlertManager.sendSecurityAlert({
      id: `TEST-${Date.now()}`,
      type: 'TEST_VERIFICATION',
      severity: 'INFO',
      source: 'Operator Dashboard Manual Verification',
      timestamp: new Date().toLocaleString(),
      description: 'This is a test notification confirming your IoE Email Alerting channel works properly.',
      temperature: 24.5,
      humidity: 50.0,
      motion: false,
      distance: 120,
      isSimulated: true
    }, true);

    btnTestEmail.textContent = 'Send Test Email';
    btnTestEmail.disabled = false;

    if (res.success) {
      alert('Test email successfully sent to ' + window.emailAlertManager.recipientEmail);
    } else {
      alert('Failed to send test email: ' + res.reason);
    }
  });

  // CSV Export
  btnExportCsv.addEventListener('click', () => {
    if (!events.length) {
      alert('No events to export.');
      return;
    }
    const headers = ['ID', 'Timestamp', 'Type', 'Severity', 'Description', 'Simulated'];
    const rows = events.map(e => [
      `"${e.id}"`,
      `"${e.timestamp}"`,
      `"${e.type}"`,
      `"${e.severity}"`,
      `"${(e.description || '').replace(/"/g, '""')}"`,
      `"${e.isSimulated ? 'YES' : 'NO'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ioe_security_events_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // Intelligent Multi-Sensor Rule Engine
  function processSensorData(data) {
    if (!isMonitoring) return;

    // Rule 1: PIR Motion Trigger
    if (data.motion) {
      triggerAlarmState('PIR_MOTION', 'PIR sensor detected physical movement in protected zone', 'HIGH', false);
    }

    // Rule 2: High Temperature Alert (Fire hazard)
    if (data.temperature > 40.0) {
      triggerAlarmState('OVERHEAT_ALERT', `High temperature threshold exceeded: ${data.temperature}°C`, 'CRITICAL', false);
    }

    // Rule 3: Proximity intrusion
    if (data.distance > 0 && data.distance < 30.0) {
      triggerAlarmState('PROXIMITY_BREACH', `Ultrasonic proximity boundary breached at ${data.distance}cm`, 'HIGH', false);
    }
  }

  function triggerAlarmState(type, desc, severity, isSimulated) {
    isAlarmActive = true;
    window.serialManager.sendCommand('BUZZER_ON');
    logEvent(type, desc, severity, isSimulated);

    // Dispatch email if critical or high
    if (window.emailAlertManager.isConfigured() && (severity === 'CRITICAL' || severity === 'HIGH')) {
      window.emailAlertManager.sendSecurityAlert({
        id: `EVT-${Date.now().toString().slice(-6)}`,
        type,
        severity,
        source: 'IoE Rule Engine',
        description: desc,
        timestamp: new Date().toLocaleString(),
        isSimulated
      }).then(res => {
        if (res.success) {
          console.log('[Email Alert Sent]');
        }
      });
    }
  }

  function logEvent(type, description, severity, isSimulated) {
    const evt = {
      id: `EVT-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toLocaleTimeString(),
      type,
      description,
      severity,
      isSimulated: Boolean(isSimulated)
    };

    events.unshift(evt);
    if (events.length > 100) events.pop();
    localStorage.setItem('ioe_security_events', JSON.stringify(events));
    renderEvents();
  }

  function renderEvents() {
    eventsTableBody.innerHTML = '';
    if (!events.length) {
      eventsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #6b7280;">No security events recorded yet.</td></tr>';
      return;
    }

    for (const evt of events.slice(0, 20)) {
      const tr = document.createElement('tr');
      const sevBadge = evt.severity === 'CRITICAL' ? 'badge badge-red' :
                       evt.severity === 'HIGH' ? 'badge badge-amber' :
                       evt.severity === 'MEDIUM' ? 'badge badge-blue' : 'badge badge-green';

      tr.innerHTML = `
        <td><strong>${evt.id}</strong></td>
        <td>${evt.timestamp}</td>
        <td><span class="${sevBadge}">${evt.severity}</span> ${evt.type}</td>
        <td>${evt.description}</td>
        <td>${evt.isSimulated ? '<span class="badge badge-amber">Simulated</span>' : '<span class="badge badge-blue">Hardware</span>'}</td>
      `;
      eventsTableBody.appendChild(tr);
    }
  }

  function updateEmailStatus() {
    if (window.emailAlertManager.isConfigured()) {
      statusEmail.textContent = 'CONFIGURED';
      statusEmail.className = 'badge badge-green';
    } else {
      statusEmail.textContent = 'NOT CONFIGURED';
      statusEmail.className = 'badge badge-amber';
    }
  }

  // Initial render
  renderEvents();
});
