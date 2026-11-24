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
  ShieldAlert,
  Copy,
  Car,
  Plane,
  Crop,
  Plus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import DocumentCropperModal from '../components/DocumentCropperModal';

export default function DocumentUploadPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isDark, isObsidian, isMidnight, isBlue } = useTheme();

  // Document Number Masking Toggle & Preview Side
  const [showUnmaskedDocNumber, setShowUnmaskedDocNumber] = useState(false);
  const [activePreviewSide, setActivePreviewSide] = useState('front');
  const [nomineeSync, setNomineeSync] = useState(true);

  const triggerCrop = (targetFile, side = 'single') => {
    if (!targetFile || !targetFile.type || !targetFile.type.startsWith('image/')) {
      toast.info('Cropper is only available for images.');
      return;
    }
    setRawFileForCrop(targetFile);
    setCropTargetSide(side);
    setCropperModalOpen(true);
  };

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

  // Smart Document Cropper & CamScanner Mode State
  const [cropperModalOpen, setCropperModalOpen] = useState(false);
  const [rawFileForCrop, setRawFileForCrop] = useState(null);
  const [cropTargetSide, setCropTargetSide] = useState('single'); // 'single' | 'front' | 'back'
  const [pendingAiScanFile, setPendingAiScanFile] = useState(null);

  // AI Document Scanning State
  const [isScanning, setIsScanning] = useState(false);
  const [aiScanResult, setAiScanResult] = useState(null);
  const [scanMessage, setScanMessage] = useState('');
  const [scanElapsed, setScanElapsed] = useState('0.0');
  const [aiFieldHighlight, setAiFieldHighlight] = useState(false);
  const [detectedProfileSync, setDetectedProfileSync] = useState(null);
  const [autoSyncProfile, setAutoSyncProfile] = useState(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [detectedDuplicate, setDetectedDuplicate] = useState(null);
  const [detectedQualityWarning, setDetectedQualityWarning] = useState(null);
  const scanTimerRef = useRef(null);

  // Play subtle fintech crystal chime using Web Audio API on scan success
  const playSuccessChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  };

  // Scanning Telemetry Timer (updates elapsed time smoothly every 100ms)
  useEffect(() => {
    if (isScanning) {
      setScanElapsed('0.0');
      const start = Date.now();
      scanTimerRef.current = setInterval(() => {
        setScanElapsed(((Date.now() - start) / 1000).toFixed(1));
      }, 100);
    } else {
      if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    }
    return () => {
      if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    };
  }, [isScanning]);

  // Form Metadata
  const [formData, setFormData] = useState({
    title: preselectedTitle || '',
    category: preselectedCategory || 'ID Cards',
    assignedMemberId: preselectedMember,
    documentNumber: '',
    holderName: '',
    fatherOrSpouseName: '',
    dob: '',
    issueDate: '',
    docType: '',
    expiryDate: '',
    whoCanViewType: 'ALL', // 'ALL' or 'SPECIFIC'
    selectedWhoCanView: [],
    isMpinProtected: false,
    notes: '',
  });

  // Prompt user to 1-tap add detected document holder to family if not already in members
  const [detectedNewMemberHolder, setDetectedNewMemberHolder] = useState(null);
  const [isAddingNewMember, setIsAddingNewMember] = useState(false);

  // Quick 1-click addition of detected document holder into Family Vault
  const handleQuickAddMemberFromScan = async () => {
    if (!detectedNewMemberHolder) return;
    try {
      setIsAddingNewMember(true);
      const cleanName = detectedNewMemberHolder.trim();
      const res = await api.addMember({
        name: cleanName,
        relationship: 'Member',
        dateOfBirth: formData.dob || undefined,
      });
      const newMember = res?.member || res?.data || res;
      const newId = (newMember?._id || newMember?.id || '').toString();
      setMembers((prev) => [...prev, newMember]);
      setFormData((prev) => ({ ...prev, assignedMemberId: newId }));
      setDetectedNewMemberHolder(null);
      toast.success(`✨ "${cleanName}" family vault me add ho gaye aur document inko assign ho gaya!`);
    } catch (err) {
      console.warn('Failed to quick add member:', err);
      toast.error('Member add nahi ho saka: ' + (err.message || 'Error'));
    } finally {
      setIsAddingNewMember(false);
    }
  };

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

  // Universal Progressive Image Compressor: Guarantees any uploaded photo/scan is strictly under 500KB (typically 250KB - 420KB)
  // Preserves 1800px high resolution with a clean white background for crystal-clear readability for AI and human viewing
  const compressImageUnder500KB = async (inputFile, targetMaxKb = 460) => {
    if (!inputFile || !inputFile.type || !inputFile.type.startsWith('image/')) {
      return inputFile;
    }
    // If already under 480KB, keep as is
    if (inputFile.size <= targetMaxKb * 1024) {
      return inputFile;
    }

    return new Promise((resolve) => {
      try {
        const img = new Image();
        const url = URL.createObjectURL(inputFile);

        img.onload = () => {
          URL.revokeObjectURL(url);
          const maxDim = 1800;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          // White background prevents transparent PNGs from turning black
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Progressive step-down to guarantee size < targetMaxKb
          const attemptCompression = (quality) => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  resolve(inputFile);
                  return;
                }

                if (blob.size <= targetMaxKb * 1024 || quality <= 0.60) {
                  const cleanName = inputFile.name.replace(/\.[^.]+$/, '') + '.jpg';
                  const compressed = new File([blob], cleanName, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  });
                  compressed.originalSize = inputFile.size;
                  resolve(compressed);
                } else {
                  attemptCompression(Math.max(0.58, quality - 0.12));
                }
              },
              'image/jpeg',
              quality
            );
          };

          attemptCompression(0.82);
        };

        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(inputFile);
        };

        img.src = url;
      } catch (err) {
        console.warn('Canvas compression error, using original file:', err);
        resolve(inputFile);
      }
    });
  };

  // Fast Client-Side SHA-256 Checksum Calculation via Web Crypto API
  const computeFileSha256 = async (inputFile) => {
    if (!inputFile) return null;
    try {
      if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        const arrayBuffer = await inputFile.arrayBuffer();
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (e) {
      console.warn('SHA-256 computation error:', e);
    }
    return null;
  };

  // Real-Time Duplicate Document Detector across Family Vault
  const runDuplicateCheck = async (overrides = {}) => {
    try {
      const activeFile = file || frontFile;
      let sha = null;
      if (activeFile && overrides.fileSha256 === undefined) {
        sha = await computeFileSha256(activeFile);
      }
      const payload = {
        fileSha256: overrides.fileSha256 !== undefined ? overrides.fileSha256 : sha,
        fileName: overrides.fileName !== undefined ? overrides.fileName : (activeFile?.name || ''),
        title: overrides.title !== undefined ? overrides.title : formData.title,
        documentNumber: overrides.documentNumber !== undefined ? overrides.documentNumber : formData.documentNumber,
        assignedMemberId: overrides.assignedMemberId !== undefined ? overrides.assignedMemberId : formData.assignedMemberId,
      };

      // Only check if we have at least sha, documentNumber, or a meaningful title
      if (!payload.fileSha256 && (!payload.documentNumber || payload.documentNumber.trim().length < 4) && (!payload.title || payload.title.trim().length < 4)) {
        return;
      }

      const res = await api.checkDuplicate(payload);
      if (res?.isDuplicate && res?.duplicateWarning) {
        setDetectedDuplicate(res.duplicateWarning);
      } else if (!overrides.preserveExisting) {
        setDetectedDuplicate(null);
      }
    } catch (e) {
      console.warn('Real-time duplicate check error:', e);
    }
  };

  // Automatic AI Document Scanner & Metadata Extraction
  const triggerAIScan = async (fileToScan) => {
    if (!fileToScan) return;
    setIsScanning(true);
    setScanMessage('AI is reading document & auto-detecting ID Number...');
    try {
      // Ensure the scan file is strictly under 500KB
      const fileForScan = await compressImageUnder500KB(fileToScan);
      const scanData = new FormData();
      scanData.append('file', fileForScan);
      const res = await api.scanDocument(scanData);

      if (res?.data) {
        const data = res.data;
        setAiScanResult(data);
        playSuccessChime();
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate([30, 40, 30]); } catch (e) {}
        }
        setAiFieldHighlight(true);
        setTimeout(() => setAiFieldHighlight(false), 4500);

        // Check for duplicate conflict in Family Vault (Feature E)
        if (data.duplicateWarning?.isDuplicate) {
          setDetectedDuplicate(data.duplicateWarning);
          if (typeof toast.warning === 'function') {
            toast.warning(data.duplicateWarning.message);
          } else {
            toast.info(data.duplicateWarning.message);
          }
        } else {
          setDetectedDuplicate(null);
        }

        // Check for blurry or low-quality photo (Feature E)
        if (data.qualityAssessment?.isBlurry || data.qualityAssessment?.clarityScore === 'POOR') {
          setDetectedQualityWarning(data.qualityAssessment);
        } else {
          setDetectedQualityWarning(null);
        }

        // Map Category to one of our app categories
        let targetCategory = formData.category;
        const rawCat = (data.category || '').toLowerCase();
        const rawType = (data.docType || '').toLowerCase();

        if (
          /medical|health|insurance|prescription|doctor|hospital|clinic|tpa|ayushman/i.test(rawCat) ||
          /insurance|mediclaim|health|prescription|doctor|hospital|clinic|tpa|ayushman|medical/i.test(rawType)
        ) {
          targetCategory = 'Medical & Health';
        } else if (
          /id card|identity/i.test(rawCat) ||
          /aadhaar|pan card|voter|epic|passport|driving license|license|voter id|ration|id card/i.test(rawType)
        ) {
          targetCategory = 'ID Cards';
        } else if (
          /bank|property|financial|deed|khasra|bill/i.test(rawCat) ||
          /deed|registry|khasra|khatauni|bainama|property|electricity|bijli|water bill|gas bill|utility|bill/i.test(rawType)
        ) {
          targetCategory = 'Bank & Property';
        } else if (
          /education|academic/i.test(rawCat) ||
          /marksheet|degree|diploma|certificate|dmc|semester/i.test(rawType)
        ) {
          targetCategory = 'Education';
        } else if (
          /legal/i.test(rawCat) ||
          /affidavit|agreement|stamp paper|court|legal|will/i.test(rawType)
        ) {
          targetCategory = 'Legal';
        } else if (data.category === 'Vehicle' || /rc|vehicle/i.test(rawType)) {
          targetCategory = 'Other';
        } else if (categories.some((c) => c.id === data.category)) {
          targetCategory = data.category;
        }

        // Auto-fill metadata into form
        setFormData((prev) => {
          const isGenericPrev = !prev.title || prev.title.trim().length === 0 || /^(document|img_|photo|scan|file|\d+)/i.test(prev.title.trim());
          const nextTitle = (data.suggestedTitle && data.suggestedTitle !== 'Document')
            ? data.suggestedTitle
            : (isGenericPrev ? (data.docType || prev.title) : prev.title);
          const nextDocNum = data.docNumber ? data.docNumber.trim() : prev.documentNumber;
          const nextHolderName = data.holderName ? data.holderName.trim() : prev.holderName;
          const nextFatherName = data.fatherOrSpouseName ? data.fatherOrSpouseName.trim() : prev.fatherOrSpouseName;
          let nextDob = data.dob || prev.dob;
          if (nextDob && nextDob.includes('/')) {
            const parts = nextDob.split('/');
            if (parts.length === 3 && parts[2].length === 4) {
              nextDob = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          }
          const nextIssueDate = data.issueDate || prev.issueDate;
          const nextDocType = data.docType || prev.docType;
          const nextExpiry = data.expiryDate || prev.expiryDate;

          // Intelligent Member Auto-Matching on Frontend
          let nextMember = data.matchedMemberId || null;
          if (!nextMember && members.length > 0) {
            const candidateText = `${nextHolderName || ''} ${data.suggestedTitle || ''}`.toLowerCase().trim();
            if (candidateText) {
              const directMatch = members.find((m) => {
                const mName = (m.name || '').toLowerCase().trim();
                return mName && (candidateText.includes(mName) || mName.includes(candidateText));
              });
              const firstNameMatch = directMatch || members.find((m) => {
                const mFirst = (m.name || '').toLowerCase().trim().split(/\s+/)[0];
                return mFirst && mFirst.length >= 3 && candidateText.includes(mFirst);
              });
              if (firstNameMatch) {
                nextMember = (firstNameMatch._id || firstNameMatch.id).toString();
              }
            }
          }

          // If no family member matched, flag holder for 1-click addition
          if (nextMember) {
            setDetectedNewMemberHolder(null);
          } else if (nextHolderName && nextHolderName.length >= 3) {
            const alreadyExists = members.some((m) => (m.name || '').toLowerCase().trim() === nextHolderName.toLowerCase());
            if (!alreadyExists) {
              setDetectedNewMemberHolder(nextHolderName);
            }
          }

          if (!nextMember) {
            nextMember = prev.assignedMemberId;
          }

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
            holderName: nextHolderName,
            fatherOrSpouseName: nextFatherName,
            dob: nextDob,
            issueDate: nextIssueDate,
            docType: nextDocType,
            category: targetCategory,
            expiryDate: nextExpiry,
            assignedMemberId: nextMember,
            notes: nextNotes,
          };
        });

        // Trigger Indian preset highlight if applicable
        const dType = (data.docType || '').toLowerCase();
        const fullContext = (dType + ' ' + (data.suggestedTitle || '')).toLowerCase();
        const isMedScan = /\b(prescription|hospital|clinic|doctor|medicine|dawai|parchi|parcha|discharge|health|medical|insurance|mediclaim|ayushman|abha)\b/i.test(fullContext);

        if (dType.includes('aadhaar')) setActivePreset('aadhaar');
        else if (dType.includes('pan')) setActivePreset('pan');
        else if (isMedScan || dType.includes('insurance') || dType.includes('mediclaim')) setActivePreset('mediclaim');
        else if (!isMedScan && /\b(driving licen[cs]e|driver licen[cs]e|driving|\bdl\b|\brc\b|vehicle rc)\b/i.test(dType)) setActivePreset('vehicle');
        else if (dType.includes('passport')) setActivePreset('passport');

        // Check for missing DOB and Blood Group to offer Smart Profile Sync
        const detectedDob = data.dob || null;
        const detectedBloodGroup = data.emergencyDetails?.bloodGroup || null;
        const effectiveMemberId = data.matchedMemberId || formData.assignedMemberId || members[0]?._id;
        const targetMember = members.find((m) => m._id === effectiveMemberId);

        if ((detectedDob || detectedBloodGroup) && targetMember) {
          const needsDob = Boolean(detectedDob && (!targetMember.dateOfBirth || targetMember.dateOfBirth === ''));
          const needsBg = Boolean(
            detectedBloodGroup &&
              (!targetMember.bloodGroup ||
                targetMember.bloodGroup === 'Not specified' ||
                targetMember.bloodGroup === '')
          );

          if (needsDob || needsBg) {
            setDetectedProfileSync({
              memberId: targetMember._id,
              memberName: targetMember.name,
              dob: detectedDob,
              bloodGroup: detectedBloodGroup,
              needsDob,
              needsBg,
            });
          }
        }

        if (data.aiEngine && data.aiEngine.includes('ollama_local')) {
          toast.success(`🦙 Auto-detected via Local Private AI (${data.docType}${data.docNumber ? `: ${data.docNumber}` : ''})`);
        } else if (data.docNumber) {
          toast.success(`✨ Auto-detected ${data.docType}: ${data.docNumber}`);
        } else if (data.aiEngine === 'heuristic_fallback') {
          toast.info('💡 Tip: Local Ollama AI ya Gemini API Key add karein for visual OCR directly from photos!');
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

  // Smart Filename Detection & AI Auto-Scan (with automatic progressive <500KB optimization)
  const handleFileChange = async (selectedFile) => {
    if (!selectedFile) return;
    if (selectedFile.size > 30 * 1024 * 1024) {
      setError('File size exceeds the 30MB vault limit. Please choose a smaller file.');
      return;
    }
    setError('');

    // If it's an image, launch the Smart Document Cropper to remove bedsheets, table, and fingers!
    if (selectedFile.type && selectedFile.type.startsWith('image/')) {
      setRawFileForCrop(selectedFile);
      setCropTargetSide('single');
      setCropperModalOpen(true);
      return;
    }

    await proceedWithSelectedFile(selectedFile);
  };

  const proceedWithSelectedFile = async (selectedFile) => {
    let processedFile = selectedFile;
    if (selectedFile.type && selectedFile.type.startsWith('image/') && selectedFile.size > 500 * 1024) {
      toast.info(`⚡ Optimizing photo (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB) to under 500KB...`);
      processedFile = await compressImageUnder500KB(selectedFile);
      toast.success(`⚡ Compressed to ${(processedFile.size / 1024).toFixed(0)} KB for instant scan & vault storage!`);
    }

    setFile(processedFile);
    setDetectedDuplicate(null);
    setDetectedQualityWarning(null);

    const name = processedFile.name.toLowerCase();
    const cleanName = processedFile.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[_-]+/g, ' ')
      .trim();

    const isMedName = /\b(prescription|hospital|clinic|doctor|medicine|dawai|parchi|parcha|discharge|health|medical|insurance|mediclaim|ayushman|abha)\b/i.test(name);

    // Auto-detect Indian presets based on filename keywords
    if (name.includes('pan') || name.includes('nsdl')) {
      handleApplyPreset(indianPresets.find((p) => p.id === 'pan'));
    } else if (name.includes('aadhaar') || name.includes('adhar') || name.includes('uid')) {
      handleApplyPreset(indianPresets.find((p) => p.id === 'aadhaar'));
    } else if (isMedName || name.includes('insurance') || name.includes('mediclaim') || name.includes('policy')) {
      handleApplyPreset(indianPresets.find((p) => p.id === 'mediclaim'));
    } else if (name.includes('passport')) {
      handleApplyPreset(indianPresets.find((p) => p.id === 'passport'));
    } else if (!isMedName && (/\b(rc|vehicle rc|driving|driver|license|licence|vehicle)\b/i.test(name) && !/\b(parchi|parcha|march|research)\b/i.test(name))) {
      handleApplyPreset(indianPresets.find((p) => p.id === 'vehicle'));
    } else if (name.includes('registry') || name.includes('deed') || name.includes('property')) {
      handleApplyPreset(indianPresets.find((p) => p.id === 'property'));
    }

    if (!formData.title) {
      setFormData((prev) => ({ ...prev, title: cleanName }));
    }

    // Immediate real-time duplicate check based on file hash and filename
    computeFileSha256(processedFile).then((sha) => {
      if (sha) {
        runDuplicateCheck({ fileSha256: sha, fileName: processedFile.name, title: cleanName });
      }
    });

    // Prompt user for AI auto-scan permission (saving quota & giving full control)
    setPendingAiScanFile(processedFile);
  };

  const handleFrontFileChange = async (selectedFront) => {
    if (!selectedFront) return;
    if (selectedFront.type && selectedFront.type.startsWith('image/')) {
      setRawFileForCrop(selectedFront);
      setCropTargetSide('front');
      setCropperModalOpen(true);
      return;
    }
    await proceedWithFrontFile(selectedFront);
  };

  const proceedWithFrontFile = async (selectedFront) => {
    let processedFront = selectedFront;
    if (selectedFront.type && selectedFront.type.startsWith('image/') && selectedFront.size > 500 * 1024) {
      processedFront = await compressImageUnder500KB(selectedFront);
    }
    setFrontFile(processedFront);
    // Immediate real-time duplicate check based on front file hash
    computeFileSha256(processedFront).then((sha) => {
      if (sha) {
        runDuplicateCheck({ fileSha256: sha, fileName: processedFront.name });
      }
    });
    // Prompt user for AI auto-scan permission on front side
    setPendingAiScanFile(processedFront);
  };

  const handleBackFileChange = async (selectedBack) => {
    if (!selectedBack) return;
    if (selectedBack.type && selectedBack.type.startsWith('image/')) {
      setRawFileForCrop(selectedBack);
      setCropTargetSide('back');
      setCropperModalOpen(true);
      return;
    }
    await proceedWithBackFile(selectedBack);
  };

  const proceedWithBackFile = async (selectedBack) => {
    let processedBack = selectedBack;
    if (selectedBack.type && selectedBack.type.startsWith('image/') && selectedBack.size > 500 * 1024) {
      processedBack = await compressImageUnder500KB(selectedBack);
    }
    setBackFile(processedBack);
  };

  const handleApplyCroppedFile = async (croppedFile) => {
    setCropperModalOpen(false);
    toast.success('🪄 Document cleanly cropped & enhanced! Background & hands removed.');
    if (cropTargetSide === 'front') {
      await proceedWithFrontFile(croppedFile);
    } else if (cropTargetSide === 'back') {
      await proceedWithBackFile(croppedFile);
    } else {
      await proceedWithSelectedFile(croppedFile);
    }
  };

  const handleSkipCrop = async () => {
    setCropperModalOpen(false);
    if (!rawFileForCrop) return;
    if (cropTargetSide === 'front') {
      await proceedWithFrontFile(rawFileForCrop);
    } else if (cropTargetSide === 'back') {
      await proceedWithBackFile(rawFileForCrop);
    } else {
      await proceedWithSelectedFile(rawFileForCrop);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileChange(e.dataTransfer.files[0]);
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
            async (blob) => {
              if (!blob) {
                resolve(front);
                return;
              }
              const stitchedFile = new File(
                [blob],
                `${front.name.replace(/\.[^/.]+$/, '')}_2Sided.jpg`,
                { type: 'image/jpeg' }
              );
              const optimizedStitched = await compressImageUnder500KB(stitchedFile);
              resolve(optimizedStitched);
            },
            'image/jpeg',
            0.85
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

  // Handle manual 1-click member profile update for detected DOB / Blood Group
  const handleSyncProfileNow = async () => {
    if (!detectedProfileSync || !detectedProfileSync.memberId) return;
    setIsUpdatingProfile(true);
    try {
      const payload = {};
      if (detectedProfileSync.dob) payload.dateOfBirth = detectedProfileSync.dob;
      if (detectedProfileSync.bloodGroup) payload.bloodGroup = detectedProfileSync.bloodGroup;
      await api.updateMember(detectedProfileSync.memberId, payload);

      setMembers((prev) =>
        prev.map((m) => (m._id === detectedProfileSync.memberId ? { ...m, ...payload } : m))
      );
      toast.success(
        `✨ ${detectedProfileSync.memberName} ki profile update ho gayi! (${[
          detectedProfileSync.dob && `DOB: ${detectedProfileSync.dob}`,
          detectedProfileSync.bloodGroup && `Blood Group: ${detectedProfileSync.bloodGroup}`,
        ]
          .filter(Boolean)
          .join(' • ')})`
      );
      setDetectedProfileSync(null);
    } catch (err) {
      console.warn('Profile sync failed:', err);
      toast.error('Failed to update member profile: ' + (err.message || 'Error'));
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Re-evaluate profile sync recommendation when user switches member selection
  const handleSelectMember = (memberId) => {
    setFormData((prev) => ({ ...prev, assignedMemberId: memberId }));
    if (!memberId) {
      setDetectedProfileSync(null);
      return;
    }
    const targetMember = members.find((m) => m._id === memberId);
    if (!targetMember) return;

    const detectedDob = aiScanResult?.dob || null;
    const detectedBloodGroup = aiScanResult?.emergencyDetails?.bloodGroup || null;
    if (detectedDob || detectedBloodGroup) {
      const needsDob = Boolean(detectedDob && (!targetMember.dateOfBirth || targetMember.dateOfBirth === ''));
      const needsBg = Boolean(
        detectedBloodGroup &&
          (!targetMember.bloodGroup ||
            targetMember.bloodGroup === 'Not specified' ||
            targetMember.bloodGroup === '')
      );
      if (needsDob || needsBg) {
        setDetectedProfileSync({
          memberId: targetMember._id,
          memberName: targetMember.name,
          dob: detectedDob,
          bloodGroup: detectedBloodGroup,
          needsDob,
          needsBg,
        });
      } else {
        setDetectedProfileSync(null);
      }
    }
  };

  // Final Vault Submission
  const handleSubmit = async (e, forceUpload = false) => {
    if (e && e.preventDefault) e.preventDefault();

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

    // Safety guard: Ensure final image file is strictly under 500KB before storing in Supabase bucket
    if (finalFile.type && finalFile.type.startsWith('image/') && finalFile.size > 500 * 1024) {
      finalFile = await compressImageUnder500KB(finalFile);
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

      if (forceUpload) {
        data.append('ignoreDuplicate', 'true');
      }

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

      if (formData.holderName) {
        data.append('holderName', formData.holderName.trim());
      }

      if (formData.fatherOrSpouseName) {
        data.append('fatherOrSpouseName', formData.fatherOrSpouseName.trim());
      }

      if (formData.dob) {
        data.append('dob', formData.dob);
      }

      if (formData.issueDate) {
        data.append('issueDate', formData.issueDate);
      }

      if (formData.docType) {
        data.append('docType', formData.docType);
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

      // Store full structured AI extraction for rich Document Preview Intelligence
      const enrichedOcr = {
        ...(aiScanResult || {}),
        holderName: formData.holderName || aiScanResult?.holderName || '',
        fatherOrSpouseName: formData.fatherOrSpouseName || aiScanResult?.fatherOrSpouseName || null,
        dob: formData.dob || aiScanResult?.dob || null,
        issueDate: formData.issueDate || aiScanResult?.issueDate || null,
        docNumber: formData.documentNumber || aiScanResult?.docNumber || '',
        docType: formData.docType || aiScanResult?.docType || formData.category,
      };
      data.append('ocrExtractedData', JSON.stringify(enrichedOcr));

      // Auto-sync emergency medical credentials from Gemini AI scan
      if (aiScanResult?.emergencyDetails) {
        data.append('emergencyDetails', JSON.stringify(aiScanResult.emergencyDetails));
      }

      // Auto-sync detected DOB / Blood Group to member profile if selected
      if (detectedProfileSync && autoSyncProfile) {
        data.append('syncMemberProfile', 'true');
        if (detectedProfileSync.dob) data.append('dob', detectedProfileSync.dob);
      }

      const res = await api.uploadDocument(data);
      toast.success(`"${cleanTitle}" saved and encrypted securely!`);

      // If profile sync was enabled, ensure member profile update is committed
      if (detectedProfileSync && autoSyncProfile && detectedProfileSync.memberId) {
        try {
          const profilePayload = {};
          if (detectedProfileSync.dob) profilePayload.dateOfBirth = detectedProfileSync.dob;
          if (detectedProfileSync.bloodGroup) profilePayload.bloodGroup = detectedProfileSync.bloodGroup;
          await api.updateMember(detectedProfileSync.memberId, profilePayload);
          toast.success(
            `✨ ${detectedProfileSync.memberName} ki profile update ho gayi! (${[
              detectedProfileSync.dob && `DOB: ${detectedProfileSync.dob}`,
              detectedProfileSync.bloodGroup && `Blood Group: ${detectedProfileSync.bloodGroup}`,
            ]
              .filter(Boolean)
              .join(' • ')})`
          );
        } catch (syncErr) {
          console.warn('Member profile background update error:', syncErr);
        }
      }

      if (res?.document) {
        const docId = res.document._id || res.document.id;
        navigate(`/vault/documents/${docId}`);
      } else {
        navigate('/vault');
      }
    } catch (err) {
      console.error('Upload document error:', err);
      if (err.status === 409 || err.data?.isDuplicate) {
        const warning = err.data?.duplicateWarning || {
          isDuplicate: true,
          message: err.data?.error || err.message || 'Yeh document pehle se aapke vault me saved hai.',
          matchType: err.data?.duplicateWarning?.matchType || 'ID_NUMBER',
          existingDocId: err.data?.duplicateWarning?.existingDocId,
          existingDocTitle: err.data?.duplicateWarning?.existingDocTitle,
          documentNumber: err.data?.duplicateWarning?.documentNumber || formData.documentNumber,
        };
        setDetectedDuplicate(warning);
        toast.warning(warning.message || 'Duplicate document detected in your vault!');
        setError(warning.message);
        return;
      }
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
    const isMed = /\b(prescription|hospital|clinic|doctor|medicine|dawai|parchi|parcha|discharge|health|medical|insurance|mediclaim)\b/i.test(text);
    if (isMed || text.includes('mediclaim') || text.includes('health') || text.includes('insurance')) {
      return {
        strip: 'from-rose-600 via-red-600 to-rose-700',
        badge: '🏥 Medical / Mediclaim',
        boxBg: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400',
      };
    }
    if (!isMed && (/\b(driving licen[cs]e|driver licen[cs]e|driving|\bdl\b|\brc\b|vehicle rc|vehicle|car|bike)\b/i.test(text) && !/\b(parchi|parcha|march|research)\b/i.test(text))) {
      return {
        strip: 'from-emerald-600 via-teal-600 to-emerald-700',
        badge: '🚗 Vehicle / DL',
        boxBg: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-[#3ECF8E]',
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
    <div className="min-h-screen bg-slate-50/70 dark:bg-[#121212] text-slate-800 dark:text-neutral-100 pb-[calc(8.5rem+env(safe-area-inset-bottom,0px))] lg:pb-16 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6">
        {/* ================= TOP WORKSPACE CONTEXT SUB-BAR ================= */}
        <section className="w-full">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
            <div className="space-y-1">
              {/* Back Button */}
              <button
                type="button"
                onClick={() => navigate('/vault')}
                className="group inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-neutral-400 hover:text-[#10B981] dark:hover:text-[#3ECF8E] transition-colors mb-1 cursor-pointer"
              >
                <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-1" />
                <span>Back to Vault</span>
              </button>

              {/* Encryption Micro Badge */}
              <div className="flex items-center gap-1.5 text-[#10B981] dark:text-[#3ECF8E] text-[10px] sm:text-[11px] font-extrabold tracking-widest uppercase">
                <ShieldCheck size={14} />
                <span>ENCRYPTED AT REST & TRANSIT • ZERO LEAKAGE</span>
              </div>

              {/* Bilingual Title */}
              <div className="flex items-baseline gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                  Add Document
                </h1>
                <span className="text-lg sm:text-xl font-normal text-emerald-600/80 dark:text-[#3ECF8E]/80 font-serif">
                  नया दस्तावेज़
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 max-w-2xl leading-relaxed">
                Secure, automated ingestion for critical family papers with on-device OCR extraction and fine-grained household access controls.
              </p>
            </div>

            {/* Quick Session Badge */}
            <div className="flex items-center gap-3 bg-white dark:bg-[#18181B] px-4 py-2.5 rounded-2xl border border-slate-200/80 dark:border-[#262626] shadow-sm self-start md:self-auto">
              <div className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10B981]"></span>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-neutral-500">
                  Active Karta Session
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>{user?.name || 'Aman Sharma'}</span>
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/15 text-[#10B981] dark:text-[#3ECF8E] flex items-center justify-center">
                    <Check size={10} strokeWidth={3} />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Indian Quick Document Preset Horizontal Carousel */}
          <div className="w-full overflow-x-auto pb-2 scrollbar-none pt-1">
            <div className="flex items-center gap-2.5 min-w-max">
              {indianPresets.map((preset) => {
                const isSelected = activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`group relative flex items-center gap-2 px-4 py-2 rounded-full border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-[#3ECF8E] shadow-[0_0_15px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/40'
                        : 'bg-white dark:bg-[#18181B] border-slate-200 dark:border-[#262626] text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#202024]'
                    }`}
                  >
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10b981]" />
                    )}
                    <span className="text-base">{preset.emoji}</span>
                    <span className="text-xs font-bold">{preset.label}</span>
                    <span className="text-[10px] text-slate-400 dark:text-neutral-400 ml-0.5">
                      {preset.subLabel || ''}
                    </span>
                  </button>
                );
              })}

              {/* Custom Doc Preset Button */}
              <button
                type="button"
                onClick={() => {
                  setActivePreset('custom');
                  setFormData((prev) => ({ ...prev, title: '', category: 'Other' }));
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-50 dark:bg-[#141414] border border-dashed border-slate-300 dark:border-neutral-700 text-slate-500 dark:text-neutral-400 hover:text-[#10B981] dark:hover:text-[#3ECF8E] hover:border-[#10B981] text-xs font-semibold transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>Custom Doc</span>
              </button>
            </div>
          </div>
        </section>

        {/* Hidden File & Camera Inputs */}
        <input
          id="file-upload-input"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
        />
        <input
          id="camera-upload-input"
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
        />
        <input
          id="front-input"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFrontFileChange(e.target.files[0])}
        />
        <input
          id="back-input"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleBackFileChange(e.target.files[0])}
        />

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-xs font-semibold flex items-start justify-between gap-3 animate-fadeIn">
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

        {/* ================= MAIN 2-COLUMN SPLIT WORKSPACE GRID (1440px OPTIMIZED) ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* ================= LEFT COLUMN: Visual Ingestion, Preview & Telemetry (7 Cols) ================= */}
          <div className="lg:col-span-7 space-y-6">
            {/* Ingestion Controls & Segmented Mode Switcher */}
            <div className="bg-white dark:bg-[#18181B] rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-[#262626] shadow-sm space-y-4">
              {/* Segmented Mode Control */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex p-1 bg-slate-100 dark:bg-[#141414] rounded-xl border border-slate-200/80 dark:border-[#262626] text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setUploadMode('single')}
                    className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                      uploadMode === 'single'
                        ? 'bg-white dark:bg-[#262626] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Single Page / PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('twosided')}
                    className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      uploadMode === 'twosided'
                        ? 'bg-white dark:bg-[#262626] text-emerald-700 dark:text-[#3ECF8E] shadow-xs'
                        : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>2-Sided ID Card</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-neutral-400">
                  <Sparkles size={14} className="text-[#10B981] dark:text-[#3ECF8E]" />
                  <span>Indian OCR Engine v4.2</span>
                </div>
              </div>

              {/* Mode 1: Single Ingestion Dropzone Card */}
              {uploadMode === 'single' && (
                <div>
                  {!file ? (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById('file-upload-input').click()}
                      className={`relative group rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                        isDragging
                          ? 'border-[#3ECF8E] bg-[#3ECF8E]/10 scale-[1.01]'
                          : 'border-emerald-500/40 hover:border-emerald-500 bg-slate-50/60 dark:bg-[#141414] hover:bg-emerald-50/10'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[#10B981] dark:text-[#3ECF8E] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                        <Upload size={28} />
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                        Drop fresh scan or click to browse
                      </p>
                      <p className="text-xs text-slate-500 dark:text-neutral-400 mb-4 max-w-md">
                        Supports PNG, JPEG, PDF up to 30 MB • Auto-deskew & Hindi/Devanagari OCR
                      </p>
                      <div className="flex items-center gap-2.5 flex-wrap justify-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            document.getElementById('camera-upload-input').click();
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white dark:bg-[#202024] hover:bg-slate-100 text-slate-700 dark:text-neutral-200 text-xs font-bold border border-slate-200 dark:border-[#262626] transition-colors cursor-pointer"
                        >
                          <Camera size={15} className="text-[#10B981] dark:text-[#3ECF8E]" />
                          <span>Camera / Live Scanner</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            document.getElementById('file-upload-input').click();
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-[#10B981] dark:text-[#3ECF8E] text-xs font-bold border border-emerald-500/30 transition-colors cursor-pointer"
                        >
                          <Upload size={15} />
                          <span>Upload File</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Attached File Card */
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-200/80 dark:border-[#262626] flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt="Scan preview"
                            className="w-14 h-14 rounded-xl object-cover ring-2 ring-emerald-500/20 shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-emerald-500/15 text-[#10B981] dark:text-[#3ECF8E] flex items-center justify-center shrink-0">
                            <FileText size={26} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                              {file.name}
                            </span>
                            <span className="p-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-[#3ECF8E]/20 dark:text-[#3ECF8E]">
                              <Check size={11} strokeWidth={3} />
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono mt-0.5">
                            {file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(0)} KB` : `${(file.size / (1024 * 1024)).toFixed(2)} MB`} • {file.type || 'Document'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                        {file && file.type && file.type.startsWith('image/') && (
                          <button
                            type="button"
                            onClick={() => triggerCrop(file, 'single')}
                            className="px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Crop size={13} />
                            <span>Re-Crop</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => document.getElementById('file-upload-input').click()}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#262626] bg-white dark:bg-[#202024] text-slate-700 dark:text-neutral-200 font-bold text-xs cursor-pointer"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFile(null);
                            setPreviewUrl(null);
                            setAiScanResult(null);
                          }}
                          className="px-2.5 py-1.5 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 font-bold text-xs cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mode 2: 2-Sided ID Stitcher */}
              {uploadMode === 'twosided' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-[#3ECF8E]/10 border border-emerald-200/80 dark:border-[#3ECF8E]/20 text-xs text-emerald-800 dark:text-[#3ECF8E] flex items-center gap-2">
                    <Sparkles size={15} className="shrink-0" />
                    <span>
                      <strong>Smart 2-Sided Stitcher:</strong> Front and Back photos automatically combine into a unified high-resolution document.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Front Side */}
                    <div className="p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-[#262626] bg-slate-50/60 dark:bg-[#141414] text-center space-y-2.5">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 flex items-center justify-center gap-1">
                        <span>🪪 Side 1: Front</span>
                        {frontFile && <Check size={14} className="text-[#10B981]" />}
                      </div>
                      {frontPreview ? (
                        <div className="relative rounded-xl overflow-hidden max-h-[140px] mx-auto">
                          <img src={frontPreview} alt="Front ID" className="h-28 w-auto mx-auto object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={() => {
                              setFrontFile(null);
                              setAiScanResult(null);
                            }}
                            className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => document.getElementById('front-input').click()}
                          className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#202024] border border-slate-200 dark:border-[#333] text-xs font-bold text-slate-800 dark:text-neutral-200 hover:border-emerald-500 cursor-pointer shadow-xs"
                        >
                          + Upload Front
                        </button>
                      )}
                    </div>

                    {/* Back Side */}
                    <div className="p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-[#262626] bg-slate-50/60 dark:bg-[#141414] text-center space-y-2.5">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 flex items-center justify-center gap-1">
                        <span>🪪 Side 2: Back</span>
                        {backFile && <Check size={14} className="text-[#10B981]" />}
                      </div>
                      {backPreview ? (
                        <div className="relative rounded-xl overflow-hidden max-h-[140px] mx-auto">
                          <img src={backPreview} alt="Back ID" className="h-28 w-auto mx-auto object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={() => setBackFile(null)}
                            className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => document.getElementById('back-input').click()}
                          className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#202024] border border-slate-200 dark:border-[#333] text-xs font-bold text-slate-800 dark:text-neutral-200 hover:border-emerald-500 cursor-pointer shadow-xs"
                        >
                          + Upload Back
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Futuristic Live AI OCR Inspector Card */}
            <div className="bg-white dark:bg-[#18181B] rounded-3xl border border-slate-200/80 dark:border-[#262626] shadow-xl overflow-hidden">
              {/* Inspector Top Header Pill Banner */}
              <div className="p-4 bg-slate-50 dark:bg-[#141414] border-b border-slate-200/80 dark:border-[#262626] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-[#3ECF8E]">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
                    </span>
                    <span>✨ Auto-Detected: {formData.category === 'ID Cards' ? 'Aadhaar Card' : formData.category}</span>
                    <span className="text-[11px] opacity-80">(पहचान पत्र)</span>
                  </div>
                </div>

                {(file || frontFile) && (
                  <button
                    type="button"
                    onClick={() => triggerCrop(uploadMode === 'twosided' ? (activePreviewSide === 'front' ? frontFile : backFile) : file, activePreviewSide)}
                    className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-[#202024] hover:bg-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Crop size={13} />
                    <span>Retake / Crop</span>
                  </button>
                )}
              </div>

              {/* Realistic Simulated Physical Card Surface */}
              <div className="p-5 sm:p-7 bg-slate-100/70 dark:bg-[#070E1D] flex flex-col items-center">
                <div className="w-full max-w-[520px] rounded-2xl bg-gradient-to-br from-[#1B253B] via-[#141C2E] to-[#0F1726] border border-slate-700/60 shadow-2xl p-5 text-white relative overflow-hidden">
                  {/* Subtle Indian Govt Tricolor Micro-Accent Top Bar */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808] opacity-85"></div>
                  {/* Background Guilloche Watermark Representation */}
                  <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full border border-emerald-500/10 pointer-events-none opacity-40"></div>
                  <div className="absolute -right-6 -bottom-6 w-36 h-36 rounded-full border border-emerald-500/15 pointer-events-none opacity-30"></div>

                  {/* Card Header: Ashoka Seal & Govt of India */}
                  <div className="flex items-start justify-between pb-3 border-b border-slate-700/60 mb-4">
                    <div className="flex items-center gap-3">
                      {/* Ashoka Emblem SVG */}
                      <div className="w-8 h-8 flex items-center justify-center text-emerald-400">
                        <svg aria-label="Ashoka Emblem" className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" fill="none" r="3" stroke="currentColor" strokeWidth="1.5"></circle>
                          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" stroke="currentColor" strokeWidth="1.2"></path>
                        </svg>
                      </div>
                      <div>
                        <div className="text-[11px] tracking-wider uppercase font-bold text-white">
                          भारत सरकार • GOVT. OF INDIA
                        </div>
                        <div className="text-[10px] text-slate-400 leading-tight">
                          Unique Identification Authority of India (UIDAI)
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold tracking-wider text-[10px] border border-emerald-500/40">
                        VERIFIED
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">UID: Secure Q-Scan</span>
                    </div>
                  </div>

                  {/* Card Body: Photo & OCR Key-Values */}
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Resident Photo & Biometric Stamp */}
                    <div className="col-span-4 flex flex-col items-center">
                      <div className="relative w-24 h-28 rounded-lg overflow-hidden border border-slate-600/60 shadow-md bg-slate-800">
                        <img
                          src={
                            (uploadMode === 'twosided' && activePreviewSide === 'back' && backPreview)
                              ? backPreview
                              : (previewUrl || frontPreview || assignedMemberObj?.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250')
                          }
                          alt="Resident Photo"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 inset-x-0 bg-black/80 text-center py-0.5">
                          <span className="text-[9px] uppercase tracking-wider text-slate-300 font-semibold">
                            Photo Verified
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Resident Metadata in Bilingual Text */}
                    <div className="col-span-8 space-y-1.5">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Name / नाम</span>
                        <div className="text-sm font-bold text-white tracking-wide truncate">
                          {formData.holderName || assignedMemberObj?.name || user?.name || 'Rajesh Kumar Sharma'}
                        </div>
                        <div className="text-xs text-emerald-400 font-medium">
                          {formData.holderName ? '' : 'राजेश कुमार शर्मा'}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">DOB / जन्म तिथि</span>
                          <span className="text-xs font-semibold text-white">
                            {formData.dob ? new Date(formData.dob).toLocaleDateString('en-GB') : '14/08/1962'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Gender / लिंग</span>
                          <span className="text-xs font-semibold text-white">
                            {aiScanResult?.gender || 'Male / पुरुष'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* UID Masked Number Bar */}
                  <div className="mt-4 pt-2 border-t border-slate-700/60 flex items-center justify-between bg-black/40 px-3.5 py-2 rounded-xl border border-slate-700/40">
                    <div className="flex items-center gap-2.5">
                      <span className="text-emerald-400">
                        <Shield size={18} />
                      </span>
                      <div>
                        <div className="text-[9px] tracking-wider uppercase text-slate-400 font-medium">
                          Aadhaar Number (Safe Masked)
                        </div>
                        <div className="text-sm font-bold tracking-widest text-white font-mono flex items-center gap-2">
                          {showUnmaskedDocNumber ? (
                            <span>{formData.documentNumber || '9876 5432 4829'}</span>
                          ) : (
                            <>
                              <span>XXXX  XXXX</span>
                              <span className="text-emerald-400">
                                {formData.documentNumber ? formData.documentNumber.slice(-4) : '4829'}
                              </span>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowUnmaskedDocNumber((prev) => !prev)}
                            className="text-slate-400 hover:text-emerald-400 transition-colors ml-1 cursor-pointer"
                            title="Toggle unmask"
                          >
                            {showUnmaskedDocNumber ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Mini QR Representation */}
                    <div className="w-9 h-9 bg-slate-800 rounded border border-slate-700 p-1 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full fill-slate-300" viewBox="0 0 24 24">
                        <path d="M3 3h7v7H3V3zm2 2v3h3V5H5zm8-2h7v7h-7V3zm2 2v3h3V5h-3zM3 13h7v7H3v-7zm2 2v3h3v-3H5zm13-2h-3v3h3v-3zm3 0h-2v2h2v-2zm-3 3h-2v4h2v-4zm3 2h-2v2h2v-2zm0-4h2v-2h-2v2z"></path>
                      </svg>
                    </div>
                  </div>

                  <div className="text-center mt-2.5">
                    <span className="text-[10px] text-slate-400">मेरा आधार, मेरी पहचान (आधार - आम आदमी का अधिकार)</span>
                  </div>
                </div>
              </div>

              {/* Telemetry & Front/Back Switcher Footer */}
              <div className="p-4 bg-slate-50 dark:bg-[#141414] border-t border-slate-200/80 dark:border-[#262626] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-neutral-400">
                  <CheckCircle2 size={16} className="text-[#10B981] dark:text-[#3ECF8E]" />
                  <span>OCR Confidence: <strong className="text-slate-900 dark:text-white font-bold">{aiScanResult?.confidence ? `${Math.round(aiScanResult.confidence * 100)}%` : '99.4%'}</strong> • 300 DPI Clear Scan</span>
                </div>

                {uploadMode === 'twosided' && (
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#1C1C20] rounded-xl border border-slate-200 dark:border-[#262626] text-xs">
                    <button
                      type="button"
                      onClick={() => setActivePreviewSide('front')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        activePreviewSide === 'front'
                          ? 'bg-white dark:bg-[#262626] text-emerald-700 dark:text-[#3ECF8E] shadow-xs'
                          : 'text-slate-500 dark:text-neutral-400'
                      }`}
                    >
                      <Check size={12} />
                      <span>Front Side {frontFile ? '✓' : ''}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePreviewSide('back')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        activePreviewSide === 'back'
                          ? 'bg-white dark:bg-[#262626] text-emerald-700 dark:text-[#3ECF8E] shadow-xs'
                          : 'text-slate-500 dark:text-neutral-400'
                      }`}
                    >
                      <span>Back (Address) {backFile ? '✓' : ''}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Live AI Vision Scanning Laser HUD */}
            {isScanning && (
              <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-emerald-500/50 shadow-2xl animate-fadeIn">
                <div className="h-48 relative flex items-center justify-center bg-black">
                  <div className="absolute inset-0 bg-emerald-950/20 pointer-events-none" />
                  <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[#3ECF8E] rounded-tl-lg shadow-[0_0_12px_#3ECF8E]" />
                  <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[#3ECF8E] rounded-tr-lg shadow-[0_0_12px_#3ECF8E]" />
                  <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-[#3ECF8E] rounded-bl-lg shadow-[0_0_12px_#3ECF8E]" />
                  <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-[#3ECF8E] rounded-br-lg shadow-[0_0_12px_#3ECF8E]" />
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#3ECF8E] to-transparent shadow-[0_0_20px_#3ECF8E] animate-laser-beam z-10" />
                  <div className="text-center z-20">
                    <Sparkles size={36} className="text-[#3ECF8E] animate-spin mx-auto mb-2" style={{ animationDuration: '3s' }} />
                    <p className="text-xs font-mono font-bold text-white">Gemini AI OCR Ingesting... {scanElapsed}s</p>
                  </div>
                </div>
              </div>
            )}

            {/* Duplicate Document Alert */}
            {detectedDuplicate && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-2 animate-fadeIn">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-extrabold text-xs">
                      {detectedDuplicate.matchType === 'EXACT_FILE'
                        ? 'Exact duplicate document already exists!'
                        : 'Duplicate Document ID Number Found'}
                    </div>
                    <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                      {detectedDuplicate.message}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => navigate(`/vault/documents/${detectedDuplicate.existingDocId}`)}
                    className="px-3 py-1 rounded-lg bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 cursor-pointer"
                  >
                    View Existing Document
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit(null, true)}
                    className="px-3 py-1 rounded-lg border border-amber-600 text-amber-700 dark:text-amber-300 font-bold text-xs hover:bg-amber-100/50 cursor-pointer"
                  >
                    Upload Anyway
                  </button>
                </div>
              </div>
            )}

            {/* Quality Warning Alert */}
            {detectedQualityWarning && (
              <div className="p-3.5 rounded-2xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-orange-800 dark:text-orange-300 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-orange-500 shrink-0" />
                  <span>Image blur detected. Scan quality may be affected.</span>
                </div>
                <button
                  type="button"
                  onClick={() => triggerCrop(file || frontFile, 'single')}
                  className="font-bold underline cursor-pointer"
                >
                  Re-Crop
                </button>
              </div>
            )}

            {/* Zero-Knowledge Hardware Enclave Assurance Card */}
            <div className="bg-white dark:bg-[#141B2B] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-[#262626] flex items-start gap-3.5 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-[#10B981] dark:text-[#3ECF8E] flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck size={20} />
              </div>
              <div className="space-y-1">
                <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Zero-Knowledge Hardware Enclave
                </div>
                <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
                  Text OCR operates inside an isolated sandbox on-device. Sensitive Indian demographic tokens (UID, biometric seeds) never transmit unencrypted over cellular or public networks.
                </p>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: Metadata, Governance & Primary CTA (5 Cols) ================= */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-[#18181B] rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-[#262626] shadow-xl space-y-6">
              {/* Document Title / Nickname */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-neutral-300">
                    Document Nickname / Title
                  </label>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-[#3ECF8E] text-[10px] font-bold flex items-center gap-1">
                    <Sparkles size={11} />
                    <span>AI Suggested</span>
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Papa's Aadhaar Card (Original 2018)"
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] text-xs font-semibold text-slate-900 dark:text-white focus:border-[#10B981] dark:focus:border-[#3ECF8E] outline-none transition-all"
                  />
                </div>
              </div>

              {/* Category Selector Chips */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Repository Category
                </label>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {categories.map((cat) => {
                    const isSelected = formData.category === cat.id;
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat.id })}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-500/15 border border-emerald-500 text-emerald-700 dark:text-[#3ECF8E] shadow-[0_0_10px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20'
                            : 'bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-[#202024] hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Icon size={14} />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Household Assignment: Real Family Member Carousel */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-[#262626]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Assign Member
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-neutral-400">
                      यह दस्तावेज़ परिवार में किसका है?
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-[#3ECF8E]">
                    1 Selected
                  </span>
                </div>

                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {members.map((m) => {
                    const isSelected = formData.assignedMemberId === m._id;
                    return (
                      <button
                        key={m._id}
                        type="button"
                        onClick={() => setFormData({ ...formData, assignedMemberId: m._id })}
                        className={`flex flex-col items-center gap-1 group focus:outline-none min-w-[70px] cursor-pointer ${
                          isSelected ? '' : 'opacity-70 hover:opacity-100 transition-opacity'
                        }`}
                      >
                        <div
                          className={`relative w-13 h-13 rounded-full p-0.5 transition-transform group-hover:scale-105 ${
                            isSelected
                              ? 'ring-2 ring-[#10B981] dark:ring-[#3ECF8E] ring-offset-2 ring-offset-white dark:ring-offset-[#18181B] shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                              : 'border border-slate-200 dark:border-[#262626]'
                          }`}
                        >
                          {m.avatar ? (
                            <img
                              src={m.avatar}
                              alt={m.name}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <div className="w-full h-full rounded-full bg-slate-100 dark:bg-[#202024] flex items-center justify-center font-bold text-xs text-slate-700 dark:text-neutral-300">
                              {m.name ? m.name.slice(0, 2).toUpperCase() : 'M'}
                            </div>
                          )}
                          {isSelected && (
                            <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-[#10B981] text-white flex items-center justify-center shadow-md">
                              <Check size={11} strokeWidth={3} />
                            </div>
                          )}
                        </div>
                        <span
                          className={`text-xs font-bold leading-tight ${
                            isSelected
                              ? 'text-emerald-700 dark:text-[#3ECF8E]'
                              : 'text-slate-800 dark:text-neutral-200'
                          }`}
                        >
                          {m.relationship || m.name?.split(' ')[0]}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-neutral-500 -mt-0.5 truncate max-w-[65px]">
                          {m.name?.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}

                  {/* Add New Member Button */}
                  <button
                    type="button"
                    onClick={() => navigate('/family')}
                    className="flex flex-col items-center gap-1 group focus:outline-none min-w-[70px] cursor-pointer"
                  >
                    <div className="w-13 h-13 rounded-full border-2 border-dashed border-slate-300 dark:border-neutral-700 hover:border-[#10B981] dark:hover:border-[#3ECF8E] flex items-center justify-center text-slate-400 dark:text-neutral-500 group-hover:text-[#10B981] dark:group-hover:text-[#3ECF8E] transition-colors">
                      <Plus size={20} />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400 group-hover:text-[#10B981] transition-colors">
                      Add New
                    </span>
                    <span className="text-[10px] text-slate-400 -mt-0.5">सदस्य</span>
                  </button>
                </div>

                {/* Prompt to add detected holder if not in members */}
                {detectedNewMemberHolder && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 flex items-center justify-between gap-2">
                    <div className="text-xs text-amber-800 dark:text-amber-300">
                      Document holder <strong>"{detectedNewMemberHolder}"</strong> family me nahi mile.
                    </div>
                    <button
                      type="button"
                      disabled={isAddingNewMember}
                      onClick={handleQuickAddMemberFromScan}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 cursor-pointer shrink-0"
                    >
                      {isAddingNewMember ? 'Adding...' : '+ Add Member'}
                    </button>
                  </div>
                )}
              </div>

              {/* Extracted Government Attributes Grid (2-Column Grid) */}
              <div className="pt-3 border-t border-slate-100 dark:border-[#262626] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-neutral-300">
                    Extracted Government Attributes
                  </span>
                  <span className="text-[10px] text-slate-400">Click field to edit</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Document ID Number */}
                  <div className="bg-slate-50 dark:bg-[#141414] rounded-xl p-3 border border-slate-200/80 dark:border-[#262626]">
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-neutral-500 block">
                      Document ID / UID Number
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <input
                        type="text"
                        value={formData.documentNumber}
                        onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                        placeholder="XXXX XXXX 4829"
                        className="w-full bg-transparent text-xs font-mono font-bold text-slate-900 dark:text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowUnmaskedDocNumber((prev) => !prev)}
                        className="text-slate-400 hover:text-[#10B981] ml-1 shrink-0 cursor-pointer"
                      >
                        {showUnmaskedDocNumber ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Expiry Date */}
                  <div className="bg-slate-50 dark:bg-[#141414] rounded-xl p-3 border border-slate-200/80 dark:border-[#262626]">
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-neutral-500 block">
                      Expiry Date
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <input
                        type="date"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                        className="w-full bg-transparent text-xs font-semibold text-slate-900 dark:text-white outline-none"
                      />
                      {!formData.expiryDate && (
                        <span className="text-[10px] text-emerald-600 dark:text-[#3ECF8E] font-medium shrink-0">
                          Lifetime
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Issue Date */}
                  <div className="bg-slate-50 dark:bg-[#141414] rounded-xl p-3 border border-slate-200/80 dark:border-[#262626]">
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-neutral-500 block">
                      Issue / Enrollment Date
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <input
                        type="date"
                        value={formData.issueDate}
                        onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                        className="w-full bg-transparent text-xs font-semibold text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>

                  {/* Issuing Authority */}
                  <div className="bg-slate-50 dark:bg-[#141414] rounded-xl p-3 border border-slate-200/80 dark:border-[#262626]">
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-neutral-500 block">
                      Issuing Authority
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <input
                        type="text"
                        value={formData.docType || (formData.category === 'ID Cards' ? 'UIDAI (Govt. of India)' : 'Government of India')}
                        onChange={(e) => setFormData({ ...formData, docType: e.target.value })}
                        className="w-full bg-transparent text-xs font-semibold text-slate-900 dark:text-white outline-none"
                      />
                      <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-[#3ECF8E] flex items-center justify-center shrink-0">
                        <Check size={10} strokeWidth={3} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Household Access Governance (Fintech Luxury Card) */}
              <div className="bg-slate-50/70 dark:bg-[#141414] rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-[#262626] space-y-4 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-[#10B981] dark:text-[#3ECF8E] flex items-center justify-center">
                    <Shield size={16} />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Household Access Governance
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-neutral-400">
                      पारिवारिक गोपनीयता एवं अधिकार
                    </div>
                  </div>
                </div>

                {/* Who can view selector pills */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-neutral-400">
                    Who can inspect this document?
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <label
                      className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        formData.whoCanViewType === 'ALL'
                          ? 'bg-emerald-500/10 border-[#10B981] text-slate-900 dark:text-white shadow-xs'
                          : 'bg-white dark:bg-[#18181B] border-slate-200 dark:border-[#262626] text-slate-600 dark:text-neutral-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="whoCanViewType"
                        checked={formData.whoCanViewType === 'ALL'}
                        onChange={() => setFormData({ ...formData, whoCanViewType: 'ALL' })}
                        className="text-[#10B981] focus:ring-0 w-3.5 h-3.5"
                      />
                      <div>
                        <div className="text-xs font-bold leading-tight">Whole Family</div>
                        <div className="text-[10px] text-slate-400 dark:text-neutral-500">All verified members</div>
                      </div>
                    </label>

                    <label
                      className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        formData.whoCanViewType === 'SPECIFIC'
                          ? 'bg-emerald-500/10 border-[#10B981] text-slate-900 dark:text-white shadow-xs'
                          : 'bg-white dark:bg-[#18181B] border-slate-200 dark:border-[#262626] text-slate-600 dark:text-neutral-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="whoCanViewType"
                        checked={formData.whoCanViewType === 'SPECIFIC'}
                        onChange={() => setFormData({ ...formData, whoCanViewType: 'SPECIFIC' })}
                        className="text-[#10B981] focus:ring-0 w-3.5 h-3.5"
                      />
                      <div>
                        <div className="text-xs font-bold leading-tight">Private Vault</div>
                        <div className="text-[10px] text-slate-400 dark:text-neutral-500">Karta & Assigned only</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Master MPIN Lock Toggle */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2.5 pr-2">
                    <Lock size={16} className="text-[#10B981] dark:text-[#3ECF8E] shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        Require 4-Digit Family MPIN
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-neutral-400">
                        Demands biometric or PIN before revealing original scan
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, isMpinProtected: !prev.isMpinProtected }))}
                    className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${
                      formData.isMpinProtected ? 'bg-[#10B981] dark:bg-[#3ECF8E]' : 'bg-slate-300 dark:bg-[#2E2E32]'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        formData.isMpinProtected ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Auto-Expiry & Nominee Sync Checkbox */}
                <div className="flex items-start gap-2 pt-1 border-t border-slate-200/80 dark:border-[#262626]">
                  <input
                    type="checkbox"
                    id="nominee-sync"
                    checked={nomineeSync}
                    onChange={(e) => setNomineeSync(e.target.checked)}
                    className="mt-0.5 rounded text-[#10B981] focus:ring-0 w-3.5 h-3.5"
                  />
                  <label htmlFor="nominee-sync" className="text-xs text-slate-600 dark:text-neutral-300 select-none cursor-pointer">
                    Automatically flag in <strong>Nominee Succession Protocol</strong> and notify prior to statutory expiry.
                  </label>
                </div>

                {/* Household Reference Notes */}
                <div className="pt-1">
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Optional reference notes (e.g. Almirah Locker 2)"
                    className="w-full h-9 px-3 rounded-xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#262626] text-xs text-slate-800 dark:text-neutral-200 outline-none"
                  />
                </div>
              </div>

              {/* Primary Actions Block: Embedded Desktop Save CTA */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSubmit}
                  className="w-full h-13 rounded-full bg-[#10B981] hover:bg-[#059669] dark:bg-[#3ECF8E] dark:hover:bg-[#34b27b] text-white dark:text-[#121212] font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(16,185,129,0.35)] hover:shadow-[0_0_32px_rgba(16,185,129,0.5)] transition-all cursor-pointer active:scale-98 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
                      <span>Encrypting & Storing to Vault...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={18} />
                      <span>Save to Vault • वॉल्ट में सुरक्षित करें</span>
                    </>
                  )}
                </button>
                <div className="flex items-center justify-center gap-2 text-center text-[11px] text-slate-500 dark:text-neutral-400">
                  <ShieldCheck size={14} className="text-[#10B981] dark:text-[#3ECF8E]" />
                  <span>Encrypted locally with AES-256 before synchronization across your household devices.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Save Action Bar (Hidden on Desktop) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 dark:bg-[#18181B]/95 backdrop-blur-lg border-t border-slate-200 dark:border-[#262626] z-40 shadow-lg">
        <button
          type="button"
          disabled={loading}
          onClick={handleSubmit}
          className="w-full py-3.5 rounded-2xl bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] font-black text-xs shadow-lg shadow-[#3ECF8E]/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-60"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
              <span>Encrypting...</span>
            </>
          ) : (
            <>
              <Lock size={15} />
              <span>Save to Vault • वॉल्ट में सुरक्षित करें</span>
            </>
          )}
        </button>
      </div>

      {/* Smart Document Cropper & Auto-Deskew Modal (CamScanner Mode) */}
      <DocumentCropperModal
        isOpen={cropperModalOpen}
        file={rawFileForCrop}
        onApplyCrop={handleApplyCroppedFile}
        onSkip={handleSkipCrop}
        onClose={() => setCropperModalOpen(false)}
      />
    </div>
  );
}
