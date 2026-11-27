import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  Phone,
  Mail,
  HeartPulse,
  CreditCard,
  Building2,
  FileText,
  Copy,
  Check,
  ChevronRight,
  Clock,
  Shield,
  FolderOpen,
  Plus,
  AlertCircle,
  Edit3,
  Calendar,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Share2,
  Printer,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  Crown,
  Car,
  Plane,
  Home,
  ShieldAlert,
  ShieldCheck,
  FileCheck,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import EditMemberModal from '../components/common/EditMemberModal';
import DeleteMemberModal from '../components/common/DeleteMemberModal';

export default function MemberProfilePage() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { family, user } = useAuth();
  const { toast } = useToast();

  const [member, setMember] = useState(null);
  const [assignedDocs, setAssignedDocs] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [copiedNumber, setCopiedNumber] = useState(null);
  const [unmaskedDocIds, setUnmaskedDocIds] = useState(new Set());
  const [shareFeedback, setShareFeedback] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    loadMemberProfile();
  }, [memberId]);

  const loadMemberProfile = async () => {
    try {
      setLoading(true);
      const res = await api.getMember(memberId);
      if (res.member) {
        setMember(res.member);
        setAssignedDocs(res.assignedDocuments || []);
        setRecentActivity(res.recentActivity || []);
      }
    } catch (err) {
      console.error('Failed to load member profile:', err);
      toast.error('Failed to load member profile');
    } finally {
      setLoading(false);
    }
  };

  // Mask / Unmask Toggle
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

  // Smart document number privacy masking
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

  const handleCopyNumber = (num, label, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    toast.success(`Copied ${label || 'Number'}: ${num}`);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  const handleShareSafely = async (docId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      const res = await api.createShareLink(docId, { expiresInHours: 24 });
      const fullUrl = res.shareUrl || res.shareLink || (res.token ? `${window.location.origin}/share/${res.token}` : '');
      if (fullUrl) {
        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(fullUrl);
          } else {
            const ta = document.createElement('textarea');
            ta.value = fullUrl;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
          }
        } catch (clipErr) {}
        setShareFeedback({ id: docId, url: fullUrl });
        toast.success('24-Hour safe share link copied to clipboard!');
        setTimeout(() => setShareFeedback(null), 3000);
      }
    } catch (err) {
      toast.error('Failed to create safe share link: ' + (err.message || 'Error'));
    }
  };

  // Realistic Indian Document Visual Theming
  const getDocVisual = (doc) => {
    const text = `${doc.title || ''} ${doc.category || ''} ${doc.tags?.join(' ') || ''}`.toLowerCase();
    if (text.includes('aadhaar') || text.includes('adhar') || text.includes('uid')) {
      return {
        type: 'aadhaar',
        label: 'Aadhaar',
        strip: 'from-orange-500 via-white to-emerald-600',
        tagStyle: 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200/80 dark:border-orange-500/30',
        iconBoxBg: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200/80 dark:border-orange-500/30',
        badgeEmoji: '🇮🇳',
      };
    }
    if (text.includes('pan') || text.includes('nsdl') || text.includes('uti')) {
      return {
        type: 'pan',
        label: 'PAN Card',
        strip: 'from-blue-700 via-sky-600 to-indigo-900',
        tagStyle: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200/80 dark:border-blue-500/30',
        iconBoxBg: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200/80 dark:border-blue-500/30',
        badgeEmoji: '💼',
      };
    }
    if (text.includes('passport')) {
      return {
        type: 'passport',
        label: 'Passport',
        strip: 'from-indigo-950 via-blue-900 to-slate-900',
        tagStyle: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200/80 dark:border-indigo-500/30',
        iconBoxBg: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/80 dark:border-indigo-500/30',
        badgeEmoji: '✈️',
      };
    }
    if (text.includes('health') || text.includes('medical') || text.includes('insurance') || text.includes('mediclaim') || text.includes('hospital') || text.includes('prescription') || text.includes('parchi') || text.includes('parcha') || text.includes('doctor')) {
      return {
        type: 'health',
        label: text.includes('insurance') || text.includes('mediclaim') ? 'Health Insurance' : 'Medical Record',
        strip: 'from-rose-600 via-red-600 to-rose-700',
        tagStyle: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200/80 dark:border-rose-500/30',
        iconBoxBg: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200/80 dark:border-rose-500/30',
        badgeEmoji: '🏥',
      };
    }
    const isMed = /\b(prescription|hospital|clinic|doctor|medicine|dawai|parchi|parcha|discharge|health|medical|insurance|mediclaim)\b/i.test(text);
    if (!isMed && (/\b(driving licen[cs]e|driver licen[cs]e|driving|\bdl\b|\brc\b|vehicle rc|vehicle|car|bike)\b/i.test(text) && !/\b(parchi|parcha|march|research)\b/i.test(text))) {
      return {
        type: 'vehicle',
        label: text.includes('driving') || text.includes('license') ? 'Driving License' : 'Vehicle RC',
        strip: 'from-emerald-600 via-teal-600 to-emerald-700',
        tagStyle: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-sky-400 border-emerald-200/80 dark:border-sky-500/30',
        iconBoxBg: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-sky-400 border-emerald-200/80 dark:border-sky-500/30',
        badgeEmoji: '🚗',
      };
    }
    if (text.includes('property') || text.includes('registry') || text.includes('flat') || text.includes('deed') || text.includes('will') || text.includes('tax')) {
      return {
        type: 'property',
        label: 'Property Deed',
        strip: 'from-amber-600 via-yellow-600 to-amber-700',
        tagStyle: 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-500/30',
        iconBoxBg: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-500/30',
        badgeEmoji: '📜',
      };
    }
    return {
      type: 'general',
      label: doc.category || 'Document',
      strip: 'from-[#10B981] to-[#3ECF8E]',
      tagStyle: 'bg-slate-100 dark:bg-[#182030] text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-[#1E293B]',
      iconBoxBg: 'bg-emerald-100/70 dark:bg-sky-500/15 text-emerald-700 dark:text-sky-400 border-emerald-200/60 dark:border-sky-500/30',
      badgeEmoji: '📑',
    };
  };

  const getExpiryBadge = (dateStr) => {
    if (!dateStr) return null;
    const expiry = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300 border border-red-200 dark:border-red-800/40 animate-pulse">
          <AlertTriangle size={11} />
          <span>Expired</span>
        </span>
      );
    }
    if (diffDays <= 30) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
          <Clock size={11} />
          <span>Expires in {diffDays}d</span>
        </span>
      );
    }
    if (diffDays <= 60) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40">
          <Clock size={11} />
          <span>{diffDays}d left</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
        <CheckCircle2 size={11} />
        <span>Valid ({diffDays}d)</span>
      </span>
    );
  };

  // Age & Demographic status
  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  };

  const getCleanPhone = (phone) => {
    if (!phone) return '';
    return phone.replace(/[^0-9]/g, '');
  };

  const getWhatsAppUrl = (phone, name) => {
    const digits = getCleanPhone(phone);
    if (!digits) return null;
    const intlDigits = digits.length === 10 ? `91${digits}` : digits;
    const text = encodeURIComponent(`Namaste ${name}! Accessing your documents on GharVault.`);
    return `https://wa.me/${intlDigits}?text=${text}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[65vh]">
        <div className="text-center space-y-3">
          <div className="w-9 h-9 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 dark:text-neutral-400 font-semibold">
            Loading family member profile...
          </p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-[#121622] flex items-center justify-center mx-auto text-slate-400 dark:text-neutral-500">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Family Member Not Found</h2>
        <Link
          to="/family"
          className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-sky-400 font-bold hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Family Directory</span>
        </Link>
      </div>
    );
  }

  // Demographics info
  const age = calculateAge(member.dateOfBirth);
  let demographicBadge = null;
  if (age !== null) {
    if (age >= 60) {
      demographicBadge = {
        label: 'Senior Citizen',
        icon: '👴',
        style: 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/40',
      };
    } else if (age < 18) {
      demographicBadge = {
        label: 'Minor Dependent',
        icon: '🧒',
        style: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/40',
      };
    } else {
      demographicBadge = {
        label: 'Adult Member',
        icon: '🧑',
        style: 'bg-slate-100 dark:bg-[#182030] text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-[#1E293B]',
      };
    }
  }

  // Vault Admin & Ownership Checks
  const adminId = family?.adminId?._id || family?.adminId;
  const isVaultAdmin = Boolean(
    adminId &&
      (member._id?.toString() === adminId.toString() || member.id?.toString() === adminId.toString())
  );
  const isCurrentUserAdmin =
    user?.role === 'ADMIN' ||
    !adminId ||
    (adminId && (user?._id?.toString() === adminId.toString() || user?.id?.toString() === adminId.toString()));
  const isSelf =
    member._id?.toString() === user?._id?.toString() ||
    member.id?.toString() === user?._id?.toString();
  const canDelete = !isVaultAdmin && (isCurrentUserAdmin || isSelf);

  // KYC Essential Checklist calculation
  const checkKycItem = (type) => {
    if (!assignedDocs || assignedDocs.length === 0) {
      if (type === 'mediclaim' && member.healthInsurancePolicy && member.healthInsurancePolicy !== 'Not set') {
        return { present: true, doc: null, value: member.healthInsurancePolicy };
      }
      return { present: false, doc: null };
    }
    if (type === 'aadhaar') {
      const doc = assignedDocs.find((d) => {
        const text = `${d.title || ''} ${d.category || ''} ${d.tags?.join(' ') || ''}`.toLowerCase();
        return text.includes('aadhaar') || text.includes('adhar') || text.includes('uid');
      });
      return { present: Boolean(doc), doc };
    }
    if (type === 'pan') {
      const doc = assignedDocs.find((d) => {
        const text = `${d.title || ''} ${d.category || ''} ${d.tags?.join(' ') || ''}`.toLowerCase();
        return text.includes('pan') || text.includes('nsdl') || text.includes('uti');
      });
      return { present: Boolean(doc), doc };
    }
    if (type === 'mediclaim') {
      if (member.healthInsurancePolicy && member.healthInsurancePolicy !== 'Not set') {
        return { present: true, doc: null, value: member.healthInsurancePolicy };
      }
      const doc = assignedDocs.find((d) => {
        const text = `${d.title || ''} ${d.category || ''} ${d.tags?.join(' ') || ''}`.toLowerCase();
        return text.includes('health') || text.includes('insurance') || text.includes('mediclaim') || text.includes('policy');
      });
      return { present: Boolean(doc), doc };
    }
    if (type === 'vehicle_or_travel') {
      const doc = assignedDocs.find((d) => {
        const text = `${d.title || ''} ${d.category || ''} ${d.tags?.join(' ') || ''}`.toLowerCase();
        const isMed = /\b(prescription|hospital|clinic|doctor|medicine|dawai|parchi|parcha|discharge|health|medical|insurance|mediclaim|ayushman|abha)\b/i.test(text);
        if (isMed) return false;
        return (
          text.includes('passport') ||
          text.includes('visa') ||
          text.includes('voter') ||
          /\b(driving licen[cs]e|driver licen[cs]e|driving|\bdl\b|\brc\b|vehicle rc|vehicle|car|bike)\b/i.test(text)
        );
      });
      return { present: Boolean(doc), doc };
    }
    return { present: false, doc: null };
  };

  const aadhaarKyc = checkKycItem('aadhaar');
  const panKyc = checkKycItem('pan');
  const mediclaimKyc = checkKycItem('mediclaim');
  const travelKyc = checkKycItem('vehicle_or_travel');

  const kycList = [
    {
      id: 'aadhaar',
      name: 'Aadhaar Card',
      badgeEmoji: '🇮🇳',
      status: aadhaarKyc.present,
      doc: aadhaarKyc.doc,
      uploadTitle: 'Aadhaar Card',
      uploadCategory: 'Identity',
    },
    {
      id: 'pan',
      name: 'PAN Card',
      badgeEmoji: '💼',
      status: panKyc.present,
      doc: panKyc.doc,
      uploadTitle: 'PAN Card',
      uploadCategory: 'Identity',
    },
    {
      id: 'mediclaim',
      name: 'Health Insurance',
      badgeEmoji: '🏥',
      status: mediclaimKyc.present,
      doc: mediclaimKyc.doc,
      value: mediclaimKyc.value,
      uploadTitle: 'Health Insurance Policy',
      uploadCategory: 'Medical',
    },
    {
      id: 'travel',
      name: 'Passport / DL',
      badgeEmoji: '✈️',
      status: travelKyc.present,
      doc: travelKyc.doc,
      uploadTitle: 'Passport or Driving License',
      uploadCategory: 'Identity',
    },
  ];

  const completedKycCount = kycList.filter((k) => k.status).length;
  const kycPercentage = Math.round((completedKycCount / kycList.length) * 100);

  // Metrics summary
  const totalStorageMb = (
    assignedDocs.reduce((acc, d) => acc + (d.fileSize || 0), 0) /
    (1024 * 1024)
  ).toFixed(1);

  const sensitiveDocsCount = assignedDocs.filter(
    (d) => d.isSensitive || ['Property & Legal', 'Financial', 'Legal'].includes(d.category)
  ).length;

  const expiringDocsCount = assignedDocs.filter((d) => {
    if (!d.expiryDate) return false;
    const diff = Math.ceil((new Date(d.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return diff <= 60;
  }).length;

  // Filtered documents by Category tab
  const categoryTabs = [
    { id: 'All', label: 'All Documents', count: assignedDocs.length },
    {
      id: 'Identity',
      label: 'Identity & KYC',
      count: assignedDocs.filter((d) => {
        const text = `${d.title || ''} ${d.category || ''}`.toLowerCase();
        return (
          d.category === 'Identity' ||
          d.category === 'ID Cards' ||
          text.includes('aadhaar') ||
          text.includes('pan') ||
          text.includes('passport')
        );
      }).length,
    },
    {
      id: 'Medical',
      label: 'Health & Medical',
      count: assignedDocs.filter((d) => {
        const text = `${d.title || ''} ${d.category || ''}`.toLowerCase();
        return (
          d.category?.includes('Medical') ||
          d.category?.includes('Health') ||
          text.includes('insurance') ||
          text.includes('mediclaim') ||
          text.includes('prescription')
        );
      }).length,
    },
    {
      id: 'Finance',
      label: 'Finance & Tax',
      count: assignedDocs.filter((d) => {
        const text = `${d.title || ''} ${d.category || ''}`.toLowerCase();
        return (
          d.category?.includes('Financ') ||
          d.category?.includes('Bank') ||
          text.includes('tax') ||
          text.includes('itr') ||
          text.includes('fd')
        );
      }).length,
    },
    {
      id: 'Vehicle',
      label: 'Vehicle & Travel',
      count: assignedDocs.filter((d) => {
        const text = `${d.title || ''} ${d.category || ''} ${d.tags?.join(' ') || ''}`.toLowerCase();
        const isMed = /\b(prescription|hospital|clinic|doctor|medicine|dawai|parchi|parcha|discharge|health|medical|insurance|mediclaim)\b/i.test(text);
        if (isMed) return false;
        return (
          d.category?.includes('Vehicle') ||
          /\b(driving licen[cs]e|driver licen[cs]e|driving|\bdl\b|\brc\b|vehicle rc|vehicle|car|bike)\b/i.test(text)
        );
      }).length,
    },
    {
      id: 'Property',
      label: 'Property & Legal',
      count: assignedDocs.filter((d) => {
        const text = `${d.title || ''} ${d.category || ''}`.toLowerCase();
        return (
          d.category?.includes('Property') ||
          d.category?.includes('Legal') ||
          text.includes('registry') ||
          text.includes('deed')
        );
      }).length,
    },
    {
      id: 'Education',
      label: 'Education & Career',
      count: assignedDocs.filter((d) => {
        const text = `${d.title || ''} ${d.category || ''}`.toLowerCase();
        return (
          d.category?.includes('Education') ||
          text.includes('degree') ||
          text.includes('marksheet') ||
          text.includes('certificate')
        );
      }).length,
    },
  ];

  const filteredDocs = assignedDocs.filter((d) => {
    if (activeCategory === 'All') return true;
    const text = `${d.title || ''} ${d.category || ''} ${d.tags?.join(' ') || ''}`.toLowerCase();
    if (activeCategory === 'Identity') {
      return (
        d.category === 'Identity' ||
        d.category === 'ID Cards' ||
        text.includes('aadhaar') ||
        text.includes('pan') ||
        text.includes('passport') ||
        text.includes('voter')
      );
    }
    if (activeCategory === 'Medical') {
      return (
        d.category?.includes('Medical') ||
        d.category?.includes('Health') ||
        text.includes('insurance') ||
        text.includes('mediclaim') ||
        text.includes('prescription') ||
        text.includes('hospital')
      );
    }
    if (activeCategory === 'Finance') {
      return (
        d.category?.includes('Financ') ||
        d.category?.includes('Bank') ||
        text.includes('tax') ||
        text.includes('itr') ||
        text.includes('fd')
      );
    }
    if (activeCategory === 'Vehicle') {
      const isMed = /\b(prescription|hospital|clinic|doctor|medicine|dawai|parchi|parcha|discharge|health|medical|insurance|mediclaim)\b/i.test(text);
      if (isMed) return false;
      return (
        d.category?.includes('Vehicle') ||
        /\b(driving licen[cs]e|driver licen[cs]e|driving|\bdl\b|\brc\b|vehicle rc|vehicle|car|bike)\b/i.test(text)
      );
    }
    if (activeCategory === 'Property') {
      return (
        d.category?.includes('Property') ||
        d.category?.includes('Legal') ||
        text.includes('registry') ||
        text.includes('deed')
      );
    }
    if (activeCategory === 'Education') {
      return (
        d.category?.includes('Education') ||
        text.includes('degree') ||
        text.includes('marksheet') ||
        text.includes('certificate')
      );
    }
    return true;
  });

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-[#F8FAFC] dark:bg-[#090A0F] text-slate-900 dark:text-[#F8FAFC] transition-colors">
      {/* Background Texture & Ambient Top Glow matching Document Preview */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(currentColor_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] dark:opacity-[0.06] text-slate-900 dark:text-white"
        aria-hidden="true"
      />
      <div className="relative z-10 max-w-[1380px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Breadcrumb & Back Link */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/family"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-neutral-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Family Directory</span>
        </Link>

        <div className="text-[11px] text-slate-400 dark:text-neutral-500 font-mono hidden sm:block">
          Vault ID: {family?.name || 'GharVault'} • Member Profile
        </div>
      </div>

      {/* ================= HERO CARD: DIGITAL FAMILY PASSPORT ================= */}
      <div className="relative bg-white dark:bg-[#121622] rounded-3xl border border-slate-200/80 dark:border-[#1E293B] p-5 sm:p-7 shadow-sm transition-colors overflow-hidden">
        {/* Subtle decorative accent gradient */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-sky-500 via-indigo-500 to-blue-600" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-1">
          {/* Left Info: Avatar + Details */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 min-w-0 flex-1">
            <div className="relative shrink-0">
              <img
                src={
                  member.avatar ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name)}`
                }
                alt={member.name}
                className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl object-cover ring-3 sm:ring-4 ring-slate-100 dark:ring-[#1E293B] shadow-md"
              />
              {isVaultAdmin ? (
                <span
                  className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full bg-amber-500 text-white flex items-center justify-center ring-2 ring-white dark:ring-[#121622] shadow-sm"
                  title="Head of Family Vault"
                >
                  <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                </span>
              ) : (
                <span
                  className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#10B981] dark:bg-sky-500 text-white dark:text-[#121212] flex items-center justify-center ring-1.5 ring-white dark:ring-[#121622] shadow-2xs"
                  title="Active Member"
                >
                  <UserCheck size={11} strokeWidth={3} />
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white truncate">
                  {member.name}
                </h1>

                {/* Role Pill */}
                {isVaultAdmin ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 shrink-0">
                    <Crown size={12} className="text-amber-500" />
                    <span>Head of Family</span>
                  </span>
                ) : (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 ${
                      member.role === 'ADMIN'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-sky-400 border border-emerald-200 dark:border-emerald-800/40'
                        : 'bg-slate-100 dark:bg-[#182030] text-slate-700 dark:text-neutral-300'
                    }`}
                  >
                    {member.role === 'ADMIN' ? 'Vault Admin' : 'Family Member'}
                  </span>
                )}

                {/* Demographic Badge */}
                {demographicBadge && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 border shrink-0 ${demographicBadge.style}`}
                  >
                    <span>{demographicBadge.icon}</span>
                    <span>{demographicBadge.label}</span>
                  </span>
                )}

                {/* Emergency Contact Badge */}
                {member.isEmergencyContact && (
                  <span className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-900/40 text-[11px] font-bold flex items-center gap-1 shrink-0">
                    <ShieldAlert size={12} />
                    <span>Primary SOS Contact</span>
                  </span>
                )}
              </div>

              {/* Relationship & Birth details */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs text-slate-500 dark:text-neutral-400 font-medium">
                <span className="font-semibold text-slate-800 dark:text-neutral-200">
                  Relation: {member.relationship || 'Member'}
                </span>
                {member.dateOfBirth && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={13} className="text-sky-600 dark:text-sky-400" />
                      <span>
                        DOB: {new Date(member.dateOfBirth).toLocaleDateString()}{' '}
                        {age !== null && <strong className="text-slate-800 dark:text-neutral-200">({age} yrs)</strong>}
                      </span>
                    </span>
                  </>
                )}
                {member.bloodGroup && (
                  <>
                    <span>•</span>
                    <span className="font-bold text-red-600 dark:text-red-400">
                      🩸 {member.bloodGroup}
                    </span>
                  </>
                )}
              </div>

              {/* Contact Links & WhatsApp Shortcut */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs pt-1">
                {member.phone && (
                  <a
                    href={`tel:${member.phone}`}
                    className="flex items-center gap-1.5 font-mono text-slate-700 dark:text-neutral-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500 shrink-0" />
                    <span>{member.phone}</span>
                  </a>
                )}

                {member.phone && getWhatsAppUrl(member.phone, member.name) && (
                  <a
                    href={getWhatsAppUrl(member.phone, member.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-sky-500/10 hover:bg-emerald-100 dark:hover:bg-[#3ECF8E]/20 text-emerald-700 dark:text-sky-400 font-bold text-[11px] transition-colors"
                    title="Send WhatsApp Message"
                  >
                    <MessageCircle size={13} />
                    <span>WhatsApp</span>
                  </a>
                )}

                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    className="flex items-center gap-1.5 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors truncate max-w-[240px]"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500 shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Right Action Dock */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] hover:bg-slate-50 dark:hover:bg-[#202024] text-slate-700 dark:text-neutral-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Edit</span>
            </button>

            {canDelete && (
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="px-3 py-2 rounded-xl border border-red-200/80 dark:border-red-900/40 bg-white dark:bg-[#0B0F19] hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                title={isSelf ? 'Leave Family Vault' : 'Remove Member'}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isSelf ? 'Leave' : 'Remove'}</span>
              </button>
            )}

            <Link
              to={`/vault/upload?member=${member._id}`}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-blue-600 hover:from-sky-400 hover:via-indigo-400 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-sky-500/25 border border-sky-400/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>+ Upload Doc</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ================= 4 COMPACT OVERVIEW METRICS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Total Docs */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-[#1E293B] shadow-2xs transition-colors flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
              Assigned Docs
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {assignedDocs.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-sky-500/10 text-emerald-600 dark:text-sky-400 flex items-center justify-center">
            <FolderOpen size={18} />
          </div>
        </div>

        {/* Metric 2: Total Storage */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-[#1E293B] shadow-2xs transition-colors flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
              Vault Storage
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {totalStorageMb} <span className="text-xs font-semibold text-slate-500">MB</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Building2 size={18} />
          </div>
        </div>

        {/* Metric 3: MPIN Protected */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-[#1E293B] shadow-2xs transition-colors flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
              MPIN Locked
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-amber-700 dark:text-amber-400 mt-0.5">
              {sensitiveDocsCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Lock size={18} />
          </div>
        </div>

        {/* Metric 4: Expiring Soon */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-[#1E293B] shadow-2xs transition-colors flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
              Expiring Soon
            </div>
            <div className={`text-xl sm:text-2xl font-extrabold mt-0.5 ${expiringDocsCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
              {expiringDocsCount}
            </div>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${expiringDocsCount > 0 ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-slate-100 dark:bg-[#182030] text-slate-400'}`}>
            <Clock size={18} />
          </div>
        </div>
      </div>

      {/* ================= SMART INDIAN KYC & READINESS CHECKLIST ================= */}
      <div className="bg-white dark:bg-[#121622] rounded-3xl border border-slate-200/80 dark:border-[#1E293B] p-5 sm:p-6 shadow-sm space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Essential KYC & Paperwork Checklist
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-sky-500/10 text-emerald-700 dark:text-sky-400">
                {kycPercentage}% Ready
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Key documents required for bank accounts, hospital admissions, travel, and sim KYC.
            </p>
          </div>

          <div className="w-full sm:w-48 bg-slate-100 dark:bg-[#182030] h-2.5 rounded-full overflow-hidden shrink-0">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                kycPercentage === 100
                  ? 'bg-emerald-500 dark:bg-sky-500'
                  : kycPercentage >= 50
                  ? 'bg-emerald-400'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${kycPercentage}%` }}
            />
          </div>
        </div>

        {/* 4 Essential KYC Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {kycList.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                item.status
                  ? 'bg-emerald-50/50 dark:bg-sky-500/5 border-emerald-200/80 dark:border-sky-500/30'
                  : 'bg-slate-50 dark:bg-[#0B0F19] border-slate-200 dark:border-[#1E293B] border-dashed'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{item.badgeEmoji}</span>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{item.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-neutral-500">
                      {item.status ? 'Verified in Vault' : 'Not attached yet'}
                    </div>
                  </div>
                </div>

                {item.status ? (
                  <span className="p-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-sky-500/20 dark:text-sky-400 shrink-0">
                    <Check size={12} strokeWidth={3} />
                  </span>
                ) : (
                  <span className="p-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 shrink-0">
                    <AlertTriangle size={12} />
                  </span>
                )}
              </div>

              {item.status ? (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-100 dark:border-sky-500/20">
                  <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-neutral-300 truncate max-w-[130px]">
                    {item.doc?.documentNumber ? `•••• ${item.doc.documentNumber.slice(-4)}` : item.value || 'Attached'}
                  </span>
                  {item.doc ? (
                    <Link
                      to={`/vault/documents/${item.doc._id}`}
                      className="text-[11px] font-bold text-emerald-700 dark:text-sky-400 hover:underline inline-flex items-center gap-0.5"
                    >
                      <span>View</span>
                      <ChevronRight size={12} />
                    </Link>
                  ) : (
                    <span className="text-[10px] text-emerald-600 dark:text-sky-400 font-bold">Policy Set</span>
                  )}
                </div>
              ) : (
                <Link
                  to={`/vault/upload?member=${member._id}&title=${encodeURIComponent(item.uploadTitle)}&category=${encodeURIComponent(item.uploadCategory)}`}
                  className="w-full py-1.5 px-2.5 rounded-xl bg-white dark:bg-[#182030] hover:bg-slate-100 dark:hover:bg-[#262626] border border-slate-200 dark:border-[#1E293B] text-slate-700 dark:text-neutral-200 font-bold text-[11px] text-center transition-colors inline-flex items-center justify-center gap-1 shadow-2xs"
                >
                  <Plus size={12} />
                  <span>+ Link {item.name}</span>
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ================= EMERGENCY MEDICAL & HOSPITAL DIRECTIVE PASS ================= */}
      <div className="relative bg-gradient-to-br from-red-500/10 via-rose-500/5 to-orange-500/10 dark:from-red-950/40 dark:via-rose-950/20 dark:to-orange-950/30 rounded-3xl p-5 sm:p-7 border border-red-200/80 dark:border-red-900/40 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 min-w-0 flex-1">
          {/* Glowing Blood Group Avatar */}
          <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex flex-col items-center justify-center font-black shadow-lg shadow-red-500/30 shrink-0">
            <span className="text-base leading-none">{member.bloodGroup || '🩸'}</span>
            <span className="text-[9px] uppercase font-bold tracking-wider mt-0.5 opacity-90">Blood</span>
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-red-700 dark:text-red-400 flex items-center gap-1">
                <HeartPulse size={14} className="text-red-600 dark:text-red-400" />
                <span>Hospital Admission & Triage Directives</span>
              </span>
            </div>

            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
              <span>
                Blood Group: <strong className="text-red-600 dark:text-red-400">{member.bloodGroup || 'Not Specified'}</strong>
              </span>

              {member.healthInsurancePolicy && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span>Mediclaim:</span>
                    <code className="font-mono text-slate-900 dark:text-neutral-100 bg-white/70 dark:bg-black/30 px-1.5 py-0.5 rounded border border-red-200/60 dark:border-red-900/40">
                      {member.healthInsurancePolicy}
                    </code>
                    <button
                      type="button"
                      onClick={(e) => handleCopyNumber(member.healthInsurancePolicy, 'Policy Number', e)}
                      className="p-1 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                      title="Copy Policy Number"
                    >
                      {copiedNumber === member.healthInsurancePolicy ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </span>
                </>
              )}

              {member.tpaNumber && (
                <>
                  <span>•</span>
                  <span>TPA ID: <strong className="font-mono">{member.tpaNumber}</strong></span>
                </>
              )}
            </div>

            {member.allergies && (
              <div className="text-xs font-semibold text-red-700 dark:text-red-300 flex items-center gap-1.5 mt-0.5">
                <AlertTriangle size={13} className="shrink-0" />
                <span>Allergies / Critical Directives: {member.allergies}</span>
              </div>
            )}
          </div>
        </div>

        {/* Emergency Actions */}
        <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#121622] hover:bg-slate-50 dark:hover:bg-[#262626] border border-red-200 dark:border-red-900/40 text-slate-800 dark:text-neutral-200 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Print Medical Emergency Slip"
          >
            <Printer size={13} />
            <span>Print Pass</span>
          </button>

          {member.phone && (
            <a
              href={`tel:${member.phone}`}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Phone size={13} />
              <span>Call Emergency</span>
            </a>
          )}
        </div>
      </div>

      {/* ================= SPLIT BODY: PERSONAL VAULT BINDERS & RECENT ACTIVITY ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Member's Document Binders */}
        <div className="lg:col-span-8 bg-white dark:bg-[#121622] rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-[#1E293B] shadow-sm space-y-5 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{member.name}'s Vault Binders</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#182030] text-slate-600 dark:text-neutral-300">
                  {assignedDocs.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Organized personal records, identity cards, and health files.
              </p>
            </div>

            <Link
              to={`/vault/upload?member=${member._id}`}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#182030] dark:hover:bg-[#222c42] text-slate-800 dark:text-sky-400 border border-slate-200/90 dark:border-[#1E293B] font-bold text-xs transition-all inline-flex items-center gap-1 self-start sm:self-auto cursor-pointer active:scale-95 shadow-2xs"
            >
              <Plus size={13} />
              <span>Add Document</span>
            </Link>
          </div>

          {/* Category Tabs Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
            {categoryTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  activeCategory === tab.id
                    ? 'bg-gradient-to-r from-sky-500 via-indigo-500 to-blue-600 text-white font-bold shadow-md shadow-sky-500/20 border border-sky-400/30'
                    : 'bg-slate-100 dark:bg-[#182030] text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/60 dark:border-[#1E293B]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeCategory === tab.id
                      ? 'bg-white/20 text-white font-bold'
                      : 'bg-slate-200/80 dark:bg-[#222c42] text-slate-500 dark:text-neutral-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Documents List */}
          <div className="space-y-3">
            {filteredDocs.length === 0 ? (
              <div className="p-10 text-center rounded-2xl border border-dashed border-slate-200 dark:border-[#1E293B] space-y-3">
                <FolderOpen className="w-10 h-10 text-slate-300 dark:text-neutral-600 mx-auto" />
                <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
                  No documents found for {member.name} under {activeCategory}.
                </p>
                <Link
                  to={`/vault/upload?member=${member._id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs transition-all shadow-md shadow-sky-500/25 border border-sky-400/30 active:scale-95 cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Upload Document</span>
                </Link>
              </div>
            ) : (
              filteredDocs.map((doc) => {
                const visual = getDocVisual(doc);
                const isUnmasked = unmaskedDocIds.has(doc._id);
                const isAadhaar = doc.category === 'Identity' && doc.title.toLowerCase().includes('aadhaar');

                return (
                  <div
                    key={doc._id}
                    className="relative overflow-hidden p-4 rounded-2xl bg-slate-50/70 dark:bg-[#0B0F19] hover:bg-slate-100/80 dark:hover:bg-[#1f1f23] border border-slate-200/80 dark:border-[#1E293B] transition-all space-y-3 group"
                  >
                    {/* Realistic Indian colored accent top strip */}
                    <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${visual.strip}`} />

                    <div className="flex items-start justify-between gap-3 pt-0.5">
                      <Link
                        to={`/vault/documents/${doc._id}`}
                        className="flex items-center gap-3.5 min-w-0 flex-1"
                      >
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 border ${visual.iconBoxBg}`}
                        >
                          <FileText size={18} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-[#3ECF8E] transition-colors truncate">
                              {doc.title}
                            </span>

                            {visual.badgeEmoji && (
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${visual.tagStyle} shrink-0`}
                              >
                                {visual.badgeEmoji} {visual.label}
                              </span>
                            )}

                            {(doc.isSensitive ||
                              ['Property & Legal', 'Financial', 'Legal'].includes(doc.category)) && (
                              <span
                                className="p-0.5 rounded bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 shrink-0"
                                title="Protected by 4-digit MPIN"
                              >
                                <Lock size={11} />
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-400 dark:text-neutral-500 font-medium flex items-center gap-2 mt-0.5 flex-wrap">
                            <span>{doc.category}</span>
                            <span>•</span>
                            <span>{(doc.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
                            {doc.expiryDate && (
                              <>
                                <span>•</span>
                                <span>Expires: {new Date(doc.expiryDate).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </Link>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {getExpiryBadge(doc.expiryDate)}
                      </div>
                    </div>

                    {/* ID Number Bar with Privacy Mask & 1-Tap Copy */}
                    {doc.documentNumber && (
                      <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-[#1E293B] flex items-center justify-between gap-2 shadow-2xs">
                        <div className="min-w-0 flex-1 truncate">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-neutral-500 block">
                              Document ID Number
                            </span>
                            <button
                              type="button"
                              onClick={(e) => toggleMask(doc._id, e)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300 cursor-pointer"
                              title={isUnmasked ? 'Mask number' : 'Reveal number'}
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
                          onClick={(e) => handleCopyNumber(doc.documentNumber, doc.title, e)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#182030] dark:hover:bg-[#222c42] text-slate-800 dark:text-sky-400 border border-slate-200/90 dark:border-[#1E293B] text-[11px] font-bold flex items-center gap-1 transition-all shrink-0 cursor-pointer active:scale-95 shadow-2xs"
                          title="Copy ID number"
                        >
                          {copiedNumber === doc.documentNumber ? <Check size={11} className="text-sky-500" /> : <Copy size={11} />}
                          <span>{copiedNumber === doc.documentNumber ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-1 text-xs border-t border-slate-200/60 dark:border-[#1E293B]">
                      <button
                        type="button"
                        onClick={(e) => handleShareSafely(doc._id, e)}
                        className="text-slate-500 dark:text-neutral-400 hover:text-sky-600 dark:hover:text-sky-400 font-semibold flex items-center gap-1.5 cursor-pointer py-1"
                        title="Share Safely (24-hour expiring link)"
                      >
                        <Share2 size={13} />
                        <span>{shareFeedback?.id === doc._id ? 'Copied Link!' : 'Safe Share'}</span>
                      </button>

                      <Link
                        to={`/vault/documents/${doc._id}`}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs inline-flex items-center gap-1 shadow-xs border border-sky-400/30 transition-all active:scale-95"
                      >
                        <span>View Document</span>
                        <ChevronRight size={13} />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 4 Cols: Recent Activity & Audit Directives */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white dark:bg-[#121622] rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-[#1E293B] shadow-sm space-y-4 transition-colors">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-sky-400" />
              <span>Recent Activity</span>
            </h3>

            <div className="space-y-3 text-xs">
              {recentActivity.length === 0 ? (
                <div className="text-slate-400 dark:text-neutral-500 text-xs py-6 text-center italic">
                  No recent activity recorded for this member.
                </div>
              ) : (
                recentActivity.map((log) => (
                  <div
                    key={log._id}
                    className="flex items-start gap-2.5 pb-2.5 border-b border-slate-100 dark:border-[#1E293B] last:border-0 last:pb-0"
                  >
                    <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-sky-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-800 dark:text-neutral-200 leading-snug">
                        {log.action === 'UPLOAD'
                          ? 'Uploaded'
                          : log.action === 'VIEW'
                          ? 'Viewed'
                          : log.action === 'DOWNLOAD'
                          ? 'Downloaded'
                          : log.action}
                        : <strong className="text-slate-900 dark:text-white truncate block">{log.documentTitle}</strong>
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

          {/* Quick Sharing & Emergency Pass Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200/80 dark:border-[#1E293B] space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <ShieldCheck size={16} className="text-sky-600 dark:text-sky-400" />
              <span>Family Privacy Shield</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
              All documents assigned to <strong>{member.name}</strong> are encrypted at rest with AES-256. Sharing links expire automatically within 24 hours.
            </p>
          </div>
        </div>
      </div>

      {/* Edit Member Modal */}
      <EditMemberModal
        isOpen={isEditModalOpen}
        member={member}
        onClose={() => setIsEditModalOpen(false)}
        onMemberUpdated={(updated) => {
          setMember(updated);
          loadMemberProfile();
        }}
      />

      {/* Delete Member Confirmation Modal */}
      <DeleteMemberModal
        isOpen={isDeleteModalOpen}
        member={{
          ...member,
          assignedDocumentsCount: assignedDocs.length,
        }}
        onClose={() => setIsDeleteModalOpen(false)}
        onDeleted={() => {
          navigate('/family');
        }}
      />
    </div>
    </div>
  );
}
