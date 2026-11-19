import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  HeartPulse,
  Copy,
  Check,
  ChevronRight,
  FolderOpen,
  AlertTriangle,
  CreditCard,
  Building2,
  FileText,
  Users,
  HardDrive,
  UserPlus,
  KeyRound
} from 'lucide-react';
import JoinFamilyModal from '../components/common/JoinFamilyModal';

export default function DashboardPage() {
  const { user, family, setIsEmergencyModalOpen } = useAuth();
  const navigate = useNavigate();

  const [familyData, setFamilyData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const handleCopyInviteCode = () => {
    const code = family?.inviteCode || 'GHAR-4892';
    navigator.clipboard.writeText(code);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [famRes, docsRes, memRes] = await Promise.all([
        api.getFamily(),
        api.getDocuments(),
        api.getMembers(),
      ]);
      setFamilyData(famRes);
      setDocuments(docsRes.documents || []);
      setMembers(memRes.members || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyNumber = (number, docId, e) => {
    e.stopPropagation();
    if (!number) return;
    navigator.clipboard.writeText(number);
    setCopiedId(docId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Documents expiring soon (within next 30 days)
  const expiringDocs = documents.filter((d) => {
    if (!d.expiryDate) return false;
    const now = Date.now();
    const exp = new Date(d.expiryDate).getTime();
    return exp > now && exp <= now + 30 * 86400000;
  });

  // Recent ID Cards for quick 1-tap copy
  const idCards = documents.filter((d) => d.documentNumber && d.documentNumber.trim() !== '');

  return (
    <div className="max-w-[1380px] mx-auto p-4 sm:p-5 lg:p-6 space-y-5 sm:space-y-6 font-sans">
      {/* ================= GREETING & WELCOME BANNER ================= */}
      <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-4 sm:p-5 lg:p-6 border border-slate-200 dark:border-[#2E2E2E] shadow-sm dark:shadow-none flex flex-col md:flex-row md:items-center justify-between gap-5 transition-colors">
        <div>
          {/* Signature Supabase Emerald Pill */}
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-[#3ECF8E]/10 dark:text-[#3ECF8E] dark:border-[#3ECF8E]/25 text-xs font-medium mb-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] dark:bg-[#3ECF8E] animate-pulse" />
            <span>Private Family Repository</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-slate-900 dark:text-[#EDEDED]">
            Welcome, {user?.name ? user.name.split(' ')[0] : 'Family'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-[#8F8F8F] mt-1 leading-relaxed">
            Your family's encrypted vault for vital ID cards, medical records, and property papers.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsEmergencyModalOpen(true)}
            className="min-h-[44px] w-full sm:w-auto px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50 font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <HeartPulse size={16} />
            <span>Emergency Card</span>
          </button>

          <Link
            to="/vault/upload"
            className="min-h-[44px] w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] dark:bg-[#3ECF8E] dark:hover:bg-[#34b27b] text-white dark:text-[#121212] font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Upload Document</span>
          </Link>
        </div>
      </div>

      {/* ================= FAMILY INVITE CODE BANNER (OPTION 2) ================= */}
      <div className="bg-emerald-50/70 dark:bg-[#1C1C1C] border border-emerald-200 dark:border-[#2E2E2E] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs transition-colors">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#141414] border border-emerald-200 dark:border-[#3ECF8E]/30 text-[#10B981] dark:text-[#3ECF8E] flex items-center justify-center shrink-0 shadow-xs">
            <UserPlus size={19} />
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Family Vault Invite Code</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-[#3ECF8E]/20 text-emerald-800 dark:text-[#3ECF8E] font-bold">
                Active Code
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-neutral-400 mt-0.5 truncate">
              Family members can log in on their phones and enter this code under "Join Existing Family" to sync.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
          <code className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#262626] font-mono font-bold text-sm tracking-widest text-slate-900 dark:text-[#3ECF8E] shadow-2xs">
            {family?.inviteCode || 'GHAR-4892'}
          </code>
          <button
            type="button"
            onClick={handleCopyInviteCode}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            {copiedInvite ? <Check size={14} /> : <Copy size={14} />}
            <span>{copiedInvite ? 'Copied!' : 'Copy Code'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsJoinModalOpen(true)}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-[#2E2E2E] bg-white dark:bg-[#141414] hover:bg-slate-50 dark:hover:bg-[#202020] text-slate-700 dark:text-neutral-300 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <KeyRound size={14} className="text-[#10B981] dark:text-[#3ECF8E]" />
            <span>Join With Code</span>
          </button>
        </div>
      </div>

      {/* ================= URGENT EXPIRY REMINDERS (If any) ================= */}
      {expiringDocs.length > 0 && (
        <div className="w-full bg-white dark:bg-[#1C1C1C] border border-amber-300 dark:border-amber-500/25 rounded-lg p-4 shadow-sm dark:shadow-none transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle size={16} />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-900 dark:text-[#EDEDED] flex items-center gap-2">
                  <span>Document Renewal Reminder</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 font-mono text-[10px] font-medium uppercase">
                    Expiring Soon
                  </span>
                </div>
                <div className="text-xs text-slate-600 dark:text-[#8F8F8F] mt-0.5">
                  {expiringDocs[0].title} expires on {new Date(expiringDocs[0].expiryDate).toLocaleDateString()}
                  {expiringDocs.length > 1 && ` (+${expiringDocs.length - 1} more)`}
                </div>
              </div>
            </div>
            <Link
              to={`/vault/documents/${expiringDocs[0]._id}`}
              className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#2E2E2E] dark:hover:bg-[#383838] text-slate-800 dark:text-[#EDEDED] text-xs font-medium shrink-0 text-center transition-colors"
            >
              View Document
            </Link>
          </div>
        </div>
      )}

      {/* ================= METRICS & STATS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Link
          to="/family"
          className="bg-white dark:bg-[#1C1C1C] rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-[#2E2E2E] shadow-sm dark:shadow-none hover:border-[#10B981]/50 dark:hover:border-[#3ECF8E]/40 transition-colors block group min-w-0"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-[#8F8F8F] truncate">
              Family Members
            </span>
            <Users size={16} className="text-slate-400 group-hover:text-[#10B981] dark:text-[#8F8F8F] dark:group-hover:text-[#3ECF8E] transition-colors shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-[#EDEDED] mt-1.5 truncate">{members.length}</div>
          <div className="text-xs text-[#10B981] dark:text-[#3ECF8E] font-medium mt-1 truncate">Manage family →</div>
        </Link>

        <Link
          to="/vault"
          className="bg-white dark:bg-[#1C1C1C] rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-[#2E2E2E] shadow-sm dark:shadow-none hover:border-[#10B981]/50 dark:hover:border-[#3ECF8E]/40 transition-colors block group min-w-0"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-[#8F8F8F] truncate">
              Total Documents
            </span>
            <FileText size={16} className="text-slate-400 group-hover:text-[#10B981] dark:text-[#8F8F8F] dark:group-hover:text-[#3ECF8E] transition-colors shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-[#EDEDED] mt-1.5 truncate">{documents.length}</div>
          <div className="text-xs text-[#10B981] dark:text-[#3ECF8E] font-medium mt-1 truncate">Browse vault →</div>
        </Link>

        <div className="bg-white dark:bg-[#1C1C1C] rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-[#2E2E2E] shadow-sm dark:shadow-none min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-[#8F8F8F] truncate">
              Storage Used
            </span>
            <HardDrive size={16} className="text-slate-400 dark:text-[#8F8F8F] shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-[#EDEDED] mt-1.5 truncate">
            {familyData?.totalSizeBytes ? (familyData.totalSizeBytes / (1024 * 1024)).toFixed(1) + ' MB' : '0 MB'}
          </div>
          <div className="text-xs text-[#10B981] dark:text-[#3ECF8E] font-medium mt-1 truncate">50 GB Free Tier</div>
        </div>

        <button
          type="button"
          onClick={() => setIsEmergencyModalOpen(true)}
          className="bg-white dark:bg-[#1C1C1C] rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-[#2E2E2E] shadow-sm dark:shadow-none hover:border-red-400 dark:hover:border-red-500/40 text-left transition-colors cursor-pointer group min-w-0"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-red-600 dark:text-red-400 truncate">
              Emergency Cards
            </span>
            <HeartPulse size={16} className="text-red-500 dark:text-red-400 group-hover:scale-105 transition-transform shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-[#EDEDED] mt-1.5 truncate">
            {members.filter((m) => m.bloodGroup).length}
          </div>
          <div className="text-xs text-red-600 dark:text-red-400 font-medium mt-1 truncate">Open medical card →</div>
        </button>
      </div>

      {/* ================= ONE-TAP "COPY NUMBER" SECTION ================= */}
      {idCards.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-medium text-slate-900 dark:text-[#EDEDED]">One-Tap ID Numbers</h2>
              <p className="text-xs text-slate-500 dark:text-[#8F8F8F]">Copy Aadhaar, PAN, or Passport number in 1 tap without opening files.</p>
            </div>
            <Link to="/vault" className="text-xs font-medium text-[#10B981] dark:text-[#3ECF8E] hover:underline">
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {idCards.slice(0, 3).map((doc) => (
              <div
                key={doc._id}
                onClick={() => navigate(`/vault/documents/${doc._id}`)}
                className="bg-white dark:bg-[#1C1C1C] rounded-lg p-4 border border-slate-200 dark:border-[#2E2E2E] shadow-sm dark:shadow-none hover:border-[#10B981]/50 dark:hover:border-[#3ECF8E]/40 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-700 dark:text-[#3ECF8E] border border-emerald-200 dark:border-[#3ECF8E]/20 flex items-center justify-center shrink-0">
                      {doc.category === 'ID Cards' ? (
                        <CreditCard size={15} />
                      ) : doc.category === 'Medical & Health' ? (
                        <HeartPulse size={15} />
                      ) : (
                        <Building2 size={15} />
                      )}
                    </div>
                    <div className="truncate">
                      <h4 className="text-xs font-medium text-slate-900 dark:text-[#EDEDED] truncate">{doc.title}</h4>
                      <span className="text-[11px] text-slate-500 dark:text-[#8F8F8F]">{doc.category}</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-[#8F8F8F] shrink-0">
                    {doc.assignedMember?.name?.split(' ')[0] || 'Family'}
                  </span>
                </div>

                {/* ID Number Box & One-Tap Copy Button */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-[#262626] flex items-center justify-between gap-2 min-w-0">
                  <div className="font-mono text-xs font-semibold text-slate-800 dark:text-[#EDEDED] bg-slate-100 dark:bg-[#141414] px-2 py-1.5 rounded border border-slate-200 dark:border-[#2E2E2E] truncate min-w-0 flex-1">
                    {doc.documentNumber}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleCopyNumber(doc.documentNumber, doc._id, e)}
                    className={`min-h-[38px] px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center justify-center gap-1 shrink-0 cursor-pointer ${
                      copiedId === doc._id
                        ? 'bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] font-semibold'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#262626] dark:hover:bg-[#333] text-emerald-700 dark:text-[#3ECF8E]'
                    }`}
                  >
                    {copiedId === doc._id ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedId === doc._id ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= RECENT DOCUMENTS & EMPTY STATE ================= */}
      <div className="bg-white dark:bg-[#1C1C1C] rounded-lg p-5 border border-slate-200 dark:border-[#2E2E2E] shadow-sm dark:shadow-none space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-medium text-slate-900 dark:text-[#EDEDED]">Recent Documents</h2>
            <p className="text-xs text-slate-500 dark:text-[#8F8F8F]">Recently uploaded papers in your family vault</p>
          </div>
          {documents.length > 0 && (
            <Link to="/vault" className="text-xs font-medium text-[#10B981] dark:text-[#3ECF8E] hover:underline">
              See All Documents →
            </Link>
          )}
        </div>

        {documents.length === 0 ? (
          /* Clean Friendly Zero-Mock Empty State */
          <div className="py-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-[#141414] border border-slate-200 dark:border-[#2E2E2E] text-slate-400 dark:text-[#8F8F8F] flex items-center justify-center mx-auto">
              <FolderOpen size={24} className="text-[#10B981] dark:text-[#3ECF8E]" />
            </div>
            <div>
              <h3 className="text-base font-medium text-slate-900 dark:text-[#EDEDED]">Your Family Vault is Ready!</h3>
              <p className="text-xs text-slate-500 dark:text-[#8F8F8F] max-w-sm mx-auto mt-1">
                Upload your first essential document (Aadhaar, Passport, or Insurance) or add your family members.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              <Link
                to="/vault/upload"
                className="px-4 py-2 rounded-lg bg-[#10B981] hover:bg-[#059669] dark:bg-[#3ECF8E] dark:hover:bg-[#34b27b] text-white dark:text-[#121212] font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>Upload First Document</span>
              </Link>
              <Link
                to="/family"
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-[#2E2E2E] hover:bg-slate-50 dark:hover:bg-[#262626] text-slate-700 dark:text-[#EDEDED] text-xs font-medium transition-colors"
              >
                <span>Add Family Members</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-[#262626]">
            {documents.slice(0, 5).map((doc) => (
              <div
                key={doc._id}
                onClick={() => navigate(`/vault/documents/${doc._id}`)}
                className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/[0.04] px-2 rounded-lg transition-colors cursor-pointer group min-w-0 gap-2"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#141414] border border-slate-200 dark:border-[#2E2E2E] text-[#10B981] dark:text-[#3ECF8E] flex items-center justify-center shrink-0">
                    {doc.category === 'ID Cards' ? (
                      <CreditCard size={15} />
                    ) : doc.category === 'Medical & Health' ? (
                      <HeartPulse size={15} />
                    ) : (
                      <FileText size={15} />
                    )}
                  </div>
                  <div className="truncate min-w-0 flex-1">
                    <div className="text-xs font-medium text-slate-900 dark:text-[#EDEDED] group-hover:text-[#10B981] dark:group-hover:text-[#3ECF8E] truncate">
                      {doc.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-[#8F8F8F] flex items-center gap-1.5 mt-0.5 truncate">
                      <span>{doc.category}</span>
                      {doc.documentNumber && <span className="truncate">• {doc.documentNumber}</span>}
                      {doc.assignedMember && <span className="truncate hidden sm:inline">• {doc.assignedMember.name}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {doc.documentNumber && (
                    <button
                      type="button"
                      onClick={(e) => handleCopyNumber(doc.documentNumber, doc._id, e)}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-[#262626] dark:hover:bg-[#333] text-slate-700 dark:text-[#EDEDED] text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === doc._id ? <Check size={11} className="text-[#10B981] dark:text-[#3ECF8E]" /> : <Copy size={11} />}
                      <span className="hidden sm:inline">{copiedId === doc._id ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                  <ChevronRight size={15} className="text-slate-400 group-hover:text-[#10B981] dark:text-[#8F8F8F] dark:group-hover:text-[#3ECF8E] transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <JoinFamilyModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onJoined={async () => {
          await loadDashboard();
        }}
      />
    </div>
  );
}
