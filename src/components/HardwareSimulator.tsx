import React from 'react';
import { 
  Cpu, 
  Flame, 
  UserX, 
  ShieldCheck, 
  Radio, 
  Volume2, 
  ToggleLeft, 
  ToggleRight,
  Sliders,
  Sparkles,
  Zap
} from 'lucide-react';
import { SensorTelemetry } from '../types/security';

interface HardwareSimulatorProps {
  telemetry: SensorTelemetry;
  onUpdateSimTelemetry: (partial: Partial<SensorTelemetry>) => void;
  isArmed: boolean;
  isAlarmActive: boolean;
}

export const HardwareSimulator: React.FC<HardwareSimulatorProps> = ({
  telemetry,
  onUpdateSimTelemetry,
  isArmed,
  isAlarmActive
}) => {
  // Preset scenario injection
  const applyScenario = (type: 'NORMAL' | 'INTRUSION' | 'FIRE' | 'PROXIMITY') => {
    switch (type) {
      case 'NORMAL':
        onUpdateSimTelemetry({
          temperature: 24.5,
          humidity: 52.0,
          motion: false,
          distance: 140.0,
          alarm: false
        });
        break;
      case 'INTRUSION':
        onUpdateSimTelemetry({
          motion: true,
          distance: 22.0
        });
        break;
      case 'FIRE':
        onUpdateSimTelemetry({
          temperature: 48.5,
          humidity: 28.0
        });
        break;
      case 'PROXIMITY':
        onUpdateSimTelemetry({
          distance: 12.0
        });
        break;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <span>Virtual Arduino Uno & Breadboard Simulator</span>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-700/60 px-2 py-0.5 rounded-full font-bold">
                SIMULATOR ACTIVE
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Interactive test bench to simulate physical sensors, LEDs, buzzer, and breach scenarios
            </p>
          </div>
        </div>

        {/* Quick Scenario Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => applyScenario('NORMAL')}
            className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1"
          >
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Normal</span>
          </button>
          <button
            onClick={() => applyScenario('INTRUSION')}
            className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-900/50 transition flex items-center gap-1"
          >
            <UserX className="w-3 h-3 text-rose-400" />
            <span>Intruder</span>
          </button>
          <button
            onClick={() => applyScenario('FIRE')}
            className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-900/50 transition flex items-center gap-1"
          >
            <Flame className="w-3 h-3 text-amber-400" />
            <span>Fire / Heat</span>
          </button>
          <button
            onClick={() => applyScenario('PROXIMITY')}
            className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-900/50 transition flex items-center gap-1"
          >
            <Radio className="w-3 h-3 text-purple-400" />
            <span>Proximity Breach</span>
          </button>
        </div>
      </div>

      {/* Simulated Hardware Status Indicators */}
      <div className="grid grid-cols-3 gap-3 mb-5 p-3 rounded-xl bg-slate-950 border border-slate-800">
        {/* Green LED Pin 11 */}
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full border transition-all ${
            !isAlarmActive 
              ? 'bg-emerald-400 border-emerald-300 shadow-[0_0_12px_#10b981]' 
              : 'bg-emerald-950 border-emerald-800 opacity-40'
          }`} />
          <div>
            <div className="text-[11px] font-bold text-slate-200">Green LED (Pin 11)</div>
            <div className="text-[10px] text-slate-400">{!isAlarmActive ? 'System Healthy' : 'Suppressed'}</div>
          </div>
        </div>

        {/* Red LED Pin 10 */}
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full border transition-all ${
            isAlarmActive 
              ? 'bg-rose-500 border-rose-300 shadow-[0_0_14px_#ef4444] animate-pulse' 
              : isArmed 
                ? 'bg-rose-950 border-rose-800 opacity-60' 
                : 'bg-slate-800 border-slate-700'
          }`} />
          <div>
            <div className="text-[11px] font-bold text-slate-200">Red LED (Pin 10)</div>
            <div className="text-[10px] text-slate-400">{isAlarmActive ? 'ALARM FLASHING' : isArmed ? 'Armed Guard' : 'Standby'}</div>
          </div>
        </div>

        {/* Piezo Buzzer Pin 9 */}
        <div className="flex items-center gap-3">
          <div className={`p-1 rounded-full border ${
            isAlarmActive 
              ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-bounce' 
              : 'bg-slate-800 border-slate-700 text-slate-500'
          }`}>
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-200">Piezo Buzzer (Pin 9)</div>
            <div className="text-[10px] text-slate-400">{isAlarmActive ? 'PULSING SIREN' : 'Quiet'}</div>
          </div>
        </div>
      </div>

      {/* Sensor Interactive Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Temperature Sensor (DHT11 Pin 4) */}
        <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Temperature:</span>
            </span>
            <span className={`font-mono font-bold ${telemetry.temperature >= 40 ? 'text-rose-400' : 'text-slate-200'}`}>
              {telemetry.temperature.toFixed(1)} °C
            </span>
          </div>
          <input
            type="range"
            min="15"
            max="60"
            step="0.5"
            value={telemetry.temperature}
            onChange={(e) => onUpdateSimTelemetry({ temperature: parseFloat(e.target.value) })}
            className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>15°C (Cool)</span>
            <span className="text-amber-400 font-semibold">40°C Alert Threshold</span>
            <span>60°C (Fire)</span>
          </div>
        </div>

        {/* Humidity Sensor (DHT11 Pin 4) */}
        <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              <span>Simulate Humidity:</span>
            </span>
            <span className="font-mono font-bold text-slate-200">
              {telemetry.humidity.toFixed(1)} %
            </span>
          </div>
          <input
            type="range"
            min="20"
            max="95"
            step="1"
            value={telemetry.humidity}
            onChange={(e) => onUpdateSimTelemetry({ humidity: parseFloat(e.target.value) })}
            className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>20% (Dry)</span>
            <span>50% (Comfort)</span>
            <span>95% (Humid)</span>
          </div>
        </div>

        {/* Ultrasonic Sensor (HC-SR04 Pin 7 & 8) */}
        <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-purple-400" />
              <span>Ultrasonic Distance:</span>
            </span>
            <span className={`font-mono font-bold ${telemetry.distance <= 30 ? 'text-rose-400' : 'text-slate-200'}`}>
              {telemetry.distance.toFixed(0)} cm
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="250"
            step="1"
            value={telemetry.distance}
            onChange={(e) => onUpdateSimTelemetry({ distance: parseFloat(e.target.value) })}
            className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>5 cm (Close)</span>
            <span className="text-rose-400 font-semibold">&lt; 30cm Breach Trigger</span>
            <span>250 cm (Clear)</span>
          </div>
        </div>

        {/* PIR Motion Sensor Toggle (HC-SR04 Pin 2) */}
        <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">PIR Motion Sensor (Pin 2):</span>
            <span className={`font-bold text-xs ${telemetry.motion ? 'text-rose-400' : 'text-emerald-400'}`}>
              {telemetry.motion ? 'MOTION ACTIVE' : 'NO MOVEMENT'}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <button
              onClick={() => onUpdateSimTelemetry({ motion: !telemetry.motion })}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 border ${
                telemetry.motion
                  ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              {telemetry.motion ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              <span>{telemetry.motion ? 'Intruder in Field of View' : 'Trigger Intruder Passing'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
