import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Lock,
  Shield,
  Camera,
  X,
  Check,
  Calendar,
  Hash,
  Sparkles,
  User,
  Users,
  Landmark,
  CreditCard,
  HeartPulse,
  GraduationCap,
  Scale,
  Folder,
  Clock,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function DocumentUploadPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const preselectedMember = searchParams.get('member') || '';

  const [members, setMembers] = useState([]);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    category: 'ID Cards',
    assignedMemberId: preselectedMember,
    documentNumber: '',
    expiryDate: '',
    whoCanViewType: 'ALL', // 'ALL' or 'SPECIFIC'
    selectedWhoCanView: [],
    isMpinProtected: false,
    notes: '',
  });

  // Fetch Family Members on mount
  useEffect(() => {
    let isMounted = true;
    api.getMembers()
      .then((res) => {
        if (!isMounted) return;
        const list = res.members || [];
        setMembers(list);
        if (list.length > 0 && !formData.assignedMemberId && !preselectedMember) {
          setFormData((prev) => ({ ...prev, assignedMemberId: list[0]._id }));
        }
      })
      .catch((err) => {
        console.error('Failed to load members:', err);
      });
    return () => {
      isMounted = false;
    };
  }, [preselectedMember]);

  // Manage Live Image Preview URL & cleanup
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    if (file.type && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  // Categories configuration with rich icons
  const categories = [
    {
      id: 'ID Cards',
      label: 'ID Cards',
      sub: 'Aadhaar, PAN, Passport, DL',
      icon: CreditCard,
      badge: 'Identity',
    },
    {
      id: 'Medical & Health',
      label: 'Medical & Health',
      sub: 'Insurance, Prescriptions, Reports',
      icon: HeartPulse,
      badge: 'Health',
    },
    {
      id: 'Bank & Property',
      label: 'Bank & Property',
      sub: 'Passbooks, Deeds, FD Receipts',
      icon: Landmark,
      badge: 'Financial',
    },
    {
      id: 'Education',
      label: 'Education',
      sub: 'Degrees, Marksheets, Certificates',
      icon: GraduationCap,
      badge: 'Academic',
    },
    {
      id: 'Legal',
      label: 'Legal',
      sub: 'Affidavits, Wills, Agreements',
      icon: Scale,
      badge: 'Confidential',
    },
    {
      id: 'Other',
      label: 'Other',
      sub: 'Bills, Warranties, Vehicle RC',
      icon: Folder,
      badge: 'General',
    },
  ];

  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;
    if (selectedFile.size > 25 * 1024 * 1024) {
      setError('File size exceeds the 25MB vault limit. Please choose a smaller file.');
      return;
    }
    setError('');
    setFile(selectedFile);

    // Auto-fill title if user hasn't typed one yet
    if (!formData.title) {
      const cleanName = selectedFile.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]+/g, ' ')
        .trim();
      setFormData((prev) => ({ ...prev, title: cleanName }));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSelectCategory = (catId) => {
    setFormData((prev) => ({
      ...prev,
      category: catId,
      // Smart security default: Auto-enable MPIN for high-risk categories
      isMpinProtected:
        catId === 'Bank & Property' || catId === 'Legal' ? true : prev.isMpinProtected,
    }));
  };

  const handleToggleMemberView = (memberId) => {
    setFormData((prev) => {
      const exists = prev.selectedWhoCanView.includes(memberId);
      const updated = exists
        ? prev.selectedWhoCanView.filter((id) => id !== memberId)
        : [...prev.selectedWhoCanView, memberId];
      return { ...prev, selectedWhoCanView: updated };
    });
  };

  // Expiry preset helpers
  const handleSetExpiryYears = (years) => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + years);
    setFormData((prev) => ({ ...prev, expiryDate: d.toISOString().split('T')[0] }));
  };

  const handleClearExpiry = () => {
    setFormData((prev) => ({ ...prev, expiryDate: '' }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!file) {
      setError('Please select or capture a document to upload.');
      toast.error('Please choose a document to upload.');
      return;
    }
    const cleanTitle = (formData.title || file.name || '').trim();
    if (!cleanTitle) {
      setError('Please provide a title for this document.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const data = new FormData();
      data.append('file', file);
      data.append('title', cleanTitle);
      data.append('category', formData.category);

      if (
        formData.assignedMemberId &&
        formData.assignedMemberId !== 'null' &&
        formData.assignedMemberId !== 'undefined'
      ) {
        data.append('assignedMemberId', formData.assignedMemberId);
      }

      if (formData.documentNumber) {
        data.append('documentNumber', formData.documentNumber.trim().toUpperCase());
      }

      if (formData.expiryDate) {
        data.append('expiryDate', formData.expiryDate);
      }

      // MPIN & Sensitivity
      data.append('isMpinProtected', formData.isMpinProtected ? 'true' : 'false');
      data.append('isSensitive', formData.isMpinProtected ? 'true' : 'false');

      // Permissions
      const whoCanViewArray =
        formData.whoCanViewType === 'ALL'
          ? ['ALL']
          : formData.selectedWhoCanView.length > 0
          ? formData.selectedWhoCanView
          : ['ALL'];
      data.append('whoCanView', JSON.stringify(whoCanViewArray));

      if (formData.notes) {
        data.append('notes', formData.notes.trim());
      }

      const res = await api.uploadDocument(data);
      toast.success(`"${cleanTitle}" saved and encrypted securely!`);

      if (res?.document) {
        const docId = res.document._id || res.document.id;
        navigate(`/vault/documents/${docId}`);
      } else {
        navigate('/vault');
      }
    } catch (err) {
      console.error('Upload document error:', err);
      const msg = err.message || 'Upload failed. Please check your connection and try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-[#121212] pb-[calc(8.5rem+env(safe-area-inset-bottom,0px))] lg:pb-16 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Navigation Breadcrumb / Header */}
        <div className="mb-5 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3">
          <div>
            <button
              type="button"
              onClick={() => navigate('/vault')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-[#3ECF8E] transition-colors mb-1.5 cursor-pointer"
            >
              <ArrowLeft size={15} />
              <span>Back to Documents Vault</span>
            </button>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Upload New Document
              </h1>
              <span className="hidden min-[400px]:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-100/80 dark:bg-[#3ECF8E]/15 text-emerald-800 dark:text-[#3ECF8E] border border-emerald-200 dark:border-[#3ECF8E]/30">
                <Shield size={12} />
                256-Bit Encrypted
              </span>
            </div>
            <p className="text-[11px] sm:text-sm text-slate-500 dark:text-neutral-400 mt-1 max-w-2xl">
              Add family papers, certificates, or cards. Everything is securely encrypted with bank-grade privacy and 1-tap copy access.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="hidden lg:flex items-center gap-2 self-start bg-white dark:bg-[#18181B] px-3.5 py-2 rounded-2xl border border-slate-200/80 dark:border-[#262626] shadow-2xs">
            <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-xs font-semibold text-slate-700 dark:text-neutral-300">
              Vault Status: Protected
            </span>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-xs font-semibold flex items-start justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError('')}
              className="text-red-500 hover:text-red-700 dark:text-red-400 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ================= MAIN DUAL-EXPERIENCE CONTAINER ================= */}
        <form onSubmit={handleSubmit} className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
          {/* ================= LEFT COLUMN: STICKY DOCUMENT STAGE & LIVE PREVIEW (Desktop col-span-5) ================= */}
          <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
            {/* Document Stage Card */}
            <div className="bg-white dark:bg-[#18181B] rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-[#262626] shadow-sm transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Document File
                  </h2>
                </div>
                {file && (
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setPreviewUrl(null);
                    }}
                    className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <X size={13} />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              {/* Hidden File Inputs */}
              <input
                id="file-upload-input"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files[0])}
              />
              <input
                id="camera-upload-input"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files[0])}
              />

              {/* Interactive Drag & Drop / Preview Box */}
              {!file ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-upload-input').click()}
                  className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all flex flex-col items-center justify-center min-h-[220px] sm:min-h-[260px] cursor-pointer group ${
                    isDragging
                      ? 'border-[#3ECF8E] bg-[#3ECF8E]/10 scale-[1.01]'
                      : 'border-slate-300 dark:border-[#2E2E33] bg-slate-50/70 dark:bg-[#141414] hover:border-emerald-500/60 dark:hover:border-[#3ECF8E]/50 hover:bg-emerald-50/20 dark:hover:bg-[#1C1C1F]'
                  }`}
                >
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100/70 dark:bg-[#3ECF8E]/15 text-emerald-600 dark:text-[#3ECF8E] flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform shadow-xs">
                    <Upload size={30} strokeWidth={2.2} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-neutral-100">
                    Click to select, or drag & drop document
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 max-w-xs">
                    Supports high-res PDF, PNG, JPG, or WEBP
                  </p>
                  <span className="mt-3 px-3 py-1 rounded-full text-[11px] font-semibold bg-white dark:bg-[#202024] text-slate-600 dark:text-neutral-300 border border-slate-200 dark:border-[#2A2A2E] shadow-2xs">
                    Max 25 MB per file
                  </span>
                </div>
              ) : (
                /* Live Preview Container */
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-[#121214] border border-slate-200 dark:border-[#262626] p-3 flex flex-col items-center justify-center min-h-[200px] max-h-[300px]">
                    {previewUrl ? (
                      <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-xl">
                        <img
                          src={previewUrl}
                          alt="Document Preview"
                          className="max-h-[240px] w-auto max-w-full object-contain rounded-lg shadow-xs"
                        />
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1">
                          <Eye size={11} />
                          <span>Image Preview</span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center space-y-2">
                        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-xs">
                          <FileText size={32} />
                        </div>
                        <p className="text-xs font-bold text-slate-800 dark:text-neutral-200">
                          PDF Document Attached
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-neutral-500">
                          Ready for encryption & storage
                        </p>
                      </div>
                    )}
                  </div>

                  {/* File Metadata Strip */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-200/80 dark:border-[#262626] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-[#3ECF8E]/15 text-emerald-700 dark:text-[#3ECF8E] flex items-center justify-center shrink-0">
                        <CheckCircle size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {file.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || 'Document'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => document.getElementById('file-upload-input').click()}
                      className="shrink-0 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#2A2A2E] bg-white dark:bg-[#1E1E22] text-[11px] font-bold text-slate-700 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-[#3ECF8E] transition-colors cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}

              {/* Dual Selection Buttons (Camera vs File Browser) */}
              <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2 mt-4 pt-1">
                <button
                  type="button"
                  onClick={() => document.getElementById('camera-upload-input').click()}
                  className="min-h-[42px] px-2.5 py-2 rounded-xl border border-emerald-300/80 dark:border-[#3ECF8E]/30 bg-emerald-50/70 hover:bg-emerald-100/80 dark:bg-[#3ECF8E]/10 dark:hover:bg-[#3ECF8E]/20 text-emerald-800 dark:text-[#3ECF8E] font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-98"
                >
                  <Camera size={15} />
                  <span className="truncate">Scan with Camera</span>
                </button>
                <button
                  type="button"
                  onClick={() => document.getElementById('file-upload-input').click()}
                  className="min-h-[42px] px-2.5 py-2 rounded-xl border border-slate-200 dark:border-[#262626] bg-slate-50 hover:bg-slate-100 dark:bg-[#141414] dark:hover:bg-[#202024] text-slate-700 dark:text-neutral-300 font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-98"
                >
                  <FileText size={15} />
                  <span className="truncate">Browse Device</span>
                </button>
              </div>
            </div>

            {/* Bank-Grade Security Seal Card */}
            <div className="hidden lg:block bg-gradient-to-br from-slate-900 to-neutral-900 dark:from-[#18181B] dark:to-[#121214] text-white rounded-3xl p-5 border border-slate-800 dark:border-[#262626] shadow-sm">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#3ECF8E]/20 text-[#3ECF8E] flex items-center justify-center shrink-0 border border-[#3ECF8E]/30">
                  <Shield size={20} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                      Bank-Grade AES-256 Vault
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#3ECF8E]/20 text-[#3ECF8E]">
                      Zero-Knowledge
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Uploaded documents are individually encrypted before storage. Every action is registered on your family Section 65B tamper-proof audit ledger.
                  </p>
                </div>
              </div>
            </div>

            {/* Smart Quick-Tip Card */}
            <div className="hidden lg:flex items-start gap-3 p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/20 text-amber-900 dark:text-amber-300 text-xs">
              <Sparkles size={16} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <span className="font-bold">Pro-Tip for Aadhaar & PAN: </span>
                <span className="text-[11px] opacity-90">
                  Add the document ID number on the right. You will get a 1-tap copy button right on your phone screen whenever you need to fill forms.
                </span>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: METADATA & PERMISSIONS FORM (Desktop col-span-7) ================= */}
          <div className="lg:col-span-7 space-y-5 mt-6 lg:mt-0">
            {/* Step 1: Document Basics & Category */}
            <div className="bg-white dark:bg-[#18181B] rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-[#262626] shadow-sm transition-all space-y-5">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Document Title & Category
                </h2>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                  Document Title *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Papa's Aadhaar Card, Flat Deed 2026, SBI Passbook"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-[#262626] bg-slate-50/60 dark:bg-[#141414] focus:border-[#3ECF8E] focus:bg-white dark:focus:bg-[#18181B] text-xs font-bold text-slate-900 dark:text-white outline-none transition-all"
                  />
                  {formData.title && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, title: '' })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Category Grid */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                  Select Category *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = formData.category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelectCategory(cat.id)}
                        className={`p-2.5 sm:p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[82px] sm:min-h-[92px] ${
                          isSelected
                            ? 'border-[#3ECF8E] bg-[#3ECF8E]/10 ring-2 ring-[#3ECF8E]/25 shadow-xs'
                            : 'border-slate-200 dark:border-[#262626] hover:border-slate-300 dark:hover:border-neutral-700 bg-white dark:bg-[#141414]'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1 sm:mb-2">
                          <div
                            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center ${
                              isSelected
                                ? 'bg-[#3ECF8E] text-[#121212]'
                                : 'bg-slate-100 dark:bg-[#202024] text-slate-600 dark:text-neutral-400'
                            }`}
                          >
                            <Icon size={14} />
                          </div>
                          {isSelected && (
                            <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] flex items-center justify-center">
                              <Check size={11} strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-[11px] sm:text-xs text-slate-900 dark:text-white leading-tight truncate">
                            {cat.label}
                          </div>
                          <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5 truncate">
                            {cat.sub}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Step 2: Whose Document Is This? (Family Member Tag) */}
            <div className="bg-white dark:bg-[#18181B] rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-[#262626] shadow-sm transition-all space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] font-bold text-xs flex items-center justify-center">
                    3
                  </span>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Whose Document Is This?
                  </h2>
                </div>
                <span className="text-[11px] text-slate-400 dark:text-neutral-500">
                  Tag for easy filtering
                </span>
              </div>

              {/* Member Selection Chips / Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Joint / Whole Family Option */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, assignedMemberId: '' })}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    !formData.assignedMemberId
                      ? 'border-[#3ECF8E] bg-[#3ECF8E]/10 ring-2 ring-[#3ECF8E]/20'
                      : 'border-slate-200 dark:border-[#262626] hover:border-slate-300 dark:hover:border-neutral-700 bg-white dark:bg-[#141414]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#222226] text-slate-600 dark:text-neutral-300 flex items-center justify-center font-bold text-xs shrink-0">
                      <Users size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        Whole Family
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-neutral-500">
                        Joint or common family document
                      </div>
                    </div>
                  </div>
                  {!formData.assignedMemberId && (
                    <span className="w-5 h-5 rounded-full bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] flex items-center justify-center shrink-0">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </button>

                {/* Specific Family Members */}
                {members.map((m) => {
                  const isSelected = formData.assignedMemberId === m._id;
                  const initial = (m.name || 'M').charAt(0).toUpperCase();
                  return (
                    <button
                      key={m._id}
                      type="button"
                      onClick={() => setFormData({ ...formData, assignedMemberId: m._id })}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-[#3ECF8E] bg-[#3ECF8E]/10 ring-2 ring-[#3ECF8E]/20'
                          : 'border-slate-200 dark:border-[#262626] hover:border-slate-300 dark:hover:border-neutral-700 bg-white dark:bg-[#141414]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-[#3ECF8E]/20 text-emerald-800 dark:text-[#3ECF8E] flex items-center justify-center font-bold text-xs shrink-0">
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {m.name}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-neutral-400 capitalize">
                            {m.relationship || 'Family Member'}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] flex items-center justify-center shrink-0">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Document Number & Expiry (1-Tap Utility) */}
            <div className="bg-white dark:bg-[#18181B] rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-[#262626] shadow-sm transition-all space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] font-bold text-xs flex items-center justify-center">
                  4
                </span>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Document ID & Expiry Tracking
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Document Number with auto uppercase */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Hash size={13} />
                      <span>Document ID Number</span>
                    </label>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-[#3ECF8E]">
                      1-Tap Copy
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. 5492 1029 4812 or ABCDE1234F"
                    value={formData.documentNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, documentNumber: e.target.value.toUpperCase() })
                    }
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-[#262626] bg-slate-50/60 dark:bg-[#141414] focus:border-[#3ECF8E] focus:bg-white dark:focus:bg-[#18181B] font-mono text-xs font-bold text-slate-900 dark:text-white outline-none transition-all uppercase placeholder:normal-case"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-neutral-500 mt-1">
                    Adds an instant 1-tap copy button in your vault cards.
                  </p>
                </div>

                {/* Expiry Date */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar size={13} />
                      <span>Expiry / Renewal Date</span>
                    </label>
                    <span className="text-[10px] text-slate-400 dark:text-neutral-500">Optional</span>
                  </div>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-[#262626] bg-slate-50/60 dark:bg-[#141414] focus:border-[#3ECF8E] focus:bg-white dark:focus:bg-[#18181B] text-xs font-bold text-slate-900 dark:text-white outline-none transition-all"
                  />

                  {/* Quick Preset Date Buttons */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleSetExpiryYears(1)}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-[#202024] dark:hover:bg-[#28282D] text-slate-700 dark:text-neutral-300 cursor-pointer"
                    >
                      +1 Year
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetExpiryYears(5)}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-[#202024] dark:hover:bg-[#28282D] text-slate-700 dark:text-neutral-300 cursor-pointer"
                    >
                      +5 Years
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetExpiryYears(10)}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-[#202024] dark:hover:bg-[#28282D] text-slate-700 dark:text-neutral-300 cursor-pointer"
                    >
                      +10 Yrs (Passport)
                    </button>
                    {formData.expiryDate && (
                      <button
                        type="button"
                        onClick={handleClearExpiry}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-semibold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Privacy & MPIN Lock */}
            <div className="bg-white dark:bg-[#18181B] rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-[#262626] shadow-sm transition-all space-y-5">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] font-bold text-xs flex items-center justify-center">
                  5
                </span>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Vault Privacy & MPIN Lock
                </h2>
              </div>

              {/* 4-Digit Security MPIN Toggle */}
              <div
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                  formData.isMpinProtected
                    ? 'bg-amber-50/70 dark:bg-amber-500/10 border-amber-300/80 dark:border-amber-500/30 ring-1 ring-amber-400/20'
                    : 'bg-slate-50/60 dark:bg-[#141414] border-slate-200 dark:border-[#262626]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      formData.isMpinProtected
                        ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                        : 'bg-slate-200 dark:bg-[#262626] text-slate-400 dark:text-neutral-500'
                    }`}
                  >
                    <Lock size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <label
                        htmlFor="mpin-toggle"
                        className="text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
                      >
                        Lock with 4-Digit Security MPIN (Confidential)
                      </label>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          formData.isMpinProtected
                            ? 'bg-amber-200/80 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300'
                            : 'bg-slate-200 dark:bg-[#262626] text-slate-600 dark:text-neutral-400'
                        }`}
                      >
                        {formData.isMpinProtected ? 'MPIN Locked' : 'Standard Protection'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                      Requires entering your family's 4-digit security MPIN before opening, decrypting, or viewing this document. Recommended for Property Deeds, Bank Passbooks, Wills, and Financial Records.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    id="mpin-toggle"
                    type="checkbox"
                    checked={formData.isMpinProtected}
                    onChange={(e) => setFormData({ ...formData, isMpinProtected: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-[#262626] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-[#10B981] dark:peer-checked:bg-[#3ECF8E]"></div>
                </label>
              </div>

              {/* Who Can View Access Control */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                  Who Can View This Document?
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-colors ${
                      formData.whoCanViewType === 'ALL'
                        ? 'border-[#3ECF8E] bg-[#3ECF8E]/10 ring-1 ring-[#3ECF8E]/20'
                        : 'border-slate-200 dark:border-[#262626] hover:border-slate-300 dark:hover:border-neutral-700 bg-white dark:bg-[#141414]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="whoCanViewType"
                      checked={formData.whoCanViewType === 'ALL'}
                      onChange={() => setFormData({ ...formData, whoCanViewType: 'ALL' })}
                      className="mt-0.5 text-[#10B981] dark:text-[#3ECF8E] focus:ring-[#3ECF8E]"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        Whole Family (Everyone)
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                        All authorized members in your family vault can view.
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-colors ${
                      formData.whoCanViewType === 'SPECIFIC'
                        ? 'border-[#3ECF8E] bg-[#3ECF8E]/10 ring-1 ring-[#3ECF8E]/20'
                        : 'border-slate-200 dark:border-[#262626] hover:border-slate-300 dark:hover:border-neutral-700 bg-white dark:bg-[#141414]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="whoCanViewType"
                      checked={formData.whoCanViewType === 'SPECIFIC'}
                      onChange={() => setFormData({ ...formData, whoCanViewType: 'SPECIFIC' })}
                      className="mt-0.5 text-[#10B981] dark:text-[#3ECF8E] focus:ring-[#3ECF8E]"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        Restricted (Selected Members)
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                        Limit visibility to specific family members only.
                      </div>
                    </div>
                  </label>
                </div>

                {formData.whoCanViewType === 'SPECIFIC' && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] space-y-2.5 animate-in fade-in">
                    <span className="text-xs font-bold text-slate-700 dark:text-neutral-300 block">
                      Select Allowed Family Members:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {members.map((m) => (
                        <label
                          key={m._id}
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#262626] text-xs font-medium text-slate-700 dark:text-neutral-300 cursor-pointer hover:border-slate-300 dark:hover:border-neutral-700"
                        >
                          <input
                            type="checkbox"
                            checked={formData.selectedWhoCanView.includes(m._id)}
                            onChange={() => handleToggleMemberView(m._id)}
                            className="rounded text-[#10B981] dark:text-[#3ECF8E] border-slate-300 dark:border-[#262626] focus:ring-[#3ECF8E]"
                          />
                          <span className="truncate">
                            {m.name} ({m.relationship || 'Member'})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop In-Form Submit Bar */}
            <div className="hidden lg:flex items-center justify-between gap-4 pt-2">
              <button
                type="button"
                onClick={() => navigate('/vault')}
                className="px-6 py-3 rounded-2xl border border-slate-200 dark:border-[#262626] hover:bg-slate-100 dark:hover:bg-[#1C1C1C] text-slate-700 dark:text-neutral-300 font-bold text-xs transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] font-bold text-sm shadow-md shadow-[#3ECF8E]/25 transition-all cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Encrypting & Saving to Vault...</span>
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    <span>Save Document to Family Vault</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ================= MOBILE STICKY BOTTOM ACTION BAR (< lg) ================= */}
          {/* Positioned right above mobile bottom nav with iPhone Safe Area support */}
          <div className="lg:hidden fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] inset-x-0 z-30 bg-white/95 dark:bg-[#141414]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-[#262626] p-2 sm:p-3 shadow-xl">
            <div className="max-w-md mx-auto flex items-center justify-between gap-2 sm:gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                  {file ? file.name : 'No file selected'}
                </div>
                <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-neutral-400 flex items-center gap-1 truncate">
                  {file ? (
                    <span className="text-emerald-700 dark:text-[#3ECF8E] font-semibold truncate">
                      Ready to encrypt
                    </span>
                  ) : (
                    <span className="truncate">Snap camera or pick file</span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="min-h-[40px] px-3.5 sm:px-5 py-2 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] font-bold text-xs shadow-md shadow-[#3ECF8E]/25 flex items-center justify-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50 active:scale-95 transition-all"
              >
                {loading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    <span>Save to Vault</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
