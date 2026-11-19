import React, { useState, useEffect } from 'react';
import { FileCode, X, Copy, Check, Download, ShieldCheck, RefreshCw, AlertTriangle, Search } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';

export default function ActivityAuditPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState([]);
  const [headHash, setHeadHash] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [manifestData, setManifestData] = useState(null);
  const [isManifestOpen, setIsManifestOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [copiedManifest, setCopiedManifest] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isManifestOpen) {
        setIsManifestOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isManifestOpen]);

  useEffect(() => {
    loadAuditLogs();
  }, [filterAction]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs({ action: filterAction, limit: 100 });
      setLogs(res.logs || []);
      setHeadHash(res.headHash || '');
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      toast.error('Failed to load audit logs: ' + (err.message || 'Error'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenManifest = async () => {
    try {
      const data = await api.getCryptographicManifest();
      setManifestData(data);
      setIsManifestOpen(true);
    } catch (err) {
      toast.error('Failed to load manifest: ' + (err.message || 'Error'));
    }
  };

  const handleVerifyChain = async () => {
    try {
      setVerifying(true);
      const res = await api.verifyAuditChain();
      setVerificationResult(res);
      if (res.isValid) {
        toast.success(res.message || 'Ledger chain verified 100% unbroken!');
        loadAuditLogs();
      } else {
        toast.error(res.message || 'Cryptographic chain verification failed!');
      }
    } catch (err) {
      toast.error('Verification failed: ' + (err.message || 'Error'));
    } finally {
      setVerifying(false);
    }
  };

  const handleDownloadManifest = () => {
    if (!manifestData) return;
    try {
      const blob = new Blob([JSON.stringify(manifestData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GharVault_Evidence_Manifest_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Section 65B Evidence Manifest JSON downloaded successfully!');
    } catch (e) {
      toast.error('Failed to download file');
    }
  };

  const actionTypes = [
    { key: 'ALL', label: 'All Activities' },
    { key: 'DOCUMENT_UPLOAD', label: 'Uploads' },
    { key: 'DOCUMENT_VIEW', label: 'Views' },
    { key: 'DOCUMENT_DELETE', label: 'Deletions' },
    { key: 'PERMISSION_CHANGED', label: 'Permissions' },
    { key: 'MPIN_PROTECTION_TOGGLED', label: 'MPIN Locks' },
    { key: 'SHARE_LINK_GENERATED', label: 'Links Shared' },
    { key: 'SHARE_LINK_REVOKED', label: 'Links Revoked' },
    { key: 'MEMBER_REMOVED', label: 'Member Removed' },
    { key: 'OWNERSHIP_TRANSFERRED', label: 'Ownership' },
    { key: 'BREAK_GLASS_ARMED', label: 'Break-Glass' },
    { key: 'QUORUM_APPROVED', label: 'Dual-Key Quorum' },
  ];

  const getActionBadge = (action) => {
    switch (action) {
      case 'DOCUMENT_UPLOAD':
        return { label: 'UPLOADED', bg: 'bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-800 dark:text-[#3ECF8E] border border-emerald-200 dark:border-[#3ECF8E]/20' };
      case 'DOCUMENT_VIEW':
        return { label: 'VIEWED', bg: 'bg-blue-50 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20' };
      case 'DOCUMENT_DELETE':
        return { label: 'DELETED', bg: 'bg-red-50 dark:bg-red-500/10 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-500/20' };
      case 'PERMISSION_CHANGED':
        return { label: 'PERMISSIONS', bg: 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20' };
      case 'MPIN_PROTECTION_TOGGLED':
        return { label: 'MPIN LOCK', bg: 'bg-purple-50 dark:bg-purple-500/10 text-purple-800 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20' };
      case 'SHARE_LINK_GENERATED':
        return { label: 'LINK SHARED', bg: 'bg-teal-50 dark:bg-teal-500/10 text-teal-800 dark:text-teal-400 border border-teal-200 dark:border-teal-500/20' };
      case 'SHARE_LINK_REVOKED':
        return { label: 'LINK REVOKED', bg: 'bg-slate-100 dark:bg-[#262626] text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-[#333]' };
      case 'MEMBER_REMOVED':
        return { label: 'MEMBER REMOVED', bg: 'bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20' };
      case 'OWNERSHIP_TRANSFERRED':
        return { label: 'OWNERSHIP', bg: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-800 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20' };
      case 'BREAK_GLASS_ARMED':
      case 'BREAK_GLASS_TRIGGERED':
        return { label: 'BREAK-GLASS', bg: 'bg-red-50 dark:bg-red-500/10 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-500/20' };
      case 'QUORUM_APPROVED':
      case 'QUORUM_SIGNED':
        return { label: 'DUAL-KEY', bg: 'bg-purple-50 dark:bg-purple-500/10 text-purple-800 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20' };
      case 'INTEGRITY_CHECK_PASSED':
        return { label: 'VERIFIED CHAIN', bg: 'bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-800 dark:text-[#3ECF8E] border border-emerald-200 dark:border-[#3ECF8E]/20' };
      default:
        return { label: action.replace(/_/g, ' '), bg: 'bg-slate-100 dark:bg-[#262626] text-slate-700 dark:text-neutral-300' };
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      log.action?.toLowerCase().includes(q) ||
      log.performerName?.toLowerCase().includes(q) ||
      log.documentTitle?.toLowerCase().includes(q) ||
      log.sha256ChainHash?.toLowerCase().includes(q) ||
      (log.details && JSON.stringify(log.details).toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-[1380px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Activity Audit Ledger</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-800 dark:text-[#3ECF8E] font-mono text-xs font-bold border border-emerald-200 dark:border-[#3ECF8E]/20">
              <span className="w-2 h-2 rounded-full bg-[#10B981] dark:bg-[#3ECF8E] animate-pulse"></span>
              LIVE LEDGER
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            Immutable SHA-256 cryptographically chained sequence. Compliant with Section 65B Indian Evidence Act.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleVerifyChain}
            disabled={verifying}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#262626] bg-white dark:bg-[#1C1C1C] hover:bg-slate-50 dark:hover:bg-[#262626] text-slate-700 dark:text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Recalculate mathematical hash sequence to detect tampering"
          >
            {verifying ? (
              <RefreshCw size={15} className="animate-spin text-[#10B981] dark:text-[#3ECF8E]" />
            ) : (
              <ShieldCheck size={16} className="text-[#10B981] dark:text-[#3ECF8E]" />
            )}
            <span>{verifying ? 'Verifying Hashes...' : 'Verify Chain Integrity'}</span>
          </button>

          <button
            onClick={handleOpenManifest}
            className="px-4 py-2.5 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#3ECF8E]/20 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">code</span>
            <span>Cryptographic Manifest JSON</span>
          </button>
        </div>
      </div>

      {/* Verification Result Banner (when active) */}
      {verificationResult && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-all ${
            verificationResult.isValid
              ? 'bg-emerald-50/80 dark:bg-[#3ECF8E]/10 border-emerald-200 dark:border-[#3ECF8E]/30 text-emerald-950 dark:text-white'
              : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-950 dark:text-white'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                verificationResult.isValid
                  ? 'bg-emerald-100 dark:bg-[#3ECF8E]/20 text-[#10B981] dark:text-[#3ECF8E]'
                  : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
              }`}
            >
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>{verificationResult.isValid ? 'Ledger Chain 100% Valid & Untampered' : 'Integrity Mismatch Detected'}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/80 dark:bg-[#141414] border border-slate-200 dark:border-[#262626]">
                  {verificationResult.totalBlocks} Blocks Verified
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-neutral-300 mt-0.5">
                {verificationResult.message}
              </p>
              <div className="mt-1 font-mono text-[10px] text-slate-500 dark:text-neutral-400 truncate max-w-lg">
                Head Hash: {verificationResult.headHash}
              </div>
            </div>
          </div>
          <button
            onClick={() => setVerificationResult(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Root Hash & Filters Bar */}
      <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-4 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-3.5 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider text-[11px] shrink-0">
              Current Root Hash:
            </span>
            <code className="bg-slate-100 dark:bg-[#141414] px-2 py-1 rounded text-slate-800 dark:text-neutral-200 font-mono text-[11px] select-all truncate max-w-xs sm:max-w-md border border-slate-200 dark:border-[#262626]">
              {headHash || '00000000000000000000000000000000'}
            </code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-neutral-400 font-mono text-[11px]">
              {filteredLogs.length} Blocks Shown
            </span>
            <button
              onClick={loadAuditLogs}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded cursor-pointer"
              title="Refresh ledger logs"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-[#262626]">
          <span className="text-xs font-bold text-slate-500 dark:text-neutral-400 mr-1 shrink-0">Filter Action:</span>
          {actionTypes.map((action) => (
            <button
              key={action.key}
              onClick={() => setFilterAction(action.key)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterAction === action.key
                  ? 'bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] shadow-xs'
                  : 'bg-slate-100 dark:bg-[#141414] hover:bg-slate-200 dark:hover:bg-[#262626] text-slate-600 dark:text-neutral-400'
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Timeline Table */}
      <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl border border-slate-200/80 dark:border-[#262626] shadow-xs overflow-hidden transition-colors">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw size={24} className="animate-spin text-[#10B981] dark:text-[#3ECF8E] mx-auto" />
            <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
              Loading cryptographically chained ledger...
            </p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#141414] text-slate-400 dark:text-neutral-500 flex items-center justify-center mx-auto border border-slate-200 dark:border-[#262626]">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No Activities Recorded Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
              Every action in your family vault (document uploads, views, permission updates, ownership transfers, and safe share links) will automatically be recorded here with SHA-256 block hashes.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#141414] border-b border-slate-200 dark:border-[#262626] text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Timestamp</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Custodian / Member</th>
                  <th className="py-3.5 px-4">Target Record / Details</th>
                  <th className="py-3.5 px-4">Client IP</th>
                  <th className="py-3.5 px-5 font-mono">SHA-256 Block Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#262626] text-xs">
                {filteredLogs.map((log) => {
                  const badge = getActionBadge(log.action);
                  return (
                    <tr key={log._id} className="hover:bg-slate-50/70 dark:hover:bg-[#262626]/40 transition-colors">
                      <td className="py-3.5 px-5 font-mono text-slate-500 dark:text-neutral-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        {log.performerName || 'System'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 dark:text-neutral-200 font-medium max-w-xs truncate">
                        {log.documentTitle ? (
                          <span title={log.documentTitle}>{log.documentTitle}</span>
                        ) : log.details?.removedMemberName ? (
                          <span>Member: {log.details.removedMemberName}</span>
                        ) : log.details?.newAdminName ? (
                          <span>Transferred to: {log.details.newAdminName}</span>
                        ) : (
                          <span className="text-slate-400 dark:text-neutral-500 italic">Family Vault Workspace</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-neutral-400 text-[11px] whitespace-nowrap">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-[11px] text-slate-600 dark:text-neutral-400 truncate max-w-[170px]" title={log.sha256ChainHash}>
                        {log.sha256ChainHash}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cryptographic Manifest Modal */}
      {isManifestOpen && manifestData && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsManifestOpen(false)}
        >
          <div
            className="fixed inset-x-0 bottom-0 md:static md:inset-auto w-full max-w-3xl bg-white dark:bg-[#18181B] border-t md:border border-slate-200 dark:border-[#27272A] rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col max-h-[88vh] md:max-h-[85vh] overflow-hidden text-slate-900 dark:text-slate-200 transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Handle Pill */}
            <div className="md:hidden flex justify-center pt-2.5 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-neutral-600" />
            </div>

            {/* Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-[#27272A] flex items-center justify-between bg-slate-50 dark:bg-[#141414] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-600 dark:text-[#3ECF8E] flex items-center justify-center border border-emerald-100 dark:border-[#3ECF8E]/20 shrink-0">
                  <FileCode size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">Cryptographic Manifest JSON Payload</h3>
                  <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
                    Indian Evidence Act Section 65B Certified
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsManifestOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-[#27272A] text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-[#3ECF8E]/10 border border-emerald-200 dark:border-[#3ECF8E]/20 text-xs text-slate-700 dark:text-neutral-300 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-lg text-[#10B981] dark:text-[#3ECF8E] shrink-0">verified</span>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Section 65B Evidence Statement</div>
                  <p className="text-[11px] text-slate-600 dark:text-neutral-400 mt-0.5 leading-relaxed">
                    {manifestData.section65BCertificate?.statement ||
                      'Electronic records produced by GharVault cryptographically verified storage system pursuant to Section 65B of the Indian Evidence Act, 1872.'}
                  </p>
                </div>
              </div>

              <pre className="font-mono text-xs text-emerald-800 dark:text-emerald-400 bg-slate-50 dark:bg-[#141414] p-4 rounded-xl border border-slate-200 dark:border-[#27272A] overflow-x-auto selection:bg-[#3ECF8E] selection:text-black">
                {JSON.stringify(manifestData, null, 2)}
              </pre>
            </div>

            {/* Fixed Footer */}
            <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#141414] flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 text-xs shrink-0">
              <span className="text-slate-500 dark:text-neutral-400 hidden sm:inline">100% Mathematically Verifiable</span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setIsManifestOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-300 dark:border-[#27272A] text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#27272A] font-bold text-xs transition-colors cursor-pointer text-center"
                >
                  Close
                </button>
                <button
                  onClick={handleDownloadManifest}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-emerald-300 dark:border-[#3ECF8E]/30 bg-emerald-50 dark:bg-[#3ECF8E]/10 hover:bg-emerald-100 dark:hover:bg-[#3ECF8E]/20 text-emerald-800 dark:text-[#3ECF8E] font-bold text-xs transition-all cursor-pointer text-center"
                  title="Download .json file for legal evidence"
                >
                  <Download size={14} />
                  <span>Download .JSON</span>
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(manifestData, null, 2));
                    setCopiedManifest(true);
                    toast.success('Manifest JSON copied to clipboard!');
                    setTimeout(() => setCopiedManifest(false), 2000);
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] font-bold text-xs shadow-md shadow-[#3ECF8E]/20 transition-all cursor-pointer text-center"
                >
                  {copiedManifest ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedManifest ? 'Copied JSON' : 'Copy JSON'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
