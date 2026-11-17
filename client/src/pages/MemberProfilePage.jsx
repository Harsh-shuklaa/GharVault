import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  Phone,
  Mail,
  HeartPulse,
  CreditCard,
  Building2,
  FileText,
  Copy,
  Check,
  ChevronRight,
  Clock,
  Shield,
  FolderOpen,
  Plus,
  AlertCircle
} from 'lucide-react';
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
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-[#1E1E1E] flex items-center justify-center mx-auto text-slate-400 dark:text-neutral-500">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Family Member Not Found</h2>
        <Link
          to="/family"
          className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-[#3ECF8E] font-bold hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Family Members</span>
        </Link>
      </div>
    );
  }

  const filteredDocs = assignedDocs.filter((d) =>
    activeCategory === 'All' || d.category.toLowerCase() === activeCategory.toLowerCase()
  );

  return (
    <div className="max-w-[1380px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Back Link */}
      <Link
        to="/family"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-[#3ECF8E] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Family Members</span>
      </Link>

      {/* Hero Card */}
      <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-[#262626] p-5 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <img
            src={member.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name)}`}
            alt={member.name}
            className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-slate-100 dark:ring-[#262626] shadow-md shrink-0"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {member.name}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  member.role === 'ADMIN'
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-[#3ECF8E] border border-emerald-200 dark:border-emerald-800/40'
                    : 'bg-slate-100 dark:bg-[#262626] text-slate-700 dark:text-neutral-300'
                }`}
              >
                {member.role === 'ADMIN' ? 'Family Admin' : 'Family Member'}
              </span>
              {member.isEmergencyContact && (
                <span className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-900/40 text-[10px] font-bold flex items-center gap-1">
                  <span>🚨</span> Primary Emergency Contact
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 font-semibold">
              Relationship: <strong className="text-slate-800 dark:text-neutral-200">{member.relationship}</strong>
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-neutral-300 mt-2.5">
              {member.phone && (
                <a
                  href={`tel:${member.phone}`}
                  className="flex items-center gap-1.5 hover:text-emerald-600 dark:hover:text-[#3ECF8E] font-medium"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500" />
                  {member.phone}
                </a>
              )}
              {member.email && (
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-neutral-400">
                  <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500" />
                  {member.email}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/vault/upload?member=${member._id}`}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-[#3ECF8E] dark:hover:bg-[#34b27b] text-white dark:text-black font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            <span>+ Upload Document</span>
          </Link>
        </div>
      </div>

      {/* Emergency Medical Summary Banner */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20 rounded-2xl p-5 border border-red-200/80 dark:border-red-900/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center font-extrabold text-base shadow-md shadow-red-500/30 shrink-0">
            {member.bloodGroup || '🩸'}
          </div>
          <div>
            <div className="text-[11px] font-bold text-red-900 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              <span>Emergency Medical Card</span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5">
              Blood Group: <span className="text-red-700 dark:text-red-400">{member.bloodGroup || 'Not Specified'}</span>
              {member.healthInsurancePolicy && (
                <span className="text-slate-600 dark:text-neutral-400 font-medium ml-3">
                  • Health Insurance:{' '}
                  <strong className="text-slate-900 dark:text-neutral-200">{member.healthInsurancePolicy}</strong>
                </span>
              )}
            </div>
            {member.allergies && (
              <div className="text-xs text-red-700 dark:text-red-300 font-medium mt-0.5">
                Critical Note / Allergies: {member.allergies}
              </div>
            )}
          </div>
        </div>

        {member.phone && (
          <a
            href={`tel:${member.phone}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-colors self-start sm:self-center shrink-0"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call Emergency Contact</span>
          </a>
        )}
      </div>

      {/* Split Body: Assigned Documents (7 Cols) & Recent Activity (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Assigned Documents */}
        <div className="lg:col-span-8 bg-white dark:bg-[#1C1C1C] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {member.name}'s Documents ({assignedDocs.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400">ID cards, medical prescriptions, and certificates</p>
            </div>

            {/* Category Tabs */}
            <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-[#171717] text-xs font-semibold text-slate-600 dark:text-neutral-400 border border-transparent dark:border-[#262626] overflow-x-auto max-w-full">
              {['All', 'ID Cards', 'Medical & Health', 'Bank & Property', 'Education'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 rounded-lg whitespace-nowrap transition-all ${
                    activeCategory === cat
                      ? 'bg-white dark:bg-[#262626] text-emerald-700 dark:text-[#3ECF8E] font-bold shadow-xs'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredDocs.length === 0 ? (
              <div className="p-10 text-center rounded-2xl border border-dashed border-slate-200 dark:border-[#262626] space-y-3">
                <FolderOpen className="w-10 h-10 text-slate-300 dark:text-neutral-600 mx-auto" />
                <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
                  No documents found for {member.name} under {activeCategory}.
                </p>
                <Link
                  to={`/vault/upload?member=${member._id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#3ECF8E] hover:bg-emerald-100 dark:hover:bg-emerald-900/40 font-bold text-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload Document</span>
                </Link>
              </div>
            ) : (
              filteredDocs.map((doc) => (
                <div
                  key={doc._id}
                  className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-[#171717] hover:bg-slate-100/80 dark:hover:bg-[#222222] border border-slate-200/80 dark:border-[#262626] transition-colors flex items-center justify-between group gap-3"
                >
                  <Link to={`/vault/documents/${doc._id}`} className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1C1C1C] text-emerald-600 dark:text-[#3ECF8E] flex items-center justify-center border border-slate-200 dark:border-[#262626] shadow-xs shrink-0">
                      {doc.category === 'ID Cards' ? (
                        <CreditCard className="w-5 h-5" />
                      ) : doc.category === 'Medical & Health' ? (
                        <HeartPulse className="w-5 h-5" />
                      ) : doc.category === 'Bank & Property' ? (
                        <Building2 className="w-5 h-5" />
                      ) : (
                        <FileText className="w-5 h-5" />
                      )}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-[#3ECF8E] truncate">
                        {doc.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium mt-0.5">
                        {doc.category} • {(doc.fileSize / (1024 * 1024)).toFixed(1)} MB
                      </div>
                    </div>
                  </Link>

                  {/* One-Tap Copy Number Bar */}
                  {doc.documentNumber && (
                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                      <code className="text-xs font-mono font-bold text-slate-700 dark:text-neutral-300 bg-white dark:bg-[#1C1C1C] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#262626] shadow-xs">
                        {doc.documentNumber}
                      </code>
                      <button
                        onClick={(e) => handleCopyNumber(doc.documentNumber, e)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-[#3ECF8E] text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Copy document number"
                      >
                        {copiedNumber === doc.documentNumber ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#3ECF8E]" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <Link
                    to={`/vault/documents/${doc._id}`}
                    className="p-2 rounded-lg text-slate-400 dark:text-neutral-500 group-hover:text-emerald-600 dark:group-hover:text-[#3ECF8E] hover:bg-white dark:hover:bg-[#262626] transition-colors shrink-0"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Recent Activity */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-[#3ECF8E]" />
              <span>Recent Activity</span>
            </h3>

            <div className="space-y-3 text-xs">
              {recentActivity.length === 0 ? (
                <div className="text-slate-400 dark:text-neutral-500 text-xs py-4 text-center">
                  No recent activity recorded for this member.
                </div>
              ) : (
                recentActivity.map((log) => (
                  <div
                    key={log._id}
                    className="flex items-start gap-2.5 pb-2.5 border-b border-slate-100 dark:border-[#262626] last:border-0 last:pb-0"
                  >
                    <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-[#3ECF8E] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-slate-800 dark:text-neutral-200">
                        {log.action === 'UPLOAD'
                          ? 'Uploaded'
                          : log.action === 'VIEW'
                          ? 'Viewed'
                          : log.action === 'DOWNLOAD'
                          ? 'Downloaded'
                          : log.action}
                        : <strong className="text-slate-900 dark:text-white">{log.documentTitle}</strong>
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono mt-0.5">
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
