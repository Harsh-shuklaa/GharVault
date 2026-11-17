import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function MemberProfilePage() {
  const { memberId } = useParams();
  const [member, setMember] = useState(null);
  const [assignedDocs, setAssignedDocs] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMemberProfile();
  }, [memberId]);

  const loadMemberProfile = async () => {
    try {
      setLoading(true);
      const res = await api.getMember(memberId);
      if (res.member) {
        setMember(res.member);
        setAssignedDocs(res.assignedDocuments || []);
        setRecentActivity(res.recentActivity || []);
      }
    } catch (err) {
      console.error('Failed to load member profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <span className="material-symbols-outlined text-3xl text-blue-600 animate-spin">refresh</span>
          <p className="text-xs text-slate-500 font-mono">Loading custodian credentials...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <span className="material-symbols-outlined text-4xl text-slate-300">person_off</span>
        <h2 className="text-lg font-bold text-slate-800">Member Not Found</h2>
        <Link to="/family" className="text-xs text-blue-600 font-bold hover:underline">
          ← Back to Family Directory
        </Link>
      </div>
    );
  }

  const filteredDocs = assignedDocs.filter(d =>
    activeTab === 'All' || d.category.toLowerCase() === activeTab.toLowerCase()
  );

  return (
    <div className="max-w-[1380px] mx-auto p-6 lg:p-8 space-y-6">
      {/* Back Link */}
      <Link
        to="/family"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        <span>Back to Family Directory</span>
      </Link>

      {/* Member Profile Hero Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <img
            src={member.avatar}
            alt={member.name}
            className="w-20 h-20 rounded-2xl object-cover ring-4 ring-slate-100 shadow-md shrink-0"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{member.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                member.role === 'ADMIN' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                member.role === 'GUARDIAN' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                'bg-slate-100 text-slate-700'
              }`}>
                {member.role}
              </span>
              {member.isEmergencyContact && (
                <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 font-mono text-[10px] font-bold">
                  Emergency Nominee
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {member.relationship} • Sharma Family Trust Custodian
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-2">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-slate-400">mail</span>
                {member.email}
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-slate-400">call</span>
                {member.phone || '+91 98201 44891'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/vault/upload"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">upload</span>
            <span>Assign Document</span>
          </Link>
          <Link
            to="/permissions"
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
          >
            Manage Permissions
          </Link>
        </div>
      </div>

      {/* Split Body: Assigned Documents (7 Cols) & Governance Summary (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Assigned Documents */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Assigned Records ({assignedDocs.length})
              </h2>
              <p className="text-xs text-slate-500">Documents registered under {member.name}'s custody</p>
            </div>

            {/* Category Tabs */}
            <div className="inline-flex p-1 rounded-xl bg-slate-100 text-xs font-semibold text-slate-600">
              {['All', 'Identity', 'Financial', 'Property', 'Health'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    activeTab === tab
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredDocs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No records found under this category.
              </div>
            ) : (
              filteredDocs.map((doc) => (
                <Link
                  key={doc._id}
                  to={`/vault/documents/${doc._id}`}
                  className="p-3.5 rounded-xl bg-slate-50/80 hover:bg-blue-50/60 border border-slate-100 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white text-blue-600 flex items-center justify-center border border-slate-200 shadow-xs shrink-0">
                      <span className="material-symbols-outlined text-lg">
                        {doc.category === 'Identity' ? 'badge' :
                         doc.category === 'Property' ? 'real_estate_agent' :
                         doc.category === 'Health' ? 'health_and_safety' : 'account_balance'}
                      </span>
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 truncate">
                        {doc.title}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {doc.documentNumber || doc.category} • {(doc.fileSize / (1024 * 1024)).toFixed(1)} MB
                      </div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-blue-600 text-lg">
                    chevron_right
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Right: Permissions & Activity */}
        <div className="lg:col-span-5 space-y-6">
          {/* Permissions Matrix Pill */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-lg">vpn_key</span>
              <span>Custodian Authorization Matrix</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span>Upload Records</span>
                <span className="font-bold text-emerald-700">Granted</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span>Download Non-Sensitive</span>
                <span className="font-bold text-emerald-700">Granted</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span>Multi-Sig Quorum Signer</span>
                <span className={`font-bold ${member.permissions?.canSignQuorum ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {member.permissions?.canSignQuorum ? 'Authorized (Key Holder)' : 'Not Authorized'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span>Emergency Break-Glass Arm</span>
                <span className={`font-bold ${member.permissions?.canArmBreakGlass ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {member.permissions?.canArmBreakGlass ? 'Authorized' : 'Restricted to Guardians'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span>Delete Sealed Records</span>
                <span className={`font-bold ${member.permissions?.canDelete ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {member.permissions?.canDelete ? 'Admin Only' : 'Restricted'}
                </span>
              </div>
            </div>
          </div>

          {/* Member Activity Trail */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Member Audit History</h3>
            <div className="space-y-3 text-xs">
              {recentActivity.length === 0 ? (
                <div className="text-slate-400 text-[11px]">No recent audit logs for this member.</div>
              ) : (
                recentActivity.map((log) => (
                  <div key={log._id} className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-sm text-slate-400 mt-0.5">history</span>
                    <div>
                      <div className="font-medium text-slate-800">
                        {log.action.replace(/_/g, ' ')}: {log.documentTitle}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
