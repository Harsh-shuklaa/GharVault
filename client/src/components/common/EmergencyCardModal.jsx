import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { HeartPulse, Copy, Check, Phone, X, AlertCircle } from 'lucide-react';

export default function EmergencyCardModal({ isOpen, onClose }) {
  const { family } = useAuth();
  const [data, setData] = useState({ members: [], insuranceDocuments: [] });
  const [loading, setLoading] = useState(true);
  const [copiedText, setCopiedText] = useState(null);

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

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const copyAllSummary = () => {
    const summary = data.members.map(m =>
      `• ${m.name} (${m.relationship})\n  Blood Group: ${m.bloodGroup}\n  Phone: ${m.phone}\n  Emergency Contact: ${m.emergencyContactPhone}\n  Insurance: ${m.healthInsurancePolicy}`
    ).join('\n\n');

    navigator.clipboard.writeText(`🏥 EMERGENCY MEDICAL DIRECTIVE — ${family?.name || 'GharVault'}\n\n${summary}`);
    setCopiedText('all');
    setTimeout(() => setCopiedText(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#1C1C1C] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-red-200 dark:border-red-900/40 overflow-hidden flex flex-col max-h-[90vh] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-red-700 px-4 py-3.5 sm:px-6 sm:py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/20 flex items-center justify-center text-white backdrop-blur-xs shrink-0">
              <HeartPulse size={22} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-lg font-bold truncate">Family Emergency Medical Card</h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-white text-red-700 font-mono text-[10px] font-extrabold uppercase">
                  Fast Access
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-red-100 truncate">
                Blood Groups, Emergency Contacts, & Cashless Health Insurance Details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
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
                Add your family members under <strong>Family Members</strong> to see their Blood Group and Health Insurance policies here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.members.map((member) => (
                <div
                  key={member.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-200/80 dark:border-[#262626] hover:border-red-400 dark:hover:border-red-500/40 transition-colors space-y-3"
                >
                  <div className="flex items-center justify-between gap-3 min-w-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover ring-2 ring-white dark:ring-[#262626] shadow-xs shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{member.name}</h4>
                          <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-md bg-slate-200 dark:bg-[#262626] text-slate-700 dark:text-neutral-300 font-semibold shrink-0">
                            {member.relationship}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 flex items-center gap-2 truncate">
                          <span className="truncate">Phone: {member.phone}</span>
                          {member.phone && member.phone !== 'Not set' && (
                            <button
                              onClick={() => copyToClipboard(member.phone, member.id + '-phone')}
                              className="text-[11px] text-[#3ECF8E] hover:underline font-semibold cursor-pointer shrink-0"
                            >
                              {copiedText === member.id + '-phone' ? 'Copied' : 'Copy'}
                            </button>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/70 dark:border-[#262626] text-xs">
                    <div className="bg-white dark:bg-[#1C1C1C] p-2.5 rounded-xl border border-slate-200/60 dark:border-[#262626]">
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-neutral-500 block mb-0.5">
                        Health Insurance / TPA Card
                      </span>
                      <div className="font-semibold text-slate-900 dark:text-neutral-200 truncate">
                        {member.healthInsurancePolicy || 'No policy added'}
                      </div>
                    </div>

                    <div className="bg-white dark:bg-[#1C1C1C] p-2.5 rounded-xl border border-slate-200/60 dark:border-[#262626]">
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-neutral-500 block mb-0.5">
                        Emergency Contact Phone
                      </span>
                      <div className="font-semibold text-slate-900 dark:text-neutral-200 truncate flex items-center justify-between">
                        <span>{member.emergencyContactPhone || 'Same as primary'}</span>
                        {member.emergencyContactPhone && (
                          <a
                            href={`tel:${member.emergencyContactPhone}`}
                            className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-[#3ECF8E] bg-emerald-50 dark:bg-[#3ECF8E]/10 px-2 py-0.5 rounded font-bold hover:bg-emerald-100"
                          >
                            <Phone size={10} />
                            <span>Call</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with One-Tap Copy All */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-[#141414] border-t border-slate-200 dark:border-[#262626] flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-neutral-400 hidden sm:inline">
            Keep this accessible during hospital check-ins.
          </span>
          <button
            onClick={copyAllSummary}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            {copiedText === 'all' ? <Check size={14} /> : <Copy size={14} />}
            <span>{copiedText === 'all' ? 'Copied to Clipboard!' : 'Copy All Emergency Details'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
