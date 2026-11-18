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
  HardDrive
} from 'lucide-react';

export default function DashboardPage() {
  const { user, family, setIsEmergencyModalOpen } = useAuth();
  const navigate = useNavigate();

  const [familyData, setFamilyData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

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
    <div className="max-w-[1380px] mx-auto p-4 sm:p-6 space-y-5 font-sans">
      {/* ================= GREETING & WELCOME BANNER ================= */}
      <div className="bg-[#1C1C1C] rounded-lg p-5 sm:p-6 border border-[#2E2E2E] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 transition-colors">
        <div>
          {/* Signature Supabase Emerald Pill */}
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#3ECF8E]/10 text-[#3ECF8E] border border-[#3ECF8E]/25 text-xs font-medium mb-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E] animate-pulse" />
            <span>Private Family Repository</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#EDEDED]">
            Welcome, {user?.name ? user.name.split(' ')[0] : 'Family'} 👋
          </h1>
          <p className="text-sm text-[#8F8F8F] mt-1 leading-relaxed">
            Your family's encrypted vault for vital ID cards, medical records, and property papers.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsEmergencyModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-red-950/60 hover:bg-red-900/60 text-red-400 border border-red-900/50 font-medium text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <HeartPulse size={15} />
            <span>Emergency Card</span>
          </button>

          <Link
            to="/vault/upload"
            className="px-4 py-2 rounded-lg bg-[#3ECF8E] hover:bg-[#34b27b] text-black font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Upload Document</span>
          </Link>
        </div>
      </div>

      {/* ================= URGENT EXPIRY REMINDERS (If any) ================= */}
      {expiringDocs.length > 0 && (
        <div className="w-full bg-[#1C1C1C] border border-amber-500/25 rounded-lg p-4 shadow-xs transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle size={16} />
              </div>
              <div>
                <div className="text-sm font-medium text-[#EDEDED] flex items-center gap-2">
                  <span>Document Renewal Reminder</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono text-[10px] font-medium uppercase">
                    Expiring Soon
                  </span>
                </div>
                <div className="text-xs text-[#8F8F8F] mt-0.5">
                  {expiringDocs[0].title} expires on {new Date(expiringDocs[0].expiryDate).toLocaleDateString()}
                  {expiringDocs.length > 1 && ` (+${expiringDocs.length - 1} more)`}
                </div>
              </div>
            </div>
            <Link
              to={`/vault/documents/${expiringDocs[0]._id}`}
              className="px-3.5 py-1.5 rounded-lg bg-[#2E2E2E] hover:bg-[#383838] text-[#EDEDED] text-xs font-medium shrink-0 text-center transition-colors"
            >
              View Document
            </Link>
          </div>
        </div>
      )}

      {/* ================= METRICS & STATS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Link
          to="/family"
          className="bg-[#1C1C1C] rounded-lg p-4 border border-[#2E2E2E] hover:border-[#3ECF8E]/40 transition-colors block group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[#8F8F8F]">
              Family Members
            </span>
            <Users size={15} className="text-[#8F8F8F] group-hover:text-[#3ECF8E] transition-colors" />
          </div>
          <div className="text-2xl font-semibold text-[#EDEDED] mt-1.5">{members.length}</div>
          <div className="text-xs text-[#3ECF8E] font-medium mt-1">Manage family →</div>
        </Link>

        <Link
          to="/vault"
          className="bg-[#1C1C1C] rounded-lg p-4 border border-[#2E2E2E] hover:border-[#3ECF8E]/40 transition-colors block group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[#8F8F8F]">
              Total Documents
            </span>
            <FileText size={15} className="text-[#8F8F8F] group-hover:text-[#3ECF8E] transition-colors" />
          </div>
          <div className="text-2xl font-semibold text-[#EDEDED] mt-1.5">{documents.length}</div>
          <div className="text-xs text-[#3ECF8E] font-medium mt-1">Browse vault →</div>
        </Link>

        <div className="bg-[#1C1C1C] rounded-lg p-4 border border-[#2E2E2E]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[#8F8F8F]">
              Storage Used
            </span>
            <HardDrive size={15} className="text-[#8F8F8F]" />
          </div>
          <div className="text-2xl font-semibold text-[#EDEDED] mt-1.5">
            {familyData?.totalSizeBytes ? (familyData.totalSizeBytes / (1024 * 1024)).toFixed(1) + ' MB' : '0 MB'}
          </div>
          <div className="text-xs text-[#3ECF8E] font-medium mt-1">50 GB Free Tier</div>
        </div>

        <button
          type="button"
          onClick={() => setIsEmergencyModalOpen(true)}
          className="bg-[#1C1C1C] rounded-lg p-4 border border-[#2E2E2E] hover:border-red-500/40 text-left transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-red-400">
              Emergency Cards
            </span>
            <HeartPulse size={15} className="text-red-400 group-hover:scale-105 transition-transform" />
          </div>
          <div className="text-2xl font-semibold text-[#EDEDED] mt-1.5">
            {members.filter((m) => m.bloodGroup).length}
          </div>
          <div className="text-xs text-red-400 font-medium mt-1">Open medical card →</div>
        </button>
      </div>

      {/* ================= ONE-TAP "COPY NUMBER" SECTION ================= */}
      {idCards.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-medium text-[#EDEDED]">One-Tap ID Numbers</h2>
              <p className="text-xs text-[#8F8F8F]">Copy Aadhaar, PAN, or Passport number in 1 tap without opening files.</p>
            </div>
            <Link to="/vault" className="text-xs font-medium text-[#3ECF8E] hover:underline">
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {idCards.slice(0, 3).map((doc) => (
              <div
                key={doc._id}
                onClick={() => navigate(`/vault/documents/${doc._id}`)}
                className="bg-[#1C1C1C] rounded-lg p-4 border border-[#2E2E2E] hover:border-[#3ECF8E]/40 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#3ECF8E]/10 text-[#3ECF8E] border border-[#3ECF8E]/20 flex items-center justify-center shrink-0">
                      {doc.category === 'ID Cards' ? (
                        <CreditCard size={15} />
                      ) : doc.category === 'Medical & Health' ? (
                        <HeartPulse size={15} />
                      ) : (
                        <Building2 size={15} />
                      )}
                    </div>
                    <div className="truncate">
                      <h4 className="text-xs font-medium text-[#EDEDED] truncate">{doc.title}</h4>
                      <span className="text-[11px] text-[#8F8F8F]">{doc.category}</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-[#8F8F8F] shrink-0">
                    {doc.assignedMember?.name?.split(' ')[0] || 'Family'}
                  </span>
                </div>

                {/* ID Number Box & One-Tap Copy Button */}
                <div className="mt-3 pt-2.5 border-t border-[#262626] flex items-center justify-between gap-2">
                  <div className="font-mono text-xs font-semibold text-[#EDEDED] bg-[#141414] px-2 py-1 rounded border border-[#2E2E2E] truncate">
                    {doc.documentNumber}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleCopyNumber(doc.documentNumber, doc._id, e)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                      copiedId === doc._id
                        ? 'bg-[#3ECF8E] text-black font-semibold'
                        : 'bg-[#262626] hover:bg-[#333] text-[#3ECF8E]'
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
      <div className="bg-[#1C1C1C] rounded-lg p-5 border border-[#2E2E2E] space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-medium text-[#EDEDED]">Recent Documents</h2>
            <p className="text-xs text-[#8F8F8F]">Recently uploaded papers in your family vault</p>
          </div>
          {documents.length > 0 && (
            <Link to="/vault" className="text-xs font-medium text-[#3ECF8E] hover:underline">
              See All Documents →
            </Link>
          )}
        </div>

        {documents.length === 0 ? (
          /* Clean Friendly Zero-Mock Empty State */
          <div className="py-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-lg bg-[#141414] border border-[#2E2E2E] text-[#8F8F8F] flex items-center justify-center mx-auto">
              <FolderOpen size={24} className="text-[#3ECF8E]" />
            </div>
            <div>
              <h3 className="text-base font-medium text-[#EDEDED]">Your Family Vault is Ready!</h3>
              <p className="text-xs text-[#8F8F8F] max-w-sm mx-auto mt-1">
                Upload your first essential document (Aadhaar, Passport, or Insurance) or add your family members.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              <Link
                to="/vault/upload"
                className="px-4 py-2 rounded-lg bg-[#3ECF8E] hover:bg-[#34b27b] text-black font-semibold text-xs transition-all flex items-center gap-1.5"
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>Upload First Document</span>
              </Link>
              <Link
                to="/family"
                className="px-4 py-2 rounded-lg border border-[#2E2E2E] hover:bg-[#262626] text-[#EDEDED] text-xs font-medium transition-colors"
              >
                <span>Add Family Members</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#262626]">
            {documents.slice(0, 5).map((doc) => (
              <div
                key={doc._id}
                onClick={() => navigate(`/vault/documents/${doc._id}`)}
                className="py-3 flex items-center justify-between hover:bg-[#222222] px-2 rounded-lg transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#141414] border border-[#2E2E2E] text-[#3ECF8E] flex items-center justify-center shrink-0">
                    {doc.category === 'ID Cards' ? (
                      <CreditCard size={15} />
                    ) : doc.category === 'Medical & Health' ? (
                      <HeartPulse size={15} />
                    ) : (
                      <FileText size={15} />
                    )}
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-medium text-[#EDEDED] group-hover:text-[#3ECF8E] truncate">
                      {doc.title}
                    </div>
                    <div className="text-[11px] text-[#8F8F8F] flex items-center gap-2 mt-0.5">
                      <span>{doc.category}</span>
                      {doc.documentNumber && <span>• {doc.documentNumber}</span>}
                      {doc.assignedMember && <span>• {doc.assignedMember.name}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {doc.documentNumber && (
                    <button
                      type="button"
                      onClick={(e) => handleCopyNumber(doc.documentNumber, doc._id, e)}
                      className="hidden sm:inline-flex px-2 py-0.5 rounded bg-[#262626] hover:bg-[#333] text-[#EDEDED] text-[11px] font-medium items-center gap-1 cursor-pointer"
                    >
                      {copiedId === doc._id ? <Check size={11} className="text-[#3ECF8E]" /> : <Copy size={11} />}
                      <span>{copiedId === doc._id ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                  <ChevronRight size={15} className="text-[#8F8F8F] group-hover:text-[#3ECF8E] transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
