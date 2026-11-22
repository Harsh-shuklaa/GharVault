import express from 'express';
import {
  getVapidPublicKey,
  saveSubscription,
  removeSubscription,
  sendPushToFamily,
  sendPushToUser,
} from '../services/pushNotification.service.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import { memoryStore } from '../config/seed.js';
import { isConnected } from '../config/db.js';
import mongoose from 'mongoose';

const router = express.Router();

// GET /api/push/public-key - Get VAPID Public Key for client subscription
router.get('/public-key', (req, res) => {
  try {
    const publicKey = getVapidPublicKey();
    res.json({ publicKey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/push/subscribe - Register or update a device push subscription
router.post('/subscribe', async (req, res) => {
  try {
    const { subscription, userAgent } = req.body;
    let userId = req.user?._id || req.user?.id || req.userId;
    let familyId = req.headers['x-family-id'] || req.familyId || req.user?.familyId;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Subscription object with endpoint is required.' });
    }

    // Fallback: If familyId or userId is missing in non-strict/dev mode
    if (!userId && memoryStore.users?.[0]) {
      userId = memoryStore.users[0]._id;
    }
    if (!familyId && userId) {
      if (memoryStore.users) {
        const u = memoryStore.users.find(u => u._id?.toString() === userId.toString());
        if (u?.familyId) familyId = u.familyId;
      }
      if (!familyId && memoryStore.families?.[0]) {
        familyId = memoryStore.families[0]._id;
      }
    }

    if (!userId || !familyId) {
      return res.status(401).json({ error: 'User must be authenticated and belong to a family.' });
    }

    const saved = await saveSubscription({
      userId,
      familyId,
      subscription,
      userAgent: userAgent || req.headers['user-agent'] || '',
    });

    console.log('[PushRoute] Device successfully registered for push. User:', userId, 'Family:', familyId);
    res.json({ success: true, message: 'Device subscribed to push notifications successfully.', subscription: saved });
  } catch (err) {
    console.error('[PushRoute] Subscribe error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/push/unsubscribe - Unregister a device push subscription
router.post('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (endpoint) {
      await removeSubscription(endpoint);
    }
    res.json({ success: true, message: 'Device unsubscribed.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/push/send-broadcast - Send a push notification (Broadcast or member-specific)
router.post('/send-broadcast', async (req, res) => {
  try {
    const { title, body, url, targetMemberId } = req.body;
    const sender = req.user;
    const familyId = req.headers['x-family-id'] || req.familyId || sender?.familyId;

    if (!familyId) {
      return res.status(400).json({ error: 'Family context required.' });
    }

    const finalTitle = title?.trim() || '🔔 GharVault Update';
    const finalBody = body?.trim() || 'Update aa gaye hain, abhi check karein!';
    const finalUrl = url?.trim() || '/dashboard';

    const payload = {
      title: finalTitle,
      body: finalBody,
      url: finalUrl,
      timestamp: Date.now(),
      senderName: sender?.name || 'Family Member',
    };

    let result = { deliveredCount: 0, failedCount: 0 };

    if (targetMemberId && targetMemberId !== 'ALL') {
      // Send to specific target member
      result = await sendPushToUser(targetMemberId, payload);
    } else {
      // Broadcast to all family members
      result = await sendPushToFamily(familyId, payload, null);
    }

    // Also persist an In-App Notification so it stays in the bell tray
    try {
      const inAppNotif = {
        familyId,
        userId: (targetMemberId && targetMemberId !== 'ALL') ? targetMemberId : null,
        title: finalTitle,
        message: finalBody,
        type: 'INFO',
        link: finalUrl,
        isRead: false,
        createdAt: new Date(),
      };

      let useMongo = isConnected && mongoose.connection.readyState === 1;
      if (useMongo && mongoose.Types.ObjectId.isValid(familyId)) {
        await Notification.create(inAppNotif);
      } else {
        memoryStore.notifications = memoryStore.notifications || [];
        memoryStore.notifications.unshift({
          _id: 'notif_' + Date.now(),
          ...inAppNotif,
        });
      }
    } catch (e) {
      console.warn('[PushRoute] In-app notification creation warning:', e.message);
    }

    // Log in Audit Ledger
    try {
      let useMongo = isConnected && mongoose.connection.readyState === 1;
      const auditEntry = {
        familyId,
        userId: sender?._id || sender?.id,
        action: 'PUSH_NOTIFICATION_SENT',
        details: {
          title: finalTitle,
          body: finalBody,
          target: targetMemberId || 'ALL',
          deliveredCount: result.deliveredCount,
        },
        timestamp: new Date(),
      };
      if (useMongo && mongoose.Types.ObjectId.isValid(familyId)) {
        await AuditLog.create(auditEntry);
      }
    } catch (auditErr) {
      // ignore
    }

    res.json({
      success: true,
      deliveredCount: result.deliveredCount,
      failedCount: result.failedCount,
      totalSubscriptions: result.totalSubscriptions,
      message: result.deliveredCount > 0
        ? `Push notification successfully delivered to ${result.deliveredCount} phone(s)!`
        : `Push queued. (If members haven't allowed notifications on their phones yet, invite them to tap 'Allow Notifications').`,
    });
  } catch (err) {
    console.error('[PushRoute] Broadcast error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/push/status - Check push status for current user & family
router.get('/status', async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const familyId = req.headers['x-family-id'] || req.familyId || req.user?.familyId;

    let useMongo = isConnected && mongoose.connection.readyState === 1;
    let userSubCount = 0;
    let familySubCount = 0;

    if (useMongo && mongoose.Types.ObjectId.isValid(userId) && mongoose.Types.ObjectId.isValid(familyId)) {
      const PushSubscription = (await import('../models/PushSubscription.js')).default;
      userSubCount = await PushSubscription.countDocuments({ userId });
      familySubCount = await PushSubscription.countDocuments({ familyId });
    } else {
      userSubCount = (memoryStore.pushSubscriptions || []).filter(s => s.userId?.toString() === userId?.toString()).length;
      familySubCount = (memoryStore.pushSubscriptions || []).filter(s => s.familyId?.toString() === familyId?.toString()).length;
    }

    res.json({
      isUserSubscribed: userSubCount > 0,
      userDeviceCount: userSubCount,
      familyDeviceCount: familySubCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
