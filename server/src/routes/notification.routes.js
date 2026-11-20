import express from 'express';
import mongoose from 'mongoose';
import { memoryStore } from '../config/seed.js';
import Notification from '../models/Notification.js';
import { isConnected } from '../config/db.js';

const router = express.Router();

function ensureSeedNotifications(targetFamilyId) {
  if (!memoryStore.notifications || memoryStore.notifications.length === 0) {
    memoryStore.notifications = [
      {
        _id: 'notif_welcome_1',
        familyId: targetFamilyId,
        title: 'Vault Security Initialized',
        message: 'Your Family Vault is protected with 256-bit AES encryption. Sensitive records require MPIN.',
        type: 'SUCCESS',
        link: '/settings',
        isRead: false,
        createdAt: new Date(),
      },
      {
        _id: 'notif_exp_sample',
        familyId: targetFamilyId,
        title: 'Statutory Expiry Protection',
        message: 'GharVault automatically tracks policy and license expiries 30 days in advance.',
        type: 'WARNING',
        link: '/vault',
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 2),
      },
    ];
  }
}

// GET /api/notifications
router.get('/', async (req, res) => {
  try {
    const targetFamilyId = req.headers['x-family-id'] || req.familyId || req.user?.familyId;
    let useMongo = isConnected && mongoose.connection.readyState === 1;
    let notifs = [];

    if (useMongo && targetFamilyId) {
      try {
        notifs = await Notification.find({
          $or: [{ familyId: targetFamilyId }, { familyId: null }],
        }).sort({ createdAt: -1 }).limit(30);

        if (notifs.length === 0) {
          const welcome = await Notification.create({
            familyId: targetFamilyId,
            title: 'Vault Security Initialized',
            message: 'Your Family Vault is protected with 256-bit AES encryption. Sensitive records require MPIN.',
            type: 'SUCCESS',
            link: '/settings',
            isRead: false,
            createdAt: new Date(),
          });
          notifs = [welcome];
        }
      } catch (dbErr) {
        useMongo = false;
      }
    }

    if (!useMongo) {
      ensureSeedNotifications(targetFamilyId);
      notifs = targetFamilyId
        ? memoryStore.notifications.filter(n => !n.familyId || n.familyId.toString() === targetFamilyId.toString())
        : memoryStore.notifications;
    }

    const unreadCount = notifs.filter(n => !n.isRead).length;

    res.json({
      notifications: notifs,
      unreadCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    let useMongo = isConnected && mongoose.connection.readyState === 1;

    if (useMongo) {
      try {
        await Notification.findByIdAndUpdate(id, { isRead: true });
      } catch (dbErr) {
        useMongo = false;
      }
    }

    const notif = memoryStore.notifications.find(n => n._id.toString() === id.toString());
    if (notif) {
      notif.isRead = true;
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notifications/read-all
router.put('/read-all', async (req, res) => {
  try {
    const targetFamilyId = req.headers['x-family-id'] || req.familyId || req.user?.familyId;
    let useMongo = isConnected && mongoose.connection.readyState === 1;

    if (useMongo && targetFamilyId) {
      try {
        await Notification.updateMany(
          { $or: [{ familyId: targetFamilyId }, { familyId: null }], isRead: false },
          { isRead: true }
        );
      } catch (dbErr) {
        useMongo = false;
      }
    }

    memoryStore.notifications.forEach(n => {
      if (!targetFamilyId || !n.familyId || n.familyId.toString() === targetFamilyId.toString()) {
        n.isRead = true;
      }
    });

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
