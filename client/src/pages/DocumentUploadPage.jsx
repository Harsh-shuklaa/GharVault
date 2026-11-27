import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Lock,
  Camera,
  X,
  Check,
  Calendar,
  Sparkles,
  User,
  CreditCard,
  HeartPulse,
  Landmark,
  Folder,
  Eye,
  EyeOff,
  Crop,
  ChevronDown,
  ChevronUp,
  RotateCw,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Layers,
  GitFork,
  GraduationCap,
  Scale,
  ExternalLink,
  Zap,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import DocumentCropperModal from '../components/DocumentCropperModal';

export default function DocumentUploadPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Query parameter pre-fills
  const preselectedMember = searchParams.get('member') || '';
  const preselectedTitle = searchParams.get('title') || '';
  const preselectedCategory = searchParams.get('category') || '';

  // Mode: 'single' (normal document) or 'twosided' (Aadhaar / Voter ID front & back)
  const [uploadMode, setUploadMode] = useState('single');

  // Single File State
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Two-Sided State
  const [frontFile, setFrontFile] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [backPreview, setBackPreview] = useState(null);
  const [activeSide, setActiveSide] = useState('front'); // 'front' | 'back'

  // Cropper Modal State (Always crops FIRST before scanning!)
  const [cropperModalOpen, setCropperModalOpen] = useState(false);
  const [rawFileForCrop, setRawFileForCrop] = useState(null);
  const [cropTargetSide, setCropTargetSide] = useState('single'); // 'single' | 'front' | 'back'

  // Drag & Drop State
  const [isDragging, setIsDragging] = useState(false);

  // AI Scanning State
  const [isScanning, setIsScanning] = useState(false);
  const [aiScanResult, setAiScanResult] = useState(null);
  const [scanElapsed, setScanElapsed] = useState('0.0');
  const scanTimerRef = useRef(null);

  // Smart Profile Enrichment & Family Tree Auto-Linker State
  const [detectedProfileSync, setDetectedProfileSync] = useState(null);
  const [isSyncingProfile, setIsSyncingProfile] = useState(false);

  // Members & Form Data
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showUnmaskedDocNumber, setShowUnmaskedDocNumber] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [detectedDuplicate, setDetectedDuplicate] = useState(null);
  const [activePreset, setActivePreset] = useState(null);

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
    whoCanViewType: 'ALL',
    selectedWhoCanView: [],
    isMpinProtected: false,
    notes: '',
  });

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

  // Object URLs for previews
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    if (file.type && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [file]);

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

  // AI Timer effect
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

  // Play subtle fintech crystal chime on scan success
  const playSuccessChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  };

  // Indian Quick Presets
  const indianPresets = [
    { id: 'aadhaar', label: 'Aadhaar Card', emoji: '🪪', category: 'ID Cards', defaultTitle: 'Aadhaar Card', twoSidedRecommended: true },
    { id: 'pan', label: 'PAN Card', emoji: '💳', category: 'ID Cards', defaultTitle: 'PAN Card', twoSidedRecommended: false },
    { id: 'education', label: 'Marksheet / Degree', emoji: '🎓', category: 'Education', defaultTitle: 'Marksheet / Degree', twoSidedRecommended: false },
    { id: 'vehicle', label: 'Vehicle RC / DL', emoji: '🚗', category: 'Other', defaultTitle: 'Driving License / RC', twoSidedRecommended: true },
    { id: 'mediclaim', label: 'Health Insurance', emoji: '🏥', category: 'Medical & Health', defaultTitle: 'Health Insurance Policy', twoSidedRecommended: false },
    { id: 'property', label: 'Property Deed', emoji: '📜', category: 'Bank & Property', defaultTitle: 'Property Sale Deed', twoSidedRecommended: false },
    { id: 'legal', label: 'Legal Affidavit / Will', emoji: '⚖️', category: 'Legal', defaultTitle: 'Legal Affidavit / Agreement', twoSidedRecommended: false },
    { id: 'passport', label: 'Passport', emoji: '✈️', category: 'ID Cards', defaultTitle: 'Indian Passport', twoSidedRecommended: false },
  ];

  const categories = [
    { id: 'ID Cards', label: 'ID Cards', icon: CreditCard },
    { id: 'Medical & Health', label: 'Medical & Health', icon: HeartPulse },
    { id: 'Bank & Property', label: 'Bank & Property', icon: Landmark },
    { id: 'Education', label: 'Education', icon: GraduationCap },
    { id: 'Legal', label: 'Legal', icon: Scale },
    { id: 'Other', label: 'Other & Vehicle', icon: Folder },
  ];

  // Apply a Quick Preset
  const handleApplyPreset = (preset) => {
    setActivePreset(preset.id);
    if (preset.twoSidedRecommended) {
      setUploadMode('twosided');
    }
    setFormData((prev) => ({
      ...prev,
      title: prev.title || preset.defaultTitle,
      category: preset.category,
    }));
    toast.success(`Selected ${preset.label}`);
    if (!file && !frontFile) {
      document.getElementById('primary-file-input')?.click();
    }
  };

  // Client-Side Image Compression (<500KB)
  const compressImageUnder500KB = async (inputFile, targetMaxKb = 460) => {
    if (!inputFile || !inputFile.type || !inputFile.type.startsWith('image/')) {
      return inputFile;
    }
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
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
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
        resolve(inputFile);
      }
    });
  };

  // Compute SHA-256 for duplicate check
  const computeFileSha256 = async (inputFile) => {
    if (!inputFile) return null;
    try {
      if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        const arrayBuffer = await inputFile.arrayBuffer();
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (e) {}
    return null;
  };

  // Check duplicate document
  const checkDuplicateDoc = async (inputFile, title, extraParams = {}) => {
    try {
      const sha = await computeFileSha256(inputFile);
      if (!sha) return;
      const res = await api.checkDuplicate({
        fileSha256: sha,
        fileName: inputFile?.name || '',
        title: title || formData.title,
        documentNumber: extraParams.documentNumber !== undefined ? extraParams.documentNumber : formData.documentNumber,
        category: extraParams.category !== undefined ? extraParams.category : formData.category,
        assignedMemberId: extraParams.assignedMemberId !== undefined ? extraParams.assignedMemberId : formData.assignedMemberId,
        ocrExtractedData: extraParams.ocrExtractedData !== undefined ? extraParams.ocrExtractedData : aiScanResult,
      });
      if (res?.isDuplicate && res?.duplicateWarning) {
        setDetectedDuplicate(res.duplicateWarning);
      } else {
        setDetectedDuplicate(null);
      }
    } catch (e) {}
  };

  // Trigger Gemini AI Document Scanner (Ran ONLY on clean, cropped, compressed images)
  const triggerAIScan = async (fileToScan) => {
    if (!fileToScan) return;
    setIsScanning(true);
    try {
      const fileForScan = await compressImageUnder500KB(fileToScan);
      const scanData = new FormData();
      scanData.append('file', fileForScan);
      const res = await api.scanDocument(scanData);

      if (res?.data) {
        const data = res.data;
        setAiScanResult(data);
        playSuccessChime();

        // 1. Map Category
        let targetCategory = formData.category;
        const rawCat = (data.category || '').toLowerCase();
        const rawType = (data.docType || '').toLowerCase();

        if (/medical|health|insurance|ayushman/i.test(rawCat + ' ' + rawType)) {
          targetCategory = 'Medical & Health';
        } else if (/id card|identity|aadhaar|pan|passport|license|voter/i.test(rawCat + ' ' + rawType)) {
          targetCategory = 'ID Cards';
        } else if (/education|academic|marksheet|degree|diploma|school|college|university|cbse|aktu|semester/i.test(rawCat + ' ' + rawType)) {
          targetCategory = 'Education';
        } else if (/legal|affidavit|agreement|will|stamp|court|deed/i.test(rawCat + ' ' + rawType)) {
          targetCategory = 'Legal';
        } else if (/bank|property|financial|deed|registry|khasra/i.test(rawCat + ' ' + rawType)) {
          targetCategory = 'Bank & Property';
        }

        // 2. Member Auto-Matching by Holder Name
        let matchedMemberId = data.matchedMemberId || null;
        if (!matchedMemberId && data.holderName && members.length > 0) {
          const holderLower = data.holderName.toLowerCase().trim();
          const found = members.find((m) => {
            const mName = (m.name || '').toLowerCase().trim();
            return holderLower.includes(mName) || mName.includes(holderLower);
          });
          if (found) matchedMemberId = (found._id || found.id).toString();
        }

        const effectiveMemberId = matchedMemberId || formData.assignedMemberId || members[0]?._id;
        const currentTargetMember = members.find((m) => m._id === effectiveMemberId);

        // 3. Smart Profile Enrichment & Family Tree Linker Engine
        const detectedDob = data.dob || null;
        const detectedBloodGroup = data.emergencyDetails?.bloodGroup || null;
        const detectedFather = data.fatherOrSpouseName ? data.fatherOrSpouseName.trim() : null;

        if (currentTargetMember) {
          const needsDob = Boolean(detectedDob && (!currentTargetMember.dateOfBirth || currentTargetMember.dateOfBirth === ''));
          const needsBg = Boolean(detectedBloodGroup && (!currentTargetMember.bloodGroup || currentTargetMember.bloodGroup === ''));

          // Check if user already has a parent linked or already has father name in profile
          const alreadyHasParent = Boolean(
            currentTargetMember.relativeTo ||
            (currentTargetMember.fatherOrSpouseName && currentTargetMember.fatherOrSpouseName.trim().length > 0)
          );

          let matchedParent = null;
          let newParentName = null;
          let needsParent = false;

          // ONLY evaluate parent link if member DOES NOT ALREADY have a parent set in profile!
          if (!alreadyHasParent && detectedFather && detectedFather.length >= 3) {
            const fatherLower = detectedFather.toLowerCase();
            const foundParent = members.find((m) => {
              const mName = (m.name || '').toLowerCase().trim();
              return (fatherLower.includes(mName) || mName.includes(fatherLower)) && m._id !== currentTargetMember._id;
            });
            if (foundParent) {
              matchedParent = foundParent;
              needsParent = true;
            } else {
              newParentName = detectedFather;
              needsParent = true;
            }
          }

          // STRICT CHECK: ONLY show popup if something is GENUINELY missing from member's profile!
          if (needsDob || needsBg || needsParent) {
            setDetectedProfileSync({
              memberId: currentTargetMember._id,
              memberName: currentTargetMember.name,
              dob: needsDob ? detectedDob : null,
              bloodGroup: needsBg ? detectedBloodGroup : null,
              fatherOrSpouseName: needsParent ? detectedFather : null,
              matchedParent: needsParent ? matchedParent : null,
              newParentName: needsParent ? newParentName : null,
              needsDob,
              needsBg,
              needsParent,
            });
          } else {
            setDetectedProfileSync(null); // Everything is already saved in profile! Zero annoying popup!
          }
        }

        // Smart Title for Education Marksheets (Turns generic "Result Cum Detailed..." into "BCA - 6th Semester Marksheet (Harsh)")
        let resolvedTitle = data.suggestedTitle;
        const isAcademic = targetCategory === 'Education' ||
          /result\s*cum|detailed\s*marks|statement\s*of\s*marks|marksheet|dmc|grade\s*card/i.test(`${data.docType} ${resolvedTitle}`);

        if (isAcademic) {
          const rawCtx = `${data.docType} ${resolvedTitle} ${fileToScan?.name || ''} ${data.academicDetails?.semesterOrYear || ''}`.toLowerCase();
          const semM = rawCtx.match(/\b(sem(?:ester)?\s*([0-9]+|[ivx]+)|([0-9]+)(?:st|nd|rd|th)\s*sem(?:ester)?|sixth|fifth|fourth|third|second|first|final\s*sem(?:ester)?)\b/i);
          const courseM = rawCtx.match(/\b(bca|mca|b\.?tech|m\.?tech|bba|mba|b\.?sc|m\.?sc|b\.?com|ba|ma|cbse)\b/i);

          const semText = data.academicDetails?.semesterOrYear || (semM ? semM[0].replace(/\b\w/g, l => l.toUpperCase()) : 'Semester');
          const courseText = data.academicDetails?.courseOrDegree || (courseM ? courseM[0].toUpperCase() : '');
          const studentFirst = currentTargetMember?.name ? currentTargetMember.name.split(' ')[0] : (data.holderName ? data.holderName.split(' ')[0] : '');

          if (courseText && semText) {
            resolvedTitle = `${courseText} - ${semText} Marksheet${studentFirst ? ' (' + studentFirst + ')' : ''}`;
          } else if (semText) {
            resolvedTitle = `${semText} Marksheet${studentFirst ? ' (' + studentFirst + ')' : ''}`;
          }
        }

        setFormData((prev) => ({
          ...prev,
          title: (resolvedTitle && resolvedTitle !== 'Document') ? resolvedTitle : (data.docType || prev.title),
          documentNumber: data.docNumber ? data.docNumber.trim() : prev.documentNumber,
          holderName: data.holderName ? data.holderName.trim() : prev.holderName,
          fatherOrSpouseName: detectedFather || prev.fatherOrSpouseName,
          category: targetCategory,
          assignedMemberId: effectiveMemberId,
        }));

        if (data.duplicateWarning?.isDuplicate) {
          setDetectedDuplicate(data.duplicateWarning);
        } else {
          setDetectedDuplicate(null);
        }

        toast.success(`✨ Auto-detected: ${data.docType || 'Document'} (${data.docNumber || 'Details extracted'})`);
      }
    } catch (err) {
      console.warn('AI Scan warning:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Rotate Image 90° Clockwise
  const handleRotateImage = async (side = 'single') => {
    const current = side === 'front' ? frontFile : (side === 'back' ? backFile : file);
    if (!current || !current.type || !current.type.startsWith('image/')) return;

    try {
      const img = new Image();
      const url = URL.createObjectURL(current);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        canvas.width = img.height;
        canvas.height = img.width;
        const ctx = canvas.getContext('2d');
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((90 * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        canvas.toBlob(
          (blob) => {
            if (!blob) return;
            const rotated = new File([blob], current.name, { type: 'image/jpeg' });
            if (side === 'front') setFrontFile(rotated);
            else if (side === 'back') setBackFile(rotated);
            else setFile(rotated);
            toast.success('Rotated 90°');
          },
          'image/jpeg',
          0.9
        );
      };
      img.src = url;
    } catch (e) {}
  };

  // Launch Cropper (Opens directly when a photo is selected!)
  const triggerCrop = (targetFile, side = 'single') => {
    if (!targetFile || !targetFile.type || !targetFile.type.startsWith('image/')) {
      toast.info('Cropper is only available for images.');
      return;
    }
    setRawFileForCrop(targetFile);
    setCropTargetSide(side);
    setCropperModalOpen(true);
  };

  // Apply Cropped Image: Compresses & THEN Triggers Gemini AI!
  const handleApplyCroppedFile = async (croppedFile) => {
    setCropperModalOpen(false);
    toast.success('🪄 Document cropped & enhanced! Bedsheet & borders removed.');

    let cleanFile = croppedFile;
    if (croppedFile.type && croppedFile.type.startsWith('image/') && croppedFile.size > 500 * 1024) {
      cleanFile = await compressImageUnder500KB(croppedFile);
    }

    if (cropTargetSide === 'front') {
      setFrontFile(cleanFile);
      setActiveSide('back');
      toast.info('Front side ready! Now please snap or choose the Back side 🔄');
    } else if (cropTargetSide === 'back') {
      setBackFile(cleanFile);
      // Both Front and Back are ready! Stitch and scan BOTH together!
      if (frontFile) {
        toast.info('Stitching Front & Back sides for unified AI scan...');
        const stitched = await stitchTwoSidedImages(frontFile, cleanFile);
        triggerAIScan(stitched);
      }
    } else {
      setFile(cleanFile);
      const cleanName = cleanFile.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();
      if (!formData.title) {
        setFormData((prev) => ({ ...prev, title: cleanName }));
      }
      // Exact file SHA-256 check before AI; full composite check runs after AI extracts category & semester
      checkDuplicateDoc(cleanFile, '', { category: formData.category });
      // Scan clean cropped single file
      triggerAIScan(cleanFile);
    }
  };

  // Skip Crop: Proceed with raw compressed file
  const handleSkipCrop = async () => {
    setCropperModalOpen(false);
    if (!rawFileForCrop) return;

    let cleanFile = rawFileForCrop;
    if (rawFileForCrop.type && rawFileForCrop.type.startsWith('image/') && rawFileForCrop.size > 500 * 1024) {
      cleanFile = await compressImageUnder500KB(rawFileForCrop);
    }

    if (cropTargetSide === 'front') {
      setFrontFile(cleanFile);
      setActiveSide('back');
      toast.info('Front side set. Now capture the Back side 🔄');
    } else if (cropTargetSide === 'back') {
      setBackFile(cleanFile);
      if (frontFile) {
        toast.info('Stitching Front & Back sides for AI scan...');
        const stitched = await stitchTwoSidedImages(frontFile, cleanFile);
        triggerAIScan(stitched);
      }
    } else {
      setFile(cleanFile);
      const cleanName = cleanFile.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();
      if (!formData.title) {
        setFormData((prev) => ({ ...prev, title: cleanName }));
      }
      checkDuplicateDoc(cleanFile, cleanName);
      triggerAIScan(cleanFile);
    }
  };

  // Initial File Selection: If image, IMMEDIATELY open Cropper Modal!
  const handleFileSelection = (selectedFile, side = 'single') => {
    if (!selectedFile) return;
    setError('');

    if (selectedFile.type && selectedFile.type.startsWith('image/')) {
      // Step 1: Open Cropper FIRST!
      setRawFileForCrop(selectedFile);
      setCropTargetSide(side);
      setCropperModalOpen(true);
    } else {
      // PDF or non-image: proceed directly
      setFile(selectedFile);
      triggerAIScan(selectedFile);
    }
  };

  // Two-sided canvas stitcher
  const stitchTwoSidedImages = (front, back) => {
    return new Promise((resolve) => {
      const frontImg = new Image();
      const backImg = new Image();
      let fDone = false;
      let bDone = false;
      const doStitch = () => {
        if (!fDone || !bDone) return;
        try {
          const maxW = Math.max(frontImg.width, backImg.width, 1000);
          const sF = maxW / frontImg.width;
          const sB = maxW / backImg.width;
          const hF = frontImg.height * sF;
          const hB = backImg.height * sB;
          const sep = 24;
          const totalH = hF + hB + sep;

          const canvas = document.createElement('canvas');
          canvas.width = maxW;
          canvas.height = totalH;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, maxW, totalH);
          ctx.drawImage(frontImg, 0, 0, maxW, hF);
          ctx.fillStyle = '#f1f5f9';
          ctx.fillRect(0, hF, maxW, sep);
          ctx.drawImage(backImg, 0, hF + sep, maxW, hB);

          canvas.toBlob(
            async (blob) => {
              if (!blob) {
                resolve(front);
                return;
              }
              const stitched = new File([blob], `${front.name.replace(/\.[^/.]+$/, '')}_2Sided.jpg`, { type: 'image/jpeg' });
              resolve(await compressImageUnder500KB(stitched));
            },
            'image/jpeg',
            0.85
          );
        } catch (e) {
          resolve(front);
        }
      };
      frontImg.onload = () => { fDone = true; doStitch(); };
      backImg.onload = () => { bDone = true; doStitch(); };
      frontImg.onerror = () => resolve(front);
      backImg.onerror = () => resolve(front);
      frontImg.src = URL.createObjectURL(front);
      backImg.src = URL.createObjectURL(back);
    });
  };

  // Apply Smart Profile & Family Tree Sync (User clicked "Update Profile & Tree")
  const handleApplyProfileSync = async () => {
    if (!detectedProfileSync) return;
    try {
      setIsSyncingProfile(true);
      const updates = {};
      if (detectedProfileSync.dob) updates.dateOfBirth = detectedProfileSync.dob;
      if (detectedProfileSync.bloodGroup) updates.bloodGroup = detectedProfileSync.bloodGroup;
      if (detectedProfileSync.fatherOrSpouseName) updates.fatherOrSpouseName = detectedProfileSync.fatherOrSpouseName;

      if (detectedProfileSync.matchedParent) {
        updates.relativeTo = (detectedProfileSync.matchedParent._id || detectedProfileSync.matchedParent.id).toString();
      } else if (detectedProfileSync.fatherOrSpouseName) {
        // If father is not yet in family, add him as Father/Parent in Family Tree!
        try {
          const addRes = await api.addMember({
            name: detectedProfileSync.fatherOrSpouseName,
            relationship: 'Father',
          });
          const newParent = addRes?.member || addRes?.data || addRes;
          if (newParent?._id || newParent?.id) {
            updates.relativeTo = (newParent._id || newParent.id).toString();
          }
          toast.success(`✨ "${detectedProfileSync.fatherOrSpouseName}" family tree me add ho gaye!`);
        } catch (addErr) {
          console.warn('Could not auto-add parent to family:', addErr);
        }
      }

      await api.updateMember(detectedProfileSync.memberId, updates);

      // Refresh members
      const res = await api.getMembers();
      setMembers(res.members || []);
      toast.success(`✨ ${detectedProfileSync.memberName} ki profile aur Family Tree update ho gaya!`);
      setDetectedProfileSync(null);
    } catch (err) {
      toast.error('Profile update failed: ' + (err.message || 'Error'));
    } finally {
      setIsSyncingProfile(false);
    }
  };

  // Submit to Vault
  const handleSubmit = async (e, forceUpload = false) => {
    if (e && e.preventDefault) e.preventDefault();

    let finalFile = file;
    if (uploadMode === 'twosided') {
      if (!frontFile) {
        setError('Please select or capture the Front side.');
        return;
      }
      if (backFile) {
        toast.info('Combining Front & Back sides into single secure document...');
        finalFile = await stitchTwoSidedImages(frontFile, backFile);
      } else {
        finalFile = frontFile;
      }
    }

    if (!finalFile) {
      setError('Please select or scan a document.');
      return;
    }

    const cleanTitle = (formData.title || finalFile.name || '').trim();
    if (!cleanTitle) {
      setError('Please provide a document title.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const data = new FormData();
      data.append('file', finalFile);
      data.append('title', cleanTitle);
      data.append('category', formData.category);

      if (forceUpload) data.append('ignoreDuplicate', 'true');
      if (formData.assignedMemberId) data.append('assignedMemberId', formData.assignedMemberId);
      if (formData.documentNumber) data.append('documentNumber', formData.documentNumber.trim().toUpperCase());
      if (formData.holderName) data.append('holderName', formData.holderName.trim());
      if (formData.fatherOrSpouseName) data.append('fatherOrSpouseName', formData.fatherOrSpouseName.trim());
      if (formData.expiryDate) data.append('expiryDate', formData.expiryDate);
      if (formData.notes) data.append('notes', formData.notes.trim());
      data.append('isMpinProtected', formData.isMpinProtected ? 'true' : 'false');
      data.append('whoCanView', JSON.stringify(['ALL']));

      if (aiScanResult) {
        data.append('ocrExtractedData', JSON.stringify(aiScanResult));
      }

      const res = await api.uploadDocument(data);
      toast.success(`"${cleanTitle}" securely saved & encrypted!`);

      if (res?.document) {
        navigate(`/vault/documents/${res.document._id || res.document.id}`);
      } else {
        navigate('/vault');
      }
    } catch (err) {
      console.error('Upload error:', err);
      if (err.status === 409 || err.data?.isDuplicate) {
        const dupWarning = err.data?.duplicateWarning || {
          message: err.data?.error || 'Document already exists in your vault.',
          existingDocId: err.data?.duplicateWarning?.existingDocId,
          existingDocTitle: err.data?.duplicateWarning?.existingDocTitle,
          assignedMemberName: err.data?.duplicateWarning?.assignedMemberName,
          uploadDate: err.data?.duplicateWarning?.uploadDate,
          matchType: err.data?.duplicateWarning?.matchType || 'ID_NUMBER',
        };
        setDetectedDuplicate(dupWarning);
        setError('');
        toast.error('Duplicate detected: Please choose to Upload Anyway, View, or Discard.');
      } else {
        setError(err.message || 'Failed to save document. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Discard current document and return to fresh upload/dropzone screen
  const handleDiscardAndUploadAnother = () => {
    setFile(null);
    setPreviewUrl(null);
    setFrontFile(null);
    setFrontPreview(null);
    setBackFile(null);
    setBackPreview(null);
    setAiScanResult(null);
    setDetectedDuplicate(null);
    setError('');
    setDetectedProfileSync(null);
    setFormData({
      title: '',
      category: 'ID Cards',
      assignedMemberId: '',
      documentNumber: '',
      holderName: '',
      fatherOrSpouseName: '',
      expiryDate: '',
      notes: '',
      isMpinProtected: false,
    });
    const primaryInput = document.getElementById('primary-file-input');
    if (primaryInput) primaryInput.value = '';
    const cameraInput = document.getElementById('camera-input');
    if (cameraInput) cameraInput.value = '';
    toast.info('Document discarded. Ready to upload another.');
  };

  // Has file been uploaded?
  const hasFile = uploadMode === 'twosided' ? Boolean(frontFile) : Boolean(file);
  const activePreview = uploadMode === 'twosided'
    ? (activeSide === 'front' ? frontPreview : backPreview)
    : previewUrl;
  const activeCurrentFile = uploadMode === 'twosided'
    ? (activeSide === 'front' ? frontFile : backFile)
    : file;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-[#F8FAFC] dark:bg-[#090A0F] text-slate-900 dark:text-[#F8FAFC] pb-16 transition-colors">
      {/* Background Texture & Ambient Top Glow */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(currentColor_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] dark:opacity-[0.06] text-slate-900 dark:text-white"
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-sky-500/10 rounded-full blur-3xl" />

      {/* Hidden File & Camera Inputs */}
      <input
        id="primary-file-input"
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFileSelection(e.target.files[0], uploadMode === 'twosided' ? activeSide : 'single');
          }
        }}
      />
      <input
        id="camera-input"
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFileSelection(e.target.files[0], uploadMode === 'twosided' ? activeSide : 'single');
          }
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-5">
        {/* ================= HEADER ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-[#1E293B]">
          <div>
            <button
              type="button"
              onClick={() => navigate('/vault')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors mb-1.5 cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to Vault</span>
            </button>
            <div className="flex items-baseline gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Add Document
              </h1>
              <span className="text-xs sm:text-sm text-slate-400 dark:text-slate-400 font-serif">
                नया दस्तावेज़
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Mode Toggle: Single vs Two-Sided */}
            <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B]">
              <button
                type="button"
                onClick={() => setUploadMode('single')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  uploadMode === 'single'
                    ? 'bg-white dark:bg-[#182030] text-sky-600 dark:text-sky-400 shadow-sm border border-slate-200/60 dark:border-sky-500/30'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                1-Page Document
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('twosided')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  uploadMode === 'twosided'
                    ? 'bg-white dark:bg-[#182030] text-sky-600 dark:text-sky-400 shadow-sm border border-slate-200/60 dark:border-sky-500/30'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🪪 Two-Sided ID (Front & Back)
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[11px] font-bold border border-sky-200/80 dark:border-sky-500/20">
              <ShieldCheck size={13} />
              <span>Client Encrypted</span>
            </div>
          </div>
        </div>

        {/* ================= SMART PROFILE & FAMILY TREE SYNC POP-UP BANNER ================= */}
        {detectedProfileSync && (
          <div className="p-4 rounded-2xl bg-sky-50/80 dark:bg-[#182030] border border-sky-200 dark:border-sky-500/30 shadow-xs space-y-3 animate-fadeIn">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold text-xs">
                <Sparkles size={16} />
                <span>Smart Profile & Family Tree Update Detected</span>
              </div>
              <button
                type="button"
                onClick={() => setDetectedProfileSync(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Document se <strong>{detectedProfileSync.memberName}</strong> ki missing jaankari auto-detect hui hai:
            </p>

            <div className="flex flex-wrap gap-2 text-xs">
              {detectedProfileSync.dob && (
                <div className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#0B0F19] border border-sky-200 dark:border-sky-500/20 text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-1.5">
                  <Calendar size={13} className="text-sky-500" />
                  <span>DOB: {detectedProfileSync.dob}</span>
                </div>
              )}
              {detectedProfileSync.bloodGroup && (
                <div className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#0B0F19] border border-sky-200 dark:border-sky-500/20 text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-1.5">
                  <HeartPulse size={13} className="text-rose-500" />
                  <span>Blood Group: {detectedProfileSync.bloodGroup}</span>
                </div>
              )}
              {detectedProfileSync.fatherOrSpouseName && (
                <div className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#0B0F19] border border-sky-200 dark:border-sky-500/20 text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-1.5">
                  <GitFork size={13} className="text-sky-500" />
                  <span>Parent/Father: {detectedProfileSync.fatherOrSpouseName}</span>
                  {detectedProfileSync.matchedParent ? (
                    <span className="text-[10px] text-sky-500 font-bold">({detectedProfileSync.matchedParent.relationship || 'In Family'})</span>
                  ) : (
                    <span className="text-[10px] text-amber-500 font-semibold">(Add to Tree)</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleApplyProfileSync}
                disabled={isSyncingProfile}
                className="py-2 px-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <Check size={14} strokeWidth={2.5} />
                <span>{isSyncingProfile ? 'Updating Profile & Tree...' : `Update ${detectedProfileSync.memberName}'s Profile & Tree`}</span>
              </button>
              <button
                type="button"
                onClick={() => setDetectedProfileSync(null)}
                className="py-2 px-3 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
            {error.includes('already exists') && (
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-500 cursor-pointer"
              >
                Upload Anyway
              </button>
            )}
          </div>
        )}

        {/* Interactive Duplicate Resolution Card (Mobile-First 3-Action Gateway) */}
        {detectedDuplicate && (
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-amber-300/90 dark:border-amber-500/40 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-rose-500/10 p-3.5 sm:p-5 shadow-lg shadow-amber-500/5 space-y-3 animate-fadeIn">
            {/* Top Tri-Tone Accent Ribbon */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-rose-500" />

            {/* Header: Warning Badge + Title + Dismiss */}
            <div className="flex items-start justify-between gap-2 pt-0.5">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-300/60 dark:border-amber-500/30 shadow-xs mt-0.5">
                  <AlertTriangle size={18} className="animate-pulse" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      Duplicate Document Detected
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-300/50">
                      {detectedDuplicate.matchType === 'EXACT_FILE'
                        ? 'Exact File'
                        : detectedDuplicate.matchType === 'ID_NUMBER'
                        ? 'Matching ID'
                        : 'Similar Record'}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900/85 dark:text-amber-300/85 mt-0.5 leading-snug">
                    {detectedDuplicate.message}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDetectedDuplicate(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
                title="Dismiss warning"
              >
                <X size={15} />
              </button>
            </div>

            {/* Existing Document Summary Pill (If available) */}
            {detectedDuplicate.existingDocTitle && (
              <div className="p-2.5 rounded-xl bg-white/85 dark:bg-[#141414]/90 border border-amber-200/70 dark:border-[#262626] flex items-center justify-between gap-2 text-xs shadow-2xs">
                <div className="min-w-0 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <FileText size={13} />
                  </div>
                  <div className="truncate">
                    <span className="font-bold text-slate-900 dark:text-white truncate block text-xs">
                      {detectedDuplicate.existingDocTitle}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-neutral-400 flex items-center gap-1 truncate">
                      <span>Folder: <b className="text-slate-700 dark:text-neutral-300">{detectedDuplicate.assignedMemberName || 'Family Member'}</b></span>
                      {detectedDuplicate.uploadDate && <span>• Uploaded: {detectedDuplicate.uploadDate}</span>}
                    </span>
                  </div>
                </div>

                {detectedDuplicate.existingDocId && (
                  <button
                    type="button"
                    onClick={() => window.open(`/vault/documents/${detectedDuplicate.existingDocId}`, '_blank')}
                    className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30 text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-colors shadow-2xs"
                    title="Open existing document in new tab to compare"
                  >
                    <span>View</span>
                    <ExternalLink size={11} />
                  </button>
                )}
              </div>
            )}

            {/* 3 Mobile-Optimized Big Touch-Friendly Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5">
              {/* Option 1: Upload Anyway */}
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-blue-600 hover:from-sky-400 hover:via-indigo-400 hover:to-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/25 border border-sky-400/30 transition-all cursor-pointer active:scale-95"
                title="Bypass duplicate check and save document to vault"
              >
                <Zap size={14} className="fill-current" />
                <span>Upload Anyway</span>
              </button>

              {/* Option 2: View Existing Document */}
              {detectedDuplicate.existingDocId ? (
                <button
                  type="button"
                  onClick={() => window.open(`/vault/documents/${detectedDuplicate.existingDocId}`, '_blank')}
                  className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-[#182030] hover:bg-slate-100 dark:hover:bg-[#222c42] text-slate-800 dark:text-neutral-200 border border-slate-200 dark:border-[#1E293B] text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95"
                  title="Open existing document in a new tab"
                >
                  <Eye size={14} className="text-sky-500" />
                  <span>View Existing</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/vault')}
                  className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-[#182030] hover:bg-slate-100 dark:hover:bg-[#222c42] text-slate-800 dark:text-neutral-200 border border-slate-200 dark:border-[#1E293B] text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95"
                >
                  <Folder size={14} className="text-amber-500" />
                  <span>Open Vault</span>
                </button>
              )}

              {/* Option 3: Discard & Upload Another */}
              <button
                type="button"
                onClick={handleDiscardAndUploadAnother}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                title="Discard this document and choose another file"
              >
                <RotateCcw size={14} />
                <span>Discard & Change</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= STAGE 1: EMPTY STATE DROPZONE (SafePaper Style) ================= */}
        {!hasFile && (
          <div className="space-y-5 animate-fadeIn">
            {/* SafePaper-Style Hero Dropzone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.[0]) {
                  handleFileSelection(e.dataTransfer.files[0], uploadMode === 'twosided' ? 'front' : 'single');
                }
              }}
              className={`p-8 sm:p-12 rounded-2xl border-2 border-dashed text-center transition-all flex flex-col items-center justify-center gap-4 ${
                isDragging
                  ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-500/10 ring-4 ring-sky-500/20 scale-[1.01]'
                  : 'border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#121622] hover:border-sky-400/70 hover:shadow-lg'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-[#182030] text-sky-500 dark:text-sky-400 flex items-center justify-center border border-sky-100 dark:border-sky-500/20">
                <Upload size={28} strokeWidth={2.2} />
              </div>

              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Drag & drop your document here
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {uploadMode === 'twosided'
                    ? 'Step 1: Capture or select Front side (You can crop bedsheet/fingers right away!)'
                    : 'PDF, JPG, or PNG • Auto-crop and compress to <500KB'}
                </p>
              </div>

              {/* 2 Big Primary Touch Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2 w-full max-w-sm">
                <button
                  type="button"
                  onClick={() => document.getElementById('camera-input')?.click()}
                  className="flex-1 min-w-[140px] py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-all cursor-pointer active:scale-95"
                >
                  <Camera size={16} strokeWidth={2.5} />
                  <span>Open Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => document.getElementById('primary-file-input')?.click()}
                  className="flex-1 min-w-[140px] py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#182030] dark:hover:bg-[#202a40] text-slate-800 dark:text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border border-slate-200 dark:border-[#1E293B] transition-all cursor-pointer active:scale-95"
                >
                  <FileText size={16} />
                  <span>Choose File</span>
                </button>
              </div>
            </div>

            {/* Quick Presets Bar */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-400 dark:text-slate-400 tracking-wider uppercase">
                Or Quick Choose Document Type:
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {indianPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#121622] border border-slate-200 dark:border-[#1E293B] text-slate-700 dark:text-slate-300 hover:border-sky-500/50 hover:text-sky-500 dark:hover:text-sky-400 text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <span>{preset.emoji}</span>
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= STAGE 2: STUDIO CANVAS + 5-SECOND REVIEW ================= */}
        {hasFile && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 animate-fadeIn">
            {/* ================= LEFT COLUMN: DOCUMENT STUDIO CANVAS ================= */}
            <div className="lg:col-span-6 space-y-3">
              {/* Two-sided switcher tabs if in two-sided mode */}
              {uploadMode === 'twosided' && (
                <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B]">
                  <button
                    type="button"
                    onClick={() => setActiveSide('front')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      activeSide === 'front'
                        ? 'bg-white dark:bg-[#182030] text-sky-600 dark:text-sky-400 shadow-sm border border-slate-200/60 dark:border-sky-500/30'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <span>🪪 Front Side</span>
                    {frontFile && <CheckCircle size={12} className="text-sky-500" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSide('back')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      activeSide === 'back'
                        ? 'bg-white dark:bg-[#182030] text-sky-600 dark:text-sky-400 shadow-sm border border-slate-200/60 dark:border-sky-500/30'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <span>🔄 Back Side</span>
                    {backFile ? (
                      <CheckCircle size={12} className="text-sky-500" />
                    ) : (
                      <span className="text-[10px] text-amber-500 font-medium">(Upload Next)</span>
                    )}
                  </button>
                </div>
              )}

              {/* Main Document Preview Card */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-[#1E293B] bg-slate-100 dark:bg-[#0B0F19] min-h-[300px] sm:min-h-[380px] flex items-center justify-center p-3">
                {activePreview ? (
                  <img
                    src={activePreview}
                    alt="Document preview"
                    className="max-h-[360px] sm:max-h-[420px] w-auto object-contain rounded-lg shadow-sm"
                  />
                ) : activeCurrentFile?.type === 'application/pdf' ? (
                  <div className="text-center space-y-2 py-10">
                    <FileText size={48} className="mx-auto text-sky-500" />
                    <div className="text-xs font-bold text-slate-800 dark:text-white">
                      {activeCurrentFile.name}
                    </div>
                    <div className="text-[11px] text-slate-400">PDF Document Ready</div>
                  </div>
                ) : (
                  <div className="text-center space-y-3 py-10">
                    <Camera size={36} className="mx-auto text-slate-400" />
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Back side photo upload karein (Aadhaar/DL pichla hissa)
                    </div>
                    <button
                      type="button"
                      onClick={() => document.getElementById('camera-input')?.click()}
                      className="py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-md shadow-sky-500/20 cursor-pointer"
                    >
                      Capture Back Side
                    </button>
                  </div>
                )}

                {/* AI Scanning Overlay */}
                {isScanning && (
                  <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center space-y-2.5 z-20">
                    <div className="w-10 h-10 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles size={14} className="text-sky-400 animate-pulse" />
                      <span>Gemini AI reading cropped document... ({scanElapsed}s)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 max-w-xs">
                      {uploadMode === 'twosided'
                        ? 'Reading both Front & Back sides for Name, ID Number, Father & Address...'
                        : 'Auto-detecting Document Number, Title, and Family Member...'}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Toolbar directly below Canvas */}
              {activeCurrentFile && (
                <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-[#121622] border border-slate-200 dark:border-[#1E293B]">
                  <div className="flex items-center gap-1.5">
                    {activeCurrentFile.type?.startsWith('image/') && (
                      <>
                        <button
                          type="button"
                          onClick={() => triggerCrop(activeCurrentFile, uploadMode === 'twosided' ? activeSide : 'single')}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#182030] dark:hover:bg-[#202a40] text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Crop size={13} className="text-sky-500" />
                          <span>Re-Crop</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRotateImage(uploadMode === 'twosided' ? activeSide : 'single')}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#182030] dark:hover:bg-[#202a40] text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <RotateCw size={13} />
                          <span>Rotate</span>
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (uploadMode === 'twosided') {
                        if (activeSide === 'front') setFrontFile(null);
                        else setBackFile(null);
                      } else {
                        setFile(null);
                        setAiScanResult(null);
                        setDetectedProfileSync(null);
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash2 size={13} />
                    <span>Change File</span>
                  </button>
                </div>
              )}
            </div>

            {/* ================= RIGHT COLUMN: 5-SECOND REVIEW FORM ================= */}
            <div className="lg:col-span-6 space-y-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200 dark:border-[#1E293B] shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1E293B]">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-sky-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Document Details
                    </h3>
                  </div>
                  {aiScanResult && (
                    <span className="text-[10px] font-bold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/15 border border-sky-200 dark:border-sky-500/30 px-2 py-0.5 rounded-full">
                      ✨ AI Extracted (Cropped)
                    </span>
                  )}
                </div>

                {/* 1. Document Title */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Document Title (दस्तावेज़ का नाम)
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Aadhaar Card, PAN Card, House Deed"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/40"
                  />
                </div>

                {/* 2. Assign to Family Member (1-Tap Avatar Pills) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Whose document is this? (यह किसका दस्तावेज़ है?)
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {members.map((m) => {
                      const isSelected = formData.assignedMemberId === m._id;
                      return (
                        <button
                          key={m._id}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, assignedMemberId: m._id }))}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-sky-50 dark:bg-[#182030] text-sky-600 dark:text-sky-400 border-sky-400 dark:border-sky-500 ring-2 ring-sky-500/20'
                              : 'bg-slate-50 dark:bg-[#0B0F19] border-slate-200 dark:border-[#1E293B] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <div className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-500 flex items-center justify-center text-[9px] font-bold">
                            {m.name.charAt(0)}
                          </div>
                          <span>{m.name}</span>
                          {m.relationship && (
                            <span className="text-[10px] opacity-70">({m.relationship})</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Document Number (with Mask toggle) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Document Number (ID नंबर)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowUnmaskedDocNumber((prev) => !prev)}
                      className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1 cursor-pointer"
                    >
                      {showUnmaskedDocNumber ? <EyeOff size={12} /> : <Eye size={12} />}
                      <span>{showUnmaskedDocNumber ? 'Mask Number' : 'Show Number'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showUnmaskedDocNumber ? 'text' : 'password'}
                      value={formData.documentNumber}
                      onChange={(e) => setFormData((prev) => ({ ...prev, documentNumber: e.target.value }))}
                      placeholder="e.g. •••• •••• 4921"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-white font-mono text-xs font-semibold focus:outline-hidden focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/40"
                    />
                  </div>
                </div>

                {/* 4. Category Selector */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Category (कैटेगरी)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
                    {categories.map((c) => {
                      const isSelected = formData.category === c.id;
                      const Icon = c.icon;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, category: c.id }))}
                          className={`py-2 px-2 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-sky-50 dark:bg-[#182030] text-sky-600 dark:text-sky-400 border-sky-400 dark:border-sky-500 ring-1 ring-sky-500/30'
                              : 'bg-slate-50 dark:bg-[#0B0F19] border-slate-200 dark:border-[#1E293B] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <Icon size={14} className={isSelected ? 'text-sky-500' : 'text-slate-400'} />
                          <span className="truncate w-full text-center">{c.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Collapsible Advanced Options (Zero Headache: Closed by Default) */}
                <div className="pt-2 border-t border-slate-100 dark:border-[#1E293B]">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedOptions((prev) => !prev)}
                    className="w-full py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 flex items-center justify-between cursor-pointer"
                  >
                    <span>More Options (Expiry Date, Father Name, Notes, MPIN Lock)</span>
                    {showAdvancedOptions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {showAdvancedOptions && (
                    <div className="pt-3 space-y-3 animate-fadeIn">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Father / Spouse Name (Optional)
                          </label>
                          <input
                            type="text"
                            value={formData.fatherOrSpouseName}
                            onChange={(e) => setFormData((prev) => ({ ...prev, fatherOrSpouseName: e.target.value }))}
                            placeholder="e.g. Ramesh Sharma"
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-white text-xs font-medium"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Expiry Date (Optional)
                          </label>
                          <input
                            type="date"
                            value={formData.expiryDate}
                            onChange={(e) => setFormData((prev) => ({ ...prev, expiryDate: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-white text-xs font-medium"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Notes / Description (Optional)
                        </label>
                        <textarea
                          rows={2}
                          value={formData.notes}
                          onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                          placeholder="e.g. Original physical copy is in wooden almirah locker"
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-white text-xs font-medium"
                        />
                      </div>

                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={formData.isMpinProtected}
                          onChange={(e) => setFormData((prev) => ({ ...prev, isMpinProtected: e.target.checked }))}
                          className="w-4 h-4 rounded text-sky-500 focus:ring-sky-400"
                        />
                        <Lock size={12} className="text-sky-500" />
                        <span>Lock with Family MPIN (Sensitive Document)</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* 6. BIG PRIMARY BUTTON (1-Tap Save) */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-blue-600 hover:from-sky-400 hover:via-indigo-400 hover:to-blue-500 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 border border-sky-400/30 transition-all cursor-pointer active:scale-98"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Encrypting & Saving to Vault...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} strokeWidth={2.4} />
                      <span>Save to Vault (सुरक्षित करें)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Smart Document Cropper & Auto-Deskew Modal (CamScanner Mode - Runs FIRST before AI Scan) */}
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
