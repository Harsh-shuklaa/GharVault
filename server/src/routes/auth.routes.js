import express from 'express';
import jwt from 'jsonwebtoken';
import { memoryStore } from '../config/seed.js';
import User from '../models/User.js';
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

// POST /api/auth/google
router.post('/google', async (req, res) => {
  try {
    const { email, name, avatar, googleId } = req.body;

    let targetEmail = email || 'rajesh.sharma@gmail.com';
    let user = null;

    if (isConnected) {
      user = await User.findOne({ email: targetEmail.toLowerCase() });
      if (!user) {
        user = await User.create({
          email: targetEmail.toLowerCase(),
          name: name || 'Rajesh Sharma',
          avatar: avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
          googleId: googleId || 'google_oauth_sub_demo',
          role: 'ADMIN',
          relationship: 'Head of Family',
        });
      }
    } else {
      user = memoryStore.users.find(u => u.email.toLowerCase() === targetEmail.toLowerCase());
      if (!user) {
        user = {
          _id: 'user_' + Date.now(),
          email: targetEmail.toLowerCase(),
          name: name || 'Demo User',
          avatar: avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
          role: 'ADMIN',
          relationship: 'Head of Family',
          familyId: memoryStore.families[0]?._id,
          permissions: {
            canUpload: true,
            canDownload: true,
            canDelete: true,
            canViewSensitive: true,
            canSignQuorum: true,
            canArmBreakGlass: true,
          },
        };
        memoryStore.users.push(user);
      }
    }

    const token = generateToken(user);
    res.json({
      success: true,
      token,
      user,
      family: memoryStore.families[0] || null,
    });
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(500).json({ error: 'Authentication failed: ' + err.message });
  }
});

// POST /api/auth/switch-demo-user (Allows switching between Rajesh, Priya, Aarav, Sunita)
router.post('/switch-demo-user', async (req, res) => {
  const { roleOrEmail } = req.body;
  let user = memoryStore.users.find(
    u => u.email.toLowerCase().includes(roleOrEmail.toLowerCase()) ||
         u.role.toLowerCase() === roleOrEmail.toLowerCase() ||
         u.name.toLowerCase().includes(roleOrEmail.toLowerCase())
  );

  if (!user) {
    user = memoryStore.users[0];
  }

  const token = generateToken(user);
  res.json({
    success: true,
    token,
    user,
    family: memoryStore.families[0],
  });
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Return default Rajesh user for seamless preview
      const defaultUser = memoryStore.users[0];
      return res.json({
        user: defaultUser,
        family: memoryStore.families[0],
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    let user = null;
    if (isConnected) {
      user = await User.findById(decoded.id);
    } else {
      user = memoryStore.users.find(u => u._id.toString() === decoded.id.toString());
    }

    if (!user) {
      user = memoryStore.users[0];
    }

    res.json({
      user,
      family: memoryStore.families[0],
    });
  } catch (err) {
    // Return default session
    res.json({
      user: memoryStore.users[0],
      family: memoryStore.families[0],
    });
  }
});

// POST /api/auth/verify-mpin
router.post('/verify-mpin', (req, res) => {
  const { mpin } = req.body;
  if (!mpin || mpin.length < 4) {
    return res.status(400).json({ error: 'Invalid MPIN' });
  }
  // In demo / preview mode, allow standard mpin '1234' or any 4/6-digit mpin
  res.json({
    success: true,
    verified: true,
    message: 'Biometric / MPIN verification succeeded',
  });
});

export default router;
