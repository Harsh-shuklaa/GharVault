import express from 'express';
import { memoryStore } from '../config/seed.js';

const router = express.Router();

// GET /api/notifications
router.get('/', (req, res) => {
  const notifs = memoryStore.notifications;
  const unreadCount = notifs.filter(n => !n.isRead).length;

  res.json({
    notifications: notifs,
    unreadCount,
  });
});

// PUT /api/notifications/:id/read
router.put('/:id/read', (req, res) => {
  const notif = memoryStore.notifications.find(n => n._id.toString() === req.params.id);
  if (notif) {
    notif.isRead = true;
  }
  res.json({ success: true });
});

// PUT /api/notifications/read-all
router.put('/read-all', (req, res) => {
  memoryStore.notifications.forEach(n => { n.isRead = true; });
  res.json({ success: true, message: 'All notifications marked as read.' });
});

export default router;
