import express from 'express';
import crypto from 'crypto';
import { memoryStore } from '../config/seed.js';

const router = express.Router();

// GET /api/break-glass
router.get('/', (req, res) => {
  const activeSession = memoryStore.breakGlassSessions[0] || null;
  res.json({
    session: activeSession,
    delayHours: memoryStore.families[0]?.settings.breakGlassDelayHours || 48,
    emergencyContacts: memoryStore.users.filter(u => u.isEmergencyContact),
  });
});

// POST /api/break-glass/arm
router.post('/arm', (req, res) => {
  const { reason, notes } = req.body;
  const user = memoryStore.users[0]; // Rajesh / Admin

  const delayHours = memoryStore.families[0]?.settings.breakGlassDelayHours || 48;
  const unlocksAt = new Date(Date.now() + delayHours * 3600000);

  const session = {
    _id: 'bg_' + Date.now(),
    familyId: memoryStore.families[0]._id,
    triggeredBy: user._id,
    triggerName: user.name,
    reason: reason || 'Medical Emergency / Hospitalization',
    notes: notes || 'Emergency protocol armed. Notification broadcasted to all guardians.',
    status: 'COUNTDOWN_ACTIVE',
    delayHours,
    armedAt: new Date(),
    unlocksAt,
    notificationsSent: [
      { channel: 'SMS', recipient: '+91 98201 44891', sentAt: new Date() },
      { channel: 'EMAIL', recipient: 'priya.sharma@gmail.com', sentAt: new Date() },
      { channel: 'WHATSAPP', recipient: '+91 98201 44892', sentAt: new Date() },
    ],
  };

  memoryStore.breakGlassSessions[0] = session;

  // Add high-priority notification
  memoryStore.notifications.unshift({
    _id: 'notif_' + Date.now(),
    familyId: memoryStore.families[0]._id,
    title: '⚠️ EMERGENCY BREAK-GLASS ARMED',
    message: `${user.name} armed the 48-Hour Emergency Break-Glass protocol. Reason: ${session.reason}.`,
    type: 'BREAK_GLASS',
    link: '/break-glass',
    isRead: false,
    createdAt: new Date(),
  });

  // Cryptographic audit log
  const parentHash = memoryStore.auditLogs[0]?.sha256ChainHash || '0000';
  const chainHash = crypto.createHash('sha256').update(parentHash + 'BREAK_GLASS_ARMED' + session.reason).digest('hex');

  memoryStore.auditLogs.unshift({
    _id: 'audit_' + Date.now(),
    familyId: memoryStore.families[0]._id,
    action: 'BREAK_GLASS_ARMED',
    performerName: user.name,
    details: { reason: session.reason, delayHours, unlocksAt },
    sha256ChainHash: chainHash,
    parentHash,
    timestamp: new Date(),
  });

  res.json({
    success: true,
    session,
    message: 'Break-glass countdown timer successfully initiated. All family custodians alerted.',
  });
});

// POST /api/break-glass/cancel
router.post('/cancel', (req, res) => {
  const session = memoryStore.breakGlassSessions[0];
  if (!session) {
    return res.status(404).json({ error: 'No active break-glass session.' });
  }

  session.status = 'REVOKED_CANCELLED';
  session.revokedAt = new Date();
  session.revokedBy = memoryStore.users[0]._id;

  // Audit
  const parentHash = memoryStore.auditLogs[0]?.sha256ChainHash || '0000';
  const chainHash = crypto.createHash('sha256').update(parentHash + 'BREAK_GLASS_CANCELLED').digest('hex');

  memoryStore.auditLogs.unshift({
    _id: 'audit_' + Date.now(),
    familyId: memoryStore.families[0]._id,
    action: 'BREAK_GLASS_CANCELLED',
    performerName: 'Rajesh Sharma',
    details: { status: 'CANCELLED_BY_ADMIN' },
    sha256ChainHash: chainHash,
    parentHash,
    timestamp: new Date(),
  });

  res.json({
    success: true,
    session,
    message: 'Emergency Break-Glass protocol disarmed and safely cancelled.',
  });
});

// POST /api/break-glass/trigger (Force immediate emergency override)
router.post('/trigger', (req, res) => {
  let session = memoryStore.breakGlassSessions[0];
  if (!session) {
    session = {
      _id: 'bg_' + Date.now(),
      familyId: memoryStore.families[0]._id,
      triggeredBy: memoryStore.users[0]._id,
      triggerName: 'Rajesh Sharma',
      reason: 'Medical Emergency / Hospitalization',
      delayHours: 0,
      armedAt: new Date(),
      unlocksAt: new Date(),
    };
  }

  session.status = 'COMPLETED_UNLOCKED';

  // Unlock all sensitive documents for emergency access
  memoryStore.documents.forEach(doc => {
    if (doc.isSensitive) {
      doc.quorumApproved = true;
    }
  });

  const parentHash = memoryStore.auditLogs[0]?.sha256ChainHash || '0000';
  const chainHash = crypto.createHash('sha256').update(parentHash + 'BREAK_GLASS_TRIGGERED').digest('hex');

  memoryStore.auditLogs.unshift({
    _id: 'audit_' + Date.now(),
    familyId: memoryStore.families[0]._id,
    action: 'BREAK_GLASS_TRIGGERED',
    performerName: 'Rajesh Sharma (Emergency Force Unlock)',
    details: { reason: session.reason, accessGranted: 'ALL_SENSITIVE_DOCUMENTS' },
    sha256ChainHash: chainHash,
    parentHash,
    timestamp: new Date(),
  });

  res.json({
    success: true,
    session,
    message: 'Emergency custody unlocked. All documents accessible to designated family custodians.',
  });
});

export default router;
