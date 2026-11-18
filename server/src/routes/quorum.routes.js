import express from 'express';
import crypto from 'crypto';
import { memoryStore } from '../config/seed.js';

const router = express.Router();

// GET /api/quorum
router.get('/', (req, res) => {
  const targetFamilyId = req.familyId || req.user?.familyId;
  const requests = targetFamilyId
    ? memoryStore.quorumRequests.filter(r => r.familyId?.toString() === targetFamilyId.toString())
    : [];
  res.json({ requests });
});

// POST /api/quorum/request
router.post('/request', (req, res) => {
  const { documentId, reason, actionType = 'VIEW_SENSITIVE' } = req.body;
  const doc = memoryStore.documents.find(d => d._id.toString() === documentId);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const requester = memoryStore.users[0]; // Rajesh

  const newRequest = {
    _id: 'qreq_' + Date.now(),
    familyId: memoryStore.families[0]._id,
    documentId: doc._id,
    documentTitle: doc.title,
    actionType,
    requestedBy: requester._id,
    reason: reason || 'Sensitive document access requested for verification',
    requiredSignatures: memoryStore.families[0].settings.quorumThreshold || 2,
    signatures: [
      {
        userId: requester._id,
        userName: requester.name,
        userRole: requester.role,
        signedAt: new Date(),
        digitalSignature: `SIG_${crypto.randomBytes(16).toString('hex')}`,
      },
    ],
    status: 'PENDING',
    expiresAt: new Date(Date.now() + 24 * 3600000),
    createdAt: new Date(),
  };

  memoryStore.quorumRequests.unshift(newRequest);

  // Notify other guardians (e.g. Priya)
  memoryStore.notifications.unshift({
    _id: 'notif_' + Date.now(),
    familyId: memoryStore.families[0]._id,
    title: 'Dual-Key Signature Required',
    message: `${requester.name} requested quorum sign-off for "${doc.title}".`,
    type: 'QUORUM',
    link: '/vault/documents/' + doc._id,
    isRead: false,
    createdAt: new Date(),
  });

  res.status(201).json({
    success: true,
    request: newRequest,
    message: 'Dual-Key quorum sign-off initiated. Awaiting 2nd guardian signature.',
  });
});

// POST /api/quorum/:id/sign
router.post('/:id/sign', (req, res) => {
  const reqItem = memoryStore.quorumRequests.find(q => q._id.toString() === req.params.id);
  if (!reqItem) {
    return res.status(404).json({ error: 'Quorum request not found' });
  }

  const { signerEmail = 'priya.sharma@gmail.com' } = req.body;
  const signer = memoryStore.users.find(u => u.email.toLowerCase() === signerEmail.toLowerCase()) || memoryStore.users[1];

  const alreadySigned = reqItem.signatures.some(s => s.userId?.toString() === signer._id.toString());
  if (alreadySigned) {
    return res.status(400).json({ error: 'You have already signed this quorum request.' });
  }

  const digitalSignature = `SIG_SEAL_${signer.name.toUpperCase().replace(/\s+/g, '_')}_${crypto.randomBytes(12).toString('hex')}`;

  reqItem.signatures.push({
    userId: signer._id,
    userName: signer.name,
    userRole: signer.role,
    signedAt: new Date(),
    digitalSignature,
  });

  let approved = false;
  if (reqItem.signatures.length >= reqItem.requiredSignatures) {
    reqItem.status = 'APPROVED';
    approved = true;

    // Grant quorum access to the document
    const doc = memoryStore.documents.find(d => d._id.toString() === reqItem.documentId?.toString());
    if (doc) {
      doc.quorumApproved = true;
    }

    // Add audit log
    const parentHash = memoryStore.auditLogs[0]?.sha256ChainHash || '0000';
    const chainHash = crypto.createHash('sha256').update(parentHash + 'QUORUM_APPROVED' + reqItem.documentTitle).digest('hex');

    memoryStore.auditLogs.unshift({
      _id: 'audit_' + Date.now(),
      familyId: memoryStore.families[0]._id,
      action: 'QUORUM_APPROVED',
      performerName: `${reqItem.signatures.map(s => s.userName).join(' & ')}`,
      documentId: reqItem.documentId,
      documentTitle: reqItem.documentTitle,
      details: {
        signaturesCount: reqItem.signatures.length,
        status: 'QUORUM_SATISFIED',
      },
      sha256ChainHash: chainHash,
      parentHash,
      timestamp: new Date(),
    });
  }

  res.json({
    success: true,
    request: reqItem,
    approved,
    message: approved
      ? 'Quorum threshold reached! Document unlocked with dual cryptographic sign-off.'
      : 'Signature recorded. Awaiting remaining signatures.',
  });
});

export default router;
