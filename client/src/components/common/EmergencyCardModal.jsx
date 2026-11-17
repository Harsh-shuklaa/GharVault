import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-fadeIn">
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-red-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-red-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center text-white backdrop-blur-xs">
              <span className="material-symbols-outlined text-2xl">local_hospital</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Family Emergency Medical Card</h2>
                <span className="px-2 py-0.5 rounded-full bg-white text-red-700 font-mono text-[10px] font-extrabold uppercase">
                  Fast Access
                </span>
              </div>
              <p className="text-xs text-red-100">
                Blood Groups, Emergency Contacts, & Cashless Health Insurance Details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              <span className="material-symbols-outlined text-3xl text-red-600 animate-spin mb-2 block">
                refresh
              </span>
              Loading emergency credentials...
            </div>
          ) : data.members.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-3xl">medical_information</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">No Family Members Added Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Add your family members under <strong>Family Members</strong> to see their Blood Group and Health Insurance policies here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.members.map((member) => (
                <div
                  key={member.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-red-300 transition-colors space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-12 h-12 rounded-xl object-cover ring-2 ring-white shadow-xs shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{member.name}</h4>
                          <span className="text-xs px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-semibold">
                            {member.relationship}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>Phone: {member.phone}</span>
                          {member.phone && member.phone !== 'Not set' && (
                            <button
                              onClick={() => copyToClipboard(member.phone, member.id + '-phone')}
                              className="text-[11px] text-blue-600 hover:underline font-semibold"
                            >
                              {copiedText === member.id + '-phone' ? 'Copied' : 'Copy'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Blood Group Badge */}
                    <div className="px-3.5 py-1.5 rounded-xl bg-red-100 text-red-800 text-center shrink-0 border border-red-200">
                      <span className="text-[10px] uppercase font-bold text-red-600 block">Blood Group</span>
                      <span className="text-base font-extrabold font-mono text-red-700">
                        {member.bloodGroup || '—'}
                      </span>
                    </div>
                  </div>

                  {/* Medical Insurance & Emergency Contact Line */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/70 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        Health Insurance / TPA Card
                      </span>
                      <div className="font-semibold text-slate-900 truncate">
                        {member.healthInsurancePolicy || 'No policy added'}
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        Emergency Contact Phone
                      </span>
                      <div className="font-semibold text-slate-900 truncate flex items-center justify-between">
                        <span>{member.emergencyContactPhone || 'Same as primary'}</span>
                        {member.emergencyContactPhone && (
                          <a
                            href={`tel:${member.emergencyContactPhone}`}
                            className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold hover:bg-emerald-100"
                          >
                            Call
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
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Keep this accessible during hospital check-ins.
          </span>
          <button
            onClick={copyAllSummary}
            className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-base">content_copy</span>
            <span>{copiedText === 'all' ? 'Copied to Clipboard!' : 'Copy All Emergency Details'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
