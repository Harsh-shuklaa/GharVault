import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function MemberProfilePage() {
  const { memberId } = useParams();
  const [member, setMember] = useState(null);
  const [assignedDocs, setAssignedDocs] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [copiedNumber, setCopiedNumber] = useState(null);

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

  const handleCopyNumber = (num, e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <span className="material-symbols-outlined text-3xl text-blue-600 animate-spin">refresh</span>
          <p className="text-xs text-slate-500 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <span className="material-symbols-outlined text-4xl text-slate-300">person_off</span>
        <h2 className="text-lg font-bold text-slate-800">Family Member Not Found</h2>
        <Link to="/family" className="text-xs text-blue-600 font-bold hover:underline">
          ← Back to Family Members
        </Link>
      </div>
    );
  }

  const filteredDocs = assignedDocs.filter(d =>
    activeCategory === 'All' || d.category.toLowerCase() === activeCategory.toLowerCase()
  );

  return (
    <div className="max-w-[1380px] mx-auto p-6 lg:p-8 space-y-6">
      {/* Back Link */}
      <Link
        to="/family"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        <span>Back to Family Members</span>
      </Link>

      {/* Hero Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <img
            src={member.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name)}`}
            alt={member.name}
            className="w-20 h-20 rounded-2xl object-cover ring-4 ring-slate-100 shadow-md shrink-0"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{member.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                member.role === 'ADMIN' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
              }`}>
                {member.role === 'ADMIN' ? 'Family Admin' : 'Family Member'}
              </span>
              {member.isEmergencyContact && (
                <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold flex items-center gap-1">
                  <span>🚨</span> Primary Emergency Contact
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-1 font-semibold">
              Relationship: <strong className="text-slate-800">{member.relationship}</strong>
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-2.5">
              {member.phone && (
                <a href={`tel:${member.phone}`} className="flex items-center gap-1.5 hover:text-blue-600 font-medium">
                  <span className="material-symbols-outlined text-sm text-slate-400">call</span>
                  {member.phone}
                </a>
              )}
              {member.email && (
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="material-symbols-outlined text-sm text-slate-400">mail</span>
                  {member.email}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/vault/upload?member=${member._id}`}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">upload</span>
            <span>+ Upload Document</span>
          </Link>
        </div>
      </div>

      {/* Emergency Medical Summary Banner */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-5 border border-red-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center font-extrabold text-lg shadow-md shadow-red-500/30">
            {member.bloodGroup || '🩸'}
          </div>
          <div>
            <div className="text-xs font-bold text-red-900 uppercase tracking-wider">
              Emergency Medical Card Details
            </div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              Blood Group: <span className="text-red-700">{member.bloodGroup || 'Not Specified'}</span>
              {member.healthInsurancePolicy && (
                <span className="text-slate-600 font-medium ml-3">
                  • Health Insurance: <strong className="text-slate-900">{member.healthInsurancePolicy}</strong>
                </span>
              )}
            </div>
            {member.allergies && (
              <div className="text-xs text-red-700 font-medium mt-0.5">
                Critical Note / Allergies: {member.allergies}
              </div>
            )}
          </div>
        </div>

        {member.phone && (
          <a
            href={`tel:${member.phone}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-colors self-start sm:self-center"
          >
            <span className="material-symbols-outlined text-base">call</span>
            <span>Call Emergency Contact</span>
          </a>
        )}
      </div>

      {/* Split Body: Assigned Documents (7 Cols) & Recent Activity (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Assigned Documents */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {member.name}'s Documents ({assignedDocs.length})
              </h2>
              <p className="text-xs text-slate-500">ID cards, medical prescriptions, and certificates</p>
            </div>

            {/* Category Tabs */}
            <div className="inline-flex p-1 rounded-xl bg-slate-100 text-xs font-semibold text-slate-600">
              {['All', 'ID Cards', 'Medical & Health', 'Bank & Property', 'Education'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeCategory === cat
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredDocs.length === 0 ? (
              <div className="p-10 text-center rounded-2xl border border-dashed border-slate-200 space-y-3">
                <span className="material-symbols-outlined text-3xl text-slate-300">folder_open</span>
                <p className="text-xs text-slate-500 font-medium">
                  No documents found for {member.name} under {activeCategory}.
                </p>
                <Link
                  to={`/vault/upload?member=${member._id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  <span>Upload Document</span>
                </Link>
              </div>
            ) : (
              filteredDocs.map((doc) => (
                <div
                  key={doc._id}
                  className="p-4 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200/80 transition-colors flex items-center justify-between group"
                >
                  <Link to={`/vault/documents/${doc._id}`} className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-white text-blue-600 flex items-center justify-center border border-slate-200 shadow-xs shrink-0">
                      <span className="material-symbols-outlined text-xl">
                        {doc.category === 'ID Cards' ? 'badge' :
                         doc.category === 'Medical & Health' ? 'health_and_safety' :
                         doc.category === 'Bank & Property' ? 'account_balance' : 'description'}
                      </span>
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 truncate">
                        {doc.title}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {doc.category} • {(doc.fileSize / (1024 * 1024)).toFixed(1)} MB
                      </div>
                    </div>
                  </Link>

                  {/* One-Tap Copy Number Bar */}
                  {doc.documentNumber && (
                    <div className="flex items-center gap-2 mr-3">
                      <code className="text-xs font-mono font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
                        {doc.documentNumber}
                      </code>
                      <button
                        onClick={(e) => handleCopyNumber(doc.documentNumber, e)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1 transition-colors"
                        title="Copy document number"
                      >
                        <span className="material-symbols-outlined text-xs">
                          {copiedNumber === doc.documentNumber ? 'check' : 'content_copy'}
                        </span>
                        <span>{copiedNumber === doc.documentNumber ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}

                  <Link
                    to={`/vault/documents/${doc._id}`}
                    className="p-2 rounded-lg text-slate-400 group-hover:text-blue-600 hover:bg-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Recent Activity */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-lg">schedule</span>
              <span>Recent Activity</span>
            </h3>

            <div className="space-y-3 text-xs">
              {recentActivity.length === 0 ? (
                <div className="text-slate-400 text-xs py-4 text-center">
                  No recent activity recorded for this member.
                </div>
              ) : (
                recentActivity.map((log) => (
                  <div key={log._id} className="flex items-start gap-2.5 pb-2.5 border-b border-slate-100 last:border-0 last:pb-0">
                    <span className="material-symbols-outlined text-sm text-blue-500 mt-0.5">task_alt</span>
                    <div>
                      <div className="font-medium text-slate-800">
                        {log.action === 'UPLOAD' ? 'Uploaded' :
                         log.action === 'VIEW' ? 'Viewed' :
                         log.action === 'DOWNLOAD' ? 'Downloaded' : log.action}: <strong className="text-slate-900">{log.documentTitle}</strong>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
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
