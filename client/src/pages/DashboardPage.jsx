import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import QuorumSignModal from '../components/common/QuorumSignModal';

export default function DashboardPage() {
  const { user, family } = useAuth();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeCategoryTab, setActiveCategoryTab] = useState('All');
  const [dismissBanner, setDismissBanner] = useState(false);
  const [loading, setLoading] = useState(true);

  // Quorum modal state
  const [selectedQuorumReq, setSelectedQuorumReq] = useState(null);
  const [isQuorumModalOpen, setIsQuorumModalOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [docsRes, auditRes] = await Promise.all([
        api.getDocuments(),
        api.getAuditLogs({ limit: 6 }),
      ]);
      setDocuments(docsRes.documents || []);
      setAuditLogs(auditRes.logs || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenQuorum = async () => {
    const res = await api.getQuorumRequests();
    if (res.requests && res.requests.length > 0) {
      setSelectedQuorumReq(res.requests[0]);
      setIsQuorumModalOpen(true);
    } else {
      navigate('/vault');
    }
  };

  const filteredRecentDocs = documents
    .filter(d => activeCategoryTab === 'All' || d.category.toLowerCase() === activeCategoryTab.toLowerCase())
    .slice(0, 4);

  return (
    <div className="max-w-[1380px] mx-auto p-6 lg:p-8 space-y-6">
      {/* ================= URGENT EXPIRY WARNING BANNER ================= */}
      {!dismissBanner && (
        <div className="w-full bg-amber-50/90 border border-amber-200/90 rounded-2xl p-5 shadow-xs relative overflow-hidden transition-all duration-300">
          <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-amber-200/40 blur-2xl pointer-events-none"></div>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-white shadow-xs flex items-center justify-center shrink-0 text-amber-600 border border-amber-200">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  warning_amber
                </span>
              </div>
              <div className="flex flex-col space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-bold text-slate-900 tracking-tight">
                    Attention: 1 critical document expires within the next 30 days
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 font-mono text-[10px] uppercase tracking-wider font-bold">
                    Action Required
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600 text-xs">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    <strong className="font-semibold text-slate-900">Term Life Policy #8821 - Priya Sharma</strong>
                    <span>(Expires in 27 days)</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 self-end lg:self-center shrink-0">
              <Link
                to="/vault"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-xs flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">published_with_changes</span>
                <span>Renew / Re-upload</span>
              </Link>
              <button
                type="button"
                onClick={() => setDismissBanner(true)}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 font-semibold text-xs border border-slate-200 transition-colors shadow-xs"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= METRICS CARDS GRID (4 COLUMNS) ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Family Members */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Family Members</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-lg">group</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-extrabold text-slate-900">4 Active</span>
            <span className="font-mono text-[11px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              All Synced
            </span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="flex -space-x-2 overflow-hidden">
              <img
                className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover"
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"
                alt="Rajesh"
              />
              <img
                className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover"
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100"
                alt="Priya"
              />
              <img
                className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover"
                src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100"
                alt="Aarav"
              />
              <img
                className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover"
                src="https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=100"
                alt="Sunita"
              />
            </div>
            <Link to="/family" className="text-xs font-semibold text-blue-600 hover:underline">
              Rajesh, Priya +2 →
            </Link>
          </div>
        </div>

        {/* Card 2: Stored Documents */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Stored Documents</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-lg">folder_shared</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-extrabold text-slate-900">48 Files</span>
            <span className="font-mono text-[11px] text-blue-700 font-semibold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
              6 Categories
            </span>
          </div>
          <div className="flex items-center gap-1.5 pt-3 border-t border-slate-100 text-xs text-emerald-700 font-medium">
            <span className="material-symbols-outlined text-base">verified_user</span>
            <span>100% Zero-Knowledge Verified</span>
          </div>
        </div>

        {/* Card 3: Vault Storage */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Vault Storage</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-lg">cloud_done</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-extrabold text-slate-900">3.4 GB</span>
            <span className="text-xs text-slate-500 font-medium">/ 50 GB (Free Tier)</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2 mt-1">
            <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: '6.8%' }}></div>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>6.8% Used</span>
            <span className="font-mono text-slate-600">46.6 GB Available</span>
          </div>
        </div>

        {/* Card 4: Pending Actions */}
        <div
          onClick={handleOpenQuorum}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow group cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Actions</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-lg">pending_actions</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-extrabold text-slate-900">1 Approval</span>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-600">
            <span className="truncate">Flat 402 Deed Quorum</span>
            <span className="material-symbols-outlined text-base text-blue-600 group-hover:translate-x-0.5 transition-transform">
              arrow_forward
            </span>
          </div>
        </div>
      </div>

      {/* ================= QUICK-ACTION GRID (4 CARDS) ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Action 1 */}
        <Link
          to="/vault/upload"
          className="group bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined text-2xl">cloud_upload</span>
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                Upload Document
              </div>
              <div className="text-xs text-slate-500">Instant OCR & Hash</div>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-400 group-hover:text-blue-600 transition-colors">
            chevron_right
          </span>
        </Link>

        {/* Action 2 */}
        <Link
          to="/family"
          className="group bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-800 group-hover:text-white flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined text-2xl">person_add</span>
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 group-hover:text-slate-700 transition-colors">
                Add Family Member
              </div>
              <div className="text-xs text-slate-500">Manage Nominees</div>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-700 transition-colors">
            chevron_right
          </span>
        </Link>

        {/* Action 3 */}
        <Link
          to="/break-glass"
          className="group bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined text-2xl">shield_lock</span>
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                Emergency Protocol
              </div>
              <div className="text-xs text-slate-500">Break-Glass 48h</div>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-400 group-hover:text-red-600 transition-colors">
            chevron_right
          </span>
        </Link>

        {/* Action 4 */}
        <a
          href="/api/export/backup"
          download
          className="group bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined text-2xl">inventory_2</span>
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                Export Vault Backup
              </div>
              <div className="text-xs text-slate-500">Cold Storage ZIP</div>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-400 group-hover:text-emerald-600 transition-colors">
            download
          </span>
        </a>
      </div>

      {/* ================= SPLIT BOTTOM SECTION (7 COLS & 5 COLS) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Documents (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Recent Vault Documents</h2>
                <p className="text-xs text-slate-500">Direct cryptographic access to family records</p>
              </div>

              {/* Category Tabs */}
              <div className="inline-flex p-1 rounded-xl bg-slate-100 text-xs font-semibold text-slate-600">
                {['All', 'Identity', 'Financial', 'Health'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveCategoryTab(tab)}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeCategoryTab === tab
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Document Preview List */}
            <div className="space-y-2.5">
              {filteredRecentDocs.map((doc) => (
                <div
                  key={doc._id}
                  onClick={() => navigate(`/vault/documents/${doc._id}`)}
                  className="p-3.5 rounded-xl bg-slate-50/70 hover:bg-slate-100/80 border border-slate-100 transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white text-blue-600 flex items-center justify-center shrink-0 shadow-xs border border-slate-200/60">
                      <span className="material-symbols-outlined text-2xl">
                        {doc.category === 'Identity' ? 'badge' :
                         doc.category === 'Property' ? 'real_estate_agent' :
                         doc.category === 'Health' ? 'health_and_safety' : 'account_balance'}
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                          {doc.title}
                        </span>
                        {doc.status === 'EXPIRING_SOON' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-mono text-[10px] font-bold">
                            Expires in 27d
                          </span>
                        ) : doc.isSensitive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono text-[10px] font-bold">
                            Encrypted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-mono text-[10px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Verified
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 truncate">
                        {doc.category} • {doc.originalFileName} • {doc.documentNumber || 'No ID'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-blue-600 text-lg">
                      visibility
                    </span>
                    <span className="material-symbols-outlined text-slate-300 text-lg">lock</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Showing {filteredRecentDocs.length} of {documents.length} documents</span>
            <Link
              to="/vault"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 transition-colors"
            >
              <span>Browse All Documents</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Secure Audit Activity (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Secure Audit Activity</h2>
                <p className="text-xs text-slate-500">Real-time immutable ledger</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-mono text-xs font-bold border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                LIVE
              </span>
            </div>

            {/* Activity Stream */}
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <div key={log._id} className="flex gap-3.5 items-start">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    log.action.includes('UPLOAD') || log.action.includes('RENEW') ? 'bg-emerald-100 text-emerald-700' :
                    log.action.includes('VIEW') ? 'bg-blue-100 text-blue-700' :
                    log.action.includes('BREAK_GLASS') ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    <span className="material-symbols-outlined text-base">
                      {log.action.includes('UPLOAD') ? 'cloud_upload' :
                       log.action.includes('VIEW') ? 'lock_open' :
                       log.action.includes('BREAK_GLASS') ? 'e911_emergency' : 'verified'}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <p className="text-xs text-slate-800 leading-snug">
                      <strong className="font-bold text-slate-900">{log.performerName}</strong>{' '}
                      {log.action === 'DOCUMENT_VIEW' ? 'accessed' :
                       log.action === 'DOCUMENT_UPLOAD' ? 'uploaded' :
                       log.action === 'DOCUMENT_RENEW' ? 'renewed & sealed' :
                       log.action === 'INTEGRITY_CHECK_PASSED' ? 'verified master checksums' : log.action}{' '}
                      <span className="font-semibold text-slate-900">{log.documentTitle}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-[150px]">
                        {log.sha256ChainHash ? `SHA: ${log.sha256ChainHash.slice(0, 10)}...` : 'Validated'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Cryptographically Chained</span>
            <Link
              to="/activity"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 transition-colors"
            >
              <span>Full Audit Ledger</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Quorum Sign Modal */}
      {selectedQuorumReq && (
        <QuorumSignModal
          isOpen={isQuorumModalOpen}
          onClose={() => {
            setIsQuorumModalOpen(false);
            loadDashboardData();
          }}
          quorumRequest={selectedQuorumReq}
          onSignSuccess={() => loadDashboardData()}
        />
      )}
    </div>
  );
}
