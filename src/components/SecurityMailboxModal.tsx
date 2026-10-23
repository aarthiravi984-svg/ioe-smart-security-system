import React, { useState } from 'react';
import { 
  Inbox, 
  Mail, 
  Trash2, 
  X, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  Copy,
  Check,
  Send
} from 'lucide-react';
import { DispatchedEmail } from '../types/security';
import { emailAlertService } from '../services/emailService';

interface SecurityMailboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  emails: DispatchedEmail[];
  onOpenSettings: () => void;
  onSendTest: () => void;
}

export const SecurityMailboxModal: React.FC<SecurityMailboxModalProps> = ({
  isOpen,
  onClose,
  emails,
  onOpenSettings,
  onSendTest
}) => {
  const [selectedMail, setSelectedMail] = useState<DispatchedEmail | null>(emails[0] || null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyBody = () => {
    if (selectedMail) {
      navigator.clipboard.writeText(selectedMail.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClear = () => {
    emailAlertService.clearMailbox();
    setSelectedMail(null);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full h-[85vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <span>Security Officer Mailbox</span>
                <span className="text-[11px] font-mono text-cyan-400 bg-slate-800 px-2 py-0.5 rounded-full">
                  {emailAlertService.getConfig().recipientEmail || 'aarthiravi984@gmail.com'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Live delivery log of all security incident alerts dispatched by the IoE system
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onSendTest}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 transition shadow"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Sample Alert</span>
            </button>
            <button
              onClick={onOpenSettings}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
            >
              <span>EmailJS Settings</span>
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notice Banner */}
        <div className="bg-blue-950/40 border-b border-blue-900/60 px-4 py-2.5 text-xs text-blue-200 flex items-center justify-between flex-wrap gap-2">
          <span>
            💡 <strong>Why haven't you seen it in external Gmail yet?</strong> Web browsers cannot send mail to a physical phone without free EmailJS API keys. This mailbox shows all generated emails. Add your free EmailJS keys to also deliver directly into your phone's Gmail app!
          </span>
          <button
            onClick={onOpenSettings}
            className="text-cyan-400 underline font-semibold hover:text-cyan-300"
          >
            Configure EmailJS &rarr;
          </button>
        </div>

        {/* Mailbox Split Pane */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Email List */}
          <div className="w-1/3 border-r border-slate-800 bg-slate-950/60 flex flex-col">
            <div className="p-3 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold">{emails.length} Messages</span>
              {emails.length > 0 && (
                <button
                  onClick={handleClear}
                  className="hover:text-rose-400 transition flex items-center gap-1 text-[11px]"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
              {emails.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  <Mail className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>No security emails received yet.</p>
                  <p className="mt-1 text-[11px] text-slate-600">
                    Trigger an intruder or click "Send Sample Alert" above!
                  </p>
                </div>
              ) : (
                emails.map(mail => (
                  <button
                    key={mail.id}
                    onClick={() => setSelectedMail(mail)}
                    className={`w-full text-left p-3 transition flex flex-col gap-1 ${
                      selectedMail?.id === mail.id 
                        ? 'bg-slate-800/80 border-l-2 border-l-cyan-400' 
                        : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        mail.severity === 'CRITICAL' ? 'bg-red-950 text-red-300' :
                        mail.severity === 'HIGH' ? 'bg-rose-950 text-rose-300' :
                        'bg-blue-950 text-blue-300'
                      }`}>
                        {mail.severity}
                      </span>
                      <span className="text-slate-500 font-mono text-[10px]">{mail.formattedTime}</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-200 truncate">
                      {mail.subject}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {mail.eventType}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right: Email Detail View */}
          <div className="flex-1 bg-slate-900 flex flex-col overflow-y-auto p-5">
            {selectedMail ? (
              <div className="space-y-4">
                {/* Email Headers */}
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100 text-sm">
                      {selectedMail.subject}
                    </span>
                    <button
                      onClick={handleCopyBody}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700 transition"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                      <span>{copied ? 'Copied' : 'Copy Email'}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-900 font-mono">
                    <div>
                      <strong className="text-slate-300">To:</strong> {selectedMail.to}
                    </div>
                    <div>
                      <strong className="text-slate-300">From:</strong> {selectedMail.from}
                    </div>
                    <div>
                      <strong className="text-slate-300">Delivered:</strong> {selectedMail.formattedTime}
                    </div>
                    <div>
                      <strong className="text-slate-300">Status:</strong>{' '}
                      <span className="text-emerald-400 font-bold">
                        {selectedMail.status === 'DELIVERED_REAL_EMAILJS' ? 'Sent via EmailJS (Gmail)' : 'Delivered to Security Mailbox'}
                      </span>
                    </div>
                  </div>
                  <div className="text-[11px] text-cyan-400 bg-cyan-950/40 p-2 rounded border border-cyan-900/50">
                    ℹ️ {selectedMail.deliveryNote}
                  </div>
                </div>

                {/* Email Body */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed shadow-inner">
                  {selectedMail.body}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs text-center">
                <Mail className="w-10 h-10 mb-2 opacity-30" />
                <p>Select a message from the left to read the full security alert.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
