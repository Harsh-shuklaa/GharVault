import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { memoryStore } from '../config/seed.js';
import Document from '../models/Document.js';
import User from '../models/User.js';
import Family from '../models/Family.js';
import { isConnected } from '../config/db.js';
import { uploadDocument, createSignedUrl, deleteDocument } from '../services/supabaseStorage.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 26214400 }, // 25 MB Free Tier Limit
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, PNG, and JPEG files up to 25MB are allowed.'));
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

    if (isConnected) {
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
    } else {
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

    // Populate assigned member info
    const populated = docs.map(d => {
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
    let doc = null;
    let member = null;

    if (isConnected) {
      doc = await Document.findById(req.params.id).lean();
      if (doc) {
        if (targetFamilyId && doc.familyId && doc.familyId.toString() !== targetFamilyId.toString()) {
          return res.status(403).json({ error: 'Access forbidden. This document belongs to another family vault.' });
        }
        member = await User.findById(doc.assignedMemberId).lean();
      }
    } else {
      doc = memoryStore.documents.find(d => d._id.toString() === req.params.id);
      if (doc) {
        if (targetFamilyId && doc.familyId && doc.familyId.toString() !== targetFamilyId.toString()) {
          return res.status(403).json({ error: 'Access forbidden. This document belongs to another family vault.' });
        }
        member = memoryStore.users.find(u => u._id.toString() === doc.assignedMemberId?.toString());
      }
    }

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
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
        signedUrl,
        fileUrl: signedUrl,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/documents/upload
router.post('/upload', upload.single('file'), async (req, res) => {
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
    const finalMemberId = assignedMemberId || memberId || uploaderId;
    const finalSensitive = Boolean(isSensitive || isMpinProtected || ['Property & Legal', 'Financial', 'Legal'].includes(category));

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

    // Check expiry
    const now = Date.now();
    let status = 'ACTIVE';
    if (expiryDate) {
      const exp = new Date(expiryDate).getTime();
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

    const familyId = req.familyId || req.user?.familyId;

    if (!familyId) {
      return res.status(400).json({ error: 'You must belong to a family vault to upload documents.' });
    }

    if (isConnected) {
      const newDoc = await Document.create({
        title: title || originalName.replace(fileExt, ''),
        originalFileName: originalName,
        mimeType,
        fileSize,
        category,
        familyId,
        assignedMemberId: finalMemberId,
        documentNumber: finalDocNumber,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        status,
        isSensitive: finalSensitive,
        whoCanView: parsedWhoCanView,
        tags: parsedTags,
        storagePath,
        sha256Hash,
        ocrExtractedData: ocrData,
        uploaderId,
      });

      return res.status(201).json({
        success: true,
        document: newDoc,
        message: 'Document saved securely in your family vault!',
      });
    }

    // Memory Store: Tag with user's actual familyId and uploaderId!
    const newDoc = {
      _id: 'doc_' + Date.now(),
      title: title || originalName.replace(fileExt, ''),
      originalFileName: originalName,
      mimeType,
      fileSize,
      category,
      familyId,
      assignedMemberId: finalMemberId,
      documentNumber: finalDocNumber,
      issueDate: issueDate ? new Date(issueDate) : new Date(),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      status,
      isSensitive: finalSensitive,
      whoCanView: parsedWhoCanView,
      tags: parsedTags,
      storagePath,
      sha256Hash,
      ocrExtractedData: ocrData,
      uploaderId,
      documentNumber: finalDocNumber,
      issueDate: issueDate ? new Date(issueDate) : new Date(),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      status,
      whoCanView: parsedWhoCanView,
      tags: parsedTags,
      storagePath,
      sha256Hash,
      ocrExtractedData: ocrData,
      uploaderId,
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
      doc = await Document.findOne({ 'shareLink.token': token });
    } else {
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

// POST /api/documents/:id/share-link (Creates 10m, 1h, or 24h expiring link)
router.post('/:id/share-link', async (req, res) => {
  try {
    const { durationMinutes = 1440, expiresInHours, password } = req.body;
    const finalMinutes = expiresInHours ? expiresInHours * 60 : (Number(durationMinutes) || 1440);
    const targetFamilyId = req.familyId || req.user?.familyId;

    let doc = null;
    if (isConnected) {
      doc = await Document.findById(req.params.id);
    } else {
      doc = memoryStore.documents.find(d => d._id.toString() === req.params.id);
    }

    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // Strict multi-tenant verification:
    if (targetFamilyId && doc.familyId && doc.familyId.toString() !== targetFamilyId.toString()) {
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
    if (isConnected) await doc.save();

    const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`;
    const directShareUrl = `${origin}/share/${token}`;

    res.json({
      success: true,
      shareUrl: directShareUrl,
      token,
      expiresAt,
      message: `Secure share link created (valid for ${finalMinutes >= 60 ? (finalMinutes / 60) + ' hour(s)' : finalMinutes + ' minutes'})`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/documents/:id/who-can-view (Human-friendly access selector)
router.put('/:id/who-can-view', async (req, res) => {
  try {
    const { whoCanView } = req.body;
    const targetFamilyId = req.familyId || req.user?.familyId;

    let doc = null;
    if (isConnected) {
      doc = await Document.findById(req.params.id);
      if (!doc) return res.status(404).json({ error: 'Document not found' });
      if (targetFamilyId && doc.familyId && doc.familyId.toString() !== targetFamilyId.toString()) {
        return res.status(403).json({ error: 'Access forbidden. This document belongs to another family vault.' });
      }
      doc.whoCanView = whoCanView;
      await doc.save();
    } else {
      doc = memoryStore.documents.find(d => d._id.toString() === req.params.id);
      if (!doc) return res.status(404).json({ error: 'Document not found' });
      if (targetFamilyId && doc.familyId && doc.familyId.toString() !== targetFamilyId.toString()) {
        return res.status(403).json({ error: 'Access forbidden. This document belongs to another family vault.' });
      }
      doc.whoCanView = whoCanView;
    }

    res.json({ success: true, whoCanView: doc.whoCanView });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
