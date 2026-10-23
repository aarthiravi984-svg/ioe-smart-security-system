import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { CameraFeed } from './components/CameraFeed';
import { HardwareSimulator } from './components/HardwareSimulator';
import { HardwareConsole } from './components/HardwareConsole';
import { EventAuditLog } from './components/EventAuditLog';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { EmailConfigModal } from './components/EmailConfigModal';
import { SecurityMailboxModal } from './components/SecurityMailboxModal';
import { DocumentationTab } from './components/DocumentationTab';
import { TestingChecklist } from './components/TestingChecklist';

import { serialConnection } from './services/serialConnection';
import { audioAlertService } from './services/audioAlert';
import { emailAlertService } from './services/emailService';
import { 
  SensorTelemetry, 
  SecurityEvent, 
  SecuritySeverity, 
  EventSource,
  DispatchedEmail
} from './types/security';

const STORAGE_EVENTS_KEY = 'ioe_security_events_v2';

export default function App() {
  // Navigation & UI State
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'ANALYTICS' | 'HARDWARE' | 'DOCUMENTATION' | 'TESTING'>('DASHBOARD');
  const [userRole, setUserRole] = useState<'ADMIN' | 'OPERATOR'>('OPERATOR');
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isMailboxOpen, setIsMailboxOpen] = useState(false);
  const [mailboxEmails, setMailboxEmails] = useState<DispatchedEmail[]>(() => emailAlertService.getMailbox());
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Security Guard State
  const [isArmed, setIsArmed] = useState(true);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [isHardwareSimulated, setIsHardwareSimulated] = useState(true);
  const [arduinoConnected, setArduinoConnected] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraMotionDetected, setCameraMotionDetected] = useState(false);
  const [emailConfigured, setEmailConfigured] = useState(emailAlertService.isConfigured());
  const [emailCount, setEmailCount] = useState(0);

  // Real-Time Sensor Telemetry
  const [telemetry, setTelemetry] = useState<SensorTelemetry>({
    temperature: 24.8,
    humidity: 52.4,
    motion: false,
    distance: 145.0,
    alarm: false,
    armed: true,
    lastUpdated: Date.now(),
    isHardwareReal: false
  });

  // Telemetry History for Analytics
  const [telemetryHistory, setTelemetryHistory] = useState<Array<{ time: string; temp: number; dist: number; motion: boolean }>>([
    { time: '10:00:00', temp: 24.2, dist: 150, motion: false },
    { time: '10:00:05', temp: 24.4, dist: 148, motion: false },
    { time: '10:00:10', temp: 24.5, dist: 145, motion: false },
    { time: '10:00:15', temp: 24.8, dist: 145, motion: false },
  ]);

  // Event Log State
  const [events, setEvents] = useState<SecurityEvent[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_EVENTS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse stored events', e);
    }
    return [
      {
        id: 'EVT-INIT-01',
        timestamp: new Date().toISOString(),
        formattedTime: new Date().toLocaleTimeString(),
        type: 'SYSTEM_BOOT',
        severity: 'INFO',
        source: 'OPERATOR_ACTION',
        description: 'IoE Smart Security Node initialized in ARMED monitoring mode.',
        isSimulated: true,
        acknowledged: true,
        telemetrySnapshot: {
          temperature: 24.8,
          humidity: 52.4,
          distance: 145.0,
          motion: false
        }
      }
    ];
  });

  // Cooldown & Correlation references
  const lastPirMotionTimeRef = useRef<number>(0);
  const lastAlarmTriggerTimeRef = useRef<number>(0);
  const toastTimeoutRef = useRef<any>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // Subscribe to Mailbox updates
  useEffect(() => {
    const unsub = emailAlertService.onMailboxUpdate((mails) => {
      setMailboxEmails(mails);
    });
    // If mailbox is currently empty, seed with initial welcome security report
    if (emailAlertService.getMailbox().length === 0) {
      emailAlertService.sendAlert({
        id: 'SYS-WELCOME',
        timestamp: new Date().toISOString(),
        formattedTime: new Date().toLocaleTimeString(),
        type: 'SYSTEM_ONLINE_REPORT',
        severity: 'INFO',
        source: 'OPERATOR_ACTION',
        description: 'IoE Smart Security Node successfully booted and initialized with active perimeter monitoring.',
        isSimulated: true,
        acknowledged: true,
        telemetrySnapshot: {
          temperature: 24.8,
          humidity: 52.4,
          distance: 145.0,
          motion: false
        }
      }, true);
    }
    return unsub;
  }, []);

  // Log Security Event
  const logEvent = useCallback((
    type: string,
    description: string,
    severity: SecuritySeverity,
    source: EventSource,
    isSimulated: boolean,
    snapshotUrl?: string
  ) => {
    const newEvent: SecurityEvent = {
      id: `EVT-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      formattedTime: new Date().toLocaleTimeString(),
      type,
      severity,
      source,
      description,
      isSimulated,
      acknowledged: false,
      snapshotUrl,
      telemetrySnapshot: {
        temperature: telemetry.temperature,
        humidity: telemetry.humidity,
        distance: telemetry.distance,
        motion: telemetry.motion
      }
    };

    setEvents(prev => [newEvent, ...prev.slice(0, 150)]);

    // Trigger alert dispatch if critical or high
    if (severity === 'CRITICAL' || severity === 'HIGH') {
      emailAlertService.sendAlert(newEvent).then(res => {
        if (res.success) {
          setEmailCount(c => c + 1);
          showToast(res.isVirtual 
            ? `📬 Security Alert saved in Mailbox for aarthiravi984@gmail.com` 
            : `Email alert dispatched to ${emailAlertService.getConfig().recipientEmail}`);
        } else if (res.throttled) {
          console.log('[Email Throttled]', res.message);
        }
      });
    }

    return newEvent;
  }, [telemetry, showToast]);

  // Trigger Critical Alarm State (Siren + Red Alert Banner + Hardware Buzzer)
  const triggerAlarm = useCallback((reason: string, severity: SecuritySeverity, source: EventSource, snapshotUrl?: string) => {
    setIsAlarmActive(true);
    audioAlertService.startSiren();
    serialConnection.sendCommand('BUZZER_ON');

    logEvent('ALARM_TRIGGERED', reason, severity, source, isHardwareSimulated, snapshotUrl);
  }, [logEvent, isHardwareSimulated]);

  // Multi-Sensor Fusion Rule Engine
  const evaluateSecurityRules = useCallback((data: Partial<SensorTelemetry>, source: EventSource) => {
    if (!isArmed) return;

    const now = Date.now();
    // Rule 1: PIR Motion Detection
    if (data.motion) {
      lastPirMotionTimeRef.current = now;
      // If camera also triggered motion recently (< 4s), this is a verified intrusion
      const cameraMotionRecent = cameraMotionDetected;
      if (cameraMotionRecent) {
        triggerAlarm(
          'VERIFIED HIGH-CONFIDENCE INTRUSION: Optical camera motion and PIR hardware motion simultaneously confirmed.',
          'CRITICAL',
          'RULE_ENGINE_FUSION'
        );
      } else {
        triggerAlarm(
          'Physical movement detected by HC-SR501 PIR sensor in protected boundary.',
          'HIGH',
          source
        );
      }
    }

    // Rule 2: Thermal / Fire Hazard
    if (typeof data.temperature === 'number' && data.temperature >= 40.0) {
      if (now - lastAlarmTriggerTimeRef.current > 5000) {
        lastAlarmTriggerTimeRef.current = now;
        triggerAlarm(
          `THERMAL OVERHEAT HAZARD: Ambient temperature spiked to ${data.temperature.toFixed(1)}°C (Threshold: 40°C).`,
          'CRITICAL',
          source
        );
      }
    }

    // Rule 3: Ultrasonic Perimeter Breach (< 30cm)
    if (typeof data.distance === 'number' && data.distance > 0 && data.distance <= 30.0) {
      if (now - lastAlarmTriggerTimeRef.current > 4000) {
        lastAlarmTriggerTimeRef.current = now;
        triggerAlarm(
          `PERIMETER BREACH: Target within ${data.distance.toFixed(0)}cm of ultrasonic boundary (Threshold: 30cm).`,
          'HIGH',
          source
        );
      }
    }
  }, [isArmed, cameraMotionDetected, triggerAlarm]);

  // Handle Incoming Web Serial Data from Real Arduino
  useEffect(() => {
    const unsubData = serialConnection.onData((packet) => {
      setArduinoConnected(true);
      setIsHardwareSimulated(false);

      setTelemetry(prev => {
        const next: SensorTelemetry = {
          ...prev,
          temperature: packet.temperature ?? prev.temperature,
          humidity: packet.humidity ?? prev.humidity,
          motion: packet.motion ?? prev.motion,
          distance: packet.distance ?? prev.distance,
          alarm: packet.alarm ?? prev.alarm,
          armed: packet.armed ?? prev.armed,
          lastUpdated: Date.now(),
          isHardwareReal: true
        };

        // Record history
        setTelemetryHistory(h => [
          ...h.slice(-19),
          {
            time: new Date().toLocaleTimeString(),
            temp: next.temperature,
            dist: next.distance,
            motion: next.motion
          }
        ]);

        return next;
      });

      evaluateSecurityRules(packet as any, 'ARDUINO_PIR');
    });

    const unsubStatus = serialConnection.onStatus((connected) => {
      setArduinoConnected(connected);
      if (connected) {
        setIsHardwareSimulated(false);
        showToast('Connected to physical Arduino Uno via Web Serial.');
      }
    });

    return () => {
      unsubData();
      unsubStatus();
    };
  }, [evaluateSecurityRules, showToast]);

  // Simulation Telemetry Ticker (Runs small realistic fluctuations when in simulation mode)
  useEffect(() => {
    if (!isHardwareSimulated || arduinoConnected) return;

    const interval = setInterval(() => {
      setTelemetry(prev => {
        // Small organic drift
        const tempDrift = (Math.random() - 0.5) * 0.2;
        const humDrift = (Math.random() - 0.5) * 0.3;
        const distDrift = (Math.random() - 0.5) * 1.0;

        const nextTemp = Number(Math.max(15, Math.min(60, prev.temperature + tempDrift)).toFixed(1));
        const nextHum = Number(Math.max(20, Math.min(95, prev.humidity + humDrift)).toFixed(1));
        const nextDist = Number(Math.max(5, Math.min(250, prev.distance + distDrift)).toFixed(1));

        const next: SensorTelemetry = {
          ...prev,
          temperature: nextTemp,
          humidity: nextHum,
          distance: nextDist,
          lastUpdated: Date.now(),
          isHardwareReal: false
        };

        setTelemetryHistory(h => [
          ...h.slice(-19),
          {
            time: new Date().toLocaleTimeString(),
            temp: next.temperature,
            dist: next.distance,
            motion: next.motion
          }
        ]);

        return next;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isHardwareSimulated, arduinoConnected]);

  // Camera Motion Detection Handler
  const handleCameraMotionDetected = useCallback((snapshotDataUrl: string, motionScore: number) => {
    setCameraMotionDetected(true);
    setTimeout(() => setCameraMotionDetected(false), 2000);

    if (!isArmed) return;

    // Check if PIR motion occurred within last 4 seconds
    const pirRecentlyTriggered = Date.now() - lastPirMotionTimeRef.current < 4000;

    if (pirRecentlyTriggered) {
      triggerAlarm(
        `DUAL-SENSOR INTRUSION VERIFIED: Camera CV Optical (${motionScore}%) + PIR sensor simultaneously triggered.`,
        'CRITICAL',
        'RULE_ENGINE_FUSION',
        snapshotDataUrl
      );
    } else {
      triggerAlarm(
        `OPTICAL MOTION DETECTED: Camera computer vision identified active movement (${motionScore}% changed pixels).`,
        'HIGH',
        'CAMERA_CV',
        snapshotDataUrl
      );
    }
  }, [isArmed, triggerAlarm]);

  // Arm / Disarm Toggle
  const handleToggleArm = () => {
    if (isArmed) {
      // Disarm
      setIsArmed(false);
      setIsAlarmActive(false);
      audioAlertService.stopSiren();
      audioAlertService.playDisarmSound();
      serialConnection.sendCommand('DISARM');
      logEvent('SYSTEM_DISARMED', 'System disarmed by operator. Sensor monitoring active in audit-only mode.', 'LOW', 'OPERATOR_ACTION', isHardwareSimulated);
      showToast('System Disarmed.');
    } else {
      // Arm
      setIsArmed(true);
      audioAlertService.playArmSound();
      serialConnection.sendCommand('ARM');
      logEvent('SYSTEM_ARMED', 'System ARMED by operator. Autonomous multi-sensor fusion active.', 'LOW', 'OPERATOR_ACTION', isHardwareSimulated);
      showToast('System Armed and Guarding.');
    }
  };

  // Trigger Panic Alarm
  const handleTriggerPanic = () => {
    triggerAlarm('MANUAL PANIC SIREN ACTIVATED: Security operator manually raised alert.', 'CRITICAL', 'OPERATOR_ACTION');
    showToast('Manual Panic Siren Activated!');
  };

  // Clear / Silence Alarm
  const handleClearAlarm = () => {
    setIsAlarmActive(false);
    audioAlertService.stopSiren();
    serialConnection.sendCommand('ALARM_CLEAR');
    logEvent('ALARM_ACKNOWLEDGED', 'Alarm silenced and acknowledged by operator.', 'LOW', 'OPERATOR_ACTION', isHardwareSimulated);
    showToast('Alarm silenced and reset.');
  };

  // Toggle Audio Mute
  const handleToggleMute = () => {
    const nextMuted = !isAudioMuted;
    setIsAudioMuted(nextMuted);
    audioAlertService.setMuted(nextMuted);
    showToast(nextMuted ? 'Audio Alerts Muted' : 'Audio Alerts Unmuted');
  };

  // Update Telemetry from Simulator
  const handleUpdateSimTelemetry = (partial: Partial<SensorTelemetry>) => {
    setTelemetry(prev => {
      const next = { ...prev, ...partial, lastUpdated: Date.now() };
      evaluateSecurityRules(partial, 'HARDWARE_SIMULATOR');
      return next;
    });
  };

  // Acknowledge Individual Event
  const handleAcknowledgeEvent = (id: string) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, acknowledged: true } : e));
    showToast(`Event ${id} acknowledged.`);
  };

  // Clear All Events
  const handleClearEvents = () => {
    if (window.confirm('Clear all security events from session history?')) {
      setEvents([]);
      localStorage.removeItem(STORAGE_EVENTS_KEY);
      showToast('Event history cleared.');
    }
  };

  // Test scenario trigger from checklist
  const handleTriggerTestScenario = (chkId: string) => {
    switch (chkId) {
      case 'chk-6':
        handleUpdateSimTelemetry({ motion: true });
        break;
      case 'chk-7':
        setIsEmailModalOpen(true);
        break;
      case 'chk-11':
        handleToggleArm();
        break;
      default:
        showToast('Verification test step executed.');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-800 border border-cyan-500/80 text-cyan-200 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header & Sub-Navigation */}
      <Header
        isArmed={isArmed}
        isAlarmActive={isAlarmActive}
        isHardwareSimulated={isHardwareSimulated}
        arduinoConnected={arduinoConnected}
        cameraActive={cameraActive}
        emailConfigured={emailConfigured}
        userRole={userRole}
        isAudioMuted={isAudioMuted}
        activeTab={activeTab}
        onToggleArm={handleToggleArm}
        onTriggerPanic={handleTriggerPanic}
        onClearAlarm={handleClearAlarm}
        onToggleMute={handleToggleMute}
        onChangeRole={setUserRole}
        onToggleSimulator={() => setIsHardwareSimulated(!isHardwareSimulated)}
        onChangeTab={setActiveTab}
        onOpenEmailConfig={() => setIsEmailModalOpen(true)}
        mailboxCount={mailboxEmails.length}
        onOpenMailbox={() => setIsMailboxOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Metric Cards: Always visible across tabs for constant situational awareness */}
        <MetricCards
          telemetry={telemetry}
          events={events}
          isArmed={isArmed}
          isSimulated={isHardwareSimulated}
          cameraMotionDetected={cameraMotionDetected}
          emailCount={emailCount}
        />

        {/* TAB 1: LIVE MONITORING DASHBOARD */}
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Live Camera Surveillance & Computer Vision */}
              <CameraFeed
                isArmed={isArmed}
                onMotionDetected={handleCameraMotionDetected}
                onCameraStatusChange={setCameraActive}
              />

              {/* Right Column: Virtual Hardware Simulator or Web Serial Quick Panel */}
              <div className="space-y-6">
                <HardwareSimulator
                  telemetry={telemetry}
                  onUpdateSimTelemetry={handleUpdateSimTelemetry}
                  isArmed={isArmed}
                  isAlarmActive={isAlarmActive}
                />
              </div>
            </div>

            {/* Bottom Row: Recent Incident Audit Stream */}
            <EventAuditLog
              events={events}
              onAcknowledgeEvent={handleAcknowledgeEvent}
              onClearEvents={handleClearEvents}
            />
          </div>
        )}

        {/* TAB 2: INCIDENT ANALYTICS & AUDIT LOG */}
        {activeTab === 'ANALYTICS' && (
          <div className="space-y-6">
            <AnalyticsCharts
              events={events}
              telemetryHistory={telemetryHistory}
            />

            <EventAuditLog
              events={events}
              onAcknowledgeEvent={handleAcknowledgeEvent}
              onClearEvents={handleClearEvents}
            />
          </div>
        )}

        {/* TAB 3: HARDWARE & WEB SERIAL CONSOLE */}
        {activeTab === 'HARDWARE' && (
          <div className="space-y-6">
            <HardwareConsole
              arduinoConnected={arduinoConnected}
              onRefreshStatus={() => setArduinoConnected(serialConnection.getIsConnected())}
            />

            <HardwareSimulator
              telemetry={telemetry}
              onUpdateSimTelemetry={handleUpdateSimTelemetry}
              isArmed={isArmed}
              isAlarmActive={isAlarmActive}
            />
          </div>
        )}

        {/* TAB 4: IOE ARCHITECTURE & CIRCUIT SCHEMATIC */}
        {activeTab === 'DOCUMENTATION' && (
          <DocumentationTab />
        )}

        {/* TAB 5: TESTING & COLLEGE EVALUATION PROTOCOL */}
        {activeTab === 'TESTING' && (
          <TestingChecklist
            onTriggerTestScenario={handleTriggerTestScenario}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 text-slate-500 text-xs py-4 px-6 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            IoE Smart Security & Intelligent Monitoring System • Arduino Uno & Web Serial & MediaDevices & EmailJS
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            Internet of Everything Architecture (People • Things • Data • Processes)
          </span>
        </div>
      </footer>

      {/* Email Configuration Modal */}
      <EmailConfigModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        onConfigSaved={() => {
          setEmailConfigured(emailAlertService.isConfigured());
          setIsEmailModalOpen(false);
          showToast('EmailJS configuration updated.');
        }}
      />

      {/* Security Mailbox Modal (Received Alerts Viewer) */}
      <SecurityMailboxModal
        isOpen={isMailboxOpen}
        onClose={() => setIsMailboxOpen(false)}
        emails={mailboxEmails}
        onOpenSettings={() => {
          setIsMailboxOpen(false);
          setIsEmailModalOpen(true);
        }}
        onSendTest={() => {
          emailAlertService.sendAlert({
            id: `MANUAL-${Date.now().toString().slice(-4)}`,
            timestamp: new Date().toISOString(),
            formattedTime: new Date().toLocaleTimeString(),
            type: 'SECURITY_TEST_ALERT',
            severity: 'HIGH',
            source: 'OPERATOR_ACTION',
            description: 'Manual verification test dispatched by security operator for aarthiravi984@gmail.com.',
            isSimulated: true,
            acknowledged: false,
            telemetrySnapshot: {
              temperature: telemetry.temperature,
              humidity: telemetry.humidity,
              distance: telemetry.distance,
              motion: true
            }
          }, true).then(res => {
            showToast(res.message);
          });
        }}
      />
    </div>
  );
}
