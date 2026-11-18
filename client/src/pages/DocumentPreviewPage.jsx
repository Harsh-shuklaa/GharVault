import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Copy, Check, Share2, Download, Trash2, Eye, Info, Clock, RotateCw, ZoomIn, ZoomOut, X } from 'lucide-react';

export default function DocumentPreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { family, user } = useAuth();

  const [doc, setDoc] = useState(null);
  const [members, setMembers] = useState([]);
  const [auditTrail, setAuditTrail] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [whoCanViewList, setWhoCanViewList] = useState(['ALL']);
  const [savingPermissions, setSavingPermissions] = useState(false);

  useEffect(() => {
    loadDocumentDetails();
    loadFamilyMembers();
  }, [id]);

  const loadDocumentDetails = async () => {
    try {
      setLoading(true);
      const res = await api.getDocument(id);
      if (res.document) {
        setDoc(res.document);
        setWhoCanViewList(res.document.whoCanView || ['ALL']);
        setAuditTrail(res.auditTrail || []);
      }
    } catch (err) {
      console.error('Failed to load document details:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFamilyMembers = async () => {
    try {
      const res = await api.getMembers();
      setMembers(res.members || []);
    } catch (err) {
      console.error('Failed to load members:', err);
    }
  };

  const handleCopyNumber = () => {
    if (!doc?.documentNumber) return;
    navigator.clipboard.writeText(doc.documentNumber);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleShareSafely = async () => {
    try {
      const res = await api.createShareLink(id, { expiresInHours: 24 });
      if (res.shareLink) {
        setShareLink(res.shareLink);
        setShareModalOpen(true);
      }
    } catch (err) {
      alert('Could not generate safe share link: ' + err.message);
    }
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2000);
  };

  const handleToggleWhoCanViewAll = async () => {
    try {
      setSavingPermissions(true);
      const updated = ['ALL'];
      await api.updateWhoCanView(id, updated);
      setWhoCanViewList(updated);
    } catch (err) {
      alert('Failed to update viewing permissions');
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleToggleWhoCanViewMember = async (memberId) => {
    try {
      setSavingPermissions(true);
      let updated;
      if (whoCanViewList.includes('ALL')) {
        updated = [memberId];
      } else if (whoCanViewList.includes(memberId)) {
        updated = whoCanViewList.filter(m => m !== memberId);
        if (updated.length === 0) updated = ['ALL'];
      } else {
        updated = [...whoCanViewList, memberId];
      }
      await api.updateWhoCanView(id, updated);
      setWhoCanViewList(updated);
    } catch (err) {
      alert('Failed to update viewing permissions');
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to permanently remove "${doc?.title}" from your family vault?`)) {
      try {
        await api.deleteDocument(id);
        navigate('/vault');
      } catch (err) {
        alert('Could not delete document: ' + err.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <span className="material-symbols-outlined text-4xl text-[#3ECF8E] animate-spin">refresh</span>
          <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">Opening secure document preview...</p>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-neutral-600">error</span>
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Document Not Found</h2>
        <Link to="/vault" className="text-xs text-emerald-600 dark:text-[#3ECF8E] font-bold hover:underline">
          ← Return to Vault
        </Link>
      </div>
    );
  }

  const isWholeFamily = whoCanViewList.includes('ALL');

  return (
    <div className="max-w-[1380px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header & Action Bar */}
      <div className="bg-white dark:bg-[#1C1C1C] rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-[#262626] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-4">
          <Link
            to="/vault"
            className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-[#141414] hover:bg-slate-200 dark:hover:bg-[#262626] text-slate-600 dark:text-neutral-300 flex items-center justify-center transition-colors shrink-0"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{doc.title}</h1>
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-700 dark:text-[#3ECF8E] font-bold text-xs border border-emerald-200/60 dark:border-[#3ECF8E]/20">
                {doc.category}
              </span>
              {doc.expiryDate && (
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 font-semibold text-xs border border-amber-200/60 dark:border-amber-500/20">
                  Valid until {new Date(doc.expiryDate).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Document Number with One-Tap Copy */}
            <div className="text-xs text-slate-500 dark:text-neutral-400 flex flex-wrap items-center gap-3 mt-2">
              {doc.documentNumber ? (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 dark:text-neutral-300">Document Number:</span>
                  <code className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#141414] font-mono font-bold text-slate-900 dark:text-neutral-200 text-xs border border-transparent dark:border-[#262626]">
                    {doc.documentNumber}
                  </code>
                  <button
                    onClick={handleCopyNumber}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-[#3ECF8E]/10 hover:bg-emerald-100 dark:hover:bg-[#3ECF8E]/20 text-emerald-700 dark:text-[#3ECF8E] font-bold text-xs transition-colors cursor-pointer"
                    title="Click to copy number"
                  >
                    {copiedNumber ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedNumber ? 'Copied!' : 'Copy Number'}</span>
                  </button>
                </div>
              ) : (
                <span>Belongs to: <strong className="text-slate-800 dark:text-white">{doc.assignedMember?.name || 'Whole Family'}</strong></span>
              )}
              <span className="text-slate-300 dark:text-neutral-600">•</span>
              <span>{(doc.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Share Safely (24h expiring link) */}
          <button
            onClick={handleShareSafely}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#262626] hover:bg-slate-50 dark:hover:bg-[#141414] text-slate-700 dark:text-neutral-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Share2 size={15} className="text-[#10B981] dark:text-[#3ECF8E]" />
            <span>Share Safely (24h Link)</span>
          </button>

          {/* Download */}
          <a
            href={doc.fileUrl || `/api/documents/raw/${encodeURIComponent(doc.storagePath)}`}
            download={doc.originalFileName || `${doc.title}.pdf`}
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#3ECF8E]/20 transition-all cursor-pointer"
          >
            <Download size={15} />
            <span>Download</span>
          </a>

          {/* Delete */}
          <button
            onClick={handleDelete}
            className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
            title="Delete Document"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Split Viewer & Details (7 Cols & 5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Full-Screen Document Canvas (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1C1C1C] rounded-3xl border border-slate-200/80 dark:border-[#262626] shadow-xs overflow-hidden flex flex-col justify-between transition-colors">
          {/* Controls Bar */}
          <div className="px-5 py-3 border-b border-slate-100 dark:border-[#262626] flex items-center justify-between bg-slate-50/80 dark:bg-[#141414] text-xs text-slate-600 dark:text-neutral-400">
            <span className="font-semibold text-slate-600 dark:text-neutral-300 flex items-center gap-1.5">
              <Eye size={15} className="text-[#10B981] dark:text-[#3ECF8E]" />
              Document Preview
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoomLevel(Math.max(60, zoomLevel - 15))}
                className="p-1 hover:bg-slate-200 dark:hover:bg-[#262626] rounded transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
              <span className="font-mono text-xs text-slate-600 dark:text-neutral-300 w-10 text-center">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel(Math.min(160, zoomLevel + 15))}
                className="p-1 hover:bg-slate-200 dark:hover:bg-[#262626] rounded transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
              <button
                onClick={() => setRotation((rotation + 90) % 360)}
                className="p-1 hover:bg-slate-200 dark:hover:bg-[#262626] rounded transition-colors cursor-pointer"
                title="Rotate 90°"
              >
                <RotateCw size={16} />
              </button>
            </div>
          </div>

          {/* Document Canvas Content */}
          <div className="p-8 bg-slate-100/70 dark:bg-[#141414] flex items-center justify-center min-h-[500px] overflow-auto">
            <div
              style={{
                transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease',
              }}
              className="w-full max-w-lg bg-white dark:bg-[#1C1C1C] rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-[#262626] text-slate-800 dark:text-neutral-200 space-y-6 relative transition-colors"
            >
              {/* Document Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 dark:border-white/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-600 dark:text-[#3ECF8E] flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-2xl">
                      {doc.category === 'ID Cards' ? 'badge' :
                       doc.category === 'Medical & Health' ? 'health_and_safety' :
                       doc.category === 'Bank & Property' ? 'account_balance' : 'description'}
                    </span>
                  </div>
                  <div>
                    <div className="font-extrabold text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                      {doc.category}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-neutral-400">{doc.title}</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-[#3ECF8E]/20 text-emerald-800 dark:text-[#3ECF8E] font-mono text-[10px] font-bold">
                  VERIFIED
                </span>
              </div>

              {/* Document Fields */}
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-neutral-400 uppercase tracking-wider block font-bold">
                      Assigned Family Member
                    </span>
                    <strong className="text-slate-900 dark:text-white font-bold text-sm">
                      {doc.assignedMember?.name || 'Whole Family'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-neutral-400 uppercase tracking-wider block font-bold">
                      Document Number
                    </span>
                    <strong className="text-slate-900 dark:text-neutral-200 font-mono text-sm">
                      {doc.documentNumber || 'Not Specified'}
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-neutral-400 uppercase tracking-wider block font-bold">
                      Validity / Expiry
                    </span>
                    <strong className="text-slate-900 dark:text-white">
                      {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : 'Lifetime / Non-Expiring'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-neutral-400 uppercase tracking-wider block font-bold">
                      File Size
                    </span>
                    <strong className="text-slate-900 dark:text-neutral-200 font-mono">
                      {(doc.fileSize / (1024 * 1024)).toFixed(2)} MB
                    </strong>
                  </div>
                </div>

                {/* Simulated file download button in canvas */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] text-center space-y-2">
                  <span className="material-symbols-outlined text-3xl text-slate-400 dark:text-neutral-500">picture_as_pdf</span>
                  <div className="text-xs font-bold text-slate-800 dark:text-white">{doc.originalFileName || 'document.pdf'}</div>
                  <a
                    href={doc.fileUrl || `/api/documents/raw/${encodeURIComponent(doc.storagePath)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] text-xs font-bold transition-all"
                  >
                    <span>Open Full Size Document</span>
                  </a>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-[#262626] flex justify-between items-end text-[10px] text-slate-500 dark:text-neutral-400 font-mono">
                  <div>
                    <div>Stored in: Supabase Private Bucket</div>
                    <div>Family: {family?.name || 'Your Family'}</div>
                  </div>
                  <div className="px-2 py-1 bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-700 dark:text-[#3ECF8E] font-bold rounded">
                    ENCRYPTED
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: "Who Can View" & "Document Details" & "Recent Activity" (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Who Can View (Simple Toggle Switches / Checkboxes) */}
          <div className="bg-white dark:bg-[#1C1C1C] rounded-3xl p-6 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Eye size={16} className="text-[#10B981] dark:text-[#3ECF8E]" />
                <span>Who Can View</span>
              </h3>
              {savingPermissions && (
                <span className="text-[11px] text-[#3ECF8E] font-bold animate-pulse">Saving...</span>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Control which family members have permission to view and download this file.
            </p>

            <div className="space-y-2 text-xs">
              {/* Whole Family option */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#141414] hover:bg-emerald-50/40 dark:hover:bg-[#262626] border border-slate-200 dark:border-[#262626] cursor-pointer transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-base text-slate-500 dark:text-neutral-400">groups</span>
                  <span className="font-bold text-slate-800 dark:text-white">Everyone in Family</span>
                </div>
                <input
                  type="checkbox"
                  checked={isWholeFamily}
                  onChange={handleToggleWhoCanViewAll}
                  className="w-4 h-4 rounded text-[#10B981] dark:text-[#3ECF8E] border-slate-300 dark:border-[#262626] focus:ring-[#3ECF8E] cursor-pointer"
                />
              </label>

              {/* Individual member toggles */}
              {members.map((m) => {
                const isAllowed = isWholeFamily || whoCanViewList.includes(m._id);
                return (
                  <label
                    key={m._id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#1C1C1C] hover:bg-slate-50 dark:hover:bg-[#262626] border border-slate-200 dark:border-[#262626] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={m.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.name)}`}
                        alt={m.name}
                        className="w-6 h-6 rounded-lg object-cover"
                      />
                      <span className="font-semibold text-slate-800 dark:text-white">{m.name}</span>
                      <span className="text-[10px] text-slate-400 dark:text-neutral-500">({m.relationship})</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isAllowed}
                      disabled={isWholeFamily}
                      onChange={() => handleToggleWhoCanViewMember(m._id)}
                      className="w-4 h-4 rounded text-[#10B981] dark:text-[#3ECF8E] border-slate-300 dark:border-[#262626] focus:ring-[#3ECF8E] cursor-pointer disabled:opacity-50"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {/* 2. Document Details */}
          <div className="bg-white dark:bg-[#1C1C1C] rounded-3xl p-6 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-3 transition-colors">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Info size={16} className="text-slate-500 dark:text-neutral-400" />
              <span>Document Details</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-[#262626]">
                <span className="text-slate-500 dark:text-neutral-400">Category:</span>
                <span className="font-bold text-slate-900 dark:text-white">{doc.category}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-[#262626]">
                <span className="text-slate-500 dark:text-neutral-400">Document ID:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-neutral-200">{doc.documentNumber || 'None'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-[#262626]">
                <span className="text-slate-500 dark:text-neutral-400">Uploaded On:</span>
                <span className="font-semibold text-slate-800 dark:text-neutral-300">
                  {new Date(doc.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-[#262626]">
                <span className="text-slate-500 dark:text-neutral-400">Expiry Date:</span>
                <span className="font-semibold text-slate-800 dark:text-neutral-300">
                  {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : 'No Expiry'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 dark:text-neutral-400">Storage Protection:</span>
                <span className="font-bold text-emerald-700 dark:text-[#3ECF8E]">Supabase Free-Tier Private</span>
              </div>
            </div>
          </div>

          {/* 3. Recent Activity */}
          <div className="bg-white dark:bg-[#1C1C1C] rounded-3xl p-6 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-3 transition-colors">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock size={16} className="text-[#10B981] dark:text-[#3ECF8E]" />
                <span>Recent Activity</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400 dark:text-neutral-500">{auditTrail.length} events</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              {auditTrail.length === 0 ? (
                <div className="text-slate-400 dark:text-neutral-500 py-3 text-center">No activity recorded yet</div>
              ) : (
                auditTrail.slice(0, 4).map((log) => (
                  <div key={log._id} className="flex items-start gap-2.5 pb-2 border-b border-slate-100 dark:border-[#262626] last:border-0 last:pb-0">
                    <span className="material-symbols-outlined text-base text-[#10B981] dark:text-[#3ECF8E] mt-0.5">task_alt</span>
                    <div>
                      <div className="font-medium text-slate-800 dark:text-neutral-200">
                        {log.performerName || 'User'} — {log.action === 'UPLOAD' ? 'Uploaded document' : log.action === 'VIEW' ? 'Viewed document' : log.action}
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

      {/* Share Safely Modal (24h Expiring Link) - Bottom-Sheet on Mobile */}
      {shareModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
          onClick={() => setShareModalOpen(false)}
        >
          <div
            className="fixed inset-x-0 bottom-0 rounded-t-2xl max-h-[90vh] overflow-y-auto md:static md:inset-auto md:rounded-xl md:max-w-md w-full bg-white dark:bg-[#1C1C1C] p-4 sm:p-5 lg:p-6 shadow-2xl border border-slate-200 dark:border-[#262626] space-y-4 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#262626]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-600 dark:text-[#3ECF8E] flex items-center justify-center">
                  <Share2 size={18} />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Share Safely</h3>
              </div>
              <button
                onClick={() => setShareModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-[#262626] text-slate-400 flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
              This link is secure, temporary, and will <strong>automatically expire in 24 hours</strong>. Anyone with this link can view this document without needing an account.
            </p>

            <div className="p-3 bg-slate-50 dark:bg-[#141414] rounded-2xl border border-slate-200 dark:border-[#262626] space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-neutral-500 tracking-wider block">
                Secure 24-Hour Link:
              </span>
              <div className="font-mono text-xs text-slate-800 dark:text-neutral-200 break-all select-all bg-white dark:bg-[#1C1C1C] p-2.5 rounded-xl border border-slate-200 dark:border-[#262626]">
                {shareLink}
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center sm:justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShareModalOpen(false)}
                className="min-h-[44px] w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#262626] text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-[#262626] font-bold text-xs cursor-pointer text-center"
              >
                Close
              </button>
              <button
                onClick={handleCopyShareLink}
                className="min-h-[44px] w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] font-bold text-xs shadow-md shadow-[#3ECF8E]/20 transition-all cursor-pointer text-center"
              >
                {copiedShareLink ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedShareLink ? 'Link Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
