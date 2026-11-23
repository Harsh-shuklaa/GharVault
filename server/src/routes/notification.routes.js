import express from 'express';
import mongoose from 'mongoose';
import { memoryStore } from '../config/seed.js';
import Notification from '../models/Notification.js';
import Document from '../models/Document.js';
import User from '../models/User.js';
import { sendPushToFamily } from '../services/pushNotification.service.js';
import { isConnected } from '../config/db.js';

const router = express.Router();

export function getOfficialRenewalInfo(doc) {
  const text = `${doc.title || ''} ${doc.category || ''} ${doc.tags?.join(' ') || ''}`.toLowerCase();
  
  if (/\b(driving licen[cs]e|driver licen[cs]e|driving|\bdl\b)\b/i.test(text)) {
    return {
      type: 'DRIVING_LICENSE',
      portalName: 'Parivahan Sarathi',
      url: 'https://sarathi.parivahan.gov.in/sarathiservice/stateSelection.do',
      badge: '🚗 Parivahan RTO',
      actionLabel: 'Renew on Parivahan',
      serviceDesc: 'Driving License Online Services (MoRTH)',
    };
  }
  if (/\b(puc|pollution|emission)\b/i.test(text)) {
    return {
      type: 'PUC',
      portalName: 'Parivahan PUC Portal',
      url: 'https://vahan.parivahan.gov.in/puc/',
      badge: '🌿 Parivahan PUC',
      actionLabel: 'Check & Renew PUC',
      serviceDesc: 'Parivahan Emission & PUC Portal',
    };
  }
  if (/\b(rc|vehicle rc|fitness|road tax|chassis)\b/i.test(text) && !/\b(parchi|parcha|march|research)\b/i.test(text)) {
    return {
      type: 'VEHICLE_RC',
      portalName: 'Parivahan Vahan',
      url: 'https://vahan.parivahan.gov.in/vahaneservice/',
      badge: '🚘 Parivahan Vahan',
      actionLabel: 'Renew RC / Fitness',
      serviceDesc: 'Vehicle Registration & Fitness Services',
    };
  }
  if (text.includes('passport')) {
    return {
      type: 'PASSPORT',
      portalName: 'Passport Seva Kendra',
      url: 'https://www.passportindia.gov.in/AppOnlineProject/welcomeLink',
      badge: '✈️ Passport Seva',
      actionLabel: 'Re-issue on Passport Seva',
      serviceDesc: 'Ministry of External Affairs Passport Portal',
    };
  }
  if (text.includes('insurance') || text.includes('mediclaim') || text.includes('policy')) {
    return {
      type: 'INSURANCE',
      portalName: 'Insurance Renewal',
      url: 'https://www.policybazaar.com/',
      badge: '🛡️ Policy Renewal',
      actionLabel: 'Renew Policy Online',
      serviceDesc: 'Health / Motor Insurance Renewal',
    };
  }
  if (/\b(bijli|electricity|water|pani|bill|utility|power|uppcl|bses|tata power|jal board|gas)\b/i.test(text)) {
    return {
      type: 'UTILITY_BILL',
      portalName: 'Bharat BillPay (BBPS)',
      url: 'https://www.bharatbillpay.com/',
      badge: '⚡ BBPS BillPay',
      actionLabel: 'Pay via BBPS',
      serviceDesc: 'Official BBPS Utility Portal',
    };
  }

  return {
    type: 'GENERAL',
    portalName: 'National Services Portal',
    url: 'https://services.india.gov.in/',
    badge: '🏛️ National Portal',
    actionLabel: 'Official Renewal Link',
    serviceDesc: 'National Government Services Portal',
  };
}

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

    // Smart Family KYC Reminder: Detect missing basic identity documents
    try {
      let docs = [];
      if (useMongo && targetFamilyId && mongoose.Types.ObjectId.isValid(targetFamilyId)) {
        docs = await Document.find({ familyId: targetFamilyId }).select('title category documentNumber tags expiryDate assignedMemberId');
      }
      if (!docs.length && Array.isArray(memoryStore.documents)) {
        docs = memoryStore.documents.filter(d => !d.familyId || d.familyId.toString() === targetFamilyId?.toString());
      }

      const combinedText = docs.map(d => `${d.title || ''} ${d.category || ''} ${d.tags?.join(' ') || ''}`).join(' ').toLowerCase();
      const hasAadhaar = combinedText.includes('aadhaar') || combinedText.includes('adhar') || combinedText.includes('uid');
      const hasPan = combinedText.includes('pan');
      const hasDlOrVoter = combinedText.includes('voter') || /\b(driving licen[cs]e|driver licen[cs]e|driving|\bdl\b)\b/i.test(combinedText);
      const hasHealth = combinedText.includes('health') || combinedText.includes('medical') || combinedText.includes('insurance') || combinedText.includes('ayushman') || combinedText.includes('prescription') || combinedText.includes('parchi');

      const missing = [];
      if (!hasAadhaar) missing.push('Aadhaar Card');
      if (!hasPan) missing.push('PAN Card');
      if (!hasDlOrVoter) missing.push('Driving License / Voter ID');
      if (!hasHealth) missing.push('Health / Ayushman Card');

      if (missing.length > 0 && targetFamilyId) {
        const hasActiveKycReminder = notifs.some(n => n.title?.includes('Complete Basic Family IDs') && !n.isRead);
        if (!hasActiveKycReminder) {
          const kycNotif = {
            familyId: targetFamilyId,
            title: '⚠️ Complete Basic Family IDs',
            message: `Your Family Vault is missing essential identity papers (${missing.join(', ')}). Upload them to complete your Family KYC verification.`,
            type: 'WARNING',
            link: `/vault/upload?category=ID%20Cards&title=${encodeURIComponent(missing[0])}`,
            isRead: false,
            createdAt: new Date(),
          };
          if (useMongo && mongoose.Types.ObjectId.isValid(targetFamilyId)) {
            try {
              const saved = await Notification.create(kycNotif);
              notifs.unshift(saved);
            } catch (e) {
              notifs.unshift({ _id: 'notif_kyc_' + Date.now(), ...kycNotif });
            }
          } else {
            notifs.unshift({ _id: 'notif_kyc_' + Date.now(), ...kycNotif });
          }
        }
      }

      // Smart Expiry & Renewal Reminders (Feature D): DL, Passport, Insurance, PUC
      try {
        const now = new Date();
        let familyMembers = [];
        if (useMongo && targetFamilyId && mongoose.Types.ObjectId.isValid(targetFamilyId)) {
          familyMembers = await User.find({ familyId: targetFamilyId }).select('name relationship');
        }
        if (!familyMembers.length && Array.isArray(memoryStore.users)) {
          familyMembers = memoryStore.users.filter(u => !u.familyId || u.familyId.toString() === targetFamilyId?.toString());
        }

        for (const doc of docs) {
          if (!doc.expiryDate) continue;
          const expDate = new Date(doc.expiryDate);
          if (isNaN(expDate.getTime())) continue;

          const diffDays = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));

          // Trigger reminder if expiring in <= 30 days OR expired within last 60 days
          if (diffDays <= 30 && diffDays >= -60) {
            let memberName = 'Family Member';
            if (doc.assignedMemberId) {
              const m = familyMembers.find(mem => (mem._id || mem.id)?.toString() === doc.assignedMemberId?.toString());
              if (m?.name) memberName = m.name;
            }

            const renewal = getOfficialRenewalInfo(doc);
            const isExpired = diffDays <= 0;
            const daysText = isExpired ? `Expired (${Math.abs(diffDays)}d ago)` : `Expires in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
            const notifTitle = `⏳ Expiry Alert: ${doc.title} (${daysText})`;

            const docIdStr = (doc._id || doc.id)?.toString();
            const alreadyExists = notifs.some(n => 
              (n.link === `/vault/${docIdStr}` || n.title?.includes(doc.title)) && !n.isRead
            );

            if (!alreadyExists && targetFamilyId) {
              const renewalNotif = {
                familyId: targetFamilyId,
                title: notifTitle,
                message: `${memberName} ji ka ${doc.title} ${isExpired ? 'expire ho chuka hai' : `agle ${diffDays} din me expire ho raha hai`} — RTO / Official renewal link: ${renewal.url}`,
                type: diffDays <= 7 ? 'CRITICAL' : 'WARNING',
                link: `/vault/${docIdStr}`,
                renewalLink: renewal.url,
                actionType: 'RENEWAL_REMINDER',
                isRead: false,
                createdAt: new Date(),
              };

              if (useMongo && mongoose.Types.ObjectId.isValid(targetFamilyId)) {
                try {
                  const saved = await Notification.create(renewalNotif);
                  notifs.unshift(saved);
                } catch (e) {
                  notifs.unshift({ _id: 'notif_exp_' + Date.now() + Math.random(), ...renewalNotif });
                }
              } else {
                notifs.unshift({ _id: 'notif_exp_' + Date.now() + Math.random(), ...renewalNotif });
              }

              // Fire Web Push Notification to registered family devices
              try {
                sendPushToFamily(targetFamilyId, {
                  title: notifTitle,
                  body: `${memberName} ji ka ${doc.title} ${daysText}. Tap to renew online!`,
                  url: `/vault/${docIdStr}`,
                  tag: `expiry-${docIdStr}`,
                }).catch(() => {});
              } catch (e) {}
            }
          }
        }
      } catch (expErr) {
        console.warn('[Notification Route] Expiry reminder warning:', expErr.message);
      }
    } catch (kycErr) {
      console.warn('[Notification Route] KYC check warning:', kycErr.message);
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
