import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { memoryStore } from '../config/seed.js';
import { isConnected } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'gharvault_super_secret_jwt_key_2026';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token || token === 'null' || token === 'undefined') {
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded?.id) {
      return next();
    }

    let user = null;
    if (isConnected) {
      user = await User.findById(decoded.id);
    } else {
      user = memoryStore.users.find(u => u._id.toString() === decoded.id.toString());
    }

    if (user) {
      req.user = user;
      req.userId = user._id;
      req.familyId = user.familyId;
    }

    next();
  } catch (err) {
    // Non-blocking: continue without user credentials
    next();
  }
};

export const requireAuth = (req, res, next) => {
  if (!req.user && !req.userId) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  next();
};
