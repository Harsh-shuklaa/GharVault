import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Plus,
  HeartPulse,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  AlertTriangle,
  CreditCard,
  Building2,
  FileText,
  Users,
  HardDrive,
  UserPlus,
  KeyRound,
  Search,
  Eye,
  EyeOff,
  Share2,
  MessageCircle,
  ShieldCheck,
  Lock,
  Sparkles,
  Clock,
  ArrowUpRight,
  Car,
  GraduationCap,
  Plane,
  FileBadge,
  MapPin,
  Box,
  X,
  ListChecks,
  CheckCircle2,
  Bell,
  Smartphone
} from 'lucide-react';
import JoinFamilyModal from '../components/common/JoinFamilyModal';
import PersonalKycPromptModal from '../components/common/PersonalKycPromptModal';
import SendPushModal from '../components/common/SendPushModal';
import DashboardSkeleton from '../components/common/DashboardSkeleton';
import { usePushNotification } from '../context/PushNotificationContext';

export default function DashboardPage() {
  const { user, family, setIsEmergencyModalOpen } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const {
    isSupported,
    permission,
    isSubscribed,
    loading: pushLoading,
    requestPushPermission,
  } = usePushNotification();

  const [familyData, setFamilyData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isPersonalKycModalOpen, setIsPersonalKycModalOpen] = useState(false);
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);

  // Level 2 Interactive Filters & State
  const [selectedMemberId, setSelectedMemberId] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [revealedIds, setRevealedIds] = useState(new Set());
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [showKycDetails, setShowKycDetails] = useState(false);
  const [isPushBannerDismissed, setIsPushBannerDismissed] = useState(false);
  const [isPersonalKycBannerDismissed, setIsPersonalKycBannerDismissed] = useState(false);

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
      toast.error('Could not load dashboard data: ' + (err.message || 'Error'));
    } finally {
      setLoading(false);
    }
  };

  // Safe clipboard helper with visual and toast feedback
  const copyText = async (text, successMsg, idKey = null) => {
    if (!text) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      if (idKey) {
        setCopiedId(idKey);
        setTimeout(() => setCopiedId(null), 2000);
      }
      toast.success(successMsg || `Copied: ${text}`);
    } catch (e) {
      toast.error('Could not copy to clipboard');
    }
  };

  const handleCopyInviteCode = () => {
    const code = family?.inviteCode || 'GHAR-4892';
    copyText(code, 'Family Invite Code copied to clipboard!');
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const handleWhatsAppInvite = () => {
    const code = family?.inviteCode || 'GHAR-4892';
    const famName = family?.name || 'our Family';
    const msg = `Namaste! Join our ${famName} Vault on GharVault to securely access our family's Aadhaar, property papers, and insurance records.\n\nUse Invite Code: *${code}*\nLogin at: ${window.location.origin}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const toggleReveal = (docId, e) => {
    if (e) e.stopPropagation();
    setRevealedIds(prev => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
  };

  // Masking helper for Aadhaar, PAN, DL, etc.
  const getMaskedNumber = (num, docId) => {
    if (!num) return '•••• ••••';
    if (revealedIds.has(docId)) return num;

    const clean = num.trim();
    // If Aadhaar style 12 digits: XXXX XXXX 1234
    if (/^\d{12}$/.test(clean.replace(/\s+/g, ''))) {
      const digits = clean.replace(/\s+/g, '');
      return `•••• •••• ${digits.slice(-4)}`;
    }
    // If PAN style (5 letters, 4 digits, 1 letter)
    if (/^[A-Z]{5}\d{4}[A-Z]$/i.test(clean)) {
      return `${clean.slice(0, 2)}••••${clean.slice(-2).toUpperCase()}`;
    }
    // General mask: show first 2 and last 3 chars
    if (clean.length > 5) {
      return `${clean.slice(0, 2)}••••${clean.slice(-3)}`;
    }
    return `•••• ${clean.slice(-2)}`;
  };

  // 1-Tap 24h Share via WhatsApp
  const handleQuickWhatsAppShare = async (doc, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.createShareLink(doc._id, { durationMinutes: 1440 });
      const shareUrl = res.shareUrl || res.shareLink || `${window.location.origin}/share/${res.token}`;
      const msg = `Here is the secure 24-hour view link for *${doc.title}* from GharVault:\n${shareUrl}\n\n(Note: This link automatically expires after 24 hours for security).`;
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
      toast.success('24h safe link ready on WhatsApp!');
    } catch (err) {
      toast.error('Could not create share link: ' + (err.message || 'Error'));
    }
  };

  // Filtered documents by selected member and search query
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      // Member Filter
      if (selectedMemberId !== 'ALL') {
        const docMemberId = doc.assignedMember?._id || doc.assignedMemberId || doc.uploaderId;
        if (docMemberId?.toString() !== selectedMemberId.toString()) {
          return false;
        }
      }

      // Physical Location Filter
      if (selectedLocation !== 'ALL') {
        const textToMatch = `${doc.notes || ''} ${doc.tags?.join(' ') || ''}`.toLowerCase();
        if (!textToMatch.includes(selectedLocation.toLowerCase())) {
          return false;
        }
      }

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const combined = `${doc.title || ''} ${doc.category || ''} ${doc.documentNumber || ''} ${doc.assignedMember?.name || ''} ${doc.notes || ''} ${doc.tags?.join(' ') || ''}`.toLowerCase();
        if (!combined.includes(q)) return false;
      }

      return true;
    });
  }, [documents, selectedMemberId, selectedLocation, searchQuery]);

  // ID Cards Shelf: All documents with a non-empty documentNumber
  const idCards = useMemo(() => {
    return filteredDocuments.filter(d => d.documentNumber && d.documentNumber.trim() !== '');
  }, [filteredDocuments]);

  // Documents expiring soon (within next 30 days)
  const expiringDocs = useMemo(() => {
    return documents.filter(d => {
      if (!d.expiryDate) return false;
      const now = Date.now();
      const exp = new Date(d.expiryDate).getTime();
      return exp > now && exp <= now + 30 * 86400000;
    }).sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
  }, [documents]);

  // Physical Location Clusters (Ghar Ki Almari / Locker Tracker)
  const physicalLocations = useMemo(() => {
    const locMap = {
      'Master Almirah': { name: 'Master Bedroom Almirah', icon: '🗄️', count: 0, tag: 'almirah' },
      'Godrej Safe': { name: 'Locker Safe / Godrej Locker', icon: '🔒', count: 0, tag: 'locker' },
      'Study Desk': { name: 'Study Desk Folder Box', icon: '📁', count: 0, tag: 'folder' },
    };

    documents.forEach(d => {
      const text = `${d.notes || ''} ${d.tags?.join(' ') || ''}`.toLowerCase();
      if (text.includes('locker') || text.includes('safe')) {
        locMap['Godrej Safe'].count++;
      } else if (text.includes('study') || text.includes('desk') || text.includes('folder') || text.includes('box')) {
        locMap['Study Desk'].count++;
      } else {
        locMap['Master Almirah'].count++;
      }
    });

    return locMap;
  }, [documents]);

  // Dynamic Vault Security Score
  const vaultSecurityScore = useMemo(() => {
    let score = 50; // base score for AES-256 vault
    if (documents.length >= 3) score += 15;
    if (idCards.length >= 2) score += 15;
    if (members.length >= 2) score += 10;
    const mpinCount = documents.filter(d => d.isMpinProtected || d.isSensitive).length;
    if (mpinCount > 0) score += 10;
    return Math.min(score, 100);
  }, [documents, idCards, members]);

  // Essential Indian KYC / Basic IDs Onboarding Tracker
  const kycStatus = useMemo(() => {
    const targetDocs = selectedMemberId === 'ALL'
      ? documents
      : documents.filter(d => (d.assignedMember?._id || d.assignedMemberId || d.uploaderId)?.toString() === selectedMemberId.toString());

    const hasAadhaar = targetDocs.some(d => {
      const text = `${d.title || ''} ${d.category || ''} ${d.tags?.join(' ') || ''}`.toLowerCase();
      return text.includes('aadhaar') || text.includes('adhar') || text.includes('uid');
    });

    const hasPan = targetDocs.some(d => {
      const text = `${d.title || ''} ${d.category || ''} ${d.tags?.join(' ') || ''}`.toLowerCase();
      return text.includes('pan');
    });

    const hasLicenseOrVoter = targetDocs.some(d => {
      const text = `${d.title || ''} ${d.category || ''} ${d.tags?.join(' ') || ''}`.toLowerCase();
      return text.includes('driving') || text.includes('license') || text.includes('dl') || text.includes('voter') || text.includes('election') || text.includes('rc');
    });

    const hasHealth = targetDocs.some(d => {
      const text = `${d.title || ''} ${d.category || ''} ${d.tags?.join(' ') || ''}`.toLowerCase();
      return text.includes('health') || text.includes('ayushman') || text.includes('mediclaim') || text.includes('abha') || text.includes('insurance');
    });

    const items = [
      {
        id: 'aadhaar',
        title: 'Aadhaar Card',
        badge: '🇮🇳 Aadhaar (UIDAI)',
        done: hasAadhaar,
        icon: '🪪',
        category: 'ID Cards',
        desc: 'Essential 12-digit identity & biometric address KYC',
      },
      {
        id: 'pan',
        title: 'PAN Card',
        badge: '🔵 PAN Card',
        done: hasPan,
        icon: '💼',
        category: 'ID Cards',
        desc: 'Permanent Account Number for bank accounts & taxes',
      },
      {
        id: 'dl_voter',
        title: 'Driving License / Voter ID',
        badge: '🚗 DL or Voter ID',
        done: hasLicenseOrVoter,
        icon: '🚗',
        category: 'ID Cards',
        desc: 'Official photo ID & transport address verification',
      },
      {
        id: 'health',
        title: 'Health / Ayushman Card',
        badge: '🏥 ABHA / Health Card',
        done: hasHealth,
        icon: '🏥',
        category: 'Medical Records',
        desc: 'Cashless hospital admission & Mediclaim coverage',
      },
    ];

    const completedCount = items.filter(i => i.done).length;
    const progressPercent = Math.round((completedCount / items.length) * 100);
    const isComplete = completedCount === items.length;

    return { items, completedCount, total: items.length, progressPercent, isComplete };
  }, [documents, selectedMemberId]);

  const handleKycReminderWhatsApp = () => {
    const missing = kycStatus.items.filter(i => !i.done).map(i => i.title).join(', ');
    const memberName = selectedMemberId === 'ALL'
      ? (family?.name || 'Hamari Family')
      : (members.find(m => m._id === selectedMemberId)?.name || 'Family Member');
    const msg = `Namaste! GharVault par ${memberName} ke essential documents missing hain: ${missing}.\nKripya apne safe vault me inko jald upload karein ya photo bhejein taaki emergency me sabhi IDs ready rahein.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Is current logged-in user a verified user (with real email / Google identity)?
  const isVerifiedUser = useMemo(() => {
    return Boolean(
      user?.googleId ||
      (user?.email && !user.email.includes('@family.ghar') && !user.email.includes('@gharvault.local'))
    );
  }, [user]);

  // Personal KYC Status specifically for the logged-in user
  const myPersonalKycStatus = useMemo(() => {
    const myId = user?._id || user?.id;
    if (!myId) {
      return { isComplete: true, missing: [], completedCount: 4, total: 4, items: [] };
    }

    const myDocs = documents.filter((d) => {
      const docMemberId = d.assignedMember?._id || d.assignedMemberId || d.uploaderId;
      return docMemberId?.toString() === myId.toString();
    });

    const hasAadhaar = myDocs.some((d) => {
      const text = `${d.title || ''} ${d.category || ''} ${d.tags?.join(' ') || ''}`.toLowerCase();
      return text.includes('aadhaar') || text.includes('adhar') || text.includes('uid');
    });

    const hasPan = myDocs.some((d) => {
      const text = `${d.title || ''} ${d.category || ''} ${d.tags?.join(' ') || ''}`.toLowerCase();
      return text.includes('pan');
    });

    const hasLicenseOrVoter = myDocs.some((d) => {
      const text = `${d.title || ''} ${d.category || ''} ${d.tags?.join(' ') || ''}`.toLowerCase();
      return text.includes('driving') || text.includes('license') || text.includes('dl') || text.includes('voter') || text.includes('election') || text.includes('rc');
    });

    const hasHealth = myDocs.some((d) => {
      const text = `${d.title || ''} ${d.category || ''} ${d.tags?.join(' ') || ''}`.toLowerCase();
      return text.includes('health') || text.includes('ayushman') || text.includes('mediclaim') || text.includes('abha') || text.includes('insurance');
    });

    const items = [
      {
        id: 'aadhaar',
        title: 'Aadhaar Card',
        badge: '🇮🇳 Aadhaar (UIDAI)',
        done: hasAadhaar,
        icon: '🪪',
        category: 'ID Cards',
      },
      {
        id: 'pan',
        title: 'PAN Card',
        badge: '🔵 PAN Card',
        done: hasPan,
        icon: '💼',
        category: 'ID Cards',
      },
      {
        id: 'dl_voter',
        title: 'Driving License / Voter ID',
        badge: '🚗 DL or Voter ID',
        done: hasLicenseOrVoter,
        icon: '🚗',
        category: 'ID Cards',
      },
      {
        id: 'health',
        title: 'Health / Ayushman Card',
        badge: '🏥 ABHA / Health Card',
        done: hasHealth,
        icon: '🏥',
        category: 'Medical Records',
      },
    ];

    const missing = items.filter((i) => !i.done);
    const completedCount = items.filter((i) => i.done).length;
    const isComplete = missing.length === 0;

    return {
      isComplete,
      missing,
      completedCount,
      total: items.length,
      items,
    };
  }, [documents, user]);

  // Quick 4-Category Counts (Pehchaan, Health, Bank & Property, Gadi & Bills)
  const categoryCounts = useMemo(() => {
    const activeDocs = selectedMemberId === 'ALL'
      ? documents
      : documents.filter(d => (d.assignedMember?._id || d.assignedMemberId || d.uploaderId)?.toString() === selectedMemberId.toString());

    const idCount = activeDocs.filter(d => {
      const c = (d.category || '').toLowerCase();
      const t = (d.title || '').toLowerCase();
      return c.includes('id') || c.includes('identity') || t.includes('aadhaar') || t.includes('pan') || t.includes('voter') || t.includes('license');
    }).length;

    const healthCount = activeDocs.filter(d => {
      const c = (d.category || '').toLowerCase();
      const t = (d.title || '').toLowerCase();
      return c.includes('health') || c.includes('medical') || t.includes('ayushman') || t.includes('hospital') || t.includes('insurance');
    }).length;

    const bankCount = activeDocs.filter(d => {
      const c = (d.category || '').toLowerCase();
      const t = (d.title || '').toLowerCase();
      return c.includes('bank') || c.includes('property') || c.includes('financial') || t.includes('khata') || t.includes('registry') || t.includes('passbook');
    }).length;

    const billsCount = Math.max(0, activeDocs.length - idCount - healthCount - bankCount);

    return { idCount, healthCount, bankCount, billsCount };
  }, [documents, selectedMemberId]);

  // Auto-prompt personal KYC modal once per session if logged-in user is missing documents
  useEffect(() => {
    if (loading) return;
    const myId = user?._id || user?.id;
    if (!myId || !isVerifiedUser) return;

    if (!myPersonalKycStatus.isComplete) {
      const dismissedKey = 'gharvault_dismissed_kyc_' + myId;
      const isDismissed = sessionStorage.getItem(dismissedKey);
      if (!isDismissed) {
        setIsPersonalKycModalOpen(true);
      }
    } else {
      // If complete, ensure modal is closed and will not trigger
      setIsPersonalKycModalOpen(false);
    }
  }, [loading, isVerifiedUser, myPersonalKycStatus.isComplete, user?._id, user?.id]);

  const handleDismissPersonalKyc = () => {
    const myId = user?._id || user?.id;
    if (myId) {
      sessionStorage.setItem('gharvault_dismissed_kyc_' + myId, 'true');
    }
    setIsPersonalKycModalOpen(false);
  };

  // Helper to check KYC status for any member
  const getMemberKycStatus = (memberId) => {
    const memberDocs = documents.filter(
      (d) => (d.assignedMember?._id || d.assignedMemberId || d.uploaderId)?.toString() === memberId?.toString()
    );
    const hasAadhaar = memberDocs.some((d) => {
      const t = `${d.title || ''} ${d.category || ''} ${d.tags?.join(' ') || ''}`.toLowerCase();
      return t.includes('aadhaar') || t.includes('adhar') || t.includes('uid');
    });
    const hasPan = memberDocs.some((d) => {
      const t = `${d.title || ''} ${d.category || ''} ${d.tags?.join(' ') || ''}`.toLowerCase();
      return t.includes('pan');
    });
    const hasDl = memberDocs.some((d) => {
      const t = `${d.title || ''} ${d.category || ''} ${d.tags?.join(' ') || ''}`.toLowerCase();
      return t.includes('driving') || t.includes('license') || t.includes('dl') || t.includes('voter') || t.includes('rc');
    });
    const hasHealth = memberDocs.some((d) => {
      const t = `${d.title || ''} ${d.category || ''} ${d.tags?.join(' ') || ''}`.toLowerCase();
      return t.includes('health') || t.includes('ayushman') || t.includes('mediclaim') || t.includes('abha');
    });
    return hasAadhaar && hasPan && hasDl && hasHealth;
  };

  // Card theme helper
  const getCardTheme = (doc) => {
    const text = `${doc.title || ''} ${doc.category || ''} ${doc.tags?.join(' ') || ''}`.toLowerCase();
    if (text.includes('aadhaar') || text.includes('adhar') || text.includes('uid')) {
      return {
        type: 'aadhaar',
        badge: '🇮🇳 AADHAAR CARD',
        dept: 'Unique Identification Authority of India',
        gradient: 'from-[#FF9933]/15 via-white/5 to-[#138808]/15',
        border: 'border-orange-500/30 hover:border-orange-500/60',
        accentPill: 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30',
        stripe: 'h-1 bg-gradient-to-r from-[#FF9933] via-white to-[#138808]',
      };
    }
    if (text.includes('pan') || text.includes('income tax')) {
      return {
        type: 'pan',
        badge: '🔵 INCOME TAX PAN',
        dept: 'Income Tax Department • Govt of India',
        gradient: 'from-blue-600/15 via-blue-500/5 to-cyan-500/10',
        border: 'border-blue-500/30 hover:border-blue-500/60',
        accentPill: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30',
        stripe: 'h-1 bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-400',
      };
    }
    if (text.includes('driving') || text.includes('license') || text.includes('dl') || text.includes('rc') || text.includes('vehicle')) {
      return {
        type: 'vehicle',
        badge: '🚗 TRANSPORT DEPT • DL / RC',
        dept: 'Ministry of Road Transport & Highways',
        gradient: 'from-amber-500/15 via-amber-400/5 to-yellow-600/10',
        border: 'border-amber-500/30 hover:border-amber-500/60',
        accentPill: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30',
        stripe: 'h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-500',
      };
    }
    if (text.includes('health') || text.includes('medical') || text.includes('insurance') || text.includes('ayushman') || text.includes('abha')) {
      return {
        type: 'health',
        badge: '🏥 HEALTH & AYUSHMAN',
        dept: 'National Health Authority • Cashless TPA',
        gradient: 'from-emerald-500/15 via-teal-500/5 to-emerald-600/10',
        border: 'border-emerald-500/30 hover:border-[#3ECF8E]/60',
        accentPill: 'bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-800 dark:text-[#3ECF8E] border border-emerald-200 dark:border-[#3ECF8E]/30',
        stripe: 'h-1 bg-gradient-to-r from-emerald-600 via-[#3ECF8E] to-teal-400',
      };
    }
    if (text.includes('passport') || text.includes('visa')) {
      return {
        type: 'passport',
        badge: '🛂 PASSPORT OF INDIA',
        dept: 'Ministry of External Affairs',
        gradient: 'from-indigo-600/15 via-indigo-500/5 to-blue-700/10',
        border: 'border-indigo-500/30 hover:border-indigo-500/60',
        accentPill: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30',
        stripe: 'h-1 bg-gradient-to-r from-indigo-700 via-indigo-500 to-blue-600',
      };
    }
    return {
      type: 'default',
      badge: '📄 OFFICIAL ID',
      dept: 'Verified Family Vault Document',
      gradient: 'from-slate-500/10 via-slate-400/5 to-slate-600/10',
      border: 'border-slate-200 dark:border-[#2E2E2E] hover:border-slate-400 dark:hover:border-[#444]',
      accentPill: 'bg-slate-100 dark:bg-[#262626] text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-[#333]',
      stripe: 'h-1 bg-gradient-to-r from-slate-400 via-slate-300 to-slate-500',
    };
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="max-w-[1400px] mx-auto p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-5 font-sans pb-24 lg:pb-8">
      {/* ================= 1. HEADER & PERSONA SWITCHER ================= */}
      <div className="bg-white dark:bg-[#18181B] rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-[#27272A] shadow-xs transition-colors space-y-4">
        {/* Top Bar: Family Name + Status + Quick Desktop Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] dark:bg-[#3ECF8E] animate-pulse shrink-0" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                {family?.name || `${user?.name?.split(' ')[0] || 'Parivaar'}'s Vault`}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-800 dark:text-[#3ECF8E] border border-emerald-200 dark:border-[#3ECF8E]/20">
                <ShieldCheck size={11} />
                <span>100% Surakshit</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 truncate">
              Aapke parivaar ke sabhi zaroori kagaz ek jagah surakshit.
            </p>
          </div>

          {/* Quick Header Launchers (Desktop & Tablet) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsEmergencyModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <HeartPulse size={14} className="text-red-600 dark:text-red-400" />
              <span>Emergency Locker</span>
            </button>

            <Link
              to="/vault/upload"
              className="px-3.5 py-1.5 rounded-xl bg-[#10B981] hover:bg-[#059669] dark:bg-[#3ECF8E] dark:hover:bg-[#34B27B] text-white dark:text-[#121212] text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>+ Naya Kagaz</span>
            </Link>
          </div>
        </div>

        {/* Level 2: Family Persona Story Avatars (Instagram / Apple Style Horizontal Scroll) */}
        <div className="pt-2 border-t border-slate-100 dark:border-[#27272A]">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 mb-2 font-medium">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
              <span>👨‍👩‍👧 Kiske kagaz dekhne hain? (Tap to filter)</span>
            </span>
            {selectedMemberId !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedMemberId('ALL')}
                className="text-emerald-700 dark:text-[#3ECF8E] hover:underline text-[11px] font-bold cursor-pointer"
              >
                Sabhi Dekhein ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
            {/* "All Vault" Story Circle */}
            <button
              type="button"
              onClick={() => setSelectedMemberId('ALL')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                selectedMemberId === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-black border-slate-900 dark:border-white shadow-xs'
                  : 'bg-slate-50 dark:bg-[#141414] text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-[#27272A] hover:border-slate-300 dark:hover:border-neutral-700'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] flex items-center justify-center text-[10px] font-bold">
                ★
              </span>
              <span>Sabhi Kagaz</span>
              <span className="text-[10px] opacity-70 font-mono">({documents.length})</span>
            </button>

            {/* Individual Member Story Pills */}
            {members.map(member => {
              const isSelected = selectedMemberId.toString() === member._id?.toString();
              const memberDocCount = documents.filter(
                d => (d.assignedMember?._id || d.assignedMemberId || d.uploaderId)?.toString() === member._id?.toString()
              ).length;
              const isMemberKycDone = getMemberKycStatus(member._id);

              return (
                <button
                  key={member._id}
                  type="button"
                  onClick={() => setSelectedMemberId(member._id)}
                  className={`flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#10B981] dark:border-[#3ECF8E] bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-900 dark:text-[#3ECF8E] ring-2 ring-[#3ECF8E]/30 shadow-xs'
                      : 'bg-slate-50 dark:bg-[#141414] text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-[#27272A] hover:border-slate-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={
                        member.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'Member')}&background=3ECF8E&color=000&size=64`
                      }
                      alt={member.name}
                      className="w-5 h-5 rounded-full object-cover border border-slate-200 dark:border-neutral-700"
                    />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-1 ring-white dark:ring-[#141414] ${
                        isMemberKycDone ? 'bg-[#10B981] dark:bg-[#3ECF8E]' : 'bg-amber-500'
                      }`}
                      title={isMemberKycDone ? 'Essential IDs Uploaded' : 'IDs Pending'}
                    />
                  </div>
                  <span className="truncate max-w-[100px]">{member.name?.split(' ')[0] || 'Member'}</span>
                  {member.bloodGroup && (
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 font-bold">
                      {member.bloodGroup}
                    </span>
                  )}
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                      isMemberKycDone
                        ? 'bg-emerald-100 dark:bg-[#3ECF8E]/20 text-emerald-800 dark:text-[#3ECF8E]'
                        : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    {isMemberKycDone ? '✓ Ready' : 'Pending'}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono">
                    ({memberDocCount})
                  </span>
                </button>
              );
            })}

            {/* + Add Member Shortcut */}
            <Link
              to="/family"
              className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-slate-300 dark:border-neutral-700 hover:border-emerald-500 text-slate-600 dark:text-neutral-400 text-xs font-semibold shrink-0 transition-colors"
            >
              <UserPlus size={13} className="text-[#10B981] dark:text-[#3ECF8E]" />
              <span>+ Member</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ================= 2. UNIVERSAL FAST SEARCH BAR ================= */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-neutral-500">
          <Search size={16} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Aadhaar, PAN, RC, Insurance, Bijli Bill ya kagaz ka naam dhoondhein..."
          className="w-full pl-10 pr-9 py-2.5 sm:py-3 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 text-xs sm:text-sm focus:outline-hidden focus:border-[#10B981] dark:focus:border-[#3ECF8E] transition-all shadow-2xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* ================= 3. 4 BIG VISUAL FAMILY CATEGORIES (PAPA & FAMILY FIRST) ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Category 1: ID Cards */}
        <Link
          to={`/vault?category=${encodeURIComponent('ID Cards')}${selectedMemberId !== 'ALL' ? `&member=${selectedMemberId}` : ''}`}
          className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-emerald-500/20 dark:border-[#27272A] hover:border-emerald-500 shadow-2xs hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-[#3ECF8E]/10 text-[#10B981] dark:text-[#3ECF8E] flex items-center justify-center text-xl shadow-xs group-hover:scale-105 transition-transform">
              🪪
            </div>
            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-[#3ECF8E]/20 text-emerald-800 dark:text-[#3ECF8E]">
              {categoryCounts.idCount} kagaz
            </span>
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#10B981] dark:group-hover:text-[#3ECF8E] transition-colors">
              Pehchaan (ID Cards)
            </h3>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 truncate">
              Aadhaar, PAN, Voter, DL
            </p>
          </div>
        </Link>

        {/* Category 2: Health & Medical */}
        <Link
          to={`/vault?category=${encodeURIComponent('Medical & Health')}${selectedMemberId !== 'ALL' ? `&member=${selectedMemberId}` : ''}`}
          className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-rose-500/20 dark:border-[#27272A] hover:border-rose-500 shadow-2xs hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xl shadow-xs group-hover:scale-105 transition-transform">
              🏥
            </div>
            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300">
              {categoryCounts.healthCount} kagaz
            </span>
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
              Health & Dawaai
            </h3>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 truncate">
              Ayushman, Reports, Policy
            </p>
          </div>
        </Link>

        {/* Category 3: Bank & Property */}
        <Link
          to={`/vault?category=${encodeURIComponent('Bank & Property')}${selectedMemberId !== 'ALL' ? `&member=${selectedMemberId}` : ''}`}
          className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-blue-500/20 dark:border-[#27272A] hover:border-blue-500 shadow-2xs hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl shadow-xs group-hover:scale-105 transition-transform">
              🏦
            </div>
            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300">
              {categoryCounts.bankCount} kagaz
            </span>
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Bank aur Property
            </h3>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 truncate">
              Khata, Registry, Passbook
            </p>
          </div>
        </Link>

        {/* Category 4: Gadi aur Bills */}
        <Link
          to={`/vault?category=${encodeURIComponent('Vehicles & Transport')}${selectedMemberId !== 'ALL' ? `&member=${selectedMemberId}` : ''}`}
          className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-amber-500/20 dark:border-[#27272A] hover:border-amber-500 shadow-2xs hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl shadow-xs group-hover:scale-105 transition-transform">
              🚗
            </div>
            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300">
              {categoryCounts.billsCount} kagaz
            </span>
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              Gadi aur Bills
            </h3>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 truncate">
              RC, Insurance, Bijli Bill
            </p>
          </div>
        </Link>
      </div>

      {/* ================= GENTLE ALERT CHIPS (COMPACT & NON-SCARY) ================= */}
      <div className="space-y-2">
        {/* Push Notification Opt-in Chip */}
        {isSupported && !isSubscribed && permission === 'default' && !isPushBannerDismissed && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-2.5 text-xs text-slate-800 dark:text-neutral-200 animate-fadeIn">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base shrink-0">📲</span>
              <span className="truncate">Naye family documents aane par phone par notification paayein</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={requestPushPermission}
                disabled={pushLoading}
                className="px-2.5 py-1 rounded-lg bg-[#10B981] hover:bg-emerald-600 text-white dark:text-[#121212] font-bold text-[11px] cursor-pointer"
              >
                {pushLoading ? '...' : 'Allow'}
              </button>
              <button
                type="button"
                onClick={() => setIsPushBannerDismissed(true)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                title="Dismiss"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Urgent Expiry Radar Chip */}
        {expiringDocs.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200 animate-fadeIn">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base shrink-0">⏰</span>
              <span className="truncate">
                <strong>{expiringDocs[0].title}</strong> agle {Math.ceil((new Date(expiringDocs[0].expiryDate) - Date.now()) / 86400000)} din mein expire ho raha hai!
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const doc = expiringDocs[0];
                  const msg = `⚠️ Reminder: Hamara family document *${doc.title}* expiring on ${new Date(doc.expiryDate).toLocaleDateString()}. Please renewal karwayein.`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-[#3ECF8E] font-bold text-[11px] flex items-center gap-1 border border-emerald-300 dark:border-emerald-500/30 cursor-pointer"
              >
                <MessageCircle size={12} />
                <span>WhatsApp Alert</span>
              </button>
              <Link
                to={`/vault/documents/${expiringDocs[0]._id}`}
                className="px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-black font-bold text-[11px]"
              >
                Kagaz Dekhein →
              </Link>
            </div>
          </div>
        )}

        {/* Personal KYC Gentle Chip */}
        {isVerifiedUser && !myPersonalKycStatus.isComplete && !isPersonalKycBannerDismissed && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200 animate-fadeIn">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base shrink-0">💡</span>
              <div className="min-w-0">
                <span className="font-bold">{user?.name?.split(' ')[0] || 'Aapke'} zaroori kagaz baaki hain</span>
                <span className="text-slate-500 dark:text-neutral-400 ml-1.5 hidden sm:inline">
                  ({myPersonalKycStatus.missing.map(m => m.title).join(', ')})
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsPersonalKycModalOpen(true)}
                className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] shadow-xs cursor-pointer"
              >
                + Upload Karein
              </button>
              <button
                type="button"
                onClick={() => setIsPersonalKycBannerDismissed(true)}
                className="p-1 text-amber-700 dark:text-amber-400 hover:text-amber-950 dark:hover:text-white cursor-pointer"
                title="Dismiss"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Essential Family KYC Checklist (Collapsible Strip) */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-[#27272A] bg-white dark:bg-[#18181B] p-3 sm:p-4 shadow-2xs transition-all">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-lg shrink-0">{kycStatus.isComplete ? '🛡️' : '📋'}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {kycStatus.isComplete ? 'Ghar ke Saare Zaroori Kagaz Uploaded' : 'Ghar ke Zaroori Kagaz (Essential IDs)'}
                  </h3>
                  <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                    kycStatus.isComplete
                      ? 'bg-emerald-100 dark:bg-[#3ECF8E]/20 text-emerald-800 dark:text-[#3ECF8E]'
                      : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
                  }`}>
                    {kycStatus.completedCount} of {kycStatus.total} Complete ({kycStatus.progressPercent}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {!kycStatus.isComplete && (
                <button
                  type="button"
                  onClick={handleKycReminderWhatsApp}
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-800 dark:text-[#3ECF8E] text-[11px] font-bold border border-emerald-200 dark:border-[#3ECF8E]/30 cursor-pointer"
                >
                  <MessageCircle size={12} />
                  <span>Family Reminder</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowKycDetails(prev => !prev)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#252525] flex items-center gap-1 cursor-pointer"
              >
                <span>{showKycDetails ? 'Chupayein' : 'Checklist Dekhein'}</span>
                {showKycDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-2.5 w-full h-1.5 rounded-full bg-slate-100 dark:bg-[#252525] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                kycStatus.isComplete
                  ? 'bg-gradient-to-r from-emerald-500 to-[#3ECF8E]'
                  : 'bg-gradient-to-r from-amber-500 via-emerald-500 to-[#3ECF8E]'
              }`}
              style={{ width: `${Math.max(kycStatus.progressPercent, 5)}%` }}
            />
          </div>

          {/* Collapsible 4 Checklist Cards */}
          {showKycDetails && (
            <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-[#27272A] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 animate-fadeIn">
              {kycStatus.items.map(item => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                    item.done
                      ? 'bg-emerald-50/50 dark:bg-[#3ECF8E]/5 border-emerald-200/80 dark:border-[#3ECF8E]/20'
                      : 'bg-slate-50 dark:bg-[#141414] border-dashed border-slate-300 dark:border-[#2D2D2D]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-base">{item.icon}</span>
                      {item.done ? (
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-[#3ECF8E] flex items-center gap-1 bg-emerald-100 dark:bg-[#3ECF8E]/20 px-2 py-0.5 rounded-full">
                          <CheckCircle2 size={11} />
                          <span>Uploaded</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 rounded-full">
                          Pending
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 leading-snug">
                      {item.desc}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-[#262626]">
                    {item.done ? (
                      <Link to="/vault" className="text-[11px] font-bold text-emerald-700 dark:text-[#3ECF8E] hover:underline flex items-center justify-between">
                        <span>Kagaz Dekhein</span>
                        <ChevronRight size={12} />
                      </Link>
                    ) : (
                      <Link
                        to={`/vault/upload?category=${encodeURIComponent(item.category)}&title=${encodeURIComponent(item.title)}${
                          selectedMemberId !== 'ALL' ? `&member=${selectedMemberId}` : ''
                        }`}
                        className="w-full py-1.5 px-2 rounded-lg bg-[#10B981] hover:bg-emerald-600 dark:bg-[#3ECF8E] dark:hover:bg-[#34B27B] text-white dark:text-[#121212] text-xs font-bold flex items-center justify-center gap-1"
                      >
                        <Plus size={12} strokeWidth={2.5} />
                        <span>Upload Karein</span>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ================= 4. MAIN BENTO GRID (DESKTOP 2-COLUMN, MOBILE FLUID) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* ================= LEFT MAIN COLUMN (Col 1 to 7) ================= */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-5">
          {/* Bento: The Indian Digital Wallet (Apple Wallet Style Snap Carousel on Mobile, Grid on Desktop) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-[#10B981] dark:text-[#3ECF8E]" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  🪪 Ghar ke Zaroori ID Cards (1-Tap Copy)
                </h2>
              </div>
              <span className="text-[11px] font-mono text-slate-400 dark:text-neutral-500">
                {idCards.length} Cards Available
              </span>
            </div>

            {idCards.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#141414] text-slate-400 dark:text-neutral-500 flex items-center justify-center mx-auto">
                  <CreditCard size={20} />
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-neutral-200">No ID Numbers Found</div>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400 max-w-xs mx-auto">
                  Upload Aadhaar, PAN, or Driving License to enable 1-tap instant number copying.
                </p>
                <Link
                  to="/vault/upload"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] text-xs font-bold mt-1"
                >
                  <Plus size={13} />
                  <span>Upload ID Card</span>
                </Link>
              </div>
            ) : (
              /* Mobile: Horizontal Swipeable Snap Carousel | Desktop: 2-Column Cards Grid */
              <div className="flex lg:grid lg:grid-cols-2 overflow-x-auto no-scrollbar gap-3.5 pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 snap-x snap-mandatory">
                {idCards.map(doc => {
                  const theme = getCardTheme(doc);
                  const isRevealed = revealedIds.has(doc._id);
                  const displayNum = getMaskedNumber(doc.documentNumber, doc._id);

                  return (
                    <div
                      key={doc._id}
                      onClick={() => navigate(`/vault/documents/${doc._id}`)}
                      className={`w-[85vw] max-w-[340px] lg:w-auto shrink-0 snap-center rounded-2xl bg-white dark:bg-[#18181B] border ${theme.border} p-3.5 sm:p-4 shadow-xs relative overflow-hidden transition-all hover:shadow-md cursor-pointer flex flex-col justify-between space-y-3 group`}
                    >
                      {/* Top Accent Gradient Stripe */}
                      <div className={`absolute top-0 inset-x-0 ${theme.stripe}`} />

                      {/* Card Header: Official Dept & Category Badge */}
                      <div className="flex items-start justify-between gap-2 pt-1">
                        <div className="min-w-0">
                          <span className={`inline-block text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${theme.accentPill}`}>
                            {theme.badge}
                          </span>
                          <h3 className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate">
                            {doc.title}
                          </h3>
                          <p className="text-[10px] text-slate-500 dark:text-neutral-400 truncate">
                            {doc.assignedMember?.name || user?.name || 'Family Member'}
                          </p>
                        </div>

                        {/* MPIN Lock Indicator if sensitive */}
                        {(doc.isMpinProtected || doc.isSensitive) && (
                          <span className="p-1 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0" title="MPIN Protected">
                            <Lock size={12} />
                          </span>
                        )}
                      </div>

                      {/* Number Display Box with Eye Reveal + Copy Button */}
                      <div className="pt-2 border-t border-slate-100 dark:border-[#27272A] space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-neutral-500 font-medium">
                          <span>DOCUMENT NUMBER:</span>
                          {doc.expiryDate && (
                            <span className="font-mono">Exp: {new Date(doc.expiryDate).toLocaleDateString()}</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-[#121212] border border-slate-200/80 dark:border-[#27272A]">
                          <span className="font-mono font-bold text-xs sm:text-sm tracking-widest text-slate-900 dark:text-[#3ECF8E] truncate">
                            {displayNum}
                          </span>

                          <div className="flex items-center gap-1 shrink-0">
                            {/* Eye Reveal Toggle */}
                            <button
                              type="button"
                              onClick={(e) => toggleReveal(doc._id, e)}
                              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-[#262626] text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                              title={isRevealed ? 'Hide Number' : 'Reveal Number'}
                            >
                              {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>

                            {/* 1-Tap Copy Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyText(doc.documentNumber, `Copied ${doc.title} number!`, doc._id);
                              }}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                copiedId === doc._id
                                  ? 'bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212]'
                                  : 'bg-emerald-50 dark:bg-[#3ECF8E]/10 hover:bg-emerald-100 dark:hover:bg-[#3ECF8E]/20 text-emerald-800 dark:text-[#3ECF8E] border border-emerald-200 dark:border-[#3ECF8E]/30'
                              }`}
                            >
                              {copiedId === doc._id ? <Check size={11} /> : <Copy size={11} />}
                              <span>{copiedId === doc._id ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Quick 24h Share Action */}
                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={(e) => handleQuickWhatsAppShare(doc, e)}
                            className="text-[10px] font-bold text-emerald-700 dark:text-[#3ECF8E] hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <MessageCircle size={11} />
                            <span>Share 24h via WhatsApp</span>
                          </button>
                          <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono">
                            {(doc.fileSize / (1024 * 1024)).toFixed(1)} MB
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bento: Recent Documents & Activity List */}
          <div className="bg-white dark:bg-[#18181B] rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-[#27272A] shadow-xs space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText size={16} className="text-[#10B981] dark:text-[#3ECF8E]" />
                  <span>📄 Haal hi ke Kagaz (Recent Documents)</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                  Ghar ke haal hi mein upload huye kagaz
                </p>
              </div>

              <Link
                to="/vault"
                className="text-xs font-bold text-emerald-700 dark:text-[#3ECF8E] hover:underline inline-flex items-center gap-1"
              >
                <span>View All ({filteredDocuments.length})</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            {filteredDocuments.length === 0 ? (
              <div className="py-8 text-center text-slate-400 dark:text-neutral-500 text-xs">
                No documents found matching the current member or search filter.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-[#27272A]">
                {filteredDocuments.slice(0, 5).map(doc => (
                  <div
                    key={doc._id}
                    onClick={() => navigate(`/vault/documents/${doc._id}`)}
                    className="py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/[0.03] px-2 rounded-xl transition-colors cursor-pointer group gap-2"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#141414] border border-slate-200 dark:border-[#27272A] text-[#10B981] dark:text-[#3ECF8E] flex items-center justify-center shrink-0">
                        {doc.category === 'ID Cards' ? (
                          <CreditCard size={15} />
                        ) : doc.category === 'Medical & Health' ? (
                          <HeartPulse size={15} />
                        ) : (
                          <FileText size={15} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#10B981] dark:group-hover:text-[#3ECF8E] truncate">
                          {doc.title}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-neutral-400 flex items-center gap-1.5 mt-0.5 truncate">
                          <span className="font-medium">{doc.category}</span>
                          {doc.assignedMember && <span>• {doc.assignedMember.name}</span>}
                          {doc.notes && <span className="text-amber-700 dark:text-amber-400 truncate">• 🗄️ {doc.notes}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {doc.documentNumber && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyText(doc.documentNumber, `Copied ${doc.title} number!`, doc._id);
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#262626] dark:hover:bg-[#333] text-slate-700 dark:text-neutral-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === doc._id ? <Check size={11} className="text-[#10B981] dark:text-[#3ECF8E]" /> : <Copy size={11} />}
                          <span className="hidden sm:inline">{copiedId === doc._id ? 'Copied' : 'Copy'}</span>
                        </button>
                      )}
                      <ChevronRight size={15} className="text-slate-400 group-hover:text-[#10B981] dark:text-[#8F8F8F] dark:group-hover:text-[#3ECF8E] transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT UTILITY COLUMN (Col 8 to 12) ================= */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-5">
          {/* Bento: Physical Paper Locator (Ghar Ki Almari / Locker Tracker) */}
          <div className="bg-white dark:bg-[#18181B] rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-[#27272A] shadow-xs space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Box size={16} className="text-amber-600 dark:text-amber-400" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  🗄️ Ghar ki Almari / Locker Locator
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 font-bold">
                Ghar Ka Locker
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
              Asli kagaz ghar mein kahan rakhe hain (Almari, Drawer, Safe) — yahan se pata karein.
            </p>

            <div className="grid grid-cols-1 gap-2">
              {Object.entries(physicalLocations).map(([key, loc]) => {
                const isSelected = selectedLocation === loc.tag;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedLocation(isSelected ? 'ALL' : loc.tag)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-amber-500/60 bg-amber-500/10 text-amber-900 dark:text-amber-200'
                        : 'border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121212] hover:border-slate-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0">{loc.icon}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {loc.name}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-neutral-400 truncate">
                          {loc.count > 0 ? `${loc.count} documents tagged here` : 'Tap to tag original papers'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400 dark:text-neutral-500 shrink-0">
                      {isSelected ? 'Active ✕' : `${loc.count} docs →`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bento: Family Vault Hub & Invite Code */}
          <div className="bg-emerald-50/70 dark:bg-[#18181B] rounded-2xl p-4 sm:p-5 border border-emerald-200/80 dark:border-[#27272A] shadow-xs space-y-3.5 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus size={16} className="text-[#10B981] dark:text-[#3ECF8E]" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  👨‍👩‍👧 Parivaar ko Jodein (Invite Code)
                </h3>
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-[#3ECF8E]/20 text-emerald-800 dark:text-[#3ECF8E] font-bold">
                Sync All Phones
              </span>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-neutral-400 leading-relaxed">
              Ghar ke sabhi phones par ye code daal kar sync karein, taaki sabhi log kagaz dekh sakein.
            </p>

            {/* Invite Code Box & Buttons */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#27272A] flex items-center justify-between gap-2">
              <code className="font-mono font-bold text-sm tracking-widest text-slate-900 dark:text-[#3ECF8E]">
                {family?.inviteCode || 'GHAR-4892'}
              </code>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyInviteCode}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#262626] dark:hover:bg-[#333] text-slate-800 dark:text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  {copiedInvite ? <Check size={12} className="text-[#10B981] dark:text-[#3ECF8E]" /> : <Copy size={12} />}
                  <span>{copiedInvite ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleWhatsAppInvite}
                  className="px-2.5 py-1.5 rounded-lg bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Invite via WhatsApp"
                >
                  <MessageCircle size={13} />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px]">
              <button
                type="button"
                onClick={() => setIsJoinModalOpen(true)}
                className="text-slate-600 dark:text-neutral-400 hover:text-emerald-700 dark:hover:text-[#3ECF8E] font-bold underline cursor-pointer"
              >
                Join Another Family Code →
              </button>
              <Link to="/family" className="text-emerald-700 dark:text-[#3ECF8E] font-bold hover:underline">
                Manage {members.length} Members →
              </Link>
            </div>
          </div>

          {/* Bento: Vault Health & Free Tier Storage Gauge */}
          <div className="bg-white dark:bg-[#18181B] rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-[#27272A] shadow-xs space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive size={16} className="text-[#10B981] dark:text-[#3ECF8E]" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  📦 Surakshit Storage (50 GB Free)
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-[#3ECF8E]">
                {vaultSecurityScore}% Secure
              </span>
            </div>

            {/* Storage Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 font-medium">
                <span>
                  {familyData?.totalSizeBytes ? (familyData.totalSizeBytes / (1024 * 1024)).toFixed(1) + ' MB' : '0 MB'} used
                </span>
                <span className="font-mono">50 GB Free Tier</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#27272A] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#10B981] to-[#3ECF8E] rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      Math.max(((familyData?.totalSizeBytes || 1024 * 1024 * 5) / (50 * 1024 * 1024 * 1024)) * 100, 2),
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-[#27272A] text-center">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#121212]">
                <div className="text-xs font-bold text-slate-900 dark:text-white">{documents.length}</div>
                <div className="text-[10px] text-slate-400 dark:text-neutral-500">Docs</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#121212]">
                <div className="text-xs font-bold text-slate-900 dark:text-white">{members.length}</div>
                <div className="text-[10px] text-slate-400 dark:text-neutral-500">Members</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#121212]">
                <div className="text-xs font-bold text-emerald-700 dark:text-[#3ECF8E]">Active</div>
                <div className="text-[10px] text-slate-400 dark:text-neutral-500">MPIN Guard</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 5. STICKY MOBILE ACTION BAR (THUMB ZONE) ================= */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 dark:bg-[#141414]/95 backdrop-blur-md border-t border-slate-200 dark:border-[#262626] p-2.5 flex items-center justify-between gap-2.5 z-40 lg:hidden shadow-xl">
        <Link
          to="/vault/upload"
          className="flex-1 min-h-[44px] rounded-xl bg-[#10B981] hover:bg-emerald-600 dark:bg-[#3ECF8E] dark:hover:bg-[#34B27B] text-white dark:text-[#121212] font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Scan / Upload</span>
        </Link>

        <button
          type="button"
          onClick={() => setIsEmergencyModalOpen(true)}
          className="flex-1 min-h-[44px] rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform"
        >
          <HeartPulse size={16} />
          <span>Emergency Card</span>
        </button>
      </div>

      {/* Personal KYC Prompt Modal for Verified Member */}
      <PersonalKycPromptModal
        isOpen={isPersonalKycModalOpen}
        onClose={handleDismissPersonalKyc}
        user={user}
        kycStatus={myPersonalKycStatus}
      />

      {/* Join Family Modal */}
      <JoinFamilyModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onJoined={async () => {
          await loadDashboard();
        }}
      />

      {/* Send Phone Push Notification Modal */}
      <SendPushModal
        isOpen={isPushModalOpen}
        onClose={() => setIsPushModalOpen(false)}
        members={members}
      />
    </div>
  );
}
