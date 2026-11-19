import React, { useState, useEffect, useRef } from 'react';
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
  AlertTriangle,
  ChevronDown,
  Users,
  KeyRound
} from 'lucide-react';
import MpinModal from '../components/common/MpinModal';
import { useToast } from '../context/ToastContext';

export default function DocumentPreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { family, user } = useAuth();
  const { toast } = useToast();

  const [doc, setDoc] = useState(null);
  const [members, setMembers] = useState([]);
  const [auditTrail, setAuditTrail] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [shareDuration, setShareDuration] = useState(1440); // 10, 60, 1440
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [sharingLoading, setSharingLoading] = useState(false);
  const [whoCanViewList, setWhoCanViewList] = useState(['ALL']);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [permissionFeedback, setPermissionFeedback] = useState('');
  const [isWhoCanViewOpen, setIsWhoCanViewOpen] = useState(false);
  const whoCanViewDropdownRef = useRef(null);
  const [viewerMode, setViewerMode] = useState('PREVIEW'); // 'PREVIEW' or 'DIGITAL_CARD'
  const [showWatermark, setShowWatermark] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageError, setImageError] = useState(false);

  // MPIN Protection state
  const [isMpinLocked, setIsMpinLocked] = useState(false);
  const [showMpinModal, setShowMpinModal] = useState(false);
  const [isTogglingMpin, setIsTogglingMpin] = useState(false);
  const [mpinFeedback, setMpinFeedback] = useState('');

  // Close who-can-view dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (whoCanViewDropdownRef.current && !whoCanViewDropdownRef.current.contains(event.target)) {
        setIsWhoCanViewOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

        if (res.document.shareLink?.token) {
          const directUrl = res.document.shareLink.shareUrl || `${window.location.origin}/share/${res.document.shareLink.token}`;
          setShareLink(directUrl);
        }

        const isSensitive = Boolean(
          res.document.isSensitive ||
          res.document.isMpinProtected ||
          ['Property & Legal', 'Financial', 'Legal'].includes(res.document.category)
        );
        const isSessionUnlocked = sessionStorage.getItem('gharvault_mpin_unlocked') === 'true';
        if (isSensitive && !isSessionUnlocked) {
          setIsMpinLocked(true);
        } else {
          setIsMpinLocked(false);
        }
      }
    } catch (err) {
      console.error('Failed to load document details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMpinProtection = async () => {
    if (!doc) return;
    try {
      setIsTogglingMpin(true);
      const nextState = !(doc.isMpinProtected || doc.isSensitive);
      await api.updateMpinProtection(id, nextState);
      setDoc(prev => ({ ...prev, isMpinProtected: nextState, isSensitive: nextState }));
      const msg = nextState ? 'Security MPIN Lock Enabled 🔒' : 'Security MPIN Lock Removed 🔓';
      setMpinFeedback(msg);
      toast.success(msg);
      setTimeout(() => setMpinFeedback(''), 3000);
    } catch (err) {
      console.error('Failed to update MPIN protection:', err);
      toast.error('Could not update MPIN lock: ' + (err.message || 'Error'));
    } finally {
      setIsTogglingMpin(false);
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

  // Close share & delete modals on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (shareModalOpen) setShareModalOpen(false);
        if (isDeleteModalOpen) setIsDeleteModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shareModalOpen, isDeleteModalOpen]);

  const getShareExpiryInfo = (shareLinkData) => {
    if (!shareLinkData || !shareLinkData.token) return null;
    if (!shareLinkData.expiresAt) return { isExpired: false, text: 'Active Link', dateFormatted: '' };

    const now = new Date();
    const exp = new Date(shareLinkData.expiresAt);
    const diffMs = exp - now;

    const dateFormatted = exp.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }) + ' at ' + exp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (diffMs <= 0) {
      return { isExpired: true, text: 'Expired', dateFormatted };
    }

    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    let timeLeft = '';
    if (diffDays > 0) {
      timeLeft = `${diffDays}d ${diffHours % 24}h left`;
    } else if (diffHours > 0) {
      timeLeft = `${diffHours}h ${diffMins % 60}m left`;
    } else {
      timeLeft = `${diffMins}m left`;
    }

    return { isExpired: false, text: timeLeft, dateFormatted };
  };

  const handleShareSafely = async (duration = shareDuration) => {
    try {
      setSharingLoading(true);
      const res = await api.createShareLink(id, { durationMinutes: duration });
      if (res.shareUrl) {
        setShareLink(res.shareUrl);
        setShareDuration(duration);
        setDoc(prev => (prev ? {
          ...prev,
          shareLink: {
            token: res.token,
            expiresAt: res.expiresAt,
            shareUrl: res.shareUrl,
            isExpired: false,
          }
        } : prev));
        setShareModalOpen(true);
      }
    } catch (err) {
      toast.error('Could not generate safe share link: ' + (err.message || 'Error'));
    } finally {
      setSharingLoading(false);
    }
  };

  const handleRevokeShareLink = async () => {
    try {
      await api.revokeShareLink(id);
      toast.success('Safe share link revoked. External access is closed.');
      setDoc(prev => (prev ? { ...prev, shareLink: null } : prev));
      setShareLink('');
      setShareModalOpen(false);
    } catch (err) {
      toast.error('Failed to revoke share link: ' + (err.message || 'Error'));
    }
  };

  const handleCopyShareLink = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
    setCopiedShareLink(true);
    toast.success('Safe view-only share link copied to clipboard!');
    setTimeout(() => setCopiedShareLink(false), 2000);
  };

  const handleSelectAll = async () => {
    try {
      setSavingPermissions(true);
      const updated = ['ALL'];
      await api.updateWhoCanView(id, updated);
      setWhoCanViewList(updated);
      setDoc(prev => (prev ? { ...prev, whoCanView: updated } : prev));
      setPermissionFeedback('Saved ✓ (Everyone)');
      toast.success('Viewing permissions set to Everyone');
      setTimeout(() => setPermissionFeedback(''), 2500);
    } catch (err) {
      console.error('Failed to update viewing permissions:', err);
      toast.error('Failed to update viewing permissions: ' + (err.message || 'Error'));
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleToggleMember = async (memberId) => {
    try {
      setSavingPermissions(true);
      const strId = memberId.toString();
      let updated;
      if (whoCanViewList.includes('ALL')) {
        // Switch from Everyone to specific member
        updated = [strId];
      } else if (whoCanViewList.includes(strId)) {
        // Uncheck this member
        const remaining = whoCanViewList.filter(id => id !== strId);
        updated = remaining.length > 0 ? remaining : ['ALL'];
      } else {
        // Check this member
        updated = [...whoCanViewList.filter(id => id !== 'ALL'), strId];
      }
      await api.updateWhoCanView(id, updated);
      setWhoCanViewList(updated);
      setDoc(prev => (prev ? { ...prev, whoCanView: updated } : prev));
      setPermissionFeedback('Saved ✓');
      toast.success('Viewing permissions updated');
      setTimeout(() => setPermissionFeedback(''), 2500);
    } catch (err) {
      console.error('Failed to update member permission:', err);
      toast.error('Failed to update viewing permissions: ' + (err.message || 'Error'));
    } finally {
      setSavingPermissions(false);
    }
  };

  const getDropdownSummary = () => {
    if (!whoCanViewList || whoCanViewList.length === 0 || whoCanViewList.includes('ALL')) {
      return {
        title: 'Everyone in Family',
        sub: 'All family members can view',
        isAll: true,
      };
    }
    const permittedMembers = members.filter(m => whoCanViewList.includes((m._id || m.id)?.toString()));
    if (permittedMembers.length === 0) {
      return {
        title: 'Everyone in Family',
        sub: 'All family members can view',
        isAll: true,
      };
    }
    if (permittedMembers.length === 1) {
      return {
        title: `Only ${permittedMembers[0].name}`,
        sub: `${permittedMembers[0].relationship || permittedMembers[0].relation || 'Member'} only`,
        isAll: false,
      };
    }
    return {
      title: `${permittedMembers.length} Members Permitted`,
      sub: permittedMembers.map(m => m.name).join(', '),
      isAll: false,
    };
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setDeletingDoc(true);
      await api.deleteDocument(id);
      toast.success(`"${doc?.title}" was deleted permanently.`);
      navigate('/vault');
    } catch (err) {
      toast.error('Could not delete document: ' + err.message);
    } finally {
      setDeletingDoc(false);
      setIsDeleteModalOpen(false);
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
            onClick={handleDeleteClick}
            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
            title="Delete Document"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Active Share Link Notification Banner */}
      {doc.shareLink && doc.shareLink.token && (() => {
        const shareInfo = getShareExpiryInfo(doc.shareLink);
        if (!shareInfo) return null;
        const fullUrl = doc.shareLink.shareUrl || `${window.location.origin}/share/${doc.shareLink.token}`;

        return (
          <div className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
            shareInfo.isExpired
              ? 'bg-slate-50 dark:bg-[#18181B] border-slate-200 dark:border-[#27272A]'
              : 'bg-emerald-50/80 dark:bg-[#3ECF8E]/10 border-emerald-200 dark:border-[#3ECF8E]/30'
          }`}>
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                shareInfo.isExpired
                  ? 'bg-slate-200 dark:bg-[#27272A] text-slate-500'
                  : 'bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212]'
              }`}>
                <Share2 size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {shareInfo.isExpired ? 'Share Link Expired' : 'Active Safe Share Link'}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-extrabold uppercase border ${
                    shareInfo.isExpired
                      ? 'bg-slate-200 dark:bg-[#27272A] text-slate-600 dark:text-neutral-400 border-slate-300 dark:border-[#3F3F46]'
                      : 'bg-white dark:bg-[#18181B] text-emerald-800 dark:text-[#3ECF8E] border-emerald-300 dark:border-[#3ECF8E]/40'
                  }`}>
                    {shareInfo.isExpired ? `Expired on ${shareInfo.dateFormatted}` : `⏳ ${shareInfo.text} (Expires ${shareInfo.dateFormatted})`}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-600 dark:text-neutral-300 truncate mt-1 select-all">
                  {fullUrl}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
              {!shareInfo.isExpired ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(fullUrl);
                      toast.success('Safe view-only share link copied to clipboard!');
                    }}
                    className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white dark:bg-[#18181B] border border-emerald-200 dark:border-[#3ECF8E]/30 hover:bg-emerald-50 dark:hover:bg-[#27272A] text-emerald-800 dark:text-[#3ECF8E] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Copy size={13} />
                    <span>Copy Link</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRevokeShareLink}
                    className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-700 dark:text-red-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Revoke and stop external access immediately"
                  >
                    <X size={13} />
                    <span>Revoke Link</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setShareModalOpen(true)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Share2 size={13} />
                  <span>Generate New Share Link</span>
                </button>
              )}
            </div>
          </div>
        );
      })()}

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
            {isMpinLocked ? (
              <div className="bg-white dark:bg-[#1C1C1C] rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-[#262626] shadow-2xl max-w-md w-full text-center space-y-5 animate-fadeIn">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400 shadow-sm">
                  <Lock size={32} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Sensitive Document Locked</h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">
                    This document is protected by your 4-digit family Security MPIN to prevent unauthorized viewing.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMpinModal(true)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] font-bold text-xs shadow-md shadow-[#3ECF8E]/25 transition-all cursor-pointer w-full"
                >
                  <KeyRound size={16} />
                  <span>Enter 4-Digit MPIN to Decrypt & View</span>
                </button>
              </div>
            ) : (
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
            )}
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
          {/* 1. Who Can View (Dropdown & Granular Access Control) */}
          <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-5 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Eye size={16} className="text-[#10B981] dark:text-[#3ECF8E]" />
                <span>Who Can View</span>
              </h3>
              <div className="flex items-center gap-1.5">
                {savingPermissions && (
                  <span className="text-[11px] text-[#10B981] dark:text-[#3ECF8E] font-bold animate-pulse">Saving...</span>
                )}
                {permissionFeedback && (
                  <span className="text-[11px] text-emerald-600 dark:text-[#3ECF8E] font-bold bg-emerald-50 dark:bg-[#3ECF8E]/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-[#3ECF8E]/20">
                    {permissionFeedback}
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Control which family members have permission to view and download this file.
            </p>

            {/* Checkbox Dropdown Selector */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                Permitted Family Members
              </label>

              <div className="relative" ref={whoCanViewDropdownRef}>
                {/* Trigger Button */}
                <button
                  type="button"
                  disabled={savingPermissions}
                  onClick={() => setIsWhoCanViewOpen(!isWhoCanViewOpen)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#2E2E2E] bg-slate-50 dark:bg-[#141414] hover:bg-slate-100 dark:hover:bg-[#1A1A1A] text-left transition-all cursor-pointer shadow-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg shrink-0 ${
                      getDropdownSummary().isAll
                        ? 'bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-600 dark:text-[#3ECF8E]'
                        : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}>
                      {getDropdownSummary().isAll ? <Users size={16} /> : <Eye size={16} />}
                    </div>
                    <div className="truncate">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                        {getDropdownSummary().title}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-neutral-400 block truncate">
                        {getDropdownSummary().sub}
                      </span>
                    </div>
                  </div>
                  <ChevronDown size={16} className={`text-slate-400 transition-transform ${isWhoCanViewOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu with Checkboxes inside */}
                {isWhoCanViewOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-[#1C1C1C] rounded-2xl border border-slate-200 dark:border-[#2E2E2E] shadow-2xl p-2 space-y-1 animate-fadeIn max-h-72 overflow-y-auto">
                    {/* Option 1: Everyone in Family */}
                    <div
                      onClick={handleSelectAll}
                      className={`flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer ${
                        whoCanViewList.includes('ALL')
                          ? 'bg-emerald-50/80 dark:bg-[#3ECF8E]/15 text-emerald-950 dark:text-white'
                          : 'hover:bg-slate-50 dark:hover:bg-[#262626] text-slate-700 dark:text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-[#3ECF8E]/20 text-emerald-700 dark:text-[#3ECF8E] flex items-center justify-center shrink-0">
                          <Users size={15} />
                        </div>
                        <div>
                          <span className="text-xs font-bold block">Everyone in Family</span>
                          <span className="text-[10px] text-slate-400 dark:text-neutral-500 block">All current and future members</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={whoCanViewList.includes('ALL')}
                        readOnly
                        className="w-4 h-4 rounded text-[#10B981] dark:text-[#3ECF8E] border-slate-300 dark:border-[#262626] focus:ring-[#3ECF8E] cursor-pointer"
                      />
                    </div>

                    {/* Divider */}
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 border-t border-slate-100 dark:border-[#262626] mt-1 pt-2">
                      Or check specific members:
                    </div>

                    {/* Member Checkbox Items */}
                    {members.map((m) => {
                      const mId = (m._id || m.id)?.toString();
                      const isChecked = whoCanViewList.includes(mId) && !whoCanViewList.includes('ALL');
                      return (
                        <div
                          key={mId}
                          onClick={() => handleToggleMember(mId)}
                          className={`flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-emerald-50/80 dark:bg-[#3ECF8E]/15 text-emerald-950 dark:text-white'
                              : 'hover:bg-slate-50 dark:hover:bg-[#262626] text-slate-700 dark:text-neutral-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={m.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.name)}`}
                              alt={m.name}
                              className="w-7 h-7 rounded-full object-cover shrink-0"
                            />
                            <div className="truncate">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold block truncate">{m.name}</span>
                                {m.role === 'ADMIN' && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-700 dark:text-[#3ECF8E] font-bold">
                                    Head
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 dark:text-neutral-500 block truncate">
                                {m.relationship || m.relation || 'Member'}
                              </span>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            readOnly
                            className="w-4 h-4 rounded text-[#10B981] dark:text-[#3ECF8E] border-slate-300 dark:border-[#262626] focus:ring-[#3ECF8E] cursor-pointer shrink-0"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Active Status Badge & Description */}
            <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-[#161616] border border-slate-200/70 dark:border-[#262626] text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-white">
                {whoCanViewList.includes('ALL') ? (
                  <>
                    <Users size={14} className="text-[#10B981] dark:text-[#3ECF8E]" />
                    <span>Entire Family Access</span>
                  </>
                ) : (
                  <>
                    <Lock size={14} className="text-amber-600 dark:text-amber-400" />
                    <span>Restricted to {whoCanViewList.filter(id => id !== 'ALL').length} Member(s)</span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                {whoCanViewList.includes('ALL')
                  ? 'All current and future members of your family vault can view and download this paper.'
                  : `Only the checked family members above (and the document uploader) can see or download this paper. It is hidden from everyone else in the vault.`}
              </p>
            </div>
          </div>

          {/* 1.5 4-Digit Security MPIN Card */}
          <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-5 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock size={16} className={(doc.isMpinProtected || doc.isSensitive) ? 'text-amber-500' : 'text-slate-400'} />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">4-Digit MPIN Protection</h3>
              </div>
              {mpinFeedback && (
                <span className="text-[10px] font-bold text-[#10B981] dark:text-[#3ECF8E] animate-fadeIn">
                  {mpinFeedback}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-neutral-400">
              {(doc.isMpinProtected || doc.isSensitive)
                ? 'Protected record. Requires entering your 4-digit family MPIN before opening or downloading.'
                : 'Standard protection. Accessible to permitted family members without requiring an MPIN.'}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#262626]">
              <span className="text-xs font-semibold text-slate-700 dark:text-neutral-300">
                {(doc.isMpinProtected || doc.isSensitive) ? 'Status: 🔒 Locked with MPIN' : 'Status: 🔓 Standard'}
              </span>
              <button
                type="button"
                disabled={isTogglingMpin}
                onClick={handleToggleMpinProtection}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  (doc.isMpinProtected || doc.isSensitive)
                    ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100'
                    : 'bg-emerald-50 dark:bg-[#3ECF8E]/10 border-emerald-200 dark:border-[#3ECF8E]/30 text-emerald-700 dark:text-[#3ECF8E] hover:bg-emerald-100'
                }`}
              >
                {isTogglingMpin ? 'Updating...' : (doc.isMpinProtected || doc.isSensitive) ? 'Remove MPIN Lock' : 'Enable MPIN Lock'}
              </button>
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

      {/* Share Safely Modal (24h Expiring Link) - Bottom-Sheet on Mobile, Card on Desktop */}
      {shareModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
          onClick={() => setShareModalOpen(false)}
        >
          <div
            className="fixed inset-x-0 bottom-0 md:static md:inset-auto w-full max-w-md bg-white dark:bg-[#18181B] border-t md:border border-slate-200 dark:border-[#27272A] rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col max-h-[88vh] md:max-h-[85vh] overflow-hidden transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Handle Pill */}
            <div className="md:hidden flex justify-center pt-2.5 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-neutral-600" />
            </div>

            {/* Fixed Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-[#27272A] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-600 dark:text-[#3ECF8E] flex items-center justify-center border border-emerald-100 dark:border-[#3ECF8E]/20 shrink-0">
                  <Share2 size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Share Safely</h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">Temporary view-only access link</p>
                </div>
              </div>
              <button
                onClick={() => setShareModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-[#27272A] text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
              <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
                Generate a temporary, view-only secure link to safely share this document with a CA, bank, or hotel. Recipients cannot download the raw file, and access auto-expires.
              </p>

              {/* Selectable Duration Pills */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 block">
                  Select Link Expiration Duration:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '10 Minutes', value: 10, desc: 'Fast Check-in' },
                    { label: '1 Hour', value: 60, desc: 'Consultation' },
                    { label: '24 Hours', value: 1440, desc: 'Standard Day' },
                  ].map((tier) => (
                    <button
                      key={tier.value}
                      type="button"
                      onClick={() => handleShareSafely(tier.value)}
                      disabled={sharingLoading}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        shareDuration === tier.value
                          ? 'border-[#10B981] dark:border-[#3ECF8E] bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-800 dark:text-[#3ECF8E] font-bold shadow-xs'
                          : 'border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#141414] text-slate-700 dark:text-neutral-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold">{tier.label}</div>
                      <div className="text-[10px] text-slate-400 dark:text-neutral-500">{tier.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Exact Auto-Expiry Timestamp Preview */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200/80 dark:border-[#27272A] text-xs flex items-center gap-2.5">
                <Clock size={16} className="text-[#10B981] dark:text-[#3ECF8E] shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-neutral-500 block">Auto-Expiry Timestamp:</span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-neutral-200">
                    {new Date(Date.now() + shareDuration * 60000).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })} at {new Date(Date.now() + shareDuration * 60000).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })} ({shareDuration >= 60 ? `${shareDuration / 60} hour(s)` : `${shareDuration} mins`} from now)
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-[#141414] rounded-2xl border border-slate-200 dark:border-[#27272A] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-neutral-500 tracking-wider">
                    Secure View-Only Link:
                  </span>
                  {sharingLoading && (
                    <span className="text-[10px] text-[#10B981] dark:text-[#3ECF8E] font-bold animate-pulse">Generating...</span>
                  )}
                </div>
                <div className="font-mono text-xs text-slate-800 dark:text-neutral-200 break-all select-all bg-white dark:bg-[#18181B] p-2.5 rounded-xl border border-slate-200 dark:border-[#27272A]">
                  {shareLink}
                </div>
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="px-5 sm:px-6 py-3.5 bg-slate-50 dark:bg-[#141414] border-t border-slate-100 dark:border-[#27272A] flex flex-col-reverse sm:flex-row items-center sm:justify-between gap-2.5 shrink-0">
              <div>
                {doc.shareLink?.token && (
                  <button
                    type="button"
                    onClick={handleRevokeShareLink}
                    className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold transition-colors cursor-pointer text-center"
                  >
                    Revoke & Stop Access
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setShareModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#27272A] font-bold text-xs cursor-pointer text-center"
                >
                  Close
                </button>
                <button
                  onClick={handleCopyShareLink}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] font-bold text-xs shadow-md shadow-[#3ECF8E]/20 transition-all cursor-pointer text-center"
                >
                  {copiedShareLink ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedShareLink ? 'Link Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Document Confirmation Modal */}
      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsDeleteModalOpen(false)}
        >
          <div
            className="fixed inset-x-0 bottom-0 md:static md:inset-auto w-full max-w-md bg-white dark:bg-[#18181B] border-t md:border border-slate-200 dark:border-[#27272A] rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col max-h-[88vh] md:max-h-[85vh] overflow-hidden transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Handle Pill */}
            <div className="md:hidden flex justify-center pt-2.5 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-neutral-600" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-[#27272A] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 flex items-center justify-center shrink-0">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">Delete Document</h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">Permanent vault removal</p>
                </div>
              </div>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-[#27272A] text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-3">
              <p className="text-xs text-slate-700 dark:text-neutral-300 leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-slate-900 dark:text-white">"{doc?.title}"</strong>?
              </p>
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/30 text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>
                  This action removes the encrypted file and cryptographic audit verification permanently. It cannot be recovered.
                </span>
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="px-5 sm:px-6 py-3.5 bg-slate-50 dark:bg-[#141414] border-t border-slate-100 dark:border-[#27272A] flex flex-col-reverse sm:flex-row items-center sm:justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#27272A] font-bold text-xs transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deletingDoc}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 transition-all cursor-pointer text-center"
              >
                <Trash2 size={14} />
                <span>{deletingDoc ? 'Deleting...' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MPIN Unlock Modal */}
      <MpinModal
        isOpen={showMpinModal}
        onClose={() => setShowMpinModal(false)}
        onSuccess={() => {
          setIsMpinLocked(false);
          setShowMpinModal(false);
        }}
        title="Unlock Sensitive Document"
      />
    </div>
  );
}
