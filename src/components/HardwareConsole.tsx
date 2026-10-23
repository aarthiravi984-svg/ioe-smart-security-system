import React, { useState, useEffect, useRef } from 'react';
import { 
  Usb, 
  Terminal, 
  Send, 
  Trash2, 
  Power, 
  PowerOff, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Volume2,
  VolumeX,
  Shield,
  ShieldOff
} from 'lucide-react';
import { serialConnection } from '../services/serialConnection';

interface HardwareConsoleProps {
  arduinoConnected: boolean;
  onRefreshStatus: () => void;
}

interface LogEntry {
  id: string;
  time: string;
  direction: 'IN' | 'OUT' | 'SYS';
  text: string;
}

export const HardwareConsole: React.FC<HardwareConsoleProps> = ({
  arduinoConnected,
  onRefreshStatus
}) => {
  const [baudRate, setBaudRate] = useState<number>(9600);
  const [customCommand, setCustomCommand] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'init-1',
      time: new Date().toLocaleTimeString(),
      direction: 'SYS',
      text: 'Web Serial Console ready. Select COM port to connect directly to Arduino Uno.'
    }
  ]);
  const [isSupported, setIsSupported] = useState(true);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsSupported(serialConnection.isSupported());

    const unsubRaw = serialConnection.onRawLog((text, dir) => {
      setLogs(prev => [
        ...prev.slice(-100),
        {
          id: Math.random().toString(),
          time: new Date().toLocaleTimeString(),
          direction: dir,
          text
        }
      ]);
    });

    const unsubStatus = serialConnection.onStatus((conn, msg) => {
      setLogs(prev => [
        ...prev.slice(-100),
        {
          id: Math.random().toString(),
          time: new Date().toLocaleTimeString(),
          direction: 'SYS',
          text: msg || (conn ? 'Connected to serial port.' : 'Disconnected from serial port.')
        }
      ]);
      onRefreshStatus();
    });

    return () => {
      unsubRaw();
      unsubStatus();
    };
  }, [onRefreshStatus]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleConnect = async () => {
    try {
      await serialConnection.connect(baudRate);
    } catch (e: any) {
      console.warn('Connect failed:', e);
    }
  };

  const handleDisconnect = async () => {
    await serialConnection.disconnect();
  };

  const sendCmd = async (cmd: string) => {
    if (!cmd.trim()) return;
    await serialConnection.sendCommand(cmd.trim());
    setCustomCommand('');
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-5">
      {/* Top Header & Connection Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Usb className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <span>USB Serial Communication & Hardware Terminal</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                arduinoConnected 
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' 
                  : 'bg-rose-950 text-rose-300 border border-rose-800'
              }`}>
                {arduinoConnected ? 'PORT OPEN' : 'DISCONNECTED'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Web Serial API direct bidirectional link with Arduino Uno COM Port
            </p>
          </div>
        </div>

        {/* Connection Controls */}
        <div className="flex items-center gap-2">
          <select
            value={baudRate}
            onChange={(e) => setBaudRate(Number(e.target.value))}
            disabled={arduinoConnected}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value={9600}>9600 baud</option>
            <option value={115200}>115200 baud</option>
          </select>

          {!arduinoConnected ? (
            <button
              onClick={handleConnect}
              disabled={!isSupported}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition shadow disabled:opacity-50"
            >
              <Power className="w-3.5 h-3.5" />
              <span>Connect Arduino</span>
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 transition shadow"
            >
              <PowerOff className="w-3.5 h-3.5" />
              <span>Disconnect</span>
            </button>
          )}
        </div>
      </div>

      {!isSupported && (
        <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded-lg text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            Web Serial API is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Opera to connect to physical USB hardware. (Simulation mode remains fully functional!)
          </span>
        </div>
      )}

      {/* Quick Action Commands to Arduino */}
      <div>
        <div className="text-xs font-semibold text-slate-300 mb-2">Send Hardware Commands:</div>
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <button
            onClick={() => sendCmd('ARM')}
            disabled={!arduinoConnected}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 flex items-center gap-1.5 transition disabled:opacity-40"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Send "ARM"</span>
          </button>
          <button
            onClick={() => sendCmd('DISARM')}
            disabled={!arduinoConnected}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 flex items-center gap-1.5 transition disabled:opacity-40"
          >
            <ShieldOff className="w-3.5 h-3.5" />
            <span>Send "DISARM"</span>
          </button>
          <button
            onClick={() => sendCmd('BUZZER_ON')}
            disabled={!arduinoConnected}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 flex items-center gap-1.5 transition disabled:opacity-40"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Buzzer ON</span>
          </button>
          <button
            onClick={() => sendCmd('BUZZER_OFF')}
            disabled={!arduinoConnected}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition disabled:opacity-40"
          >
            <VolumeX className="w-3.5 h-3.5" />
            <span>Buzzer OFF</span>
          </button>
          <button
            onClick={() => sendCmd('PING')}
            disabled={!arduinoConnected}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center gap-1.5 transition disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send "PING"</span>
          </button>
        </div>
      </div>

      {/* Terminal View */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs flex flex-col h-64 overflow-hidden shadow-inner">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2 text-slate-400">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-slate-300">Live Serial Stream Monitor</span>
          </div>
          <button
            onClick={clearLogs}
            className="p-1 hover:text-slate-200 transition"
            title="Clear terminal output"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {logs.length === 0 ? (
            <div className="text-slate-600 italic">No serial traffic recorded yet.</div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                <span className="text-slate-600 shrink-0 text-[10px]">{log.time}</span>
                <span className={`px-1 rounded text-[10px] font-bold shrink-0 ${
                  log.direction === 'IN' 
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' 
                    : log.direction === 'OUT' 
                      ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/60' 
                      : 'bg-slate-800 text-slate-300'
                }`}>
                  {log.direction}
                </span>
                <span className={`break-all ${
                  log.direction === 'IN' 
                    ? 'text-emerald-200' 
                    : log.direction === 'OUT' 
                      ? 'text-cyan-200 font-semibold' 
                      : 'text-slate-400'
                }`}>
                  {log.text}
                </span>
              </div>
            ))
          )}
          <div ref={terminalEndRef} />
        </div>

        {/* Custom Command Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendCmd(customCommand);
          }}
          className="mt-2 pt-2 border-t border-slate-800/80 flex items-center gap-2"
        >
          <span className="text-cyan-400 font-bold">&gt;</span>
          <input
            type="text"
            value={customCommand}
            onChange={(e) => setCustomCommand(e.target.value)}
            placeholder={arduinoConnected ? "Type raw command (e.g. ARM, PING, BUZZER_ON)..." : "Connect Arduino to send commands"}
            disabled={!arduinoConnected}
            className="flex-1 bg-transparent text-slate-200 text-xs focus:outline-none"
          />
          <button
            type="submit"
            disabled={!arduinoConnected || !customCommand.trim()}
            className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-sans text-xs font-semibold disabled:opacity-40 transition"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
