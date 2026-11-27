import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { HeartPulse, Copy, Check, Phone, X, AlertCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function EmergencyCardModal({ isOpen, onClose }) {
  const { family } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState({ members: [], insuranceDocuments: [] });
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(null);

  // Close on Escape key & Lock Body Scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      loadEmergencyData();
    }
  }, [isOpen]);

  const loadEmergencyData = async () => {
    try {
      setLoading(true);
      const res = await api.getEmergencyCard();
      setData(res || { members: [], insuranceDocuments: [] });
    } catch (err) {
      console.error('Failed to load emergency card:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, label, toastMsg) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    toast.success(toastMsg || 'Copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const copyAllSummary = () => {
    const summary = data.members
      .map(
        (m) =>
          `• ${m.name} (${m.relationship || m.relation || 'Member'})\n  Blood Group: ${
            m.bloodGroup || 'Not specified'
          }\n  Phone: ${m.phone || 'Not set'}\n  Emergency Contact: ${
            m.emergencyContactPhone || m.phone || 'Not set'
          }\n  Insurance: ${m.healthInsurancePolicy || 'No policy added'}${
            m.allergies && m.allergies !== 'None reported' ? '\n  Allergies: ' + m.allergies : ''
          }`
      )
      .join('\n\n');

    navigator.clipboard.writeText(
      `🏥 EMERGENCY MEDICAL DIRECTIVE — ${family?.name || 'GharVault'}\n\n${summary}`
    );
    setCopiedKey('all');
    toast.success('All emergency medical details copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-[#182030] border-t md:border border-slate-200 dark:border-[#1E293B] rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] md:max-h-[85vh] overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle Pill */}
        <div className="md:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-neutral-600" />
        </div>

        {/* Header */}
        <div className="bg-red-700 dark:bg-red-800 px-5 sm:px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white backdrop-blur-xs shrink-0">
              <HeartPulse size={22} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold truncate">Family Emergency Medical Card</h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-white text-red-700 font-mono text-[10px] font-extrabold uppercase">
                  Fast Access
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-red-100 truncate">
                Blood Groups, Emergency Directives & Health Insurance Policies
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-slate-500 dark:text-neutral-400 text-sm">
              <HeartPulse size={28} className="text-red-600 animate-pulse mx-auto mb-2" />
              Loading emergency credentials...
            </div>
          ) : data.members.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-600 flex items-center justify-center mx-auto">
                <AlertCircle size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No Family Members Added Yet</h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mx-auto">
                Add members under <strong>Family Members</strong> to see their Blood Group and Health Insurance policies here.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {data.members.map((member) => {
                const memberKey = member.id || member._id;
                return (
                  <div
                    key={memberKey}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-[#121622] border border-slate-200/80 dark:border-[#1E293B] hover:border-red-400 dark:hover:border-red-500/40 transition-colors space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3 min-w-0">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <img
                          src={
                            member.avatar ||
                            member.avatarUrl ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'Member')}&background=3ECF8E&color=121212`
                          }
                          alt={member.name}
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover ring-2 ring-white dark:ring-[#27272A] shadow-xs shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{member.name}</h4>
                            <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-md bg-slate-200 dark:bg-[#27272A] text-slate-700 dark:text-neutral-300 font-semibold shrink-0">
                              {member.relationship || member.relation || 'Member'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 flex items-center justify-between gap-2">
                            <span className="truncate">Phone: {member.phone || 'Not set'}</span>
                            {member.phone && member.phone !== 'Not set' && (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <a
                                  href={`tel:${member.phone}`}
                                  className="inline-flex items-center gap-1 text-[10px] text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-500/15 hover:bg-sky-100 dark:hover:bg-sky-500/25 px-2 py-0.5 rounded-lg border border-sky-300/60 dark:border-sky-500/30 font-bold transition-all active:scale-95"
                                  title="Call phone number"
                                >
                                  <Phone size={10} />
                                  <span>Call</span>
                                </a>
                                <button
                                  onClick={() =>
                                    copyToClipboard(
                                      member.phone,
                                      memberKey + '-phone',
                                      `${member.name}'s phone number copied!`
                                    )
                                  }
                                  className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
                                >
                                  {copiedKey === memberKey + '-phone' ? 'Copied' : 'Copy'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Blood Group Badge */}
                      <div className="px-3 py-1.5 rounded-xl bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-400 text-center shrink-0 border border-red-200 dark:border-red-500/30">
                        <span className="text-[9px] uppercase font-bold text-red-600 dark:text-red-400 block">Blood</span>
                        <span className="text-sm sm:text-base font-extrabold font-mono text-red-700 dark:text-red-300">
                          {member.bloodGroup || '—'}
                        </span>
                      </div>
                    </div>

                    {/* Medical Insurance & Emergency Contact Line */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-200/70 dark:border-[#1E293B] text-xs">
                      <div className="bg-white dark:bg-[#182030] p-2.5 rounded-xl border border-slate-200/60 dark:border-[#1E293B]">
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-neutral-500 block mb-0.5">
                          Health Insurance / Policy #
                        </span>
                        <div className="font-semibold text-slate-900 dark:text-neutral-200 truncate flex items-center justify-between">
                          <span className="truncate">{member.healthInsurancePolicy || 'No policy added'}</span>
                          {member.healthInsurancePolicy && (
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  member.healthInsurancePolicy,
                                  memberKey + '-insurance',
                                  'Policy number copied!'
                                )
                              }
                              className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline font-semibold ml-2 shrink-0 cursor-pointer"
                            >
                              {copiedKey === memberKey + '-insurance' ? 'Copied' : 'Copy'}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="bg-white dark:bg-[#182030] p-2.5 rounded-xl border border-slate-200/60 dark:border-[#1E293B]">
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-neutral-500 block mb-0.5">
                          Emergency Contact Phone
                        </span>
                        <div className="font-semibold text-slate-900 dark:text-neutral-200 truncate flex items-center justify-between">
                          <span>{member.emergencyContactPhone || 'Same as primary'}</span>
                          {member.emergencyContactPhone && (
                            <a
                              href={`tel:${member.emergencyContactPhone}`}
                              className="inline-flex items-center gap-1 text-[10px] text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-500/15 hover:bg-sky-100 dark:hover:bg-sky-500/25 px-2 py-0.5 rounded-lg border border-sky-300/60 dark:border-sky-500/30 font-bold transition-all active:scale-95"
                            >
                              <Phone size={10} />
                              <span>Call</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Known Allergies */}
                    {member.allergies && member.allergies !== 'None reported' && (
                      <div className="bg-amber-50 dark:bg-amber-500/10 p-2.5 rounded-xl border border-amber-200/80 dark:border-amber-500/20 text-xs">
                        <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block mb-0.5">
                          Critical Allergies / Directives
                        </span>
                        <div className="font-semibold text-amber-900 dark:text-amber-300">
                          ⚠️ {member.allergies}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Fixed Footer with One-Tap Copy All */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-50 dark:bg-[#121622] border-t border-slate-100 dark:border-[#1E293B] flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 shrink-0 pb-[max(1.25rem,env(safe-area-inset-bottom,20px))]">
          <span className="text-xs text-slate-500 dark:text-neutral-400 hidden sm:inline">
            Keep readily accessible during hospital admission.
          </span>
          <div className="flex flex-col-reverse sm:flex-row items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-300 dark:border-[#1E293B] text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#27272A] font-bold text-xs transition-colors cursor-pointer text-center"
            >
              Close
            </button>
            <button
              onClick={copyAllSummary}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-red-500/25 border border-red-500/30 cursor-pointer text-center active:scale-95"
            >
              {copiedKey === 'all' ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedKey === 'all' ? 'Copied All Directives' : 'Copy All Emergency Details'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
