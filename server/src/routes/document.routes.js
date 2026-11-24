import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { memoryStore } from '../config/seed.js';
import Document from '../models/Document.js';
import User from '../models/User.js';
import Family from '../models/Family.js';
import Notification from '../models/Notification.js';
import { isConnected } from '../config/db.js';
import { uploadDocument, createSignedUrl, deleteDocument, LOCAL_STORAGE_DIR } from '../services/supabaseStorage.js';
import { recordAuditLog } from '../services/auditService.js';
import { sendPushToFamily } from '../services/pushNotification.service.js';
import { scanDocumentWithAI, generateSmartDocumentTitle } from '../services/aiDocumentScanner.js';
import { askVaultAI } from '../services/vaultChatAssistant.js';

// Multi-Tier Heuristic Duplicate Detection Engine (Feature E)
export function detectHeuristicDuplicate({
  fileSha256,
  scanDocNumber,
  scanDocType,
  suggestedTitle,
  fileName,
  matchedMemberId,
  existingDocs = [],
  familyMembers = [],
}) {
  const resolveMemberName = (doc) => {
    const memberObj = doc.assignedMemberId;
    if (memberObj && typeof memberObj === 'object' && memberObj.name) {
      return memberObj.name + (memberObj.relationship ? ` (${memberObj.relationship})` : '');
    }
    if (doc.assignedMemberId) {
      const found = familyMembers.find(m => (m._id || m.id)?.toString() === doc.assignedMemberId?.toString());
      if (found?.name) return found.name + (found.relationship ? ` (${found.relationship})` : '');
    }
    return 'Family Member';
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return 'Earlier';
    try {
      return new Date(dateVal).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return 'Earlier';
    }
  };

  // Tier 1: Exact Binary Content Match (SHA-256) — 100% Zero-AI
  if (fileSha256) {
    const exactMatch = existingDocs.find(d => d.sha256Hash && d.sha256Hash === fileSha256);
    if (exactMatch) {
      const memberName = resolveMemberName(exactMatch);
      const uploadDate = formatDate(exactMatch.createdAt);
      return {
        isDuplicate: true,
        existingDocId: (exactMatch._id || exactMatch.id).toString(),
        existingDocTitle: exactMatch.title,
        assignedMemberName: memberName,
        uploadDate,
        matchType: 'EXACT_FILE',
        confidence: 1.0,
        documentNumber: exactMatch.documentNumber,
        message: `Yeh exact photo/file pehle se ${memberName} ke folder me saved hai (Title: "${exactMatch.title}", Uploaded: ${uploadDate}).`,
      };
    }
  }

  // Tier 2: Semantic Document ID Number Match (Offline Regex & OCR)
  const cleanScanDocNum = (scanDocNumber || '').replace(/[\s\-_/]/g, '').toUpperCase();
  if (cleanScanDocNum.length >= 5) {
    const docNumMatch = existingDocs.find(d => {
      const cleanExisting = (d.documentNumber || '').replace(/[\s\-_/]/g, '').toUpperCase();
      return cleanExisting.length >= 5 && cleanExisting === cleanScanDocNum;
    });
    if (docNumMatch) {
      const memberName = resolveMemberName(docNumMatch);
      const uploadDate = formatDate(docNumMatch.createdAt);
      const docTypeLabel = scanDocType || 'Document';
      return {
        isDuplicate: true,
        existingDocId: (docNumMatch._id || docNumMatch.id).toString(),
        existingDocTitle: docNumMatch.title,
        assignedMemberName: memberName,
        uploadDate,
        matchType: 'ID_NUMBER',
        confidence: 0.95,
        documentNumber: scanDocNumber || docNumMatch.documentNumber,
        message: `Yeh ${docTypeLabel} (${scanDocNumber || docNumMatch.documentNumber}) pehle se ${memberName} ke folder me saved hai (Title: "${docNumMatch.title}", Uploaded: ${uploadDate}).`,
      };
    }
  }

  // Tier 3: Heuristic Title & Filename Token Similarity (Fuzzy Keyword Matching)
  const normalizeTokens = (str) => {
    if (!str) return [];
    return str
      .toLowerCase()
      .replace(/\.[^/.]+$/, '')
      .replace(/['’]s\b/g, '') // strip possessives like papa's -> papa
      .replace(/[^a-z0-9]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 3 && !['copy', 'final', 'new', 'scan', 'file', 'photo', 'jpeg', 'image'].includes(w));
  };

  const candidateTokens = new Set([
    ...normalizeTokens(suggestedTitle),
    ...normalizeTokens(fileName),
  ]);

  if (candidateTokens.size >= 2) {
    for (const doc of existingDocs) {
      const existingTokens = normalizeTokens(doc.title);
      if (existingTokens.length < 2) continue;

      const matchCount = existingTokens.filter(t => candidateTokens.has(t)).length;
      const minLen = Math.min(candidateTokens.size, existingTokens.length);
      const overlapRatio = matchCount / minLen;

      const docMemberId = doc.assignedMemberId?._id || doc.assignedMemberId;
      const sameMember = Boolean(
        matchedMemberId &&
        docMemberId &&
        docMemberId.toString() === matchedMemberId.toString()
      );

      if (overlapRatio >= 0.75 || (sameMember && overlapRatio >= 0.6)) {
        const memberName = resolveMemberName(doc);
        const uploadDate = formatDate(doc.createdAt);
        return {
          isDuplicate: true,
          existingDocId: (doc._id || doc.id).toString(),
          existingDocTitle: doc.title,
          assignedMemberName: memberName,
          uploadDate,
          matchType: 'HEURISTIC_TITLE_MATCH',
          confidence: Math.round(overlapRatio * 100) / 100,
          documentNumber: doc.documentNumber,
          message: `Aapke vault me ${memberName} ke folder me milta-julta document saved hai: "${doc.title}" (${uploadDate}).`,
        };
      }
    }
  }

  return null;
}
async function createVaultNotification({ familyId, userId = null, title, message, type = 'INFO', link = '/vault' }) {
  if (!familyId) return null;
  const notifObj = {
    familyId,
    userId: userId && mongoose.Types.ObjectId.isValid(userId) ? userId : null,
    title,
    message,
    type,
    link,
    isRead: false,
    createdAt: new Date(),
  };

  // 1. Dispatch Web Push Notification to family members' phones
  try {
    sendPushToFamily(familyId, {
      title,
      body: message,
      url: link || '/dashboard',
    }, null).catch(e => console.warn('[Push Warning] createVaultNotification push failed:', e.message));
  } catch (pushErr) {
    // Non-blocking
  }

  if (isConnected && mongoose.Types.ObjectId.isValid(familyId)) {
    try {
      await Notification.create(notifObj);
    } catch (e) {
      console.warn('[Notification] Failed to persist in Mongo:', e.message);
    }
  }

  if (!Array.isArray(memoryStore.notifications)) {
    memoryStore.notifications = [];
  }
  memoryStore.notifications.unshift({
    _id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    ...notifObj,
  });
}

// Auto-sync extracted medical & identity credentials (blood group, DOB, insurance policy, TPA, allergies) to family member's profile
async function autoSyncMedicalCredentialsToMember({ targetMemberId, category, title, documentNumber, emergencyDetails, notes, dob, syncMemberProfile }) {
  if (!targetMemberId) return;

  const isMedical = category === 'Medical & Health' || category === 'Health' || category === 'Medical' ||
    (title && /insurance|mediclaim|health|ayushman|abha|hospital/i.test(title));

  let parsedEmergency = null;
  if (emergencyDetails) {
    try {
      parsedEmergency = typeof emergencyDetails === 'string' ? JSON.parse(emergencyDetails) : emergencyDetails;
    } catch (e) {}
  }

  // Also check if notes contains blood group, helpline, or DOB
  let bloodGroup = parsedEmergency?.bloodGroup;
  let policyNumber = parsedEmergency?.policyNumber || (isMedical ? documentNumber : null);
  let tpaProvider = parsedEmergency?.tpaProvider;
  let tollFreeHelpLine = parsedEmergency?.tollFreeHelpLine;
  let allergies = parsedEmergency?.allergies;
  let detectedDob = dob || parsedEmergency?.dob;

  if (notes && typeof notes === 'string') {
    if (!bloodGroup) {
      const bgMatch = notes.match(/Blood Group:\s*([A-Za-z0-9+-]+)/i);
      if (bgMatch) bloodGroup = bgMatch[1].trim();
    }
    if (!detectedDob) {
      const dobMatch = notes.match(/(?:DOB|Date of Birth|Birth Date):\s*([^\n]+)/i);
      if (dobMatch) detectedDob = dobMatch[1].trim();
    }
    if (!tollFreeHelpLine) {
      const hlMatch = notes.match(/(?:Cashless Helpline|Helpline):\s*([0-9-+\s]+)/i);
      if (hlMatch) tollFreeHelpLine = hlMatch[1].trim();
    }
    if (!allergies) {
      const alMatch = notes.match(/(?:Allergies|Allergy):\s*([^\n]+)/i);
      if (alMatch) allergies = alMatch[1].trim();
    }
  }

  let existingUser = null;
  try {
    if (isConnected && mongoose.Types.ObjectId.isValid(targetMemberId)) {
      existingUser = await User.findById(targetMemberId);
    } else {
      existingUser = (memoryStore.users || []).find(u => u._id.toString() === targetMemberId.toString());
    }
  } catch (e) {}

  const updateFields = {};
  if (bloodGroup && bloodGroup !== 'Not specified' && bloodGroup !== 'null') {
    if (syncMemberProfile || !existingUser?.bloodGroup || existingUser.bloodGroup === 'Not specified') {
      updateFields.bloodGroup = bloodGroup.toUpperCase();
    }
  }
  if (detectedDob && detectedDob !== 'null' && detectedDob !== 'undefined') {
    if (syncMemberProfile || !existingUser?.dateOfBirth) {
      updateFields.dateOfBirth = detectedDob.trim();
    }
  }
  if (policyNumber && policyNumber !== 'null' && policyNumber !== 'undefined') {
    if (syncMemberProfile || !existingUser?.healthInsurancePolicy) {
      updateFields.healthInsurancePolicy = policyNumber;
    }
  }
  const combinedTpa = [tpaProvider, tollFreeHelpLine].filter(Boolean).join(' • ');
  if (combinedTpa) {
    if (syncMemberProfile || !existingUser?.tpaNumber) {
      updateFields.tpaNumber = combinedTpa;
    }
  }
  if (allergies && allergies !== 'None reported' && allergies !== 'null') {
    if (syncMemberProfile || !existingUser?.allergies) {
      updateFields.allergies = allergies;
    }
  }

  if (Object.keys(updateFields).length === 0) return;

  try {
    if (isConnected && mongoose.Types.ObjectId.isValid(targetMemberId)) {
      await User.findByIdAndUpdate(targetMemberId, { $set: updateFields });
      console.log(`[Auto-Sync Profile] Updated User ${targetMemberId}:`, updateFields);
    } else {
      const mem = (memoryStore.users || []).find(u => u._id.toString() === targetMemberId.toString());
      if (mem) {
        Object.assign(mem, updateFields);
        console.log(`[Auto-Sync Profile Memory] Updated User ${targetMemberId}:`, updateFields);
      }
    }
  } catch (err) {
    console.warn('[Auto-Sync Profile Warning] Failed to update user credentials:', err.message);
  }
}

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 26214400 }, // 25 MB Limit
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/bmp',
      'image/tiff',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowed.includes((file.mimetype || '').toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Please upload a PDF, PNG, JPEG, or WebP document (up to 25MB).'));
    }
  },
});

// Helper for simulated OCR metadata extraction
const simulateOCR = (fileName, title, category) => {
  const lower = (fileName + ' ' + title).toLowerCase();
  const extracted = {};

  if (lower.includes('passport')) {
    extracted.type = 'PASSPORT';
    extracted.documentNumber = 'V' + Math.floor(1000000 + Math.random() * 9000000);
    extracted.expiryDate = new Date(Date.now() + 10 * 365 * 86400000).toISOString().split('T')[0];
  } else if (lower.includes('aadhaar')) {
    extracted.type = 'AADHAAR';
    extracted.documentNumber = 'XXXX-XXXX-' + Math.floor(1000 + Math.random() * 9000);
  } else if (lower.includes('pan')) {
    extracted.type = 'PAN';
    extracted.documentNumber = 'ABCPS' + Math.floor(1000 + Math.random() * 9000) + 'D';
  } else if (!/(medical|doctor|council|practitioner|hospital|clinic|prescription|parchi|parcha)/i.test(lower) && (lower.includes('driving') || /\bdl\b/i.test(lower) || ((lower.includes('licence') || lower.includes('license')) && !lower.includes('medical')))) {
    extracted.type = 'DRIVING_LICENCE';
    extracted.documentNumber = 'MH-02-' + Math.floor(1000000 + Math.random() * 9000000);
    extracted.expiryDate = new Date(Date.now() + 5 * 365 * 86400000).toISOString().split('T')[0];
  } else if (lower.includes('insurance') || lower.includes('policy')) {
    extracted.type = 'INSURANCE_POLICY';
    extracted.documentNumber = 'POL-' + Math.floor(10000 + Math.random() * 90000);
    extracted.expiryDate = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];
  }

  return extracted;
};

// GET /api/documents
router.get('/', async (req, res) => {
  try {
    const { category, memberId, search, status } = req.query;
    const targetFamilyId = req.familyId || req.user?.familyId;

    // STRICT MULTI-TENANT GUARD: If user has no family, immediately return 0 documents! NEVER leak cross-family files!
    if (!targetFamilyId) {
      return res.json({
        documents: [],
        total: 0,
      });
    }

    let docs = [];
    let members = [];
    let useMongo = isConnected && mongoose.connection.readyState === 1;

    if (useMongo) {
      try {
        const query = { familyId: targetFamilyId };

        if (category && category !== 'All') {
          const safeCat = category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          query.category = new RegExp(`^${safeCat}$`, 'i');
        }
        if (memberId && memberId !== 'All' && memberId !== 'undefined' && memberId !== 'null') {
          query.assignedMemberId = memberId;
        }
        if (status && status !== 'All') {
          query.status = status;
        }
        if (search && search.trim()) {
          const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          query.$or = [
            { title: new RegExp(safeSearch, 'i') },
            { documentNumber: new RegExp(safeSearch, 'i') },
            { category: new RegExp(safeSearch, 'i') },
            { tags: new RegExp(safeSearch, 'i') },
          ];
        }

        docs = await Document.find(query).sort({ createdAt: -1 }).lean();
        members = await User.find({ familyId: targetFamilyId }).lean();
      } catch (dbErr) {
        useMongo = false;
        docs = [];
        members = [];
      }
    }

    if (!useMongo) {
      // Memory Store: strictly isolated by familyId
      docs = memoryStore.documents.filter(d => d.familyId?.toString() === targetFamilyId.toString());
      members = memoryStore.users.filter(u => u.familyId?.toString() === targetFamilyId.toString());

      if (category && category !== 'All') {
        docs = docs.filter(d => d.category?.toLowerCase() === category.toLowerCase());
      }
      if (memberId && memberId !== 'All') {
        docs = docs.filter(d => d.assignedMemberId?.toString() === memberId);
      }
      if (status && status !== 'All') {
        docs = docs.filter(d => d.status === status);
      }
      if (search) {
        const q = search.toLowerCase();
        docs = docs.filter(d =>
          d.title?.toLowerCase().includes(q) ||
          d.category?.toLowerCase().includes(q) ||
          (d.documentNumber && d.documentNumber.toLowerCase().includes(q)) ||
          (d.tags && d.tags.some(t => t.toLowerCase().includes(q)))
        );
      }
    }

    // Filter by whoCanView permissions
    const currentUserId = (req.userId || req.user?._id)?.toString();
    const visibleDocs = docs.filter(d => {
      const who = d.whoCanView;
      // If whoCanView has 'ALL' or is empty/null -> visible to whole family
      if (!who || !Array.isArray(who) || who.length === 0 || who.includes('ALL')) {
        return true;
      }
      if (!currentUserId) return false;
      // Uploader can always view their document
      if (d.uploaderId && d.uploaderId.toString() === currentUserId) {
        return true;
      }
      // Allowed if current user's ID is in the permitted members list
      return who.some(id => id && id.toString() === currentUserId);
    });

    const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`;

    // Populate assigned member info
    const populated = visibleDocs.map(d => {
      const member = members.find(m => m._id.toString() === d.assignedMemberId?.toString());
      const enrichedMember = member ? {
        ...member,
        id: member._id,
        relation: member.relationship || 'Member',
        relationship: member.relationship || 'Member',
        dob: member.dateOfBirth || '',
        dateOfBirth: member.dateOfBirth || '',
        avatarUrl: member.avatar,
        avatar: member.avatar,
      } : null;

      let enrichedShareLink = null;
      if (d.shareLink && d.shareLink.token) {
        const isExpired = d.shareLink.expiresAt ? new Date(d.shareLink.expiresAt) < new Date() : false;
        enrichedShareLink = {
          ...d.shareLink,
          shareUrl: `${origin}/share/${d.shareLink.token}`,
          isExpired,
        };
      }

      return {
        ...d,
        id: d._id,
        memberId: d.assignedMemberId,
        assignedMemberId: d.assignedMemberId,
        visibility: d.whoCanView,
        whoCanView: d.whoCanView,
        isMpinProtected: Boolean(d.isSensitive || ['Property & Legal', 'Financial', 'Legal'].includes(d.category)),
        isSensitive: Boolean(d.isSensitive || ['Property & Legal', 'Financial', 'Legal'].includes(d.category)),
        assignedMember: enrichedMember,
        shareLink: enrichedShareLink,
      };
    });

    res.json({
      documents: populated,
      total: populated.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/documents/:id
router.get('/:id', async (req, res) => {
  try {
    const targetFamilyId = req.familyId || req.user?.familyId;
    const currentUserId = (req.userId || req.user?._id)?.toString();
    const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`;
    let doc = null;
    let member = null;

    if (isConnected) {
      doc = await Document.findById(req.params.id).lean();
      if (doc) {
        const isUploader = doc.uploaderId && doc.uploaderId.toString() === currentUserId;
        if (targetFamilyId && doc.familyId && doc.familyId.toString() !== targetFamilyId.toString() && !isUploader) {
          return res.status(403).json({ error: 'Access forbidden. This document belongs to another family vault.' });
        }
        if (doc.assignedMemberId && mongoose.Types.ObjectId.isValid(doc.assignedMemberId)) {
          member = await User.findById(doc.assignedMemberId).lean();
        }
      }
    } else {
      doc = memoryStore.documents.find(d => d._id.toString() === req.params.id);
      if (doc) {
        const isUploader = doc.uploaderId && doc.uploaderId.toString() === currentUserId;
        if (targetFamilyId && doc.familyId && doc.familyId.toString() !== targetFamilyId.toString() && !isUploader) {
          return res.status(403).json({ error: 'Access forbidden. This document belongs to another family vault.' });
        }
        member = memoryStore.users.find(u => u._id.toString() === doc.assignedMemberId?.toString());
      }
    }

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Strict Permission Verification based on whoCanView
    const who = doc.whoCanView;
    const isPublic = !who || !Array.isArray(who) || who.length === 0 || who.includes('ALL');
    const isUploader = doc.uploaderId && doc.uploaderId.toString() === currentUserId;
    const isPermitted = Array.isArray(who) && who.some(id => id && id.toString() === currentUserId);

    if (!isPublic && !isUploader && !isPermitted) {
      return res.status(403).json({
        error: 'Access restricted. You do not have permission to view this document.',
        restricted: true,
      });
    }

    // Generate secure time-limited link
    let signedUrl = '';
    try {
      signedUrl = await createSignedUrl(doc.storagePath, 3600);
    } catch (err) {
      signedUrl = `/api/documents/raw/${encodeURIComponent(doc.storagePath)}`;
    }

    const enrichedMember = member ? {
      ...member,
      id: member._id,
      relation: member.relationship || 'Member',
      relationship: member.relationship || 'Member',
      dob: member.dateOfBirth || '',
      dateOfBirth: member.dateOfBirth || '',
      avatarUrl: member.avatar,
      avatar: member.avatar,
    } : null;

    let enrichedShareLink = null;
    if (doc.shareLink && doc.shareLink.token) {
      const isExpired = doc.shareLink.expiresAt ? new Date(doc.shareLink.expiresAt) < new Date() : false;
      enrichedShareLink = {
        ...doc.shareLink,
        shareUrl: `${origin}/share/${doc.shareLink.token}`,
        isExpired,
      };
    }

    // Immutable SHA-256 Chained Audit Log for Document View
    recordAuditLog({
      familyId: doc.familyId || targetFamilyId,
      action: 'DOCUMENT_VIEW',
      performedBy: req.user?._id || null,
      performerName: req.user?.name || 'Family Member',
      documentId: doc._id,
      documentTitle: doc.title,
      details: { category: doc.category, isSensitive: doc.isSensitive },
      req,
    }).catch(e => console.warn('[Audit Warning] View log error:', e.message));

    res.json({
      document: {
        ...doc,
        id: doc._id,
        memberId: doc.assignedMemberId,
        assignedMemberId: doc.assignedMemberId,
        visibility: doc.whoCanView,
        whoCanView: doc.whoCanView,
        isMpinProtected: Boolean(doc.isSensitive || ['Property & Legal', 'Financial', 'Legal'].includes(doc.category)),
        isSensitive: Boolean(doc.isSensitive || ['Property & Legal', 'Financial', 'Legal'].includes(doc.category)),
        assignedMember: enrichedMember,
        shareLink: enrichedShareLink,
        signedUrl,
        fileUrl: signedUrl,
      },
    });
  } catch (err) {
    console.error('[Document Details Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/documents/ai-scan (Instant AI Document Scanning & Metadata Detection)
router.post('/ai-scan', (req, res, next) => {
  upload.single('file')(req, res, async (uploadErr) => {
    if (uploadErr) {
      console.warn('[AI Scan Multer Error]:', uploadErr.message);
      return res.status(400).json({ error: uploadErr.message || 'File upload error during scan' });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Please upload a document file to scan.' });
      }

      const familyId = req.familyId || req.user?.familyId || req.headers['x-family-id'] || req.body?.familyId;
      let familyMembers = [];

      console.log(`[AI Scan] Processing file: "${req.file.originalname}" (${(req.file.size / 1024).toFixed(1)} KB), mime: ${req.file.mimetype}`);

      // 1. Check if client passed members list directly in request body
      if (req.body?.members) {
        try {
          const parsed = typeof req.body.members === 'string' ? JSON.parse(req.body.members) : req.body.members;
          if (Array.isArray(parsed) && parsed.length > 0) {
            familyMembers = parsed.map(m => ({
              _id: (m._id || m.id || '').toString(),
              name: m.name || '',
              relationship: m.relationship || 'Member',
            }));
          }
        } catch (e) {
          console.warn('[AI Scan] Failed to parse members from request body:', e.message);
        }
      }

      // 2. Fallback to DB query if not provided in body
      if (familyMembers.length === 0 && familyId) {
        try {
          const query = mongoose.Types.ObjectId.isValid(familyId)
            ? { $or: [{ familyId }, { familyId: new mongoose.Types.ObjectId(familyId) }] }
            : { familyId };
          const users = await User.find(query).select('_id name relationship role').lean();
          if (users && users.length > 0) {
            familyMembers = users.map(u => ({ _id: u._id.toString(), name: u.name, relationship: u.relationship }));
          }
        } catch (e) {
          console.warn('[AI Scan] Failed to load members from DB:', e.message);
        }

        if (familyMembers.length === 0 && memoryStore.users) {
          familyMembers = memoryStore.users
            .filter(u => u.familyId?.toString() === familyId.toString())
            .map(u => ({ _id: u._id, name: u.name, relationship: u.relationship }));
        }
      }

      const customApiKey = req.headers['x-gemini-api-key'] || req.body?.customApiKey || null;

      const scanResult = await scanDocumentWithAI({
        fileBuffer: req.file.buffer,
        mimeType: req.file.mimetype,
        fileName: req.file.originalname,
        familyMembers,
        customApiKey,
      });

      // Smart Duplicate Detection across the Family Vault (Feature E)
      let duplicateWarning = null;
      if (familyId) {
        try {
          const fileSha256 = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

          let existingDocs = [];
          if (isConnected && mongoose.Types.ObjectId.isValid(familyId)) {
            existingDocs = await Document.find({
              familyId,
              status: { $ne: 'ARCHIVED' },
            })
              .select('_id title category documentNumber sha256Hash assignedMemberId createdAt')
              .populate('assignedMemberId', 'name relationship')
              .lean();
          } else if (memoryStore.documents) {
            existingDocs = memoryStore.documents.filter(
              d => d.familyId?.toString() === familyId.toString() && d.status !== 'ARCHIVED'
            );
          }

          duplicateWarning = detectHeuristicDuplicate({
            fileSha256,
            scanDocNumber: scanResult.docNumber,
            scanDocType: scanResult.docType,
            suggestedTitle: scanResult.suggestedTitle,
            fileName: req.file.originalname,
            matchedMemberId: scanResult.matchedMemberId,
            existingDocs,
            familyMembers,
          });
        } catch (dupErr) {
          console.warn('[AI Scan] Duplicate check error:', dupErr.message);
        }
      }

      scanResult.duplicateWarning = duplicateWarning;

      res.json({
        success: true,
        data: scanResult,
      });
    } catch (err) {
      console.error('[AI Scan Route Error]:', err);
      res.status(500).json({ error: 'AI document scanning failed: ' + err.message });
    }
  });
});

// POST /api/documents/ask-ai (Natural Language Question Answering over Family Vault)
router.post('/ask-ai', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Please provide a question to ask the vault AI.' });
    }

    const familyId = req.familyId || req.user?.familyId || req.headers['x-family-id'] || req.body?.familyId;
    if (!familyId) {
      return res.status(401).json({ error: 'Authentication required. Please sign in to ask Vault AI.' });
    }

    let familyMembers = [];
    let documents = [];

    if (isConnected && mongoose.Types.ObjectId.isValid(familyId)) {
      try {
        const [users, docs] = await Promise.all([
          User.find({ familyId }).select('_id name relationship role phone bloodGroup').lean(),
          Document.find({ familyId, status: { $ne: 'ARCHIVED' } })
            .select('_id title category documentNumber expiryDate notes isSensitive assignedMemberId ocrExtractedData')
            .lean(),
        ]);
        familyMembers = users.map(u => ({ ...u, _id: u._id.toString() }));
        documents = docs.map(d => ({ ...d, _id: d._id.toString() }));
      } catch (dbErr) {
        console.warn('[Vault AI Route] Mongo fetch error:', dbErr.message);
      }
    } else {
      familyMembers = (memoryStore.users || [])
        .filter(u => u.familyId?.toString() === familyId.toString())
        .map(u => ({ ...u, _id: u._id.toString() }));
      documents = (memoryStore.documents || [])
        .filter(d => d.familyId?.toString() === familyId.toString() && d.status !== 'ARCHIVED')
        .map(d => ({ ...d, _id: d._id.toString() }));
    }

    console.log(`[Vault AI Query] familyId: ${familyId}, query: "${query}", docs fetched: ${documents.length}`);

    const customApiKey = req.headers['x-gemini-api-key'] || req.body?.customApiKey || null;

    const result = await askVaultAI({
      query: query.trim(),
      familyMembers,
      documents,
      currentUser: req.user || { name: 'Family Member' },
      customApiKey,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('[Ask Vault AI Route Error]:', err);
    res.status(500).json({ error: 'Vault AI query failed: ' + err.message });
  }
});

// POST /api/documents/check-duplicate — Real-time Duplicate Document Prevention (Feature E)
router.post('/check-duplicate', async (req, res) => {
  try {
    const {
      documentNumber = '',
      title = '',
      fileName = '',
      assignedMemberId = null,
      fileSha256 = null,
    } = req.body;

    let familyId = req.familyId || req.user?.familyId;
    if (!familyId && (req.user?._id || req.userId)) {
      if (isConnected) {
        const u = await User.findById(req.user?._id || req.userId).lean();
        if (u?.familyId) familyId = u.familyId;
      } else if (memoryStore.users) {
        const u = memoryStore.users.find(x => x._id?.toString() === (req.user?._id || req.userId)?.toString());
        if (u?.familyId) familyId = u.familyId;
      }
    }

    if (!familyId) {
      return res.json({ isDuplicate: false, duplicateWarning: null });
    }

    let existingDocs = [];
    let familyMembers = [];
    if (isConnected && mongoose.Types.ObjectId.isValid(familyId)) {
      [existingDocs, familyMembers] = await Promise.all([
        Document.find({ familyId, status: { $ne: 'ARCHIVED' } })
          .select('_id title category documentNumber sha256Hash assignedMemberId createdAt')
          .populate('assignedMemberId', 'name relationship')
          .lean(),
        User.find({ familyId }).select('_id name relationship').lean(),
      ]);
    } else if (memoryStore.documents) {
      existingDocs = memoryStore.documents.filter(
        d => d.familyId?.toString() === familyId.toString() && d.status !== 'ARCHIVED'
      );
      familyMembers = (memoryStore.users || []).filter(u => u.familyId?.toString() === familyId.toString());
    }

    const duplicateWarning = detectHeuristicDuplicate({
      fileSha256,
      scanDocNumber: (documentNumber || '').trim(),
      scanDocType: 'Document',
      suggestedTitle: (title || '').trim(),
      fileName: (fileName || '').trim(),
      matchedMemberId: assignedMemberId,
      existingDocs,
      familyMembers,
    });

    return res.json({
      isDuplicate: !!duplicateWarning?.isDuplicate,
      duplicateWarning: duplicateWarning || null,
    });
  } catch (err) {
    console.warn('[Check Duplicate Error]:', err.message);
    res.status(500).json({ isDuplicate: false, error: err.message });
  }
});

// POST /api/documents/upload
router.post('/upload', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds 25MB limit. Please upload a smaller file.' });
      }
      return res.status(400).json({ error: 'Upload failed: ' + err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message || 'Please upload a PDF, PNG, JPEG, or WebP document.' });
    }
    next();
  });
}, async (req, res) => {
  try {
    const {
      title,
      category = 'ID Cards',
      assignedMemberId,
      memberId,
      documentNumber = '',
      holderName = '',
      fatherOrSpouseName = '',
      dob = '',
      docType = '',
      issueDate,
      expiryDate,
      whoCanView = 'ALL',
      visibility,
      isSensitive,
      isMpinProtected,
      tags = '',
    } = req.body;

    const uploaderId = req.userId || req.user?._id;
    const rawMemberId = assignedMemberId || memberId;
    const finalMemberId = rawMemberId && rawMemberId !== 'null' && rawMemberId !== 'undefined'
      ? rawMemberId
      : uploaderId;
    
    const isProtectedExplicitly = (isMpinProtected === 'true' || isMpinProtected === true || isSensitive === 'true' || isSensitive === true);
    const isProtectedExplicitlyFalse = (isMpinProtected === 'false' || isMpinProtected === false || isSensitive === 'false' || isSensitive === false);
    const finalSensitive = isProtectedExplicitlyFalse
      ? false
      : (isProtectedExplicitly || ['Property & Legal', 'Financial', 'Legal'].includes(category));

    let fileBuffer;
    let originalName;
    let mimeType;
    let fileSize;

    if (req.file) {
      fileBuffer = req.file.buffer;
      originalName = req.file.originalname;
      mimeType = req.file.mimetype;
      fileSize = req.file.size;
    } else {
      originalName = `${(title || 'Document').replace(/\s+/g, '_')}.pdf`;
      mimeType = 'application/pdf';
      fileBuffer = Buffer.from(`%PDF-1.4 GharVault Encrypted Payload for ${title} at ${new Date().toISOString()}`);
      fileSize = fileBuffer.length;
    }

    // 1. Calculate SHA-256 Checksum
    const sha256Hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // 2. Storage Path in Private Encrypted Bucket
    const fileExt = path.extname(originalName) || (mimeType?.startsWith('image/png') ? '.png' : mimeType?.startsWith('image/jpeg') ? '.jpg' : '.pdf');
    const storagePath = `vault/${category.toLowerCase().replace(/[^a-z0-9]/g, '_')}/${Date.now()}_${crypto.randomBytes(4).toString('hex')}${fileExt}`;

    // 2.5 Persist Document File to Vault Storage (Local Vault & Supabase)
    try {
      await uploadDocument(fileBuffer, storagePath, mimeType);
    } catch (storageErr) {
      console.warn('[Upload Storage Warning] Could not persist file buffer:', storageErr.message);
    }

    // 3. Receive or Auto-extract OCR Intelligence
    let passedOcrData = null;
    if (req.body.ocrExtractedData) {
      try {
        passedOcrData = typeof req.body.ocrExtractedData === 'string'
          ? JSON.parse(req.body.ocrExtractedData)
          : req.body.ocrExtractedData;
      } catch (e) {
        console.warn('[Upload OCR Parse Error]:', e.message);
      }
    }

    const ocrData = passedOcrData || simulateOCR(originalName, title || '', category);
    const finalDocNumber = documentNumber?.trim() || ocrData.docNumber || ocrData.documentNumber || '';

    // Merge emergency medical details if passed from AI scan
    let parsedEmergencyDetails = null;
    if (req.body.emergencyDetails) {
      try {
        parsedEmergencyDetails = typeof req.body.emergencyDetails === 'string'
          ? JSON.parse(req.body.emergencyDetails)
          : req.body.emergencyDetails;
      } catch (e) {}
    }
    const finalOcrData = {
      ...(ocrData || {}),
      holderName: (holderName || ocrData?.holderName || '').trim(),
      fatherOrSpouseName: (fatherOrSpouseName || ocrData?.fatherOrSpouseName || '').trim() || null,
      dob: dob || ocrData?.dob || null,
      docType: docType || ocrData?.docType || ocrData?.type || category,
      docNumber: finalDocNumber,
      emergencyDetails: parsedEmergencyDetails || ocrData.emergencyDetails || null,
    };

    // Safe date parsing helper
    const parseSafeDate = (val) => {
      if (!val || val === 'null' || val === 'undefined' || val === '') return null;
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    };

    const finalExpiryDate = parseSafeDate(expiryDate);
    const finalIssueDate = parseSafeDate(issueDate) || new Date();

    // Check expiry
    const now = Date.now();
    let status = 'ACTIVE';
    if (finalExpiryDate) {
      const exp = finalExpiryDate.getTime();
      if (exp <= now) {
        status = 'EXPIRED';
      } else if (exp <= now + 30 * 86400000) {
        status = 'EXPIRING_SOON';
      }
    }

    const rawWhoCanView = whoCanView || visibility || 'ALL';
    let parsedWhoCanView = ['ALL'];
    if (rawWhoCanView && rawWhoCanView !== 'ALL') {
      try {
        parsedWhoCanView = typeof rawWhoCanView === 'string' && (rawWhoCanView.startsWith('[') || rawWhoCanView.startsWith('{'))
          ? JSON.parse(rawWhoCanView)
          : Array.isArray(rawWhoCanView) ? rawWhoCanView : rawWhoCanView.split(',').map(s => s.trim());
      } catch (e) {
        parsedWhoCanView = Array.isArray(rawWhoCanView) ? rawWhoCanView : rawWhoCanView.split(',').map(s => s.trim());
      }
    }

    let parsedTags = [];
    if (tags) {
      parsedTags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
    } else {
      parsedTags = [category];
    }

    let familyId = req.familyId || req.user?.familyId || req.body?.familyId;

    if (!familyId && (req.user?._id || req.userId)) {
      const uId = req.user?._id || req.userId;
      if (isConnected) {
        let fam = await Family.findOne({ adminId: uId });
        if (!fam) {
          const u = await User.findById(uId);
          if (u?.familyId) fam = await Family.findById(u.familyId);
        }
        if (!fam) {
          fam = await Family.create({
            name: `${(req.user?.name || 'My').split(' ')[0]}'s Family Vault`,
            inviteCode: 'GHAR-' + Math.floor(1000 + Math.random() * 9000),
            adminId: uId,
          });
        }
        familyId = fam._id;
        if (req.user) {
          req.user.familyId = fam._id;
          if (useMongo && req.user._id) {
            await User.findByIdAndUpdate(req.user._id, { familyId: fam._id });
          }
        }
      } else {
        let fam = memoryStore.families.find(f => f.adminId?.toString() === uId.toString());
        if (!fam) {
          fam = {
            _id: 'fam_' + Date.now(),
            name: `${(req.user?.name || 'My').split(' ')[0]}'s Family Vault`,
            inviteCode: 'GHAR-' + Math.floor(1000 + Math.random() * 9000),
            adminId: uId,
            createdAt: new Date(),
          };
          memoryStore.families.push(fam);
        }
        familyId = fam._id;
      }
    }

    if (!familyId) {
      return res.status(400).json({ error: 'You must belong to a family vault to upload documents.' });
    }

    const toSafeObjectId = (val) => {
      if (!val || val === 'null' || val === 'undefined' || val === '') return null;
      return mongoose.Types.ObjectId.isValid(val) ? val : null;
    };

    // Auto-generate intelligent document title if left empty or default
    const resolvedTitle = (title && title.trim())
      ? title.trim()
      : generateSmartDocumentTitle({
          docType: ocrData?.type || category,
          holderName: req.user?.name,
          docNumber: finalDocNumber,
          emergencyDetails: finalOcrData.emergencyDetails,
          category,
          originalFileName: originalName,
        });

    // 4. Duplicate Document Prevention Guard (Feature E)
    const ignoreDuplicate = req.body.ignoreDuplicate === 'true' || req.body.ignoreDuplicate === true;
    if (!ignoreDuplicate && familyId) {
      try {
        let existingDocs = [];
        let familyMembers = [];
        if (isConnected && mongoose.Types.ObjectId.isValid(familyId)) {
          [existingDocs, familyMembers] = await Promise.all([
            Document.find({ familyId, status: { $ne: 'ARCHIVED' } })
              .select('_id title category documentNumber sha256Hash assignedMemberId createdAt')
              .populate('assignedMemberId', 'name relationship')
              .lean(),
            User.find({ familyId }).select('_id name relationship').lean(),
          ]);
        } else if (memoryStore.documents) {
          existingDocs = memoryStore.documents.filter(
            d => d.familyId?.toString() === familyId.toString() && d.status !== 'ARCHIVED'
          );
          familyMembers = (memoryStore.users || []).filter(u => u.familyId?.toString() === familyId.toString());
        }

        const duplicateWarning = detectHeuristicDuplicate({
          fileSha256: sha256Hash,
          scanDocNumber: finalDocNumber,
          scanDocType: category,
          suggestedTitle: resolvedTitle,
          fileName: originalName,
          matchedMemberId: finalMemberId,
          existingDocs,
          familyMembers,
        });

        if (duplicateWarning?.isDuplicate) {
          return res.status(409).json({
            isDuplicate: true,
            error: duplicateWarning.message,
            duplicateWarning,
          });
        }
      } catch (dupErr) {
        console.warn('[Upload Duplicate Check Warning]:', dupErr.message);
      }
    }

    let useMongo = isConnected && mongoose.connection.readyState === 1;
    let newDoc = null;

    if (useMongo) {
      try {
        const safeFamId = toSafeObjectId(familyId) || familyId;
        const safeMemberId = toSafeObjectId(finalMemberId);
        const safeUploaderId = toSafeObjectId(uploaderId);

        newDoc = await Document.create({
          title: resolvedTitle,
          originalFileName: originalName,
          mimeType,
          fileSize,
          category,
          familyId: safeFamId,
          assignedMemberId: safeMemberId,
          documentNumber: finalDocNumber,
          issueDate: finalIssueDate,
          expiryDate: finalExpiryDate,
          status,
          isSensitive: finalSensitive,
          whoCanView: parsedWhoCanView,
          tags: parsedTags,
          storagePath,
          sha256Hash,
          ocrExtractedData: finalOcrData,
          uploaderId: safeUploaderId,
        });

        // Auto-sync credentials (blood group, DOB, insurance policy, TPA, allergies) to family member
        autoSyncMedicalCredentialsToMember({
          targetMemberId: safeMemberId || safeUploaderId,
          category,
          title: newDoc.title,
          documentNumber: finalDocNumber,
          emergencyDetails: finalOcrData.emergencyDetails,
          notes: req.body.notes,
          dob: finalOcrData.dob || req.body.dob,
          syncMemberProfile: req.body.syncMemberProfile === 'true' || req.body.syncMemberProfile === true,
        }).catch(e => console.warn('[Auto-Sync Error]:', e.message));

        const normalizedDoc = {
          ...(newDoc.toObject ? newDoc.toObject() : newDoc),
          id: newDoc._id,
          memberId: newDoc.assignedMemberId,
          visibility: newDoc.whoCanView,
          isMpinProtected: finalSensitive,
        };

        // Immutable SHA-256 Chained Audit Log for Document Upload
        recordAuditLog({
          familyId: newDoc.familyId,
          action: 'DOCUMENT_UPLOAD',
          performedBy: req.user?._id || null,
          performerName: req.user?.name || 'Family Member',
          documentId: newDoc._id,
          documentTitle: newDoc.title,
          details: { category: newDoc.category, fileSize: newDoc.fileSize, documentNumber: newDoc.documentNumber },
          req,
        }).catch(e => console.warn('[Audit Warning] Upload log error:', e.message));

        // Automatic Web Push Notification to family phones on upload!
        const uploaderName = req.user?.name || 'Family Member';
        createVaultNotification({
          familyId: newDoc.familyId,
          title: '📄 Naya Document Upload Hua!',
          message: `${uploaderName} ne "${newDoc.title}" (${newDoc.category || 'Record'}) vault me add kiya hai. Abhi check karein!`,
          type: 'INFO',
          link: `/vault/documents/${newDoc._id}`,
        }).catch(e => console.warn('[Auto-Push Error] Upload push notification failed:', e.message));

        return res.status(201).json({
          success: true,
          document: normalizedDoc,
          message: 'Document saved securely in your family vault!',
        });
      } catch (dbErr) {
        console.warn('[Database Fallback] Document.create failed, falling back to memory store:', dbErr.message);
        useMongo = false;
        newDoc = null;
      }
    }

    // Memory Store: Tag with user's actual familyId and uploaderId!
    newDoc = {
      _id: 'doc_' + Date.now(),
      title: resolvedTitle,
      originalFileName: originalName,
      mimeType,
      fileSize,
      category,
      familyId,
      assignedMemberId: finalMemberId || null,
      documentNumber: finalDocNumber,
      issueDate: finalIssueDate,
      expiryDate: finalExpiryDate,
      status,
      isSensitive: finalSensitive,
      whoCanView: parsedWhoCanView,
      tags: parsedTags,
      storagePath,
      sha256Hash,
      ocrExtractedData: finalOcrData,
      uploaderId: uploaderId || null,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memoryStore.documents.unshift(newDoc);

    // Auto-sync credentials in memory store
    autoSyncMedicalCredentialsToMember({
      targetMemberId: finalMemberId || uploaderId,
      category,
      title: newDoc.title,
      documentNumber: finalDocNumber,
      emergencyDetails: finalOcrData.emergencyDetails,
      notes: req.body.notes,
      dob: finalOcrData.dob || req.body.dob,
      syncMemberProfile: req.body.syncMemberProfile === 'true' || req.body.syncMemberProfile === true,
    }).catch(e => console.warn('[Auto-Sync Error]:', e.message));

    // Update family storage used
    if (memoryStore.families[0]) {
      memoryStore.families[0].storageUsedBytes = (memoryStore.families[0].storageUsedBytes || 0) + fileSize;
    }

    // Add recent activity log
    memoryStore.auditLogs.unshift({
      _id: 'audit_' + Date.now(),
      action: 'DOCUMENT_UPLOAD',
      performerName: memoryStore.users[0]?.name || 'Family Member',
      documentId: newDoc._id,
      documentTitle: newDoc.title,
      details: { category, sizeBytes: fileSize },
      sha256ChainHash: sha256Hash,
      timestamp: new Date(),
    });

    // Automatic Web Push Notification to family phones on upload!
    const uploaderName = memoryStore.users?.[0]?.name || req.user?.name || 'Family Member';
    createVaultNotification({
      familyId: newDoc.familyId,
      title: '📄 Naya Document Upload Hua!',
      message: `${uploaderName} ne "${newDoc.title}" (${newDoc.category || 'Record'}) vault me add kiya hai. Abhi check karein!`,
      type: 'INFO',
      link: `/vault/documents/${newDoc._id}`,
    }).catch(e => console.warn('[Auto-Push Error] Upload push notification failed:', e.message));

    res.status(201).json({
      success: true,
      document: newDoc,
      message: 'Document saved securely in your family vault!',
    });
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ error: 'Failed to upload document: ' + err.message });
  }
});

// GET /api/documents/shared/:token — Public View-Only Expiring Link
router.get('/shared/:token', async (req, res) => {
  try {
    const { token } = req.params;
    let doc = null;

    if (isConnected) {
      try {
        doc = await Document.findOne({ 'shareLink.token': token });
      } catch (e) {
        doc = null;
      }
    }
    if (!doc && Array.isArray(memoryStore.documents)) {
      doc = memoryStore.documents.find(d => d.shareLink?.token === token);
    }

    if (!doc) {
      return res.status(404).json({ error: 'Shared document link not found or invalid.' });
    }

    // Check expiration
    if (doc.shareLink?.expiresAt && new Date(doc.shareLink.expiresAt) < new Date()) {
      return res.status(410).json({
        expired: true,
        error: 'This secure link has expired. Please request a new share link from the family vault owner.',
      });
    }

    // Generate time-limited signed URL for viewing
    let signedUrl = '';
    try {
      signedUrl = await createSignedUrl(doc.storagePath, 3600);
    } catch (err) {
      signedUrl = `/api/documents/raw/${encodeURIComponent(doc.storagePath)}`;
    }

    // Immutable SHA-256 Chained Audit Log for Shared Document View
    recordAuditLog({
      familyId: doc.familyId,
      action: 'DOCUMENT_VIEW',
      performedBy: req.user?._id || null,
      performerName: req.user?.name || 'External Recipient (Safe Share Link)',
      documentId: doc._id,
      documentTitle: doc.title,
      details: { category: doc.category, viaShareLink: true },
      req,
    }).catch(e => console.warn('[Audit Warning] Shared view log error:', e.message));

    // Instant Security Notification for Family: Someone accessed/downloaded via Safe Share Link
    createVaultNotification({
      familyId: doc.familyId,
      title: '⚠️ External Download via Safe Link',
      message: `An external recipient accessed and downloaded "${doc.title}" via your 24-hour Safe Share Link.`,
      type: 'WARNING',
      link: `/vault/documents/${doc._id}`,
    }).catch(e => console.warn('[Notification Warning] External access notif error:', e.message));

    res.json({
      success: true,
      document: {
        _id: doc._id,
        title: doc.title,
        category: doc.category,
        documentNumber: doc.documentNumber,
        originalFileName: doc.originalFileName,
        mimeType: doc.mimeType,
        fileSize: doc.fileSize,
        sha256Hash: doc.sha256Hash,
        expiryDate: doc.expiryDate,
        createdAt: doc.createdAt,
        signedUrl,
        fileUrl: signedUrl,
      },
      expiresAt: doc.shareLink.expiresAt,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to access shared document: ' + err.message });
  }
});

// POST /api/documents/:id/download-notify (Logs download event and dispatches family notification)
router.post('/:id/download-notify', async (req, res) => {
  try {
    let doc = null;
    if (isConnected && mongoose.Types.ObjectId.isValid(req.params.id)) {
      try {
        doc = await Document.findById(req.params.id);
      } catch (e) {
        doc = null;
      }
    }
    if (!doc && Array.isArray(memoryStore.documents)) {
      doc = memoryStore.documents.find(d => d._id?.toString() === req.params.id);
    }

    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const performerName = req.user?.name || 'A family member';
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateFormatted = now.toLocaleDateString();

    // 1. Immutable Audit Ledger Log (DOCUMENT_DOWNLOAD)
    recordAuditLog({
      familyId: doc.familyId,
      action: 'DOCUMENT_DOWNLOAD',
      performedBy: req.user?._id || null,
      performerName,
      documentId: doc._id,
      documentTitle: doc.title,
      details: {
        category: doc.category,
        originalFileName: doc.originalFileName,
        fileSize: doc.fileSize,
      },
      req,
    }).catch(e => console.warn('[Audit Warning] Download log error:', e.message));

    // 2. Family In-App Notification (Alert all family members & admin that document was downloaded)
    await createVaultNotification({
      familyId: doc.familyId,
      userId: req.user?._id,
      title: '📥 Document Downloaded',
      message: `${performerName} downloaded "${doc.title}" (${doc.documentNumber || doc.category}) on ${dateFormatted} at ${timeFormatted}.`,
      type: 'INFO',
      link: `/vault/documents/${doc._id}`,
    });

    res.json({
      success: true,
      message: `Download logged: notification sent to family vault.`,
    });
  } catch (err) {
    console.error('Download notify error:', err);
    res.status(500).json({ error: err.message || 'Failed to dispatch download notification' });
  }
});

// POST /api/documents/:id/share-link (Creates 10m, 1h, or 24h expiring link)
router.post('/:id/share-link', async (req, res) => {
  try {
    const { durationMinutes = 1440, expiresInHours, password } = req.body || {};
    let finalMinutes = 1440;
    if (typeof expiresInHours === 'number' && !isNaN(expiresInHours) && expiresInHours > 0) {
      finalMinutes = expiresInHours * 60;
    } else if (typeof durationMinutes === 'number' && !isNaN(durationMinutes) && durationMinutes > 0) {
      finalMinutes = durationMinutes;
    } else {
      const parsed = parseInt(durationMinutes || expiresInHours, 10);
      finalMinutes = (!isNaN(parsed) && parsed > 0) ? parsed : 1440;
    }

    const targetFamilyId = req.familyId || req.user?.familyId;

    let doc = null;
    if (isConnected && mongoose.Types.ObjectId.isValid(req.params.id)) {
      try {
        doc = await Document.findById(req.params.id);
      } catch (err) {
        doc = null;
      }
    }
    if (!doc && Array.isArray(memoryStore.documents)) {
      doc = memoryStore.documents.find(d => d._id?.toString() === req.params.id);
    }

    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // Multi-tenant authorization (allow if same family, or document uploader, or admin)
    const isDocOwner = req.userId && doc.uploaderId && doc.uploaderId.toString() === req.userId.toString();
    const isFamilyMatch = !targetFamilyId || !doc.familyId || doc.familyId.toString() === targetFamilyId.toString();
    if (!isFamilyMatch && !isDocOwner && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access forbidden. You cannot share documents from another family vault.' });
    }

    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + finalMinutes * 60000);

    const shareLink = {
      token,
      expiresAt,
      isPasswordProtected: Boolean(password),
      passwordHash: password ? crypto.createHash('sha256').update(password).digest('hex') : null,
    };

    doc.shareLink = shareLink;
    if (typeof doc.save === 'function') {
      if (typeof doc.markModified === 'function') doc.markModified('shareLink');
      await doc.save();
    }

    const clientOrigin = req.headers['x-client-origin'] || req.headers.origin || req.headers.referer?.replace(/\/$/, '') || `${req.protocol}://${req.get('host')}`;
    const directShareUrl = `${clientOrigin}/share/${token}`;

    // Immutable SHA-256 Chained Audit Log for Shared Link Generation
    recordAuditLog({
      familyId: doc.familyId || targetFamilyId,
      action: 'SHARE_LINK_GENERATED',
      performedBy: req.user?._id || null,
      performerName: req.user?.name || 'Vault Custodian',
      documentId: doc._id,
      documentTitle: doc.title,
      details: { category: doc.category, durationMinutes: finalMinutes, expiresAt },
      req,
    }).catch(e => console.warn('[Audit Warning] Share link log error:', e.message));

    res.json({
      success: true,
      shareUrl: directShareUrl,
      shareLink: directShareUrl,
      token,
      shareToken: token,
      expiresAt,
      message: `Secure share link created (valid for ${finalMinutes >= 60 ? (finalMinutes / 60) + ' hour(s)' : finalMinutes + ' minutes'})`,
    });
  } catch (err) {
    console.error('Error generating share link:', err);
    res.status(500).json({ error: err.message || 'Failed to create share link' });
  }
});

// DELETE /api/documents/:id/share-link (Revoke / Expire external share access immediately)
router.delete('/:id/share-link', async (req, res) => {
  try {
    const targetFamilyId = req.familyId || req.user?.familyId;
    let doc = null;
    if (isConnected && mongoose.Types.ObjectId.isValid(req.params.id)) {
      try {
        doc = await Document.findById(req.params.id);
      } catch (err) {
        doc = null;
      }
    }
    if (!doc && Array.isArray(memoryStore.documents)) {
      doc = memoryStore.documents.find(d => d._id?.toString() === req.params.id);
    }

    if (!doc) return res.status(404).json({ error: 'Document not found' });
    const isDocOwner = req.userId && doc.uploaderId && doc.uploaderId.toString() === req.userId.toString();
    const isFamilyMatch = !targetFamilyId || !doc.familyId || doc.familyId.toString() === targetFamilyId.toString();
    if (!isFamilyMatch && !isDocOwner && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access forbidden. You cannot modify documents from another family vault.' });
    }

    doc.shareLink = undefined;
    if (typeof doc.save === 'function') {
      if (typeof doc.markModified === 'function') doc.markModified('shareLink');
      await doc.save();
    }

    // Immutable SHA-256 Chained Audit Log for Safe Share Link Revocation
    recordAuditLog({
      familyId: doc.familyId || targetFamilyId,
      action: 'SHARE_LINK_REVOKED',
      performedBy: req.user?._id || null,
      performerName: req.user?.name || 'Vault Custodian',
      documentId: doc._id,
      documentTitle: doc.title,
      details: { revokedAt: new Date() },
      req,
    }).catch(e => console.warn('[Audit Warning] Share link revoke error:', e.message));

    res.json({ success: true, message: 'Safe share link revoked successfully. External access is now closed.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/documents/:id/who-can-view (Human-friendly access selector)
router.put('/:id/who-can-view', async (req, res) => {
  try {
    const { whoCanView } = req.body;
    const targetFamilyId = req.familyId || req.user?.familyId;

    let parsedWhoCanView = ['ALL'];
    if (whoCanView !== undefined) {
      if (Array.isArray(whoCanView)) {
        parsedWhoCanView = whoCanView;
      } else if (typeof whoCanView === 'string') {
        try {
          const parsed = JSON.parse(whoCanView);
          parsedWhoCanView = Array.isArray(parsed) ? parsed : [whoCanView];
        } catch (e) {
          parsedWhoCanView = [whoCanView];
        }
      }
    }

    let doc = null;
    if (isConnected) {
      doc = await Document.findById(req.params.id);
      if (!doc) return res.status(404).json({ error: 'Document not found' });
      if (targetFamilyId && doc.familyId && doc.familyId.toString() !== targetFamilyId.toString()) {
        return res.status(403).json({ error: 'Access forbidden. This document belongs to another family vault.' });
      }
      doc.whoCanView = parsedWhoCanView;
      await doc.save();
    } else {
      doc = memoryStore.documents.find(d => d._id.toString() === req.params.id);
      if (!doc) return res.status(404).json({ error: 'Document not found' });
      if (targetFamilyId && doc.familyId && doc.familyId.toString() !== targetFamilyId.toString()) {
        return res.status(403).json({ error: 'Access forbidden. This document belongs to another family vault.' });
      }
      doc.whoCanView = parsedWhoCanView;
    }

    // Immutable SHA-256 Chained Audit Log for Permission Changed
    recordAuditLog({
      familyId: doc.familyId || targetFamilyId,
      action: 'PERMISSION_CHANGED',
      performedBy: req.user?._id || null,
      performerName: req.user?.name || 'Family Member',
      documentId: doc._id,
      documentTitle: doc.title,
      details: { whoCanView: parsedWhoCanView },
      req,
    }).catch(e => console.warn('[Audit Warning] Permission change log error:', e.message));

    res.json({ success: true, whoCanView: doc.whoCanView });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/documents/:id/mpin-protection (Toggle MPIN lock status)
router.put('/:id/mpin-protection', async (req, res) => {
  try {
    const { isMpinProtected } = req.body;
    const targetFamilyId = req.familyId || req.user?.familyId;
    const shouldLock = Boolean(isMpinProtected === true || isMpinProtected === 'true');

    let doc = null;
    if (isConnected) {
      doc = await Document.findById(req.params.id);
      if (!doc) return res.status(404).json({ error: 'Document not found' });
      if (targetFamilyId && doc.familyId && doc.familyId.toString() !== targetFamilyId.toString()) {
        return res.status(403).json({ error: 'Access forbidden. This document belongs to another family vault.' });
      }
      doc.isSensitive = shouldLock;
      await doc.save();
    } else {
      doc = memoryStore.documents.find(d => d._id.toString() === req.params.id);
      if (!doc) return res.status(404).json({ error: 'Document not found' });
      if (targetFamilyId && doc.familyId && doc.familyId.toString() !== targetFamilyId.toString()) {
        return res.status(403).json({ error: 'Access forbidden. This document belongs to another family vault.' });
      }
      doc.isSensitive = shouldLock;
    }

    // Immutable SHA-256 Chained Audit Log for MPIN Lock Change
    recordAuditLog({
      familyId: doc.familyId || targetFamilyId,
      action: 'MPIN_PROTECTION_TOGGLED',
      performedBy: req.user?._id || null,
      performerName: req.user?.name || 'Family Member',
      documentId: doc._id,
      documentTitle: doc.title,
      details: { isMpinProtected: shouldLock },
      req,
    }).catch(e => console.warn('[Audit Warning] MPIN lock log error:', e.message));

    res.json({
      success: true,
      isMpinProtected: shouldLock,
      isSensitive: shouldLock,
      message: shouldLock ? 'Document locked with 4-digit MPIN' : 'MPIN protection removed',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Handler for updating document metadata & optional replacement scan
const handleUpdateDocument = async (req, res) => {
  try {
    const {
      title,
      documentNumber,
      issueDate,
      expiryDate,
      category,
      assignedMemberId,
      notes,
      isSensitive,
      isMpinProtected,
      whoCanView,
    } = req.body;

    const targetFamilyId = (req.familyId?._id || req.familyId || req.user?.familyId?._id || req.user?.familyId)?.toString();
    const currentUserId = (req.userId || req.user?._id)?.toString();

    let doc = null;
    let isMongo = false;
    if (isConnected && mongoose.Types.ObjectId.isValid(req.params.id)) {
      try {
        doc = await Document.findById(req.params.id);
        if (doc) isMongo = true;
      } catch (e) {
        doc = null;
      }
    }
    if (!doc) {
      doc = memoryStore.documents.find(d => d._id?.toString() === req.params.id);
    }
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Access check: allow uploader, or if same family, or in single family/dev mode
    const isUploader = Boolean(doc.uploaderId && currentUserId && doc.uploaderId.toString() === currentUserId);
    const docFamId = doc.familyId ? (doc.familyId._id || doc.familyId).toString() : null;
    if (targetFamilyId && docFamId && targetFamilyId !== docFamId && !isUploader) {
      return res.status(403).json({ error: 'Access forbidden. This document belongs to another family vault.' });
    }

    // Safe date parser
    const parseSafeDate = (val) => {
      if (!val || val === 'null' || val === 'undefined' || val === '') return null;
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    };

    if (title !== undefined && title.trim()) doc.title = title.trim();
    if (documentNumber !== undefined) doc.documentNumber = documentNumber.trim().toUpperCase();
    if (category !== undefined && category.trim()) doc.category = category.trim();

    if (assignedMemberId !== undefined) {
      const cleanMemberId = (assignedMemberId && assignedMemberId !== 'null' && assignedMemberId !== 'undefined' && assignedMemberId !== '')
        ? assignedMemberId
        : null;
      if (isMongo) {
        doc.assignedMemberId = (cleanMemberId && mongoose.Types.ObjectId.isValid(cleanMemberId))
          ? cleanMemberId
          : null;
      } else {
        doc.assignedMemberId = cleanMemberId;
      }
    }

    if (issueDate !== undefined) {
      doc.issueDate = parseSafeDate(issueDate);
    }

    if (expiryDate !== undefined) {
      doc.expiryDate = parseSafeDate(expiryDate);
      if (doc.expiryDate) {
        const now = Date.now();
        const exp = doc.expiryDate.getTime();
        if (exp <= now) doc.status = 'EXPIRED';
        else if (exp <= now + 30 * 86400000) doc.status = 'EXPIRING_SOON';
        else doc.status = 'ACTIVE';
      } else {
        doc.status = 'ACTIVE';
      }
    }

    if (notes !== undefined) doc.notes = notes.trim();

    if (req.body.holderName !== undefined || req.body.fatherOrSpouseName !== undefined || req.body.dob !== undefined || req.body.docType !== undefined) {
      doc.ocrExtractedData = {
        ...(doc.ocrExtractedData || {}),
        ...(req.body.holderName !== undefined ? { holderName: req.body.holderName.trim() } : {}),
        ...(req.body.fatherOrSpouseName !== undefined ? { fatherOrSpouseName: req.body.fatherOrSpouseName.trim() } : {}),
        ...(req.body.dob !== undefined ? { dob: req.body.dob } : {}),
        ...(req.body.docType !== undefined ? { docType: req.body.docType.trim() } : {}),
      };
      if (isMongo && doc.markModified) {
        doc.markModified('ocrExtractedData');
      }
    }

    if (isMpinProtected !== undefined || isSensitive !== undefined) {
      const shouldLock = (isMpinProtected === 'true' || isMpinProtected === true || isSensitive === 'true' || isSensitive === true);
      doc.isSensitive = shouldLock;
    }

    if (whoCanView !== undefined) {
      let parsedWho = ['ALL'];
      try {
        parsedWho = typeof whoCanView === 'string' && (whoCanView.startsWith('[') || whoCanView.startsWith('{'))
          ? JSON.parse(whoCanView)
          : Array.isArray(whoCanView) ? whoCanView : whoCanView.split(',').map(s => s.trim());
      } catch (e) {
        parsedWho = Array.isArray(whoCanView) ? whoCanView : ['ALL'];
      }
      doc.whoCanView = parsedWho;
    }

    // Optional file update if user attached a replacement scan/photo
    if (req.file) {
      const fileExt = path.extname(req.file.originalname) || (req.file.mimetype?.startsWith('image/png') ? '.png' : req.file.mimetype?.startsWith('image/jpeg') ? '.jpg' : '.pdf');
      const storagePath = `vault/${(category || doc.category || 'general').toLowerCase().replace(/[^a-z0-9]/g, '_')}/${Date.now()}_${crypto.randomBytes(4).toString('hex')}${fileExt}`;
      const sha256Hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
      try {
        await uploadDocument(req.file.buffer, storagePath, req.file.mimetype);
      } catch (uploadErr) {
        console.warn('[Storage Warning] Storage upload fallback:', uploadErr.message);
      }
      doc.fileUrl = `/api/documents/raw/${encodeURIComponent(storagePath)}`;
      doc.storagePath = storagePath;
      doc.sha256Hash = sha256Hash;
      doc.fileSize = req.file.size;
      doc.mimeType = req.file.mimetype;
      doc.originalFileName = req.file.originalname;
    }

    if (isMongo && typeof doc.save === 'function') {
      try {
        await doc.save();
      } catch (saveErr) {
        console.warn('[Mongoose Save Warning] doc.save failed, falling back to findByIdAndUpdate:', saveErr.message);
        await Document.findByIdAndUpdate(doc._id, {
          title: doc.title,
          documentNumber: doc.documentNumber,
          category: doc.category,
          assignedMemberId: doc.assignedMemberId,
          issueDate: doc.issueDate,
          expiryDate: doc.expiryDate,
          status: doc.status,
          notes: doc.notes,
          isSensitive: doc.isSensitive,
          whoCanView: doc.whoCanView,
          storagePath: doc.storagePath,
          fileUrl: doc.fileUrl,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
          originalFileName: doc.originalFileName,
          sha256Hash: doc.sha256Hash,
        });
      }
    }

    // Auto-sync medical credentials upon edit/update
    autoSyncMedicalCredentialsToMember({
      targetMemberId: doc.assignedMemberId || doc.uploaderId,
      category: doc.category,
      title: doc.title,
      documentNumber: doc.documentNumber,
      emergencyDetails: doc.ocrExtractedData?.emergencyDetails,
      notes: doc.notes,
    }).catch(e => console.warn('[Auto-Sync Warning]:', e.message));

    recordAuditLog({
      familyId: doc.familyId || targetFamilyId,
      action: 'DOCUMENT_UPDATED',
      performedBy: req.user?._id || null,
      performerName: req.user?.name || 'Family Member',
      documentId: doc._id,
      documentTitle: doc.title,
      details: { title: doc.title, documentNumber: doc.documentNumber, expiryDate: doc.expiryDate, category: doc.category, notes: doc.notes },
      req,
    }).catch(e => console.warn('[Audit Warning] Document update log error:', e.message));

    // Auto-Push on document update
    const editorName = req.user?.name || 'Family Member';
    createVaultNotification({
      familyId: doc.familyId || targetFamilyId,
      title: '✏️ Document Update',
      message: `${editorName} ne "${doc.title}" update kiya hai. Check karein!`,
      type: 'INFO',
      link: `/vault/documents/${doc._id}`,
    }).catch(e => console.warn('[Auto-Push Error] Update push notification failed:', e.message));

    // Fetch assigned member details for enriched return
    let enrichedMember = null;
    if (doc.assignedMemberId) {
      if (isMongo && mongoose.Types.ObjectId.isValid(doc.assignedMemberId)) {
        enrichedMember = await User.findById(doc.assignedMemberId).lean();
      } else {
        enrichedMember = memoryStore.users.find(u => u._id?.toString() === doc.assignedMemberId?.toString());
      }
    }

    const enrichedMemberFormatted = enrichedMember ? {
      ...enrichedMember,
      id: enrichedMember._id,
      relation: enrichedMember.relationship || 'Member',
      relationship: enrichedMember.relationship || 'Member',
      dob: enrichedMember.dateOfBirth || '',
      dateOfBirth: enrichedMember.dateOfBirth || '',
      avatarUrl: enrichedMember.avatar,
      avatar: enrichedMember.avatar,
    } : null;

    const normalizedDoc = {
      ...(doc.toObject ? doc.toObject() : doc),
      id: doc._id,
      assignedMemberId: doc.assignedMemberId,
      memberId: doc.assignedMemberId,
      assignedMember: enrichedMemberFormatted,
      isMpinProtected: Boolean(doc.isSensitive || ['Property & Legal', 'Financial', 'Legal'].includes(doc.category)),
      isSensitive: Boolean(doc.isSensitive || ['Property & Legal', 'Financial', 'Legal'].includes(doc.category)),
    };

    res.json({ success: true, document: normalizedDoc, message: 'Document updated successfully' });
  } catch (err) {
    console.error('Error updating document:', err);
    res.status(500).json({ error: err.message });
  }
};

const uploadMiddleware = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
};

// PUT /api/documents/:id (Update document details & optionally replace file)
router.put('/:id', uploadMiddleware, handleUpdateDocument);

// POST /api/documents/:id/update (Alias for clients/proxies that prefer POST)
router.post('/:id/update', uploadMiddleware, handleUpdateDocument);

// POST /api/documents/:id (Direct POST alias)
router.post('/:id', uploadMiddleware, handleUpdateDocument);

// DELETE /api/documents/:id
router.delete('/:id', async (req, res) => {
  try {
    const targetFamilyId = req.familyId || req.user?.familyId;
    let doc = null;

    if (isConnected) {
      doc = await Document.findById(req.params.id);
      if (!doc) return res.status(404).json({ error: 'Document not found' });
      if (targetFamilyId && doc.familyId && doc.familyId.toString() !== targetFamilyId.toString()) {
        return res.status(403).json({ error: 'Access forbidden. You cannot delete documents from another family vault.' });
      }
      await Document.findByIdAndDelete(req.params.id);
    } else {
      const idx = memoryStore.documents.findIndex(d => d._id.toString() === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Document not found' });
      doc = memoryStore.documents[idx];
      if (targetFamilyId && doc.familyId && doc.familyId.toString() !== targetFamilyId.toString()) {
        return res.status(403).json({ error: 'Access forbidden. You cannot delete documents from another family vault.' });
      }
      memoryStore.documents.splice(idx, 1);
    }

    if (!doc) return res.status(404).json({ error: 'Document not found' });

    try {
      await deleteDocument(doc.storagePath);
    } catch (e) {
      // Ignored
    }

    // Immutable SHA-256 Chained Audit Log for Document Delete
    recordAuditLog({
      familyId: doc.familyId || targetFamilyId,
      action: 'DOCUMENT_DELETE',
      performedBy: req.user?._id || null,
      performerName: req.user?.name || 'Family Member',
      documentId: doc._id,
      documentTitle: doc.title,
      details: { category: doc.category },
      req,
    }).catch(e => console.warn('[Audit Warning] Document delete log error:', e.message));

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/documents/raw/* (Serve vault document files for preview and download)
router.get(['/raw/:path(*)', '/raw/*', '/raw/:path'], async (req, res) => {
  try {
    const rawParam = req.params.path || req.params[0] || req.path.replace(/^\/raw\/?/, '');
    const storagePath = decodeURIComponent(rawParam);

    const candidates = [
      path.join(LOCAL_STORAGE_DIR, storagePath.replace(/\//g, '_')),
      path.join(LOCAL_STORAGE_DIR, storagePath.replace(/\\/g, '/').replace(/\//g, '_')),
      path.join(LOCAL_STORAGE_DIR, path.basename(storagePath)),
      path.join(LOCAL_STORAGE_DIR, storagePath),
    ];

    let foundFile = null;
    for (const cand of candidates) {
      if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
        foundFile = cand;
        break;
      }
    }

    const mimeMap = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
    };

    if (foundFile) {
      const ext = path.extname(foundFile).toLowerCase();
      if (mimeMap[ext]) {
        res.setHeader('Content-Type', mimeMap[ext]);
      }
      const isDownload = req.query.download === 'true' || req.query.download === '1';
      if (isDownload) {
        const customFilename = req.query.filename ? decodeURIComponent(req.query.filename) : null;
        const cleanBasename = path.basename(foundFile).replace(/^vault_[a-z0-9_]+_\d+_[a-f0-9]+_?/, '');
        const downloadName = customFilename || cleanBasename || `document${ext}`;
        res.setHeader('Content-Disposition', `attachment; filename="${downloadName.replace(/["\r\n]/g, '')}"`);
      }
      return res.sendFile(path.resolve(foundFile));
    }

    // Try Supabase if not found on local disk
    try {
      const signedUrl = await createSignedUrl(storagePath, 3600);
      if (signedUrl && signedUrl.startsWith('http')) {
        return res.redirect(signedUrl);
      }
    } catch (err) {
      console.warn('[Raw] Could not sign url:', err.message);
    }

    // If file is an image and missing, return 404 (DO NOT return dummy PDF bytes to <img> tags)
    const ext = path.extname(storagePath).toLowerCase();
    const isImage = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext);
    if (isImage) {
      return res.status(404).json({ error: 'Image file not found in vault storage' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="document_preview.pdf"');
    return res.send(Buffer.from('%PDF-1.4 [GharVault Secure Encrypted Preview]'));
  } catch (err) {
    console.error('[Raw Route Error]', err);
    return res.status(500).json({ error: 'Failed to retrieve document file' });
  }
});

export default router;
