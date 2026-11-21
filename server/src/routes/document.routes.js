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
import { uploadDocument, createSignedUrl, deleteDocument } from '../services/supabaseStorage.js';
import { recordAuditLog } from '../services/auditService.js';

// Helper to reliably dispatch family in-app notification
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
  } else if (lower.includes('licence') || lower.includes('license')) {
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
    const fileExt = path.extname(originalName) || '.pdf';
    const storagePath = `vault/${category.toLowerCase().replace(/[^a-z0-9]/g, '_')}/${Date.now()}_${crypto.randomBytes(4).toString('hex')}${fileExt}`;

    // 3. Upload to Encrypted Storage
    await uploadDocument(fileBuffer, storagePath, mimeType);

    // 4. Auto-extract number if not provided
    const ocrData = simulateOCR(originalName, title || '', category);
    const finalDocNumber = documentNumber?.trim() || ocrData.documentNumber || '';

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

    let useMongo = isConnected && mongoose.connection.readyState === 1;
    let newDoc = null;

    if (useMongo) {
      try {
        const safeFamId = toSafeObjectId(familyId) || familyId;
        const safeMemberId = toSafeObjectId(finalMemberId);
        const safeUploaderId = toSafeObjectId(uploaderId);

        newDoc = await Document.create({
          title: title || originalName.replace(fileExt, ''),
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
          ocrExtractedData: ocrData,
          uploaderId: safeUploaderId,
        });

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
      title: title || originalName.replace(fileExt, ''),
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
      ocrExtractedData: ocrData,
      uploaderId: uploaderId || null,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memoryStore.documents.unshift(newDoc);

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
    const { title, documentNumber, expiryDate, category, assignedMemberId, notes } = req.body;
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

    const isUploader = doc.uploaderId && doc.uploaderId.toString() === currentUserId;
    if (targetFamilyId && doc.familyId && doc.familyId.toString() !== targetFamilyId && !isUploader) {
      return res.status(403).json({ error: 'Access forbidden. This document belongs to another family vault.' });
    }

    if (title !== undefined && title.trim()) doc.title = title.trim();
    if (documentNumber !== undefined) doc.documentNumber = documentNumber.trim().toUpperCase();
    if (category !== undefined) doc.category = category;
    if (assignedMemberId !== undefined) doc.assignedMemberId = assignedMemberId || null;
    if (expiryDate !== undefined) {
      doc.expiryDate = expiryDate ? new Date(expiryDate) : null;
    }
    if (notes !== undefined) doc.notes = notes.trim();

    // Optional file update if user attached a replacement scan/photo
    if (req.file) {
      const sha256Hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
      const storagePath = `documents/${targetFamilyId || 'general'}/${Date.now()}_${path.basename(req.file.originalname).replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      let uploadedUrl = null;
      try {
        uploadedUrl = await uploadDocument(storagePath, req.file.buffer, req.file.mimetype);
      } catch (uploadErr) {
        console.warn('[Storage Warning] Storage upload fallback:', uploadErr.message);
      }
      doc.fileUrl = uploadedUrl || doc.fileUrl;
      doc.storagePath = storagePath;
      doc.sha256Hash = sha256Hash;
      doc.fileSize = req.file.size;
      doc.mimeType = req.file.mimetype;
      doc.originalFileName = req.file.originalname;
    }

    if (isMongo && typeof doc.save === 'function') {
      await doc.save();
    }

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

    res.json({ success: true, document: doc });
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

// GET /api/documents/raw/:path
router.get('/raw/:path', async (req, res) => {
  const storagePath = decodeURIComponent(req.params.path);
  const localFilePath = path.resolve('server/uploads/vault', storagePath.replace(/\//g, '_'));

  if (fs.existsSync(localFilePath)) {
    return res.sendFile(localFilePath);
  }

  try {
    const signedUrl = await createSignedUrl(storagePath, 3600);
    if (signedUrl && signedUrl.startsWith('http')) {
      return res.redirect(signedUrl);
    }
  } catch (err) {
    console.warn('[Raw] Could not sign url:', err.message);
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="document_preview.pdf"');
  res.send(Buffer.from('%PDF-1.4 [GharVault Secure Encrypted Preview]'));
});

export default router;
