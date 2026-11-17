import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function PermissionsMatrixPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const res = await api.getMembers();
      setMembers(res.members || []);
    } catch (err) {
      console.error('Failed to load permissions matrix:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (memberId, field) => {
    const member = members.find(m => m._id === memberId);
    if (!member) return;

    const updatedPermissions = {
      ...member.permissions,
      [field]: !member.permissions?.[field],
    };

    try {
      await api.updateMemberPermissions(memberId, { permissions: updatedPermissions });
      setMembers(prev => prev.map(m => m._id === memberId ? { ...m, permissions: updatedPermissions } : m));
      setSuccessMsg(`Updated authorization for ${member.name}`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert('Error updating permission: ' + err.message);
    }
  };

  const capabilities = [
    { key: 'canUpload', label: 'Upload Documents', desc: 'Can ingest new records into vault' },
    { key: 'canDownload', label: 'Download Non-Sensitive', desc: 'Can download standard PDFs' },
    { key: 'canViewSensitive', label: 'View High-Value Deeds', desc: 'Access to property & wills' },
    { key: 'canSignQuorum', label: 'Dual-Key Quorum Signer', desc: 'Can provide cryptographic key sign-off' },
    { key: 'canArmBreakGlass', label: 'Arm Break-Glass Protocol', desc: 'Can trigger 48h emergency countdown' },
    { key: 'canDelete', label: 'Permanent Delete', desc: 'Can permanently purge sealed records' },
  ];

  return (
    <div className="max-w-[1380px] mx-auto p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Permissions Matrix</h1>
          <p className="text-xs text-slate-500 mt-1">
            Fine-grained role-based access control and multi-signature authorization rights across family custodians.
          </p>
        </div>
        {successMsg && (
          <span className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
            {successMsg}
          </span>
        )}
      </div>

      {/* Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0F172A] text-white text-xs border-b border-[#1E293B]">
                <th className="py-4 px-6 w-1/3">Security Capability / Privilege</th>
                {members.map((m) => (
                  <th key={m._id} className="py-4 px-4 text-center">
                    <div className="flex flex-col items-center">
                      <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full object-cover mb-1 ring-1 ring-slate-600" />
                      <span className="font-bold text-slate-100">{m.name.split(' ')[0]}</span>
                      <span className="text-[10px] text-slate-400 font-mono uppercase">{m.role}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {capabilities.map((cap) => (
                <tr key={cap.key} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-900">{cap.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{cap.desc}</div>
                  </td>
                  {members.map((m) => {
                    const isGranted = Boolean(m.permissions?.[cap.key]);
                    return (
                      <td key={m._id} className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggle(m._id, cap.key)}
                          className={`w-8 h-8 rounded-xl inline-flex items-center justify-center transition-all cursor-pointer ${
                            isGranted
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          }`}
                          title={`Click to toggle ${cap.label} for ${m.name}`}
                        >
                          <span className="material-symbols-outlined text-lg">
                            {isGranted ? 'check' : 'remove'}
                          </span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Policy Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
            <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
            <span>Admin Authority</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Admins have master management over family invite codes, policy thresholds, and cold storage exports.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
            <span className="material-symbols-outlined text-lg">key</span>
            <span>Guardian Multi-Sig</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Guardians hold independent cryptographic key rights required to approve sensitive wills and registry deeds.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
            <span className="material-symbols-outlined text-lg">e911_emergency</span>
            <span>Emergency Escalation</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Designated emergency nominees automatically receive SMS and WhatsApp broadcast pings when Break-Glass is armed.
          </p>
        </div>
      </div>
    </div>
  );
}
