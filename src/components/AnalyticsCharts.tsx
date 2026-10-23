import React from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Flame, 
  ShieldAlert, 
  Radio, 
  Cpu, 
  Clock 
} from 'lucide-react';
import { SecurityEvent, SensorTelemetry } from '../types/security';

interface AnalyticsChartsProps {
  events: SecurityEvent[];
  telemetryHistory: Array<{ time: string; temp: number; dist: number; motion: boolean }>;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  events,
  telemetryHistory
}) => {
  // Aggregate events by severity
  const severityCounts = {
    CRITICAL: events.filter(e => e.severity === 'CRITICAL').length,
    HIGH: events.filter(e => e.severity === 'HIGH').length,
    MEDIUM: events.filter(e => e.severity === 'MEDIUM').length,
    LOW: events.filter(e => e.severity === 'LOW').length,
    INFO: events.filter(e => e.severity === 'INFO').length,
  };

  // Aggregate events by category
  const categoryCounts = {
    Intrusion: events.filter(e => e.type.includes('INTRUSION') || e.type.includes('MOTION')).length,
    Thermal: events.filter(e => e.type.includes('TEMP') || e.type.includes('FIRE') || e.type.includes('HEAT')).length,
    Proximity: events.filter(e => e.type.includes('PROXIMITY') || e.type.includes('DISTANCE')).length,
    System: events.filter(e => e.type.includes('SYSTEM') || e.type.includes('SERIAL') || e.type.includes('CAMERA')).length,
  };

  const totalEvents = events.length || 1; // avoid division by 0

  return (
    <div className="space-y-6">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Intrusion Incidents</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">{categoryCounts.Intrusion}</div>
          <p className="text-[10px] text-slate-500 mt-1">PIR + Optical CV triggers</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Thermal Alerts</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">{categoryCounts.Thermal}</div>
          <p className="text-[10px] text-slate-500 mt-1">Overheat &gt; 40°C threshold</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Boundary Breaches</span>
            <Radio className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">{categoryCounts.Proximity}</div>
          <p className="text-[10px] text-slate-500 mt-1">Ultrasonic &lt; 30cm proximity</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total System Events</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">{events.length}</div>
          <p className="text-[10px] text-slate-500 mt-1">Recorded in session</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span>Incident Severity Distribution</span>
            </h4>
            <span className="text-xs text-slate-400">{events.length} logged</span>
          </div>

          <div className="space-y-3.5 my-auto">
            {/* Critical */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-red-400">Critical</span>
                <span className="text-slate-300">{severityCounts.CRITICAL} ({Math.round((severityCounts.CRITICAL / totalEvents) * 100)}%)</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-red-500 transition-all duration-300" 
                  style={{ width: `${(severityCounts.CRITICAL / totalEvents) * 100}%` }} 
                />
              </div>
            </div>

            {/* High */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-rose-400">High</span>
                <span className="text-slate-300">{severityCounts.HIGH} ({Math.round((severityCounts.HIGH / totalEvents) * 100)}%)</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-rose-500 transition-all duration-300" 
                  style={{ width: `${(severityCounts.HIGH / totalEvents) * 100}%` }} 
                />
              </div>
            </div>

            {/* Medium */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-amber-400">Medium</span>
                <span className="text-slate-300">{severityCounts.MEDIUM} ({Math.round((severityCounts.MEDIUM / totalEvents) * 100)}%)</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-amber-500 transition-all duration-300" 
                  style={{ width: `${(severityCounts.MEDIUM / totalEvents) * 100}%` }} 
                />
              </div>
            </div>

            {/* Low / Info */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-blue-400">Low / System Info</span>
                <span className="text-slate-300">{severityCounts.LOW + severityCounts.INFO} ({Math.round(((severityCounts.LOW + severityCounts.INFO) / totalEvents) * 100)}%)</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300" 
                  style={{ width: `${((severityCounts.LOW + severityCounts.INFO) / totalEvents) * 100}%` }} 
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between text-[11px] text-slate-400">
            <span>Autonomous Risk Engine</span>
            <span>Prioritization: Critical &gt; High &gt; Medium &gt; Low</span>
          </div>
        </div>

        {/* Real-Time Sensor Telemetry Trend */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Real-Time Sensor Trends (Last 20 Readings)</span>
            </h4>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-amber-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Temp (°C)
              </span>
              <span className="flex items-center gap-1 text-purple-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-purple-400" /> Dist (cm)
              </span>
            </div>
          </div>

          {/* Sparkline / Bar Graph Simulation */}
          <div className="h-44 bg-slate-950 rounded-lg border border-slate-800 p-3 flex items-end gap-1.5 overflow-hidden">
            {telemetryHistory.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                Awaiting sensor telemetry packets...
              </div>
            ) : (
              telemetryHistory.map((item, idx) => {
                // Height based on temp (scale 15°C - 50°C to 10% - 100%)
                const tempPct = Math.max(10, Math.min(100, ((item.temp - 15) / 35) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                    {/* Tooltip on hover */}
                    <div className="hidden group-hover:block absolute bottom-full mb-1 bg-slate-800 text-[10px] text-slate-200 px-1.5 py-0.5 rounded shadow z-10 whitespace-nowrap">
                      {item.temp}°C | {item.dist}cm
                    </div>
                    {/* Temperature Bar */}
                    <div 
                      className={`w-full rounded-t transition-all ${
                        item.temp >= 40 ? 'bg-rose-500' : 'bg-amber-400/80'
                      }`}
                      style={{ height: `${tempPct}%` }}
                    />
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span>T-Minus 20 cycles</span>
            <span>Real-time polling frequency: 1000ms</span>
            <span>Live telemetry active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
