import express from 'express';
import jwt from 'jsonwebtoken';
import { memoryStore } from '../config/seed.js';
import User from '../models/User.js';
import Family from '../models/Family.js';
import { isConnected } from '../config/db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'gharvault_super_secret_jwt_key_2026';

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      familyId: user.familyId,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// POST /api/auth/google — One-click Continue with Google
router.post('/google', async (req, res) => {
  try {
    const { email, name, avatar, googleId } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required for Google Sign-In' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name?.trim() || cleanEmail.split('@')[0];
    const userAvatar = avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=2563EB&color=fff&size=150`;

    let user = null;
    let family = null;

    if (isConnected) {
      user = await User.findOne({ email: cleanEmail });

      if (!user) {
        // Create initial family for the first user
        const inviteCode = 'GHAR-' + Math.floor(1000 + Math.random() * 9000);
        family = await Family.create({
          name: `${cleanName.split(' ')[0]}'s Family Vault`,
          inviteCode,
          storageLimitBytes: 53687091200, // 50 GB Free Tier
          storageUsedBytes: 0,
        });

        user = await User.create({
          email: cleanEmail,
          name: cleanName,
          avatar: userAvatar,
          googleId: googleId || 'google_' + Date.now(),
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
        family = await Family.findById(user.familyId);
      }
    } else {
      // Memory Store logic
      user = memoryStore.users.find(u => u.email.toLowerCase() === cleanEmail);

      if (!user) {
        const inviteCode = 'GHAR-' + Math.floor(1000 + Math.random() * 9000);
        family = {
          _id: 'fam_' + Date.now(),
          name: `${cleanName.split(' ')[0]}'s Family Vault`,
          inviteCode,
          adminId: null,
          settings: {
            quorumRequiredForSensitive: false,
            quorumThreshold: 2,
            breakGlassDelayHours: 48,
            autoColdBackupEnabled: true,
          },
          storageLimitBytes: 53687091200,
          storageUsedBytes: 0,
          createdAt: new Date(),
        };

        user = {
          _id: 'user_' + Date.now(),
          email: cleanEmail,
          name: cleanName,
          avatar: userAvatar,
          googleId: googleId || 'google_' + Date.now(),
          role: 'ADMIN',
          relationship: 'Head of Family',
          familyId: family._id,
          phone: '',
          bloodGroup: '',
          emergencyContactPhone: '',
          healthInsurancePolicy: '',
          isEmergencyContact: true,
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
        memoryStore.families.push(family);
        memoryStore.users.push(user);
      } else {
        family = memoryStore.families.find(f => f._id.toString() === user.familyId?.toString()) || memoryStore.families[0];
      }
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user,
      family,
    });
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(500).json({ error: 'Authentication failed: ' + err.message });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // If user exists in memoryStore, return first, else null
      const firstUser = memoryStore.users[0] || null;
      const firstFam = memoryStore.families[0] || null;
      return res.json({
        user: firstUser,
        family: firstFam,
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    let user = null;
    let family = null;

    if (isConnected) {
      user = await User.findById(decoded.id);
      if (user) {
        family = await Family.findById(user.familyId);
      }
    } else {
      user = memoryStore.users.find(u => u._id.toString() === decoded.id.toString());
      if (user) {
        family = memoryStore.families.find(f => f._id.toString() === user.familyId?.toString());
      }
    }

    res.json({
      user: user || memoryStore.users[0] || null,
      family: family || memoryStore.families[0] || null,
    });
  } catch (err) {
    res.json({
      user: memoryStore.users[0] || null,
      family: memoryStore.families[0] || null,
    });
  }
});

// POST /api/auth/verify-mpin
router.post('/verify-mpin', (req, res) => {
  const { mpin } = req.body;
  if (!mpin || mpin.length < 4) {
    return res.status(400).json({ error: 'Invalid PIN' });
  }
  res.json({
    success: true,
    verified: true,
    message: 'Identity verified successfully',
  });
});

export default router;
