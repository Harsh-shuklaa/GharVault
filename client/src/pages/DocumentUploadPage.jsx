import React, { useState, useEffect, useRef } from 'react';
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
  EyeOff,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Copy,
  Car,
  Plane,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function DocumentUploadPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Query parameter pre-fills
  const preselectedMember = searchParams.get('member') || '';
  const preselectedTitle = searchParams.get('title') || '';
  const preselectedCategory = searchParams.get('category') || '';

  // Wizard Step (1, 2, or 3)
  const [currentStep, setCurrentStep] = useState(1);

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Upload Mode: 'single' or 'twosided'
  const [uploadMode, setUploadMode] = useState('single');

  // Single File State
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Two-Sided ID State
  const [frontFile, setFrontFile] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [backPreview, setBackPreview] = useState(null);

  // AI Document Scanning State
  const [isScanning, setIsScanning] = useState(false);
  const [aiScanResult, setAiScanResult] = useState(null);
  const [scanMessage, setScanMessage] = useState('');

  // Form Metadata
  const [formData, setFormData] = useState({
    title: preselectedTitle || '',
    category: preselectedCategory || 'ID Cards',
    assignedMemberId: preselectedMember,
    documentNumber: '',
    expiryDate: '',
    whoCanViewType: 'ALL', // 'ALL' or 'SPECIFIC'
    selectedWhoCanView: [],
    isMpinProtected: false,
    notes: '',
  });

  // Active Indian Template Preset selected (if any)
  const [activePreset, setActivePreset] = useState(null);

  // Fetch Family Members on mount
  useEffect(() => {
    let isMounted = true;
    api
      .getMembers()
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

  // Handle single file preview
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    if (file.type && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  // Handle two-sided previews
  useEffect(() => {
    if (!frontFile) {
      setFrontPreview(null);
      return;
    }
    const url = URL.createObjectURL(frontFile);
    setFrontPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [frontFile]);

  useEffect(() => {
    if (!backFile) {
      setBackPreview(null);
      return;
    }
    const url = URL.createObjectURL(backFile);
    setBackPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [backFile]);

  // Indian Quick Presets
  const indianPresets = [
    {
      id: 'aadhaar',
      label: 'Aadhaar Card',
      emoji: '🇮🇳',
      category: 'ID Cards',
      defaultTitle: 'Aadhaar Card',
      placeholderNumber: '•••• •••• •••• (12 Digits)',
      autoMpin: false,
      expiryYears: null,
    },
    {
      id: 'pan',
      label: 'PAN Card',
      emoji: '💼',
      category: 'ID Cards',
      defaultTitle: 'PAN Card',
      placeholderNumber: 'ABCDE1234F (10 Digits)',
      autoMpin: false,
      expiryYears: null,
    },
    {
      id: 'vehicle',
      label: 'Vehicle RC / DL',
      emoji: '🚗',
      category: 'Other',
      defaultTitle: 'Vehicle RC / Driving License',
      placeholderNumber: 'DL-01-2022-0001234',
      autoMpin: false,
      expiryYears: 15,
    },
    {
      id: 'mediclaim',
      label: 'Mediclaim Policy',
      emoji: '🏥',
      category: 'Medical & Health',
      defaultTitle: 'Health Insurance Policy',
      placeholderNumber: 'Policy No. 4920/123/90',
      autoMpin: false,
      expiryYears: 1,
    },
    {
      id: 'property',
      label: 'House Deed / Flat',
      emoji: '📜',
      category: 'Bank & Property',
      defaultTitle: 'Property Sale Deed / Registry',
      placeholderNumber: 'Registration No. 892/2026',
      autoMpin: true,
      expiryYears: null,
    },
    {
      id: 'passport',
      label: 'Indian Passport',
      emoji: '✈️',
      category: 'ID Cards',
      defaultTitle: 'Indian Passport',
      placeholderNumber: 'Z1234567',
      autoMpin: false,
      expiryYears: 10,
    },
  ];

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
      label: 'Other & Vehicle',
      sub: 'Bills, Warranties, Vehicle RC',
      icon: Folder,
      badge: 'General',
    },
  ];

  // Apply a Quick Preset
  const handleApplyPreset = (preset) => {
    setActivePreset(preset.id);
    setFormData((prev) => {
      const nextTitle = prev.title ? prev.title : preset.defaultTitle;
      let nextExpiry = prev.expiryDate;
      if (preset.expiryYears) {
        const d = new Date();
        d.setFullYear(d.getFullYear() + preset.expiryYears);
        nextExpiry = d.toISOString().split('T')[0];
      }
      return {
        ...prev,
        title: nextTitle,
        category: preset.category,
        isMpinProtected: preset.autoMpin || prev.isMpinProtected,
        expiryDate: nextExpiry,
      };
    });
    toast.success(`Configured preset for ${preset.label}!`);
  };

  // Automatic AI Document Scanner & Metadata Extraction
  const triggerAIScan = async (fileToScan) => {
    if (!fileToScan) return;
    setIsScanning(true);
    setScanMessage('AI is reading document & auto-detecting ID Number...');
    try {
      const scanData = new FormData();
      scanData.append('file', fileToScan);
      const res = await api.scanDocument(scanData);

      if (res?.data) {
        const data = res.data;
        setAiScanResult(data);

        // Map Category to one of our app categories
        let targetCategory = formData.category;
        if (data.category) {
          if (data.category === 'Vehicle') targetCategory = 'Other';
          else if (data.category === 'Financial' || data.category === 'Property & Legal') targetCategory = 'Bank & Property';
          else if (categories.some((c) => c.id === data.category)) targetCategory = data.category;
        }

        // Auto-fill metadata into form
        setFormData((prev) => {
          const nextTitle = data.suggestedTitle || prev.title;
          const nextDocNum = data.docNumber || prev.documentNumber;
          const nextExpiry = data.expiryDate || prev.expiryDate;
          const nextMember = data.matchedMemberId || prev.assignedMemberId;

          // If blood group or emergency details found, add to notes
          let nextNotes = prev.notes;
          if (data.emergencyDetails?.bloodGroup && !nextNotes.includes('Blood Group')) {
            nextNotes = `${nextNotes ? nextNotes + '\n' : ''}Blood Group: ${data.emergencyDetails.bloodGroup}`;
          }
          if (data.emergencyDetails?.tollFreeHelpLine && !nextNotes.includes('Helpline')) {
            nextNotes = `${nextNotes ? nextNotes + '\n' : ''}Cashless Helpline: ${data.emergencyDetails.tollFreeHelpLine}`;
          }

          return {
            ...prev,
            title: nextTitle,
            documentNumber: nextDocNum,
            category: targetCategory,
            expiryDate: nextExpiry,
            assignedMemberId: nextMember,
            notes: nextNotes,
          };
        });

        // Trigger Indian preset highlight if applicable
        const dType = (data.docType || '').toLowerCase();
        if (dType.includes('aadhaar')) setActivePreset('aadhaar');
        else if (dType.includes('pan')) setActivePreset('pan');
        else if (dType.includes('license') || dType.includes('rc')) setActivePreset('vehicle');
        else if (dType.includes('insurance')) setActivePreset('mediclaim');
        else if (dType.includes('passport')) setActivePreset('passport');

        if (data.docNumber) {
          toast.success(`✨ Auto-detected ${data.docType}: ${data.docNumber}`);
        } else if (data.aiEngine === 'heuristic_fallback') {
          toast.info('💡 Tip: Gemini API Key add karein for 100% visual OCR text detection directly from photos!');
        } else {
          toast.success(`✨ Auto-detected: ${data.docType}`);
        }
      }
    } catch (err) {
      console.warn('AI Scan error:', err);
      if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.status === 404)) {
        toast.error('AI Scan Error: Backend server port 5000 par start nahi hai (npm run dev check karein).');
      } else {
        toast.error(err.message || 'AI document scan failed.');
      }
    } finally {
      setIsScanning(false);
      setScanMessage('');
    }
  };

  // Smart Filename Detection & AI Auto-Scan
  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;
    if (selectedFile.size > 25 * 1024 * 1024) {
      setError('File size exceeds the 25MB vault limit. Please choose a smaller file.');
      return;
    }
    setError('');
    setFile(selectedFile);

    const name = selectedFile.name.toLowerCase();
    const cleanName = selectedFile.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[_-]+/g, ' ')
      .trim();

    // Auto-detect Indian presets based on filename keywords
    if (name.includes('pan') || name.includes('nsdl')) {
      handleApplyPreset(indianPresets.find((p) => p.id === 'pan'));
    } else if (name.includes('aadhaar') || name.includes('adhar') || name.includes('uid')) {
      handleApplyPreset(indianPresets.find((p) => p.id === 'aadhaar'));
    } else if (name.includes('insurance') || name.includes('mediclaim') || name.includes('policy')) {
      handleApplyPreset(indianPresets.find((p) => p.id === 'mediclaim'));
    } else if (name.includes('passport')) {
      handleApplyPreset(indianPresets.find((p) => p.id === 'passport'));
    } else if (name.includes('rc') || name.includes('driving') || name.includes('license') || name.includes('vehicle')) {
      handleApplyPreset(indianPresets.find((p) => p.id === 'vehicle'));
    } else if (name.includes('registry') || name.includes('deed') || name.includes('property')) {
      handleApplyPreset(indianPresets.find((p) => p.id === 'property'));
    }

    if (!formData.title) {
      setFormData((prev) => ({ ...prev, title: cleanName }));
    }

    // Trigger AI Vision scan
    triggerAIScan(selectedFile);
  };

  const handleFrontFileChange = (selectedFront) => {
    if (!selectedFront) return;
    setFrontFile(selectedFront);
    // Trigger AI Vision scan on front side of ID card
    triggerAIScan(selectedFront);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Canvas stitching for 2-sided ID cards
  const stitchTwoSidedImages = (front, back) => {
    return new Promise((resolve) => {
      const frontImg = new Image();
      const backImg = new Image();
      let frontLoaded = false;
      let backLoaded = false;

      const finishStitch = () => {
        if (!frontLoaded || !backLoaded) return;
        try {
          const maxWidth = Math.max(frontImg.width, backImg.width, 1000);
          const scaleF = maxWidth / frontImg.width;
          const scaleB = maxWidth / backImg.width;
          const heightF = frontImg.height * scaleF;
          const heightB = backImg.height * scaleB;
          const separatorHeight = 28;
          const totalHeight = heightF + heightB + separatorHeight;

          const canvas = document.createElement('canvas');
          canvas.width = maxWidth;
          canvas.height = totalHeight;
          const ctx = canvas.getContext('2d');

          // Clean White Background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, maxWidth, totalHeight);

          // Draw Front Side
          ctx.drawImage(frontImg, 0, 0, maxWidth, heightF);

          // Draw Separator with clean watermark
          ctx.fillStyle = '#f1f5f9';
          ctx.fillRect(0, heightF, maxWidth, separatorHeight);
          ctx.fillStyle = '#64748b';
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('— GHARVAULT SECURE SCAN • REVERSE SIDE —', maxWidth / 2, heightF + 19);

          // Draw Back Side
          ctx.drawImage(backImg, 0, heightF + separatorHeight, maxWidth, heightB);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(front);
                return;
              }
              const stitchedFile = new File(
                [blob],
                `${front.name.replace(/\.[^/.]+$/, '')}_2Sided.jpg`,
                { type: 'image/jpeg' }
              );
              resolve(stitchedFile);
            },
            'image/jpeg',
            0.92
          );
        } catch (err) {
          console.error('Failed to stitch 2-sided document:', err);
          resolve(front);
        }
      };

      frontImg.onload = () => {
        frontLoaded = true;
        finishStitch();
      };
      backImg.onload = () => {
        backLoaded = true;
        finishStitch();
      };
      frontImg.onerror = () => resolve(front);
      backImg.onerror = () => resolve(front);

      frontImg.src = URL.createObjectURL(front);
      backImg.src = URL.createObjectURL(back);
    });
  };

  // Category change handler with smart MPIN default
  const handleSelectCategory = (catId) => {
    setFormData((prev) => ({
      ...prev,
      category: catId,
      isMpinProtected:
        catId === 'Bank & Property' || catId === 'Legal' ? true : prev.isMpinProtected,
    }));
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

  // Advance from Step 1 to Step 2
  const handleProceedToStep2 = () => {
    if (uploadMode === 'single') {
      if (!file) {
        setError('Please choose or scan a document file first.');
        toast.error('Please choose or scan a document file first.');
        return;
      }
    } else {
      if (!frontFile) {
        setError('Please upload at least the Front side of your ID card.');
        toast.error('Please upload at least the Front side of your ID card.');
        return;
      }
    }
    setError('');
    setCurrentStep(2);
  };

  // Advance from Step 2 to Step 3
  const handleProceedToStep3 = () => {
    const cleanTitle = (formData.title || (file ? file.name : 'Document')).trim();
    if (!cleanTitle) {
      setError('Please provide a title for this document.');
      toast.error('Please enter a document title.');
      return;
    }
    setError('');
    setCurrentStep(3);
  };

  // Final Vault Submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    let finalFile = file;

    // If 2-sided upload mode is used
    if (uploadMode === 'twosided') {
      if (!frontFile) {
        setError('Please select the front side of your ID.');
        return;
      }
      if (backFile) {
        toast.info('Stitching Front and Back sides into high-res unified document...');
        finalFile = await stitchTwoSidedImages(frontFile, backFile);
      } else {
        finalFile = frontFile;
      }
    }

    if (!finalFile) {
      setError('Please select or capture a document to upload.');
      toast.error('Please choose a document to upload.');
      return;
    }

    const cleanTitle = (formData.title || finalFile.name || '').trim();
    if (!cleanTitle) {
      setError('Please provide a title for this document.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const data = new FormData();
      data.append('file', finalFile);
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

      // Auto-sync emergency medical credentials from Gemini AI scan
      if (aiScanResult?.emergencyDetails) {
        data.append('emergencyDetails', JSON.stringify(aiScanResult.emergencyDetails));
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

  // Helper for live vault card visual strip
  const getPreviewStripStyle = () => {
    const text = `${formData.title} ${formData.category}`.toLowerCase();
    if (text.includes('aadhaar') || text.includes('adhar') || text.includes('uid')) {
      return {
        strip: 'from-orange-500 via-white to-emerald-600',
        badge: '🇮🇳 Aadhaar',
        boxBg: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400',
      };
    }
    if (text.includes('pan')) {
      return {
        strip: 'from-blue-700 via-sky-600 to-indigo-900',
        badge: '💼 PAN Card',
        boxBg: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
      };
    }
    if (text.includes('rc') || text.includes('vehicle') || text.includes('driving') || text.includes('license')) {
      return {
        strip: 'from-emerald-600 via-teal-600 to-emerald-700',
        badge: '🚗 Vehicle / DL',
        boxBg: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-[#3ECF8E]',
      };
    }
    if (text.includes('mediclaim') || text.includes('health') || text.includes('insurance')) {
      return {
        strip: 'from-rose-600 via-red-600 to-rose-700',
        badge: '🏥 Mediclaim',
        boxBg: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400',
      };
    }
    if (text.includes('property') || text.includes('deed') || text.includes('registry')) {
      return {
        strip: 'from-amber-600 via-yellow-600 to-amber-700',
        badge: '📜 Property Deed',
        boxBg: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
      };
    }
    return {
      strip: 'from-[#10B981] to-[#3ECF8E]',
      badge: formData.category || 'Document',
      boxBg: 'bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-600 dark:text-[#3ECF8E]',
    };
  };

  const previewVisual = getPreviewStripStyle();
  const assignedMemberObj = members.find((m) => m._id === formData.assignedMemberId);

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-[#121212] pb-[calc(8.5rem+env(safe-area-inset-bottom,0px))] lg:pb-16 transition-colors">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
        {/* Navigation Breadcrumb / Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Upload New Document
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-100/80 dark:bg-[#3ECF8E]/15 text-emerald-800 dark:text-[#3ECF8E] border border-emerald-200 dark:border-[#3ECF8E]/30">
                <Shield size={12} />
                256-Bit Encrypted
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start bg-white dark:bg-[#18181B] px-3.5 py-1.5 rounded-2xl border border-slate-200/80 dark:border-[#262626] shadow-2xs">
            <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-xs font-semibold text-slate-700 dark:text-neutral-300">
              Zero-Knowledge Vault
            </span>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-xs font-semibold flex items-start justify-between gap-3 animate-fadeIn">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={17} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError('')}
              className="text-red-500 hover:text-red-700 dark:text-red-400 cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* ================= 3-STEP PROGRESS WIZARD BAR ================= */}
        <div className="bg-white dark:bg-[#18181B] rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-slate-200/80 dark:border-[#262626] shadow-sm">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {/* Step 1 Button */}
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                currentStep === 1
                  ? 'bg-emerald-50 dark:bg-[#3ECF8E]/10 border border-emerald-300/80 dark:border-[#3ECF8E]/30 ring-2 ring-emerald-500/10'
                  : currentStep > 1
                  ? 'bg-slate-50 dark:bg-[#141414] hover:bg-slate-100 dark:hover:bg-[#202024]'
                  : 'opacity-50 pointer-events-none'
              }`}
            >
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                  currentStep === 1
                    ? 'bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212]'
                    : currentStep > 1
                    ? 'bg-emerald-100 dark:bg-[#3ECF8E]/20 text-emerald-800 dark:text-[#3ECF8E]'
                    : 'bg-slate-200 dark:bg-[#262626] text-slate-500'
                }`}
              >
                {currentStep > 1 ? <Check size={14} strokeWidth={3} /> : '1'}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-neutral-500 hidden sm:block">
                  Step 1
                </div>
                <div
                  className={`text-xs sm:text-sm font-bold truncate ${
                    currentStep === 1
                      ? 'text-emerald-900 dark:text-[#3ECF8E]'
                      : 'text-slate-800 dark:text-neutral-200'
                  }`}
                >
                  File & Scan
                </div>
              </div>
            </button>

            {/* Step 2 Button */}
            <button
              type="button"
              onClick={() => (file || frontFile ? setCurrentStep(2) : handleProceedToStep2())}
              className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                currentStep === 2
                  ? 'bg-emerald-50 dark:bg-[#3ECF8E]/10 border border-emerald-300/80 dark:border-[#3ECF8E]/30 ring-2 ring-emerald-500/10'
                  : currentStep > 2
                  ? 'bg-slate-50 dark:bg-[#141414] hover:bg-slate-100 dark:hover:bg-[#202024]'
                  : 'opacity-60'
              }`}
            >
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                  currentStep === 2
                    ? 'bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212]'
                    : currentStep > 2
                    ? 'bg-emerald-100 dark:bg-[#3ECF8E]/20 text-emerald-800 dark:text-[#3ECF8E]'
                    : 'bg-slate-200 dark:bg-[#262626] text-slate-500'
                }`}
              >
                {currentStep > 2 ? <Check size={14} strokeWidth={3} /> : '2'}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-neutral-500 hidden sm:block">
                  Step 2
                </div>
                <div
                  className={`text-xs sm:text-sm font-bold truncate ${
                    currentStep === 2
                      ? 'text-emerald-900 dark:text-[#3ECF8E]'
                      : 'text-slate-800 dark:text-neutral-200'
                  }`}
                >
                  Tag & Category
                </div>
              </div>
            </button>

            {/* Step 3 Button */}
            <button
              type="button"
              onClick={() => handleProceedToStep3()}
              className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                currentStep === 3
                  ? 'bg-emerald-50 dark:bg-[#3ECF8E]/10 border border-emerald-300/80 dark:border-[#3ECF8E]/30 ring-2 ring-emerald-500/10'
                  : 'opacity-60'
              }`}
            >
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                  currentStep === 3
                    ? 'bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212]'
                    : 'bg-slate-200 dark:bg-[#262626] text-slate-500'
                }`}
              >
                3
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-neutral-500 hidden sm:block">
                  Step 3
                </div>
                <div
                  className={`text-xs sm:text-sm font-bold truncate ${
                    currentStep === 3
                      ? 'text-emerald-900 dark:text-[#3ECF8E]'
                      : 'text-slate-800 dark:text-neutral-200'
                  }`}
                >
                  Security & Lock
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* ================= 1-TAP INDIAN QUICK PRESETS STRIP ================= */}
        <div className="bg-white dark:bg-[#18181B] rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-[#262626] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-500" />
              <span>1-Tap Indian Document Presets (Auto-Configures Categories & Masking)</span>
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {indianPresets.map((preset) => {
              const isSelected = activePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                    isSelected
                      ? 'border-[#3ECF8E] bg-[#3ECF8E]/10 text-emerald-800 dark:text-[#3ECF8E] shadow-2xs'
                      : 'border-slate-200 dark:border-[#2A2A2E] bg-slate-50 dark:bg-[#141414] hover:bg-slate-100 dark:hover:bg-[#202024] text-slate-700 dark:text-neutral-300'
                  }`}
                >
                  <span>{preset.emoji}</span>
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= STEP 1: FILE INGESTION & 2-SIDED STITCHER ================= */}
        {currentStep === 1 && (
          <div className="bg-white dark:bg-[#18181B] rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-[#262626] shadow-sm space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-[#262626] pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  Step 1: Select or Scan Document
                </h2>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Choose a PDF, high-res photo, or capture front & back of your ID card.
                </p>
              </div>

              {/* Mode Toggle: Single vs 2-Sided */}
              <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-[#141414] border border-slate-200/80 dark:border-[#262626] text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setUploadMode('single')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    uploadMode === 'single'
                      ? 'bg-white dark:bg-[#262626] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-neutral-400 hover:text-slate-800'
                  }`}
                >
                  Single Document
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('twosided')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    uploadMode === 'twosided'
                      ? 'bg-white dark:bg-[#262626] text-emerald-700 dark:text-[#3ECF8E] shadow-xs'
                      : 'text-slate-500 dark:text-neutral-400 hover:text-slate-800'
                  }`}
                >
                  <Layers size={13} />
                  <span>2-Sided ID (Front + Back)</span>
                </button>
              </div>
            </div>

            {/* Hidden Single File Inputs */}
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

            {/* MODE 1: SINGLE DOCUMENT UPLOAD */}
            {uploadMode === 'single' && (
              <div className="space-y-4">
                {!file ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-upload-input').click()}
                    className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all flex flex-col items-center justify-center min-h-[260px] cursor-pointer group ${
                      isDragging
                        ? 'border-[#3ECF8E] bg-[#3ECF8E]/10 scale-[1.01]'
                        : 'border-slate-300 dark:border-[#2E2E33] bg-slate-50/70 dark:bg-[#141414] hover:border-emerald-500/60 dark:hover:border-[#3ECF8E]/50 hover:bg-emerald-50/10'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100/70 dark:bg-[#3ECF8E]/15 text-emerald-600 dark:text-[#3ECF8E] flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform shadow-xs">
                      <Upload size={32} strokeWidth={2.2} />
                    </div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-neutral-100">
                      Click to choose document, or drag & drop here
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 max-w-sm">
                      PDF, PNG, JPG, or WEBP supported up to 25 MB
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white dark:bg-[#202024] text-slate-600 dark:text-neutral-300 border border-slate-200 dark:border-[#2A2A2E] shadow-2xs">
                        Auto-extracts document name
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Attached Single File Card */
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-200/80 dark:border-[#262626] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-16 h-16 rounded-xl object-cover ring-2 ring-emerald-500/20 shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                          <FileText size={28} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                            {file.name}
                          </span>
                          <span className="p-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-[#3ECF8E]/20 dark:text-[#3ECF8E]">
                            <Check size={12} strokeWidth={3} />
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 font-mono">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || 'Document'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => document.getElementById('file-upload-input').click()}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#262626] bg-white dark:bg-[#1E1E22] hover:bg-slate-100 text-slate-700 dark:text-neutral-200 font-bold text-xs cursor-pointer"
                      >
                        Change File
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFile(null);
                          setPreviewUrl(null);
                          setAiScanResult(null);
                        }}
                        className="px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 font-bold text-xs cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                {/* Mobile Camera Button */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => document.getElementById('camera-upload-input').click()}
                    className="px-4 py-2.5 rounded-xl border border-emerald-300 dark:border-[#3ECF8E]/30 bg-emerald-50/70 hover:bg-emerald-100 dark:bg-[#3ECF8E]/10 dark:hover:bg-[#3ECF8E]/20 text-emerald-800 dark:text-[#3ECF8E] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Camera size={15} />
                    <span>Scan with Mobile Camera</span>
                  </button>
                </div>
              </div>
            )}

            {/* MODE 2: 2-SIDED ID STITCHER (Aadhaar / DL / RC) */}
            {uploadMode === 'twosided' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-[#3ECF8E]/10 border border-emerald-200/80 dark:border-[#3ECF8E]/20 text-xs text-emerald-800 dark:text-[#3ECF8E] flex items-center gap-2">
                  <Sparkles size={16} className="shrink-0" />
                  <span>
                    <strong>Smart 2-Sided Stitcher:</strong> Front and Back photos will automatically combine into one seamless high-resolution document.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Front Side Box */}
                  <div className="p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-[#262626] bg-slate-50/50 dark:bg-[#141414] text-center space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 flex items-center justify-center gap-1">
                      <span>🪪 Side 1: Front Side</span>
                      {frontFile && <Check size={14} className="text-[#10B981]" />}
                    </div>
                    {frontPreview ? (
                      <div className="relative rounded-xl overflow-hidden max-h-[160px] mx-auto">
                        <img src={frontPreview} alt="Front" className="h-32 w-auto mx-auto object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={() => {
                            setFrontFile(null);
                            setAiScanResult(null);
                          }}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="py-4">
                        <input
                          id="front-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFrontFileChange(e.target.files[0])}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('front-input').click()}
                          className="px-4 py-2 rounded-xl bg-white dark:bg-[#202024] border border-slate-200 dark:border-[#333] text-xs font-bold text-slate-800 dark:text-neutral-200 hover:border-emerald-500 cursor-pointer shadow-2xs"
                        >
                          + Upload Front Side
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Back Side Box */}
                  <div className="p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-[#262626] bg-slate-50/50 dark:bg-[#141414] text-center space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 flex items-center justify-center gap-1">
                      <span>🪪 Side 2: Back Side</span>
                      {backFile && <Check size={14} className="text-[#10B981]" />}
                    </div>
                    {backPreview ? (
                      <div className="relative rounded-xl overflow-hidden max-h-[160px] mx-auto">
                        <img src={backPreview} alt="Back" className="h-32 w-auto mx-auto object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={() => setBackFile(null)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="py-4">
                        <input
                          id="back-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => setBackFile(e.target.files[0])}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('back-input').click()}
                          className="px-4 py-2 rounded-xl bg-white dark:bg-[#202024] border border-slate-200 dark:border-[#333] text-xs font-bold text-slate-800 dark:text-neutral-200 hover:border-emerald-500 cursor-pointer shadow-2xs"
                        >
                          + Upload Back Side
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* AI SCANNING STATUS & AUTO-DETECTION CARD */}
            {isScanning && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/30 dark:border-[#3ECF8E]/30 relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-[#10B981] dark:text-[#3ECF8E] flex items-center justify-center shrink-0">
                    <Sparkles size={20} className="animate-spin" style={{ animationDuration: '3s' }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                        AI Vision Scanning & OCR...
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#10B981] text-white">
                        Live Auto-Detect
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                      Detecting Aadhaar / PAN / License / Insurance, extracting ID number & auto-assigning member...
                    </p>
                  </div>
                </div>
                {/* Animated scan indicator */}
                <div className="mt-3 h-1.5 w-full bg-slate-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-transparent via-[#3ECF8E] to-transparent w-2/3 animate-pulse" />
                </div>
              </div>
            )}

            {aiScanResult && !isScanning && (
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/80 dark:bg-[#3ECF8E]/10 border border-emerald-300 dark:border-[#3ECF8E]/30 space-y-3 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 dark:border-[#3ECF8E]/20 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] flex items-center justify-center shrink-0 shadow-xs">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-extrabold text-emerald-950 dark:text-white">
                          AI Auto-Detected: {aiScanResult.docType}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 dark:bg-[#3ECF8E]/20 text-emerald-800 dark:text-[#3ECF8E]">
                          {Math.round((aiScanResult.confidence || 0.9) * 100)}% Confidence
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-700 dark:text-[#3ECF8E]/80 mt-0.5">
                        Document ID, Title, and Family Member have been automatically filled!
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => triggerAIScan(uploadMode === 'twosided' ? frontFile : file)}
                    className="self-start sm:self-center px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-[#3ECF8E]/30 bg-white dark:bg-[#1E1E22] hover:bg-emerald-50 text-emerald-800 dark:text-[#3ECF8E] font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <RefreshCw size={12} />
                    <span>Re-scan with AI</span>
                  </button>
                </div>

                {/* Detected Details Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {aiScanResult.docNumber && (
                    <div className="px-3 py-2 rounded-xl bg-white dark:bg-[#18181B] border border-emerald-200 dark:border-[#3ECF8E]/20">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                        Detected ID / Number
                      </div>
                      <div className="text-xs font-mono font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {aiScanResult.docNumber}
                      </div>
                    </div>
                  )}

                  {(aiScanResult.holderName || aiScanResult.matchedMemberName) && (
                    <div className="px-3 py-2 rounded-xl bg-white dark:bg-[#18181B] border border-emerald-200 dark:border-[#3ECF8E]/20">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                        Holder / Member
                      </div>
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white mt-0.5 truncate">
                        {aiScanResult.holderName || aiScanResult.matchedMemberName}
                        {aiScanResult.matchedMemberName && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-[#3ECF8E] ml-1">
                            (Auto-assigned)
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {aiScanResult.category && (
                    <div className="px-3 py-2 rounded-xl bg-white dark:bg-[#18181B] border border-emerald-200 dark:border-[#3ECF8E]/20">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                        Category Binder
                      </div>
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white mt-0.5 truncate">
                        {formData.category}
                      </div>
                    </div>
                  )}

                  {/* Medical / Emergency Auto-Sync Banner */}
                  {aiScanResult.emergencyDetails && (aiScanResult.emergencyDetails.bloodGroup || aiScanResult.emergencyDetails.tpaProvider || aiScanResult.emergencyDetails.policyNumber) && (
                    <div className="col-span-1 sm:col-span-2 px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-red-700 dark:text-red-400">
                        <span>🏥 Emergency Health Card Auto-Sync Ready</span>
                      </div>
                      <div className="text-[11px] text-red-600 dark:text-red-300 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                        {aiScanResult.emergencyDetails.bloodGroup && (
                          <span>• Blood Group: <strong>{aiScanResult.emergencyDetails.bloodGroup}</strong></span>
                        )}
                        {aiScanResult.emergencyDetails.tpaProvider && (
                          <span>• TPA / Insurer: <strong>{aiScanResult.emergencyDetails.tpaProvider}</strong></span>
                        )}
                        {aiScanResult.emergencyDetails.policyNumber && (
                          <span>• Policy #: <strong>{aiScanResult.emergencyDetails.policyNumber}</strong></span>
                        )}
                        {aiScanResult.emergencyDetails.tollFreeHelpLine && (
                          <span>• Helpline: <strong>{aiScanResult.emergencyDetails.tollFreeHelpLine}</strong></span>
                        )}
                      </div>
                      <p className="text-[10px] text-red-500 dark:text-red-400/80 mt-1">
                        ✨ Save karne par ye details family member ke Hospital Ready Emergency Card me automatically update ho jayengi!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 1 Actions */}
            <div className="flex items-center justify-end pt-4 border-t border-slate-100 dark:border-[#262626]">
              <button
                type="button"
                onClick={handleProceedToStep2}
                className="px-6 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] dark:bg-[#3ECF8E] dark:hover:bg-[#34b27b] text-white dark:text-[#121212] font-extrabold text-xs shadow-md shadow-[#3ECF8E]/25 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>Continue to Step 2: Tag & Category</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: DETAILS & MEMBER ASSIGNMENT ================= */}
        {currentStep === 2 && (
          <div className="bg-white dark:bg-[#18181B] rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-[#262626] shadow-sm space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                Step 2: Who Does This Document Belong To?
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Assign this document to a family member and pick its category binder.
              </p>
            </div>

            {/* Family Member Selection Cards */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300">
                  Assign to Family Member *
                </label>
                {aiScanResult?.matchedMemberName && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-[#3ECF8E] bg-emerald-50 dark:bg-[#3ECF8E]/10 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-[#3ECF8E]/20">
                    <Sparkles size={11} />
                    <span>AI Matched: {aiScanResult.holderName || aiScanResult.matchedMemberName}</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {/* Whole Family Option */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, assignedMemberId: '' })}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    !formData.assignedMemberId
                      ? 'border-[#3ECF8E] bg-[#3ECF8E]/10 ring-2 ring-[#3ECF8E]/20'
                      : 'border-slate-200 dark:border-[#262626] bg-slate-50/60 dark:bg-[#141414] hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-[#262626] flex items-center justify-center shrink-0">
                      <Users size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        Whole Family
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-neutral-500">Common / Joint</div>
                    </div>
                  </div>
                  {!formData.assignedMemberId && (
                    <span className="w-4 h-4 rounded-full bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] flex items-center justify-center shrink-0">
                      <Check size={10} strokeWidth={3} />
                    </span>
                  )}
                </button>

                {/* Specific Members */}
                {members.map((m) => {
                  const isSelected = formData.assignedMemberId === m._id;
                  return (
                    <button
                      key={m._id}
                      type="button"
                      onClick={() => setFormData({ ...formData, assignedMemberId: m._id })}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'border-[#3ECF8E] bg-[#3ECF8E]/10 ring-2 ring-[#3ECF8E]/20'
                          : 'border-slate-200 dark:border-[#262626] bg-slate-50/60 dark:bg-[#141414] hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={
                            m.avatar ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.name)}`
                          }
                          alt={m.name}
                          className="w-8 h-8 rounded-xl object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {m.name}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-neutral-500 truncate">
                            {m.relationship || 'Member'}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] flex items-center justify-center shrink-0">
                          <Check size={10} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Document Title & Document ID Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Title */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300">
                    Document Title *
                  </label>
                  {aiScanResult?.suggestedTitle && formData.title === aiScanResult.suggestedTitle && (
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-[#3ECF8E] flex items-center gap-1">
                      <Sparkles size={11} /> Auto-titled by AI
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Papa's Aadhaar Card, Car Insurance"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-[#262626] bg-slate-50/60 dark:bg-[#141414] focus:border-[#3ECF8E] text-xs font-bold text-slate-900 dark:text-white outline-none"
                />
              </div>

              {/* Document Number with Privacy Mask preview */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 flex items-center gap-1">
                    <Hash size={13} />
                    <span>ID / Policy Number</span>
                  </label>
                  {aiScanResult?.docNumber && formData.documentNumber === aiScanResult.docNumber ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-[#3ECF8E]">
                      <Sparkles size={11} /> Auto-detected by AI
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-[#3ECF8E]">
                      1-Tap Copy Enabled
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="e.g. 5492 1029 4812 or ABCDE1234F"
                  value={formData.documentNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, documentNumber: e.target.value.toUpperCase() })
                  }
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-[#262626] bg-slate-50/60 dark:bg-[#141414] focus:border-[#3ECF8E] font-mono text-xs font-bold text-slate-900 dark:text-white outline-none uppercase"
                />
              </div>
            </div>

            {/* Category Grid */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300">
                Select Category Binder *
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = formData.category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory(cat.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[82px] ${
                        isSelected
                          ? 'border-[#3ECF8E] bg-[#3ECF8E]/10 ring-2 ring-[#3ECF8E]/25 shadow-xs'
                          : 'border-slate-200 dark:border-[#262626] bg-slate-50/50 dark:bg-[#141414] hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                            isSelected
                              ? 'bg-[#3ECF8E] text-[#121212]'
                              : 'bg-slate-200/80 dark:bg-[#202024] text-slate-600 dark:text-neutral-400'
                          }`}
                        >
                          <Icon size={14} />
                        </div>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] flex items-center justify-center">
                            <Check size={10} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                          {cat.label}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5 truncate">
                          {cat.sub}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2 Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-[#262626]">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#262626] bg-white dark:bg-[#18181B] text-slate-700 dark:text-neutral-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft size={14} />
                <span>Back to File</span>
              </button>

              <button
                type="button"
                onClick={handleProceedToStep3}
                className="px-6 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] dark:bg-[#3ECF8E] dark:hover:bg-[#34b27b] text-white dark:text-[#121212] font-extrabold text-xs shadow-md shadow-[#3ECF8E]/25 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>Continue to Step 3: Security & Lock</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: SECURITY, EXPIRY & LIVE CARD PREVIEW ================= */}
        {currentStep === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fadeIn">
            {/* Left 7 Cols: Security Toggles & Expiry */}
            <div className="lg:col-span-7 bg-white dark:bg-[#18181B] rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-[#262626] shadow-sm space-y-5">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  Step 3: Security & Expiry Controls
                </h2>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Protect with 4-digit MPIN and schedule renewal alerts.
                </p>
              </div>

              {/* MPIN Lock Toggle */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#262626] bg-slate-50/70 dark:bg-[#141414] space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        formData.isMpinProtected
                          ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                          : 'bg-slate-200/80 dark:bg-[#262626] text-slate-500 dark:text-neutral-400'
                      }`}
                    >
                      <Lock size={18} />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>Protect with 4-Digit MPIN</span>
                        {formData.isMpinProtected && (
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300">
                            Active Lock
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 leading-snug">
                        Requires family security MPIN to view or download document.
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, isMpinProtected: !prev.isMpinProtected }))
                    }
                    className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${
                      formData.isMpinProtected
                        ? 'bg-[#10B981] dark:bg-[#3ECF8E]'
                        : 'bg-slate-300 dark:bg-[#2E2E32]'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        formData.isMpinProtected ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Expiry Date Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <Calendar size={13} />
                    <span>Expiry / Renewal Date</span>
                  </label>
                  {formData.expiryDate && (
                    <button
                      type="button"
                      onClick={handleClearExpiry}
                      className="text-[10px] font-bold text-slate-400 hover:text-red-500 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-[#262626] bg-slate-50/60 dark:bg-[#141414] focus:border-[#3ECF8E] text-xs font-bold text-slate-900 dark:text-white outline-none"
                />

                {/* 1-Tap Expiry Quick Presets */}
                <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleSetExpiryYears(1)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-[#202024] text-slate-700 dark:text-neutral-300 cursor-pointer"
                  >
                    +1 Year (Insurance)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetExpiryYears(5)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-[#202024] text-slate-700 dark:text-neutral-300 cursor-pointer"
                  >
                    +5 Years
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetExpiryYears(10)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-[#202024] text-slate-700 dark:text-neutral-300 cursor-pointer"
                  >
                    +10 Years (Passport/DL)
                  </button>
                </div>
              </div>

              {/* Physical Locker / Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                  Physical Location / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Original physical copy kept in Almirah Locker 2, blue folder"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-[#262626] bg-slate-50/60 dark:bg-[#141414] focus:border-[#3ECF8E] text-xs font-medium text-slate-900 dark:text-white outline-none resize-none"
                />
              </div>

              {/* Navigation & Submit Action */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-[#262626]">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#262626] bg-white dark:bg-[#18181B] text-slate-700 dark:text-neutral-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft size={14} />
                  <span>Back to Details</span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSubmit}
                  className="px-7 py-3 rounded-2xl bg-[#10B981] hover:bg-[#059669] dark:bg-[#3ECF8E] dark:hover:bg-[#34b27b] text-white dark:text-[#121212] font-black text-xs shadow-lg shadow-[#3ECF8E]/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
                      <span>Encrypting & Storing...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={15} />
                      <span>🔒 Encrypt & Save to Dastavej</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right 5 Cols: LIVE VAULT CARD REAL-TIME PREVIEW */}
            <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                  <Eye size={13} />
                  <span>Live Vault Card Preview</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-[#3ECF8E]">
                  Ready to Vault
                </span>
              </div>

              {/* Realistic Mini Card Render */}
              <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200/90 dark:border-[#262626] p-5 shadow-sm space-y-4 transition-all">
                {/* Realistic Top Colored Strip */}
                <div className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${previewVisual.strip}`} />

                <div className="flex items-start justify-between gap-3 pt-1">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${previewVisual.boxBg}`}
                    >
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                          {formData.title || 'Document Title'}
                        </span>
                        {formData.isMpinProtected && (
                          <span className="p-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                            <Lock size={11} />
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 truncate">
                        {formData.category} • For {assignedMemberObj?.name || 'Whole Family'}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#262626] text-slate-600 dark:text-neutral-300 shrink-0">
                    {previewVisual.badge}
                  </span>
                </div>

                {/* Masked ID Number Display */}
                {formData.documentNumber && (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200/80 dark:border-[#262626] flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-neutral-500 block">
                        ID Number (Masked)
                      </span>
                      <code className="text-xs font-mono font-bold text-slate-900 dark:text-neutral-200 truncate block">
                        •••• •••• {formData.documentNumber.slice(-4)}
                      </code>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-800 dark:text-[#3ECF8E] text-[10px] font-bold">
                      1-Tap Copy
                    </span>
                  </div>
                )}

                {/* Expiry & Location Info */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-neutral-500 font-medium pt-1 border-t border-slate-100 dark:border-[#262626]">
                  <span>
                    Valid to:{' '}
                    <strong className="text-slate-700 dark:text-neutral-300">
                      {formData.expiryDate
                        ? new Date(formData.expiryDate).toLocaleDateString()
                        : 'No Expiry'}
                    </strong>
                  </span>
                  <span>AES-256 Encrypted</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
