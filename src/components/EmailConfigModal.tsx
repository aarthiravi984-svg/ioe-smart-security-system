import React, { useState } from 'react';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Key, 
  ShieldCheck, 
  HelpCircle,
  Clock
} from 'lucide-react';
import { emailAlertService } from '../services/emailService';
import { EmailConfig } from '../types/security';

interface EmailConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export const EmailConfigModal: React.FC<EmailConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved
}) => {
  const currentConfig = emailAlertService.getConfig();

  const [serviceId, setServiceId] = useState(currentConfig.serviceId);
  const [templateId, setTemplateId] = useState(currentConfig.templateId);
  const [publicKey, setPublicKey] = useState(currentConfig.publicKey);
  const [recipientEmail, setRecipientEmail] = useState(currentConfig.recipientEmail);
  const [cooldownSeconds, setCooldownSeconds] = useState(currentConfig.cooldownSeconds || 60);

  const [testStatus, setTestStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
  }>({ loading: false });

  if (!isOpen) return null;

  const handleSave = () => {
    emailAlertService.saveConfig({
      serviceId,
      templateId,
      publicKey,
      recipientEmail,
      cooldownSeconds
    });
    onConfigSaved();
    setTestStatus({
      loading: false,
      success: true,
      message: 'Configuration saved locally to browser storage!'
    });
  };

  const handleTestEmail = async () => {
    if (!serviceId.trim() || !templateId.trim() || !publicKey.trim() || !recipientEmail.trim()) {
      setTestStatus({
        loading: false,
        success: false,
        message: 'Please complete all fields before sending a test notification.'
      });
      return;
    }

    // Save state first
    emailAlertService.saveConfig({
      serviceId,
      templateId,
      publicKey,
      recipientEmail,
      cooldownSeconds
    });

    setTestStatus({ loading: true, message: 'Dispatching test notification via EmailJS...' });

    const result = await emailAlertService.sendAlert({
      id: `TEST-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      formattedTime: new Date().toLocaleTimeString(),
      type: 'VERIFICATION_ALERT',
      severity: 'INFO',
      source: 'OPERATOR_ACTION',
      description: 'Verification test alert: IoE Smart Security notification channel is operational.',
      isSimulated: true,
      acknowledged: true,
      telemetrySnapshot: {
        temperature: 24.5,
        humidity: 50.0,
        distance: 120.0,
        motion: false
      }
    }, true);

    setTestStatus({
      loading: false,
      success: result.success,
      message: result.message
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">EmailJS Notification Dispatcher</h3>
              <p className="text-xs text-slate-400">Automated instant incident emails for security operators</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security / Privacy Notice */}
        <div className="mb-4 p-3 rounded-xl bg-blue-950/40 border border-blue-800/60 text-xs text-blue-200 flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Client-Side Architecture:</span> EmailJS uses a public browser key designed specifically for frontend dispatch.
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-cyan-300">Evaluating or presenting for college?</span>
              <button
                type="button"
                onClick={() => {
                  setServiceId('service_ioe_demo');
                  setTemplateId('template_security_alert');
                  setPublicKey('pub_key_college_eval');
                  setRecipientEmail('aarthiravi984@gmail.com');
                  setTestStatus({
                    loading: false,
                    success: true,
                    message: 'Filled Demo IDs! Click "Save Configuration" to arm the email subsystem.'
                  });
                }}
                className="px-2.5 py-1 rounded bg-cyan-700/60 hover:bg-cyan-600 text-white text-[11px] font-semibold border border-cyan-500 transition"
              >
                ⚡ Fill Demo College IDs
              </button>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              EmailJS Service ID
            </label>
            <input
              type="text"
              placeholder="e.g. service_abcdef or service_ioe_demo"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              EmailJS Template ID
            </label>
            <input
              type="text"
              placeholder="e.g. template_123456"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              EmailJS Public Key (User ID)
            </label>
            <input
              type="text"
              placeholder="e.g. pub_key_xyz987"
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Recipient Security Officer Email
            </label>
            <input
              type="email"
              placeholder="e.g. security-officer@college.edu"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
              <span>Cooldown Interval (Prevent Alert Flooding):</span>
              <span className="font-mono text-cyan-400">{cooldownSeconds} seconds</span>
            </label>
            <input
              type="range"
              min="15"
              max="300"
              step="15"
              value={cooldownSeconds}
              onChange={(e) => setCooldownSeconds(Number(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>15s (Aggressive)</span>
              <span>60s (Recommended)</span>
              <span>300s (Sparse)</span>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {testStatus.message && (
          <div className={`mt-4 p-3 rounded-lg text-xs flex items-start gap-2 ${
            testStatus.success 
              ? 'bg-emerald-950/60 border border-emerald-700 text-emerald-300' 
              : 'bg-rose-950/60 border border-rose-800 text-rose-300'
          }`}>
            {testStatus.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            )}
            <span>{testStatus.message}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={handleTestEmail}
            disabled={testStatus.loading}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5 text-cyan-400" />
            <span>{testStatus.loading ? 'Sending...' : 'Send Test Alert'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
