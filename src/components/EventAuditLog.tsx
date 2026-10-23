import React, { useState } from 'react';
import { 
  ShieldAlert, 
  FileSpreadsheet, 
  Search, 
  Filter, 
  CheckCircle, 
  Trash2, 
  ExternalLink,
  Eye,
  X,
  AlertTriangle,
  Info
} from 'lucide-react';
import { SecurityEvent, SecuritySeverity } from '../types/security';

interface EventAuditLogProps {
  events: SecurityEvent[];
  onAcknowledgeEvent: (id: string) => void;
  onClearEvents: () => void;
}

export const EventAuditLog: React.FC<EventAuditLogProps> = ({
  events,
  onAcknowledgeEvent,
  onClearEvents
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(null);

  // Filtered events
  const filteredEvents = events.filter(evt => {
    const matchesSearch = 
      evt.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = severityFilter === 'ALL' || evt.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  // Export CSV
  const handleExportCSV = () => {
    if (events.length === 0) return;

    const headers = [
      'Event ID',
      'Timestamp (ISO)',
      'Time',
      'Severity',
      'Type',
      'Source',
      'Description',
      'Simulated',
      'Acknowledged',
      'Temperature (C)',
      'Humidity (%)',
      'Distance (cm)',
      'Motion Triggered'
    ];

    const rows = events.map(e => [
      `"${e.id}"`,
      `"${e.timestamp}"`,
      `"${e.formattedTime}"`,
      `"${e.severity}"`,
      `"${e.type}"`,
      `"${e.source}"`,
      `"${(e.description || '').replace(/"/g, '""')}"`,
      `"${e.isSimulated ? 'YES' : 'NO'}"`,
      `"${e.acknowledged ? 'YES' : 'NO'}"`,
      `"${e.telemetrySnapshot?.temperature ?? ''}"`,
      `"${e.telemetrySnapshot?.humidity ?? ''}"`,
      `"${e.telemetrySnapshot?.distance ?? ''}"`,
      `"${e.telemetrySnapshot?.motion ? 'YES' : 'NO'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ioe_security_incident_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSeverityBadge = (sev: SecuritySeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-950 text-red-300 border-red-700';
      case 'HIGH':
        return 'bg-rose-950 text-rose-300 border-rose-800';
      case 'MEDIUM':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'LOW':
        return 'bg-blue-950 text-blue-300 border-blue-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-4">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <span>IoE Security Incident & Audit Log</span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
              {events.length} records
            </span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Immutable log of hardware triggers, computer vision incidents, and system state transitions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={events.length === 0}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition disabled:opacity-40"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onClearEvents}
            disabled={events.length === 0}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700 transition disabled:opacity-40"
            title="Clear Event Log"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search incident logs (e.g. PIR, intrusion, overheat)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
            <option value="INFO">Info</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="border border-slate-800 rounded-lg overflow-x-auto max-h-[380px]">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider sticky top-0 border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3">Event ID</th>
              <th className="py-2.5 px-3">Time</th>
              <th className="py-2.5 px-3">Severity & Type</th>
              <th className="py-2.5 px-3">Incident Description</th>
              <th className="py-2.5 px-3">Telemetry Context</th>
              <th className="py-2.5 px-3">Evidence</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 bg-slate-900/60 font-sans">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  No security incidents matching current criteria.
                </td>
              </tr>
            ) : (
              filteredEvents.map(evt => (
                <tr key={evt.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-200">
                    {evt.id}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                    {evt.formattedTime}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(evt.severity)} mr-2`}>
                      {evt.severity}
                    </span>
                    <span className="font-semibold text-slate-200">{evt.type}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 max-w-xs break-words">
                    {evt.description}
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-400 whitespace-nowrap">
                    {evt.telemetrySnapshot ? (
                      <span className="font-mono text-[10px]">
                        T:{evt.telemetrySnapshot.temperature}°C | H:{evt.telemetrySnapshot.humidity}% | D:{evt.telemetrySnapshot.distance}cm
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {evt.snapshotUrl ? (
                      <button
                        onClick={() => setSelectedSnapshot(evt.snapshotUrl!)}
                        className="p-1 rounded bg-slate-800 hover:bg-cyan-900/40 text-cyan-400 border border-cyan-800/60 transition inline-flex items-center gap-1 text-[10px]"
                        title="View Incident Snapshot"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Snap</span>
                      </button>
                    ) : (
                      <span className="text-slate-600 text-[10px]">None</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    {evt.acknowledged ? (
                      <span className="text-[10px] text-emerald-400 font-medium inline-flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Ack'd</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => onAcknowledgeEvent(evt.id)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold transition"
                      >
                        Acknowledge
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Snapshot Preview Modal */}
      {selectedSnapshot && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-xl w-full p-4 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                <span>Security Evidence Snapshot</span>
              </h4>
              <button
                onClick={() => setSelectedSnapshot(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-lg overflow-hidden border border-slate-800 bg-black">
              <img src={selectedSnapshot} alt="Incident Snapshot" className="w-full h-auto object-contain" />
            </div>
            <div className="mt-3 text-right">
              <button
                onClick={() => setSelectedSnapshot(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
