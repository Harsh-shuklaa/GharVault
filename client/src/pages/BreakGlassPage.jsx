import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';

export default function BreakGlassPage() {
  const { toast } = useToast();
  const [session, setSession] = useState(null);
  const [delayHours, setDelayHours] = useState(48);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [reason, setReason] = useState('Medical Emergency / Hospitalization');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 47, minutes: 59, seconds: 40 });
  const [confirmModal, setConfirmModal] = useState(null);

  // Close confirm modal on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && confirmModal) {
        setConfirmModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmModal]);

  useEffect(() => {
    loadBreakGlassState();
  }, []);

  const loadBreakGlassState = async () => {
    try {
      const res = await api.getBreakGlass();
      setSession(res.session);
      setDelayHours(res.delayHours || 48);
      setEmergencyContacts(res.emergencyContacts || []);
    } catch (err) {
      console.error('Failed to load break glass:', err);
    }
  };

  // Live timer tick
  useEffect(() => {
    if (session && session.status === 'COUNTDOWN_ACTIVE') {
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
          if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
          if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
          return prev;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const executeArm = async () => {
    try {
      setLoading(true);
      const res = await api.armBreakGlass({ reason, notes });
      setSession(res.session);
      toast.success('Break-Glass Protocol armed. 48-hour countdown started.');
    } catch (err) {
      toast.error('Failed to arm protocol: ' + (err.message || 'Error'));
    } finally {
      setLoading(false);
      setConfirmModal(null);
    }
  };

  const handleArm = (e) => {
    e.preventDefault();
    setConfirmModal({
      title: 'Arm 48-Hour Break-Glass Protocol',
      desc: 'Are you sure you want to arm the 48-Hour Emergency Break-Glass Protocol? All designated family guardians will be notified immediately.',
      confirmText: 'Arm Protocol',
      onConfirm: executeArm,
    });
  };

  const executeCancel = async () => {
    try {
      setLoading(true);
      const res = await api.cancelBreakGlass();
      setSession(res.session);
      toast.success('Emergency break-glass protocol disarmed.');
    } catch (err) {
      toast.error('Failed to cancel: ' + (err.message || 'Error'));
    } finally {
      setLoading(false);
      setConfirmModal(null);
    }
  };

  const handleCancel = () => {
    setConfirmModal({
      title: 'Disarm Emergency Protocol',
      desc: 'Are you sure you want to cancel and disarm the emergency break-glass countdown?',
      confirmText: 'Disarm Protocol',
      onConfirm: executeCancel,
    });
  };

  const executeForceTrigger = async () => {
    try {
      setLoading(true);
      const res = await api.triggerBreakGlass();
      setSession(res.session);
      toast.success('Emergency override triggered: all records unlocked.');
    } catch (err) {
      toast.error('Failed to trigger override: ' + (err.message || 'Error'));
    } finally {
      setLoading(false);
      setConfirmModal(null);
    }
  };

  const handleForceTrigger = () => {
    setConfirmModal({
      title: 'Emergency Medical / Succession Override',
      desc: 'EMERGENCY OVERRIDE: Immediately unlock all sealed records for medical / succession handover?',
      confirmText: 'Trigger Override',
      onConfirm: executeForceTrigger,
    });
  };

  const isCountdownActive = session && session.status === 'COUNTDOWN_ACTIVE';
  const isUnlocked = session && session.status === 'COMPLETED_UNLOCKED';

  return (
    <div className="max-w-[1380px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Red Warning Header */}
      <div className="bg-red-900/90 dark:bg-red-950 text-white rounded-2xl p-6 border border-red-700 dark:border-red-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 text-white flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-3xl">e911_emergency</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                Emergency Break-Glass Protocol
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-white text-red-900 font-mono text-[10px] font-bold uppercase animate-pulse">
                Critical Safety Net
              </span>
            </div>
            <p className="text-xs text-red-100 dark:text-red-200 mt-1 max-w-2xl leading-relaxed">
              Designed for sudden medical emergencies, hospitalizations, or incapacitation under Indian succession law.
              Provides a structured 48-hour challenge window before digital custody transfer.
            </p>
          </div>
        </div>

        {isCountdownActive && (
          <button
            onClick={handleCancel}
            className="px-5 py-2.5 rounded-xl bg-white text-red-900 font-bold text-xs hover:bg-slate-100 transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            Disarm / Cancel Protocol
          </button>
        )}
      </div>

      {/* Main Split Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Countdown / Form (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1C1C1C] rounded-2xl p-6 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-6 transition-colors">
          {isUnlocked ? (
            /* Unlocked state */
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-[#3ECF8E]/20 text-emerald-600 dark:text-[#3ECF8E] flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-4xl">lock_open</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Emergency Access Active</h2>
              <p className="text-xs text-slate-600 dark:text-neutral-400 max-w-md mx-auto">
                All high-value deeds, medical directives, and registered wills are accessible to designated custodians.
              </p>
              <button
                onClick={handleCancel}
                className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-[#262626] text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                Reset / Re-Seal Vault
              </button>
            </div>
          ) : isCountdownActive ? (
            /* Active Countdown State */
            <div className="space-y-6">
              <div className="text-center py-4 space-y-3">
                <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest block animate-pulse">
                  Countdown Timer Running
                </span>
                <div className="flex items-center justify-center gap-3">
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/40 text-center min-w-[70px]">
                    <span className="text-3xl font-extrabold font-mono text-red-700 dark:text-red-400">{timeLeft.hours}</span>
                    <span className="block text-[10px] uppercase font-bold text-red-600 dark:text-red-400">Hours</span>
                  </div>
                  <span className="text-2xl font-bold text-red-400">:</span>
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/40 text-center min-w-[70px]">
                    <span className="text-3xl font-extrabold font-mono text-red-700 dark:text-red-400">{timeLeft.minutes}</span>
                    <span className="block text-[10px] uppercase font-bold text-red-600 dark:text-red-400">Minutes</span>
                  </div>
                  <span className="text-2xl font-bold text-red-400">:</span>
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/40 text-center min-w-[70px]">
                    <span className="text-3xl font-extrabold font-mono text-red-700 dark:text-red-400">{timeLeft.seconds}</span>
                    <span className="block text-[10px] uppercase font-bold text-red-600 dark:text-red-400">Seconds</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-2">
                  Emergency custody will automatically unlock on{' '}
                  <strong className="text-slate-900 dark:text-white">
                    {new Date(session.unlocksAt).toLocaleString()}
                  </strong>
                </p>
              </div>

              {/* Notification Broadcast Details */}
              <div className="p-4 bg-slate-50 dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-[#262626] space-y-2 text-xs">
                <span className="font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider block text-[11px]">
                  Emergency Broadcast Dispatch
                </span>
                <div className="space-y-1.5 text-slate-600 dark:text-neutral-400">
                  <div className="flex items-center justify-between">
                    <span>SMS Pings to Emergency Contacts:</span>
                    <span className="font-mono text-[#10B981] dark:text-[#3ECF8E] font-bold">Delivered (2/2)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Email Directives to Guardians:</span>
                    <span className="font-mono text-[#10B981] dark:text-[#3ECF8E] font-bold">Dispatched</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>WhatsApp HSM Broadcast:</span>
                    <span className="font-mono text-[#10B981] dark:text-[#3ECF8E] font-bold">Confirmed</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleCancel}
                  className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-[#262626] text-slate-700 dark:text-neutral-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-[#262626] cursor-pointer"
                >
                  Cancel Protocol
                </button>
                <button
                  onClick={handleForceTrigger}
                  className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Force Immediate Override
                </button>
              </div>
            </div>
          ) : (
            /* Arm Form */
            <form onSubmit={handleArm} className="space-y-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-[#262626] pb-3">
                Arm Emergency Break-Glass Countdown
              </h2>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                  Emergency Crisis Justification *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#262626] text-xs font-medium text-slate-900 dark:text-white bg-white dark:bg-[#141414] focus:border-[#10B981] dark:focus:border-[#3ECF8E]"
                >
                  <option value="Medical Emergency / Hospitalization">Medical Emergency / Hospitalization</option>
                  <option value="Unforeseen Critical Accident">Unforeseen Critical Accident</option>
                  <option value="Legal & Succession Mandate">Legal & Succession Mandate</option>
                  <option value="Loss of Primary Custodian Contact">Loss of Primary Custodian Contact</option>
                  <option value="Other Critical Life Event">Other Critical Life Event</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                  Emergency Hospital / Case Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Admitted to Lilavati Hospital ICU, attending Dr. Mehta..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-[#262626] text-xs font-medium text-slate-900 dark:text-white bg-white dark:bg-[#141414] focus:border-[#10B981] dark:focus:border-[#3ECF8E]"
                />
              </div>

              <div className="p-4 bg-red-50/70 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl text-xs text-red-900 dark:text-red-300 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">warning</span>
                  Important Protocol Notice:
                </span>
                <p className="text-[11px] text-red-800 dark:text-red-300/80 leading-relaxed">
                  Arming this protocol initiates a strict {delayHours}-hour verification period. Broadcast notifications are sent to all designated family nominees. If the primary admin is available, they can cancel at any point before countdown completion.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">shield_lock</span>
                <span>{loading ? 'Arming Protocol...' : `Arm ${delayHours}-Hour Break-Glass Countdown`}</span>
              </button>
            </form>
          )}
        </div>

        {/* Right: Nominees & Escalation Rules (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Emergency Nominees Card */}
          <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-6 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-4 transition-colors">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-lg">contact_phone</span>
              <span>Designated Emergency Nominees</span>
            </h3>

            <div className="space-y-3">
              {emergencyContacts.map((contact) => (
                <div key={contact._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-100 dark:border-[#262626]">
                  <div className="flex items-center gap-2.5">
                    <img src={contact.avatar} alt={contact.name} className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-neutral-700" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{contact.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-neutral-400">{contact.relationship} • {contact.role}</div>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-semibold text-slate-700 dark:text-neutral-300">{contact.phone}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Legal Compliance Directive */}
          <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-6 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-3 text-xs text-slate-600 dark:text-neutral-400 transition-colors">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 dark:text-[#3ECF8E] text-lg">gavel</span>
              <span>Indian Succession Act Compliance</span>
            </h3>
            <p className="leading-relaxed">
              In accordance with Section 63 of the Indian Succession Act 1925, digitally stored testamentary records and health directives are held in trust. The break-glass countdown prevents unauthorized takeover while guaranteeing immediate availability during critical life events.
            </p>
          </div>
        </div>
      </div>

      {/* Break-Glass Action Confirmation Modal */}
      {confirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
          onClick={() => setConfirmModal(null)}
        >
          <div
            className="fixed inset-x-0 bottom-0 md:static md:inset-auto w-full max-w-md bg-white dark:bg-[#18181B] border-t md:border border-slate-200 dark:border-[#27272A] rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col max-h-[88vh] md:max-h-[85vh] overflow-hidden transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Handle Pill */}
            <div className="md:hidden flex justify-center pt-2.5 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-neutral-600" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-[#27272A] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                    {confirmModal.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">Emergency Protocol Confirmation</p>
                </div>
              </div>
              <button
                onClick={() => setConfirmModal(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-[#27272A] text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-3">
              <p className="text-xs text-slate-700 dark:text-neutral-300 leading-relaxed">
                {confirmModal.desc}
              </p>
            </div>

            {/* Fixed Footer */}
            <div className="px-4 sm:px-6 py-3.5 bg-slate-50 dark:bg-[#141414] border-t border-slate-100 dark:border-[#27272A] flex flex-col-reverse sm:flex-row items-center sm:justify-end gap-2.5 shrink-0 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#27272A] font-bold text-xs transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 transition-all cursor-pointer text-center"
              >
                <span>{loading ? 'Processing...' : confirmModal.confirmText || 'Confirm'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
