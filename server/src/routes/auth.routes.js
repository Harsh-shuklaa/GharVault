import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { memoryStore } from '../config/seed.js';
import User from '../models/User.js';
import Family from '../models/Family.js';
import { isConnected } from '../config/db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'gharvault_super_secret_jwt_key_2026';

export const generateToken = (user) => {
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

// POST /api/auth/sync — Sync user authenticated via Supabase OAuth with MongoDB
router.post('/sync', async (req, res) => {
  try {
    const { email, name, avatar, googleId } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required for authentication sync' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name?.trim() || cleanEmail.split('@')[0] || 'Family Member';
    const userAvatar =
      avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=3ECF8E&color=000&size=150`;

    let user = null;
    let family = null;
    let isNewUser = false;

    if (isConnected) {
      user = await User.findOne({ email: cleanEmail });

      if (!user) {
        isNewUser = true;
        const inviteCode = 'GHAR-' + Math.floor(1000 + Math.random() * 9000);
        family = await Family.create({
          name: `${cleanName.split(' ')[0]}'s Family Vault`,
          inviteCode,
          storageLimitBytes: 53687091200,
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
        if (googleId && !user.googleId) {
          user.googleId = googleId;
          await user.save();
        }
        if (user.familyId) {
          family = await Family.findById(user.familyId);
        }
        if (!family) {
          isNewUser = true;
          const inviteCode = 'GHAR-' + Math.floor(1000 + Math.random() * 9000);
          family = await Family.create({
            name: `${cleanName.split(' ')[0]}'s Family Vault`,
            inviteCode,
            adminId: user._id,
            storageLimitBytes: 53687091200,
            storageUsedBytes: 0,
          });
          user.familyId = family._id;
          await user.save();
        }
      }
    } else {
      user = memoryStore.users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (!user) {
        isNewUser = true;
        const inviteCode = 'GHAR-' + Math.floor(1000 + Math.random() * 9000);
        family = {
          _id: 'fam_' + Date.now(),
          name: `${cleanName.split(' ')[0]}'s Family Vault`,
          inviteCode,
          adminId: null,
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
        family = memoryStore.families.find((f) => f._id.toString() === user.familyId?.toString());
        if (!family) {
          isNewUser = true;
          family = {
            _id: 'fam_' + Date.now(),
            name: `${cleanName.split(' ')[0]}'s Family Vault`,
            inviteCode: 'GHAR-' + Math.floor(1000 + Math.random() * 9000),
            adminId: user._id,
            storageLimitBytes: 53687091200,
            storageUsedBytes: 0,
            createdAt: new Date(),
          };
          user.familyId = family._id;
          memoryStore.families.push(family);
        }
      }
    }

    const token = generateToken(user);
    res.json({
      success: true,
      token,
      user,
      family,
      isNewUser,
    });
  } catch (err) {
    console.error('[Auth Sync Error]', err);
    res.status(500).json({ error: 'Auth sync failed: ' + err.message });
  }
});

// POST /api/auth/google — One-click Continue with Google / Email Auth
router.post('/google', async (req, res) => {
  try {
    const { email, name, avatar, googleId } = req.body;

    const cleanEmail = (email || 'family.admin@gmail.com').toLowerCase().trim();
    const cleanName = name?.trim() || cleanEmail.split('@')[0] || 'Family Admin';
    const userAvatar =
      avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=3ECF8E&color=000&size=150`;

    let user = null;
    let family = null;

    if (isConnected) {
      user = await User.findOne({ email: cleanEmail });

      if (!user) {
        // Create initial family for this user if none exists
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
        if (!family) {
          const inviteCode = 'GHAR-' + Math.floor(1000 + Math.random() * 9000);
          family = await Family.create({
            name: `${cleanName.split(' ')[0]}'s Family Vault`,
            inviteCode,
            adminId: user._id,
            storageLimitBytes: 53687091200,
            storageUsedBytes: 0,
          });
          user.familyId = family._id;
          await user.save();
        }
      }
    } else {
      // Memory Store logic
      user = memoryStore.users.find((u) => u.email.toLowerCase() === cleanEmail);

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
        family = memoryStore.families.find((f) => f._id.toString() === user.familyId?.toString());
        if (!family) {
          family = {
            _id: 'fam_' + Date.now(),
            name: `${cleanName.split(' ')[0]}'s Family Vault`,
            inviteCode: 'GHAR-' + Math.floor(1000 + Math.random() * 9000),
            adminId: user._id,
            storageLimitBytes: 53687091200,
            storageUsedBytes: 0,
            createdAt: new Date(),
          };
          user.familyId = family._id;
          memoryStore.families.push(family);
        }
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
      return res.json({
        user: null,
        family: null,
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token || token === 'null' || token === 'undefined') {
      return res.json({
        user: null,
        family: null,
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.json({
        user: null,
        family: null,
      });
    }

    let user = null;
    let family = null;

    if (decoded && isConnected) {
      user = await User.findById(decoded.id);
      if (user) {
        family = await Family.findById(user.familyId);
      }
    } else if (decoded) {
      user = memoryStore.users.find((u) => u._id.toString() === decoded.id?.toString());
      if (user) {
        family = memoryStore.families.find((f) => f._id.toString() === user.familyId?.toString());
      }
    }

    res.json({
      user: user || null,
      family: family || null,
    });
  } catch (err) {
    res.json({
      user: null,
      family: null,
    });
  }
});

// POST /api/auth/verify-mpin
router.post('/verify-mpin', async (req, res) => {
  const { mpin } = req.body;
  if (!mpin || mpin.length < 4) {
    return res.status(400).json({ success: false, valid: false, error: 'Invalid PIN. Must be at least 4 digits.' });
  }

  try {
    let user = req.user;
    if (!user && req.userId) {
      user = isConnected ? await User.findById(req.userId) : memoryStore.users.find(u => u._id.toString() === req.userId.toString());
    }
    if (!user && req.body.email) {
      const em = req.body.email.toLowerCase().trim();
      user = isConnected ? await User.findOne({ email: em }) : memoryStore.users.find(u => u.email?.toLowerCase() === em);
    }

    if (!user) {
      if (isConnected) {
        user = await User.findOne({ role: 'ADMIN' }) || await User.findOne();
      } else {
        user = memoryStore.users[0];
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, valid: false, error: 'User profile not found.' });
    }

    let family = null;
    if (user.familyId) {
      family = isConnected
        ? await Family.findById(user.familyId)
        : memoryStore.families.find(f => f._id.toString() === user.familyId.toString());
    }

    // Check MPIN match
    const cleanPin = String(mpin).trim();
    if (user.mpinHash) {
      const match = await bcrypt.compare(cleanPin, user.mpinHash);
      if (!match) {
        return res.status(401).json({ success: false, verified: false, valid: false, error: 'Incorrect 4-digit MPIN. Please try again.' });
      }
    } else {
      // Default initial PIN is 1234 if not customized yet
      if (cleanPin !== '1234') {
        return res.status(401).json({ success: false, verified: false, valid: false, error: 'Incorrect MPIN. (Default initial PIN is 1234. You can change it in Settings).' });
      }
    }

    const token = generateToken(user);
    res.json({
      success: true,
      verified: true,
      valid: true,
      token,
      user,
      family,
      message: 'Vault unlocked successfully with PIN',
    });
  } catch (err) {
    console.error('Verify MPIN error:', err);
    res.status(500).json({ success: false, valid: false, error: 'Failed to verify PIN' });
  }
});

// POST /api/auth/set-mpin — Update 4-digit security MPIN
router.post('/set-mpin', async (req, res) => {
  const { mpin, email } = req.body;
  const cleanPin = String(mpin || '').trim();

  if (!cleanPin || cleanPin.length !== 4 || !/^\d{4}$/.test(cleanPin)) {
    return res.status(400).json({ error: 'MPIN must be exactly 4 numeric digits.' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const mpinHash = await bcrypt.hash(cleanPin, salt);

    let user = req.user;
    if (!user && req.userId) {
      user = isConnected ? await User.findById(req.userId) : memoryStore.users.find(u => u._id.toString() === req.userId.toString());
    }
    if (!user && email) {
      const em = email.toLowerCase().trim();
      user = isConnected ? await User.findOne({ email: em }) : memoryStore.users.find(u => u.email?.toLowerCase() === em);
    }
    if (!user) {
      if (isConnected) {
        user = await User.findOne();
      } else {
        user = memoryStore.users[0];
      }
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.mpinHash = mpinHash;
    if (isConnected) {
      await user.save();
    }

    res.json({
      success: true,
      message: '4-digit Security MPIN updated successfully.',
    });
  } catch (err) {
    console.error('Set MPIN error:', err);
    res.status(500).json({ error: 'Failed to update MPIN: ' + err.message });
  }
});

export default router;
