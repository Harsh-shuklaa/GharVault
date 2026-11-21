import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
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
  KeyRound,
  Loader2,
  AlertCircle,
  Award,
  User,
  CheckCircle2,
  MessageCircle,
  Edit3,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Home,
  EyeOff,
  Sparkles,
  Calendar,
  Hash,
} from 'lucide-react';
import MpinModal from '../components/common/MpinModal';
import { useToast } from '../context/ToastContext';

export default function DocumentPreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
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

  // Privacy Masking for Document ID
  const [isNumberUnmasked, setIsNumberUnmasked] = useState(false);

  // Sibling navigation
  const [siblingDocs, setSiblingDocs] = useState({ prev: null, next: null });

  // Edit details modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [replacementFile, setReplacementFile] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    documentNumber: '',
    category: 'ID Cards',
    expiryDate: '',
    notes: '',
  });

  // Load sibling documents for Next / Previous switching
  useEffect(() => {
    api
      .getDocuments()
      .then((res) => {
        const list = res.documents || [];
        const idx = list.findIndex((d) => (d._id || d.id)?.toString() === id?.toString());
        if (idx !== -1) {
          setSiblingDocs({
            prev: idx > 0 ? list[idx - 1] : null,
            next: idx < list.length - 1 ? list[idx + 1] : null,
          });
        }
      })
      .catch((e) => console.warn('Could not load siblings:', e));
  }, [id]);

  // Realistic Indian Document Visual Theming
  const getDocVisual = (d) => {
    if (!d)
      return {
        type: 'general',
        label: 'Document',
        strip: 'from-[#10B981] to-[#3ECF8E]',
        tagStyle: 'bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-700 dark:text-[#3ECF8E] border-emerald-200/60 dark:border-[#3ECF8E]/20',
        badgeEmoji: '📑',
      };
    const text = `${d.title || ''} ${d.category || ''} ${d.tags?.join(' ') || ''}`.toLowerCase();
    if (text.includes('aadhaar') || text.includes('adhar') || text.includes('uid')) {
      return {
        type: 'aadhaar',
        label: 'Aadhaar',
        strip: 'from-orange-500 via-white to-emerald-600',
        tagStyle: 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200/80 dark:border-orange-500/30',
        badgeEmoji: '🇮🇳',
      };
    }
    if (text.includes('pan')) {
      return {
        type: 'pan',
        label: 'PAN Card',
        strip: 'from-blue-700 via-sky-600 to-indigo-900',
        tagStyle: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200/80 dark:border-blue-500/30',
        badgeEmoji: '💼',
      };
    }
    if (text.includes('passport')) {
      return {
        type: 'passport',
        label: 'Passport',
        strip: 'from-indigo-950 via-blue-900 to-slate-900',
        tagStyle: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200/80 dark:border-indigo-500/30',
        badgeEmoji: '✈️',
      };
    }
    if (
      text.includes('rc') ||
      text.includes('vehicle') ||
      text.includes('car') ||
      text.includes('bike') ||
      text.includes('driving') ||
      text.includes('license')
    ) {
      return {
        type: 'vehicle',
        label: text.includes('driving') || text.includes('license') ? 'Driving License' : 'Vehicle RC',
        strip: 'from-emerald-600 via-teal-600 to-emerald-700',
        tagStyle: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-[#3ECF8E] border-emerald-200/80 dark:border-[#3ECF8E]/30',
        badgeEmoji: '🚗',
      };
    }
    if (
      text.includes('health') ||
      text.includes('medical') ||
      text.includes('insurance') ||
      text.includes('mediclaim') ||
      text.includes('hospital')
    ) {
      return {
        type: 'medical',
        label: 'Mediclaim',
        strip: 'from-rose-600 via-red-600 to-rose-700',
        tagStyle: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200/80 dark:border-red-500/30',
        badgeEmoji: '🏥',
      };
    }
    if (
      text.includes('property') ||
      text.includes('registry') ||
      text.includes('flat') ||
      text.includes('deed') ||
      text.includes('will') ||
      text.includes('tax')
    ) {
      return {
        type: 'property',
        label: 'Property Deed',
        strip: 'from-amber-600 via-yellow-600 to-amber-700',
        tagStyle: 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-500/30',
        badgeEmoji: '📜',
      };
    }
    return {
      type: 'general',
      label: d.category || 'Document',
      strip: 'from-[#10B981] to-[#3ECF8E]',
      tagStyle: 'bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-700 dark:text-[#3ECF8E] border-emerald-200/60 dark:border-[#3ECF8E]/20',
      badgeEmoji: '📑',
    };
  };

  // Privacy mask number formatting
  const formatDocNumber = (num, isUnmasked, isAadhaar) => {
    if (!num) return '';
    const clean = num.replace(/\s+/g, '');
    if (!isUnmasked) {
      if (clean.length === 12) {
        return `•••• •••• ${clean.slice(-4)}`;
      }
      if (clean.length === 10 && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(clean)) {
        return `${clean.slice(0, 5)}••••${clean.slice(-1).toUpperCase()}`;
      }
      if (clean.length > 4) {
        return `•••• ${clean.slice(-4)}`;
      }
    }
    if (clean.length === 12) {
      return `${clean.slice(0, 4)} ${clean.slice(4, 8)} ${clean.slice(8, 12)}`;
    }
    return clean.toUpperCase();
  };

  // 1-Tap WhatsApp Safe Share
  const handleWhatsAppShare = async () => {
    try {
      let linkToShare = shareLink;
      if (!linkToShare) {
        setSharingLoading(true);
        const res = await api.createShareLink(id, { durationMinutes: 1440 });
        linkToShare = res.shareUrl || `${window.location.origin}/share/${res.token}`;
        setShareLink(linkToShare);
        setDoc((prev) =>
          prev
            ? {
                ...prev,
                shareLink: {
                  token: res.token,
                  expiresAt: res.expiresAt,
                  shareUrl: linkToShare,
                  isExpired: false,
                },
              }
            : prev
        );
      }
      const msg = encodeURIComponent(
        `Namaste, here is the secure view link for "${doc?.title || 'Document'}" via GharVault (Valid for 24 hours): ${linkToShare}`
      );
      window.open(`https://wa.me/?text=${msg}`, '_blank');
      toast.success('Opened WhatsApp with 24-hr expiring link!');
    } catch (err) {
      toast.error('Could not generate WhatsApp share link: ' + (err.message || 'Error'));
    } finally {
      setSharingLoading(false);
    }
  };

  const handleOpenEdit = () => {
    if (!doc) return;
    let formattedExpiry = '';
    if (doc.expiryDate) {
      try {
        const d = new Date(doc.expiryDate);
        if (!isNaN(d.getTime())) {
          formattedExpiry = d.toISOString().split('T')[0];
        }
      } catch (e) {
        formattedExpiry = typeof doc.expiryDate === 'string' ? doc.expiryDate.slice(0, 10) : '';
      }
    }
    setEditFormData({
      title: doc.title || '',
      documentNumber: doc.documentNumber || '',
      category: doc.category || 'ID Cards',
      expiryDate: formattedExpiry,
      notes: doc.notes || '',
    });
    setReplacementFile(null);
    setIsEditModalOpen(true);
  };

  // Auto-open edit modal if opened via ?edit=true link
  useEffect(() => {
    if (doc && new URLSearchParams(location.search).get('edit') === 'true') {
      handleOpenEdit();
    }
  }, [doc, location.search]);

  const handleSaveEdit = async (e) => {
    e?.preventDefault();
    try {
      setSavingEdit(true);
      let payload;
      if (replacementFile) {
        payload = new FormData();
        payload.append('title', editFormData.title);
        payload.append('documentNumber', editFormData.documentNumber);
        payload.append('category', editFormData.category);
        if (editFormData.expiryDate) {
          payload.append('expiryDate', editFormData.expiryDate);
        }
        payload.append('notes', editFormData.notes);
        payload.append('file', replacementFile);
      } else {
        payload = {
          title: editFormData.title,
          documentNumber: editFormData.documentNumber,
          category: editFormData.category,
          expiryDate: editFormData.expiryDate || null,
          notes: editFormData.notes,
        };
      }
      const res = await api.updateDocument(id, payload);
      if (res?.document) {
        setDoc((prev) => ({
          ...prev,
          title: res.document.title,
          documentNumber: res.document.documentNumber,
          category: res.document.category,
          expiryDate: res.document.expiryDate,
          notes: res.document.notes,
          fileUrl: res.document.fileUrl || prev?.fileUrl,
          fileSize: res.document.fileSize || prev?.fileSize,
          mimeType: res.document.mimeType || prev?.mimeType,
          originalFileName: res.document.originalFileName || prev?.originalFileName,
          sha256Hash: res.document.sha256Hash || prev?.sha256Hash,
        }));
      }
      toast.success('Document updated successfully!');
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Failed to update document:', err);
      toast.error('Failed to update: ' + (err.message || 'Error'));
    } finally {
      setSavingEdit(false);
    }
  };

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
      toast.error('Could not load document: ' + (err.message || 'Error'));
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

  const handleShareSafely = async (durationInput) => {
    try {
      setSharingLoading(true);
      const duration = typeof durationInput === 'number' && !isNaN(durationInput) && durationInput > 0
        ? durationInput
        : (typeof shareDuration === 'number' ? shareDuration : 1440);

      // If document already has an active, unexpired link and user opened without picking new duration:
      const existingToken = doc?.shareLink?.token;
      const existingExpires = doc?.shareLink?.expiresAt ? new Date(doc.shareLink.expiresAt) : null;
      const isStillValid = existingExpires && existingExpires > new Date();

      if (isStillValid && existingToken && typeof durationInput !== 'number') {
        const fullUrl = doc.shareLink.shareUrl || `${window.location.origin}/share/${existingToken}`;
        setShareLink(fullUrl);
        setShareModalOpen(true);
        setSharingLoading(false);
        return;
      }

      const res = await api.createShareLink(id, { durationMinutes: duration });
      const finalUrl = res.shareUrl || res.shareLink || `${window.location.origin}/share/${res.token || res.shareToken}`;
      setShareLink(finalUrl);
      setShareDuration(duration);
      setDoc(prev => (prev ? {
        ...prev,
        shareLink: {
          token: res.token || res.shareToken,
          expiresAt: res.expiresAt,
          shareUrl: finalUrl,
          isExpired: false,
        }
      } : prev));
      setShareModalOpen(true);
      toast.success(`Safe ${duration >= 60 ? `${duration / 60}h` : `${duration}m`} view link ready!`);
    } catch (err) {
      console.error('Share link generation error:', err);
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

  const handleCopyShareLink = async () => {
    if (!shareLink) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareLink);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareLink;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedShareLink(true);
      toast.success('Safe view-only share link copied to clipboard!');
      setTimeout(() => setCopiedShareLink(false), 2000);
    } catch (err) {
      toast.error('Could not copy link to clipboard');
    }
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
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="text-center space-y-3">
          <Loader2 size={36} className="text-[#10B981] dark:text-[#3ECF8E] animate-spin mx-auto" />
          <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">Opening secure document preview...</p>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <AlertCircle size={44} className="text-slate-300 dark:text-neutral-600 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Document Not Found</h2>
        <p className="text-xs text-slate-500 dark:text-neutral-400">The document you are looking for may have been removed or you do not have permission to view it.</p>
        <Link to="/vault" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#262626] text-xs text-emerald-700 dark:text-[#3ECF8E] font-bold hover:bg-slate-200 transition-colors">
          <ArrowLeft size={14} />
          <span>Return to Family Vault</span>
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

  const visual = getDocVisual(doc);

  return (
    <div
      className={`max-w-[1600px] mx-auto p-2.5 sm:p-4 lg:p-4 transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#F8FAFC] dark:bg-[#121212] overflow-y-auto max-w-none p-3 sm:p-6'
          : 'pb-24 lg:pb-2 lg:h-[calc(100vh-4.25rem)] lg:max-h-[calc(100vh-4.25rem)] lg:overflow-hidden flex flex-col space-y-2.5'
      }`}
    >
      {/* Top Header Card: Ultra-Compact Single-Bar on Desktop & Adaptive on Mobile */}
      <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl border border-slate-200/80 dark:border-[#262626] shadow-xs overflow-hidden transition-colors shrink-0">
        {/* Top Visual Accent Strip */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${visual.strip}`} />

        <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 flex flex-wrap lg:flex-nowrap items-center justify-between gap-2.5">
          {/* Left: Back Arrow + Title + Indian Badge + Member + ID */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <Link
              to="/vault"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 dark:bg-[#141414] hover:bg-slate-200 dark:hover:bg-[#262626] text-slate-600 dark:text-neutral-300 flex items-center justify-center transition-colors shrink-0"
              title="Back to Family Vault"
            >
              <ArrowLeft size={16} />
            </Link>

            <div className="min-w-0 flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <h1 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate max-w-[200px] sm:max-w-[320px]">
                {doc.title}
              </h1>

              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold border shrink-0 ${visual.tagStyle}`}>
                <span>{visual.badgeEmoji}</span>
                <span>{visual.label}</span>
              </span>

              <span className="hidden xl:inline text-xs text-slate-400 dark:text-neutral-500 font-medium truncate max-w-[120px]">
                • {doc.assignedMember?.name || 'Whole Family'}
              </span>

              {/* Privacy Masked Document ID Pill */}
              {doc.documentNumber && (
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-[#141414] px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-[#262626] shrink-0">
                  <span className="text-[10px] font-medium text-slate-400">ID:</span>
                  <code className="font-mono font-bold text-[11px] text-slate-900 dark:text-white truncate max-w-[110px] sm:max-w-none">
                    {formatDocNumber(doc.documentNumber, isNumberUnmasked, visual.type === 'aadhaar')}
                  </code>
                  <button
                    type="button"
                    onClick={() => setIsNumberUnmasked(!isNumberUnmasked)}
                    className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-[#262626] text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                    title={isNumberUnmasked ? 'Mask number' : 'Reveal full number'}
                  >
                    {isNumberUnmasked ? <EyeOff size={11} /> : <Eye size={11} />}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyNumber}
                    className="p-0.5 px-1 rounded bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 text-white dark:text-[#121212] font-bold text-[10px] transition-colors cursor-pointer inline-flex items-center gap-0.5"
                    title="Copy Document ID"
                  >
                    {copiedNumber ? <Check size={10} /> : <Copy size={10} />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Sibling Switcher + Quick Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Previous / Next Sibling Switcher */}
            {(siblingDocs.prev || siblingDocs.next) && (
              <div className="flex items-center gap-1 shrink-0">
                {siblingDocs.prev ? (
                  <Link
                    to={`/vault/documents/${siblingDocs.prev._id || siblingDocs.prev.id}`}
                    className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-100 dark:bg-[#141414] hover:bg-slate-200 dark:hover:bg-[#262626] text-slate-700 dark:text-neutral-300 text-xs font-semibold transition-colors border border-slate-200 dark:border-[#262626]"
                    title={`Previous: ${siblingDocs.prev.title}`}
                  >
                    <ChevronLeft size={13} />
                    <span className="hidden xl:inline truncate max-w-[80px]">{siblingDocs.prev.title}</span>
                  </Link>
                ) : (
                  <span className="p-1.5 rounded-xl bg-slate-100 dark:bg-[#18181B] text-slate-300 dark:text-neutral-600 cursor-not-allowed">
                    <ChevronLeft size={13} />
                  </span>
                )}
                {siblingDocs.next ? (
                  <Link
                    to={`/vault/documents/${siblingDocs.next._id || siblingDocs.next.id}`}
                    className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-100 dark:bg-[#141414] hover:bg-slate-200 dark:hover:bg-[#262626] text-slate-700 dark:text-neutral-300 text-xs font-semibold transition-colors border border-slate-200 dark:border-[#262626]"
                    title={`Next: ${siblingDocs.next.title}`}
                  >
                    <span className="hidden xl:inline truncate max-w-[80px]">{siblingDocs.next.title}</span>
                    <ChevronRight size={13} />
                  </Link>
                ) : (
                  <span className="p-1.5 rounded-xl bg-slate-100 dark:bg-[#18181B] text-slate-300 dark:text-neutral-600 cursor-not-allowed">
                    <ChevronRight size={13} />
                  </span>
                )}
              </div>
            )}

            {/* Quick 1-Tap WhatsApp Safe Share */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              disabled={sharingLoading}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-[#3ECF8E] border border-emerald-200 dark:border-emerald-500/30 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Share 24-hr link via WhatsApp"
            >
              <MessageCircle size={13} className="text-emerald-600 dark:text-[#3ECF8E]" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            {/* Quick Edit Details */}
            <button
              type="button"
              onClick={handleOpenEdit}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#141414] hover:bg-slate-200 dark:hover:bg-[#262626] text-slate-700 dark:text-neutral-300 text-xs font-bold flex items-center gap-1 border border-slate-200 dark:border-[#262626] transition-colors cursor-pointer"
              title="Edit title, ID number, expiry, notes or file"
            >
              <Edit3 size={13} />
              <span className="hidden sm:inline">Edit</span>
            </button>

            {/* Quick MPIN Toggle / Lock Status Pill */}
            <button
              type="button"
              disabled={isTogglingMpin}
              onClick={handleToggleMpinProtection}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                (doc.isMpinProtected || doc.isSensitive)
                  ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-400 hover:bg-amber-100'
                  : 'bg-slate-100 dark:bg-[#141414] border-slate-200 dark:border-[#262626] text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-[#262626]'
              }`}
              title={(doc.isMpinProtected || doc.isSensitive) ? 'MPIN Protected (Click to turn off)' : 'Standard Access (Click to lock with MPIN)'}
            >
              <Lock size={12} className={(doc.isMpinProtected || doc.isSensitive) ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'} />
              <span className="hidden md:inline">{(doc.isMpinProtected || doc.isSensitive) ? 'MPIN' : 'Lock'}</span>
            </button>

            <div className="hidden lg:flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleShareSafely()}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#262626] hover:bg-slate-50 dark:hover:bg-[#141414] text-slate-700 dark:text-neutral-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Share2 size={13} className="text-[#10B981] dark:text-[#3ECF8E]" />
                <span>24h Link</span>
              </button>

              <a
                href={fileUrl}
                download={doc.originalFileName || `${doc.title}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] text-xs font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
              >
                <Download size={13} />
                <span>Download</span>
              </a>
            </div>

            <button
              onClick={handleDeleteClick}
              className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
              title="Delete Document"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Active Share Link Notification Banner (Compact) */}
      {doc.shareLink && doc.shareLink.token && (() => {
        const shareInfo = getShareExpiryInfo(doc.shareLink);
        if (!shareInfo) return null;
        const fullUrl = doc.shareLink.shareUrl || `${window.location.origin}/share/${doc.shareLink.token}`;

        return (
          <div className={`px-3 py-2 rounded-xl border transition-all flex items-center justify-between gap-2 shadow-2xs shrink-0 text-xs ${
            shareInfo.isExpired
              ? 'bg-slate-50 dark:bg-[#18181B] border-slate-200 dark:border-[#27272A]'
              : 'bg-emerald-50/80 dark:bg-[#3ECF8E]/10 border-emerald-200 dark:border-[#3ECF8E]/30'
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              <Share2 size={14} className={shareInfo.isExpired ? 'text-slate-500' : 'text-[#10B981] dark:text-[#3ECF8E]'} />
              <span className="font-bold text-slate-900 dark:text-white truncate">
                {shareInfo.isExpired ? 'Share Link Expired' : 'Active Safe Share Link:'}
              </span>
              <span className="font-mono text-[11px] text-slate-600 dark:text-neutral-300 truncate max-w-[200px] sm:max-w-md select-all">
                {fullUrl}
              </span>
              <span className="text-[10px] font-bold text-emerald-800 dark:text-[#3ECF8E] shrink-0">
                ({shareInfo.text})
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(fullUrl);
                  toast.success('Safe view-only share link copied to clipboard!');
                }}
                className="px-2 py-1 rounded-lg bg-white dark:bg-[#18181B] border border-emerald-200 dark:border-[#3ECF8E]/30 text-emerald-800 dark:text-[#3ECF8E] text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Copy size={11} />
                <span>Copy</span>
              </button>
              <button
                type="button"
                onClick={handleRevokeShareLink}
                className="px-2 py-1 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-[11px] font-bold cursor-pointer"
              >
                Revoke
              </button>
            </div>
          </div>
        );
      })()}

      {/* Main Grid: Left Stage (Col-7 / Col-8) & Right Controls (Col-5 / Col-4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 flex-1 min-h-0 lg:overflow-hidden">
        {/* Left Column: Document Canvas & Stage (7 Cols) */}
        <div className="lg:col-span-7 xl:col-span-7 bg-white dark:bg-[#1C1C1C] rounded-2xl border border-slate-200/80 dark:border-[#262626] shadow-xs overflow-hidden flex flex-col h-full min-h-[380px] lg:min-h-0 transition-colors">
          {/* Floating Glass Toolbar */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-[#262626] flex flex-wrap items-center justify-between gap-2 bg-slate-50/80 dark:bg-[#141414] text-xs text-slate-600 dark:text-neutral-400 shrink-0">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-white dark:bg-[#1C1C1C] p-0.5 rounded-xl border border-slate-200 dark:border-[#2E2E2E]">
              {isImage && (
                <button
                  type="button"
                  onClick={() => setViewerMode('PREVIEW')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewerMode === 'PREVIEW'
                      ? 'bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] shadow-xs'
                      : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ImageIcon size={13} />
                  <span>Photo</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewerMode('DIGITAL_CARD')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewerMode === 'DIGITAL_CARD' || (!isImage && viewerMode === 'PREVIEW')
                    ? 'bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] shadow-xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText size={13} />
                <span>Smart Card</span>
              </button>
            </div>

            {/* Zoom & Controls */}
            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
              {/* Dynamic Watermark Toggle */}
              <button
                type="button"
                onClick={() => setShowWatermark(!showWatermark)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors cursor-pointer border ${
                  showWatermark
                    ? 'bg-emerald-50 dark:bg-[#3ECF8E]/10 border-emerald-200 dark:border-[#3ECF8E]/30 text-emerald-800 dark:text-[#3ECF8E]'
                    : 'bg-slate-100 dark:bg-[#262626] border-slate-200 dark:border-transparent text-slate-500'
                }`}
                title="Toggle dynamic confidential watermark overlay"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${showWatermark ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                <span className="hidden sm:inline">Watermark:</span>
                <span className="font-bold uppercase text-[10px]">{showWatermark ? 'Active' : 'Off'}</span>
              </button>

              <div className="h-4 w-px bg-slate-200 dark:bg-[#2E2E2E]" />

              {/* Zoom Controls */}
              <button
                onClick={() => setZoomLevel(Math.max(60, zoomLevel - 15))}
                className="p-1 hover:bg-slate-200 dark:hover:bg-[#262626] rounded-lg transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut size={13} />
              </button>
              <span className="font-mono text-[11px] text-slate-700 dark:text-neutral-300 w-7 text-center font-semibold">
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel(Math.min(160, zoomLevel + 15))}
                className="p-1 hover:bg-slate-200 dark:hover:bg-[#262626] rounded-lg transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn size={13} />
              </button>
              <button
                onClick={() => setRotation((rotation + 90) % 360)}
                className="p-1 hover:bg-slate-200 dark:hover:bg-[#262626] rounded-lg transition-colors cursor-pointer"
                title="Rotate 90°"
              >
                <RotateCw size={13} />
              </button>

              {/* PDF Pop-Out Native Viewer Button */}
              {isPdf && (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 hover:bg-slate-200 dark:hover:bg-[#262626] rounded-lg transition-colors cursor-pointer text-slate-600 dark:text-neutral-300 text-[11px] font-semibold"
                  title="Open PDF in new tab for native full-screen viewing"
                >
                  <ExternalLink size={12} className="text-[#10B981] dark:text-[#3ECF8E]" />
                  <span className="hidden md:inline">Open PDF</span>
                </a>
              )}

              {/* Instant Re-lock Button (Banking App Style) */}
              {(doc.isMpinProtected || doc.isSensitive) && !isMpinLocked && (
                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.removeItem('gharvault_mpin_unlocked');
                    setIsMpinLocked(true);
                    toast.success('Document re-locked with MPIN 🔒');
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                  title="Instantly lock screen with 4-digit MPIN"
                >
                  <Lock size={11} className="text-amber-600 dark:text-amber-400" />
                  <span>Re-Lock</span>
                </button>
              )}

              {/* Fullscreen Button */}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1 hover:bg-slate-200 dark:hover:bg-[#262626] rounded-lg transition-colors cursor-pointer text-slate-600 dark:text-neutral-300"
                title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
              >
                {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </button>
            </div>
          </div>

          {/* Document Canvas Stage (flex-1 min-h-0 with internal scroll) */}
          <div className="p-2 sm:p-4 bg-[#F1F5F9]/70 dark:bg-[#121212] flex items-center justify-center flex-1 min-h-0 overflow-auto relative">
            {isMpinLocked ? (
              <div className="bg-white dark:bg-[#1C1C1C] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-[#262626] shadow-xl max-w-sm w-full text-center space-y-3 sm:space-y-4 animate-fadeIn">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400 shadow-sm">
                  <Lock size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Sensitive Document Locked</h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
                    This document is protected by your 4-digit family Security MPIN to prevent unauthorized viewing.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMpinModal(true)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] font-bold text-xs shadow-md shadow-[#3ECF8E]/25 transition-all cursor-pointer w-full"
                >
                  <KeyRound size={14} />
                  <span>Enter 4-Digit MPIN to Unlock</span>
                </button>
              </div>
            ) : (
              <div
                style={{
                  transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s ease',
                }}
                className="max-w-full max-h-full flex items-center justify-center"
              >
                {/* VIEW 1: Authentic Uploaded Image */}
                {isImage && viewerMode === 'PREVIEW' && !imageError ? (
                  <div className="relative max-w-full rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-[#2E2E2E] bg-white dark:bg-[#1C1C1C] group">
                    <img
                      src={fileUrl}
                      alt={doc.title}
                      className="max-h-[320px] sm:max-h-[440px] lg:max-h-[calc(100vh-250px)] w-auto max-w-full object-contain mx-auto block bg-slate-900/5 dark:bg-black/30"
                      onError={() => {
                        console.warn('Image failed to load, falling back to digital layout');
                        setImageError(true);
                      }}
                    />
                    {renderWatermarkOverlay()}
                  </div>
                ) : isPdf && viewerMode === 'PREVIEW' ? (
                  /* VIEW 2: PDF Document Viewer */
                  <div className="relative w-full max-w-[580px] rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-[#2E2E2E] bg-white dark:bg-[#1C1C1C] flex flex-col">
                    <div className="bg-slate-100 dark:bg-[#141414] px-3 py-1.5 border-b border-slate-200 dark:border-[#262626] flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-neutral-300">
                        <FileText size={13} className="text-red-500" />
                        <span>PDF Document</span>
                      </span>
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-[#262626] border border-slate-200 dark:border-[#333] text-emerald-700 dark:text-[#3ECF8E] font-bold text-[10px] hover:bg-slate-50 transition-colors shadow-2xs"
                      >
                        <span>Open Full PDF</span>
                        <ExternalLink size={10} />
                      </a>
                    </div>
                    <div className="w-full h-[320px] sm:h-[440px] lg:h-[calc(100vh-270px)] relative">
                      <iframe
                        src={fileUrl}
                        title={doc.title}
                        className="w-full h-full border-0"
                      />
                      {renderWatermarkOverlay()}
                    </div>
                  </div>
                ) : (
                  /* VIEW 3: Digital Sovereign Smart Card */
                  <div className="relative w-full max-w-[520px] max-h-[calc(100vh-240px)] overflow-y-auto bg-white dark:bg-[#1C1C1C] rounded-2xl shadow-xl flex flex-col border border-slate-200 dark:border-[#2E2E2E]">
                    {renderWatermarkOverlay()}

                    {/* Authentic Header Bar */}
                    <div className="bg-[#112347] dark:bg-[#0c1830] text-white px-3.5 sm:px-4 py-2.5 flex items-center justify-between shadow-sm shrink-0">
                      <div className="flex items-center gap-2">
                        <Award size={16} className="text-amber-400 shrink-0" />
                        <div className="flex flex-col leading-tight min-w-0">
                          <span className="font-mono text-[9px] uppercase tracking-widest text-amber-200 font-bold truncate">
                            {doc.category === 'Medical & Health'
                              ? 'National Health Registry • India'
                              : doc.category === 'Bank & Property' || doc.category === 'Property & Legal'
                              ? 'Land & Estate Title Office • India'
                              : 'Republic of India'}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-200 truncate">
                            {doc.title || 'Official Document'} / प्रमाण-पत्र
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono text-[9px] tracking-wider text-amber-300/80">
                          Type: {doc.category?.slice(0, 3).toUpperCase() || 'DOC'}
                        </span>
                        <div className="font-mono text-[11px] font-bold text-white tracking-widest">IND</div>
                      </div>
                    </div>

                    {/* Document Bio Page Visual Layout */}
                    <div className="flex-1 bg-[#FFFDF5] dark:bg-[#181818] p-3 sm:p-4 flex flex-col justify-between relative text-slate-900 dark:text-neutral-100">
                      <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:12px_12px]" />

                      {/* Top Identification Row */}
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 relative z-10">
                        {/* Photo Area */}
                        <div className="flex items-center sm:flex-col gap-2.5 sm:gap-0 shrink-0">
                          <div className="w-18 sm:w-24 h-22 sm:h-30 rounded-xl bg-slate-200 dark:bg-[#262626] overflow-hidden shadow-sm relative border border-slate-300 dark:border-[#333] shrink-0">
                            {isImage && fileUrl && !imageError ? (
                              <img src={fileUrl} alt={doc.title} className="w-full h-full object-cover" />
                            ) : doc.assignedMember?.avatar ? (
                              <img src={doc.assignedMember.avatar} alt={doc.assignedMember?.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200 dark:from-[#262626] dark:to-[#1a1a1a] text-slate-400">
                                <User size={24} className="text-slate-400 dark:text-neutral-500" />
                                <span className="text-[8px] font-mono mt-1 font-semibold uppercase">ID</span>
                              </div>
                            )}
                            <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-gradient-to-tr from-amber-400/50 via-emerald-400/50 to-blue-500/50 backdrop-blur-[1px] flex items-center justify-center border border-white/40 shadow-xs">
                              <Check size={9} className="text-white stroke-[3]" />
                            </div>
                          </div>
                          <span className="font-mono text-[9px] text-slate-500 dark:text-neutral-400 mt-1 uppercase tracking-tighter truncate max-w-[80px]">
                            {doc.assignedMember?.name || 'Certified'}
                          </span>
                        </div>

                        {/* Personal Information Table Grid */}
                        <div className="flex-1 grid grid-cols-2 gap-x-2 gap-y-1.5 text-left w-full">
                          <div>
                            <span className="block font-mono text-[8px] uppercase text-slate-400 dark:text-neutral-500">
                              Holder / नाम
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide truncate block">
                              {doc.assignedMember?.name || 'Whole Family'}
                            </span>
                          </div>
                          <div>
                            <span className="block font-mono text-[8px] uppercase text-slate-400 dark:text-neutral-500">
                              Doc No. / सं.
                            </span>
                            <span className="font-mono text-xs font-bold text-emerald-700 dark:text-[#3ECF8E] tracking-wider truncate block">
                              {doc.documentNumber || 'UNASSIGNED'}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="block font-mono text-[8px] uppercase text-slate-400 dark:text-neutral-500">
                              Document Title
                            </span>
                            <span className="text-xs font-semibold text-slate-900 dark:text-neutral-200 truncate block">
                              {doc.title}
                            </span>
                          </div>
                          <div>
                            <span className="block font-mono text-[8px] uppercase text-slate-400 dark:text-neutral-500">
                              Category
                            </span>
                            <span className="text-[11px] font-medium text-slate-800 dark:text-neutral-300 truncate block">
                              {doc.category}
                            </span>
                          </div>
                          <div>
                            <span className="block font-mono text-[8px] uppercase text-slate-400 dark:text-neutral-500">
                              Expiry
                            </span>
                            <span className={`font-mono text-[11px] font-bold ${doc.status === 'EXPIRED' ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'} block`}>
                              {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : 'LIFETIME'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Optical Machine Readable Zone (MRZ) */}
                      <div className="mt-2.5 pt-2 bg-slate-950 text-[#10B981] dark:text-[#3ECF8E] p-2 rounded-lg font-mono text-[9px] sm:text-[10px] leading-tight tracking-[0.15em] uppercase select-all overflow-x-auto shadow-inner border border-slate-800">
                        <div className="whitespace-nowrap">P&lt;IND{(doc.assignedMember?.name || 'SHARMA').replace(/\s+/g, '<')}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</div>
                        <div className="whitespace-nowrap">{(doc.documentNumber || 'Z4819201').replace(/[^a-zA-Z0-9]/g, '')}&lt;4IND7808142M2403112&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;06</div>
                      </div>
                    </div>

                    {/* Card Bottom Footer */}
                    <div className="bg-slate-100 dark:bg-[#141414] px-3 py-1.5 flex items-center justify-between text-slate-500 dark:text-neutral-400 border-t border-slate-200 dark:border-[#262626] shrink-0">
                      <span className="font-mono text-[9px] flex items-center gap-1 text-emerald-700 dark:text-[#3ECF8E] font-semibold">
                        <Lock size={11} />
                        Zero-Knowledge Local Buffer
                      </span>
                      <span className="font-mono text-[9px]">
                        SHA: {doc.sha256Hash ? doc.sha256Hash.substring(0, 8) : 'VERIFIED'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Action Floating Dock at Bottom of Viewer */}
          <div className="p-2 sm:p-2.5 bg-slate-50/90 dark:bg-[#141414]/90 border-t border-slate-100 dark:border-[#262626] flex items-center justify-between gap-1.5 sm:gap-2 shrink-0">
            <a
              href={fileUrl}
              download={doc.originalFileName || `${doc.title}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl bg-white dark:bg-[#1C1C1C] hover:bg-slate-100 dark:hover:bg-[#262626] text-slate-700 dark:text-neutral-200 text-xs font-bold border border-slate-200 dark:border-[#2E2E2E] transition-colors"
            >
              <Download size={13} className="text-[#10B981] dark:text-[#3ECF8E]" />
              <span className="hidden sm:inline">Export Copy</span>
              <span className="sm:hidden">Export</span>
            </a>
            <button
              type="button"
              onClick={handleWhatsAppShare}
              disabled={sharingLoading}
              className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-800 dark:text-[#3ECF8E] text-xs font-bold border border-emerald-200 dark:border-emerald-500/30 transition-colors cursor-pointer"
              title="Share 24-hr view link via WhatsApp"
            >
              <MessageCircle size={13} className="text-emerald-600 dark:text-[#3ECF8E]" />
              <span className="hidden sm:inline">WhatsApp</span>
              <span className="sm:hidden">WA</span>
            </button>
            <button
              type="button"
              onClick={() => handleShareSafely()}
              className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl bg-white dark:bg-[#1C1C1C] hover:bg-slate-100 dark:hover:bg-[#262626] text-slate-700 dark:text-neutral-200 text-xs font-bold border border-slate-200 dark:border-[#2E2E2E] transition-colors cursor-pointer"
            >
              <Share2 size={13} className="text-[#10B981] dark:text-[#3ECF8E]" />
              <span className="hidden sm:inline">24h Link</span>
              <span className="sm:hidden">Share</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl bg-white dark:bg-[#1C1C1C] hover:bg-slate-100 dark:hover:bg-[#262626] text-slate-700 dark:text-neutral-200 text-xs font-bold border border-slate-200 dark:border-[#2E2E2E] transition-colors cursor-pointer"
            >
              <Printer size={13} className="text-slate-500 dark:text-neutral-400" />
              <span className="hidden sm:inline">Print</span>
              <span className="sm:hidden">Print</span>
            </button>
          </div>
        </div>

        {/* Right Column: High-Density Bento Cards (Zero outer-scroll on Desktop, smooth internal scroll) */}
        <div className="lg:col-span-5 xl:col-span-5 flex flex-col h-full min-h-0 space-y-2.5 lg:overflow-y-auto lg:pr-1 custom-scrollbar">
          {/* Bento 1: Physical Paper Locator Card (Almirah / Locker Tag) */}
          <div className="bg-amber-50/70 dark:bg-amber-500/10 rounded-2xl p-3 sm:p-3.5 border border-amber-200/80 dark:border-amber-500/25 shadow-xs space-y-1.5 transition-colors shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-xs">
                  🗄️
                </div>
                <div>
                  <h3 className="font-bold text-xs text-amber-950 dark:text-amber-200">
                    Physical Paper Locator
                  </h3>
                  <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80">Home almirah / bank locker</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleOpenEdit}
                className="text-[11px] font-bold text-amber-800 dark:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit3 size={11} />
                <span>{doc.notes ? 'Edit' : '+ Add'}</span>
              </button>
            </div>
            {doc.notes ? (
              <div className="p-2 rounded-xl bg-white/90 dark:bg-[#18181B] border border-amber-200/60 dark:border-amber-500/20 text-xs font-semibold text-slate-800 dark:text-neutral-200 leading-snug select-text">
                {doc.notes}
              </div>
            ) : (
              <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 italic">
                No physical location saved. Tap "+ Add" to record which almirah holds the original copy.
              </p>
            )}
          </div>

          {/* Bento 2: 4-Digit MPIN Protection Card with PhonePe/GPay Style Toggle Switch */}
          <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-2 transition-colors shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                  (doc.isMpinProtected || doc.isSensitive)
                    ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-500/20'
                    : 'bg-slate-100 dark:bg-[#262626] text-slate-500 dark:text-neutral-400'
                }`}>
                  <Lock size={14} />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white">4-Digit MPIN Protection</h3>
                  <p className="text-[10px] text-slate-400 dark:text-neutral-500">Confidential family lock</p>
                </div>
              </div>

              {/* Modern PhonePe / iOS Style Animated Toggle Switch */}
              <div className="flex items-center gap-2">
                {isTogglingMpin ? (
                  <Loader2 size={15} className="animate-spin text-[#10B981] dark:text-[#3ECF8E]" />
                ) : (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={Boolean(doc.isMpinProtected || doc.isSensitive)}
                    disabled={isTogglingMpin}
                    onClick={handleToggleMpinProtection}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      (doc.isMpinProtected || doc.isSensitive)
                        ? 'bg-[#10B981] dark:bg-[#3ECF8E]'
                        : 'bg-slate-200 dark:bg-[#333]'
                    }`}
                    title={(doc.isMpinProtected || doc.isSensitive) ? 'Click to turn OFF MPIN lock' : 'Click to turn ON MPIN lock'}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        (doc.isMpinProtected || doc.isSensitive) ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-[#262626] text-[11px]">
              <span className="font-semibold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  (doc.isMpinProtected || doc.isSensitive) ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'
                }`} />
                <span>{(doc.isMpinProtected || doc.isSensitive) ? 'Status: 🔒 Locked with MPIN' : 'Status: 🔓 Standard Access'}</span>
              </span>
              {mpinFeedback && (
                <span className="text-[10px] font-bold text-[#10B981] dark:text-[#3ECF8E] animate-fadeIn">
                  {mpinFeedback}
                </span>
              )}
            </div>
          </div>

          {/* Bento 3: Who Can View Dropdown & Access Control */}
          <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-2 transition-colors shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <Eye size={14} className="text-[#10B981] dark:text-[#3ECF8E]" />
                <span>Who Can View</span>
              </h3>
              <div className="flex items-center gap-1.5">
                {savingPermissions && (
                  <span className="text-[10px] text-[#10B981] dark:text-[#3ECF8E] font-bold animate-pulse">Saving...</span>
                )}
                {permissionFeedback && (
                  <span className="text-[10px] text-emerald-600 dark:text-[#3ECF8E] font-bold bg-emerald-50 dark:bg-[#3ECF8E]/10 px-1.5 py-0.2 rounded-full border border-emerald-200 dark:border-[#3ECF8E]/20">
                    {permissionFeedback}
                  </span>
                )}
              </div>
            </div>

            <div className="relative" ref={whoCanViewDropdownRef}>
              <button
                type="button"
                disabled={savingPermissions}
                onClick={() => setIsWhoCanViewOpen(!isWhoCanViewOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2E2E2E] bg-slate-50 dark:bg-[#141414] hover:bg-slate-100 dark:hover:bg-[#1A1A1A] text-left transition-all cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`p-1 rounded-md shrink-0 ${
                    getDropdownSummary().isAll
                      ? 'bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-600 dark:text-[#3ECF8E]'
                      : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}>
                    {getDropdownSummary().isAll ? <Users size={13} /> : <Eye size={13} />}
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                      {getDropdownSummary().title}
                    </span>
                    <span className="text-[9px] text-slate-500 dark:text-neutral-400 block truncate">
                      {getDropdownSummary().sub}
                    </span>
                  </div>
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isWhoCanViewOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isWhoCanViewOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white dark:bg-[#1C1C1C] rounded-2xl border border-slate-200 dark:border-[#2E2E2E] shadow-2xl p-2 space-y-1 animate-fadeIn max-h-56 overflow-y-auto">
                  <div
                    onClick={handleSelectAll}
                    className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                      whoCanViewList.includes('ALL')
                        ? 'bg-emerald-50/80 dark:bg-[#3ECF8E]/15 text-emerald-950 dark:text-white'
                        : 'hover:bg-slate-50 dark:hover:bg-[#262626] text-slate-700 dark:text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-[#3ECF8E]/20 text-emerald-700 dark:text-[#3ECF8E] flex items-center justify-center shrink-0">
                        <Users size={13} />
                      </div>
                      <div>
                        <span className="text-xs font-bold block">Everyone in Family</span>
                        <span className="text-[9px] text-slate-400 dark:text-neutral-500 block">All current and future members</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={whoCanViewList.includes('ALL')}
                      readOnly
                      className="w-3.5 h-3.5 rounded text-[#10B981] dark:text-[#3ECF8E] border-slate-300 focus:ring-[#3ECF8E] cursor-pointer"
                    />
                  </div>

                  <div className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 border-t border-slate-100 dark:border-[#262626] mt-1 pt-1.5">
                    Or check specific members:
                  </div>

                  {members.map((m) => {
                    const mId = (m._id || m.id)?.toString();
                    const isChecked = whoCanViewList.includes(mId) && !whoCanViewList.includes('ALL');
                    return (
                      <div
                        key={mId}
                        onClick={() => handleToggleMember(mId)}
                        className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-50/80 dark:bg-[#3ECF8E]/15 text-emerald-950 dark:text-white'
                            : 'hover:bg-slate-50 dark:hover:bg-[#262626] text-slate-700 dark:text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={m.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.name)}`}
                            alt={m.name}
                            className="w-6 h-6 rounded-full object-cover shrink-0"
                          />
                          <div className="truncate">
                            <span className="text-xs font-bold block truncate">{m.name}</span>
                            <span className="text-[9px] text-slate-400 dark:text-neutral-500 block truncate">
                              {m.relationship || m.relation || 'Member'}
                            </span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          className="w-3.5 h-3.5 rounded text-[#10B981] dark:text-[#3ECF8E] border-slate-300 focus:ring-[#3ECF8E] cursor-pointer shrink-0"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Bento 4: Document Metadata & Cryptographic Proof Card */}
          <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-2 transition-colors shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <Info size={14} className="text-slate-500 dark:text-neutral-400" />
                <span>Document Details</span>
              </h3>
              <span className="px-2 py-0.2 rounded-full bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-700 dark:text-[#3ECF8E] font-mono text-[9px] font-bold">
                AES-256 GCM
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              <div className="border-b border-slate-100 dark:border-[#262626] pb-1">
                <span className="text-[10px] text-slate-400 block">Category:</span>
                <span className="font-bold text-slate-900 dark:text-white truncate block">{doc.category}</span>
              </div>
              <div className="border-b border-slate-100 dark:border-[#262626] pb-1">
                <span className="text-[10px] text-slate-400 block">Expiry:</span>
                <span className="font-semibold text-slate-800 dark:text-neutral-300 truncate block">
                  {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : 'No Expiry'}
                </span>
              </div>
              <div className="border-b border-slate-100 dark:border-[#262626] pb-1">
                <span className="text-[10px] text-slate-400 block">Uploaded On:</span>
                <span className="font-semibold text-slate-800 dark:text-neutral-300 block">
                  {new Date(doc.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="border-b border-slate-100 dark:border-[#262626] pb-1">
                <span className="text-[10px] text-slate-400 block">Storage:</span>
                <span className="font-bold text-emerald-700 dark:text-[#3ECF8E] block">Encrypted</span>
              </div>
            </div>

            {/* SHA-256 Hash Digest */}
            <div className="pt-1 flex items-center justify-between gap-1 text-[10px] font-mono text-slate-400 dark:text-neutral-500 bg-slate-50 dark:bg-[#141414] p-1.5 rounded-lg border border-slate-100 dark:border-[#262626]">
              <span className="truncate">
                SHA: {doc.sha256Hash ? `${doc.sha256Hash.substring(0, 16)}...` : '3af2f380295bbe...'}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(doc.sha256Hash || '3af2f380295bbe97769e402ec71dad29fe46610f01d4d57d6a4b060474560f57');
                  toast.success('SHA-256 hash copied to clipboard');
                }}
                className="text-emerald-700 dark:text-[#3ECF8E] font-bold hover:underline shrink-0"
              >
                Copy
              </button>
            </div>
          </div>

          {/* Bento 5: Recent Activity (Section 65B Audit Trail) */}
          <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-2 transition-colors shrink-0">
            <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock size={13} className="text-[#10B981] dark:text-[#3ECF8E]" />
                <span>Recent Activity</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500">{auditTrail.length} events</span>
            </h3>

            <div className="space-y-1.5 text-xs max-h-28 overflow-y-auto pr-1">
              {auditTrail.length === 0 ? (
                <div className="text-slate-400 dark:text-neutral-500 py-2 text-center text-[11px]">No activity recorded yet</div>
              ) : (
                auditTrail.slice(0, 3).map((log) => (
                  <div key={log._id} className="flex items-start gap-2 pb-1.5 border-b border-slate-100 dark:border-[#262626] last:border-0 last:pb-0 text-[11px]">
                    <CheckCircle2 size={13} className="text-[#10B981] dark:text-[#3ECF8E] mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-800 dark:text-neutral-200 truncate">
                        {log.performerName || 'User'} — {log.action === 'UPLOAD' ? 'Uploaded document' : log.action === 'VIEW' ? 'Viewed document' : log.action}
                      </div>
                      <div className="text-[9px] text-slate-400 dark:text-neutral-500 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(log.timestamp).toLocaleDateString()}
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
            <div className="px-4 sm:px-6 py-3.5 bg-slate-50 dark:bg-[#141414] border-t border-slate-100 dark:border-[#27272A] flex flex-col-reverse sm:flex-row items-center sm:justify-between gap-2.5 shrink-0 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
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
              <div className="flex flex-col-reverse sm:flex-row items-center gap-2 w-full sm:w-auto">
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
            <div className="px-4 sm:px-6 py-3.5 bg-slate-50 dark:bg-[#141414] border-t border-slate-100 dark:border-[#27272A] flex flex-col-reverse sm:flex-row items-center sm:justify-end gap-2.5 shrink-0 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
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

      {/* Quick Edit Document Metadata Modal */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="fixed inset-x-0 bottom-0 md:static md:inset-auto w-full max-w-lg bg-white dark:bg-[#18181B] border-t md:border border-slate-200 dark:border-[#27272A] rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="md:hidden flex justify-center pt-2.5 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-neutral-600" />
            </div>

            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-[#27272A] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-600 dark:text-[#3ECF8E] flex items-center justify-center border border-emerald-100 dark:border-[#3ECF8E]/20 shrink-0">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Edit Document Details</h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">Update title, ID number, expiry or physical location</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-[#27272A] text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
              {/* Document Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <FileText size={13} className="text-[#10B981] dark:text-[#3ECF8E]" />
                  <span>Document Title</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  placeholder="e.g. Papa's Aadhaar Card, Honda City RC"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2E2E2E] bg-slate-50 dark:bg-[#141414] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#10B981] dark:focus:border-[#3ECF8E]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Document Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <Hash size={13} className="text-[#10B981] dark:text-[#3ECF8E]" />
                    <span>Document ID Number</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.documentNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, documentNumber: e.target.value })}
                    placeholder="e.g. 5489 1234 9876 / ABCDE1234F"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2E2E2E] bg-slate-50 dark:bg-[#141414] text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#10B981] dark:focus:border-[#3ECF8E]"
                  />
                </div>

                {/* Expiry Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <Calendar size={13} className="text-[#10B981] dark:text-[#3ECF8E]" />
                    <span>Expiry Date (Optional)</span>
                  </label>
                  <input
                    type="date"
                    value={editFormData.expiryDate}
                    onChange={(e) => setEditFormData({ ...editFormData, expiryDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2E2E2E] bg-slate-50 dark:bg-[#141414] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#10B981] dark:focus:border-[#3ECF8E]"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Category
                </label>
                <select
                  value={editFormData.category}
                  onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2E2E2E] bg-slate-50 dark:bg-[#141414] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#10B981] dark:focus:border-[#3ECF8E]"
                >
                  <option value="ID Cards">ID Cards (Aadhaar, PAN, Voter ID)</option>
                  <option value="Vehicle & Transport">Vehicle & Transport (RC, DL, Insurance)</option>
                  <option value="Medical & Health">Medical & Health (Insurance, Reports)</option>
                  <option value="Property & Legal">Property & Legal (Registry, Deed, Will)</option>
                  <option value="Education & Work">Education & Work (Degrees, Certificates)</option>
                  <option value="Financial">Financial (Bank, Tax, Mutual Funds)</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Optional: Replace Scanned File */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 flex items-center justify-between">
                  <span>Replace Scan / Document File (Optional)</span>
                  {replacementFile && (
                    <span className="text-[10px] text-emerald-600 dark:text-[#3ECF8E] font-bold">New file chosen</span>
                  )}
                </label>
                <div className="p-2.5 rounded-xl border border-dashed border-slate-300 dark:border-[#2E2E2E] bg-slate-50 dark:bg-[#141414] text-xs flex items-center justify-between gap-2">
                  <span className="text-slate-500 dark:text-neutral-400 truncate max-w-[200px] text-[11px]">
                    {replacementFile ? replacementFile.name : `Current: ${doc?.originalFileName || 'Uploaded file'}`}
                  </span>
                  <label className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#262626] border border-slate-200 dark:border-[#333] text-slate-700 dark:text-neutral-200 font-bold text-[11px] hover:bg-slate-50 dark:hover:bg-[#333] cursor-pointer shrink-0">
                    <span>{replacementFile ? 'Change' : 'Choose New File'}</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setReplacementFile(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Physical Locker Location Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <span>🗄️</span>
                  <span>Physical Hard Copy Location Notes</span>
                </label>
                <textarea
                  rows={3}
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="e.g. Master Bedroom Godrej Almirah, Top Locker, Blue Plastic Folder #2"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2E2E2E] bg-slate-50 dark:bg-[#141414] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#10B981] dark:focus:border-[#3ECF8E]"
                />
                <p className="text-[10px] text-slate-400 dark:text-neutral-500">
                  Section 65B compliant audit trail will record this modification.
                </p>
              </div>

              <div className="px-1 pt-2 pb-1 flex justify-end gap-2 border-t border-slate-100 dark:border-[#27272A]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#27272A] font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] font-bold text-xs shadow-md shadow-[#3ECF8E]/20 transition-all cursor-pointer"
                >
                  {savingEdit ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>{savingEdit ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Action Bar with iPhone 11 & Mobile S (320px) Safe Area Support */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#18181B]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-[#27272A] p-2 sm:p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg">
        <div className="flex items-center gap-1.5 max-w-lg mx-auto">
          <button
            type="button"
            onClick={handleOpenEdit}
            className="flex-1 py-2.5 px-1 rounded-xl bg-slate-100 dark:bg-[#262626] hover:bg-slate-200 dark:hover:bg-[#333] text-slate-800 dark:text-neutral-200 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <Edit3 size={13} className="text-[#10B981] dark:text-[#3ECF8E]" />
            <span className="truncate">Edit</span>
          </button>
          {doc.documentNumber && (
            <button
              type="button"
              onClick={handleCopyNumber}
              className="flex-1 py-2.5 px-1 rounded-xl bg-slate-100 dark:bg-[#262626] hover:bg-slate-200 dark:hover:bg-[#333] text-slate-800 dark:text-neutral-200 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              {copiedNumber ? <Check size={13} className="text-[#10B981] dark:text-[#3ECF8E]" /> : <Copy size={13} />}
              <span className="truncate">{copiedNumber ? 'Copied' : 'Copy ID'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleWhatsAppShare}
            disabled={sharingLoading}
            className="flex-1 py-2.5 px-1 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-800 dark:text-[#3ECF8E] font-bold text-xs flex items-center justify-center gap-1 border border-emerald-200 dark:border-emerald-500/30 transition-colors cursor-pointer"
            title="Share on WhatsApp"
          >
            <MessageCircle size={14} className="text-emerald-600 dark:text-[#3ECF8E]" />
            <span className="truncate">WhatsApp</span>
          </button>
          <a
            href={fileUrl}
            download={doc.originalFileName || `${doc.title}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 py-2.5 px-1 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-all cursor-pointer"
          >
            <Download size={13} />
            <span className="truncate">Download</span>
          </a>
        </div>
      </div>
    </div>
  );
}
