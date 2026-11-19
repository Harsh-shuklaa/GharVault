import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { memoryStore } from '../config/seed.js';
import { isConnected } from '../config/db.js';

export const getJwtSecret = () => process.env.JWT_SECRET || 'gharvault_super_secret_jwt_key_2026';

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

    let decoded = null;
    try {
      decoded = jwt.verify(token, getJwtSecret());
    } catch (e1) {
      try {
        decoded = jwt.verify(token, 'gharvault_super_secret_jwt_key_2026');
      } catch (e2) {
        return next();
      }
    }

    if (!decoded?.id) {
      return next();
    }

    req.userId = decoded.id;
    if (decoded.familyId) {
      req.familyId = decoded.familyId;
    }

    let user = null;
    const isValidObjectId = mongoose.Types.ObjectId.isValid(decoded.id);

    if (isConnected && isValidObjectId) {
      try {
        user = await User.findById(decoded.id);
      } catch (dbErr) {
        console.warn('[Auth Middleware Warning] MongoDB lookup failed, checking memory store:', dbErr.message);
        user = memoryStore.users.find(u => u._id?.toString() === decoded.id?.toString());
      }
    } else {
      user = memoryStore.users.find(u => u._id?.toString() === decoded.id?.toString());
    }

    if (user) {
      req.user = user;
      req.userId = user._id;
      req.familyId = user.familyId || decoded.familyId;
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
