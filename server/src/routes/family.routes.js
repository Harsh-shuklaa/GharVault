import express from 'express';
import crypto from 'crypto';
import { memoryStore } from '../config/seed.js';
import User from '../models/User.js';
import Family from '../models/Family.js';
import Document from '../models/Document.js';
import { isConnected } from '../config/db.js';
import { generateToken } from './auth.routes.js';

const router = express.Router();

// GET /api/family/current
router.get('/current', async (req, res) => {
  try {
    let family = null;
    let members = [];
    let docs = [];

    if (isConnected) {
      family = await Family.findOne().sort({ createdAt: -1 });
      if (family) {
        members = await User.find({ familyId: family._id });
        docs = await Document.find({ familyId: family._id });
      }
    } else {
      family = memoryStore.families[0] || null;
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

// GET /api/family/emergency-card (Quick Emergency Medical Hospital Card for the entire family)
router.get('/emergency-card', async (req, res) => {
  try {
    let family = null;
    let members = [];
    let medicalDocs = [];

    if (isConnected) {
      family = await Family.findOne().sort({ createdAt: -1 });
      if (family) {
        members = await User.find({ familyId: family._id });
        medicalDocs = await Document.find({
          familyId: family._id,
          category: { $in: ['Medical & Health', 'Health', 'Medical'] },
        });
      }
    } else {
      family = memoryStore.families[0] || null;
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

    const emergencyRoster = members.map(m => ({
      id: m._id,
      name: m.name,
      relationship: m.relationship,
      avatar: m.avatar,
      phone: m.phone || 'Not set',
      bloodGroup: m.bloodGroup || 'Not specified',
      emergencyContactPhone: m.emergencyContactPhone || m.phone || 'Not set',
      healthInsurancePolicy: m.healthInsurancePolicy || 'Not set',
      tpaNumber: m.tpaNumber || 'Not set',
      allergies: m.allergies || 'None reported',
      isEmergencyContact: Boolean(m.isEmergencyContact),
    }));

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

    let family;
    let user;
    if (isConnected) {
      family = await Family.create({
        name: vaultName,
        inviteCode,
        storageLimitBytes: 53687091200,
        storageUsedBytes: 0,
      });

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
    } else {
      family = {
        _id: 'fam_' + Date.now(),
        name: vaultName,
        inviteCode,
        adminId: null,
        storageLimitBytes: 53687091200,
        storageUsedBytes: 0,
        createdAt: new Date(),
      };
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
      family.adminId = user._id;
      memoryStore.families = [family];
      memoryStore.users = [user];
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

    let family = null;
    if (isConnected) {
      family = await Family.findOne({ inviteCode: inviteCode?.trim()?.toUpperCase() });
    } else {
      family = memoryStore.families.find(
        f => f.inviteCode.toUpperCase() === inviteCode?.trim()?.toUpperCase()
      );
    }

    if (!family) {
      return res.status(404).json({ error: 'Invalid Family Invite Code. Please check with your family admin.' });
    }

    const cleanEmail = email?.trim()?.toLowerCase() || `member_${Date.now()}@gmail.com`;
    const cleanName = name?.trim() || 'Family Member';
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=2563EB&color=fff&size=150`;

    let newMember;
    if (isConnected) {
      newMember = await User.create({
        name: cleanName,
        email: cleanEmail,
        avatar,
        relationship: relationship || 'Family Member',
        role: 'MEMBER',
        familyId: family._id,
        phone: phone || '',
        bloodGroup: bloodGroup || '',
        permissions: { canUpload: true, canDownload: true, canDelete: false, canViewSensitive: true },
      });
    } else {
      newMember = {
        _id: 'user_' + Date.now(),
        name: cleanName,
        email: cleanEmail,
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
      memoryStore.users.push(newMember);
    }

    const token = generateToken(newMember);

    res.json({
      success: true,
      member: newMember,
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
    let members = [];
    let docs = [];

    if (isConnected) {
      members = await User.find().lean();
      docs = await Document.find().lean();
    } else {
      members = memoryStore.users;
      docs = memoryStore.documents;
    }

    const membersWithDocs = members.map(m => {
      const assigned = docs.filter(d => d.assignedMemberId?.toString() === m._id?.toString());
      return {
        ...m,
        assignedDocumentsCount: assigned.length,
      };
    });

    res.json({ members: membersWithDocs });
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
      emergencyContactPhone = '',
      healthInsurancePolicy = '',
      allergies = '',
      isEmergencyContact = false,
      role = 'MEMBER',
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Member name is required' });
    }

    const cleanName = name.trim();
    const cleanEmail = email?.trim() ? email.toLowerCase().trim() : `${cleanName.toLowerCase().replace(/\s+/g, '.')}${Date.now().toString().slice(-4)}@family.ghar`;
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=2563EB&color=fff&size=150`;

    let familyId = null;
    if (isConnected) {
      const fam = await Family.findOne().sort({ createdAt: -1 });
      familyId = fam?._id;
    } else {
      familyId = memoryStore.families[0]?._id;
    }

    let newMember;
    if (isConnected) {
      newMember = await User.create({
        name: cleanName,
        email: cleanEmail,
        avatar,
        relationship,
        phone,
        bloodGroup,
        dateOfBirth,
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
    } else {
      newMember = {
        _id: 'user_' + Date.now(),
        name: cleanName,
        email: cleanEmail,
        avatar,
        relationship,
        phone,
        bloodGroup,
        dateOfBirth,
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
      performerName: 'Family Admin',
      details: { memberName: cleanName, relationship },
      sha256ChainHash: crypto.createHash('sha256').update(cleanName + Date.now()).digest('hex'),
      timestamp: new Date(),
    };
    memoryStore.auditLogs.unshift(logItem);

    res.status(201).json({
      success: true,
      member: newMember,
      message: `${cleanName} added to family!`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/family/members/:id
router.get('/members/:id', async (req, res) => {
  try {
    let member = null;
    let assignedDocs = [];

    if (isConnected) {
      member = await User.findById(req.params.id);
      if (member) {
        assignedDocs = await Document.find({ assignedMemberId: member._id });
      }
    } else {
      member = memoryStore.users.find(u => u._id.toString() === req.params.id);
      if (member) {
        assignedDocs = memoryStore.documents.filter(d => d.assignedMemberId?.toString() === member._id.toString());
      }
    }

    if (!member) {
      return res.status(404).json({ error: 'Family member not found' });
    }

    res.json({
      member,
      assignedDocuments: assignedDocs,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/family/members/:id — Full Family Member Profile Update
router.put('/members/:id', async (req, res) => {
  try {
    const {
      name,
      relationship,
      phone,
      email,
      bloodGroup,
      dateOfBirth,
      healthInsurancePolicy,
      tpaNumber,
      allergies,
      emergencyContactPhone,
      isEmergencyContact,
      avatar,
      role,
    } = req.body;

    const updates = {};
    if (name?.trim()) updates.name = name.trim();
    if (relationship?.trim()) updates.relationship = relationship.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (email !== undefined) updates.email = email.toLowerCase().trim();
    if (bloodGroup !== undefined) updates.bloodGroup = bloodGroup.trim();
    if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth.trim();
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

    res.json({
      success: true,
      member,
      message: `${member.name}'s profile updated successfully!`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
