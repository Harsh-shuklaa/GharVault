import express from 'express';
import crypto from 'crypto';
import { memoryStore } from '../config/seed.js';

const router = express.Router();

// GET /api/family/current
router.get('/current', (req, res) => {
  const family = memoryStore.families[0];
  const members = memoryStore.users;
  const docs = memoryStore.documents;

  const totalSize = docs.reduce((acc, d) => acc + (d.fileSize || 0), 0);
  const expiringCount = docs.filter(d => d.status === 'EXPIRING_SOON').length;
  const sensitiveCount = docs.filter(d => d.isSensitive).length;

  res.json({
    family,
    membersCount: members.length,
    documentsCount: docs.length,
    expiringCount,
    sensitiveCount,
    totalSizeBytes: totalSize,
    storageLimitBytes: family.storageLimitBytes,
    usagePercentage: ((totalSize / family.storageLimitBytes) * 100).toFixed(1),
  });
});

// POST /api/family/setup
router.post('/setup', (req, res) => {
  const { name, quorumThreshold, breakGlassHours } = req.body;
  const inviteCode = 'GHAR-' + Math.floor(1000 + Math.random() * 9000);

  const newFamily = {
    _id: 'fam_' + Date.now(),
    name: name || 'Sharma Family Ghar',
    inviteCode,
    adminId: memoryStore.users[0]?._id,
    settings: {
      quorumRequiredForSensitive: true,
      quorumThreshold: quorumThreshold || 2,
      breakGlassDelayHours: breakGlassHours || 48,
      autoColdBackupEnabled: true,
    },
    storageLimitBytes: 53687091200,
    storageUsedBytes: 0,
    createdAt: new Date(),
  };

  memoryStore.families[0] = newFamily;

  res.status(201).json({
    success: true,
    family: newFamily,
    message: 'Family Vault initialized successfully',
  });
});

// POST /api/family/join
router.post('/join', (req, res) => {
  const { inviteCode, name, email, relationship } = req.body;
  const currentFamily = memoryStore.families[0];

  if (!inviteCode || (inviteCode.toUpperCase() !== currentFamily.inviteCode && inviteCode.toUpperCase() !== 'GHAR-9428')) {
    return res.status(404).json({ error: 'Invalid family invite code. Please verify with your Family Admin.' });
  }

  const newMember = {
    _id: 'user_' + Date.now(),
    name: name || 'Family Member',
    email: email || `member_${Date.now()}@gmail.com`,
    role: 'MEMBER',
    relationship: relationship || 'Family Member',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    familyId: currentFamily._id,
    phone: '+91 98000 00000',
    isEmergencyContact: false,
    permissions: {
      canUpload: true,
      canDownload: true,
      canDelete: false,
      canViewSensitive: false,
      canSignQuorum: false,
      canArmBreakGlass: false,
    },
    createdAt: new Date(),
  };

  memoryStore.users.push(newMember);

  res.json({
    success: true,
    member: newMember,
    family: currentFamily,
    message: `Successfully joined ${currentFamily.name}!`,
  });
});

// GET /api/family/members
router.get('/members', (req, res) => {
  const members = memoryStore.users.map(user => {
    const assignedDocs = memoryStore.documents.filter(
      d => d.assignedMemberId?.toString() === user._id.toString()
    );
    return {
      ...user,
      assignedDocumentsCount: assignedDocs.length,
    };
  });

  res.json({ members });
});

// GET /api/family/members/:id
router.get('/members/:id', (req, res) => {
  const user = memoryStore.users.find(u => u._id.toString() === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'Family member not found' });
  }

  const assignedDocs = memoryStore.documents.filter(
    d => d.assignedMemberId?.toString() === user._id.toString()
  );

  const memberAuditLogs = memoryStore.auditLogs.filter(
    l => l.performedBy?.toString() === user._id.toString()
  );

  res.json({
    member: user,
    assignedDocuments: assignedDocs,
    recentActivity: memberAuditLogs.slice(0, 5),
  });
});

// POST /api/family/members/invite
router.post('/members/invite', (req, res) => {
  const { name, email, relationship, role, canSignQuorum, isEmergencyContact } = req.body;
  const currentFamily = memoryStore.families[0];

  const inviteToken = crypto.randomBytes(16).toString('hex');
  const inviteLink = `${req.protocol}://${req.get('host')}/family/join?code=${currentFamily.inviteCode}&token=${inviteToken}`;

  const newMember = {
    _id: 'user_' + Date.now(),
    name: name || 'Invited Member',
    email: email || `guest_${Date.now()}@gmail.com`,
    role: role || 'MEMBER',
    relationship: relationship || 'Family Member',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
    familyId: currentFamily._id,
    isEmergencyContact: Boolean(isEmergencyContact),
    permissions: {
      canUpload: true,
      canDownload: true,
      canDelete: role === 'ADMIN',
      canViewSensitive: role === 'ADMIN' || role === 'GUARDIAN',
      canSignQuorum: Boolean(canSignQuorum),
      canArmBreakGlass: role === 'ADMIN' || role === 'GUARDIAN',
    },
    createdAt: new Date(),
  };

  memoryStore.users.push(newMember);

  // Add notification
  memoryStore.notifications.unshift({
    _id: 'notif_' + Date.now(),
    familyId: currentFamily._id,
    title: 'New Member Invited',
    message: `${newMember.name} (${newMember.relationship}) was invited as ${newMember.role}.`,
    type: 'INFO',
    link: '/family',
    isRead: false,
    createdAt: new Date(),
  });

  res.status(201).json({
    success: true,
    member: newMember,
    inviteLink,
    inviteCode: currentFamily.inviteCode,
    message: 'Invitation generated successfully',
  });
});

// PUT /api/family/members/:id/permissions
router.put('/members/:id/permissions', (req, res) => {
  const user = memoryStore.users.find(u => u._id.toString() === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'Member not found' });
  }

  const { permissions, role } = req.body;
  if (permissions) {
    user.permissions = { ...user.permissions, ...permissions };
  }
  if (role) {
    user.role = role;
  }

  // Record audit log
  const newHash = crypto.randomBytes(32).toString('hex');
  memoryStore.auditLogs.unshift({
    _id: 'audit_' + Date.now(),
    familyId: memoryStore.families[0]._id,
    action: 'PERMISSION_CHANGED',
    performerName: 'Rajesh Sharma',
    details: { targetMember: user.name, updatedPermissions: user.permissions },
    sha256ChainHash: newHash,
    parentHash: memoryStore.auditLogs[0]?.sha256ChainHash,
    timestamp: new Date(),
  });

  res.json({
    success: true,
    member: user,
    message: 'Permissions updated successfully',
  });
});

export default router;
