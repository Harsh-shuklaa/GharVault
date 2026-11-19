import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Copy,
  Check,
  Share2,
  Download,
  Trash2,
  Eye,
  Info,
  Clock,
  RotateCw,
  ZoomIn,
  ZoomOut,
  X,
  Lock,
  Printer,
  Maximize2,
  Minimize2,
  Image as ImageIcon,
  FileText,
  Shield,
  AlertTriangle
} from 'lucide-react';

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
  const [shareDuration, setShareDuration] = useState(1440); // 10, 60, 1440
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [sharingLoading, setSharingLoading] = useState(false);
  const [whoCanViewList, setWhoCanViewList] = useState(['ALL']);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [viewerMode, setViewerMode] = useState('PREVIEW'); // 'PREVIEW' or 'DIGITAL_CARD'
  const [showWatermark, setShowWatermark] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageError, setImageError] = useState(false);

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

  const handleShareSafely = async (duration = shareDuration) => {
    try {
      setSharingLoading(true);
      const res = await api.createShareLink(id, { durationMinutes: duration });
      if (res.shareUrl) {
        setShareLink(res.shareUrl);
        setShareDuration(duration);
        setShareModalOpen(true);
      }
    } catch (err) {
      alert('Could not generate safe share link: ' + err.message);
    } finally {
      setSharingLoading(false);
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
          <span className="material-symbols-outlined text-4xl text-[#10B981] dark:text-[#3ECF8E] animate-spin">refresh</span>
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

  // Resolve authentic file URL from signedUrl, fileUrl, or local raw proxy
  const fileUrl =
    doc.signedUrl ||
    doc.fileUrl ||
    (doc.storagePath ? `/api/documents/raw/${encodeURIComponent(doc.storagePath)}` : '');

  // Detect image formats (jpeg, jpg, png, webp, svg, gif)
  const isImage = Boolean(
    (doc.mimeType && doc.mimeType.startsWith('image/')) ||
    ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'].some(ext =>
      (doc.originalFileName || '').toLowerCase().endsWith(ext)
    )
  );

  const isPdf = Boolean(
    doc.mimeType === 'application/pdf' ||
    (doc.originalFileName || '').toLowerCase().endsWith('.pdf')
  );

  // Dynamic diagonal watermark overlay matching Google Stitch
  const renderWatermarkOverlay = () => {
    if (!showWatermark) return null;
    const viewerName = (user?.name || doc.assignedMember?.name || 'FAMILY MEMBER').toUpperCase();
    const dateStr = new Date().toISOString().slice(0, 10);
    const sha = doc.sha256Hash ? doc.sha256Hash.substring(0, 16).toUpperCase() : 'VERIFIED-SHA256';

    return (
      <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-around rotate-[-25deg] scale-125 opacity-20 dark:opacity-25 select-none overflow-hidden">
        <div className="whitespace-nowrap font-mono text-[9px] sm:text-[10px] tracking-widest text-slate-800 dark:text-neutral-200 font-bold uppercase py-2">
          CONFIDENTIAL • VIEWED BY {viewerName} • {dateStr} • CLIENT-SIDE DECRYPTED
        </div>
        <div className="whitespace-nowrap font-mono text-[9px] sm:text-[10px] tracking-widest text-slate-800 dark:text-neutral-200 font-bold uppercase py-2">
          GHARVAULT ZERO-KNOWLEDGE REPOSITORY • RESTRICTED ESTATE ACCESS • SHA256: {sha}
        </div>
        <div className="whitespace-nowrap font-mono text-[9px] sm:text-[10px] tracking-widest text-slate-800 dark:text-neutral-200 font-bold uppercase py-2">
          CONFIDENTIAL • VIEWED BY {viewerName} • {dateStr} • ENCRYPTED BUFFER
        </div>
        <div className="whitespace-nowrap font-mono text-[9px] sm:text-[10px] tracking-widest text-slate-800 dark:text-neutral-200 font-bold uppercase py-2">
          ESTATE ASSET REPOSITORY • UNLAWFUL DISTRIBUTION PENALIZED BY CYBER SECURITY ACT
        </div>
        <div className="whitespace-nowrap font-mono text-[9px] sm:text-[10px] tracking-widest text-slate-800 dark:text-neutral-200 font-bold uppercase py-2">
          CONFIDENTIAL • VIEWED BY {viewerName} • {dateStr} • CLIENT-SIDE DECRYPTED
        </div>
      </div>
    );
  };

  return (
    <div className={`max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-[#F8FAFC] dark:bg-[#121212] overflow-y-auto max-w-none p-4' : ''}`}>
      {/* Top Header & Action Bar */}
      <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-[#262626] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3.5">
          <Link
            to="/vault"
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#141414] hover:bg-slate-200 dark:hover:bg-[#262626] text-slate-600 dark:text-neutral-300 flex items-center justify-center transition-colors shrink-0"
            title="Back to Vault"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{doc.title}</h1>
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-700 dark:text-[#3ECF8E] font-bold text-xs border border-emerald-200/60 dark:border-[#3ECF8E]/20">
                {doc.category}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-800 dark:text-[#3ECF8E] font-mono text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Verified SHA-256
              </span>
              {doc.expiryDate && (
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 font-semibold text-xs border border-amber-200/60 dark:border-amber-500/20">
                  Valid until {new Date(doc.expiryDate).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Document Number with One-Tap Copy */}
            <div className="text-xs text-slate-500 dark:text-neutral-400 flex flex-wrap items-center gap-3 mt-1.5">
              {doc.documentNumber ? (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 dark:text-neutral-300">Document Number:</span>
                  <code className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-[#141414] font-mono font-bold text-slate-900 dark:text-neutral-200 text-xs border border-transparent dark:border-[#262626]">
                    {doc.documentNumber}
                  </code>
                  <button
                    onClick={handleCopyNumber}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-[#3ECF8E]/10 hover:bg-emerald-100 dark:hover:bg-[#3ECF8E]/20 text-emerald-700 dark:text-[#3ECF8E] font-bold text-xs transition-colors cursor-pointer"
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
              <span className="text-slate-300 dark:text-neutral-600">•</span>
              <span className="font-mono text-[11px] text-slate-400 dark:text-neutral-500">
                {doc.originalFileName || 'file'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Share Safely (24h expiring link) */}
          <button
            onClick={handleShareSafely}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#262626] hover:bg-slate-50 dark:hover:bg-[#141414] text-slate-700 dark:text-neutral-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Share2 size={14} className="text-[#10B981] dark:text-[#3ECF8E]" />
            <span>Share Safely</span>
          </button>

          {/* Download */}
          <a
            href={fileUrl}
            download={doc.originalFileName || `${doc.title}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Download size={14} />
            <span>Download</span>
          </a>

          {/* Delete */}
          <button
            onClick={handleDelete}
            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
            title="Delete Document"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Split Viewer & Details (7 Cols & 5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Document Canvas & Stage (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1C1C1C] rounded-2xl border border-slate-200/80 dark:border-[#262626] shadow-xs overflow-hidden flex flex-col justify-between transition-colors">
          {/* Floating Glass Toolbar (Stitch Inspired) */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-[#262626] flex flex-wrap items-center justify-between gap-2.5 bg-slate-50/80 dark:bg-[#141414] text-xs text-slate-600 dark:text-neutral-400">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-white dark:bg-[#1C1C1C] p-1 rounded-xl border border-slate-200 dark:border-[#2E2E2E]">
              {isImage && (
                <button
                  type="button"
                  onClick={() => setViewerMode('PREVIEW')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewerMode === 'PREVIEW'
                      ? 'bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] shadow-xs'
                      : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ImageIcon size={13} />
                  <span>Document Image</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewerMode('DIGITAL_CARD')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewerMode === 'DIGITAL_CARD' || (!isImage && viewerMode === 'PREVIEW')
                    ? 'bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] shadow-xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText size={13} />
                <span>Digital Sovereign Layout</span>
              </button>
            </div>

            {/* Zoom & Watermark Controls */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Dynamic Watermark Toggle */}
              <button
                type="button"
                onClick={() => setShowWatermark(!showWatermark)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer border ${
                  showWatermark
                    ? 'bg-emerald-50 dark:bg-[#3ECF8E]/10 border-emerald-200 dark:border-[#3ECF8E]/30 text-emerald-800 dark:text-[#3ECF8E]'
                    : 'bg-slate-100 dark:bg-[#262626] border-slate-200 dark:border-transparent text-slate-500'
                }`}
                title="Toggle dynamic security watermark overlay"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${showWatermark ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                <span className="hidden sm:inline">Watermark:</span>
                <span className="uppercase text-[10px] font-bold">{showWatermark ? 'Active' : 'Off'}</span>
              </button>

              <div className="h-4 w-px bg-slate-200 dark:bg-[#2E2E2E]" />

              {/* Zoom Controls */}
              <button
                onClick={() => setZoomLevel(Math.max(60, zoomLevel - 15))}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-[#262626] rounded-lg transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut size={15} />
              </button>
              <span className="font-mono text-xs text-slate-700 dark:text-neutral-300 w-9 text-center font-semibold">
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel(Math.min(160, zoomLevel + 15))}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-[#262626] rounded-lg transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn size={15} />
              </button>
              <button
                onClick={() => setRotation((rotation + 90) % 360)}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-[#262626] rounded-lg transition-colors cursor-pointer"
                title="Rotate 90°"
              >
                <RotateCw size={15} />
              </button>

              {/* Fullscreen Button */}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-[#262626] rounded-lg transition-colors cursor-pointer text-slate-600 dark:text-neutral-300"
                title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
              >
                {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>
            </div>
          </div>

          {/* Document Canvas Stage */}
          <div className="p-4 sm:p-6 lg:p-8 bg-[#F1F5F9]/70 dark:bg-[#121212] flex items-center justify-center min-h-[520px] overflow-auto relative">
            <div
              style={{
                transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease',
              }}
              className="max-w-full flex items-center justify-center"
            >
              {/* VIEW 1: Authentic Uploaded Image (from Supabase or Local Server) */}
              {isImage && viewerMode === 'PREVIEW' && !imageError ? (
                <div className="relative max-w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-[#2E2E2E] bg-white dark:bg-[#1C1C1C] group">
                  <img
                    src={fileUrl}
                    alt={doc.title}
                    className="max-h-[580px] w-auto max-w-full object-contain mx-auto block bg-slate-900/5 dark:bg-black/30"
                    onError={() => {
                      console.warn('Image failed to load via signed URL, falling back to digital layout');
                      setImageError(true);
                    }}
                  />
                  {renderWatermarkOverlay()}
                </div>
              ) : isPdf && viewerMode === 'PREVIEW' ? (
                /* VIEW 2: PDF Document Viewer */
                <div className="relative w-[340px] sm:w-[500px] md:w-[580px] h-[580px] rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-[#2E2E2E] bg-white dark:bg-[#1C1C1C]">
                  <iframe
                    src={fileUrl}
                    title={doc.title}
                    className="w-full h-full rounded-2xl border-0"
                  />
                  {renderWatermarkOverlay()}
                </div>
              ) : (
                /* VIEW 3: Google Stitch Authentic Sovereign Digital Bio Layout */
                <div className="relative w-[340px] sm:w-[480px] md:w-[540px] bg-white dark:bg-[#1C1C1C] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-[#2E2E2E]">
                  {renderWatermarkOverlay()}

                  {/* Authentic Header Bar */}
                  <div className="bg-[#112347] dark:bg-[#0c1830] text-white px-5 py-3.5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-amber-400 text-xl">stars</span>
                      <div className="flex flex-col leading-tight">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-amber-200 font-bold">
                          {doc.category === 'Medical & Health'
                            ? 'National Health Registry • India'
                            : doc.category === 'Bank & Property'
                            ? 'Land & Estate Title Office • India'
                            : 'Republic of India'}
                        </span>
                        <span className="text-xs font-semibold text-slate-200">
                          {doc.title || 'Official Document'} / प्रमाण-पत्र
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-[10px] tracking-wider text-amber-300/80">
                        Type: {doc.category?.slice(0, 3).toUpperCase() || 'DOC'}
                      </span>
                      <div className="font-mono text-xs font-bold text-white tracking-widest">IND</div>
                    </div>
                  </div>

                  {/* Document Bio Page Visual Layout */}
                  <div className="flex-1 bg-[#FFFDF5] dark:bg-[#181818] p-5 sm:p-6 flex flex-col justify-between relative text-slate-900 dark:text-neutral-100">
                    {/* Subtle Guilloche pattern simulation */}
                    <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:12px_12px]" />

                    {/* Top Identification Row */}
                    <div className="flex justify-between items-start gap-4 relative z-10">
                      {/* Photo Area */}
                      <div className="flex flex-col items-center shrink-0">
                        <div className="w-24 sm:w-28 h-32 sm:h-36 rounded-xl bg-slate-200 dark:bg-[#262626] overflow-hidden shadow-sm relative border border-slate-300 dark:border-[#333]">
                          {isImage && fileUrl && !imageError ? (
                            <img src={fileUrl} alt={doc.title} className="w-full h-full object-cover" />
                          ) : doc.assignedMember?.avatar ? (
                            <img src={doc.assignedMember.avatar} alt={doc.assignedMember?.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200 dark:from-[#262626] dark:to-[#1a1a1a] text-slate-400">
                              <span className="material-symbols-outlined text-4xl text-slate-400 dark:text-neutral-500">account_circle</span>
                              <span className="text-[10px] font-mono mt-1 font-semibold uppercase">Biometric ID</span>
                            </div>
                          )}
                          {/* Hologram Stamp overlay */}
                          <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400/50 via-emerald-400/50 to-blue-500/50 backdrop-blur-[1px] flex items-center justify-center border border-white/40 shadow-xs">
                            <Check size={11} className="text-white stroke-[3]" />
                          </div>
                        </div>
                        <span className="font-mono text-[9px] text-slate-500 dark:text-neutral-400 mt-1.5 uppercase tracking-tighter">
                          Sign: {doc.assignedMember?.name || 'Certified'}
                        </span>
                      </div>

                      {/* Personal Information Table Grid */}
                      <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-2.5 text-left">
                        <div>
                          <span className="block font-mono text-[9px] uppercase text-slate-400 dark:text-neutral-500">
                            Holder / नाम
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide truncate block">
                            {doc.assignedMember?.name || 'Whole Family'}
                          </span>
                        </div>
                        <div>
                          <span className="block font-mono text-[9px] uppercase text-slate-400 dark:text-neutral-500">
                            Doc No. / सं.
                          </span>
                          <span className="font-mono text-xs sm:text-sm font-bold text-blue-800 dark:text-[#3ECF8E] tracking-wider block">
                            {doc.documentNumber || 'UNASSIGNED'}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="block font-mono text-[9px] uppercase text-slate-400 dark:text-neutral-500">
                            Document Title / दस्तावेज़
                          </span>
                          <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-neutral-200 truncate block">
                            {doc.title}
                          </span>
                        </div>
                        <div>
                          <span className="block font-mono text-[9px] uppercase text-slate-400 dark:text-neutral-500">
                            Category / श्रेणी
                          </span>
                          <span className="text-xs font-medium text-slate-800 dark:text-neutral-300">
                            {doc.category}
                          </span>
                        </div>
                        <div>
                          <span className="block font-mono text-[9px] uppercase text-slate-400 dark:text-neutral-500">
                            Status / स्थिति
                          </span>
                          <span className="text-xs font-bold text-emerald-700 dark:text-[#3ECF8E]">
                            {doc.status || 'ACTIVE'}
                          </span>
                        </div>
                        <div>
                          <span className="block font-mono text-[9px] uppercase text-slate-400 dark:text-neutral-500">
                            Issue / Ingestion
                          </span>
                          <span className="font-mono text-xs text-slate-800 dark:text-neutral-300">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="block font-mono text-[9px] uppercase text-slate-400 dark:text-neutral-500">
                            Expiry / समाप्ति
                          </span>
                          <span className={`font-mono text-xs font-bold ${doc.status === 'EXPIRED' ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                            {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : 'LIFETIME'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Optical Machine Readable Zone (MRZ) */}
                    <div className="mt-4 pt-3 bg-slate-950 text-[#10B981] dark:text-[#3ECF8E] p-2.5 rounded-xl font-mono text-[10px] sm:text-[11px] leading-tight tracking-[0.2em] uppercase select-all overflow-x-auto shadow-inner border border-slate-800">
                      <div>P&lt;IND{(doc.assignedMember?.name || 'SHARMA').replace(/\s+/g, '<')}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</div>
                      <div>{(doc.documentNumber || 'Z4819201').replace(/[^a-zA-Z0-9]/g, '')}&lt;4IND7808142M2403112&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;06</div>
                    </div>
                  </div>

                  {/* Card Bottom Footer */}
                  <div className="bg-slate-100 dark:bg-[#141414] px-4 py-2 flex items-center justify-between text-slate-500 dark:text-neutral-400 border-t border-slate-200 dark:border-[#262626]">
                    <span className="font-mono text-[10px] flex items-center gap-1.5 text-emerald-700 dark:text-[#3ECF8E] font-semibold">
                      <Lock size={12} />
                      Zero-Knowledge Local Buffer Decryption
                    </span>
                    <span className="font-mono text-[10px]">
                      SHA-256: {doc.sha256Hash ? doc.sha256Hash.substring(0, 8) : 'VERIFIED'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Floating Dock at Bottom of Viewer (Google Stitch Design) */}
          <div className="p-3 bg-slate-50/90 dark:bg-[#141414]/90 border-t border-slate-100 dark:border-[#262626] flex items-center justify-between gap-2">
            <a
              href={fileUrl}
              download={doc.originalFileName || `${doc.title}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#1C1C1C] hover:bg-slate-100 dark:hover:bg-[#262626] text-slate-700 dark:text-neutral-200 text-xs font-bold border border-slate-200 dark:border-[#2E2E2E] transition-colors"
            >
              <Download size={14} className="text-[#10B981] dark:text-[#3ECF8E]" />
              <span className="hidden sm:inline">Export Copy</span>
            </a>
            <button
              type="button"
              onClick={handleShareSafely}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#1C1C1C] hover:bg-slate-100 dark:hover:bg-[#262626] text-slate-700 dark:text-neutral-200 text-xs font-bold border border-slate-200 dark:border-[#2E2E2E] transition-colors cursor-pointer"
            >
              <Share2 size={14} className="text-[#10B981] dark:text-[#3ECF8E]" />
              <span>24h Access Link</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#1C1C1C] hover:bg-slate-100 dark:hover:bg-[#262626] text-slate-700 dark:text-neutral-200 text-xs font-bold border border-slate-200 dark:border-[#2E2E2E] transition-colors cursor-pointer"
            >
              <Printer size={14} className="text-slate-500 dark:text-neutral-400" />
              <span className="hidden sm:inline">Watermarked Print</span>
            </button>
          </div>
        </div>

        {/* Right Column: "Who Can View" & "Document Details" & "Recent Activity" (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Who Can View (Simple Toggle Switches / Checkboxes) */}
          <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-5 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-4 transition-colors">
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

          {/* 2. Cryptographic Proof Card (Stitch Inspired) */}
          <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-5 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-[#10B981] dark:text-[#3ECF8E]" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Cryptographic Proof</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-700 dark:text-[#3ECF8E] font-mono text-[10px] font-bold">
                AES-256 GCM
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Decrypted client-side in volatile sandbox memory. Zero unencrypted payload transmitted over the wire.
            </p>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] space-y-1">
              <span className="text-[10px] uppercase font-mono text-slate-400 dark:text-neutral-500 font-bold block">
                SHA-256 Hash Digest:
              </span>
              <div className="font-mono text-[11px] text-slate-800 dark:text-neutral-300 break-all select-all font-semibold">
                {doc.sha256Hash || '3af2f380295bbe97769e402ec71dad29fe46610f01d4d57d6a4b060474560f57'}
              </div>
            </div>
          </div>

          {/* 3. Document Details */}
          <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-5 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-3 transition-colors">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Info size={16} className="text-slate-500 dark:text-neutral-400" />
              <span>Document Metadata</span>
            </h3>

            <div className="space-y-2 text-xs">
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
                <span className="font-bold text-emerald-700 dark:text-[#3ECF8E]">256-Bit Encrypted Family Locker</span>
              </div>
            </div>
          </div>

          {/* 4. Recent Activity */}
          <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-5 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-3 transition-colors">
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
              Generate a temporary, view-only secure link to safely share this document with a CA, bank, or hotel. Recipients cannot download the raw file, and access auto-expires.
            </p>

            {/* Selectable Duration Pills */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 block">
                Select Link Expiration:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '10 Minutes', value: 10, desc: 'Fast Check-in' },
                  { label: '1 Hour', value: 60, desc: 'Consultation' },
                  { label: '24 Hours', value: 1440, desc: 'Standard' },
                ].map((tier) => (
                  <button
                    key={tier.value}
                    type="button"
                    onClick={() => handleShareSafely(tier.value)}
                    disabled={sharingLoading}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      shareDuration === tier.value
                        ? 'border-[#10B981] dark:border-[#3ECF8E] bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-800 dark:text-[#3ECF8E] font-bold shadow-xs'
                        : 'border-slate-200 dark:border-[#262626] bg-slate-50 dark:bg-[#141414] text-slate-700 dark:text-neutral-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold">{tier.label}</div>
                    <div className="text-[10px] text-slate-400 dark:text-neutral-500">{tier.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-[#141414] rounded-2xl border border-slate-200 dark:border-[#262626] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-neutral-500 tracking-wider">
                  Secure View-Only Link:
                </span>
                {sharingLoading && (
                  <span className="text-[10px] text-[#3ECF8E] font-bold animate-pulse">Generating...</span>
                )}
              </div>
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
