import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

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
          <span className="material-symbols-outlined text-4xl text-blue-600 animate-spin">refresh</span>
          <p className="text-xs text-slate-500 font-medium">Opening secure document preview...</p>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <span className="material-symbols-outlined text-5xl text-slate-300">error</span>
        <h2 className="text-lg font-bold text-slate-800">Document Not Found</h2>
        <Link to="/vault" className="text-xs text-blue-600 font-bold hover:underline">
          ← Return to Vault
        </Link>
      </div>
    );
  }

  const isWholeFamily = whoCanViewList.includes('ALL');

  return (
    <div className="max-w-[1380px] mx-auto p-6 lg:p-8 space-y-6">
      {/* Top Header & Action Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/vault"
            className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{doc.title}</h1>
              <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200/60">
                {doc.category}
              </span>
              {doc.expiryDate && (
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 font-semibold text-xs border border-amber-200/60">
                  Valid until {new Date(doc.expiryDate).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Document Number with One-Tap Copy */}
            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-2">
              {doc.documentNumber ? (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Document Number:</span>
                  <code className="px-2.5 py-1 rounded-lg bg-slate-100 font-mono font-bold text-slate-900 text-xs">
                    {doc.documentNumber}
                  </code>
                  <button
                    onClick={handleCopyNumber}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors cursor-pointer"
                    title="Click to copy number"
                  >
                    <span className="material-symbols-outlined text-xs">
                      {copiedNumber ? 'check' : 'content_copy'}
                    </span>
                    <span>{copiedNumber ? 'Copied!' : 'Copy Number'}</span>
                  </button>
                </div>
              ) : (
                <span>Belongs to: <strong className="text-slate-800">{doc.assignedMember?.name || 'Whole Family'}</strong></span>
              )}
              <span className="text-slate-300">•</span>
              <span>{(doc.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Share Safely (24h expiring link) */}
          <button
            onClick={handleShareSafely}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base text-blue-600">share</span>
            <span>Share Safely (24h Link)</span>
          </button>

          {/* Download */}
          <a
            href={doc.fileUrl || `/api/documents/raw/${encodeURIComponent(doc.storagePath)}`}
            download={doc.originalFileName || `${doc.title}.pdf`}
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>Download</span>
          </a>

          {/* Delete */}
          <button
            onClick={handleDelete}
            className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete Document"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      </div>

      {/* Split Viewer & Details (7 Cols & 5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Full-Screen Document Canvas (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
          {/* Controls Bar */}
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 text-xs text-slate-600">
            <span className="font-semibold text-slate-600 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-blue-600">visibility</span>
              Document Preview
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoomLevel(Math.max(60, zoomLevel - 15))}
                className="p-1 hover:bg-slate-200 rounded transition-colors"
                title="Zoom Out"
              >
                <span className="material-symbols-outlined text-base">zoom_out</span>
              </button>
              <span className="font-mono text-xs text-slate-600 w-10 text-center">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel(Math.min(160, zoomLevel + 15))}
                className="p-1 hover:bg-slate-200 rounded transition-colors"
                title="Zoom In"
              >
                <span className="material-symbols-outlined text-base">zoom_in</span>
              </button>
              <button
                onClick={() => setRotation((rotation + 90) % 360)}
                className="p-1 hover:bg-slate-200 rounded transition-colors"
                title="Rotate 90°"
              >
                <span className="material-symbols-outlined text-base">rotate_right</span>
              </button>
            </div>
          </div>

          {/* Document Canvas Content */}
          <div className="p-8 bg-slate-100/70 flex items-center justify-center min-h-[500px] overflow-auto">
            <div
              style={{
                transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease',
              }}
              className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8 border border-slate-200 text-slate-800 space-y-6 relative"
            >
              {/* Document Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-2xl">
                      {doc.category === 'ID Cards' ? 'badge' :
                       doc.category === 'Medical & Health' ? 'health_and_safety' :
                       doc.category === 'Bank & Property' ? 'account_balance' : 'description'}
                    </span>
                  </div>
                  <div>
                    <div className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
                      {doc.category}
                    </div>
                    <div className="text-[11px] text-slate-500">{doc.title}</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
                  VERIFIED
                </span>
              </div>

              {/* Document Fields */}
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                      Assigned Family Member
                    </span>
                    <strong className="text-slate-900 font-bold text-sm">
                      {doc.assignedMember?.name || 'Whole Family'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                      Document Number
                    </span>
                    <strong className="text-slate-900 font-mono text-sm">
                      {doc.documentNumber || 'Not Specified'}
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                      Validity / Expiry
                    </span>
                    <strong className="text-slate-900">
                      {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : 'Lifetime / Non-Expiring'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                      File Size
                    </span>
                    <strong className="text-slate-900 font-mono">
                      {(doc.fileSize / (1024 * 1024)).toFixed(2)} MB
                    </strong>
                  </div>
                </div>

                {/* Simulated file download button in canvas */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
                  <span className="material-symbols-outlined text-3xl text-slate-400">picture_as_pdf</span>
                  <div className="text-xs font-bold text-slate-800">{doc.originalFileName || 'document.pdf'}</div>
                  <a
                    href={doc.fileUrl || `/api/documents/raw/${encodeURIComponent(doc.storagePath)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                    <span>Open Full Size Document</span>
                  </a>
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-between items-end text-[10px] text-slate-500 font-mono">
                  <div>
                    <div>Stored in: Supabase Private Bucket</div>
                    <div>Family: {family?.name || 'Your Family'}</div>
                  </div>
                  <div className="px-2 py-1 bg-emerald-50 text-emerald-700 font-bold rounded">
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
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-lg">visibility</span>
                <span>Who Can View</span>
              </h3>
              {savingPermissions && (
                <span className="text-[11px] text-blue-600 font-bold animate-pulse">Saving...</span>
              )}
            </div>

            <p className="text-xs text-slate-500">
              Control which family members have permission to view and download this file.
            </p>

            <div className="space-y-2 text-xs">
              {/* Whole Family option */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50/40 border border-slate-200 cursor-pointer transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-base text-slate-500">groups</span>
                  <span className="font-bold text-slate-800">Everyone in Family</span>
                </div>
                <input
                  type="checkbox"
                  checked={isWholeFamily}
                  onChange={handleToggleWhoCanViewAll}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
              </label>

              {/* Individual member toggles */}
              {members.map((m) => {
                const isAllowed = isWholeFamily || whoCanViewList.includes(m._id);
                return (
                  <label
                    key={m._id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={m.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.name)}`}
                        alt={m.name}
                        className="w-6 h-6 rounded-lg object-cover"
                      />
                      <span className="font-semibold text-slate-800">{m.name}</span>
                      <span className="text-[10px] text-slate-400">({m.relationship})</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isAllowed}
                      disabled={isWholeFamily}
                      onChange={() => handleToggleWhoCanViewMember(m._id)}
                      className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {/* 2. Document Details */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-500 text-lg">info</span>
              <span>Document Details</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Category:</span>
                <span className="font-bold text-slate-900">{doc.category}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Document ID:</span>
                <span className="font-mono font-bold text-slate-900">{doc.documentNumber || 'None'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Uploaded On:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(doc.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Expiry Date:</span>
                <span className="font-semibold text-slate-800">
                  {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : 'No Expiry'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Storage Protection:</span>
                <span className="font-bold text-emerald-700">Supabase Free-Tier Private</span>
              </div>
            </div>
          </div>

          {/* 3. Recent Activity */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-lg">history</span>
                <span>Recent Activity</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">{auditTrail.length} events</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              {auditTrail.length === 0 ? (
                <div className="text-slate-400 py-3 text-center">No activity recorded yet</div>
              ) : (
                auditTrail.slice(0, 4).map((log) => (
                  <div key={log._id} className="flex items-start gap-2.5 pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                    <span className="material-symbols-outlined text-base text-blue-500 mt-0.5">task_alt</span>
                    <div>
                      <div className="font-medium text-slate-800">
                        {log.performerName || 'User'} — {log.action === 'UPLOAD' ? 'Uploaded document' : log.action === 'VIEW' ? 'Viewed document' : log.action}
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

      {/* Share Safely Modal (24h Expiring Link) */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">share</span>
                </div>
                <h3 className="font-bold text-base text-slate-900">Share Safely</h3>
              </div>
              <button
                onClick={() => setShareModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This link is secure, temporary, and will <strong>automatically expire in 24 hours</strong>. Anyone with this link can view this document without needing an account.
            </p>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                Secure 24-Hour Link:
              </span>
              <div className="font-mono text-xs text-slate-800 break-all select-all bg-white p-2.5 rounded-xl border border-slate-200">
                {shareLink}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShareModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs"
              >
                Close
              </button>
              <button
                onClick={handleCopyShareLink}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">
                  {copiedShareLink ? 'check' : 'content_copy'}
                </span>
                <span>{copiedShareLink ? 'Link Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
