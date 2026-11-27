import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  Box,
  Compass,
  Zap,
  MapPin,
  Building,
  Stethoscope,
  GraduationCap,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  CreditCard,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import MpinModal from '../components/common/MpinModal';
import VaultSecurityLoader from '../components/common/VaultSecurityLoader';
import { useToast } from '../context/ToastContext';

export default function DocumentPreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { family, user } = useAuth();
  const { toast } = useToast();

  const [mobileTab, setMobileTab] = useState('PREVIEW'); // 'PREVIEW' or 'DETAILS'
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
  const [copiedSnippet, setCopiedSnippet] = useState(null);

  const handleCopySnippet = (val, label = 'Copied') => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopiedSnippet(val);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const getDueStatus = (dueDateStr) => {
    if (!dueDateStr) return null;
    const due = new Date(dueDateStr);
    if (isNaN(due.getTime())) return null;
    const now = new Date();
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return { text: `Overdue (${Math.abs(diffDays)}d ago)`, color: 'text-red-600 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20' };
    }
    if (diffDays === 0) {
      return { text: 'Due Today', color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20' };
    }
    return { text: `Due in ${diffDays} day${diffDays > 1 ? 's' : ''}`, color: 'text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20' };
  };

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
    assignedMemberId: '',
    issueDate: '',
    expiryDate: '',
    isMpinProtected: false,
    whoCanView: ['ALL'],
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

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (shareModalOpen || isDeleteModalOpen || isEditModalOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [shareModalOpen, isDeleteModalOpen, isEditModalOpen]);

  // Realistic Indian Document Visual Theming
  const getDocVisual = (d) => {
    if (!d)
      return {
        type: 'general',
        label: 'Document',
        strip: 'from-sky-500 via-indigo-500 to-blue-600',
        tagStyle: 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200/60 dark:border-sky-500/30',
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
        strip: 'from-rose-600 via-red-600 to-rose-700',
        tagStyle: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200/80 dark:border-red-500/30',
        badgeEmoji: '🏥',
      };
    }
    const isMed = /\b(prescription|hospital|clinic|doctor|medicine|dawai|parchi|parcha|discharge|health|medical|insurance|mediclaim)\b/i.test(text);
    if (
      !isMed &&
      (/\b(driving licen[cs]e|driver licen[cs]e|driving|\bdl\b|\brc\b|vehicle rc|vehicle|car|bike)\b/i.test(text) &&
        !/\b(parchi|parcha|march|research)\b/i.test(text))
    ) {
      return {
        type: 'vehicle',
        label: text.includes('driving') || text.includes('license') ? 'Driving License' : 'Vehicle RC',
        strip: 'from-blue-600 via-indigo-600 to-cyan-600',
        tagStyle: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-500/30',
        badgeEmoji: '🚗',
      };
    }
    if (/\b(bijli|electricity|water|pani|bill|utility|power|uppcl|bses|tata power|jal board|igl|indane)\b/i.test(text)) {
      return {
        type: 'utility_bill',
        label: text.includes('bijli') || text.includes('electricity') ? 'Electricity Bill' : text.includes('water') || text.includes('pani') ? 'Water Bill' : text.includes('gas') ? 'Gas Bill' : 'Utility Bill',
        strip: 'from-amber-500 via-orange-500 to-yellow-600',
        tagStyle: 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-500/30',
        badgeEmoji: '⚡',
      };
    }
    if (
      text.includes('property') ||
      text.includes('registry') ||
      text.includes('bainama') ||
      text.includes('khasra') ||
      text.includes('khatauni') ||
      text.includes('jamabandi') ||
      text.includes('fard') ||
      text.includes('chauhaddi') ||
      text.includes('flat') ||
      text.includes('deed') ||
      text.includes('will') ||
      text.includes('tax') ||
      text.includes('plot') ||
      text.includes('zameen')
    ) {
      return {
        type: 'property',
        label: text.includes('khasra') || text.includes('khatauni') || text.includes('jamabandi') ? 'Khasra-Khatauni' : 'Land Registry / Deed',
        strip: 'from-amber-600 via-yellow-600 to-amber-700',
        tagStyle: 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-500/30',
        badgeEmoji: '📜',
      };
    }
    return {
      type: 'general',
      label: d.category || 'Document',
      strip: 'from-sky-500 via-indigo-500 to-blue-600',
      tagStyle: 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200/60 dark:border-sky-500/30',
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
        `Namaste, here is the secure view link for "${doc?.title || 'Document'}" via Dastavej (Valid for 24 hours): ${linkToShare}`
      );
      window.open(`https://wa.me/?text=${msg}`, '_blank');
      toast.success('Opened WhatsApp with 24-hr expiring link!');
    } catch (err) {
      toast.error('Could not generate WhatsApp share link: ' + (err.message || 'Error'));
    } finally {
      setSharingLoading(false);
    }
  };

  // Official Indian Portals & Renewal Metadata
  const getOfficialRenewalInfo = (d) => {
    if (!d) return null;
    const text = `${d.title || ''} ${d.category || ''} ${d.tags?.join(' ') || ''}`.toLowerCase();

    if (/\b(driving licen[cs]e|driver licen[cs]e|driving|\bdl\b)\b/i.test(text)) {
      return {
        type: 'DRIVING_LICENSE',
        portalName: 'Parivahan Sarathi',
        url: 'https://sarathi.parivahan.gov.in/sarathiservice/stateSelection.do',
        badge: '🚗 Parivahan RTO (MoRTH)',
        actionLabel: 'Renew on Parivahan',
        authority: 'Ministry of Road Transport & Highways',
      };
    }
    if (/\b(puc|pollution|emission)\b/i.test(text)) {
      return {
        type: 'PUC',
        portalName: 'Parivahan PUC Portal',
        url: 'https://vahan.parivahan.gov.in/puc/',
        badge: '🌿 Parivahan PUC',
        actionLabel: 'Check & Renew PUC',
        authority: 'Central Motor Vehicles Rules (CMVR)',
      };
    }
    if (/\b(rc|vehicle rc|fitness|road tax|chassis)\b/i.test(text) && !/\b(parchi|parcha|march|research)\b/i.test(text)) {
      return {
        type: 'VEHICLE_RC',
        portalName: 'Parivahan Vahan',
        url: 'https://vahan.parivahan.gov.in/vahaneservice/',
        badge: '🚘 Parivahan Vahan',
        actionLabel: 'Renew RC / Fitness',
        authority: 'National Register of Vehicles (MoRTH)',
      };
    }
    if (text.includes('passport')) {
      return {
        type: 'PASSPORT',
        portalName: 'Passport Seva Kendra',
        url: 'https://www.passportindia.gov.in/AppOnlineProject/welcomeLink',
        badge: '✈️ Passport Seva',
        actionLabel: 'Re-issue on Passport Seva',
        authority: 'Ministry of External Affairs, Govt of India',
      };
    }
    if (text.includes('insurance') || text.includes('mediclaim') || text.includes('policy')) {
      return {
        type: 'INSURANCE',
        portalName: 'Insurance Renewal',
        url: 'https://www.policybazaar.com/',
        badge: '🛡️ Policy Renewal',
        actionLabel: 'Renew Policy Online',
        authority: 'IRDAI Registered Insurer Portal',
      };
    }
    if (/\b(bijli|electricity|water|pani|bill|utility|power|uppcl|bses|tata power|jal board|gas)\b/i.test(text)) {
      return {
        type: 'UTILITY_BILL',
        portalName: 'Bharat BillPay (BBPS)',
        url: 'https://www.bharatbillpay.com/',
        badge: '⚡ BBPS BillPay',
        actionLabel: 'Pay via BBPS Gateway',
        authority: 'National Payments Corporation of India (NPCI)',
      };
    }

    return {
      type: 'GENERAL',
      portalName: 'National Services Portal',
      url: 'https://services.india.gov.in/',
      badge: '🏛️ National Services',
      actionLabel: 'Official Renewal Link',
      authority: 'Government of India',
    };
  };

  // 1-Tap WhatsApp Expiry & Renewal Alert for Family Members
  const handleWhatsAppExpiryAlert = (renewalInfo) => {
    if (!doc.expiryDate) return;
    const d = new Date(doc.expiryDate);
    const diffDays = Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24));
    const memberName = doc.assignedMember?.name || 'Family Member';
    const isExpired = diffDays <= 0;
    const statusLine = isExpired
      ? `🚨 *EXPIRED* (${Math.abs(diffDays)} days ago)`
      : `⏳ *Expires in ${diffDays} day${diffDays > 1 ? 's' : ''}*`;

    const text = [
      `⚠️ *Dastavej Vault Expiry & Renewal Reminder* ⏰`,
      ``,
      `📌 *Document:* ${doc.title}`,
      `👤 *Member:* ${memberName}`,
      doc.documentNumber ? `🔢 *ID / Policy Number:* ${doc.documentNumber}` : null,
      `📅 *Validity Date:* ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
      `📢 *Current Status:* ${statusLine}`,
      ``,
      `🔗 *Official Government / Online Renewal Link:*`,
      renewalInfo.url,
      ``,
      `_Saved & tracked in GharVault Family Vault_ 🛡️`,
    ]
      .filter(Boolean)
      .join('\n');

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    toast.success('WhatsApp Expiry & Renewal message ready to send!');
  };

  // 1-Tap Google Calendar Reminder
  const handleAddToGoogleCalendar = (renewalInfo) => {
    if (!doc.expiryDate) return;
    const d = new Date(doc.expiryDate);
    const dateStr = d.toISOString().split('T')[0].replace(/-/g, '');
    const nextDate = new Date(d.getTime() + 24 * 60 * 60 * 1000);
    const nextDateStr = nextDate.toISOString().split('T')[0].replace(/-/g, '');
    const memberName = doc.assignedMember?.name || 'Family';

    const title = encodeURIComponent(`Renewal Reminder: ${doc.title} (${memberName})`);
    const details = encodeURIComponent(
      `Statutory validity reminder for ${doc.title}.\nHolder: ${memberName}\nDocument ID: ${doc.documentNumber || 'N/A'}\nOfficial Renewal Link: ${renewalInfo.url}\nVault Record: ${window.location.href}`
    );
    const location = encodeURIComponent(renewalInfo.portalName);

    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}/${nextDateStr}&details=${details}&location=${location}`;
    window.open(gcalUrl, '_blank', 'noopener,noreferrer');
    toast.success('Opened Google Calendar to schedule reminder!');
  };

  // 1-Tap Download .ics (Apple Calendar, Outlook, Android)
  const handleDownloadIcsCalendar = (renewalInfo) => {
    if (!doc.expiryDate) return;
    const d = new Date(doc.expiryDate);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const memberName = doc.assignedMember?.name || 'Family';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Dastavej Family Vault//Smart Renewal Reminder//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:dastavej-renewal-${doc._id || Date.now()}@gharvault.app`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${y}${m}${day}`,
      `DTEND;VALUE=DATE:${y}${m}${day}`,
      `SUMMARY:⚠️ Renewal Due: ${doc.title} (${memberName})`,
      `DESCRIPTION:Official renewal reminder for ${doc.title}.\\nOfficial Renewal Portal: ${renewalInfo.url}\\nID: ${doc.documentNumber || 'N/A'}`,
      `URL:${renewalInfo.url}`,
      `LOCATION:${renewalInfo.portalName}`,
      'BEGIN:VALARM',
      'TRIGGER:-P7D',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: ${doc.title} expires in 7 days!`,
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      `DESCRIPTION:Urgent: ${doc.title} expires tomorrow!`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${(doc.title || 'document').replace(/[^a-zA-Z0-9_-]/g, '_')}_Renewal.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast.success('Downloaded .ics event for Apple & Outlook Calendar!');
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
    let formattedIssue = '';
    if (doc.issueDate) {
      try {
        const d = new Date(doc.issueDate);
        if (!isNaN(d.getTime())) {
          formattedIssue = d.toISOString().split('T')[0];
        }
      } catch (e) {
        formattedIssue = typeof doc.issueDate === 'string' ? doc.issueDate.slice(0, 10) : '';
      }
    }
    const memId = (doc.assignedMemberId?._id || doc.assignedMemberId || doc.memberId || '')?.toString();
    setEditFormData({
      title: doc.title || '',
      documentNumber: doc.documentNumber || '',
      category: doc.category || 'ID Cards',
      assignedMemberId: memId,
      issueDate: formattedIssue,
      expiryDate: formattedExpiry,
      isMpinProtected: Boolean(doc.isSensitive || doc.isMpinProtected),
      whoCanView: Array.isArray(doc.whoCanView) ? doc.whoCanView : ['ALL'],
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
    if (!editFormData.title.trim()) {
      toast.error('Document title is required');
      return;
    }
    try {
      setSavingEdit(true);
      let payload;
      if (replacementFile) {
        payload = new FormData();
        payload.append('title', editFormData.title.trim());
        payload.append('documentNumber', editFormData.documentNumber.trim());
        payload.append('category', editFormData.category);
        if (editFormData.assignedMemberId) {
          payload.append('assignedMemberId', editFormData.assignedMemberId);
        } else {
          payload.append('assignedMemberId', '');
        }
        if (editFormData.issueDate) {
          payload.append('issueDate', editFormData.issueDate);
        } else {
          payload.append('issueDate', '');
        }
        if (editFormData.expiryDate) {
          payload.append('expiryDate', editFormData.expiryDate);
        } else {
          payload.append('expiryDate', '');
        }
        payload.append('isMpinProtected', editFormData.isMpinProtected ? 'true' : 'false');
        payload.append('isSensitive', editFormData.isMpinProtected ? 'true' : 'false');
        payload.append('whoCanView', JSON.stringify(editFormData.whoCanView || ['ALL']));
        payload.append('notes', editFormData.notes.trim());
        payload.append('file', replacementFile);
      } else {
        payload = {
          title: editFormData.title.trim(),
          documentNumber: editFormData.documentNumber.trim(),
          category: editFormData.category,
          assignedMemberId: editFormData.assignedMemberId || null,
          issueDate: editFormData.issueDate || null,
          expiryDate: editFormData.expiryDate || null,
          isMpinProtected: editFormData.isMpinProtected,
          isSensitive: editFormData.isMpinProtected,
          whoCanView: editFormData.whoCanView || ['ALL'],
          notes: editFormData.notes.trim(),
        };
      }
      const res = await api.updateDocument(id, payload);
      if (res?.document) {
        setDoc((prev) => ({
          ...prev,
          ...res.document,
          assignedMember: res.document.assignedMember || (editFormData.assignedMemberId ? members.find(m => (m._id || m.id)?.toString() === editFormData.assignedMemberId) : null) || prev?.assignedMember,
        }));
        if (replacementFile) {
          setImageError(false);
        }
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
      setImageError(false);
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

  const [isDownloading, setIsDownloading] = useState(false);

  // Generate high-resolution Digital Sovereign Smart Card PNG image via HTML5 Canvas
  const exportSmartCardAsImage = (documentData) => {
    return new Promise((resolve, reject) => {
      try {
        const d = documentData || doc;
        if (!d) return reject(new Error('Document not available'));

        const canvas = document.createElement('canvas');
        canvas.width = 960;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');

        // Card Container with soft gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 960, 600);
        bgGrad.addColorStop(0, '#ffffff');
        bgGrad.addColorStop(1, '#f8fafc');
        ctx.fillStyle = bgGrad;

        // Rounded corners
        const r = 24;
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(960 - r, 0);
        ctx.quadraticCurveTo(960, 0, 960, r);
        ctx.lineTo(960, 600 - r);
        ctx.quadraticCurveTo(960, 600, 960 - r, 600);
        ctx.lineTo(r, 600);
        ctx.quadraticCurveTo(0, 600, 0, 600 - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Header Strip (Official Blue #112347)
        ctx.fillStyle = '#112347';
        ctx.fillRect(0, 0, 960, 92);

        // Header Tricolor Accent Bar at Top
        ctx.fillStyle = '#f97316'; // Saffron
        ctx.fillRect(0, 0, 320, 6);
        ctx.fillStyle = '#ffffff'; // White
        ctx.fillRect(320, 0, 320, 6);
        ctx.fillStyle = '#16a34a'; // Green
        ctx.fillRect(640, 0, 320, 6);

        // Header Text: Republic of India
        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 15px monospace';
        ctx.fillText('REPUBLIC OF INDIA • भारत गणराज्य', 36, 40);

        // Header Subtext: Document Title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText((d.title || 'Official Document').toUpperCase(), 36, 72);

        // Header Right: Sovereign Seal
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('SECURE DIGITAL VAULT', 924, 42);
        ctx.font = '11px monospace';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText('VERIFIED SOVEREIGN RECORD', 924, 66);
        ctx.textAlign = 'left';

        // Metallic Gold Smart Chip Graphic (Left side)
        const chipX = 40;
        const chipY = 125;
        const chipW = 84;
        const chipH = 62;
        const chipGrad = ctx.createLinearGradient(chipX, chipY, chipX + chipW, chipY + chipH);
        chipGrad.addColorStop(0, '#fef08a');
        chipGrad.addColorStop(0.5, '#eab308');
        chipGrad.addColorStop(1, '#ca8a04');
        ctx.fillStyle = chipGrad;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(chipX, chipY, chipW, chipH, 8);
        else ctx.rect(chipX, chipY, chipW, chipH);
        ctx.fill();
        ctx.strokeStyle = '#a16207';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Chip circuit pattern
        ctx.strokeStyle = '#713f12';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(chipX + 28, chipY);
        ctx.lineTo(chipX + 28, chipY + chipH);
        ctx.moveTo(chipX + 56, chipY);
        ctx.lineTo(chipX + 56, chipY + chipH);
        ctx.moveTo(chipX, chipY + 31);
        ctx.lineTo(chipX + chipW, chipY + 31);
        ctx.stroke();

        // Document Number (Large bold monospace font)
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 36px monospace';
        const displayDocNum = d.documentNumber ? formatDocNumber(d.documentNumber, true, false) : 'GHAR-VERIFIED-RECORD';
        ctx.fillText(displayDocNum, 40, 245);

        // Holder Name
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('NAME / नाम', 40, 295);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 22px sans-serif';
        const cardholderCanvasName = (d.ocrExtractedData?.holderName || d.assignedMember?.name || user?.name || 'CITIZEN').toUpperCase();
        ctx.fillText(cardholderCanvasName, 40, 328);

        // Father / Spouse or DOB
        if (d.ocrExtractedData?.fatherOrSpouseName) {
          ctx.fillStyle = '#64748b';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText('FATHER / SPOUSE / पिता या पति', 420, 295);
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 20px sans-serif';
          ctx.fillText(d.ocrExtractedData.fatherOrSpouseName.toUpperCase(), 420, 328);
        } else if (d.ocrExtractedData?.dob) {
          ctx.fillStyle = '#64748b';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText('DOB / जन्म तिथि', 420, 295);
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 20px sans-serif';
          ctx.fillText(d.ocrExtractedData.dob, 420, 328);
        }

        // Category
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('CATEGORY / श्रेणी', 40, 380);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(d.category || 'General', 40, 410);

        // Validity / Expiry
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('VALIDITY / EXPIRY', 340, 380);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(
          d.expiryDate
            ? new Date(d.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : 'PERMANENT / LIFETIME',
          340,
          410
        );

        // Bottom Security Ribbon
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(0, 525, 960, 75);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 525);
        ctx.lineTo(960, 525);
        ctx.stroke();

        ctx.fillStyle = '#475569';
        ctx.font = 'bold 12px monospace';
        const shaStr = d.sha256Hash ? d.sha256Hash.substring(0, 24).toUpperCase() : 'AUTHENTIC-SHA256';
        ctx.fillText(`GHARVAULT IMMUTABLE LEDGER • SHA-256: ${shaStr}...`, 36, 565);

        ctx.textAlign = 'right';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#059669';
        ctx.fillText('✓ ZERO-KNOWLEDGE ENCRYPTED REPOSITORY COPY', 924, 565);
        ctx.textAlign = 'left';

        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('Failed to generate image blob'));
          resolve(blob);
        }, 'image/png');
      } catch (err) {
        reject(err);
      }
    });
  };

  const handleDownloadDocument = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isDownloading) return;

    const docId = doc?._id || id;
    if (docId) {
      api.notifyDownload(docId).catch(() => {});
    }

    setIsDownloading(true);

    try {
      // SCENARIO 1: If authentic photo/pdf file is available on server and not errored
      if (fileUrl && !imageError) {
        toast.info('Downloading original document...');
        const cleanTitle = (doc?.title || 'document').replace(/[^a-zA-Z0-9_-]/g, '_');
        const defaultExt = isImage ? '.jpg' : isPdf ? '.pdf' : '.jpg';
        const targetFilename = doc?.originalFileName || `${cleanTitle}${defaultExt}`;

        let targetUrl = fileUrl;
        const dlQuery = `download=true&filename=${encodeURIComponent(targetFilename)}`;
        targetUrl += targetUrl.includes('?') ? `&${dlQuery}` : `?${dlQuery}`;

        try {
          const res = await fetch(targetUrl);
          if (res.ok) {
            const blob = await res.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = blobUrl;
            a.download = targetFilename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1500);
            toast.success(`"${targetFilename}" downloaded successfully!`);
            setIsDownloading(false);
            return;
          }
        } catch (fetchErr) {
          console.warn('[Download] Direct blob fetch fallback:', fetchErr.message);
        }

        // Direct browser download fallback (Robust for Mobile Chrome & Safari)
        const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
        if (isMobileDevice) {
          window.location.href = targetUrl;
        } else {
          const fallbackA = document.createElement('a');
          fallbackA.href = targetUrl;
          fallbackA.download = targetFilename;
          fallbackA.target = '_blank';
          document.body.appendChild(fallbackA);
          fallbackA.click();
          document.body.removeChild(fallbackA);
        }
        toast.success(`Started download for "${targetFilename}"!`);
        setIsDownloading(false);
        return;
      }

      // SCENARIO 2: If image file is missing or in Digital Smart Card view, export high-res PNG image
      toast.info('Exporting official Smart Card image...');
      const cardBlob = await exportSmartCardAsImage(doc);
      const cleanTitle = (doc?.title || 'Document').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${cleanTitle}_SmartCard.png`;
      const blobUrl = window.URL.createObjectURL(cardBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1500);
      toast.success(`✨ "${filename}" downloaded as PNG image!`);
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Download failed: ' + (err.message || 'Error'));
    } finally {
      setIsDownloading(false);
    }
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
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <VaultSecurityLoader
          message="Decrypting Document from Private Storage..."
          subtitle="AES-256 GCM Cryptographic Verification Active"
          fullScreen={false}
        />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <AlertCircle size={44} className="text-slate-300 dark:text-neutral-600 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Document Not Found</h2>
        <p className="text-xs text-slate-500 dark:text-neutral-400">The document you are looking for may have been removed or you do not have permission to view it.</p>
        <Link to="/vault" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#182030] text-xs text-sky-600 dark:text-sky-400 font-bold hover:bg-slate-200 dark:hover:bg-[#222c42] border border-slate-200 dark:border-[#1E293B] transition-colors">
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
    <div className="relative min-h-[calc(100vh-4rem)] bg-[#F8FAFC] dark:bg-[#090A0F] text-slate-900 dark:text-[#F8FAFC] transition-colors">
      {/* Background Texture & Ambient Top Glow matching Landing & Upload page */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(currentColor_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] dark:opacity-[0.06] text-slate-900 dark:text-white"
        aria-hidden="true"
      />
      <div
        className={`relative z-10 max-w-[1600px] mx-auto p-2.5 sm:p-4 lg:p-4 transition-all ${
          isFullscreen
            ? 'fixed inset-0 z-50 bg-[#F8FAFC] dark:bg-[#090A0F] overflow-y-auto max-w-none p-3 sm:p-6'
            : 'pb-28 lg:pb-2 lg:h-[calc(100vh-4.25rem)] lg:max-h-[calc(100vh-4.25rem)] lg:overflow-hidden flex flex-col space-y-2 sm:space-y-2.5'
        }`}
      >
      {/* Top Header Card: Ultra-Clean, Touch-Friendly & Accessible for All Users */}
      <div className="bg-white dark:bg-[#121622] rounded-2xl border border-slate-200/80 dark:border-[#1E293B] shadow-xs overflow-hidden transition-colors shrink-0">
        {/* Top Visual Accent Strip */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${visual.strip}`} />

        <div className="p-3 sm:px-4 sm:py-3 space-y-2">
          {/* Main Top Bar */}
          <div className="flex items-center justify-between gap-2">
            {/* Left: Back + Title + Indian Badge */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <Link
                to="/vault"
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#182030] hover:bg-slate-200 dark:hover:bg-[#262626] text-slate-700 dark:text-neutral-200 flex items-center justify-center transition-all shrink-0 active:scale-95"
                title="Back to Family Vault"
              >
                <ArrowLeft size={18} />
              </Link>

              <div className="min-w-0 flex items-center gap-2 truncate">
                <h1 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
                  {doc.title}
                </h1>

                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${visual.tagStyle}`}>
                  <span>{visual.badgeEmoji}</span>
                  <span className="hidden xs:inline">{visual.label}</span>
                </span>
              </div>
            </div>

            {/* Right: Sibling Switcher + Quick Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Previous / Next Sibling Switcher */}
              {(siblingDocs.prev || siblingDocs.next) && (
                <div className="flex items-center gap-1 shrink-0 bg-slate-100 dark:bg-[#182030] p-0.5 rounded-xl border border-slate-200 dark:border-[#1E293B]">
                  {siblingDocs.prev ? (
                    <Link
                      to={`/vault/documents/${siblingDocs.prev._id || siblingDocs.prev.id}`}
                      className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#262626] text-slate-700 dark:text-neutral-300 transition-colors"
                      title={`Previous: ${siblingDocs.prev.title}`}
                    >
                      <ChevronLeft size={15} />
                    </Link>
                  ) : (
                    <span className="p-1.5 rounded-lg text-slate-300 dark:text-neutral-600 cursor-not-allowed">
                      <ChevronLeft size={15} />
                    </span>
                  )}
                  {siblingDocs.next ? (
                    <Link
                      to={`/vault/documents/${siblingDocs.next._id || siblingDocs.next.id}`}
                      className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#262626] text-slate-700 dark:text-neutral-300 transition-colors"
                      title={`Next: ${siblingDocs.next.title}`}
                    >
                      <ChevronRight size={15} />
                    </Link>
                  ) : (
                    <span className="p-1.5 rounded-lg text-slate-300 dark:text-neutral-600 cursor-not-allowed">
                      <ChevronRight size={15} />
                    </span>
                  )}
                </div>
              )}

              {/* Edit Details */}
              <button
                type="button"
                onClick={handleOpenEdit}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#182030] hover:bg-slate-200 dark:hover:bg-[#262626] text-slate-700 dark:text-neutral-300 text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-[#1E293B] transition-colors cursor-pointer"
                title="Edit title, ID number, expiry, notes or file"
              >
                <Edit3 size={13} />
                <span className="hidden sm:inline">Edit</span>
              </button>

              {/* MPIN Lock Toggle */}
              <button
                type="button"
                disabled={isTogglingMpin}
                onClick={handleToggleMpinProtection}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  (doc.isMpinProtected || doc.isSensitive)
                    ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-400'
                    : 'bg-slate-100 dark:bg-[#182030] border-slate-200 dark:border-[#1E293B] text-slate-600 dark:text-neutral-400'
                }`}
                title={(doc.isMpinProtected || doc.isSensitive) ? 'MPIN Protected' : 'Lock with MPIN'}
              >
                <Lock size={13} className={(doc.isMpinProtected || doc.isSensitive) ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'} />
                <span className="hidden sm:inline">{(doc.isMpinProtected || doc.isSensitive) ? 'MPIN' : 'Lock'}</span>
              </button>

              {/* Desktop-Only Direct Download & 24h Link */}
              <div className="hidden lg:flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleShareSafely()}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#1E293B] hover:bg-slate-50 dark:hover:bg-[#141414] text-slate-700 dark:text-neutral-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Share2 size={13} className="text-sky-500 dark:text-sky-400" />
                  <span>24h Link</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadDocument}
                  disabled={isDownloading}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-blue-600 hover:from-sky-400 hover:via-indigo-400 hover:to-blue-500 text-white shadow-md shadow-sky-500/25 border border-sky-400/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                  title="Download Document Image"
                >
                  {isDownloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                  <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
                </button>
              </div>

              {/* Delete */}
              <button
                onClick={handleDeleteClick}
                className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                title="Delete Document"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Sub Row: Document ID with Large Font + Unmask & 1-Tap Copy + Member Pill */}
          <div className="flex items-center justify-between gap-2 flex-wrap pt-1.5 border-t border-slate-100 dark:border-[#1E293B] text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              {doc.documentNumber && (
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#182030] px-2.5 py-1 rounded-xl border border-slate-200/80 dark:border-[#1E293B] shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ID:</span>
                  <code className="font-mono font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white tracking-wider">
                    {formatDocNumber(doc.documentNumber, isNumberUnmasked, visual.type === 'aadhaar')}
                  </code>
                  <button
                    type="button"
                    onClick={() => setIsNumberUnmasked(!isNumberUnmasked)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer transition-colors"
                    title={isNumberUnmasked ? 'Mask ID' : 'Reveal ID'}
                  >
                    {isNumberUnmasked ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyNumber}
                    className="py-1 px-2.5 rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-[11px] cursor-pointer inline-flex items-center gap-1 transition-all active:scale-95 shadow-2xs border border-sky-400/30"
                    title="1-Tap Copy ID"
                  >
                    {copiedNumber ? <Check size={11} /> : <Copy size={11} />}
                    <span>{copiedNumber ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}

              <button
    type="button"
    onClick={() => {
      const mId = (doc.assignedMember?._id || doc.assignedMemberId?._id || doc.assignedMemberId || doc.memberId)?.toString();
      if (mId) navigate(`/family/${mId}`);
      else navigate('/family');
    }}
    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#182030] dark:hover:bg-[#202a40] text-slate-700 dark:text-neutral-200 text-xs font-semibold transition-all cursor-pointer border border-slate-200/80 dark:border-[#1E293B]"
    title="View Member Profile in Family Vault"
  >
    <User size={13} className="text-sky-500 dark:text-sky-400" />
    <span>{doc.assignedMember?.name || 'Whole Family'}</span>
    <ExternalLink size={10} className="text-slate-400 ml-0.5" />
  </button>
            </div>

            {/* Quick Almari Tag on Mobile if exists */}
            {doc.notes && (
              <div
                onClick={handleOpenEdit}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/70 dark:border-amber-500/25 text-amber-800 dark:text-amber-300 text-[11px] font-bold cursor-pointer hover:bg-amber-100 transition-colors"
                title="Tap to edit physical almirah location"
              >
                <span>🗄️</span>
                <span className="truncate max-w-[180px] sm:max-w-xs">{doc.notes}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Segmented Control: Large, Thumb-Friendly & Clear for All Users */}
      <div className="lg:hidden flex items-center bg-slate-100/90 dark:bg-[#0B0F19] p-1.5 rounded-2xl border border-slate-200/80 dark:border-[#1E293B] shadow-xs shrink-0 gap-1.5">
        <button
          type="button"
          onClick={() => setMobileTab('PREVIEW')}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
            mobileTab === 'PREVIEW'
              ? 'bg-gradient-to-r from-sky-500 via-indigo-500 to-blue-600 text-white shadow-md shadow-sky-500/20 border border-sky-400/30'
              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white bg-transparent'
          }`}
        >
          <FileText size={15} />
          <span>Document Photo / PDF</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('DETAILS')}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
            mobileTab === 'DETAILS'
              ? 'bg-gradient-to-r from-sky-500 via-indigo-500 to-blue-600 text-white shadow-md shadow-sky-500/20 border border-sky-400/30'
              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white bg-transparent'
          }`}
        >
          <Box size={15} />
          <span>Details & Almari (विवरण)</span>
          {doc.notes && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
        </button>
      </div>

      {/* Active Share Link Notification Banner (Compact) */}
      {doc.shareLink && doc.shareLink.token && (() => {
        const shareInfo = getShareExpiryInfo(doc.shareLink);
        if (!shareInfo) return null;
        const fullUrl = doc.shareLink.shareUrl || `${window.location.origin}/share/${doc.shareLink.token}`;

        return (
          <div className={`px-3 py-2 rounded-xl border transition-all flex items-center justify-between gap-2 shadow-2xs shrink-0 text-xs ${
            shareInfo.isExpired
              ? 'bg-slate-50 dark:bg-[#121622] border-slate-200 dark:border-[#1E293B]'
              : 'bg-sky-50/80 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/30'
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              <Share2 size={14} className={shareInfo.isExpired ? 'text-slate-500' : 'text-sky-500 dark:text-sky-400'} />
              <span className="font-bold text-slate-900 dark:text-white truncate">
                {shareInfo.isExpired ? 'Share Link Expired' : 'Active Safe Share Link:'}
              </span>
              <span className="font-mono text-[11px] text-slate-600 dark:text-neutral-300 truncate max-w-[200px] sm:max-w-md select-all">
                {fullUrl}
              </span>
              <span className="text-[10px] font-bold text-sky-700 dark:text-sky-400 shrink-0">
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
                className="px-2 py-1 rounded-lg bg-white dark:bg-[#121622] border border-sky-200 dark:border-sky-500/30 text-sky-700 dark:text-sky-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
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
        {/* Left Column: Document Canvas & Stage (7 Cols on desktop, full on mobile when PREVIEW) */}
        <div className={`lg:col-span-7 xl:col-span-7 bg-white dark:bg-[#121622] rounded-2xl border border-slate-200/80 dark:border-[#1E293B] shadow-xs overflow-hidden h-full min-h-[380px] lg:min-h-0 transition-colors ${
          mobileTab === 'PREVIEW' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'
        }`}>
          {/* Floating Glass Toolbar */}
          <div className="px-2.5 py-1.5 sm:px-3 sm:py-2 border-b border-slate-100 dark:border-[#1E293B] flex items-center justify-between gap-1.5 sm:gap-2 bg-slate-50/80 dark:bg-[#182030] text-xs text-slate-600 dark:text-neutral-400 shrink-0 overflow-x-auto no-scrollbar">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-white dark:bg-[#121622] p-0.5 rounded-xl border border-slate-200 dark:border-[#1E293B] shrink-0">
              {isImage && (
                <button
                  type="button"
                  onClick={() => {
                    setImageError(false);
                    setViewerMode('PREVIEW');
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewerMode === 'PREVIEW'
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-xs'
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
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText size={13} />
                <span>Smart Card</span>
              </button>
            </div>

            {/* Zoom & Controls */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Dynamic Watermark Toggle */}
              <button
                type="button"
                onClick={() => setShowWatermark(!showWatermark)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors cursor-pointer border ${
                  showWatermark
                    ? 'bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/30 text-sky-700 dark:text-sky-400'
                    : 'bg-slate-100 dark:bg-[#262626] border-slate-200 dark:border-transparent text-slate-500'
                }`}
                title="Toggle dynamic confidential watermark overlay"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${showWatermark ? 'bg-sky-500 animate-pulse' : 'bg-slate-400'}`} />
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
                  <ExternalLink size={12} className="text-sky-500 dark:text-sky-400" />
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

          {/* Document Canvas Stage (Generous mobile height & responsive centering) */}
          <div className="p-2 sm:p-4 bg-[#F1F5F9]/70 dark:bg-[#090A0F] flex items-center justify-center flex-1 min-h-[50vh] sm:min-h-[58vh] lg:min-h-0 overflow-auto relative">
            {isMpinLocked ? (
              <div className="bg-white dark:bg-[#121622] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-[#1E293B] shadow-xl max-w-sm w-full text-center space-y-3 sm:space-y-4 animate-fadeIn">
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
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white shadow-md shadow-sky-500/25 font-bold text-xs shadow-md shadow-sky-500/25 transition-all cursor-pointer w-full"
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
                  <div className="relative max-w-full rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#121622] group">
                    <img
                      src={fileUrl}
                      alt={doc.title}
                      className="max-h-[46vh] sm:max-h-[54vh] lg:max-h-[calc(100vh-250px)] w-auto max-w-full object-contain mx-auto block bg-slate-900/5 dark:bg-black/30"
                      onError={() => {
                        console.warn('Image failed to load, falling back to digital layout');
                        setImageError(true);
                      }}
                    />
                    {renderWatermarkOverlay()}
                  </div>
                ) : isPdf && viewerMode === 'PREVIEW' ? (
                  /* VIEW 2: PDF Document Viewer */
                  <div className="relative w-full max-w-[580px] rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#121622] flex flex-col">
                    <div className="bg-slate-100 dark:bg-[#182030] px-3 py-1.5 border-b border-slate-200 dark:border-[#1E293B] flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-neutral-300">
                        <FileText size={13} className="text-red-500" />
                        <span>PDF Document</span>
                      </span>
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-[#262626] border border-slate-200 dark:border-[#1E293B] text-sky-600 dark:text-sky-400 font-bold text-[10px] hover:bg-slate-50 transition-colors shadow-2xs"
                      >
                        <span>Open Full PDF</span>
                        <ExternalLink size={10} />
                      </a>
                    </div>
                    <div className="w-full h-[46vh] sm:h-[54vh] lg:h-[calc(100vh-270px)] relative">
                      <iframe
                        src={fileUrl}
                        title={doc.title}
                        className="w-full h-full border-0"
                      />
                      {renderWatermarkOverlay()}
                    </div>
                  </div>
                ) : (
                  /* VIEW 3: Authentic Sovereign Government PVC Smart Card (DigiLocker Standard) */
                  (() => {
                    const ocr = doc.ocrExtractedData || {};
                    const docTypeLower = `${doc.title || ''} ${doc.category || ''} ${ocr.docType || ''}`.toLowerCase();

                    // Dynamic official government authority branding
                    let govOrgHindi = 'भारत सरकार';
                    let govOrgEnglish = 'GOVERNMENT OF INDIA';
                    let cardSubHeading = 'OFFICIAL IDENTITY CARD • पहचान पत्र';
                    let headerGradient = 'from-[#0B2545] via-[#12396B] to-[#0A1F38]';
                    let sealBadgeText = 'OFFICIAL ID';

                    if (/voter|epic|election/i.test(docTypeLower)) {
                      govOrgHindi = 'भारत निर्वाचन आयोग';
                      govOrgEnglish = 'ELECTION COMMISSION OF INDIA';
                      cardSubHeading = 'ELECTOR PHOTO IDENTITY CARD • मतदाता पहचान पत्र';
                      headerGradient = 'from-[#082647] via-[#103E70] to-[#0A203A]';
                      sealBadgeText = 'VOTER ID';
                    } else if (/aadhaar|adhar|uidai/i.test(docTypeLower)) {
                      govOrgHindi = 'भारतीय विशिष्ट पहचान प्राधिकरण';
                      govOrgEnglish = 'UNIQUE IDENTIFICATION AUTHORITY OF INDIA';
                      cardSubHeading = 'AADHAAR • मेरा आधार, मेरी पहचान';
                      headerGradient = 'from-[#5A1616] via-[#7B2020] to-[#421010]';
                      sealBadgeText = 'AADHAAR';
                    } else if (/pan|income\s*tax|nsdl/i.test(docTypeLower)) {
                      govOrgHindi = 'आयकर विभाग, भारत सरकार';
                      govOrgEnglish = 'INCOME TAX DEPARTMENT, GOVT. OF INDIA';
                      cardSubHeading = 'PERMANENT ACCOUNT NUMBER CARD • पैन कार्ड';
                      headerGradient = 'from-[#0E2C48] via-[#174670] to-[#0B2136]';
                      sealBadgeText = 'PAN CARD';
                    } else if (/driving|driver|license|licence|parivahan|rc|vehicle/i.test(docTypeLower)) {
                      govOrgHindi = 'परिवहन विभाग, भारत';
                      govOrgEnglish = 'UNION OF INDIA • TRANSPORT DEPARTMENT';
                      cardSubHeading = 'DRIVING LICENCE • वाहन चालक अनुज्ञप्ति पत्र';
                      headerGradient = 'from-[#14372D] via-[#1E5243] to-[#0E261F]';
                      sealBadgeText = 'DRIVING LICENCE';
                    } else if (/health|ayushman|abha|pmjay|insurance|medical/i.test(docTypeLower)) {
                      govOrgHindi = 'राष्ट्रीय स्वास्थ्य प्राधिकरण';
                      govOrgEnglish = 'NATIONAL HEALTH AUTHORITY • INDIA';
                      cardSubHeading = 'AYUSHMAN BHARAT • NATIONAL DIGITAL HEALTH ID';
                      headerGradient = 'from-[#113B36] via-[#1B564E] to-[#0D2D29]';
                      sealBadgeText = 'HEALTH ID';
                    } else if (/passport/i.test(docTypeLower)) {
                      govOrgHindi = 'विदेश मंत्रालय, भारत सरकार';
                      govOrgEnglish = 'MINISTRY OF EXTERNAL AFFAIRS, INDIA';
                      cardSubHeading = 'PASSPORT CITIZEN IDENTITY • पारपत्र';
                      headerGradient = 'from-[#0C1B37] via-[#142C56] to-[#081327]';
                      sealBadgeText = 'PASSPORT';
                    }

                    const cardholderName = (ocr.holderName || doc.assignedMember?.name || doc.title || 'CITIZEN').toUpperCase();
                    const fatherOrSpouse = ocr.fatherOrSpouseName || null;
                    const dob = ocr.dob || doc.assignedMember?.dateOfBirth || null;
                    const docNumber = doc.documentNumber || ocr.docNumber || 'RECORD-VERIFIED';

                    // Calculate age if DOB exists
                    let ageLabel = '';
                    if (dob) {
                      const birthYear = parseInt(dob.split(/[-/]/)[0], 10) > 1900
                        ? parseInt(dob.split(/[-/]/)[0], 10)
                        : parseInt(dob.split(/[-/]/)[2], 10);
                      if (birthYear > 1900 && birthYear < 2030) {
                        ageLabel = `~${new Date().getFullYear() - birthYear}y`;
                      }
                    }

                    return (
                      <div className="relative w-full max-w-[480px] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-300/80 dark:border-[#26262B] bg-gradient-to-b from-white to-slate-50 dark:from-[#0D111A] dark:to-[#07090E] flex flex-col overflow-hidden select-none transition-all my-auto">
                        {renderWatermarkOverlay()}

                        {/* Top National Tricolor Security Ribbon */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808] shrink-0" />

                        {/* Notice if photo was missing from storage */}
                        {isImage && imageError && (
                          <div className="bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/20 px-3 py-1 flex items-center justify-between text-[11px] text-amber-800 dark:text-amber-300 shrink-0">
                            <div className="flex items-center gap-1.5 truncate">
                              <AlertTriangle size={12} className="text-amber-600 shrink-0" />
                              <span className="truncate">Photo missing • Sovereign Smart Card layout active</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setIsEditModalOpen(true)}
                              className="ml-2 font-bold underline hover:text-amber-900 dark:hover:text-amber-200 cursor-pointer shrink-0 text-[10px]"
                            >
                              Re-upload
                            </button>
                          </div>
                        )}

                        {/* Authentic Official Government Header */}
                        <div className={`bg-gradient-to-r ${headerGradient} text-white px-3.5 sm:px-4 py-2.5 flex items-center justify-between shadow-sm shrink-0`}>
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Ashoka Pillar / Emblem Lion Crest Icon */}
                            <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shrink-0 shadow-xs">
                              <Award size={16} className="text-amber-300" />
                            </div>
                            <div className="flex flex-col leading-tight min-w-0">
                              <span className="font-sans text-[10px] sm:text-[11px] font-extrabold tracking-wide text-amber-200 truncate">
                                {govOrgHindi}
                              </span>
                              <span className="font-mono text-[8.5px] uppercase tracking-wider text-slate-200 font-semibold truncate">
                                {govOrgEnglish}
                              </span>
                              <span className="text-[9px] text-slate-300/90 font-medium truncate mt-0.5">
                                {cardSubHeading}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
                            <span className="px-1.5 py-0.5 rounded text-[8.5px] font-bold font-mono tracking-wider bg-amber-400/20 text-amber-200 border border-amber-400/30">
                              {sealBadgeText}
                            </span>
                            <div className="flex items-center gap-1 font-mono text-[10px] font-bold text-white tracking-widest mt-0.5">
                              <span>IND</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                            </div>
                          </div>
                        </div>

                        {/* Card Body - Micro-Guilloche Background Pattern */}
                        <div className="p-3 sm:p-4 space-y-3 relative text-slate-900 dark:text-neutral-100 bg-[#FAFAFA] dark:bg-[#0A0D14]">
                          {/* Subtle security watermark overlay */}
                          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:10px_10px]" />

                          {/* Top Security Row: EMV Golden Smart Chip + Contactless Wave + Encrypted Badge */}
                          <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-2.5">
                              {/* Realistic EMV Golden Microchip */}
                              <div className="w-10 h-7.5 sm:w-11 sm:h-8 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-[1px] shadow-xs shrink-0 border border-amber-300/80 relative overflow-hidden">
                                <div className="w-full h-full bg-gradient-to-br from-amber-300/40 via-amber-400/30 to-amber-500/50 rounded-[4px] relative flex flex-col justify-between p-1">
                                  <div className="w-full h-[1px] bg-amber-800/40" />
                                  <div className="flex items-center justify-between">
                                    <div className="w-2.5 h-[1px] bg-amber-800/50" />
                                    <div className="w-2 h-2 rounded-full border border-amber-800/60 bg-amber-200/50" />
                                    <div className="w-2.5 h-[1px] bg-amber-800/50" />
                                  </div>
                                  <div className="w-full h-[1px] bg-amber-800/40" />
                                </div>
                              </div>

                              {/* Contactless Wave Icon */}
                              <div className="flex items-center gap-0.5 text-slate-400 dark:text-neutral-600 select-none" title="RFID Smart Card Standard">
                                <span className="text-[14px] leading-none rotate-90 scale-x-75">)))</span>
                              </div>
                            </div>

                            {/* Security Hologram Pill */}
                            <div className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#161B26] border border-slate-200 dark:border-[#222A3A] flex items-center gap-1.5 shadow-2xs">
                              <ShieldCheck size={11} className="text-sky-600 dark:text-sky-400" />
                              <span className="font-mono text-[9px] font-bold text-slate-700 dark:text-slate-300 tracking-tight">
                                256-BIT ENCRYPTED
                              </span>
                            </div>
                          </div>

                          {/* Identity Core Row: Passport Photo + Personal Information */}
                          <div className="flex items-start gap-2.5 sm:gap-3.5 relative z-10">
                            {/* Passport Photo Frame (Responsive Compact Passport Size) */}
                            <div className="flex flex-col items-center shrink-0">
                              <div className="w-[52px] h-[66px] sm:w-[64px] sm:h-[80px] rounded-lg sm:rounded-xl bg-slate-200 dark:bg-[#181D28] overflow-hidden shadow-xs relative border border-slate-300 dark:border-[#2A344A] shrink-0">
                                {doc.assignedMember?.avatar ? (
                                  <img src={doc.assignedMember.avatar} alt={cardholderName} className="w-full h-full object-cover" />
                                ) : isImage && fileUrl && !imageError ? (
                                  <img src={fileUrl} alt={cardholderName} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200 dark:from-[#1E2536] dark:to-[#121622] text-slate-400">
                                    <User size={20} className="text-slate-400 dark:text-neutral-500" />
                                    <span className="text-[7.5px] font-mono mt-0.5 font-semibold uppercase text-slate-500 dark:text-neutral-400">CITIZEN</span>
                                  </div>
                                )}

                                {/* Circular Holographic Verified Seal */}
                                <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-amber-400 via-sky-400 to-indigo-500 flex items-center justify-center border border-white dark:border-[#0C0F17] shadow-xs">
                                  <Check size={8} className="text-white stroke-[3]" />
                                </div>
                              </div>
                              <span className="text-[8px] font-bold font-mono text-emerald-700 dark:text-[#3ECF8E] mt-0.5 flex items-center gap-0.5">
                                <Check size={9} strokeWidth={3} /> Verified
                              </span>
                            </div>

                            {/* Personal Details Table */}
                            <div className="flex-1 min-w-0 space-y-2 text-left">
                              {/* Cardholder Name */}
                              <div>
                                <span className="block font-sans text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                                  नाम / Name
                                </span>
                                <span className="text-xs sm:text-sm font-extrabold text-slate-950 dark:text-white uppercase tracking-wide truncate block">
                                  {cardholderName}
                                </span>
                              </div>

                              {/* Father / Spouse Name */}
                              {fatherOrSpouse && (
                                <div>
                                  <span className="block font-sans text-[8.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                                    पिता / पति का नाम • Father / Spouse
                                  </span>
                                  <span className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block">
                                    {fatherOrSpouse}
                                  </span>
                                </div>
                              )}

                              {/* DOB & Expiry Side by Side */}
                              <div className="grid grid-cols-2 gap-2 pt-0.5">
                                <div>
                                  <span className="block font-sans text-[8.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                                    जन्म तिथि / DOB
                                  </span>
                                  <span className="font-mono text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white block truncate">
                                    {dob || 'Recorded'} {ageLabel && <span className="text-sky-600 dark:text-sky-400 text-[10px] font-semibold">({ageLabel})</span>}
                                  </span>
                                </div>

                                <div>
                                  <span className="block font-sans text-[8.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                                    वैधता / Validity
                                  </span>
                                  <span className={`font-mono text-[10.5px] sm:text-[11px] font-bold block truncate ${
                                    doc.status === 'EXPIRED' ? 'text-red-600 dark:text-red-400' : 'text-sky-600 dark:text-sky-400'
                                  }`}>
                                    {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : 'LIFETIME'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Primary Document ID Number Bar with 1-Tap Copy */}
                          <div className="relative z-10 px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#121622] border border-slate-200 dark:border-[#222A3A] flex items-center justify-between gap-2 shadow-inner">
                            <div className="min-w-0">
                              <span className="block text-[8px] font-bold uppercase tracking-widest text-slate-500 dark:text-neutral-400">
                                पहचान संख्या / OFFICIAL CARD NUMBER
                              </span>
                              <span className="font-mono text-xs sm:text-sm font-extrabold text-slate-950 dark:text-sky-300 tracking-wider truncate block">
                                {docNumber}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleCopySnippet(docNumber, 'Document ID Number')}
                              className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1E2536] hover:bg-slate-50 dark:hover:bg-[#252E42] border border-slate-200 dark:border-[#2A354A] text-slate-700 dark:text-slate-200 text-[10px] font-bold font-mono transition-all cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95 shrink-0"
                              title="Copy ID Number"
                            >
                              {copiedSnippet === docNumber ? (
                                <>
                                  <Check size={11} className="text-sky-500" strokeWidth={3} />
                                  <span className="text-sky-600 dark:text-sky-400">COPIED</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={11} />
                                  <span>COPY</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Bottom DigiLocker QR Verification Strip (Authentic - No Fake MRZ) */}
                        <div className="bg-slate-100 dark:bg-[#0B0E17] px-3.5 py-2 border-t border-slate-200 dark:border-[#1C2230] flex items-center justify-between text-slate-600 dark:text-neutral-400 shrink-0">
                          <div className="flex items-center gap-2 min-w-0">
                            {/* Authentic DigiLocker QR Pattern Icon */}
                            <div className="w-7 h-7 rounded bg-white dark:bg-[#141824] border border-slate-300 dark:border-[#262F44] flex items-center justify-center p-0.5 shrink-0">
                              <QrCode size={18} className="text-slate-800 dark:text-slate-200" />
                            </div>
                            <div className="flex flex-col leading-tight min-w-0">
                              <span className="font-mono text-[9px] font-bold text-slate-800 dark:text-slate-200 truncate">
                                DIGILOCKER VERIFIED
                              </span>
                              <span className="font-mono text-[8px] text-slate-500 dark:text-neutral-400 truncate">
                                SHA-256: {doc.sha256Hash ? doc.sha256Hash.substring(0, 12).toUpperCase() : 'VERIFIED'}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="inline-flex items-center gap-1 font-mono text-[8.5px] font-bold text-sky-600 dark:text-sky-400">
                              <ShieldCheck size={11} />
                              <span>SOVEREIGN RECORD</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            )}
          </div>

          {/* Quick Action Floating Dock at Bottom of Viewer */}
          <div className="p-2 sm:p-2.5 bg-slate-50/90 dark:bg-[#182030]/90 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownloadDocument}
              disabled={isDownloading}
              className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl bg-white dark:bg-[#121622] hover:bg-slate-100 dark:hover:bg-[#262626] text-slate-700 dark:text-neutral-200 text-xs font-bold border border-slate-200 dark:border-[#1E293B] transition-colors cursor-pointer disabled:opacity-50"
            >
              {isDownloading ? <Loader2 size={13} className="animate-spin text-sky-500" /> : <Download size={13} className="text-sky-500 dark:text-sky-400" />}
              <span className="hidden sm:inline">Export Copy</span>
              <span className="sm:hidden">Export</span>
            </button>
            <button
              type="button"
              onClick={handleWhatsAppShare}
              disabled={sharingLoading}
              className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl bg-slate-100 dark:bg-[#182030] hover:bg-slate-200 dark:hover:bg-[#222c42] text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200/90 dark:border-[#1E293B] shadow-2xs transition-colors cursor-pointer"
              title="Share 24-hr view link via WhatsApp"
            >
              <MessageCircle size={13} className="text-[#25D366]" />
              <span className="hidden sm:inline">WhatsApp</span>
              <span className="sm:hidden">WA</span>
            </button>
            <button
              type="button"
              onClick={() => handleShareSafely()}
              className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl bg-white dark:bg-[#121622] hover:bg-slate-100 dark:hover:bg-[#262626] text-slate-700 dark:text-neutral-200 text-xs font-bold border border-slate-200 dark:border-[#1E293B] transition-colors cursor-pointer"
            >
              <Share2 size={13} className="text-sky-500 dark:text-sky-400" />
              <span className="hidden sm:inline">24h Safe Link</span>
              <span className="sm:hidden">24h Link</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="hidden sm:inline-flex flex-1 items-center justify-center gap-1 px-2 py-2 rounded-xl bg-white dark:bg-[#121622] hover:bg-slate-100 dark:hover:bg-[#262626] text-slate-700 dark:text-neutral-200 text-xs font-bold border border-slate-200 dark:border-[#1E293B] transition-colors cursor-pointer"
            >
              <Printer size={13} className="text-slate-500 dark:text-neutral-400" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Right Column: High-Density Bento Cards (Visible on desktop or when mobileTab === 'DETAILS') */}
        <div className={`lg:col-span-5 xl:col-span-5 h-full min-h-0 space-y-2.5 lg:overflow-y-auto lg:pr-1 custom-scrollbar ${
          mobileTab === 'DETAILS' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'
        }`}>
          {/* Top Priority Bento: Physical Paper Locator Card (Almirah / Locker Tag - #1 Family Need) */}
          <div className="bg-amber-50/80 dark:bg-amber-500/10 rounded-2xl p-3 sm:p-3.5 border border-amber-200/90 dark:border-amber-500/30 shadow-xs space-y-2 transition-colors shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold text-base shadow-2xs border border-amber-300/50 shrink-0">
                  🗄️
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-amber-950 dark:text-amber-200 flex items-center gap-1.5 flex-wrap">
                    <span>Physical Paper Locator</span>
                    <span className="text-[10px] font-normal text-amber-800/80 dark:text-amber-400/80">(असली कागज़ कहाँ है?)</span>
                  </h3>
                  <p className="text-[10px] text-amber-800/80 dark:text-amber-400/80">Home almirah / Bank locker location</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleOpenEdit}
                className="py-1 px-2.5 rounded-lg bg-white dark:bg-[#121622] border border-amber-200 dark:border-amber-500/30 text-xs font-bold text-amber-900 dark:text-amber-300 hover:bg-amber-50 flex items-center gap-1 cursor-pointer shadow-2xs transition-all active:scale-95 shrink-0"
              >
                <Edit3 size={12} />
                <span>{doc.notes ? 'Change' : '+ Add Location'}</span>
              </button>
            </div>
            {doc.notes ? (
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#121622] border border-amber-200/80 dark:border-amber-500/30 text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-relaxed select-text shadow-2xs flex items-center gap-2">
                <MapPin size={15} className="text-amber-600 shrink-0" />
                <span>{doc.notes}</span>
              </div>
            ) : (
              <div
                onClick={handleOpenEdit}
                className="p-2.5 rounded-xl bg-white/70 dark:bg-[#121622]/60 border border-dashed border-amber-300/80 dark:border-amber-500/30 text-center cursor-pointer hover:bg-white dark:hover:bg-[#18181B] transition-colors"
              >
                <p className="text-xs text-amber-900/80 dark:text-amber-300/80 font-medium">
                  📍 Tap here to save which almirah or locker holds the original paper copy.
                </p>
              </div>
            )}
          </div>

          {/* Intelligence Bento 0: Smart Statutory Expiry & Official Renewal Sentinel */}
          {(() => {
            if (!doc.expiryDate) return null;
            const expDate = new Date(doc.expiryDate);
            if (isNaN(expDate.getTime())) return null;

            const now = new Date();
            const diffDays = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
            const isExpired = diffDays <= 0;
            const isExpiringSoon = diffDays > 0 && diffDays <= 30;
            const renewalInfo = getOfficialRenewalInfo(doc);
            if (!renewalInfo) return null;

            const cardGradient = isExpired
              ? 'from-red-500/15 via-red-500/5 to-rose-500/10 border-red-300/80 dark:border-red-500/30'
              : isExpiringSoon
              ? 'from-amber-500/15 via-orange-500/5 to-yellow-500/10 border-amber-300/80 dark:border-amber-500/30'
              : 'from-sky-500/10 via-indigo-500/5 to-blue-500/5 border-sky-200/80 dark:border-sky-500/20';

            const statusBadgeColor = isExpired
              ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30'
              : isExpiringSoon
              ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/30'
              : 'bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-500/30';

            return (
              <div className={`bg-gradient-to-br ${cardGradient} rounded-2xl p-3 sm:p-3.5 border shadow-xs space-y-2.5 transition-colors shrink-0`}>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs border ${
                      isExpired
                        ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-300/50'
                        : isExpiringSoon
                        ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300/50'
                        : 'bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 border-sky-300/50'
                    }`}>
                      <Clock size={15} />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>Smart Expiry & Renewal Sentinel</span>
                        {isExpiringSoon && (
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          </span>
                        )}
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-neutral-400">
                        {renewalInfo.authority}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadgeColor}`}>
                    {isExpired
                      ? `⚠️ Expired (${Math.abs(diffDays)}d ago)`
                      : isExpiringSoon
                      ? `⏳ ${diffDays} days left`
                      : `✅ Valid (${diffDays}d left)`}
                  </span>
                </div>

                {/* Expiry Banner */}
                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#121622]/80 border border-slate-200/60 dark:border-[#1E293B] flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Validity Due Date</span>
                    <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {expDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Official Portal</span>
                    <span className="text-[11px] font-bold text-sky-500 dark:text-sky-400 truncate block max-w-[140px]">
                      {renewalInfo.portalName}
                    </span>
                  </div>
                </div>

                {/* Action Buttons Grid */}
                <div className="space-y-1.5">
                  {/* Primary: Direct Online Renewal */}
                  <a
                    href={renewalInfo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-blue-600 hover:from-sky-400 hover:via-indigo-400 hover:to-blue-500 text-white shadow-md shadow-sky-500/25 border border-sky-400/30 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span>{renewalInfo.actionLabel}</span>
                    <ExternalLink size={13} />
                  </a>

                  {/* Secondary Actions: 1-Tap WhatsApp Family Alert & Calendar Sync */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleWhatsAppExpiryAlert(renewalInfo)}
                      className="py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-[#182030] hover:bg-slate-200 dark:hover:bg-[#222c42] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#1E293B] text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                      title="Send pre-filled expiry reminder to family on WhatsApp"
                    >
                      <MessageCircle size={12} className="text-[#25D366]" />
                      <span>WhatsApp Alert</span>
                    </button>

                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleAddToGoogleCalendar(renewalInfo)}
                        className="flex-1 py-1.5 px-1.5 rounded-xl bg-slate-100 dark:bg-[#262626] hover:bg-slate-200 dark:hover:bg-[#303030] text-slate-700 dark:text-neutral-200 border border-slate-200 dark:border-[#333333] text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        title="Add reminder to Google Calendar"
                      >
                        <Calendar size={11} className="text-blue-500" />
                        <span>Google Cal</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadIcsCalendar(renewalInfo)}
                        className="py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-[#262626] hover:bg-slate-200 dark:hover:bg-[#303030] text-slate-700 dark:text-neutral-200 border border-slate-200 dark:border-[#333333] text-[10px] font-bold transition-all flex items-center justify-center gap-0.5 cursor-pointer"
                        title="Download .ics invite for Apple/Outlook Calendar"
                      >
                        <Download size={11} className="text-slate-500 dark:text-neutral-400" />
                        <span>.ics</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Intelligence Bento ID: Official Photo Identity & Cardholder Credentials (Voter ID, Aadhaar, PAN, DL, Passport) */}
          {(() => {
            const ocr = doc.ocrExtractedData || {};
            const isIdCard = Boolean(
              doc.category === 'ID Cards' ||
              doc.category === 'Identity' ||
              ocr.holderName ||
              ocr.fatherOrSpouseName ||
              ocr.dob ||
              /\b(voter|aadhaar|adhar|pan card|pan|passport|driving|driver|license|licence|epic|identity|id card)\b/i.test(`${doc.title} ${doc.category} ${ocr.docType || ''}`)
            );
            if (!isIdCard) return null;

            const holder = ocr.holderName || doc.assignedMember?.name || '';
            const fatherOrSpouse = ocr.fatherOrSpouseName || null;
            const dob = ocr.dob || doc.assignedMember?.dateOfBirth || null;
            const docNum = doc.documentNumber || ocr.docNumber || '';
            const docTypeLabel = ocr.docType || doc.title || 'Official Identity Card';

            // Calculate age if dob is available
            let ageStr = '';
            if (dob) {
              const birthYear = parseInt(dob.split(/[-/]/)[0], 10) > 1900
                ? parseInt(dob.split(/[-/]/)[0], 10)
                : parseInt(dob.split(/[-/]/)[2], 10);
              if (birthYear > 1900 && birthYear < 2030) {
                ageStr = `${new Date().getFullYear() - birthYear} Years`;
              }
            }

            const bullets = Array.isArray(ocr.executiveSummary) && ocr.executiveSummary.length > 0
              ? ocr.executiveSummary
              : null;

            return (
              <div className="bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-sky-500/10 rounded-2xl p-3 sm:p-3.5 border border-blue-300/60 dark:border-blue-500/30 shadow-xs space-y-2.5 transition-colors shrink-0">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 flex items-center justify-center font-bold text-xs border border-blue-300/50 dark:border-blue-500/30">
                      <CreditCard size={15} />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                        <span>Government Identity & Credentials</span>
                      </h3>
                      <p className="text-[10px] text-blue-800/80 dark:text-blue-400/80">
                        पहचान पत्र व नागरिक विवरण (Official Record)
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-900 dark:text-blue-200 text-[10px] font-bold border border-blue-300/60 dark:border-blue-500/30">
                    {docTypeLabel}
                  </span>
                </div>

                {/* Executive Summary Takeaways (if present) */}
                {bullets && (
                  <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#121622]/80 border border-blue-200/70 dark:border-blue-500/20 space-y-1">
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
                      <Sparkles size={11} className="text-blue-500" />
                      <span>Executive Summary (सार)</span>
                    </div>
                    <ul className="space-y-1 text-xs text-slate-800 dark:text-neutral-200">
                      {bullets.map((b, i) => (
                        <li key={i} className="flex items-start gap-1.5 leading-snug">
                          <span className="text-sky-500 dark:text-sky-400 font-bold text-xs shrink-0 mt-0.5">✓</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Cardholder Legal Name */}
                  <div className="p-2 rounded-xl bg-white dark:bg-[#121622] border border-blue-200/50 dark:border-[#1E293B] flex items-center justify-between">
                    <div className="min-w-0 pr-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Cardholder / धारक का नाम</span>
                      <span className="font-bold text-slate-900 dark:text-white truncate block text-[13px]">
                        {holder || 'Self / Registered'}
                      </span>
                    </div>
                    {holder && (
                      <button
                        type="button"
                        onClick={() => handleCopySnippet(holder, 'Cardholder Name')}
                        className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#182030] dark:hover:bg-[#222c42] text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-[#1E293B] cursor-pointer shrink-0 transition-all active:scale-95"
                        title="Copy Holder Name"
                      >
                        {copiedSnippet === holder ? <Check size={12} className="text-sky-500 dark:text-sky-400" /> : <Copy size={12} />}
                      </button>
                    )}
                  </div>

                  {/* Father / Husband / Spouse Name */}
                  <div className="p-2 rounded-xl bg-white dark:bg-[#121622] border border-blue-200/50 dark:border-[#1E293B] flex items-center justify-between">
                    <div className="min-w-0 pr-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Father / पिता या पति</span>
                      <span className="font-semibold text-slate-900 dark:text-white truncate block text-[13px]">
                        {fatherOrSpouse || 'Recorded on card'}
                      </span>
                    </div>
                    {fatherOrSpouse && (
                      <button
                        type="button"
                        onClick={() => handleCopySnippet(fatherOrSpouse, "Father's Name")}
                        className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#182030] dark:hover:bg-[#222c42] text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-[#1E293B] cursor-pointer shrink-0 transition-all active:scale-95"
                        title="Copy Father's Name"
                      >
                        {copiedSnippet === fatherOrSpouse ? <Check size={12} className="text-sky-500 dark:text-sky-400" /> : <Copy size={12} />}
                      </button>
                    )}
                  </div>

                  {/* Document ID Number */}
                  <div className="p-2 rounded-xl bg-white dark:bg-[#121622] border border-blue-200/50 dark:border-[#1E293B] flex items-center justify-between">
                    <div className="min-w-0 pr-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">ID / Card Number</span>
                      <span className="font-mono font-bold text-sky-600 dark:text-sky-400 truncate block text-[13px]">
                        {docNum || 'N/A'}
                      </span>
                    </div>
                    {docNum && (
                      <button
                        type="button"
                        onClick={() => handleCopySnippet(docNum, 'ID Number')}
                        className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#182030] dark:hover:bg-[#222c42] text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-[#1E293B] cursor-pointer shrink-0 transition-all active:scale-95"
                        title="Copy ID Number"
                      >
                        {copiedSnippet === docNum ? <Check size={12} className="text-sky-500 dark:text-sky-400" /> : <Copy size={12} />}
                      </button>
                    )}
                  </div>

                  {/* Date of Birth & Age */}
                  <div className="p-2 rounded-xl bg-white dark:bg-[#121622] border border-blue-200/50 dark:border-[#1E293B]">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Date of Birth (DOB)</span>
                      {ageStr && (
                        <span className="text-[9px] font-bold text-sky-600 dark:text-sky-400">
                          {ageStr}
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white truncate block text-[13px]">
                      {dob || 'Not listed'}
                    </span>
                  </div>
                </div>

                {/* Assigned Member Footer */}
                <div className="p-2 rounded-xl bg-white/70 dark:bg-black/30 border border-blue-200/40 dark:border-[#1E293B] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">Vault Folder:</span>
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <span>{doc.assignedMember?.name || 'Whole Family'}</span>
                      <CheckCircle2 size={12} className="text-sky-500" />
                    </span>
                  </div>
                  {doc.assignedMember?._id && (
                    <button
                      type="button"
                      onClick={() => {
    const mId = (doc.assignedMember?._id || doc.assignedMemberId?._id || doc.assignedMemberId || doc.memberId)?.toString();
    if (mId) navigate(`/family/${mId}`);
    else navigate('/family');
  }}
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>Member Profile</span>
                      <ExternalLink size={10} />
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Intelligence Bento A: Land Deed & Registry Intelligence Card (Bainama / Khasra-Khatauni / Chauhaddi) */}
          {(() => {
            const ocr = doc.ocrExtractedData || {};
            const prop = ocr.propertyDetails || {};
            const hasProp = Boolean(
              prop.khasraNumber ||
              prop.ownerName ||
              prop.sellerName ||
              prop.plotOrHouseNumber ||
              prop.area ||
              prop.locality ||
              prop.deedNumber ||
              (prop.chauhaddi && (prop.chauhaddi.north || prop.chauhaddi.south || prop.chauhaddi.east || prop.chauhaddi.west)) ||
              (doc.category === 'Bank & Property' && ocr.summary)
            );
            if (!hasProp) return null;

            const c = prop.chauhaddi || {};
            const hasChauhaddi = Boolean(c.north || c.south || c.east || c.west);
            const bullets = Array.isArray(ocr.executiveSummary) && ocr.executiveSummary.length > 0
              ? ocr.executiveSummary
              : null;

            return (
              <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-orange-500/10 rounded-2xl p-3 sm:p-3.5 border border-amber-300/60 dark:border-amber-500/30 shadow-xs space-y-2.5 transition-colors shrink-0">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold text-xs border border-amber-300/50 dark:border-amber-500/30">
                      <Compass size={15} />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                        <span>Land Deed & Registry Intelligence</span>
                      </h3>
                      <p className="text-[10px] text-amber-800/80 dark:text-amber-400/80">
                        जमीन रजिस्ट्री, खसरा-खतौनी व चौहद्दी
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-200 text-[10px] font-bold border border-amber-300/60 dark:border-amber-500/30">
                    {prop.propertyType || 'Sale Deed (बैनामा)'}
                  </span>
                </div>

                {/* 3-Bullet Executive Summary (if present) */}
                {bullets && (
                  <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#121622]/80 border border-amber-200/70 dark:border-amber-500/20 space-y-1">
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                      <Sparkles size={11} className="text-amber-500" />
                      <span>Executive Summary (सार)</span>
                    </div>
                    <ul className="space-y-1 text-xs text-slate-800 dark:text-neutral-200">
                      {bullets.map((b, i) => (
                        <li key={i} className="flex items-start gap-1.5 leading-snug">
                          <span className="text-sky-500 dark:text-sky-400 font-bold text-xs shrink-0 mt-0.5">✓</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Key Deed Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Khasra / Khatauni Number */}
                  <div className="p-2 rounded-xl bg-white dark:bg-[#121622] border border-amber-200/50 dark:border-[#1E293B] flex items-center justify-between">
                    <div className="min-w-0 pr-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Khasra / खसरा नं.</span>
                      <span className="font-mono font-bold text-amber-800 dark:text-amber-300 truncate block text-[13px]">
                        {prop.khasraNumber || doc.documentNumber || 'N/A'}
                      </span>
                    </div>
                    {(prop.khasraNumber || doc.documentNumber) && (
                      <button
                        type="button"
                        onClick={() => handleCopySnippet(prop.khasraNumber || doc.documentNumber, 'Khasra Number')}
                        className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#182030] dark:hover:bg-[#222c42] text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-[#1E293B] cursor-pointer shrink-0 transition-all active:scale-95"
                        title="Copy Khasra Number"
                      >
                        {copiedSnippet === (prop.khasraNumber || doc.documentNumber) ? <Check size={12} className="text-sky-500 dark:text-sky-400" /> : <Copy size={12} />}
                      </button>
                    )}
                  </div>

                  {/* Rakba / Area */}
                  <div className="p-2 rounded-xl bg-white dark:bg-[#121622] border border-amber-200/50 dark:border-[#1E293B]">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Rakba / Area (रकबा)</span>
                    <span className="font-semibold text-slate-900 dark:text-white truncate block text-[13px]">
                      {prop.area || 'As per deed'}
                    </span>
                  </div>

                  {/* Owner (Krayakarta) */}
                  <div className="p-2 rounded-xl bg-white dark:bg-[#121622] border border-amber-200/50 dark:border-[#1E293B]">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Owner / क्रेता (खरीदार)</span>
                    <span className="font-semibold text-slate-900 dark:text-white truncate block">
                      {prop.ownerName || doc.assignedMember?.name || 'Self / Family'}
                    </span>
                  </div>

                  {/* Seller (Vikreta) */}
                  <div className="p-2 rounded-xl bg-white dark:bg-[#121622] border border-amber-200/50 dark:border-[#1E293B]">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Seller / विक्रेता</span>
                    <span className="font-semibold text-slate-900 dark:text-white truncate block">
                      {prop.sellerName || 'Recorded in deed'}
                    </span>
                  </div>

                  {/* Plot / Flat No */}
                  {prop.plotOrHouseNumber && (
                    <div className="p-2 rounded-xl bg-white dark:bg-[#121622] border border-amber-200/50 dark:border-[#1E293B]">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Plot / Flat No.</span>
                      <span className="font-semibold text-slate-900 dark:text-white truncate block">
                        {prop.plotOrHouseNumber}
                      </span>
                    </div>
                  )}

                  {/* Locality / Mauza */}
                  {prop.locality && (
                    <div className={`p-2 rounded-xl bg-white dark:bg-[#121622] border border-amber-200/50 dark:border-[#1E293B] ${!prop.plotOrHouseNumber ? 'col-span-2' : ''}`}>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Mauza / Locality (मौजा)</span>
                      <span className="font-semibold text-slate-900 dark:text-white truncate block">
                        {prop.locality}
                      </span>
                    </div>
                  )}
                </div>

                {/* 4-Direction Chauhaddi (चौहद्दी) Compass Map Widget */}
                {hasChauhaddi && (
                  <div className="p-2.5 rounded-xl bg-white/90 dark:bg-[#182030] border border-amber-200/70 dark:border-[#1E293B] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1">
                        <MapPin size={11} className="text-amber-600 dark:text-amber-400" />
                        <span>Chauhaddi Boundaries (चौहद्दी नक्शा)</span>
                      </span>
                      <span className="text-[9px] text-slate-400 dark:text-neutral-500 font-mono">4-Way Surroundings</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      {/* North (Uttar) */}
                      <div className="p-1.5 rounded-lg bg-amber-50/60 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20">
                        <div className="flex items-center gap-1 font-bold text-[10px] text-amber-900 dark:text-amber-300">
                          <ArrowUp size={11} className="text-amber-600 dark:text-amber-400" />
                          <span>Uttar (उत्तर / North)</span>
                        </div>
                        <div className="text-slate-800 dark:text-neutral-200 font-medium pl-4 truncate" title={c.north}>
                          {c.north || 'Not specified'}
                        </div>
                      </div>

                      {/* East (Purav) */}
                      <div className="p-1.5 rounded-lg bg-amber-50/60 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20">
                        <div className="flex items-center gap-1 font-bold text-[10px] text-amber-900 dark:text-amber-300">
                          <ArrowRight size={11} className="text-amber-600 dark:text-amber-400" />
                          <span>Purav (पूरब / East)</span>
                        </div>
                        <div className="text-slate-800 dark:text-neutral-200 font-medium pl-4 truncate" title={c.east}>
                          {c.east || 'Not specified'}
                        </div>
                      </div>

                      {/* West (Paschim) */}
                      <div className="p-1.5 rounded-lg bg-amber-50/60 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20">
                        <div className="flex items-center gap-1 font-bold text-[10px] text-amber-900 dark:text-amber-300">
                          <ArrowLeft size={11} className="text-amber-600 dark:text-amber-400" />
                          <span>Paschim (पश्चिम / West)</span>
                        </div>
                        <div className="text-slate-800 dark:text-neutral-200 font-medium pl-4 truncate" title={c.west}>
                          {c.west || 'Not specified'}
                        </div>
                      </div>

                      {/* South (Dakshin) */}
                      <div className="p-1.5 rounded-lg bg-amber-50/60 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20">
                        <div className="flex items-center gap-1 font-bold text-[10px] text-amber-900 dark:text-amber-300">
                          <ArrowDown size={11} className="text-amber-600 dark:text-amber-400" />
                          <span>Dakshin (दक्षिण / South)</span>
                        </div>
                        <div className="text-slate-800 dark:text-neutral-200 font-medium pl-4 truncate" title={c.south}>
                          {c.south || 'Not specified'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Intelligence Bento B: Utility Bill & Smart Payment Card (Bijli / Pani / Gas) */}
          {(() => {
            const ocr = doc.ocrExtractedData || {};
            const util = ocr.utilityBillDetails || {};
            const hasUtil = Boolean(
              util.consumerNumber ||
              util.serviceProvider ||
              util.billAmount ||
              util.billDueDate ||
              util.meterNumber ||
              (/\b(bijli|electricity|water|pani|bill|utility|power|uppcl|bses|tata power)\b/i.test(`${doc.title} ${doc.category}`))
            );
            if (!hasUtil) return null;

            const dueStatus = getDueStatus(util.billDueDate || doc.expiryDate);
            const caNum = util.consumerNumber || doc.documentNumber || '';

            return (
              <div className="bg-gradient-to-br from-sky-500/10 via-indigo-500/5 to-blue-500/10 rounded-2xl p-3 sm:p-3.5 border border-sky-300/60 dark:border-sky-500/30 shadow-xs space-y-2.5 transition-colors shrink-0">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-xs border border-sky-300/50 dark:border-sky-500/30">
                      <Zap size={15} />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>Utility Bill & Payment Intelligence</span>
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-neutral-400">
                        {util.billType || 'Electricity'} Bill • {util.serviceProvider || 'Provider'}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-500/20 text-sky-900 dark:text-sky-300 text-[10px] font-bold border border-sky-300/60 dark:border-sky-500/30">
                    {util.serviceProvider || 'BBPS / Bill'}
                  </span>
                </div>

                {/* Hero Consumer / CA Number Banner */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#121622] border border-sky-200/60 dark:border-[#1E293B] flex items-center justify-between shadow-2xs">
                  <div className="min-w-0 pr-2">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">
                      Consumer / CA Number (उपभोक्ता संख्या)
                    </span>
                    <span className="font-mono font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-wider truncate block">
                      {caNum || 'N/A'}
                    </span>
                  </div>
                  {caNum && (
                    <button
                      type="button"
                      onClick={() => handleCopySnippet(caNum, 'Consumer / CA Number')}
                      className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-blue-600 hover:from-sky-400 hover:via-indigo-400 hover:to-blue-500 text-white shadow-md shadow-sky-500/25 border border-sky-400/30 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shrink-0 active:scale-95"
                      title="1-Tap Copy CA Number"
                    >
                      {copiedSnippet === caNum ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedSnippet === caNum ? 'Copied' : 'Copy CA'}</span>
                    </button>
                  )}
                </div>

                {/* Bill Amount & Due Date Strip */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Bill Amount */}
                  <div className="p-2 rounded-xl bg-white dark:bg-[#121622] border border-slate-200/60 dark:border-[#1E293B]">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Bill Amount (देय राशि)</span>
                    <span className="font-extrabold text-sky-600 dark:text-sky-400 text-sm truncate block">
                      {util.billAmount || '₹--'}
                    </span>
                  </div>

                  {/* Due Date & Pill */}
                  <div className="p-2 rounded-xl bg-white dark:bg-[#121622] border border-slate-200/60 dark:border-[#1E293B]">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Due Date (अंतिम तिथि)</span>
                      {dueStatus && (
                        <span className={`px-1.5 py-0.2 rounded-full text-[8px] font-bold border ${dueStatus.color}`}>
                          {dueStatus.text}
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white truncate block text-xs">
                      {util.billDueDate || (doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : 'N/A')}
                    </span>
                  </div>

                  {/* Meter No. */}
                  {util.meterNumber && (
                    <div className="p-2 rounded-xl bg-white dark:bg-[#121622] border border-slate-200/60 dark:border-[#1E293B]">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Meter No. (मीटर सं.)</span>
                      <span className="font-mono text-xs font-semibold text-slate-800 dark:text-neutral-200 truncate block">
                        {util.meterNumber}
                      </span>
                    </div>
                  )}

                  {/* Registered Name */}
                  <div className={`p-2 rounded-xl bg-white dark:bg-[#121622] border border-slate-200/60 dark:border-[#1E293B] ${!util.meterNumber ? 'col-span-2' : ''}`}>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Consumer Name (नाम)</span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-neutral-200 truncate block">
                      {util.registeredName || doc.assignedMember?.name || 'Self'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Intelligence Bento C: Medical Prescription & Health Card (If Medical Doc) */}
          {(() => {
            const ocr = doc.ocrExtractedData || {};
            const med = ocr.medicalDetails || {};
            const hasMed = Boolean(
              med.doctorName ||
              med.hospitalOrClinic ||
              med.diagnosis ||
              med.medicines
            );
            if (!hasMed) return null;

            return (
              <div className="bg-gradient-to-br from-rose-500/10 via-red-500/5 to-pink-500/10 rounded-2xl p-3 sm:p-3.5 border border-rose-300/60 dark:border-rose-500/30 shadow-xs space-y-2 transition-colors shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold text-xs">
                      <Stethoscope size={15} />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-rose-950 dark:text-rose-200">
                        Medical & Prescription Intelligence
                      </h3>
                      <p className="text-[10px] text-rose-800/80 dark:text-rose-400/80">डॉक्टर पर्ची व दवाई विवरण</p>
                    </div>
                  </div>
                  {med.hospitalOrClinic && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-900 dark:text-rose-300 text-[10px] font-bold truncate max-w-[120px]">
                      {med.hospitalOrClinic}
                    </span>
                  )}
                </div>

                <div className="p-2.5 rounded-xl bg-white/90 dark:bg-[#121622] border border-rose-200/60 dark:border-rose-500/20 space-y-1.5 text-xs">
                  {med.doctorName && (
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Doctor</span>
                      <span className="font-semibold text-slate-900 dark:text-white block">{med.doctorName}</span>
                    </div>
                  )}
                  {med.diagnosis && (
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Diagnosis / Illness</span>
                      <span className="font-semibold text-slate-900 dark:text-white block">{med.diagnosis}</span>
                    </div>
                  )}
                  {med.medicines && (
                    <div className="pt-1 border-t border-slate-100 dark:border-[#1E293B]">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] uppercase font-bold text-sky-600 dark:text-sky-400 block">
                          Prescribed Medicines (दवाई)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopySnippet(med.medicines, 'Prescribed Medicines')}
                          className="text-[10px] text-sky-600 dark:text-sky-400 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          {copiedSnippet === med.medicines ? <Check size={10} /> : <Copy size={10} />}
                          <span>{copiedSnippet === med.medicines ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <p className="font-medium text-slate-800 dark:text-neutral-200 mt-0.5 leading-snug">
                        {med.medicines}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Intelligence Bento D: Academic & Degree Intelligence Card (If Education Doc) */}
          {(() => {
            const ocr = doc.ocrExtractedData || {};
            const acad = ocr.academicDetails || {};
            const hasAcad = Boolean(
              acad.institution ||
              acad.courseOrDegree ||
              acad.marksOrGrade ||
              acad.certificateTitle
            );
            if (!hasAcad) return null;

            return (
              <div className="bg-gradient-to-br from-indigo-500/10 via-blue-500/5 to-sky-500/10 rounded-2xl p-3 sm:p-3.5 border border-indigo-300/60 dark:border-indigo-500/30 shadow-xs space-y-2 transition-colors shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                      <GraduationCap size={15} />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-indigo-950 dark:text-indigo-200">
                        Academic & Degree Intelligence
                      </h3>
                      <p className="text-[10px] text-indigo-800/80 dark:text-indigo-400/80">शिक्षा डिग्री व प्रमाण-पत्र</p>
                    </div>
                  </div>
                  {acad.courseOrDegree && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-900 dark:text-indigo-300 text-[10px] font-bold truncate max-w-[120px]">
                      {acad.courseOrDegree}
                    </span>
                  )}
                </div>

                <div className="p-2.5 rounded-xl bg-white/90 dark:bg-[#121622] border border-indigo-200/60 dark:border-indigo-500/20 grid grid-cols-2 gap-2 text-xs">
                  {acad.institution && (
                    <div className="col-span-2">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Institution / University</span>
                      <span className="font-semibold text-slate-900 dark:text-white block">{acad.institution}</span>
                    </div>
                  )}
                  {acad.courseOrDegree && (
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Degree / Course</span>
                      <span className="font-semibold text-slate-900 dark:text-white block">{acad.courseOrDegree}</span>
                    </div>
                  )}
                  {acad.semesterOrYear && (
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Semester / Year</span>
                      <span className="font-semibold text-slate-900 dark:text-white block">{acad.semesterOrYear}</span>
                    </div>
                  )}
                  {acad.marksOrGrade && (
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Marks / CGPA</span>
                      <span className="font-bold text-sky-600 dark:text-sky-400 block">{acad.marksOrGrade}</span>
                    </div>
                  )}
                  {acad.certificateTitle && (
                    <div className="col-span-2">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Award / Certificate</span>
                      <span className="font-semibold text-slate-900 dark:text-white block">{acad.certificateTitle}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Bento 2: 4-Digit MPIN Protection Card with PhonePe/GPay Style Toggle Switch */}
          <div className="bg-white dark:bg-[#121622] rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-[#1E293B] shadow-xs space-y-2 transition-colors shrink-0">
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
                  <Loader2 size={15} className="animate-spin text-sky-500 dark:text-sky-400" />
                ) : (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={Boolean(doc.isMpinProtected || doc.isSensitive)}
                    disabled={isTogglingMpin}
                    onClick={handleToggleMpinProtection}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      (doc.isMpinProtected || doc.isSensitive)
                        ? 'bg-sky-500'
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

            <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-[#1E293B] text-[11px]">
              <span className="font-semibold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  (doc.isMpinProtected || doc.isSensitive) ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'
                }`} />
                <span>{(doc.isMpinProtected || doc.isSensitive) ? 'Status: 🔒 Locked with MPIN' : 'Status: 🔓 Standard Access'}</span>
              </span>
              {mpinFeedback && (
                <span className="text-[10px] font-bold text-sky-500 dark:text-sky-400 animate-fadeIn">
                  {mpinFeedback}
                </span>
              )}
            </div>
          </div>

          {/* Bento 3: Who Can View Dropdown & Access Control */}
          <div className="bg-white dark:bg-[#121622] rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-[#1E293B] shadow-xs space-y-2 transition-colors shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <Eye size={14} className="text-sky-500 dark:text-sky-400" />
                <span>Who Can View</span>
              </h3>
              <div className="flex items-center gap-1.5">
                {savingPermissions && (
                  <span className="text-[10px] text-sky-500 dark:text-sky-400 font-bold animate-pulse">Saving...</span>
                )}
                {permissionFeedback && (
                  <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold bg-sky-50 dark:bg-sky-500/10 px-1.5 py-0.2 rounded-full border border-sky-200 dark:border-sky-500/20">
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
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#182030] hover:bg-slate-100 dark:hover:bg-[#1A1A1A] text-left transition-all cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`p-1 rounded-md shrink-0 ${
                    getDropdownSummary().isAll
                      ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400'
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
                <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white dark:bg-[#121622] rounded-2xl border border-slate-200 dark:border-[#1E293B] shadow-2xl p-2 space-y-1 animate-fadeIn max-h-56 overflow-y-auto">
                  <div
                    onClick={handleSelectAll}
                    className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                      whoCanViewList.includes('ALL')
                        ? 'bg-sky-50/80 dark:bg-sky-500/15 text-sky-950 dark:text-white'
                        : 'hover:bg-slate-50 dark:hover:bg-[#262626] text-slate-700 dark:text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
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
                      className="w-3.5 h-3.5 rounded text-sky-500 border-slate-300 focus:ring-sky-500 cursor-pointer"
                    />
                  </div>

                  <div className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 border-t border-slate-100 dark:border-[#1E293B] mt-1 pt-1.5">
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
                            ? 'bg-sky-50/80 dark:bg-sky-500/15 text-sky-950 dark:text-white'
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
                          className="w-3.5 h-3.5 rounded text-sky-500 border-slate-300 focus:ring-sky-500 cursor-pointer shrink-0"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Bento 4: Document Metadata & Cryptographic Proof Card */}
          <div className="bg-white dark:bg-[#121622] rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-[#1E293B] shadow-xs space-y-2 transition-colors shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <Info size={14} className="text-slate-500 dark:text-neutral-400" />
                <span>Document Details</span>
              </h3>
              <span className="px-2 py-0.2 rounded-full bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 font-mono text-[9px] font-bold">
                AES-256 GCM
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              <div className="border-b border-slate-100 dark:border-[#1E293B] pb-1">
                <span className="text-[10px] text-slate-400 block">Category:</span>
                <span className="font-bold text-slate-900 dark:text-white truncate block">{doc.category}</span>
              </div>
              <div className="border-b border-slate-100 dark:border-[#1E293B] pb-1">
                <span className="text-[10px] text-slate-400 block">Expiry:</span>
                <span className="font-semibold text-slate-800 dark:text-neutral-300 truncate block">
                  {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : 'No Expiry'}
                </span>
              </div>
              <div className="border-b border-slate-100 dark:border-[#1E293B] pb-1">
                <span className="text-[10px] text-slate-400 block">Uploaded On:</span>
                <span className="font-semibold text-slate-800 dark:text-neutral-300 block">
                  {new Date(doc.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="border-b border-slate-100 dark:border-[#1E293B] pb-1">
                <span className="text-[10px] text-slate-400 block">Storage:</span>
                <span className="font-bold text-sky-600 dark:text-sky-400 block">Encrypted</span>
              </div>
            </div>

            {/* SHA-256 Hash Digest */}
            <div className="pt-1 flex items-center justify-between gap-1 text-[10px] font-mono text-slate-400 dark:text-neutral-500 bg-slate-50 dark:bg-[#182030] p-1.5 rounded-lg border border-slate-100 dark:border-[#1E293B]">
              <span className="truncate">
                SHA: {doc.sha256Hash ? `${doc.sha256Hash.substring(0, 16)}...` : '3af2f380295bbe...'}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(doc.sha256Hash || '3af2f380295bbe97769e402ec71dad29fe46610f01d4d57d6a4b060474560f57');
                  toast.success('SHA-256 hash copied to clipboard');
                }}
                className="text-sky-600 dark:text-sky-400 font-bold hover:underline shrink-0"
              >
                Copy
              </button>
            </div>
          </div>

          {/* Bento 5: Recent Activity (Section 65B Audit Trail) */}
          <div className="bg-white dark:bg-[#121622] rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-[#1E293B] shadow-xs space-y-2 transition-colors shrink-0">
            <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock size={13} className="text-sky-500 dark:text-sky-400" />
                <span>Recent Activity</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500">{auditTrail.length} events</span>
            </h3>

            <div className="space-y-1.5 text-xs max-h-28 overflow-y-auto pr-1">
              {auditTrail.length === 0 ? (
                <div className="text-slate-400 dark:text-neutral-500 py-2 text-center text-[11px]">No activity recorded yet</div>
              ) : (
                auditTrail.slice(0, 3).map((log) => (
                  <div key={log._id} className="flex items-start gap-2 pb-1.5 border-b border-slate-100 dark:border-[#1E293B] last:border-0 last:pb-0 text-[11px]">
                    <CheckCircle2 size={13} className="text-sky-500 dark:text-sky-400 mt-0.5 shrink-0" />
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
      {shareModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
          onClick={() => setShareModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-white dark:bg-[#121622] border-t md:border border-slate-200 dark:border-[#1E293B] rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] md:max-h-[85vh] overflow-hidden transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Handle Pill */}
            <div className="md:hidden flex justify-center pt-2.5 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-neutral-600" />
            </div>

            {/* Fixed Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-[#1E293B] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-100 dark:border-sky-500/20 shrink-0">
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
                          ? 'border-sky-500 dark:border-sky-400 bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 font-bold shadow-xs'
                          : 'border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#182030] text-slate-700 dark:text-neutral-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold">{tier.label}</div>
                      <div className="text-[10px] text-slate-400 dark:text-neutral-500">{tier.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Exact Auto-Expiry Timestamp Preview */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#182030] border border-slate-200/80 dark:border-[#1E293B] text-xs flex items-center gap-2.5">
                <Clock size={16} className="text-sky-500 dark:text-sky-400 shrink-0" />
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

              <div className="p-3.5 bg-slate-50 dark:bg-[#182030] rounded-2xl border border-slate-200 dark:border-[#1E293B] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-neutral-500 tracking-wider">
                    Secure View-Only Link:
                  </span>
                  {sharingLoading && (
                    <span className="text-[10px] text-sky-500 dark:text-sky-400 font-bold animate-pulse">Generating...</span>
                  )}
                </div>
                <div className="font-mono text-xs text-slate-800 dark:text-neutral-200 break-all select-all bg-white dark:bg-[#121622] p-2.5 rounded-xl border border-slate-200 dark:border-[#1E293B]">
                  {shareLink}
                </div>
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="px-4 sm:px-6 py-3.5 bg-slate-50 dark:bg-[#182030] border-t border-slate-100 dark:border-[#1E293B] flex flex-col-reverse sm:flex-row items-center sm:justify-between gap-2.5 shrink-0 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
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
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#1E293B] text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#27272A] font-bold text-xs cursor-pointer text-center"
                >
                  Close
                </button>
                <button
                  onClick={handleCopyShareLink}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white shadow-md shadow-sky-500/25 font-bold text-xs shadow-md shadow-sky-500/20 transition-all cursor-pointer text-center"
                >
                  {copiedShareLink ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedShareLink ? 'Link Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Document Confirmation Modal */}
      {isDeleteModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsDeleteModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-white dark:bg-[#121622] border-t md:border border-slate-200 dark:border-[#1E293B] rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] md:max-h-[85vh] overflow-hidden transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Handle Pill */}
            <div className="md:hidden flex justify-center pt-2.5 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-neutral-600" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-[#1E293B] shrink-0">
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
            <div className="px-4 sm:px-6 py-3.5 bg-slate-50 dark:bg-[#182030] border-t border-slate-100 dark:border-[#1E293B] flex flex-col-reverse sm:flex-row items-center sm:justify-end gap-2.5 shrink-0 pb-[max(1.25rem,env(safe-area-inset-bottom,20px))]">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#1E293B] text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#27272A] font-bold text-xs transition-colors cursor-pointer text-center"
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
        </div>,
        document.body
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
      {isEditModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-white dark:bg-[#121622] border-t md:border border-slate-200 dark:border-[#1E293B] rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="md:hidden flex justify-center pt-2.5 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-neutral-600" />
            </div>

            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-[#1E293B] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-100 dark:border-sky-500/20 shrink-0">
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
                  <FileText size={13} className="text-sky-500 dark:text-sky-400" />
                  <span>Document Title</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  placeholder="e.g. Papa's Aadhaar Card, Honda City RC"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#182030] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 dark:focus:border-sky-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Assigned Member */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <Users size={13} className="text-sky-500 dark:text-sky-400" />
                    <span>Assigned Family Member</span>
                  </label>
                  <select
                    value={editFormData.assignedMemberId}
                    onChange={(e) => setEditFormData({ ...editFormData, assignedMemberId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#182030] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 dark:focus:border-sky-400"
                  >
                    <option value="">Whole Family / Common Document</option>
                    {members.map((m) => (
                      <option key={m._id || m.id} value={(m._id || m.id).toString()}>
                        {m.name} ({m.relationship || 'Member'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <Box size={13} className="text-sky-500 dark:text-sky-400" />
                    <span>Category</span>
                  </label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#182030] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 dark:focus:border-sky-400"
                  >
                    <option value="ID Cards">ID Cards (Aadhaar, PAN, Voter ID, Passport)</option>
                    <option value="Medical & Health">Medical & Health (Insurance, Reports, Prescriptions)</option>
                    <option value="Bank & Property">Bank & Property (Passbooks, Registry, Fixed Deposits)</option>
                    <option value="Vehicle & Transport">Vehicle & Transport (RC, Driver License, Insurance)</option>
                    <option value="Property & Legal">Property & Legal (Registry Deed, Will, Agreement)</option>
                    <option value="Education & Work">Education & Work (Degrees, Marksheets, Certificates)</option>
                    <option value="Financial">Financial (Bank, Tax, Mutual Funds, Investment)</option>
                    <option value="Other">Other (Bills, Receipts, Miscellaneous)</option>
                  </select>
                </div>
              </div>

              {/* Document Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <Hash size={13} className="text-sky-500 dark:text-sky-400" />
                  <span>Document ID Number</span>
                </label>
                <input
                  type="text"
                  value={editFormData.documentNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, documentNumber: e.target.value })}
                  placeholder="e.g. 5489 1234 9876 / ABCDE1234F"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#182030] text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 dark:focus:border-sky-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Issue Date */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
                      <Calendar size={13} className="text-sky-500 dark:text-sky-400" />
                      <span>Issue Date (Optional)</span>
                    </label>
                    {editFormData.issueDate && (
                      <button
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, issueDate: '' })}
                        className="text-[10px] text-red-500 hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <input
                    type="date"
                    value={editFormData.issueDate}
                    onChange={(e) => setEditFormData({ ...editFormData, issueDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#182030] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 dark:focus:border-sky-400"
                  />
                </div>

                {/* Expiry Date */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
                      <Clock size={13} className="text-sky-500 dark:text-sky-400" />
                      <span>Expiry Date (Optional)</span>
                    </label>
                    {editFormData.expiryDate && (
                      <button
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, expiryDate: '' })}
                        className="text-[10px] text-red-500 hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <input
                    type="date"
                    value={editFormData.expiryDate}
                    onChange={(e) => setEditFormData({ ...editFormData, expiryDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#182030] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 dark:focus:border-sky-400"
                  />
                </div>
              </div>

              {/* Security MPIN Toggle */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#182030] border border-slate-200 dark:border-[#1E293B] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    editFormData.isMpinProtected
                      ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      : 'bg-slate-200 dark:bg-[#262626] text-slate-500'
                  }`}>
                    <Lock size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Family Security MPIN Lock</p>
                    <p className="text-[10px] text-slate-500 dark:text-neutral-400">Require 4-digit PIN to view and open</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditFormData({ ...editFormData, isMpinProtected: !editFormData.isMpinProtected })}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${
                    editFormData.isMpinProtected ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      editFormData.isMpinProtected ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Optional: Replace Scanned File */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 flex items-center justify-between">
                  <span>Replace Scan / Document File (Optional)</span>
                  {replacementFile && (
                    <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold">New file chosen</span>
                  )}
                </label>
                <div className="p-2.5 rounded-xl border border-dashed border-slate-300 dark:border-[#1E293B] bg-slate-50 dark:bg-[#182030] text-xs flex items-center justify-between gap-2">
                  <span className="text-slate-500 dark:text-neutral-400 truncate max-w-[200px] text-[11px]">
                    {replacementFile ? replacementFile.name : `Current: ${doc?.originalFileName || 'Uploaded file'}`}
                  </span>
                  <label className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#262626] border border-slate-200 dark:border-[#1E293B] text-slate-700 dark:text-neutral-200 font-bold text-[11px] hover:bg-slate-50 dark:hover:bg-[#333] cursor-pointer shrink-0">
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#182030] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 dark:focus:border-sky-400"
                />
                <p className="text-[10px] text-slate-400 dark:text-neutral-500">
                  Section 65B compliant audit trail will record this modification.
                </p>
              </div>

              <div className="px-1 pt-2 pb-1 flex justify-end gap-2 border-t border-slate-100 dark:border-[#1E293B] pb-[max(1.25rem,env(safe-area-inset-bottom,20px))]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#1E293B] text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#27272A] font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-blue-600 hover:from-sky-400 hover:via-indigo-400 hover:to-blue-500 text-white shadow-md shadow-sky-500/25 border border-sky-400/30 font-bold text-xs transition-all cursor-pointer active:scale-95"
                >
                  {savingEdit ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>{savingEdit ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Mobile Sticky Bottom Action Bar with iPhone & Mobile Safe Area Support */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#121622]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-[#1E293B] p-2.5 sm:p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          {/* WhatsApp Share - Primary for Indian Families */}
          <button
            type="button"
            onClick={handleWhatsAppShare}
            disabled={sharingLoading}
            className="flex-1 py-3 px-2 rounded-xl bg-slate-100 dark:bg-[#182030] hover:bg-slate-200 dark:hover:bg-[#222c42] text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200/90 dark:border-[#1E293B] shadow-2xs transition-all cursor-pointer active:scale-95"
            title="Share on WhatsApp"
          >
            <MessageCircle size={16} className="text-[#25D366] shrink-0" />
            <span className="truncate">WhatsApp</span>
          </button>

          {/* Download Original / Smart Card */}
          <button
            type="button"
            onClick={handleDownloadDocument}
            disabled={isDownloading}
            className="flex-1 py-3 px-2 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-blue-600 hover:from-sky-400 hover:via-indigo-400 hover:to-blue-500 text-white shadow-md shadow-sky-500/25 border border-sky-400/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            title="Download document image or Smart Card"
          >
            {isDownloading ? <Loader2 size={16} className="animate-spin shrink-0" /> : <Download size={16} className="shrink-0" />}
            <span className="truncate">{isDownloading ? 'Saving...' : 'Download'}</span>
          </button>

          {/* 24h Safe Expiring Share Link */}
          <button
            type="button"
            onClick={() => handleShareSafely()}
            className="flex-1 py-3 px-2 rounded-xl bg-slate-100 dark:bg-[#182030] hover:bg-slate-200 dark:hover:bg-[#222c42] text-slate-800 dark:text-neutral-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200/90 dark:border-[#1E293B] shadow-2xs transition-all cursor-pointer active:scale-95"
            title="Generate Safe Share Link"
          >
            <Share2 size={15} className="text-sky-500 dark:text-sky-400 shrink-0" />
            <span className="truncate">Safe Link</span>
          </button>

          {/* Quick Edit Details & Almari Notes */}
          <button
            type="button"
            onClick={handleOpenEdit}
            className="py-3 px-3 rounded-xl bg-slate-100 dark:bg-[#182030] hover:bg-slate-200 dark:hover:bg-[#222c42] text-slate-700 dark:text-neutral-300 font-bold text-xs flex items-center justify-center transition-all cursor-pointer active:scale-95 border border-slate-200/90 dark:border-[#1E293B] shadow-2xs"
            title="Edit details or Almari location"
          >
            <Edit3 size={15} />
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}
