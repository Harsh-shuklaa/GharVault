import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import MpinModal from '../components/common/MpinModal';
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

  // Realistic Indian Document Visual Theming
  const getDocVisual = (doc) => {
    const text = `${doc.title || ''} ${doc.category || ''} ${doc.tags?.join(' ') || ''}`.toLowerCase();
    if (text.includes('aadhaar') || text.includes('adhar') || text.includes('uid')) {
      return {
        type: 'aadhaar',
        label: 'Aadhaar',
        strip: 'from-orange-500 via-white to-emerald-600',
        tagBg: 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200/80 dark:border-orange-500/30',
        iconBoxBg: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200/80 dark:border-orange-500/30',
        badgeEmoji: '🇮🇳',
      };
    }
    if (text.includes('pan') || text.includes('nsdl') || text.includes('uti')) {
      return {
        type: 'pan',
        label: 'PAN Card',
        strip: 'from-blue-700 via-sky-600 to-indigo-900',
        tagBg: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200/80 dark:border-blue-500/30',
        iconBoxBg: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200/80 dark:border-blue-500/30',
        badgeEmoji: '💳',
      };
    }
    if (text.includes('passport')) {
      return {
        type: 'passport',
        label: 'Passport',
        strip: 'from-indigo-950 via-blue-900 to-slate-900',
        tagBg: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200/80 dark:border-indigo-500/30',
        iconBoxBg: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/80 dark:border-indigo-500/30',
        badgeEmoji: '✈️',
      };
    }
    if (text.includes('rc') || text.includes('vehicle') || text.includes('car') || text.includes('bike') || text.includes('driving') || text.includes('license')) {
      return {
        type: 'vehicle',
        label: text.includes('driving') || text.includes('license') ? 'Driving License' : 'Vehicle RC',
        strip: 'from-emerald-600 via-teal-600 to-emerald-700',
        tagBg: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-[#3ECF8E] border-emerald-200/80 dark:border-[#3ECF8E]/30',
        iconBoxBg: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-[#3ECF8E] border-emerald-200/80 dark:border-[#3ECF8E]/30',
        badgeEmoji: '🚗',
      };
    }
    if (text.includes('health') || text.includes('medical') || text.includes('insurance') || text.includes('mediclaim') || text.includes('hospital')) {
      return {
        type: 'medical',
        label: 'Mediclaim',
        strip: 'from-rose-600 via-red-600 to-rose-700',
        tagBg: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200/80 dark:border-red-500/30',
        iconBoxBg: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200/80 dark:border-red-500/30',
        badgeEmoji: '🏥',
      };
    }
    if (text.includes('property') || text.includes('registry') || text.includes('flat') || text.includes('deed') || text.includes('will') || text.includes('tax')) {
      return {
        type: 'property',
        label: 'Property Deed',
        strip: 'from-amber-600 via-yellow-600 to-amber-700',
        tagBg: 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-500/30',
        iconBoxBg: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-500/30',
        badgeEmoji: '📜',
      };
    }
    return {
      type: 'general',
      label: doc.category || 'Document',
      strip: 'from-[#10B981] to-[#3ECF8E]',
      tagBg: 'bg-slate-100 dark:bg-[#202024] text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-[#2E2E32]',
      iconBoxBg: 'bg-emerald-100/70 dark:bg-[#3ECF8E]/15 text-emerald-700 dark:text-[#3ECF8E] border-emerald-200/60 dark:border-[#3ECF8E]/25',
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
        toast.success('24h safe view-only share link copied to clipboard!');
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
      return text.includes('rc') || text.includes('vehicle') || text.includes('car') || text.includes('bike') || text.includes('driving') || text.includes('license');
    }).length,
    property: documents.filter((d) => {
      const text = `${d.title || ''} ${d.category || ''} ${d.tags?.join(' ') || ''}`.toLowerCase();
      return text.includes('property') || text.includes('registry') || text.includes('flat') || text.includes('deed') || text.includes('land') || d.category === 'Bank & Property';
    }).length,
    shared: documents.filter((d) => d.shareLink && d.shareLink.token).length,
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesCat = isCategoryMatch(doc.category, selectedCategory);
    const matchesMember = selectedMember === 'All' || doc.assignedMemberId?.toString() === selectedMember;

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
      matchesTab = text.includes('rc') || text.includes('vehicle') || text.includes('car') || text.includes('bike') || text.includes('driving') || text.includes('license');
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
        <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-400 text-[10px] font-bold border border-red-200 dark:border-red-500/30 flex items-center gap-1 shadow-2xs">
          <AlertTriangle size={10} className="animate-pulse" />
          <span>Expired</span>
        </span>
      );
    }
    if (diffDays <= 30) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300 text-[10px] font-bold border border-red-300/80 dark:border-red-500/30 flex items-center gap-1 shadow-2xs">
          <Clock size={10} className="text-red-500 animate-pulse" />
          <span>Expires in {diffDays}d</span>
        </span>
      );
    }
    if (diffDays <= 60) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[10px] font-bold border border-amber-300/70 dark:border-amber-500/30 flex items-center gap-1">
          <Clock size={10} className="text-amber-500" />
          <span>Expires in {diffDays}d</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-700 dark:text-[#3ECF8E] text-[10px] font-medium border border-emerald-200/60 dark:border-[#3ECF8E]/20">
        Valid till {exp.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
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

  return (
    <div className="max-w-[1380px] mx-auto p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-6">
      {/* ================= PAGE HEADER & CONTROLS ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {filterParam === 'shared' ? (
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Shared Links
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-800 dark:text-[#3ECF8E] font-bold text-xs border border-emerald-200 dark:border-[#3ECF8E]/20">
                  {filteredDocs.length} Tracked
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
                Active view-only links shared externally. Monitor auto-expiry countdowns and revoke access anytime.
              </p>
            </div>
          ) : filterParam === 'expiring' ? (
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Expiring Soon
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 font-bold text-xs border border-amber-200 dark:border-amber-500/20">
                  {filteredDocs.length} Records
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
                Family documents requiring renewal within the next 60 days.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  All Documents
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100/70 dark:bg-[#3ECF8E]/15 text-emerald-800 dark:text-[#3ECF8E] font-bold text-xs border border-emerald-200 dark:border-[#3ECF8E]/30">
                  {documents.length} Total
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
                Family ID cards, medical policies, bank passbooks, and certificates stored with 256-bit bank-grade encryption.
              </p>
            </div>
          )}
        </div>

        {/* Header Action Button */}
        <div className="flex items-center gap-2.5">
          <Link
            to="/vault/upload"
            className="min-h-[44px] w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] font-bold text-xs shadow-md shadow-[#3ECF8E]/25 transition-all cursor-pointer active:scale-95"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Upload Document</span>
          </Link>
        </div>
      </div>

      {/* ================= FILTER & CONTROLS CONTAINER ================= */}
      <div className="bg-white dark:bg-[#18181B] rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-[#262626] shadow-sm space-y-3.5 transition-colors">
        {/* Row 0: Smart Quick-Tabs & Binders Switcher */}
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
                className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-md'
                    : 'bg-slate-50 dark:bg-[#141414] text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#202024] border border-slate-200/80 dark:border-[#262626]'
                }`}
              >
                <Icon
                  size={14}
                  className={
                    isActive
                      ? ''
                      : tab.alert && tab.count > 0
                      ? 'text-amber-500 animate-pulse'
                      : 'text-slate-500 dark:text-neutral-400'
                  }
                />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive
                      ? 'bg-white/20 dark:bg-black/20 text-white dark:text-black font-extrabold'
                      : tab.alert && tab.count > 0
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 font-bold'
                      : 'bg-slate-200/80 dark:bg-[#262626] text-slate-600 dark:text-neutral-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Row 1: Search Box + View Mode Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Real-Time Search Box */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400 dark:text-neutral-500" />
            <input
              type="text"
              placeholder="Search by document name, number (Aadhaar, PAN), or person..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-[#3ECF8E] focus:bg-white dark:focus:bg-[#141414] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Grid vs Table View Toggle */}
          <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] text-slate-600 dark:text-neutral-400 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-[#262626] text-[#10B981] dark:text-[#3ECF8E] shadow-2xs font-bold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Grid Cards View"
            >
              <Grid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-[#262626] text-[#10B981] dark:text-[#3ECF8E] shadow-2xs font-bold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
              title="High-Density Table View"
            >
              <Table size={16} />
            </button>
          </div>
        </div>

        {/* Row 2: Family Member Avatar Filter Chips (1-Tap Filter) */}
        {members.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-[#262626]">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              <button
                type="button"
                onClick={() => setSelectedMember('All')}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedMember === 'All'
                    ? 'bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#1E1E22] dark:hover:bg-[#26262B] text-slate-700 dark:text-neutral-300'
                }`}
              >
                <Users size={13} />
                <span>All Members</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedMember === 'All'
                      ? 'bg-white/20 dark:bg-black/20 text-white dark:text-[#121212]'
                      : 'bg-slate-200 dark:bg-[#2A2A30] text-slate-700 dark:text-neutral-300'
                  }`}
                >
                  {documents.length}
                </span>
              </button>

              {members.map((m) => {
                const isSelected = selectedMember === m._id;
                const initial = (m.name || 'M').charAt(0).toUpperCase();
                const count = documents.filter((d) => d.assignedMemberId?.toString() === m._id).length;

                return (
                  <button
                    key={m._id}
                    type="button"
                    onClick={() => setSelectedMember(m._id)}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#1E1E22] dark:hover:bg-[#26262B] text-slate-700 dark:text-neutral-300'
                    }`}
                  >
                    {m.avatar ? (
                      <img src={m.avatar} alt={m.name} className="w-4 h-4 rounded-full object-cover shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-emerald-200 dark:bg-[#3ECF8E]/30 text-emerald-900 dark:text-[#3ECF8E] text-[9px] flex items-center justify-center font-bold shrink-0">
                        {initial}
                      </span>
                    )}
                    <span className="truncate max-w-[110px]">{m.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected
                          ? 'bg-white/20 dark:bg-black/20 text-white dark:text-[#121212]'
                          : 'bg-slate-200 dark:bg-[#2A2A30] text-slate-700 dark:text-neutral-300'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Row 3: Category Tabs Slider */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-[#262626] overflow-x-auto no-scrollbar whitespace-nowrap pb-1">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
            const count =
              cat.name === 'All'
                ? documents.length
                : documents.filter((d) => isCategoryMatch(d.category, cat.name)).length;

            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => setSelectedCategory(cat.name)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] shadow-xs'
                    : 'bg-slate-50 dark:bg-[#141414] hover:bg-slate-100 dark:hover:bg-[#262626] text-slate-600 dark:text-neutral-400 border border-slate-200/80 dark:border-[#262626]'
                }`}
              >
                <Icon size={14} />
                <span>{cat.name}</span>
                <span
                  className={`ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? 'bg-white/20 dark:bg-black/20 text-white dark:text-[#121212]'
                      : 'bg-slate-200 dark:bg-[#262626] text-slate-700 dark:text-neutral-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= MAIN CONTENT LIST / GRID ================= */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#18181B] rounded-3xl p-6 border border-slate-200/80 dark:border-[#262626] animate-pulse space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-slate-200 dark:bg-[#262626] rounded-2xl"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 dark:bg-[#262626] rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 dark:bg-[#262626] rounded w-1/2"></div>
                </div>
              </div>
              <div className="h-10 bg-slate-100 dark:bg-[#141414] rounded-2xl"></div>
              <div className="h-8 bg-slate-100 dark:bg-[#141414] rounded-xl w-1/3 ml-auto"></div>
            </div>
          ))}
        </div>
      ) : documents.length === 0 ? (
        /* Empty Vault State */
        <div className="bg-white dark:bg-[#18181B] rounded-3xl border border-slate-200/80 dark:border-[#262626] p-10 sm:p-14 text-center max-w-xl mx-auto shadow-sm space-y-4 transition-colors">
          <div className="w-20 h-20 rounded-3xl bg-emerald-100/70 dark:bg-[#3ECF8E]/15 text-emerald-700 dark:text-[#3ECF8E] flex items-center justify-center mx-auto shadow-xs">
            <Shield size={36} strokeWidth={2.2} />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Your Family Vault is Empty
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed max-w-sm mx-auto">
            Upload your family's Aadhaar cards, PAN cards, property deeds, health insurance policies, and certificates. Everything is encrypted and private.
          </p>
          <div className="pt-2">
            <Link
              to="/vault/upload"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] font-bold text-xs shadow-md shadow-[#3ECF8E]/25 transition-all cursor-pointer active:scale-95"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Upload First Document</span>
            </Link>
          </div>
        </div>
      ) : filteredDocs.length === 0 ? (
        /* No Search Match State */
        <div className="bg-white dark:bg-[#18181B] rounded-3xl border border-slate-200/80 dark:border-[#262626] p-10 text-center max-w-md mx-auto space-y-3 transition-colors shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#202024] flex items-center justify-center mx-auto text-slate-400 dark:text-neutral-500">
            <Search size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">
            No matching documents found
          </h3>
          <p className="text-xs text-slate-500 dark:text-neutral-400">
            No records matched your search query or active filter chips.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setSelectedMember('All');
            }}
            className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#141414] hover:bg-slate-200 dark:hover:bg-[#262626] text-slate-700 dark:text-neutral-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* ================= GRID CARDS VIEW (Desktop 3-Col / Mobile 1-Col) ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
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
                className="relative bg-white dark:bg-[#18181B] rounded-2xl border border-slate-200/80 dark:border-[#262626] p-4 sm:p-5 shadow-2xs hover:border-[#10B981] dark:hover:border-[#3ECF8E] hover:shadow-md transition-all flex flex-col justify-between group overflow-hidden"
              >
                {/* Realistic Colored Indian Accent Top Strip */}
                <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${visual.strip}`} />

                <div>
                  {/* Card Header: Themed Icon + Title + Status Badges */}
                  <div className="flex items-start justify-between gap-2.5 mb-2.5 pt-0.5">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${visual.iconBoxBg}`}
                      >
                        {renderDocCategoryIcon(doc.category)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link
                            to={`/vault/documents/${doc._id}`}
                            onClick={(e) => handleDocumentClick(e, doc)}
                            className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-[#3ECF8E] transition-colors truncate block"
                          >
                            {doc.title}
                          </Link>
                          {isSensitive && (
                            <span
                              className="p-1 rounded-md bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 shrink-0"
                              title="Protected by 4-digit security MPIN"
                            >
                              <Lock size={11} />
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border flex items-center gap-1 shrink-0 ${visual.tagBg}`}
                          >
                            <span>{visual.badgeEmoji}</span>
                            <span>{visual.label}</span>
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium truncate">
                            For {doc.assignedMember?.name || 'Whole Family'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expiry Badge */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {getExpiryBadge(doc.expiryDate)}
                      {isRestricted ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-[#141414] text-[9px] font-semibold text-slate-600 dark:text-neutral-400">
                          🔒 Restricted
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-[#3ECF8E]/10 text-[9px] font-semibold text-emerald-800 dark:text-[#3ECF8E]">
                          👥 Family
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 1-TAP COPY DOCUMENT ID NUMBER BAR WITH MASK TOGGLE */}
                  {hasNumber ? (
                    <div className="my-2.5 p-2 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200/80 dark:border-[#262626] flex items-center justify-between gap-2 min-w-0">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-[9px] font-bold uppercase text-slate-400 dark:text-neutral-500 tracking-wider shrink-0">
                          ID:
                        </span>
                        <code className="text-xs font-mono font-bold text-slate-900 dark:text-neutral-200 truncate">
                          {formatDocNumber(doc.documentNumber, isUnmasked, visual.type === 'aadhaar')}
                        </code>
                        {doc.documentNumber.replace(/\s+/g, '').length >= 6 && (
                          <button
                            type="button"
                            onClick={(e) => toggleMask(doc._id, e)}
                            className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300 cursor-pointer"
                            title={isUnmasked ? 'Hide full number' : 'Show full number'}
                          >
                            {isUnmasked ? <EyeOff size={12} /> : <Eye size={12} />}
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleCopyNumber(doc.documentNumber, e)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-[#3ECF8E]/10 hover:bg-emerald-100 dark:hover:bg-[#3ECF8E]/20 text-emerald-800 dark:text-[#3ECF8E] text-[11px] font-bold flex items-center justify-center gap-1 transition-colors shrink-0 cursor-pointer shadow-2xs active:scale-95"
                        title="Copy document number in one tap"
                      >
                        {copiedNumber === doc.documentNumber ? (
                          <Check size={12} className="text-[#10B981] dark:text-[#3ECF8E]" />
                        ) : (
                          <Copy size={12} />
                        )}
                        <span>{copiedNumber === doc.documentNumber ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="my-2.5 py-1 px-2.5 rounded-lg bg-slate-50/50 dark:bg-[#141414]/50 border border-dashed border-slate-200/60 dark:border-[#262626] text-[10px] text-slate-400 dark:text-neutral-500 italic">
                      No document number saved
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
                            ? 'bg-slate-50 dark:bg-[#141414] border-slate-200 dark:border-[#262626]'
                            : 'bg-emerald-50/70 dark:bg-[#3ECF8E]/10 border-emerald-200/80 dark:border-[#3ECF8E]/25'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                              shareInfo.isExpired
                                ? 'bg-slate-200 dark:bg-[#262626] text-slate-500 dark:text-neutral-400'
                                : 'bg-emerald-100 dark:bg-[#3ECF8E]/20 text-emerald-800 dark:text-[#3ECF8E]'
                            }`}
                          >
                            <Share2 size={12} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider ${
                                  shareInfo.isExpired
                                    ? 'text-slate-500 dark:text-neutral-400'
                                    : 'text-emerald-800 dark:text-[#3ECF8E]'
                                }`}
                              >
                                {shareInfo.isExpired ? 'Link Expired' : 'Safe Share'}
                              </span>
                              {!shareInfo.isExpired && (
                                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/80 dark:bg-[#3ECF8E]/20 px-1.5 py-0.2 rounded-md">
                                  {shareInfo.timeLeft}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!shareInfo.isExpired && (
                            <button
                              type="button"
                              onClick={(e) => handleCopyExistingShareLink(doc, e)}
                              className="px-2 py-0.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-[#3ECF8E]/20 dark:hover:bg-[#3ECF8E]/30 text-emerald-800 dark:text-[#3ECF8E] text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Copy active share link"
                            >
                              <Copy size={11} />
                              <span>Copy</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleRevokeShareLink(doc._id, e)}
                            className="px-1.5 py-0.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 text-[10px] font-semibold transition-colors cursor-pointer"
                            title="Revoke and disable this share link"
                          >
                            Revoke
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Document Meta Details */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-neutral-500 font-medium pt-0.5">
                    <span>Size: {(doc.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                    {doc.expiryDate && <span>Valid to: {new Date(doc.expiryDate).toLocaleDateString()}</span>}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-2.5 mt-2.5 border-t border-slate-100 dark:border-[#262626] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(e) => handleShareSafely(doc._id, e)}
                    className="p-1 rounded-lg text-slate-600 dark:text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-[#3ECF8E]/10 transition-colors text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                    title="Share Safely (24-hour expiring link)"
                  >
                    <Share2 size={13} />
                    <span>{shareFeedback?.id === doc._id ? 'Copied!' : 'Share Safely'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <Link
                      to={`/vault/documents/${doc._id}`}
                      onClick={(e) => handleDocumentClick(e, doc)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-[#3ECF8E]/10 hover:bg-emerald-100 dark:hover:bg-[#3ECF8E]/20 text-emerald-800 dark:text-[#3ECF8E] text-[11px] font-bold transition-colors inline-flex items-center gap-1"
                    >
                      <Eye size={12} />
                      <span>View</span>
                    </Link>
                    <Link
                      to={`/vault/documents/${doc._id}?edit=true`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded-lg text-slate-400 dark:text-neutral-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-[#3ECF8E]/10 transition-colors"
                      title="Edit document"
                    >
                      <Edit3 size={13} />
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(doc._id, doc.title, e)}
                      className="p-1 rounded-lg text-slate-400 dark:text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
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
        <div className="bg-white dark:bg-[#18181B] rounded-3xl border border-slate-200/80 dark:border-[#262626] overflow-hidden shadow-sm transition-colors">
          {/* Mobile Table Cards (Hidden on >= 768px) */}
          <div className="block md:hidden divide-y divide-slate-100 dark:divide-[#262626]">
            {filteredDocs.map((doc) => {
              const visual = getDocVisual(doc);
              const isUnmasked = unmaskedDocIds.has(doc._id);
              const isAadhaar = doc.category === 'Identity' && doc.title.toLowerCase().includes('aadhaar');

              return (
                <div key={doc._id} className="p-4 space-y-3 relative overflow-hidden">
                  {/* Visual accent bar */}
                  <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${visual.strip}`} />

                  <div className="flex items-start justify-between gap-2 pt-0.5">
                    <Link
                      to={`/vault/documents/${doc._id}`}
                      onClick={(e) => handleDocumentClick(e, doc)}
                      className="flex items-center gap-3 min-w-0 flex-1"
                    >
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${visual.iconBoxBg}`}>
                        {renderDocCategoryIcon(doc.category)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {doc.title}
                          </span>
                          {visual.badgeEmoji && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${visual.tagStyle} shrink-0`}>
                              {visual.badgeEmoji} {visual.label}
                            </span>
                          )}
                          {(doc.isSensitive || ['Property & Legal', 'Financial', 'Legal'].includes(doc.category)) && (
                            <span className="p-0.5 rounded bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 shrink-0" title="Protected by MPIN">
                              <Lock size={11} />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">
                          {doc.category} • For {doc.assignedMember?.name || 'Whole Family'}
                        </div>
                      </div>
                    </Link>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {getExpiryBadge(doc.expiryDate)}
                    </div>
                  </div>

                  {doc.documentNumber && (
                    <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-200/80 dark:border-[#262626] flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1 truncate">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-neutral-500 block">
                            ID Number
                          </span>
                          <button
                            type="button"
                            onClick={(e) => toggleMask(doc._id, e)}
                            className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300 cursor-pointer"
                            title={isUnmasked ? "Mask number" : "Reveal number"}
                          >
                            {isUnmasked ? <EyeOff size={11} /> : <Eye size={11} />}
                          </button>
                        </div>
                        <code className="text-xs font-mono font-bold text-slate-900 dark:text-neutral-200 truncate block">
                          {formatDocNumber(doc.documentNumber, isUnmasked, isAadhaar)}
                        </code>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleCopyNumber(doc.documentNumber, e)}
                        className="min-h-[36px] px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-[#3ECF8E]/10 hover:bg-emerald-100 dark:hover:bg-[#3ECF8E]/20 text-emerald-800 dark:text-[#3ECF8E] text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 cursor-pointer active:scale-95 shadow-2xs"
                      >
                        {copiedNumber === doc.documentNumber ? <Check size={13} /> : <Copy size={13} />}
                        <span>{copiedNumber === doc.documentNumber ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                      type="button"
                      onClick={(e) => handleShareSafely(doc._id, e)}
                      className="text-slate-500 dark:text-neutral-400 hover:text-emerald-600 font-semibold flex items-center gap-1.5 py-1.5 cursor-pointer"
                    >
                      <Share2 size={14} />
                      <span>{shareFeedback?.id === doc._id ? 'Copied!' : 'Share Safely'}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/vault/documents/${doc._id}`}
                        onClick={(e) => handleDocumentClick(e, doc)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-800 dark:text-[#3ECF8E] font-bold text-xs"
                      >
                        View
                      </Link>
                      <Link
                        to={`/vault/documents/${doc._id}?edit=true`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-xl text-slate-400 dark:text-neutral-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-[#3ECF8E]/10 transition-colors"
                        title="Edit document"
                      >
                        <Edit3 size={15} />
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(doc._id, doc.title, e)}
                        className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 size={15} />
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
              <thead className="bg-slate-50/80 dark:bg-[#141414] border-b border-slate-200 dark:border-[#262626] text-slate-500 dark:text-neutral-400 uppercase font-bold tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Document</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Family Member</th>
                  <th className="px-4 py-3.5">Document ID & Copy</th>
                  <th className="px-4 py-3.5">Expiry</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#262626] font-medium text-slate-700 dark:text-neutral-300">
                {filteredDocs.map((doc) => {
                  const visual = getDocVisual(doc);
                  const isUnmasked = unmaskedDocIds.has(doc._id);
                  const isAadhaar = doc.category === 'Identity' && doc.title.toLowerCase().includes('aadhaar');

                  return (
                    <tr key={doc._id} className="hover:bg-emerald-50/30 dark:hover:bg-[#202024] transition-colors">
                      <td className="px-5 py-3.5">
                        <Link
                          to={`/vault/documents/${doc._id}`}
                          onClick={(e) => handleDocumentClick(e, doc)}
                          className="flex items-center gap-3"
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${visual.iconBoxBg}`}>
                            {renderDocCategoryIcon(doc.category)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-[#3ECF8E] transition-colors flex items-center gap-1.5 flex-wrap">
                              <span>{doc.title}</span>
                              {visual.badgeEmoji && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${visual.tagStyle}`}>
                                  {visual.badgeEmoji} {visual.label}
                                </span>
                              )}
                              {(doc.isSensitive || ['Property & Legal', 'Financial', 'Legal'].includes(doc.category)) && (
                                <span className="p-0.5 rounded bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300" title="Protected by 4-digit MPIN">
                                  <Lock size={11} />
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-neutral-500 flex items-center gap-2 flex-wrap">
                              <span>{(doc.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
                              {doc.shareLink?.token && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-700 dark:text-[#3ECF8E]">
                                  <Share2 size={9} />
                                  <span>Active Link</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-[#141414] text-slate-700 dark:text-neutral-300 font-semibold text-[11px] border border-transparent dark:border-[#262626]">
                          {doc.category}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-white">
                        {doc.assignedMember?.name || 'Whole Family'}
                      </td>

                      <td className="px-4 py-3.5">
                        {doc.documentNumber ? (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#141414] px-2.5 py-1 rounded-xl border border-slate-200/80 dark:border-[#262626]">
                              <code className="font-mono font-bold text-slate-900 dark:text-neutral-200 text-[11px]">
                                {formatDocNumber(doc.documentNumber, isUnmasked, isAadhaar)}
                              </code>
                              <button
                                type="button"
                                onClick={(e) => toggleMask(doc._id, e)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300 p-0.5 rounded cursor-pointer"
                                title={isUnmasked ? "Mask number" : "Reveal number"}
                              >
                                {isUnmasked ? <EyeOff size={11} /> : <Eye size={11} />}
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => handleCopyNumber(doc.documentNumber, e)}
                              className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-[#3ECF8E]/10 hover:bg-emerald-100 dark:hover:bg-[#3ECF8E]/20 text-emerald-800 dark:text-[#3ECF8E] font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer active:scale-95"
                              title="Copy ID number"
                            >
                              {copiedNumber === doc.documentNumber ? <Check size={11} /> : <Copy size={11} />}
                              <span>{copiedNumber === doc.documentNumber ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-neutral-500 text-[11px]">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        {doc.expiryDate ? (
                          <div className="space-y-0.5">
                            <div className="text-[11px] font-semibold text-slate-800 dark:text-neutral-200">
                              {new Date(doc.expiryDate).toLocaleDateString()}
                            </div>
                            <div>{getExpiryBadge(doc.expiryDate)}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-neutral-500 text-[11px]">No Expiry</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/vault/documents/${doc._id}`}
                            onClick={(e) => handleDocumentClick(e, doc)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-800 dark:text-[#3ECF8E] hover:bg-emerald-100 dark:hover:bg-[#3ECF8E]/20 text-[11px] font-bold inline-flex items-center gap-1"
                          >
                            <Eye size={12} />
                            <span>View</span>
                          </Link>
                          <Link
                            to={`/vault/documents/${doc._id}?edit=true`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-xl text-slate-400 dark:text-neutral-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-[#3ECF8E]/10 cursor-pointer transition-colors"
                            title="Edit document"
                          >
                            <Edit3 size={13} />
                          </Link>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(doc._id, doc.title, e)}
                            className="p-1.5 rounded-xl text-slate-300 dark:text-neutral-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer transition-colors"
                            title="Delete document"
                          >
                            <Trash2 size={14} />
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
      {docToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
          onClick={() => setDocToDelete(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#18181B] border-t sm:border border-slate-200 dark:border-[#27272A] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden transition-all text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Handle Pill */}
            <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-neutral-600" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-[#262626] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Delete Document
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">Permanent vault removal</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-[#202024] text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 space-y-3 overflow-y-auto">
              <p className="text-xs text-slate-700 dark:text-neutral-300 leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-slate-900 dark:text-white">"{docToDelete.title}"</strong> from your family vault?
              </p>
              <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-xs text-red-700 dark:text-red-400 flex items-start gap-2.5">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>
                  This action removes the encrypted file and cryptographic audit verification permanently. It cannot be recovered.
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 py-3.5 bg-slate-50/70 dark:bg-[#141414] border-t border-slate-100 dark:border-[#262626] flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 shrink-0 pb-[calc(0.875rem+env(safe-area-inset-bottom,0px))]">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-[#262626] text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#202024] font-bold text-xs transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/25 transition-all cursor-pointer text-center disabled:opacity-50"
              >
                <Trash2 size={14} />
                <span>{deleting ? 'Deleting...' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
