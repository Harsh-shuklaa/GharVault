import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

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
  const expiringDocs = documents.filter(d => {
    if (!d.expiryDate) return false;
    const now = Date.now();
    const exp = new Date(d.expiryDate).getTime();
    return exp > now && exp <= now + 30 * 86400000;
  });

  // Recent ID Cards for quick 1-tap copy
  const idCards = documents.filter(d => d.documentNumber && d.documentNumber.trim() !== '');

  return (
    <div className="max-w-[1380px] mx-auto p-6 lg:p-8 space-y-6">
      {/* ================= GREETING & WELCOME BANNER ================= */}
      <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome, {user?.name ? user.name.split(' ')[0] : 'Family'}! 👋
          </h1>
          <p className="text-sm text-slate-600 mt-1.5">
            Your family's secure space for essential ID cards, health records, and property papers.
          </p>
        </div>

        {/* Prominent Emergency Medical Card Button */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsEmergencyModalOpen(true)}
            className="px-5 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm flex items-center gap-2.5 shadow-md shadow-red-500/20 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-2xl">local_hospital</span>
            <span>Emergency Medical Card</span>
          </button>

          <Link
            to="/vault/upload"
            className="px-5 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all"
          >
            <span className="material-symbols-outlined text-2xl">add</span>
            <span>Upload Document</span>
          </Link>
        </div>
      </div>

      {/* ================= URGENT EXPIRY REMINDERS (If any) ================= */}
      {expiringDocs.length > 0 && (
        <div className="w-full bg-amber-50/90 border border-amber-200 rounded-3xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">warning_amber</span>
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Document Renewal Reminder</span>
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-mono text-[10px] font-bold uppercase">
                    Expiring Soon
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  {expiringDocs[0].title} expires on {new Date(expiringDocs[0].expiryDate).toLocaleDateString()}
                  {expiringDocs.length > 1 && ` (+${expiringDocs.length - 1} more)`}
                </div>
              </div>
            </div>
            <Link
              to={`/vault/documents/${expiringDocs[0]._id}`}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0 text-center"
            >
              View Document
            </Link>
          </div>
        </div>
      )}

      {/* ================= ONE-TAP "COPY NUMBER" SECTION ================= */}
      {idCards.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">One-Tap ID Numbers</h2>
              <p className="text-xs text-slate-500">Copy your Aadhaar, PAN, or Passport number in 1 tap without opening files.</p>
            </div>
            <Link to="/vault" className="text-xs font-bold text-blue-600 hover:underline">
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {idCards.slice(0, 3).map((doc) => (
              <div
                key={doc._id}
                onClick={() => navigate(`/vault/documents/${doc._id}`)}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-xl">
                        {doc.category === 'ID Cards' ? 'badge' :
                         doc.category === 'Medical & Health' ? 'health_and_safety' : 'account_balance'}
                      </span>
                    </div>
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{doc.title}</h4>
                      <span className="text-[11px] text-slate-500">{doc.category}</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-semibold">
                    {doc.assignedMember?.name?.split(' ')[0] || 'Family'}
                  </span>
                </div>

                {/* ID Number Box & One-Tap Copy Button */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="font-mono text-xs font-bold text-slate-800 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 truncate">
                    {doc.documentNumber}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleCopyNumber(doc.documentNumber, doc._id, e)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
                      copiedId === doc._id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {copiedId === doc._id ? 'check' : 'content_copy'}
                    </span>
                    <span>{copiedId === doc._id ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= METRICS & STATS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/family"
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-blue-300 transition-colors block"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Family Members</span>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">{members.length}</div>
          <div className="text-xs text-blue-600 font-semibold mt-1">Manage family →</div>
        </Link>

        <Link
          to="/vault"
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-blue-300 transition-colors block"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Documents</span>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">{documents.length}</div>
          <div className="text-xs text-blue-600 font-semibold mt-1">Browse vault →</div>
        </Link>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Storage Used</span>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">
            {familyData?.totalSizeBytes ? (familyData.totalSizeBytes / (1024 * 1024)).toFixed(1) + ' MB' : '0 MB'}
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">50 GB Free Tier</div>
        </div>

        <button
          onClick={() => setIsEmergencyModalOpen(true)}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-red-300 text-left transition-colors cursor-pointer"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-red-600">Emergency Cards</span>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">
            {members.filter(m => m.bloodGroup).length}
          </div>
          <div className="text-xs text-red-600 font-semibold mt-1">Open medical card →</div>
        </button>
      </div>

      {/* ================= RECENT DOCUMENTS & EMPTY STATE ================= */}
      <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Documents</h2>
            <p className="text-xs text-slate-500">Recently uploaded papers in your family vault</p>
          </div>
          {documents.length > 0 && (
            <Link to="/vault" className="text-xs font-bold text-blue-600 hover:underline">
              See All Documents →
            </Link>
          )}
        </div>

        {documents.length === 0 ? (
          /* Clean Friendly Empty State */
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-4xl">folder_open</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Your Family Vault is Ready!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Start by uploading your first essential document (Aadhaar, Passport, or Insurance) or add your family members.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to="/vault/upload"
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">add</span>
                <span>Upload First Document</span>
              </Link>
              <Link
                to="/family"
                className="px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">person_add</span>
                <span>Add Family Members</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {documents.slice(0, 5).map((doc) => (
              <div
                key={doc._id}
                onClick={() => navigate(`/vault/documents/${doc._id}`)}
                className="py-3.5 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-xl transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl">
                      {doc.category === 'ID Cards' ? 'badge' :
                       doc.category === 'Medical & Health' ? 'health_and_safety' :
                       doc.category === 'Bank & Property' ? 'account_balance' : 'folder'}
                    </span>
                  </div>
                  <div className="truncate">
                    <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 truncate">
                      {doc.title}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{doc.category}</span>
                      {doc.documentNumber && <span>• {doc.documentNumber}</span>}
                      {doc.assignedMember && <span>• {doc.assignedMember.name}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {doc.documentNumber && (
                    <button
                      type="button"
                      onClick={(e) => handleCopyNumber(doc.documentNumber, doc._id, e)}
                      className="hidden sm:inline-flex px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">content_copy</span>
                      <span>{copiedId === doc._id ? 'Copied!' : 'Copy ID'}</span>
                    </button>
                  )}
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-blue-600 text-lg">
                    chevron_right
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
