import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const webpush = require('web-push');
import mongoose from 'mongoose';
import PushSubscription from '../models/PushSubscription.js';
import { memoryStore } from '../config/seed.js';
import { isConnected } from '../config/db.js';

if (!memoryStore.pushSubscriptions) {
  memoryStore.pushSubscriptions = [];
}

const PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BETo3KdXfiI2Llh5HKAcbW8ci5sfYlQLcGFSuN6y2EoMlc-yPvSMvOo7_7Srf7QGQ71wbStetkvDyGUvwUqBcmo';
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'XSiOVu_mRQagQBuHO9Nt05wR6lif2EJV1TgxTEfieWE';

let rawEmail = process.env.VAPID_EMAIL || 'support@gharvault.app';
if (!rawEmail.startsWith('mailto:') && !rawEmail.startsWith('https://')) {
  rawEmail = `mailto:${rawEmail}`;
}
const VAPID_EMAIL = rawEmail;

try {
  webpush.setVapidDetails(VAPID_EMAIL, PUBLIC_KEY, PRIVATE_KEY);
  console.log('[WebPush] VAPID details configured successfully with subject:', VAPID_EMAIL);
} catch (err) {
  console.warn('[WebPush] Error configuring VAPID details:', err.message);
}

export function getVapidPublicKey() {
  return PUBLIC_KEY;
}

/**
 * Save or update a user's push subscription
 */
export async function saveSubscription({ userId, familyId, subscription, userAgent }) {
  if (!subscription || !subscription.endpoint || !subscription.keys) {
    throw new Error('Invalid subscription payload');
  }

  const endpoint = subscription.endpoint;
  const p256dh = subscription.keys.p256dh;
  const auth = subscription.keys.auth;

  let useMongo = isConnected && mongoose.connection.readyState === 1;

  if (useMongo && mongoose.Types.ObjectId.isValid(userId) && mongoose.Types.ObjectId.isValid(familyId)) {
    try {
      const updated = await PushSubscription.findOneAndUpdate(
        { endpoint },
        {
          userId,
          familyId,
          endpoint,
          keys: { p256dh, auth },
          userAgent: userAgent || '',
          updatedAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return updated;
    } catch (e) {
      console.warn('[PushService] Mongo save failed, falling back to memory store:', e.message);
      useMongo = false;
    }
  }

  // Memory store fallback
  const existingIdx = memoryStore.pushSubscriptions.findIndex(s => s.endpoint === endpoint);
  const subRecord = {
    _id: 'push_sub_' + Date.now(),
    userId: userId?.toString(),
    familyId: familyId?.toString(),
    endpoint,
    keys: { p256dh, auth },
    userAgent: userAgent || '',
    updatedAt: new Date(),
  };

  if (existingIdx >= 0) {
    memoryStore.pushSubscriptions[existingIdx] = subRecord;
  } else {
    memoryStore.pushSubscriptions.push(subRecord);
  }

  return subRecord;
}

/**
 * Remove an invalid or expired subscription
 */
export async function removeSubscription(endpoint) {
  let useMongo = isConnected && mongoose.connection.readyState === 1;
  if (useMongo) {
    try {
      await PushSubscription.deleteOne({ endpoint });
    } catch (e) {
      // ignore
    }
  }
  memoryStore.pushSubscriptions = memoryStore.pushSubscriptions.filter(s => s.endpoint !== endpoint);
}

/**
 * Send push notification to a single subscription
 */
export async function sendNotificationToSubscription(subscription, payload) {
  try {
    const pushConfig = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    };

    const stringifiedPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);
    await webpush.sendNotification(pushConfig, stringifiedPayload, {
      TTL: 60 * 60 * 24, // 24 hours TTL
      urgency: 'high',
    });
    console.log('[WebPush Success] Notification delivered to endpoint:', subscription.endpoint.slice(0, 45) + '...');
    return { success: true };
  } catch (error) {
    console.error('[WebPush Error] Failed to send notification:', error.message, 'Status:', error.statusCode);
    if (error.statusCode === 404 || error.statusCode === 410) {
      // Subscription has expired or unsubscribed
      await removeSubscription(subscription.endpoint);
    }
    return { success: false, error: error.message, statusCode: error.statusCode };
  }
}

/**
 * Send push notification to all devices belonging to a specific family
 */
export async function sendPushToFamily(familyId, payload, excludeUserId = null) {
  if (!familyId) return { deliveredCount: 0, failedCount: 0 };

  let useMongo = isConnected && mongoose.connection.readyState === 1;
  let subscriptions = [];

  if (useMongo && mongoose.Types.ObjectId.isValid(familyId)) {
    try {
      const query = { familyId };
      if (excludeUserId && mongoose.Types.ObjectId.isValid(excludeUserId)) {
        query.userId = { $ne: excludeUserId };
      }
      subscriptions = await PushSubscription.find(query);
    } catch (e) {
      useMongo = false;
    }
  }

  if (!subscriptions.length) {
    subscriptions = memoryStore.pushSubscriptions.filter(s => {
      const famMatch = s.familyId?.toString() === familyId.toString();
      const notExcluded = excludeUserId ? s.userId?.toString() !== excludeUserId.toString() : true;
      return famMatch && notExcluded;
    });
  }

  let deliveredCount = 0;
  let failedCount = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      const res = await sendNotificationToSubscription(sub, payload);
      if (res.success) {
        deliveredCount++;
      } else {
        failedCount++;
      }
    })
  );

  return { deliveredCount, failedCount, totalSubscriptions: subscriptions.length };
}

/**
 * Send push notification to a specific user (all their registered devices)
 */
export async function sendPushToUser(userId, payload) {
  if (!userId) return { deliveredCount: 0, failedCount: 0 };

  let useMongo = isConnected && mongoose.connection.readyState === 1;
  let subscriptions = [];

  if (useMongo && mongoose.Types.ObjectId.isValid(userId)) {
    try {
      subscriptions = await PushSubscription.find({ userId });
    } catch (e) {
      useMongo = false;
    }
  }

  if (!subscriptions.length) {
    subscriptions = memoryStore.pushSubscriptions.filter(s => s.userId?.toString() === userId.toString());
  }

  let deliveredCount = 0;
  let failedCount = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      const res = await sendNotificationToSubscription(sub, payload);
      if (res.success) {
        deliveredCount++;
      } else {
        failedCount++;
      }
    })
  );

  return { deliveredCount, failedCount, totalSubscriptions: subscriptions.length };
}
