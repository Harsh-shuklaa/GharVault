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

    if (isConnected) {
      family = await Family.findById(targetFamilyId);
      if (family) {
        members = await User.find({ familyId: family._id });
        docs = await Document.find({ familyId: family._id });
      }
    } else {
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

    if (isConnected) {
      family = await Family.findById(targetFamilyId);
      if (family) {
        members = await User.find({ familyId: family._id });
        medicalDocs = await Document.find({
          familyId: family._id,
          category: { $in: ['Medical & Health', 'Health', 'Medical'] },
        });
      }
    } else {
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

    const emergencyRoster = members.map(m => ({
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

    if (!user && userEmail) {
      if (isConnected) {
        user = await User.findOne({ email: userEmail });
      } else {
        user = memoryStore.users.find(u => u.email.toLowerCase() === userEmail);
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

    if (isConnected) {
      members = await User.find({ familyId: targetFamilyId }).lean();
      docs = await Document.find({ familyId: targetFamilyId }).lean();
    } else {
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
    const cleanEmail = email?.trim() ? email.toLowerCase().trim() : `${cleanName.toLowerCase().replace(/\s+/g, '.')}${Date.now().toString().slice(-4)}@family.ghar`;
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=2563EB&color=fff&size=150`;

    let familyId = req.familyId || req.user?.familyId;
    if (!familyId) {
      return res.status(400).json({ error: 'You must belong to a family vault to add members.' });
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
    } else {
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

export default router;
