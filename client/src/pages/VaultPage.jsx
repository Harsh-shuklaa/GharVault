import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import {
  Plus,
  Search,
  X,
  Table,
  Grid,
  Copy,
  Check,
  Share2,
  Trash2,
  Lock,
  AlertTriangle,
  CreditCard,
  HeartPulse,
  Landmark,
  GraduationCap,
  Scale,
  Folder,
  Layers,
  Users,
  Eye,
  EyeOff,
  Shield,
  Clock,
  Sparkles,
  FileText,
  Car,
  Home,
  Briefcase,
  Plane,
  Edit3,
  Camera,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import MpinModal from '../components/common/MpinModal';
import VaultPageSkeleton from '../components/common/VaultPageSkeleton';
import { useToast } from '../context/ToastContext';

export default function VaultPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const filterParam = searchParams.get('filter');
  const initialMember = searchParams.get('member') || 'All';

  const [documents, setDocuments] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || 'All');
  const [selectedMember, setSelectedMember] = useState(initialMember);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [copiedNumber, setCopiedNumber] = useState(null);
  const [shareFeedback, setShareFeedback] = useState(null);
  const [mpinTargetDocId, setMpinTargetDocId] = useState(null);
  const [docToDelete, setDocToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Lock body scroll when delete modal is open
  useEffect(() => {
    if (docToDelete) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [docToDelete]);

  // Smart Quick-Tabs state: 'all' | 'expiring' | 'confidential' | 'kyc' | 'vehicle' | 'property' | 'shared'
  const [quickTab, setQuickTab] = useState(() => {
    if (filterParam === 'expiring') return 'expiring';
    if (filterParam === 'shared') return 'shared';
    return 'all';
  });

  // Track unmasked document ID numbers (privacy-first default)
  const [unmaskedDocIds, setUnmaskedDocIds] = useState(new Set());

  const toggleMask = (docId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setUnmaskedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId);
      else next.add(docId);
      return next;
    });
  };

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

  // Realistic Indian Document Visual Theming (SafePaper High-Contrast Palettes)
  const getDocVisual = (doc) => {
    const text = `${doc.title || ''} ${doc.category || ''} ${doc.tags?.join(' ') || ''}`.toLowerCase();
    if (text.includes('aadhaar') || text.includes('adhar') || text.includes('uid')) {
      return {
        type: 'aadhaar',
        label: 'Aadhaar Card',
        strip: 'from-amber-500 via-sky-400 to-emerald-500',
        tagBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
        iconBoxBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
        badgeEmoji: '🇮🇳',
      };
    }
    if (text.includes('pan') || text.includes('nsdl') || text.includes('uti')) {
      return {
        type: 'pan',
        label: 'PAN Card',
        strip: 'from-sky-500 via-blue-500 to-indigo-600',
        tagBg: 'bg-sky-500/10 text-[#38BDF8] border border-sky-500/30',
        iconBoxBg: 'bg-sky-500/10 text-[#38BDF8] border border-sky-500/30',
        badgeEmoji: '💳',
      };
    }
    if (text.includes('passport')) {
      return {
        type: 'passport',
        label: 'Passport',
        strip: 'from-indigo-600 via-blue-700 to-sky-600',
        tagBg: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30',
        iconBoxBg: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30',
        badgeEmoji: '✈️',
      };
    }
    if (
      text.includes('health') ||
      text.includes('medical') ||
      text.includes('insurance') ||
      text.includes('mediclaim') ||
      text.includes('hospital') ||
      text.includes('prescription') ||
      text.includes('parchi') ||
      text.includes('parcha') ||
      text.includes('doctor')
    ) {
      return {
        type: 'medical',
        label: text.includes('insurance') || text.includes('mediclaim') ? 'Health Insurance' : 'Medical Record',
        strip: 'from-rose-500 via-red-500 to-rose-600',
        tagBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/30',
        iconBoxBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/30',
        badgeEmoji: '🏥',
      };
    }
    const isMed = /\b(prescription|hospital|clinic|doctor|medicine|dawai|parchi|parcha|discharge|health|medical|insurance|mediclaim)\b/i.test(text);
    if (!isMed && (/\b(driving licen[cs]e|driver licen[cs]e|driving|\bdl\b|\brc\b|vehicle rc|vehicle|car|bike)\b/i.test(text) && !/\b(parchi|parcha|march|research)\b/i.test(text))) {
      return {
        type: 'vehicle',
        label: text.includes('driving') || text.includes('license') ? 'Driving License' : 'Vehicle RC',
        strip: 'from-emerald-500 via-teal-500 to-emerald-600',
        tagBg: 'bg-emerald-500/10 text-[#34D399] border border-emerald-500/30',
        iconBoxBg: 'bg-emerald-500/10 text-[#34D399] border border-emerald-500/30',
        badgeEmoji: '🚗',
      };
    }
    if (text.includes('property') || text.includes('registry') || text.includes('flat') || text.includes('deed') || text.includes('will') || text.includes('tax')) {
      return {
        type: 'property',
        label: 'Property Deed',
        strip: 'from-amber-600 via-yellow-500 to-amber-500',
        tagBg: 'bg-amber-500/10 text-amber-300 border border-amber-500/30',
        iconBoxBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
        badgeEmoji: '📜',
      };
    }
    return {
      type: 'general',
      label: doc.category || 'Document',
      strip: 'from-sky-500 to-blue-600',
      tagBg: 'bg-slate-100 dark:bg-[#111726] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#1E293B]',
      iconBoxBg: 'bg-sky-500/10 text-[#38BDF8] border border-sky-500/30',
      badgeEmoji: '📑',
    };
  };

  // Close delete modal on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && docToDelete) {
        setDocToDelete(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [docToDelete]);

  const handleDocumentClick = (e, doc) => {
    const isSensitive =
      doc.isSensitive ||
      ['Property & Legal', 'Financial', 'Legal'].includes(doc.category);

    const isUnlocked = sessionStorage.getItem('gharvault_mpin_unlocked') === 'true';

    if (isSensitive && !isUnlocked) {
      e.preventDefault();
      setMpinTargetDocId(doc._id);
    }
  };

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    } else {
      setSelectedCategory('All');
    }
  }, [categoryParam]);

  useEffect(() => {
    if (filterParam === 'expiring') setQuickTab('expiring');
    else if (filterParam === 'shared') setQuickTab('shared');
  }, [filterParam]);

  const handleQuickTabChange = (tabId) => {
    setQuickTab(tabId);
    if (tabId === 'expiring') {
      navigate('/vault?filter=expiring');
    } else if (tabId === 'shared') {
      navigate('/vault?filter=shared');
    } else {
      navigate('/vault');
    }
  };

  useEffect(() => {
    loadVault();
  }, []);

  const loadVault = async () => {
    try {
      setLoading(true);
      const [docsRes, membersRes] = await Promise.all([
        api.getDocuments(),
        api.getMembers(),
      ]);
      setDocuments(docsRes.documents || []);
      setMembers(membersRes.members || []);
    } catch (err) {
      console.error('Failed to load vault documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyNumber = (num, e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    toast.success(`Copied: ${num}`);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  const handleShareSafely = async (docId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      const res = await api.createShareLink(docId, { expiresInHours: 24 });
      const link = res.shareUrl || res.shareLink || (res.token ? `${window.location.origin}/share/${res.token}` : '');
      if (link) {
        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(link);
          } else {
            const ta = document.createElement('textarea');
            ta.value = link;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
          }
        } catch (clipErr) {
          console.warn('Clipboard write error:', clipErr);
        }
        setShareFeedback({ id: docId, text: '24h Safe Link Copied!' });
        toast.success('24-Hour Safe Share link copied to clipboard!');
        setTimeout(() => setShareFeedback(null), 2500);
      }
    } catch (err) {
      toast.error('Could not generate share link: ' + (err.message || 'Error'));
    }
  };

  const handleCopyExistingShareLink = async (doc, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const link = doc.shareLink?.shareUrl || (doc.shareLink?.token ? `${window.location.origin}/share/${doc.shareLink.token}` : '');
    if (!link) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        const ta = document.createElement('textarea');
        ta.value = link;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
    } catch (clipErr) {}
    setShareFeedback({ id: doc._id, text: 'Link Copied!' });
    toast.success('Safe view-only share link copied to clipboard!');
    setTimeout(() => setShareFeedback(null), 2500);
  };

  const handleDelete = (id, title, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setDocToDelete({ _id: id, title });
  };

  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    try {
      setDeleting(true);
      await api.deleteDocument(docToDelete._id);
      toast.success(`"${docToDelete.title}" deleted permanently from family vault.`);
      setDocToDelete(null);
      loadVault();
    } catch (err) {
      toast.error('Delete failed: ' + (err.message || 'Error'));
    } finally {
      setDeleting(false);
    }
  };

  const categories = [
    { name: 'All', icon: Layers },
    { name: 'ID Cards', icon: CreditCard },
    { name: 'Medical & Health', icon: HeartPulse },
    { name: 'Bank & Property', icon: Landmark },
    { name: 'Education', icon: GraduationCap },
    { name: 'Legal', icon: Scale },
    { name: 'Other', icon: Folder },
  ];

  const renderDocCategoryIcon = (category) => {
    switch (category) {
      case 'ID Cards':
        return <CreditCard size={18} />;
      case 'Medical & Health':
        return <HeartPulse size={18} />;
      case 'Bank & Property':
        return <Landmark size={18} />;
      case 'Education':
        return <GraduationCap size={18} />;
      case 'Legal':
        return <Scale size={18} />;
      default:
        return <FileText size={18} />;
    }
  };

  const isCategoryMatch = (docCat, selected) => {
    if (!docCat || !selected || selected.toLowerCase() === 'all') return true;
    const d = (docCat || '').toLowerCase().trim();
    const s = (selected || '').toLowerCase().trim();
    if (d === s) return true;
    if (['identity', 'id cards', 'id card', 'id'].includes(s) && ['identity', 'id cards', 'id card', 'id'].includes(d)) return true;
    if (['health & medical', 'medical & health', 'health', 'medical'].includes(s) && ['health & medical', 'medical & health', 'health', 'medical'].includes(d)) return true;
    if (['property & legal', 'bank & property', 'financial', 'bank', 'property', 'legal'].includes(s) && ['property & legal', 'bank & property', 'financial', 'bank', 'property', 'legal'].includes(d)) return true;
    return false;
  };

  // Live dynamic count badges for quick-tabs
  const quickTabCounts = {
    all: documents.length,
    expiring: documents.filter((d) => {
      if (!d.expiryDate) return false;
      const diff = Math.ceil((new Date(d.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
      return diff <= 60;
    }).length,
    confidential: documents.filter(
      (d) => d.isSensitive || d.isMpinProtected || ['Property & Legal', 'Financial', 'Legal'].includes(d.category)
    ).length,
    kyc: documents.filter((d) => {
      const text = `${d.title || ''} ${d.category || ''} ${d.tags?.join(' ') || ''}`.toLowerCase();
      return text.includes('aadhaar') || text.includes('pan') || text.includes('passport') || text.includes('voter') || d.category === 'ID Cards';
    }).length,
    vehicle: documents.filter((d) => {
      const text = `${d.title || ''} ${d.category || ''} ${d.tags?.join(' ') || ''}`.toLowerCase();
      const isMed = /\b(prescription|hospital|clinic|doctor|medicine|dawai|parchi|parcha|discharge|health|medical|insurance|mediclaim)\b/i.test(text);
      if (isMed) return false;
      return d.category === 'Vehicle' || (/\b(driving licen[cs]e|driver licen[cs]e|driving|\bdl\b|\brc\b|vehicle rc|vehicle|car|bike)\b/i.test(text) && !/\b(parchi|parcha|march|research)\b/i.test(text));
    }).length,
    property: documents.filter((d) => {
      const text = `${d.title || ''} ${d.category || ''} ${d.tags?.join(' ') || ''}`.toLowerCase();
      return text.includes('property') || text.includes('registry') || text.includes('flat') || text.includes('deed') || text.includes('land') || d.category === 'Bank & Property';
    }).length,
    shared: documents.filter((d) => d.shareLink && d.shareLink.token).length,
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesCat = isCategoryMatch(doc.category, selectedCategory);
    const matchesMember = selectedMember === 'All' || (doc.assignedMemberId?.toString() === selectedMember || doc.assignedMember?._id?.toString() === selectedMember);

    let matchesTab = true;
    if (quickTab === 'expiring') {
      if (!doc.expiryDate) {
        matchesTab = false;
      } else {
        const diffDays = Math.ceil((new Date(doc.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        matchesTab = diffDays <= 60;
      }
    } else if (quickTab === 'confidential') {
      matchesTab = Boolean(doc.isSensitive || doc.isMpinProtected || ['Property & Legal', 'Financial', 'Legal'].includes(doc.category));
    } else if (quickTab === 'shared') {
      matchesTab = Boolean(doc.shareLink && doc.shareLink.token);
    } else if (quickTab === 'kyc') {
      const text = `${doc.title || ''} ${doc.category || ''} ${doc.tags?.join(' ') || ''}`.toLowerCase();
      matchesTab = text.includes('aadhaar') || text.includes('pan') || text.includes('passport') || text.includes('voter') || doc.category === 'ID Cards';
    } else if (quickTab === 'vehicle') {
      const text = `${doc.title || ''} ${doc.category || ''} ${doc.tags?.join(' ') || ''}`.toLowerCase();
      const isMed = /\b(prescription|hospital|clinic|doctor|medicine|dawai|parchi|parcha|discharge|health|medical|insurance|mediclaim)\b/i.test(text);
      matchesTab = !isMed && (doc.category === 'Vehicle' || (/\b(driving licen[cs]e|driver licen[cs]e|driving|\bdl\b|\brc\b|vehicle rc|vehicle|car|bike)\b/i.test(text) && !/\b(parchi|parcha|march|research)\b/i.test(text)));
    } else if (quickTab === 'property') {
      const text = `${doc.title || ''} ${doc.category || ''} ${doc.tags?.join(' ') || ''}`.toLowerCase();
      matchesTab = text.includes('property') || text.includes('registry') || text.includes('flat') || text.includes('deed') || text.includes('land') || doc.category === 'Bank & Property';
    }

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (doc.title || '').toLowerCase().includes(q) ||
      (doc.category || '').toLowerCase().includes(q) ||
      (doc.documentNumber && doc.documentNumber.toLowerCase().includes(q)) ||
      (doc.assignedMember?.name && doc.assignedMember.name.toLowerCase().includes(q)) ||
      (doc.tags && doc.tags.some((t) => t.toLowerCase().includes(q)));

    return matchesCat && matchesMember && matchesTab && matchesSearch;
  });

  const getExpiryBadge = (expiryDate) => {
    if (!expiryDate) return null;
    const now = new Date();
    const exp = new Date(expiryDate);
    const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[10px] font-mono font-bold border border-red-500/30 flex items-center gap-1 shadow-2xs">
          <AlertTriangle size={10} className="animate-pulse" />
          <span>Expired</span>
        </span>
      );
    }
    if (diffDays <= 30) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-300 text-[10px] font-mono font-bold border border-red-500/30 flex items-center gap-1 shadow-2xs">
          <Clock size={10} className="text-red-400 animate-pulse" />
          <span>Expires in {diffDays}d</span>
        </span>
      );
    }
    if (diffDays <= 60) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/30 flex items-center gap-1">
          <Clock size={10} className="text-amber-400" />
          <span>Expires in {diffDays}d</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-[#34D399] text-[10px] font-mono font-medium border border-emerald-500/20">
        Valid to {exp.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
      </span>
    );
  };

  const getShareLinkInfo = (shareLink) => {
    if (!shareLink || !shareLink.token) return null;
    if (!shareLink.expiresAt) return { isExpired: false, label: 'Active Link', desc: 'No expiration date' };

    const now = new Date();
    const exp = new Date(shareLink.expiresAt);
    const diffMs = exp - now;

    const dateFormatted =
      exp.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }) + ' at ' + exp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (diffMs <= 0) {
      return { isExpired: true, label: 'Link Expired', desc: `Expired on ${dateFormatted}` };
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

    return {
      isExpired: false,
      label: `Active • ${timeLeft}`,
      desc: `Expires on ${dateFormatted}`,
      timeLeft,
      dateFormatted,
    };
  };

  const handleRevokeShareLink = async (docId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      await api.revokeShareLink(docId);
      toast.success('Safe share link revoked. External access closed.');
      loadVault();
    } catch (err) {
      toast.error('Failed to revoke link: ' + (err.message || 'Error'));
    }
  };

  if (loading) {
    return <VaultPageSkeleton />;
  }

  return (
    <div className="max-w-[1380px] mx-auto p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-6 font-sans relative">
      {/* Engineering Dot Grid Texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      {/* Top Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* ================= PAGE HEADER & CONTROLS ================= */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {filterParam === 'shared' ? (
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Shared Links
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 font-mono font-bold text-xs border border-sky-500/30">
                  {filteredDocs.length} Tracked
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Active view-only links shared externally with live auto-expiry countdowns.
              </p>
            </div>
          ) : filterParam === 'expiring' ? (
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Expiring Soon
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-mono font-bold text-xs border border-amber-500/30">
                  {filteredDocs.length} Records
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Family documents requiring renewal within the next 60 days.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Master Repository
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 font-mono font-bold text-xs border border-sky-500/30">
                  {documents.length} Records
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Encrypted family documents with cryptographic SHA-256 integrity custody.
              </p>
            </div>
          )}
        </div>

        {/* Header Action Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/vault/upload"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-blue-600 hover:from-sky-400 hover:via-indigo-400 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-sky-500/25 border border-sky-400/30 transition-all cursor-pointer active:scale-95"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Upload Document</span>
          </Link>
        </div>
      </div>

      {/* ================= FILTER & CONTROLS DECK ================= */}
      <div className="relative z-10 bg-white dark:bg-[#121622] rounded-2xl p-3.5 sm:p-5 border border-slate-200 dark:border-[#1E293B] shadow-sm dark:shadow-md space-y-3.5 transition-colors">
        {/* Row 0: Smart Quick-Tabs & Binders Switcher (Horizontal Scroll) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
          {[
            { id: 'all', label: 'All Documents', icon: Layers, count: quickTabCounts.all },
            { id: 'expiring', label: 'Expiring Soon', icon: AlertTriangle, count: quickTabCounts.expiring, alert: true },
            { id: 'confidential', label: 'MPIN Locked', icon: Lock, count: quickTabCounts.confidential },
            { id: 'kyc', label: 'KYC Packet', icon: CreditCard, count: quickTabCounts.kyc },
            { id: 'vehicle', label: 'Vehicle Packet', icon: Car, count: quickTabCounts.vehicle },
            { id: 'property', label: 'Property Packet', icon: Home, count: quickTabCounts.property },
            { id: 'shared', label: 'Shared Links', icon: Share2, count: quickTabCounts.shared },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = quickTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleQuickTabChange(tab.id)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-500 via-indigo-500 to-blue-600 text-white shadow-md shadow-sky-500/20 border border-sky-400/30'
                    : 'bg-slate-100 dark:bg-[#0B0F19] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#182030] border border-slate-200/90 dark:border-[#1E293B]'
                }`}
              >
                <Icon
                  size={13}
                  className={
                    isActive
                      ? ''
                      : tab.alert && tab.count > 0
                      ? 'text-amber-400 animate-pulse'
                      : 'text-slate-500 dark:text-slate-400'
                  }
                />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive
                      ? 'bg-white/20 text-white font-extrabold'
                      : tab.alert && tab.count > 0
                      ? 'bg-amber-500/20 text-amber-300 font-bold'
                      : 'bg-slate-200 dark:bg-[#1E293B] text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Row 1: Search Box + View Mode Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Real-Time Search Box */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, number (Aadhaar, PAN), or person..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Grid vs Table View Toggle */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] text-slate-600 dark:text-slate-400 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-[#182030] text-sky-500 dark:text-sky-400 shadow-xs font-bold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Grid Cards View"
            >
              <Grid size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-[#182030] text-sky-500 dark:text-sky-400 shadow-xs font-bold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
              title="High-Density Table View"
            >
              <Table size={15} />
            </button>
          </div>
        </div>

        {/* Row 2: Family Member Filter Chips */}
        {members.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-[#1E293B]">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              <button
                type="button"
                onClick={() => setSelectedMember('All')}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedMember === 'All'
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#0B0F19] dark:hover:bg-[#182030] text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-[#1E293B]'
                }`}
              >
                <Users size={12} />
                <span>All Members</span>
                <span className="text-[10px] font-mono opacity-70">({documents.length})</span>
              </button>

              {members.map((m) => {
                const isSelected = selectedMember === m._id;
                const count = documents.filter((d) => (d.assignedMemberId?.toString() === m._id || d.assignedMember?._id?.toString() === m._id)).length;

                return (
                  <button
                    key={m._id}
                    type="button"
                    onClick={() => setSelectedMember(m._id)}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-500 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#0B0F19] dark:hover:bg-[#182030] text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-[#1E293B]'
                    }`}
                  >
                    <span>{m.name?.split(' ')[0] || 'Member'}</span>
                    <span className="text-[10px] font-mono opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Row 3: Category Filter Pills */}
        <div className="pt-2 border-t border-slate-100 dark:border-[#1E293B]">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.name;
              const count =
                cat.name === 'All'
                  ? documents.length
                  : documents.filter((d) => isCategoryMatch(d.category, cat.name)).length;

              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-500 text-white font-bold shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#0B0F19] dark:hover:bg-[#182030] text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-[#1E293B]'
                  }`}
                >
                  <Icon size={12} />
                  <span>{cat.name}</span>
                  <span className="text-[10px] font-mono opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================= MAIN CONTENT LIST / GRID ================= */}
      {loading ? (
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#121622] rounded-2xl p-5 border border-slate-200 dark:border-[#1E293B] animate-pulse space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 dark:bg-[#182030] rounded-xl"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 dark:bg-[#182030] rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 dark:bg-[#182030] rounded w-1/2"></div>
                </div>
              </div>
              <div className="h-10 bg-slate-100 dark:bg-[#0B0F19] rounded-xl"></div>
            </div>
          ))}
        </div>
      ) : documents.length === 0 ? (
        /* Empty Vault State */
        <div className="relative z-10 bg-white dark:bg-[#121622] rounded-2xl border border-slate-200 dark:border-[#1E293B] p-8 sm:p-12 text-center max-w-lg mx-auto shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-500 flex items-center justify-center mx-auto shadow-inner">
            <Shield size={32} />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Your Family Vault is Ready
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
              Upload your family's Aadhaar cards, PAN cards, property deeds, and medical policies. Everything is encrypted with bank-grade zero-knowledge custody.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/vault/upload"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-blue-600 hover:from-sky-400 hover:via-indigo-400 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-sky-500/25 border border-sky-400/30 transition-all cursor-pointer active:scale-95"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Upload First Document</span>
            </Link>
          </div>
        </div>
      ) : filteredDocs.length === 0 ? (
        /* No Search Match State */
        <div className="relative z-10 bg-white dark:bg-[#121622] rounded-2xl border border-slate-200 dark:border-[#1E293B] p-8 text-center max-w-md mx-auto space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] flex items-center justify-center mx-auto text-slate-400">
            <Search size={20} />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">
            No matching documents found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Try adjusting your search keywords or clearing active filter chips.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setSelectedMember('All');
              setQuickTab('all');
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#182030] hover:bg-slate-200 dark:hover:bg-[#202b40] text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* ================= GRID CARDS VIEW (Desktop 3-Col / Mobile 1-Col) ================= */
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredDocs.map((doc) => {
            const hasNumber = doc.documentNumber && doc.documentNumber.trim() !== '';
            const isSensitive =
              doc.isSensitive ||
              doc.isMpinProtected ||
              ['Property & Legal', 'Financial', 'Legal'].includes(doc.category);
            const isRestricted =
              doc.whoCanView && Array.isArray(doc.whoCanView) && !doc.whoCanView.includes('ALL');
            const visual = getDocVisual(doc);
            const isUnmasked = unmaskedDocIds.has(doc._id);

            return (
              <div
                key={doc._id}
                className="relative bg-white dark:bg-[#121622] rounded-2xl border border-slate-200 dark:border-[#1E293B] hover:border-sky-500/50 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group overflow-hidden"
              >
                {/* Realistic Colored Indian Accent Top Strip */}
                <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${visual.strip}`} />

                <div>
                  {/* Card Header: Themed Icon + Title + Status Badges */}
                  <div className="flex items-start justify-between gap-2 mb-2 pt-0.5">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${visual.iconBoxBg}`}>
                        {renderDocCategoryIcon(doc.category)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link
                            to={`/vault/documents/${doc._id}`}
                            onClick={(e) => handleDocumentClick(e, doc)}
                            className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors truncate block"
                          >
                            {doc.title}
                          </Link>
                          {isSensitive && (
                            <span
                              className="p-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 shrink-0"
                              title="Protected by 4-digit security MPIN"
                            >
                              <Lock size={11} />
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md ${visual.tagBg}`}>
                            {visual.badgeEmoji} {visual.label}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            • {doc.assignedMember?.name || 'Family Member'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expiry Badge */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {getExpiryBadge(doc.expiryDate)}
                    </div>
                  </div>

                  {/* 1-TAP COPY DOCUMENT ID NUMBER BAR WITH MASK TOGGLE */}
                  {hasNumber ? (
                    <div className="my-2.5 p-2 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] flex items-center justify-between gap-2 min-w-0">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-[9px] font-mono font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider shrink-0">
                          ID:
                        </span>
                        <code className="text-xs font-mono font-bold text-slate-900 dark:text-sky-400 truncate tracking-wider">
                          {formatDocNumber(doc.documentNumber, isUnmasked, visual.type === 'aadhaar')}
                        </code>
                        {doc.documentNumber.replace(/\s+/g, '').length >= 6 && (
                          <button
                            type="button"
                            onClick={(e) => toggleMask(doc._id, e)}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                            title={isUnmasked ? 'Hide full number' : 'Show full number'}
                          >
                            {isUnmasked ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleCopyNumber(doc.documentNumber, e)}
                        className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30 text-[11px] font-mono font-bold flex items-center gap-1 transition-all shrink-0 cursor-pointer active:scale-95 shadow-2xs"
                        title="Copy document number in one tap"
                      >
                        {copiedNumber === doc.documentNumber ? (
                          <Check size={12} className="text-sky-500" />
                        ) : (
                          <Copy size={12} />
                        )}
                        <span>{copiedNumber === doc.documentNumber ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="my-2.5 py-1.5 px-2.5 rounded-xl bg-slate-50/50 dark:bg-[#0B0F19]/60 border border-dashed border-slate-200 dark:border-[#1E293B] text-[10px] font-mono text-slate-500 italic">
                      No document number registered
                    </div>
                  )}

                  {/* SAFE SHARE LINK STATUS & EXPIRY TRACKER */}
                  {doc.shareLink?.token && (() => {
                    const shareInfo = getShareLinkInfo(doc.shareLink);
                    if (!shareInfo) return null;
                    return (
                      <div
                        className={`mb-2.5 p-2 rounded-xl border flex items-center justify-between gap-2 transition-colors ${
                          shareInfo.isExpired
                            ? 'bg-slate-50 dark:bg-[#0B0F19] border-slate-200 dark:border-[#1E293B]'
                            : 'bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Share2 size={13} className="shrink-0 text-sky-500 dark:text-sky-400" />
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider block truncate">
                              {shareInfo.isExpired ? 'Link Expired' : shareInfo.label}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {!shareInfo.isExpired && (
                            <button
                              type="button"
                              onClick={(e) => handleCopyExistingShareLink(doc, e)}
                              className="px-2 py-0.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-600 dark:text-sky-400 text-[10px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Copy active share link"
                            >
                              <Copy size={11} />
                              <span>Copy</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleRevokeShareLink(doc._id, e)}
                            className="px-1.5 py-0.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-[10px] font-mono font-bold transition-colors cursor-pointer"
                            title="Revoke and dissolve share link immediately"
                          >
                            Revoke
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Document Meta Details */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono pt-0.5">
                    <span>Size: {(doc.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                    {doc.expiryDate && <span>Exp: {new Date(doc.expiryDate).toLocaleDateString()}</span>}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-2.5 mt-2.5 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(e) => handleShareSafely(doc._id, e)}
                    className="p-1 rounded-lg text-slate-600 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 hover:bg-sky-500/10 transition-colors text-[11px] font-mono font-semibold flex items-center gap-1.5 cursor-pointer"
                    title="Generate 24-hour self-destructing safe share link"
                  >
                    <Share2 size={13} />
                    <span>{shareFeedback?.id === doc._id ? 'Copied!' : 'Safe Share'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <Link
                      to={`/vault/documents/${doc._id}`}
                      onClick={(e) => handleDocumentClick(e, doc)}
                      className="px-3 py-1 rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white border border-sky-400/30 text-[11px] font-bold font-mono transition-all inline-flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                    >
                      <Eye size={12} />
                      <span>View</span>
                    </Link>
                    <Link
                      to={`/vault/documents/${doc._id}?edit=true`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                      title="Edit document tags and metadata"
                    >
                      <Edit3 size={13} />
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(doc._id, doc.title, e)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Delete document"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= HIGH-DENSITY TABLE VIEW (Mobile Adaptive) ================= */
        <div className="relative z-10 bg-white dark:bg-[#121622] rounded-2xl border border-slate-200 dark:border-[#1E293B] overflow-hidden shadow-sm transition-colors">
          {/* Mobile Table Cards (Hidden on >= 768px) */}
          <div className="block md:hidden divide-y divide-slate-100 dark:divide-[#1E293B]">
            {filteredDocs.map((doc) => {
              const visual = getDocVisual(doc);
              const isUnmasked = unmaskedDocIds.has(doc._id);
              const isAadhaar = doc.category === 'Identity' && doc.title.toLowerCase().includes('aadhaar');

              return (
                <div key={doc._id} className="p-3.5 space-y-2.5 relative overflow-hidden">
                  <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${visual.strip}`} />

                  <div className="flex items-start justify-between gap-2 pt-0.5">
                    <Link
                      to={`/vault/documents/${doc._id}`}
                      onClick={(e) => handleDocumentClick(e, doc)}
                      className="flex items-center gap-2.5 min-w-0 flex-1"
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${visual.iconBoxBg}`}>
                        {renderDocCategoryIcon(doc.category)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {doc.title}
                          </span>
                          {(doc.isSensitive || ['Property & Legal', 'Financial', 'Legal'].includes(doc.category)) && (
                            <span className="p-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/20 shrink-0" title="Protected by MPIN">
                              <Lock size={10} />
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-mono">
                          {doc.category} • {doc.assignedMember?.name || 'Whole Family'}
                        </div>
                      </div>
                    </Link>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {getExpiryBadge(doc.expiryDate)}
                    </div>
                  </div>

                  {doc.documentNumber && (
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1 truncate">
                        <code className="text-xs font-mono font-bold text-slate-900 dark:text-sky-400 truncate block tracking-wider">
                          {formatDocNumber(doc.documentNumber, isUnmasked, isAadhaar)}
                        </code>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => toggleMask(doc._id, e)}
                          className="p-1 text-slate-400 hover:text-white cursor-pointer"
                        >
                          {isUnmasked ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleCopyNumber(doc.documentNumber, e)}
                          className="px-2 py-1 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 text-[10px] font-mono font-bold flex items-center gap-1"
                        >
                          <Copy size={11} />
                          <span>Copy</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                      type="button"
                      onClick={(e) => handleShareSafely(doc._id, e)}
                      className="text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 font-mono text-[11px] flex items-center gap-1 py-1 cursor-pointer"
                    >
                      <Share2 size={12} />
                      <span>{shareFeedback?.id === doc._id ? 'Copied!' : 'Safe Share'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/vault/documents/${doc._id}`}
                        onClick={(e) => handleDocumentClick(e, doc)}
                        className="px-3 py-1 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 font-bold font-mono text-xs"
                      >
                        View
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(doc._id, doc.title, e)}
                        className="p-1 text-slate-500 hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Full Data Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#0B0F19] border-b border-slate-200 dark:border-[#1E293B] text-slate-400 uppercase font-mono font-bold tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Document</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Member</th>
                  <th className="px-4 py-3.5">Document ID</th>
                  <th className="px-4 py-3.5">Expiry</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B] font-medium text-slate-300">
                {filteredDocs.map((doc) => {
                  const visual = getDocVisual(doc);
                  const isUnmasked = unmaskedDocIds.has(doc._id);
                  const isAadhaar = doc.category === 'Identity' && doc.title.toLowerCase().includes('aadhaar');

                  return (
                    <tr key={doc._id} className="hover:bg-slate-50 dark:hover:bg-[#182030]/50 transition-colors">
                      <td className="px-5 py-3">
                        <Link
                          to={`/vault/documents/${doc._id}`}
                          onClick={(e) => handleDocumentClick(e, doc)}
                          className="flex items-center gap-3"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 ${visual.iconBoxBg}`}>
                            {renderDocCategoryIcon(doc.category)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white hover:text-sky-500 dark:hover:text-sky-400 transition-colors flex items-center gap-1.5 flex-wrap">
                              <span>{doc.title}</span>
                              {visual.badgeEmoji && (
                                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${visual.tagBg}`}>
                                  {visual.badgeEmoji} {visual.label}
                                </span>
                              )}
                              {(doc.isSensitive || ['Property & Legal', 'Financial', 'Legal'].includes(doc.category)) && (
                                <span className="p-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/20" title="Protected by 4-digit MPIN">
                                  <Lock size={10} />
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                              <span>{(doc.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
                              {doc.shareLink?.token && (
                                <span className="text-sky-500 dark:text-sky-400 flex items-center gap-0.5">
                                  <Share2 size={9} />
                                  <span>Active Share Link</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      </td>

                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] text-slate-300 font-mono text-[10px]">
                          {doc.category}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {doc.assignedMember?.name || 'Whole Family'}
                      </td>

                      <td className="px-4 py-3">
                        {doc.documentNumber ? (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#0B0F19] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#1E293B]">
                              <code className="font-mono font-bold text-sky-600 dark:text-sky-400 text-[11px] tracking-wider">
                                {formatDocNumber(doc.documentNumber, isUnmasked, isAadhaar)}
                              </code>
                              <button
                                type="button"
                                onClick={(e) => toggleMask(doc._id, e)}
                                className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                                title={isUnmasked ? "Mask number" : "Reveal number"}
                              >
                                {isUnmasked ? <EyeOff size={11} /> : <Eye size={11} />}
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => handleCopyNumber(doc.documentNumber, e)}
                              className="px-2 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30 font-mono font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                              title="Copy ID number"
                            >
                              {copiedNumber === doc.documentNumber ? <Check size={11} className="text-sky-500" /> : <Copy size={11} />}
                              <span>{copiedNumber === doc.documentNumber ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px] font-mono">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {doc.expiryDate ? (
                          <div className="space-y-0.5">
                            <div>{getExpiryBadge(doc.expiryDate)}</div>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px] font-mono">No Expiry</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/vault/documents/${doc._id}`}
                            onClick={(e) => handleDocumentClick(e, doc)}
                            className="px-3 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30 text-[11px] font-mono font-bold inline-flex items-center gap-1"
                          >
                            <Eye size={12} />
                            <span>View</span>
                          </Link>
                          <Link
                            to={`/vault/documents/${doc._id}?edit=true`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
                            title="Edit document"
                          >
                            <Edit3 size={13} />
                          </Link>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(doc._id, doc.title, e)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors"
                            title="Delete document"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sensitive Document MPIN Unlock Modal */}
      <MpinModal
        isOpen={Boolean(mpinTargetDocId)}
        onClose={() => setMpinTargetDocId(null)}
        onSuccess={() => {
          const target = mpinTargetDocId;
          setMpinTargetDocId(null);
          if (target) {
            navigate(`/vault/documents/${target}`);
          }
        }}
      />

      {/* Delete Document Confirmation Modal */}
      {docToDelete && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
          onClick={() => setDocToDelete(null)}
        >
          <div
            className="relative w-full max-w-md bg-white dark:bg-[#121622] border-t sm:border border-slate-200 dark:border-red-500/30 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden transition-all text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Handle Pill */}
            <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-[#1E293B] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Delete Document
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Permanent vault removal</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-[#182030] text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:px-6 py-4 space-y-3 overflow-y-auto">
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-slate-900 dark:text-white">"{docToDelete.title}"</strong> from your family vault?
              </p>
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-start gap-2.5">
                <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-400" />
                <span>
                  This action removes the encrypted file and cryptographic audit verification permanently. It cannot be recovered.
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 py-3.5 bg-slate-50/70 dark:bg-[#0B0F19] border-t border-slate-100 dark:border-[#1E293B] flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 shrink-0 pb-[max(1.25rem,env(safe-area-inset-bottom,20px))]">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1E293B] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#182030] font-bold text-xs transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-950/40 transition-all cursor-pointer text-center disabled:opacity-50"
              >
                <Trash2 size={14} />
                <span>{deleting ? 'Deleting...' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Mobile Floating Action Button (Quick Camera Scan) */}
      <Link
        to="/vault/upload"
        className="sm:hidden fixed bottom-6 right-5 z-40 px-4 py-3 rounded-full bg-sky-500 hover:bg-sky-400 text-white font-extrabold text-xs shadow-xl shadow-sky-500/30 flex items-center gap-2 active:scale-95 transition-transform"
      >
        <Camera size={16} strokeWidth={2.2} />
        <span>Scan Doc</span>
      </Link>
    </div>
  );
}
