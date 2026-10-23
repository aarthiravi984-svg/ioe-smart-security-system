import React from 'react';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  BellOff, 
  AlertTriangle, 
  UserCheck, 
  Cpu, 
  Camera, 
  Mail,
  Sliders
} from 'lucide-react';
import { audioAlertService } from '../services/audioAlert';

interface HeaderProps {
  isArmed: boolean;
  isAlarmActive: boolean;
  isHardwareSimulated: boolean;
  arduinoConnected: boolean;
  cameraActive: boolean;
  emailConfigured: boolean;
  userRole: 'ADMIN' | 'OPERATOR';
  isAudioMuted: boolean;
  activeTab: 'DASHBOARD' | 'ANALYTICS' | 'HARDWARE' | 'DOCUMENTATION' | 'TESTING';
  onToggleArm: () => void;
  onTriggerPanic: () => void;
  onClearAlarm: () => void;
  onToggleMute: () => void;
  onChangeRole: (role: 'ADMIN' | 'OPERATOR') => void;
  onToggleSimulator: () => void;
  onChangeTab: (tab: 'DASHBOARD' | 'ANALYTICS' | 'HARDWARE' | 'DOCUMENTATION' | 'TESTING') => void;
  onOpenEmailConfig: () => void;
  mailboxCount: number;
  onOpenMailbox: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isArmed,
  isAlarmActive,
  isHardwareSimulated,
  arduinoConnected,
  cameraActive,
  emailConfigured,
  userRole,
  isAudioMuted,
  activeTab,
  onToggleArm,
  onTriggerPanic,
  onClearAlarm,
  onToggleMute,
  onChangeRole,
  onToggleSimulator,
  onChangeTab,
  onOpenEmailConfig,
  mailboxCount,
  onOpenMailbox
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 backdrop-blur-md bg-opacity-95 shadow-xl">
      {/* Top Banner if Alarm is Active */}
      {isAlarmActive && (
        <div className="bg-red-600 text-white font-bold py-2 px-4 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span>CRITICAL SECURITY ALARM TRIGGERED! INTRUSION OR HAZARD IN PROGRESS</span>
          </div>
          <button
            onClick={onClearAlarm}
            className="bg-white text-red-700 px-3 py-1 rounded text-xs uppercase tracking-wider font-extrabold hover:bg-red-50 shadow"
          >
            Acknowledge & Silence Siren
          </button>
        </div>
      )}

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Branding & IoE Identity */}
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
            isAlarmActive 
              ? 'bg-red-500/20 border-red-500 text-red-400 animate-bounce' 
              : isArmed 
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' 
                : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
          }`}>
            {isAlarmActive ? (
              <ShieldAlert className="w-6 h-6" />
            ) : isArmed ? (
              <ShieldCheck className="w-6 h-6" />
            ) : (
              <Shield className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-100">
                IoE Smart Security System
              </h1>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold tracking-widest border ${
                isArmed 
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-700/60' 
                  : 'bg-amber-950 text-amber-400 border-amber-700/60'
              }`}>
                {isArmed ? 'ARMED' : 'DISARMED'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              College IoE Capstone • Internet of Everything (People • Things • Data • Processes)
            </p>
          </div>
        </div>

        {/* Live Device Status Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Arduino / Serial Pill */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
            arduinoConnected 
              ? 'bg-emerald-950/80 border-emerald-600/70 text-emerald-300' 
              : isHardwareSimulated
                ? 'bg-blue-950/80 border-blue-600/70 text-blue-300'
                : 'bg-rose-950/80 border-rose-800 text-rose-400'
          }`}>
            <Cpu className="w-3.5 h-3.5" />
            <span className="font-medium">
              {arduinoConnected ? 'Arduino: USB Live' : isHardwareSimulated ? 'Arduino: Sim Mode' : 'Arduino: Offline'}
            </span>
          </div>

          {/* Camera Pill */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
            cameraActive 
              ? 'bg-emerald-950/80 border-emerald-600/70 text-emerald-300' 
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}>
            <Camera className="w-3.5 h-3.5" />
            <span className="font-medium">{cameraActive ? 'Camera CV: Active' : 'Camera: Inactive'}</span>
          </div>

          {/* Email Pill */}
          <button
            onClick={onOpenEmailConfig}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border hover:brightness-125 transition ${
              emailConfigured 
                ? 'bg-emerald-950/80 border-emerald-600/70 text-emerald-300' 
                : 'bg-amber-950/80 border-amber-700/60 text-amber-300'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span className="font-medium">{emailConfigured ? 'EmailJS: Ready' : 'EmailJS: Setup'}</span>
          </button>

          {/* Mailbox Drawer Button */}
          <button
            onClick={onOpenMailbox}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border bg-cyan-950/80 border-cyan-500/80 text-cyan-200 hover:bg-cyan-900/60 transition shadow-sm"
            title="View Security Alerts Received for aarthiravi984@gmail.com"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-semibold text-[11px]">Mailbox ({mailboxCount})</span>
          </button>
        </div>

        {/* Action Controls & Role */}
        <div className="flex items-center gap-2">
          {/* Hardware Simulator Toggle */}
          <button
            onClick={onToggleSimulator}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition ${
              isHardwareSimulated
                ? 'bg-cyan-600/30 border-cyan-500 text-cyan-200'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
            title="Toggle between real Arduino Web Serial and Virtual Sensor Breadboard Simulator"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{isHardwareSimulated ? 'Sim Active' : 'Sim Mode'}</span>
          </button>

          {/* Audio Mute Button */}
          <button
            onClick={onToggleMute}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
            title={isAudioMuted ? 'Unmute Audio Siren' : 'Mute Audio Siren'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Arm / Disarm Toggle */}
          <button
            onClick={onToggleArm}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition shadow-sm ${
              isArmed
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isArmed ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Disarm</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Arm System</span>
              </>
            )}
          </button>

          {/* Panic Siren Button */}
          <button
            onClick={onTriggerPanic}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-600/90 hover:bg-red-600 text-white flex items-center gap-1 border border-red-500 transition shadow"
            title="Trigger Immediate Manual Siren Alarm"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Panic</span>
          </button>

          {/* Role Switcher */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5 text-[11px]">
            <button
              onClick={() => onChangeRole('OPERATOR')}
              className={`px-2 py-1 rounded font-medium transition ${
                userRole === 'OPERATOR' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Operator
            </button>
            <button
              onClick={() => onChangeRole('ADMIN')}
              className={`px-2 py-1 rounded font-medium transition ${
                userRole === 'ADMIN' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Admin
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-slate-950/80 border-t border-slate-800/80 px-4 sm:px-8 flex items-center gap-4 text-xs font-medium overflow-x-auto">
        <button
          onClick={() => onChangeTab('DASHBOARD')}
          className={`py-2.5 border-b-2 transition whitespace-nowrap ${
            activeTab === 'DASHBOARD'
              ? 'border-cyan-400 text-cyan-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Live Monitoring Dashboard
        </button>
        <button
          onClick={() => onChangeTab('ANALYTICS')}
          className={`py-2.5 border-b-2 transition whitespace-nowrap ${
            activeTab === 'ANALYTICS'
              ? 'border-cyan-400 text-cyan-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Incident Analytics & Audit Log
        </button>
        <button
          onClick={() => onChangeTab('HARDWARE')}
          className={`py-2.5 border-b-2 transition whitespace-nowrap ${
            activeTab === 'HARDWARE'
              ? 'border-cyan-400 text-cyan-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Hardware & Web Serial Console
        </button>
        <button
          onClick={() => onChangeTab('DOCUMENTATION')}
          className={`py-2.5 border-b-2 transition whitespace-nowrap ${
            activeTab === 'DOCUMENTATION'
              ? 'border-cyan-400 text-cyan-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          IoE Architecture & Circuit Guide
        </button>
        <button
          onClick={() => onChangeTab('TESTING')}
          className={`py-2.5 border-b-2 transition whitespace-nowrap ${
            activeTab === 'TESTING'
              ? 'border-cyan-400 text-cyan-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          College Evaluation & Testing Checklist
        </button>
      </div>
    </header>
  );
};
