import React from 'react';
import { 
  Thermometer, 
  Droplets, 
  Activity, 
  Radio, 
  Cpu, 
  AlertOctagon, 
  MailCheck, 
  Zap,
  Eye
} from 'lucide-react';
import { SensorTelemetry, SecurityEvent } from '../types/security';

interface MetricCardsProps {
  telemetry: SensorTelemetry;
  events: SecurityEvent[];
  isArmed: boolean;
  isSimulated: boolean;
  cameraMotionDetected: boolean;
  emailCount: number;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  telemetry,
  events,
  isArmed,
  isSimulated,
  cameraMotionDetected,
  emailCount
}) => {
  const isHighTemp = telemetry.temperature >= 38.0;
  const isProximityBreach = telemetry.distance > 0 && telemetry.distance <= 30.0;
  const criticalEventsCount = events.filter(e => e.severity === 'CRITICAL' || e.severity === 'HIGH').length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6">
      {/* 1. Ambient Temperature */}
      <div className={`p-4 rounded-xl border transition-all ${
        isHighTemp 
          ? 'bg-rose-950/40 border-rose-500/80 shadow-lg shadow-rose-950/50' 
          : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-semibold uppercase tracking-wider text-[11px]">Temperature</span>
          <Thermometer className={`w-4 h-4 ${isHighTemp ? 'text-rose-400 animate-pulse' : 'text-cyan-400'}`} />
        </div>
        <div className="text-2xl font-black text-slate-100 tracking-tight">
          {telemetry.temperature.toFixed(1)} <span className="text-sm font-semibold text-slate-400">°C</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px]">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
            isHighTemp ? 'bg-rose-900/80 text-rose-300' : 'bg-slate-800 text-slate-300'
          }`}>
            {isHighTemp ? 'HIGH THERMAL' : 'NORMAL (DHT11)'}
          </span>
          <span className="text-slate-500">Lim: 40°C</span>
        </div>
      </div>

      {/* 2. Relative Humidity */}
      <div className="p-4 rounded-xl border bg-slate-900/90 border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-semibold uppercase tracking-wider text-[11px]">Humidity</span>
          <Droplets className="w-4 h-4 text-blue-400" />
        </div>
        <div className="text-2xl font-black text-slate-100 tracking-tight">
          {telemetry.humidity.toFixed(1)} <span className="text-sm font-semibold text-slate-400">%</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px]">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
            {telemetry.humidity < 35 ? 'DRY AIR' : telemetry.humidity > 70 ? 'HIGH MOISTURE' : 'OPTIMAL'}
          </span>
          <span className="text-slate-500">DHT Sensor</span>
        </div>
      </div>

      {/* 3. PIR Motion State */}
      <div className={`p-4 rounded-xl border transition-all ${
        telemetry.motion 
          ? 'bg-rose-950/40 border-rose-500/80 shadow-lg shadow-rose-950/50' 
          : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-semibold uppercase tracking-wider text-[11px]">PIR Sensor</span>
          <Activity className={`w-4 h-4 ${telemetry.motion ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`} />
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-block w-3 h-3 rounded-full ${
            telemetry.motion ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'
          }`} />
          <div className="text-lg font-extrabold text-slate-100 tracking-tight truncate">
            {telemetry.motion ? 'MOTION' : 'CLEAR'}
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px]">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
            telemetry.motion ? 'bg-rose-900 text-rose-200' : 'bg-emerald-950 text-emerald-300'
          }`}>
            Pin 2 (HC-SR501)
          </span>
          <span className="text-slate-500">{isArmed ? 'ARMED' : 'STANDBY'}</span>
        </div>
      </div>

      {/* 4. Ultrasonic Proximity */}
      <div className={`p-4 rounded-xl border transition-all ${
        isProximityBreach 
          ? 'bg-amber-950/40 border-amber-500/80 shadow-lg shadow-amber-950/50' 
          : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-semibold uppercase tracking-wider text-[11px]">Proximity</span>
          <Radio className={`w-4 h-4 ${isProximityBreach ? 'text-amber-400 animate-pulse' : 'text-purple-400'}`} />
        </div>
        <div className="text-2xl font-black text-slate-100 tracking-tight">
          {telemetry.distance.toFixed(0)} <span className="text-sm font-semibold text-slate-400">cm</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px]">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
            isProximityBreach ? 'bg-amber-900/80 text-amber-200' : 'bg-slate-800 text-slate-300'
          }`}>
            {isProximityBreach ? 'BOUNDARY BREACH' : 'ZONE SECURE'}
          </span>
          <span className="text-slate-500">HC-SR04</span>
        </div>
      </div>

      {/* 5. Camera CV Motion */}
      <div className={`p-4 rounded-xl border transition-all ${
        cameraMotionDetected 
          ? 'bg-rose-950/40 border-rose-500/80 shadow-lg shadow-rose-950/50' 
          : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-semibold uppercase tracking-wider text-[11px]">Camera CV</span>
          <Eye className={`w-4 h-4 ${cameraMotionDetected ? 'text-rose-400 animate-pulse' : 'text-teal-400'}`} />
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-block w-3 h-3 rounded-full ${
            cameraMotionDetected ? 'bg-rose-500 animate-ping' : 'bg-teal-500'
          }`} />
          <div className="text-lg font-extrabold text-slate-100 tracking-tight">
            {cameraMotionDetected ? 'OPTICAL DETECT' : 'QUIET'}
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px]">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
            Frame Diff CV
          </span>
          <span className="text-slate-500">Webcam</span>
        </div>
      </div>

      {/* 6. Alerts & Notification Dispatches */}
      <div className="p-4 rounded-xl border bg-slate-900/90 border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-semibold uppercase tracking-wider text-[11px]">Incidents / Emails</span>
          <MailCheck className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="text-2xl font-black text-slate-100 tracking-tight flex items-baseline gap-2">
          <span>{criticalEventsCount}</span>
          <span className="text-xs text-slate-400 font-normal">/ {emailCount} sent</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px]">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-cyan-300">
            {isSimulated ? 'Virtual Sim' : 'Live Physical'}
          </span>
          <span className="text-slate-500">Total: {events.length}</span>
        </div>
      </div>
    </div>
  );
};
