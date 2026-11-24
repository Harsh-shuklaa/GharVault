import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { memoryStore } from '../config/seed.js';
import { isConnected } from '../config/db.js';
import { uploadAvatar } from '../services/supabaseStorage.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'gharvault_super_secret_jwt_key_2026';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPEG, and WebP image formats are allowed for profile photos.'));
    }
  },
});

// Auth middleware
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({ error: 'Invalid authentication session.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
};

// GET /api/users/profile — Get current user's full profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    let user = null;
    if (isConnected) {
      user = await User.findById(req.userId);
    } else {
      user = memoryStore.users.find((u) => u._id.toString() === req.userId.toString());
    }

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    res.json({
      success: true,
      user,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve profile: ' + err.message });
  }
});

// PUT /api/users/profile — Update user's personal details
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const {
      name,
      phone,
      bloodGroup,
      dateOfBirth,
      emergencyContactPhone,
      healthInsurancePolicy,
      tpaNumber,
      allergies,
      avatar,
      relationship,
    } = req.body;

    const updates = {};
    if (name?.trim()) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (bloodGroup !== undefined) updates.bloodGroup = bloodGroup.trim();
    if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth.trim();
    if (emergencyContactPhone !== undefined) updates.emergencyContactPhone = emergencyContactPhone.trim();
    if (healthInsurancePolicy !== undefined) updates.healthInsurancePolicy = healthInsurancePolicy.trim();
    if (tpaNumber !== undefined) updates.tpaNumber = tpaNumber.trim();
    if (allergies !== undefined) updates.allergies = allergies.trim();
    if (avatar !== undefined) updates.avatar = avatar.trim();
    if (relationship !== undefined) updates.relationship = relationship.trim();

    let user = null;
    if (isConnected) {
      user = await User.findByIdAndUpdate(req.userId, updates, { new: true });
    } else {
      user = memoryStore.users.find((u) => u._id.toString() === req.userId.toString());
      if (user) {
        Object.assign(user, updates);
      }
    }

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    res.json({
      success: true,
      user,
      message: 'Profile updated successfully!',
    });
  } catch (err) {
    console.error('[Profile Update Error]', err);
    res.status(500).json({ error: 'Failed to update profile: ' + err.message });
  }
});

// POST /api/users/avatar — Upload and save new profile photo
router.post('/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No avatar image file provided.' });
    }

    const targetUserId = req.body?.memberId || req.query?.memberId || req.userId;

    const uploadRes = await uploadAvatar(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      targetUserId
    );

    if (!uploadRes.success || !uploadRes.avatarUrl) {
      throw new Error('Avatar upload failed.');
    }

    // Save avatar URL to profile:
    // If targetUserId !== req.userId, update that specific family member without touching the current admin user!
    let targetUser = null;
    if (isConnected) {
      if (targetUserId !== req.userId) {
        const currentUser = await User.findById(req.userId);
        const memberUser = await User.findById(targetUserId);
        if (memberUser && currentUser && memberUser.familyId?.toString() === currentUser.familyId?.toString()) {
          targetUser = await User.findByIdAndUpdate(
            targetUserId,
            { avatar: uploadRes.avatarUrl },
            { new: true }
          );
        } else {
          targetUser = memberUser;
        }
      } else {
        targetUser = await User.findByIdAndUpdate(
          req.userId,
          { avatar: uploadRes.avatarUrl },
          { new: true }
        );
      }
    } else {
      const found = memoryStore.users.find((u) => u._id.toString() === targetUserId.toString());
      if (found) {
        found.avatar = uploadRes.avatarUrl;
        targetUser = found;
      }
    }

    res.json({
      success: true,
      avatarUrl: uploadRes.avatarUrl,
      user: targetUser,
      message: 'Profile photo updated successfully!',
    });
  } catch (err) {
    console.error('[Avatar Upload Error]', err);
    res.status(500).json({ error: err.message || 'Avatar upload failed' });
  }
});

// GET /api/users/avatar-file/:filename — Serve local avatar files in offline fallback mode
router.get('/avatar-file/:filename', (req, res) => {
  const localDir = path.resolve('server/uploads/avatars');
  const safeFile = path.basename(req.params.filename);
  const targetPath = path.join(localDir, safeFile);

  if (fs.existsSync(targetPath)) {
    res.sendFile(targetPath);
  } else {
    res.status(404).json({ error: 'Avatar not found' });
  }
});

export default router;
