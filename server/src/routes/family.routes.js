import express from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { memoryStore } from '../config/seed.js';
import User from '../models/User.js';
import Family from '../models/Family.js';
import Document from '../models/Document.js';
import AuditLog from '../models/AuditLog.js';
import { deleteDocument } from '../services/supabaseStorage.js';
import { isConnected } from '../config/db.js';
import { generateToken } from './auth.routes.js';
import { recordAuditLog } from '../services/auditService.js';

const router = express.Router();

// GET /api/family/current
router.get('/current', async (req, res) => {
  try {
    const targetFamilyId = req.familyId || req.user?.familyId;

    // STRICT MULTI-TENANT GUARD: If user has no familyId, NEVER fall back to another family!
    if (!targetFamilyId) {
      return res.json({
        family: null,
        membersCount: 0,
        documentsCount: 0,
        expiringCount: 0,
        expiringDocuments: [],
        totalSizeBytes: 0,
        storageLimitBytes: 53687091200,
        usagePercentage: '0.0',
      });
    }

    let family = null;
    let members = [];
    let docs = [];

    let useMongo = isConnected && mongoose.connection.readyState === 1;

    if (useMongo) {
      try {
        family = await Family.findById(targetFamilyId);
        if (family) {
          members = await User.find({ familyId: family._id });
          docs = await Document.find({ familyId: family._id });
        }
      } catch (dbErr) {
        useMongo = false;
        family = null;
      }
    }

    if (!useMongo || !family) {
      family = memoryStore.families.find(f => f._id.toString() === targetFamilyId.toString()) || null;
      if (family) {
        members = memoryStore.users.filter(u => u.familyId?.toString() === family._id.toString());
        docs = memoryStore.documents.filter(d => d.familyId?.toString() === family._id.toString());
      }
    }

    if (!family) {
      return res.json({
        family: null,
        membersCount: 0,
        documentsCount: 0,
        expiringCount: 0,
        expiringDocuments: [],
        totalSizeBytes: 0,
        storageLimitBytes: 53687091200,
        usagePercentage: '0.0',
      });
    }

    const totalSize = docs.reduce((acc, d) => acc + (d.fileSize || 0), 0);

    // Calculate documents expiring within next 30 days
    const now = Date.now();
    const thirtyDaysFromNow = now + 30 * 86400000;
    const expiringDocs = docs.filter(d => {
      if (!d.expiryDate) return false;
      const exp = new Date(d.expiryDate).getTime();
      return exp > now && exp <= thirtyDaysFromNow;
    });

    res.json({
      family,
      membersCount: members.length,
      documentsCount: docs.length,
      expiringCount: expiringDocs.length,
      expiringDocuments: expiringDocs,
      totalSizeBytes: totalSize,
      storageLimitBytes: family.storageLimitBytes || 53687091200,
      usagePercentage: ((totalSize / (family.storageLimitBytes || 53687091200)) * 100).toFixed(1),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/family/current — Update Family Vault Name
router.put('/current', async (req, res) => {
  try {
    let targetFamilyId = req.headers['x-family-id'] || req.familyId || req.user?.familyId;
    const currentUserId = (req.userId || req.user?._id || req.user?.id)?.toString();

    if (!targetFamilyId && currentUserId) {
      if (isConnected) {
        const f = await Family.findOne({ adminId: currentUserId });
        if (f) targetFamilyId = f._id;
      } else {
        const f = memoryStore.families.find(fam => fam.adminId?.toString() === currentUserId);
        if (f) targetFamilyId = f._id;
      }
    }

    if (!targetFamilyId) {
      return res.status(400).json({ error: 'No active family vault found to update.' });
    }

    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Family vault name cannot be empty.' });
    }

    const trimmedName = name.trim();
    let family = null;
    let useMongo = isConnected && mongoose.connection.readyState === 1;

    if (useMongo) {
      try {
        family = await Family.findByIdAndUpdate(
          targetFamilyId,
          { name: trimmedName },
          { new: true }
        );
      } catch (dbErr) {
        useMongo = false;
        family = null;
      }
    }

    if (!useMongo || !family) {
      const memFamily = memoryStore.families.find(
        f => f._id.toString() === targetFamilyId.toString()
      );
      if (memFamily) {
        memFamily.name = trimmedName;
        family = memFamily;
      }
    }

    if (!family) {
      return res.status(404).json({ error: 'Family vault not found.' });
    }

    try {
      if (typeof recordAuditLog === 'function') {
        await recordAuditLog({
          familyId: targetFamilyId,
          action: 'FAMILY_RENAMED',
          performedBy: currentUserId,
          targetName: trimmedName,
          details: `Family Vault name updated to "${trimmedName}"`,
        });
      }
    } catch (auditErr) {
      // non-blocking
    }

    res.json({ success: true, family });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/family/emergency-card (Quick Emergency Medical Hospital Card for the entire family)
router.get('/emergency-card', async (req, res) => {
  try {
    const targetFamilyId = req.familyId || req.user?.familyId;

    if (!targetFamilyId) {
      return res.json({ familyName: 'Family Vault', members: [], medicalDocs: [] });
    }

    let family = null;
    let members = [];
    let medicalDocs = [];

    let useMongo = isConnected && mongoose.connection.readyState === 1;

    if (useMongo) {
      try {
        family = await Family.findById(targetFamilyId);
        if (family) {
          members = await User.find({ familyId: family._id });
          medicalDocs = await Document.find({
            familyId: family._id,
            category: { $in: ['Medical & Health', 'Health', 'Medical'] },
          });
        }
      } catch (dbErr) {
        useMongo = false;
        family = null;
      }
    }

    if (!useMongo || !family) {
      family = memoryStore.families.find(f => f._id.toString() === targetFamilyId.toString()) || null;
      if (family) {
        members = memoryStore.users.filter(u => u.familyId?.toString() === family._id.toString());
        medicalDocs = memoryStore.documents.filter(
          d => d.familyId?.toString() === family._id.toString() &&
          (d.category === 'Medical & Health' || d.category === 'Health' || d.category === 'Medical')
        );
      }
    }

    if (!family) {
      return res.json({ familyName: 'Family Vault', members: [], medicalDocs: [] });
    }

    const emergencyRoster = members.map(m => {
      // Find assigned medical doc for this member to auto-fill any missing emergency credentials
      const memberMedicalDoc = medicalDocs.find(d => d.assignedMemberId?.toString() === m._id.toString());
      const docEmergency = memberMedicalDoc?.ocrExtractedData?.emergencyDetails || {};

      const bloodGroup = (m.bloodGroup && m.bloodGroup !== 'Not specified')
        ? m.bloodGroup
        : (docEmergency.bloodGroup || 'Not specified');

      const healthInsurancePolicy = (m.healthInsurancePolicy && m.healthInsurancePolicy !== 'Not set')
        ? m.healthInsurancePolicy
        : (docEmergency.policyNumber || memberMedicalDoc?.documentNumber || 'Not set');

      const tpaNumber = (m.tpaNumber && m.tpaNumber !== 'Not set')
        ? m.tpaNumber
        : ([docEmergency.tpaProvider, docEmergency.tollFreeHelpLine].filter(Boolean).join(' • ') || 'Not set');

      const allergies = (m.allergies && m.allergies !== 'None reported')
        ? m.allergies
        : (docEmergency.allergies || 'None reported');

      return {
        id: m._id,
        _id: m._id,
        name: m.name,
        relation: m.relationship || 'Member',
        relationship: m.relationship || 'Member',
        avatar: m.avatar,
        avatarUrl: m.avatar,
        dob: m.dateOfBirth || '',
        dateOfBirth: m.dateOfBirth || '',
        phone: m.phone || 'Not set',
        bloodGroup,
        emergencyContactPhone: m.emergencyContactPhone || m.phone || 'Not set',
        healthInsurancePolicy,
        tpaNumber,
        allergies,
        isEmergencyContact: Boolean(m.isEmergencyContact),
      };
    });

    res.json({
      familyName: family.name,
      emergencyContacts: emergencyRoster.filter(m => m.isEmergencyContact),
      members: emergencyRoster,
      insuranceDocuments: medicalDocs.map(d => ({
        id: d._id,
        title: d.title,
        documentNumber: d.documentNumber,
        assignedMemberName: members.find(m => m._id.toString() === d.assignedMemberId?.toString())?.name || 'Family',
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/family/setup
router.post('/setup', async (req, res) => {
  try {
    const { name } = req.body;
    const inviteCode = 'GHAR-' + Math.floor(1000 + Math.random() * 9000);
    const vaultName = name?.trim() || 'My Family Vault';

    let user = req.user;
    if (!user && req.userId) {
      if (isConnected) {
        user = await User.findById(req.userId);
      } else {
        user = memoryStore.users.find(u => u._id.toString() === req.userId.toString());
      }
    }

    let family;
    if (isConnected) {
      family = await Family.create({
        name: vaultName,
        inviteCode,
        adminId: user ? user._id : null,
        storageLimitBytes: 53687091200,
        storageUsedBytes: 0,
      });

      if (user) {
        user.familyId = family._id;
        user.role = 'ADMIN';
        user.relationship = user.relationship || 'Head of Family';
        user.permissions = {
          canUpload: true,
          canDownload: true,
          canDelete: true,
          canViewSensitive: true,
          canSignQuorum: true,
          canArmBreakGlass: true,
        };
        await user.save();
      } else {
        user = await User.create({
          name: 'Family Admin',
          email: `admin_${Date.now()}@gharvault.local`,
          avatar: 'https://ui-avatars.com/api/?name=Admin&background=3ECF8E&color=000&size=150',
          role: 'ADMIN',
          relationship: 'Head of Family',
          familyId: family._id,
          permissions: {
            canUpload: true,
            canDownload: true,
            canDelete: true,
            canViewSensitive: true,
            canSignQuorum: true,
            canArmBreakGlass: true,
          },
        });
        family.adminId = user._id;
        await family.save();
      }
    } else {
      family = {
        _id: 'fam_' + Date.now(),
        name: vaultName,
        inviteCode,
        adminId: user ? user._id : null,
        storageLimitBytes: 53687091200,
        storageUsedBytes: 0,
        createdAt: new Date(),
      };

      if (user) {
        user.familyId = family._id;
        user.role = 'ADMIN';
        user.relationship = user.relationship || 'Head of Family';
      } else {
        user = {
          _id: 'user_' + Date.now(),
          name: 'Family Admin',
          email: `admin_${Date.now()}@gharvault.local`,
          avatar: 'https://ui-avatars.com/api/?name=Admin&background=3ECF8E&color=000&size=150',
          role: 'ADMIN',
          relationship: 'Head of Family',
          familyId: family._id,
          permissions: {
            canUpload: true,
            canDownload: true,
            canDelete: true,
            canViewSensitive: true,
            canSignQuorum: true,
            canArmBreakGlass: true,
          },
          createdAt: new Date(),
        };
        memoryStore.users.push(user);
      }
      family.adminId = user._id;
      memoryStore.families.push(family);
    }

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      family,
      user,
      token,
      message: 'Family Vault created successfully',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/family/join
router.post('/join', async (req, res) => {
  try {
    const { inviteCode, name, email, relationship, phone, bloodGroup } = req.body;

    if (!inviteCode || !inviteCode.trim()) {
      return res.status(400).json({ error: 'Please enter a valid family invite code' });
    }

    const cleanCode = inviteCode.trim().toUpperCase();

    let family = null;
    if (isConnected) {
      family = await Family.findOne({ inviteCode: cleanCode });
    } else {
      family = memoryStore.families.find(
        f => f.inviteCode?.toUpperCase() === cleanCode
      );
    }

    if (!family) {
      return res.status(404).json({ error: 'Invalid Family Invite Code. Please check with your family admin.' });
    }

    // Check if the user is already authenticated or exists in database
    let user = req.user;
    const userEmail = (user?.email || email || '').toLowerCase().trim();

    if (!user && (userEmail || req.userId)) {
      if (isConnected) {
        if (req.userId) {
          try {
            user = await User.findById(req.userId);
          } catch (e) {}
        }
        if (!user && userEmail) {
          try {
            user = await User.findOne({ email: userEmail });
          } catch (e) {}
        }
      } else {
        if (req.userId) user = memoryStore.users.find(u => u._id?.toString() === req.userId?.toString());
        if (!user && userEmail) user = memoryStore.users.find(u => u.email?.toLowerCase() === userEmail);
      }
    }

    if (user) {
      // Existing user: Link them to this family!
      if (isConnected) {
        user.familyId = family._id;
        if (relationship) user.relationship = relationship;
        if (phone) user.phone = phone;
        if (bloodGroup) user.bloodGroup = bloodGroup;
        if (family.adminId && family.adminId.toString() !== user._id.toString()) {
          user.role = 'MEMBER';
        }
        await user.save();
      } else {
        user.familyId = family._id;
        if (relationship) user.relationship = relationship;
        if (phone) user.phone = phone;
        if (bloodGroup) user.bloodGroup = bloodGroup;
        if (family.adminId && family.adminId.toString() !== user._id.toString()) {
          user.role = 'MEMBER';
        }
      }
    } else {
      // Create new user for this family
      const cleanName = name?.trim() || userEmail.split('@')[0] || 'Family Member';
      const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=3ECF8E&color=000&size=150`;

      if (isConnected) {
        user = await User.create({
          name: cleanName,
          email: userEmail || `member_${Date.now()}@gharvault.local`,
          avatar,
          relationship: relationship || 'Family Member',
          role: 'MEMBER',
          familyId: family._id,
          phone: phone || '',
          bloodGroup: bloodGroup || '',
          permissions: { canUpload: true, canDownload: true, canDelete: false, canViewSensitive: true },
        });
      } else {
        user = {
          _id: 'user_' + Date.now(),
          name: cleanName,
          email: userEmail || `member_${Date.now()}@gharvault.local`,
          avatar,
          relationship: relationship || 'Family Member',
          role: 'MEMBER',
          familyId: family._id,
          phone: phone || '',
          bloodGroup: bloodGroup || '',
          healthInsurancePolicy: '',
          isEmergencyContact: false,
          permissions: { canUpload: true, canDownload: true, canDelete: false, canViewSensitive: true },
          createdAt: new Date(),
        };
        memoryStore.users.push(user);
      }
    }

    const token = generateToken(user);

    res.json({
      success: true,
      member: user,
      user,
      family,
      token,
      message: `Successfully joined ${family.name}!`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/family/members
router.get('/members', async (req, res) => {
  try {
    const targetFamilyId = req.familyId || req.user?.familyId;

    if (!targetFamilyId) {
      return res.json({ members: [], total: 0 });
    }

    let members = [];
    let docs = [];
    let useMongo = isConnected && mongoose.connection.readyState === 1;

    if (useMongo) {
      try {
        members = await User.find({ familyId: targetFamilyId }).lean();
        docs = await Document.find({ familyId: targetFamilyId }).lean();
      } catch (dbErr) {
        useMongo = false;
        members = [];
        docs = [];
      }
    }

    if (!useMongo) {
      members = memoryStore.users.filter(u => u.familyId?.toString() === targetFamilyId.toString());
      docs = memoryStore.documents.filter(d => d.familyId?.toString() === targetFamilyId.toString());
    }

    const membersWithDocs = members.map(m => {
      const assigned = docs.filter(d => d.assignedMemberId?.toString() === m._id?.toString());
      return {
        ...m,
        id: m._id,
        relation: m.relationship || 'Member',
        relationship: m.relationship || 'Member',
        dob: m.dateOfBirth || '',
        dateOfBirth: m.dateOfBirth || '',
        avatarUrl: m.avatar,
        avatar: m.avatar,
        assignedDocumentsCount: assigned.length,
      };
    });

    res.json({ members: membersWithDocs, total: membersWithDocs.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/family/members — Add Family Member directly
router.post('/members', async (req, res) => {
  try {
    const {
      name,
      relationship = 'Family Member',
      phone = '',
      email = '',
      bloodGroup = '',
      dateOfBirth = '',
      dob = '',
      emergencyContactPhone = '',
      healthInsurancePolicy = '',
      allergies = '',
      isEmergencyContact = false,
      role = 'MEMBER',
    } = req.body;

    const finalDob = dateOfBirth || dob || '';

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Member name is required' });
    }

    const cleanName = name.trim();
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=10B981&color=fff&size=150`;

    let familyId = req.familyId || req.user?.familyId || req.body?.familyId;

    if (!familyId && (req.user?._id || req.userId)) {
      const uId = req.user?._id || req.userId;
      if (isConnected) {
        let fam = await Family.findOne({ adminId: uId });
        if (!fam) {
          const u = await User.findById(uId);
          if (u?.familyId) {
            fam = await Family.findById(u.familyId);
          }
        }
        if (!fam) {
          fam = await Family.create({
            name: `${(req.user?.name || 'My').split(' ')[0]}'s Family Vault`,
            inviteCode: 'GHAR-' + Math.floor(1000 + Math.random() * 9000),
            adminId: uId,
          });
        }
        familyId = fam._id;
        if (req.user) req.user.familyId = fam._id;
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
      return res.status(400).json({ error: 'You must belong to a family vault to add members. Please create or join a family first.' });
    }

    const hasCustomEmail = Boolean(email?.trim());
    let cleanEmail = '';

    if (hasCustomEmail) {
      cleanEmail = email.toLowerCase().trim();
      if (isConnected) {
        const existing = await User.findOne({ email: cleanEmail });
        if (existing) {
          if (existing.familyId?.toString() === familyId.toString()) {
            return res.status(400).json({ error: `A family member with email "${cleanEmail}" is already in your family vault.` });
          } else {
            return res.status(400).json({ error: `The email "${cleanEmail}" is already linked to another family vault.` });
          }
        }
      } else {
        const existing = memoryStore.users.find(u => u.email.toLowerCase() === cleanEmail);
        if (existing) {
          if (existing.familyId?.toString() === familyId.toString()) {
            return res.status(400).json({ error: `A family member with email "${cleanEmail}" is already in your family vault.` });
          } else {
            return res.status(400).json({ error: `The email "${cleanEmail}" is already linked to another family vault.` });
          }
        }
      }
    } else {
      // Guaranteed unique collision-free synthetic email
      const safePrefix = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'member';
      cleanEmail = `${safePrefix}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}@family.ghar`;
    }

    let newMember = null;
    let useMongo = isConnected && mongoose.connection.readyState === 1;

    if (useMongo) {
      try {
        newMember = await User.create({
          name: cleanName,
          email: cleanEmail,
          avatar,
          relationship,
          phone,
          bloodGroup,
          dateOfBirth: finalDob,
          emergencyContactPhone: emergencyContactPhone || phone,
          healthInsurancePolicy,
          allergies,
          isEmergencyContact: Boolean(isEmergencyContact),
          role,
          familyId,
          permissions: {
            canUpload: true,
            canDownload: true,
            canDelete: role === 'ADMIN',
            canViewSensitive: true,
          },
        });
      } catch (dbErr) {
        console.warn('[Database Fallback] User.create failed, falling back to memory store:', dbErr.message);
        useMongo = false;
        newMember = null;
      }
    }

    if (!useMongo || !newMember) {
      newMember = {
        _id: 'user_' + Date.now(),
        name: cleanName,
        email: cleanEmail,
        avatar,
        relationship,
        phone,
        bloodGroup,
        dateOfBirth: finalDob,
        emergencyContactPhone: emergencyContactPhone || phone,
        healthInsurancePolicy,
        allergies,
        isEmergencyContact: Boolean(isEmergencyContact),
        role,
        familyId,
        permissions: {
          canUpload: true,
          canDownload: true,
          canDelete: role === 'ADMIN',
          canViewSensitive: true,
        },
        createdAt: new Date(),
      };
      memoryStore.users.push(newMember);
    }

    // Add activity log
    const logItem = {
      _id: 'audit_' + Date.now(),
      action: 'MEMBER_ADDED',
      performerName: req.user?.name || 'Family Admin',
      details: { memberName: cleanName, relationship },
      sha256ChainHash: crypto.createHash('sha256').update(cleanName + Date.now()).digest('hex'),
      timestamp: new Date(),
    };
    memoryStore.auditLogs.unshift(logItem);

    const normalizedMember = {
      ...(newMember.toObject ? newMember.toObject() : newMember),
      id: newMember._id,
      relation: newMember.relationship || relationship,
      relationship: newMember.relationship || relationship,
      dob: newMember.dateOfBirth || finalDob,
      dateOfBirth: newMember.dateOfBirth || finalDob,
      avatarUrl: newMember.avatar || avatar,
      avatar: newMember.avatar || avatar,
      assignedDocumentsCount: 0,
    };

    res.status(201).json({
      success: true,
      member: normalizedMember,
      message: `${cleanName} added to family!`,
    });
  } catch (err) {
    console.error('[Add Member Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/family/members/:id
router.get('/members/:id', async (req, res) => {
  try {
    const targetFamilyId = req.familyId || req.user?.familyId;
    let member = null;
    let assignedDocs = [];

    if (isConnected) {
      member = await User.findById(req.params.id);
      if (member) {
        if (targetFamilyId && member.familyId && member.familyId.toString() !== targetFamilyId.toString()) {
          return res.status(403).json({ error: 'Access forbidden. Member belongs to another family vault.' });
        }
        assignedDocs = await Document.find({ assignedMemberId: member._id, familyId: member.familyId });
      }
    } else {
      member = memoryStore.users.find(u => u._id.toString() === req.params.id);
      if (member) {
        if (targetFamilyId && member.familyId && member.familyId.toString() !== targetFamilyId.toString()) {
          return res.status(403).json({ error: 'Access forbidden. Member belongs to another family vault.' });
        }
        assignedDocs = memoryStore.documents.filter(d => d.assignedMemberId?.toString() === member._id.toString() && d.familyId?.toString() === member.familyId?.toString());
      }
    }

    if (!member) {
      return res.status(404).json({ error: 'Family member not found' });
    }

    const enrichedMember = {
      ...(member.toObject ? member.toObject() : member),
      id: member._id,
      relation: member.relationship || 'Member',
      relationship: member.relationship || 'Member',
      dob: member.dateOfBirth || '',
      dateOfBirth: member.dateOfBirth || '',
      avatarUrl: member.avatar,
      avatar: member.avatar,
    };

    res.json({
      member: enrichedMember,
      assignedDocuments: assignedDocs,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/family/members/:id — Full Family Member Profile Update
router.put('/members/:id', async (req, res) => {
  try {
    const targetFamilyId = req.familyId || req.user?.familyId;
    const {
      name,
      relationship,
      relation,
      phone,
      email,
      bloodGroup,
      dateOfBirth,
      dob,
      healthInsurancePolicy,
      tpaNumber,
      allergies,
      emergencyContactPhone,
      isEmergencyContact,
      avatar,
      role,
    } = req.body;

    let existingMember = isConnected ? await User.findById(req.params.id) : memoryStore.users.find(u => u._id.toString() === req.params.id);
    if (!existingMember) return res.status(404).json({ error: 'Family member not found' });
    if (targetFamilyId && existingMember.familyId && existingMember.familyId.toString() !== targetFamilyId.toString()) {
      return res.status(403).json({ error: 'Access forbidden. Member belongs to another family vault.' });
    }

    const finalRel = relationship !== undefined ? relationship : relation;
    const finalDob = dateOfBirth !== undefined ? dateOfBirth : dob;

    const updates = {};
    if (name?.trim()) updates.name = name.trim();
    if (finalRel?.trim()) updates.relationship = finalRel.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (email !== undefined) updates.email = email.toLowerCase().trim();
    if (bloodGroup !== undefined) updates.bloodGroup = bloodGroup.trim();
    if (finalDob !== undefined) updates.dateOfBirth = finalDob.trim();
    if (healthInsurancePolicy !== undefined) updates.healthInsurancePolicy = healthInsurancePolicy.trim();
    if (tpaNumber !== undefined) updates.tpaNumber = tpaNumber.trim();
    if (allergies !== undefined) updates.allergies = allergies.trim();
    if (emergencyContactPhone !== undefined) updates.emergencyContactPhone = emergencyContactPhone.trim();
    if (isEmergencyContact !== undefined) updates.isEmergencyContact = Boolean(isEmergencyContact);
    if (avatar !== undefined) updates.avatar = avatar.trim();
    if (role?.trim()) updates.role = role.trim();

    let member = null;
    if (isConnected) {
      member = await User.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true }
      );
    } else {
      member = memoryStore.users.find(u => u._id.toString() === req.params.id);
      if (member) {
        Object.assign(member, updates);
      }
    }

    if (!member) return res.status(404).json({ error: 'Family member not found' });

    const enrichedUpdated = {
      ...(member?.toObject ? member.toObject() : member),
      id: member?._id,
      relation: member?.relationship || 'Member',
      relationship: member?.relationship || 'Member',
      dob: member?.dateOfBirth || '',
      dateOfBirth: member?.dateOfBirth || '',
      avatarUrl: member?.avatar,
      avatar: member?.avatar,
    };

    res.json({
      success: true,
      member: enrichedUpdated,
      message: `${member.name}'s profile updated successfully!`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/family/transfer-ownership — Transfer Primary Vault Ownership to Another Adult Member
router.post('/transfer-ownership', async (req, res) => {
  try {
    const { newAdminId } = req.body;
    let targetFamilyId = req.headers['x-family-id'] || req.familyId || req.user?.familyId;
    const currentUserId = (req.userId || req.user?._id)?.toString();

    if (!targetFamilyId && currentUserId) {
      if (isConnected) {
        const f = await Family.findOne({ adminId: currentUserId });
        if (f) targetFamilyId = f._id;
      } else {
        const f = memoryStore.families.find(fam => fam.adminId?.toString() === currentUserId);
        if (f) targetFamilyId = f._id;
      }
    }

    if (!targetFamilyId) {
      return res.status(400).json({ error: 'Family vault context could not be identified.' });
    }

    if (!newAdminId) {
      return res.status(400).json({ error: 'Please select a family member to transfer vault ownership to.' });
    }

    let useMongo = isConnected && mongoose.connection.readyState === 1;
    let family = null;

    if (useMongo && mongoose.Types.ObjectId.isValid(targetFamilyId)) {
      try {
        family = await Family.findById(targetFamilyId);
      } catch (e) {
        family = null;
      }
    }

    if (!family) {
      family = memoryStore.families.find(f => f._id?.toString() === targetFamilyId.toString());
    }

    if (!family) {
      return res.status(404).json({ error: 'Family vault not found.' });
    }

    const currentAdminId = family.adminId?.toString();

    // Verify caller is current Head / Admin
    const isCallerAdmin =
      (currentUserId && currentAdminId && currentUserId === currentAdminId) ||
      req.user?.role === 'ADMIN' ||
      req.user?.role === 'HEAD';

    if (!isCallerAdmin) {
      return res.status(403).json({ error: 'Only the current Head of Family can transfer ownership.' });
    }

    if (newAdminId.toString() === currentAdminId) {
      return res.status(400).json({ error: 'This member is already the Primary Head of Family.' });
    }

    // Fetch candidate new admin
    let newAdmin = null;
    if (useMongo && mongoose.Types.ObjectId.isValid(newAdminId)) {
      try {
        newAdmin = await User.findById(newAdminId);
      } catch (e) {
        newAdmin = null;
      }
    }

    if (!newAdmin) {
      newAdmin = memoryStore.users.find(u => u._id?.toString() === newAdminId.toString());
    }

    if (!newAdmin) {
      return res.status(404).json({ error: 'Selected member not found in this family.' });
    }

    if (newAdmin.familyId?.toString() !== targetFamilyId.toString()) {
      return res.status(403).json({ error: 'Selected member does not belong to your family vault.' });
    }

    // Fetch previous admin user
    let previousAdmin = null;
    if (currentAdminId) {
      if (useMongo && mongoose.Types.ObjectId.isValid(currentAdminId)) {
        try {
          previousAdmin = await User.findById(currentAdminId);
        } catch (e) {}
      }
      if (!previousAdmin) {
        previousAdmin = memoryStore.users.find(u => u._id?.toString() === currentAdminId);
      }
    }

    // 1. Promote candidate to HEAD
    newAdmin.role = 'HEAD';
    newAdmin.relationship = 'Head of Family';
    newAdmin.permissions = {
      canUpload: true,
      canDownload: true,
      canDelete: true,
      canViewSensitive: true,
      canSignQuorum: true,
      canArmBreakGlass: true,
    };

    if (useMongo && newAdmin.save) {
      await newAdmin.save();
    }

    // 2. Demote previous admin to EDITOR
    if (previousAdmin && previousAdmin._id?.toString() !== newAdmin._id?.toString()) {
      previousAdmin.role = 'EDITOR';
      if (previousAdmin.relationship === 'Head of Family') {
        previousAdmin.relationship = 'Family Member';
      }
      if (previousAdmin.permissions) {
        previousAdmin.permissions.canDelete = false;
      }
      if (useMongo && previousAdmin.save) {
        await previousAdmin.save();
      }
    }

    // 3. Update Family adminId
    family.adminId = newAdmin._id;
    if (useMongo && family.save) {
      await family.save();
    }

    // 4. Audit Log
    const prevName = previousAdmin?.name || req.user?.name || 'Previous Head';
    const newName = newAdmin.name || 'New Head';

    try {
      await recordAuditLog({
        familyId: targetFamilyId,
        action: 'OWNERSHIP_TRANSFERRED',
        performedBy: currentUserId,
        performerName: prevName,
        details: {
          previousAdminId: currentAdminId,
          previousAdminName: prevName,
          newAdminId: newAdmin._id,
          newAdminName: newName,
        },
        req,
      });
    } catch (logErr) {
      console.warn('[Audit Log Warning]', logErr.message);
    }

    return res.json({
      success: true,
      message: `Family Vault ownership successfully transferred to ${newName}. You are now an Editor.`,
      family,
      newAdmin,
      previousAdmin,
    });
  } catch (err) {
    console.error('[Transfer Ownership Error]', err);
    res.status(500).json({ error: err.message || 'Failed to transfer ownership.' });
  }
});

// DELETE /api/family/members/:id — Safe Member Removal, Ownership Guard & Vault Partitioning
router.delete('/members/:id', async (req, res) => {
  try {
    const memberId = req.params.id;
    const deleteDocuments = req.query.deleteDocuments === 'true' || req.body?.deleteDocuments === true;
    const keepOldCopy = req.query.keepOldCopy !== 'false' && req.body?.keepOldCopy !== false;

    // 1. Resolve target member first
    let targetMember = null;
    let useMongo = isConnected && mongoose.connection.readyState === 1;

    if (useMongo && mongoose.Types.ObjectId.isValid(memberId)) {
      try {
        targetMember = await User.findById(memberId);
      } catch (e) {
        targetMember = null;
      }
    }

    if (!targetMember) {
      targetMember = memoryStore.users.find(u => u._id?.toString() === memberId.toString());
    }

    if (!targetMember) {
      return res.status(404).json({ error: 'Family member not found.' });
    }

    const memberName = targetMember.name || 'Family Member';

    // 2. Resolve family ID
    let targetFamilyId =
      req.headers['x-family-id'] ||
      req.familyId ||
      req.user?.familyId ||
      req.body?.familyId ||
      targetMember.familyId;

    if (!targetFamilyId) {
      return res.status(400).json({ error: 'Family vault context could not be identified.' });
    }

    // 3. Fetch Family to identify Admin
    let family = null;
    if (useMongo && mongoose.Types.ObjectId.isValid(targetFamilyId)) {
      try {
        family = await Family.findById(targetFamilyId);
      } catch (e) {
        family = null;
      }
    }

    if (!family) {
      family = memoryStore.families.find(f => f._id?.toString() === targetFamilyId.toString());
    }

    if (!family) {
      family = { _id: targetFamilyId, name: 'Family Vault', adminId: null };
    }

    const adminId = family.adminId?.toString();
    const currentUserId = (req.userId || req.user?._id)?.toString();

    // 4. Admin Protection Guard: The Primary Head of Family cannot be removed!
    if (adminId && memberId.toString() === adminId) {
      return res.status(400).json({
        error: 'The Primary Head of Family cannot be removed. Please transfer ownership to another member before leaving.',
      });
    }

    // 5. Permission Check: Allow Admin or Self-leave
    const isSelfLeaving = currentUserId && currentUserId === memberId.toString();
    const isAdmin =
      !adminId ||
      (currentUserId && currentUserId === adminId) ||
      req.user?.role === 'ADMIN' ||
      req.user?.role === 'HEAD';

    if (!isAdmin && !isSelfLeaving) {
      return res.status(403).json({
        error: 'Only the Head of Family has permission to remove members from the vault.',
      });
    }

    // 6. Check if member is Google-linked or has an independent external account
    const isGoogleLinked = Boolean(
      (targetMember.googleId && !targetMember.googleId.startsWith('local_')) ||
      (targetMember.email &&
        !targetMember.email.includes('@family.ghar') &&
        !targetMember.email.includes('@gharvault.local') &&
        !targetMember.email.includes('member_') &&
        !targetMember.email.includes('admin_'))
    );

    let docsCount = 0;
    let migratedDocCount = 0;
    let deletedDocsCount = 0;
    let reassignedDocsCount = 0;

    if (isGoogleLinked) {
      // =========================================================================
      // CASE A: GOOGLE-LINKED MEMBER (SOVEREIGN VAULT PARTITIONING)
      // Automatically create a new Family Vault for this member and transfer/clone
      // all documents assigned to their profile into their new vault!
      // =========================================================================
      const newInviteCode = 'GHAR-' + Math.floor(1000 + Math.random() * 9000);
      const newVaultName = `${memberName.split(' ')[0]}'s Family Vault`;
      let newVault = null;

      if (useMongo) {
        try {
          newVault = await Family.create({
            name: newVaultName,
            inviteCode: newInviteCode,
            adminId: targetMember._id,
            storageLimitBytes: 53687091200,
            storageUsedBytes: 0,
          });
        } catch (dbErr) {
          console.warn('[Partition DB Fallback] Family.create failed:', dbErr.message);
          useMongo = false;
        }
      }

      if (!newVault) {
        newVault = {
          _id: 'fam_' + Date.now(),
          name: newVaultName,
          inviteCode: newInviteCode,
          adminId: targetMember._id,
          storageLimitBytes: 53687091200,
          storageUsedBytes: 0,
          createdAt: new Date(),
        };
        memoryStore.families.push(newVault);
      }

      // Update member to be Head of their new personal vault
      if (useMongo && targetMember.save) {
        targetMember.familyId = newVault._id;
        targetMember.role = 'HEAD';
        targetMember.relationship = 'Head of Family';
        await targetMember.save();
      } else {
        targetMember.familyId = newVault._id;
        targetMember.role = 'HEAD';
        targetMember.relationship = 'Head of Family';
      }

      // Fetch personal documents assigned to this member in the old vault
      let personalDocs = [];
      if (useMongo) {
        try {
          personalDocs = await Document.find({
            familyId: targetFamilyId,
            $or: [
              { assignedMemberId: memberId },
              { uploaderId: memberId }
            ]
          });
        } catch (e) {
          personalDocs = [];
        }
      }

      if (!personalDocs || personalDocs.length === 0) {
        personalDocs = memoryStore.documents.filter(d =>
          d.familyId?.toString() === targetFamilyId.toString() &&
          (d.assignedMemberId?.toString() === memberId.toString() || d.uploaderId?.toString() === memberId.toString())
        );
      }

      docsCount = personalDocs.length;

      // Handle personal documents: Clone (Keep Copy) or Move
      for (const doc of personalDocs) {
        if (keepOldCopy) {
          // Option 1: Keep a shared copy in old family vault (Joint Archive) and migrate copy to new vault
          if (useMongo && doc.toObject) {
            try {
              const cloneData = doc.toObject();
              delete cloneData._id;
              delete cloneData.createdAt;
              delete cloneData.updatedAt;

              cloneData.familyId = newVault._id;
              cloneData.assignedMemberId = targetMember._id;
              cloneData.uploaderId = targetMember._id;
              cloneData.whoCanView = ['ALL'];

              await Document.create(cloneData);
            } catch (cloneErr) {
              console.warn('[Clone Document Warning]', cloneErr.message);
            }

            // Original doc stays in old vault as Joint Family Record
            doc.assignedMemberId = null;
            if (adminId && mongoose.Types.ObjectId.isValid(adminId)) {
              doc.uploaderId = new mongoose.Types.ObjectId(adminId);
            }
            await doc.save();
          } else {
            const memoryClone = {
              ...doc,
              _id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
              familyId: newVault._id,
              assignedMemberId: targetMember._id,
              uploaderId: targetMember._id,
              whoCanView: ['ALL'],
              createdAt: new Date(),
            };
            memoryStore.documents.push(memoryClone);

            doc.assignedMemberId = null;
            doc.uploaderId = adminId || null;
          }
          reassignedDocsCount++;
        } else {
          // Option 2: Move documents exclusively to the new personal vault
          if (useMongo && doc.save) {
            doc.familyId = newVault._id;
            doc.assignedMemberId = targetMember._id;
            doc.uploaderId = targetMember._id;
            doc.whoCanView = ['ALL'];
            await doc.save();
          } else {
            doc.familyId = newVault._id;
            doc.assignedMemberId = targetMember._id;
            doc.uploaderId = targetMember._id;
            doc.whoCanView = ['ALL'];
          }
        }
        migratedDocCount++;
      }

      // Auto-Clean whoCanView across all remaining documents in the old family
      if (useMongo) {
        try {
          const oldFamilyDocs = await Document.find({ familyId: targetFamilyId });
          for (const doc of oldFamilyDocs) {
            if (Array.isArray(doc.whoCanView) && doc.whoCanView.some(id => id && id.toString() === memberId.toString())) {
              doc.whoCanView = doc.whoCanView.filter(id => id && id.toString() !== memberId.toString());
              if (doc.whoCanView.length === 0) {
                // Transfer access to Family Head so document is never orphaned
                doc.whoCanView = adminId ? [adminId.toString()] : ['ALL'];
              }
              await doc.save();
            }
          }
        } catch (e) {}
      } else {
        memoryStore.documents
          .filter(d => d.familyId?.toString() === targetFamilyId.toString())
          .forEach(doc => {
            if (Array.isArray(doc.whoCanView) && doc.whoCanView.some(id => id && id.toString() === memberId.toString())) {
              doc.whoCanView = doc.whoCanView.filter(id => id && id.toString() !== memberId.toString());
              if (doc.whoCanView.length === 0) {
                doc.whoCanView = adminId ? [adminId.toString()] : ['ALL'];
              }
            }
          });
      }

      // Log Sovereign Migration in Audit Log
      const adminName = req.user?.name || 'Head of Family';
      try {
        await recordAuditLog({
          familyId: targetFamilyId,
          action: 'MEMBER_REMOVED',
          performedBy: currentUserId,
          performerName: adminName,
          details: {
            removedMemberName: memberName,
            removedMemberId: memberId,
            wasGoogleLinked: true,
            sovereignPartition: true,
            keepOldCopy,
            newVaultId: newVault._id,
            newVaultName,
            migratedDocCount,
            reassignedDocsCount,
          },
          req,
        });
      } catch (logErr) {
        console.warn('[Audit Log Warning]', logErr.message);
      }

      return res.json({
        success: true,
        action: 'SOVEREIGN_MIGRATION',
        isGoogleLinked: true,
        keepOldCopy,
        migratedDocCount,
        reassignedDocsCount,
        newVaultName,
        message: `${adminName} (Admin) removed ${memberName} from Family Vault. Their personal vault (${newVaultName}) has been provisioned with all ${migratedDocCount} documents.`,
      });

    } else {
      // =========================================================================
      // CASE B: LOCAL / OFFLINE MEMBER PROFILE (NON-GOOGLE)
      // =========================================================================
      let memberDocs = [];
      if (useMongo) {
        try {
          memberDocs = await Document.find({
            familyId: targetFamilyId,
            $or: [
              { assignedMemberId: memberId },
              { uploaderId: memberId }
            ]
          });
        } catch (e) {
          memberDocs = [];
        }
      }

      if (!memberDocs || memberDocs.length === 0) {
        memberDocs = memoryStore.documents.filter(d =>
          d.familyId?.toString() === targetFamilyId.toString() &&
          (d.assignedMemberId?.toString() === memberId.toString() || d.uploaderId?.toString() === memberId.toString())
        );
      }

      docsCount = memberDocs.length;

      if (deleteDocuments) {
        // Option 2: Permanently delete documents
        for (const doc of memberDocs) {
          try {
            if (doc.storagePath) await deleteDocument(doc.storagePath);
          } catch (e) {}
          if (useMongo && doc._id && mongoose.Types.ObjectId.isValid(doc._id)) {
            try {
              await Document.findByIdAndDelete(doc._id);
            } catch (e) {}
          }
          const mIdx = memoryStore.documents.findIndex(d => d._id?.toString() === doc._id?.toString());
          if (mIdx !== -1) memoryStore.documents.splice(mIdx, 1);
          deletedDocsCount++;
        }
      } else {
        // Option 1 (Default): Reassign documents to Joint / Family Archive
        for (const doc of memberDocs) {
          doc.assignedMemberId = null;
          if (adminId && mongoose.Types.ObjectId.isValid(adminId)) {
            doc.uploaderId = new mongoose.Types.ObjectId(adminId);
          }
          if (useMongo && doc.save) {
            try { await doc.save(); } catch (e) {}
          }
          reassignedDocsCount++;
        }
      }

      // Auto-Clean whoCanView across all remaining documents in the old family
      if (useMongo) {
        try {
          const oldFamilyDocs = await Document.find({ familyId: targetFamilyId });
          for (const doc of oldFamilyDocs) {
            if (Array.isArray(doc.whoCanView) && doc.whoCanView.some(id => id && id.toString() === memberId.toString())) {
              doc.whoCanView = doc.whoCanView.filter(id => id && id.toString() !== memberId.toString());
              if (doc.whoCanView.length === 0) {
                doc.whoCanView = adminId ? [adminId.toString()] : ['ALL'];
              }
              await doc.save();
            }
          }
        } catch (e) {}
      }
      memoryStore.documents
        .filter(d => d.familyId?.toString() === targetFamilyId.toString())
        .forEach(doc => {
          if (Array.isArray(doc.whoCanView) && doc.whoCanView.some(id => id && id.toString() === memberId.toString())) {
            doc.whoCanView = doc.whoCanView.filter(id => id && id.toString() !== memberId.toString());
            if (doc.whoCanView.length === 0) {
              doc.whoCanView = adminId ? [adminId.toString()] : ['ALL'];
            }
          }
        });

      // Delete the local member record
      if (useMongo && mongoose.Types.ObjectId.isValid(memberId)) {
        try {
          await User.findByIdAndDelete(memberId);
        } catch (e) {}
      }
      const uIdx = memoryStore.users.findIndex(u => u._id?.toString() === memberId.toString());
      if (uIdx !== -1) memoryStore.users.splice(uIdx, 1);

      // Audit Log
      const adminName = req.user?.name || 'Head of Family';
      try {
        await recordAuditLog({
          familyId: targetFamilyId,
          action: 'MEMBER_REMOVED',
          performedBy: currentUserId,
          performerName: adminName,
          details: {
            removedMemberName: memberName,
            removedMemberId: memberId,
            wasGoogleLinked: false,
            reassignedDocsCount,
            deletedDocsCount,
          },
          req,
        });
      } catch (logErr) {
        console.warn('[Audit Log Warning]', logErr.message);
      }

      return res.json({
        success: true,
        action: 'PROFILE_REMOVED',
        isGoogleLinked: false,
        reassignedDocsCount,
        deletedDocsCount,
        message: `${adminName} (Admin) removed ${memberName} from Family Vault. All ${reassignedDocsCount} documents remain safely stored in your Joint Family Archive.`,
      });
    }
  } catch (err) {
    console.error('[Delete Member Error]', err);
    res.status(500).json({ error: err.message || 'Failed to remove family member.' });
  }
});

export default router;
