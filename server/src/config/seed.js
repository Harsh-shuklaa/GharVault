import crypto from 'crypto';
import User from '../models/User.js';
import Family from '../models/Family.js';
import Document from '../models/Document.js';
import AuditLog from '../models/AuditLog.js';
import Category from '../models/Category.js';
import Notification from '../models/Notification.js';

// In-Memory store for development without Atlas
export const memoryStore = {
  families: [],
  users: [],
  documents: [],
  auditLogs: [],
  categories: [],
  notifications: [],
  quorumRequests: [],
  breakGlassSessions: [],
};

export const defaultCategories = [
  {
    name: 'ID Cards',
    slug: 'id-cards',
    icon: 'badge',
    color: '#2563EB',
    description: 'Aadhaar, Passport, PAN, Voter ID, Driver License',
  },
  {
    name: 'Medical & Health',
    slug: 'medical-health',
    icon: 'health_and_safety',
    color: '#DC2626',
    description: 'Health insurance policies, blood test reports, prescriptions',
  },
  {
    name: 'Bank & Property',
    slug: 'bank-property',
    icon: 'account_balance',
    color: '#059669',
    description: 'Bank passbooks, registry deeds, fixed deposits, demat accounts',
  },
  {
    name: 'Education',
    slug: 'education',
    icon: 'school',
    color: '#7C3AED',
    description: 'Degree certificates, school marksheets, admission receipts',
  },
  {
    name: 'Legal',
    slug: 'legal',
    icon: 'gavel',
    color: '#D97706',
    description: 'Wills, power of attorney, agreements, affidavits',
  },
  {
    name: 'Other',
    slug: 'other',
    icon: 'folder',
    color: '#64748B',
    description: 'Vehicle RC, utility bills, miscellaneous family files',
  },
];

export const seedInitialData = async (isMongoConnected = false) => {
  try {
    // Populate default category templates with 0 documents
    memoryStore.categories = defaultCategories.map((c, i) => ({
      _id: 'cat_' + (i + 1),
      ...c,
      documentCount: 0,
      createdAt: new Date(),
    }));

    if (isMongoConnected) {
      const count = await Category.countDocuments();
      if (count === 0) {
        const mongoCategories = defaultCategories.map((c) => ({
          ...c,
          documentCount: 0,
        }));
        await Category.insertMany(mongoCategories);
      }
    }
    console.log('[Seed] Initialized clean database with standard category templates. ZERO dummy files or fake names.');
  } catch (err) {
    console.error('[Seed] Error during setup:', err.message);
  }
};
