import crypto from 'crypto';
import User from '../models/User.js';
import Family from '../models/Family.js';
import Document from '../models/Document.js';
import AuditLog from '../models/AuditLog.js';
import Category from '../models/Category.js';
import Notification from '../models/Notification.js';
import QuorumRequest from '../models/QuorumRequest.js';
import BreakGlassSession from '../models/BreakGlassSession.js';

// In-Memory store for offline/demo/free-tier without atlas
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

const generateObjectId = () => {
  return crypto.randomBytes(12).toString('hex');
};

const generateSha256 = (content) => {
  return crypto.createHash('sha256').update(content + Date.now().toString()).digest('hex');
};

export const seedInitialData = async (isMongoConnected = false) => {
  try {
    const familyId = generateObjectId();
    const rajeshId = generateObjectId();
    const priyaId = generateObjectId();
    const aaravId = generateObjectId();
    const sunitaId = generateObjectId();

    // 1. Family
    const familyData = {
      _id: familyId,
      name: 'Sharma Family Ghar',
      inviteCode: 'GHAR-9428',
      adminId: rajeshId,
      settings: {
        quorumRequiredForSensitive: true,
        quorumThreshold: 2,
        breakGlassDelayHours: 48,
        autoColdBackupEnabled: true,
      },
      storageLimitBytes: 53687091200, // 50 GB
      storageUsedBytes: 3650722201,   // 3.4 GB (6.8%)
      createdAt: new Date(Date.now() - 90 * 86400000),
    };

    // 2. Users
    const usersData = [
      {
        _id: rajeshId,
        email: 'rajesh.sharma@gmail.com',
        name: 'Rajesh Sharma',
        role: 'ADMIN',
        relationship: 'Head of Family',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&fit=crop&crop=faces',
        familyId,
        phone: '+91 98201 44891',
        isEmergencyContact: true,
        permissions: {
          canUpload: true,
          canDownload: true,
          canDelete: true,
          canViewSensitive: true,
          canSignQuorum: true,
          canArmBreakGlass: true,
        },
        createdAt: new Date(Date.now() - 90 * 86400000),
      },
      {
        _id: priyaId,
        email: 'priya.sharma@gmail.com',
        name: 'Priya Sharma',
        role: 'GUARDIAN',
        relationship: 'Spouse',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&fit=crop&crop=faces',
        familyId,
        phone: '+91 98201 44892',
        isEmergencyContact: true,
        permissions: {
          canUpload: true,
          canDownload: true,
          canDelete: false,
          canViewSensitive: true,
          canSignQuorum: true,
          canArmBreakGlass: true,
        },
        createdAt: new Date(Date.now() - 85 * 86400000),
      },
      {
        _id: aaravId,
        email: 'aarav.sharma@gmail.com',
        name: 'Aarav Sharma',
        role: 'MEMBER',
        relationship: 'Son (17 yrs)',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&fit=crop&crop=faces',
        familyId,
        phone: '+91 98201 44893',
        isEmergencyContact: false,
        permissions: {
          canUpload: true,
          canDownload: true,
          canDelete: false,
          canViewSensitive: false,
          canSignQuorum: false,
          canArmBreakGlass: false,
        },
        createdAt: new Date(Date.now() - 70 * 86400000),
      },
      {
        _id: sunitaId,
        email: 'sunita.sharma@gmail.com',
        name: 'Sunita Sharma',
        role: 'MEMBER',
        relationship: 'Grandmother',
        avatar: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=200&fit=crop&crop=faces',
        familyId,
        phone: '+91 98201 44894',
        isEmergencyContact: false,
        permissions: {
          canUpload: false,
          canDownload: true,
          canDelete: false,
          canViewSensitive: false,
          canSignQuorum: false,
          canArmBreakGlass: false,
        },
        createdAt: new Date(Date.now() - 60 * 86400000),
      },
    ];

    // 3. Categories
    const categoriesData = [
      {
        _id: generateObjectId(),
        name: 'Identity',
        slug: 'identity',
        icon: 'badge',
        color: '#2563EB',
        description: 'Passports, Aadhaar cards, PAN, Voter IDs, Driver licenses',
        familyId,
        documentCount: 4,
      },
      {
        _id: generateObjectId(),
        name: 'Financial',
        slug: 'financial',
        icon: 'account_balance',
        color: '#059669',
        description: 'Bank statements, Demat portfolios, Mutual funds, Gold bonds',
        familyId,
        documentCount: 3,
      },
      {
        _id: generateObjectId(),
        name: 'Property',
        slug: 'property',
        icon: 'real_estate_agent',
        color: '#7C3AED',
        description: 'Registry deeds, 7/12 extracts, property tax receipts, lease agreements',
        familyId,
        documentCount: 2,
      },
      {
        _id: generateObjectId(),
        name: 'Health',
        slug: 'health',
        icon: 'health_and_safety',
        color: '#DC2626',
        description: 'Health insurance policies, medical histories, vaccination cards',
        familyId,
        documentCount: 2,
      },
      {
        _id: generateObjectId(),
        name: 'Legal',
        slug: 'legal',
        icon: 'gavel',
        color: '#D97706',
        description: 'Registered wills, succession deeds, power of attorney documents',
        familyId,
        documentCount: 1,
      },
    ];

    // 4. Documents
    const doc1Id = generateObjectId();
    const doc2Id = generateObjectId();
    const doc3Id = generateObjectId();
    const doc4Id = generateObjectId();
    const doc5Id = generateObjectId();
    const doc6Id = generateObjectId();

    const documentsData = [
      {
        _id: doc1Id,
        title: 'Indian Passport - Rajesh',
        originalFileName: 'Rajesh_Passport_Renewed_2025.pdf',
        mimeType: 'application/pdf',
        fileSize: 2411724, // 2.3 MB
        category: 'Identity',
        familyId,
        assignedMemberId: rajeshId,
        documentNumber: 'V6924108',
        issueDate: new Date('2025-02-10'),
        expiryDate: new Date('2035-02-09'),
        status: 'ACTIVE',
        isSensitive: false,
        tags: ['Passport', 'Travel', 'Govt ID', 'Biometric'],
        storagePath: `${familyId}/identity/rajesh_passport.pdf`,
        sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        ocrExtractedData: {
          passportNumber: 'V6924108',
          holderName: 'RAJESH SHARMA',
          nationality: 'INDIAN',
          placeOfBirth: 'MUMBAI, MAHARASHTRA',
          validUntil: '09/02/2035',
        },
        uploaderId: rajeshId,
        version: 2,
        createdAt: new Date(Date.now() - 2 * 3600000),
        updatedAt: new Date(Date.now() - 2 * 3600000),
      },
      {
        _id: doc2Id,
        title: 'Term Life Policy #8821 - Priya Sharma',
        originalFileName: 'MaxLife_TermInsurance_Priya.pdf',
        mimeType: 'application/pdf',
        fileSize: 3145728, // 3.0 MB
        category: 'Financial',
        familyId,
        assignedMemberId: priyaId,
        documentNumber: 'POL-8821-MAX',
        issueDate: new Date('2015-12-14'),
        expiryDate: new Date(Date.now() + 27 * 86400000), // EXPIRES IN 27 DAYS!
        status: 'EXPIRING_SOON',
        isSensitive: false,
        tags: ['Insurance', 'Life Cover', 'Nominee: Aarav', 'Critical Expiry'],
        storagePath: `${familyId}/financial/priya_life_policy.pdf`,
        sha256Hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        ocrExtractedData: {
          policyNumber: '8821-MAX-LIFE-2025',
          assuredSum: '₹2,00,00,000',
          nominee: 'Aarav Sharma (Son)',
          renewalDueDate: new Date(Date.now() + 27 * 86400000).toISOString().split('T')[0],
        },
        uploaderId: priyaId,
        version: 1,
        createdAt: new Date(Date.now() - 30 * 86400000),
        updatedAt: new Date(Date.now() - 30 * 86400000),
      },
      {
        _id: doc3Id,
        title: 'Flat 402 Registry Deed',
        originalFileName: 'Bandra_Flat_402_SubRegistrar_Deed.pdf',
        mimeType: 'application/pdf',
        fileSize: 14784921, // 14.1 MB
        category: 'Property',
        familyId,
        assignedMemberId: rajeshId,
        documentNumber: 'MUM-SUBREG-2018-402',
        issueDate: new Date('2018-06-20'),
        status: 'ACTIVE',
        isSensitive: true,
        quorumRequired: true,
        quorumApproved: false,
        tags: ['Real Estate', 'Mumbai Flat', 'Title Deed', 'High Value', 'Quorum Protected'],
        storagePath: `${familyId}/property/flat_402_deed.pdf`,
        sha256Hash: '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b',
        ocrExtractedData: {
          propertyAddress: 'Flat 402, Sea Green Apartments, Bandra West, Mumbai 400050',
          stampDutyPaid: '₹14,50,000',
          registrationNumber: 'BND-2018-9411',
        },
        uploaderId: rajeshId,
        version: 1,
        createdAt: new Date(Date.now() - 14 * 86400000),
        updatedAt: new Date(Date.now() - 14 * 86400000),
      },
      {
        _id: doc4Id,
        title: 'HDFC Ergo Health Policy 2025',
        originalFileName: 'HDFC_Ergo_OptimaRestore_Family.pdf',
        mimeType: 'application/pdf',
        fileSize: 1887436, // 1.8 MB
        category: 'Health',
        familyId,
        assignedMemberId: rajeshId,
        documentNumber: 'HDFC-ERGO-993201',
        issueDate: new Date('2024-05-01'),
        expiryDate: new Date('2025-04-30'),
        status: 'ACTIVE',
        isSensitive: false,
        tags: ['Health Floater', 'Family Cover', 'Optima Restore', '₹50 Lakhs'],
        storagePath: `${familyId}/health/hdfc_ergo_2025.pdf`,
        sha256Hash: 'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35',
        ocrExtractedData: {
          tpaId: 'MEDI-ASSIST-4821',
          cashlessHospitals: 'Lilavati, Hinduja, Kokilaben',
          sumInsured: '₹50,00,000 Floater',
        },
        uploaderId: rajeshId,
        version: 1,
        createdAt: new Date(Date.now() - 5 * 86400000),
        updatedAt: new Date(Date.now() - 5 * 86400000),
      },
      {
        _id: doc5Id,
        title: 'Aadhaar Card - Aarav',
        originalFileName: 'Aadhaar_Aarav_Sharma.pdf',
        mimeType: 'application/pdf',
        fileSize: 1153433, // 1.1 MB
        category: 'Identity',
        familyId,
        assignedMemberId: aaravId,
        documentNumber: 'XXXX-XXXX-9021',
        issueDate: new Date('2019-08-11'),
        status: 'ACTIVE',
        isSensitive: false,
        tags: ['Aadhaar', 'UIDAI', 'e-KYC Verified'],
        storagePath: `${familyId}/identity/aarav_aadhaar.pdf`,
        sha256Hash: '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce',
        ocrExtractedData: {
          uidaiRef: '9021',
          name: 'Aarav Rajesh Sharma',
          dob: '14/07/2009',
        },
        uploaderId: priyaId,
        version: 1,
        createdAt: new Date(Date.now() - 35 * 86400000),
        updatedAt: new Date(Date.now() - 35 * 86400000),
      },
      {
        _id: doc6Id,
        title: 'Registered Family Will & Testament',
        originalFileName: 'Sharma_Family_Registered_Will_2024.pdf',
        mimeType: 'application/pdf',
        fileSize: 5242880, // 5.0 MB
        category: 'Legal',
        familyId,
        assignedMemberId: rajeshId,
        documentNumber: 'WILL-MUM-2024-81',
        issueDate: new Date('2024-01-15'),
        status: 'ACTIVE',
        isSensitive: true,
        quorumRequired: true,
        quorumApproved: false,
        tags: ['Will', 'Succession', 'Notarized', 'High Confidentiality', 'Dual-Key Quorum'],
        storagePath: `${familyId}/legal/family_will_2024.pdf`,
        sha256Hash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
        ocrExtractedData: {
          testator: 'Rajesh Sharma',
          executor: 'Priya Sharma & Advocate Deshmukh',
          registrationOffice: 'Old Customs House, Fort Mumbai',
        },
        uploaderId: rajeshId,
        version: 1,
        createdAt: new Date(Date.now() - 80 * 86400000),
        updatedAt: new Date(Date.now() - 80 * 86400000),
      },
    ];

    // 5. Cryptographic Audit Chain
    const genesisHash = '0000000000000000000000000000000000000000000000000000000000000000';
    let prevHash = genesisHash;

    const auditEvents = [
      {
        action: 'INTEGRITY_CHECK_PASSED',
        performerName: 'Automated Integrity Bot',
        documentTitle: 'Vault Health Check',
        details: { status: 'All 48 hashes matched master chain', hashMatchRatio: 1.0 },
        timestamp: new Date(Date.now() - 6 * 3600000),
      },
      {
        action: 'DOCUMENT_UPLOAD',
        performedBy: priyaId,
        performerName: 'Priya Sharma',
        documentId: doc5Id,
        documentTitle: 'Aadhaar Card - Aarav',
        details: { sizeBytes: 1153433, ocrParsed: true },
        timestamp: new Date(Date.now() - 2 * 3600000),
      },
      {
        action: 'DOCUMENT_VIEW',
        performedBy: rajeshId,
        performerName: 'Rajesh Sharma',
        documentId: doc3Id,
        documentTitle: 'Flat 402 Registry Deed',
        details: { ip: '103.21.244.18', client: 'Chrome MacOS' },
        timestamp: new Date(Date.now() - 12 * 60000),
      },
      {
        action: 'DOCUMENT_RENEW',
        performedBy: rajeshId,
        performerName: 'Rajesh Sharma',
        documentId: doc1Id,
        documentTitle: 'Indian Passport - Rajesh',
        details: { newExpiry: '2035-02-09', oldExpiry: '2025-02-09', biometricChip: 'Validated' },
        timestamp: new Date(Date.now() - 2 * 60000),
      },
    ];

    const auditLogsData = auditEvents.map((evt, idx) => {
      const chainHash = generateSha256(prevHash + evt.action + (evt.documentTitle || ''));
      const log = {
        _id: generateObjectId(),
        familyId,
        action: evt.action,
        performedBy: evt.performedBy || null,
        performerName: evt.performerName,
        documentId: evt.documentId || null,
        documentTitle: evt.documentTitle,
        ipAddress: '103.21.244.18',
        userAgent: 'GharVault Secure Client v2.4',
        details: evt.details,
        sha256ChainHash: chainHash,
        parentHash: prevHash,
        timestamp: evt.timestamp,
      };
      prevHash = chainHash;
      return log;
    });

    // 6. Notifications
    const notificationsData = [
      {
        _id: generateObjectId(),
        familyId,
        userId: rajeshId,
        title: 'Critical Expiry Alert',
        message: 'Term Life Policy #8821 for Priya Sharma expires in 27 days.',
        type: 'WARNING',
        link: '/vault/documents/' + doc2Id,
        isRead: false,
        createdAt: new Date(Date.now() - 3600000),
      },
      {
        _id: generateObjectId(),
        familyId,
        userId: rajeshId,
        title: 'Dual-Key Quorum Signature Requested',
        message: 'Rajesh Sharma initiated view request for Flat 402 Registry Deed.',
        type: 'QUORUM',
        link: '/vault/documents/' + doc3Id,
        isRead: false,
        createdAt: new Date(Date.now() - 7200000),
      },
      {
        _id: generateObjectId(),
        familyId,
        userId: rajeshId,
        title: 'Passport Renewal Sealed',
        message: 'Rajesh Sharma passport e-Passport #V6924108 verified and sealed until 2035.',
        type: 'SUCCESS',
        link: '/vault/documents/' + doc1Id,
        isRead: true,
        createdAt: new Date(Date.now() - 86400000),
      },
    ];

    // 7. Quorum Request
    const quorumRequestsData = [
      {
        _id: generateObjectId(),
        familyId,
        documentId: doc3Id,
        documentTitle: 'Flat 402 Registry Deed',
        actionType: 'VIEW_SENSITIVE',
        requestedBy: rajeshId,
        reason: 'Bank mortgage verification and annual tax filing',
        requiredSignatures: 2,
        signatures: [
          {
            userId: rajeshId,
            userName: 'Rajesh Sharma',
            userRole: 'ADMIN',
            signedAt: new Date(Date.now() - 30 * 60000),
            digitalSignature: 'SIG_RSA4096_RAJESH_e8f9a0c14b2d88',
          },
        ],
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 23 * 3600000),
        createdAt: new Date(Date.now() - 30 * 60000),
      },
    ];

    // 8. Break Glass Session
    const breakGlassSessionsData = [
      {
        _id: generateObjectId(),
        familyId,
        triggeredBy: rajeshId,
        triggerName: 'Rajesh Sharma',
        reason: 'Medical Emergency / Hospitalization',
        notes: 'Pre-authorized protocol ready. 48-hour delay allows immediate override if incapacitated.',
        status: 'ARMED',
        delayHours: 48,
        armedAt: new Date(Date.now() - 24 * 3600000),
        unlocksAt: new Date(Date.now() + 24 * 3600000),
        notificationsSent: [
          { channel: 'SMS', recipient: '+91 98201 44891', sentAt: new Date() },
          { channel: 'EMAIL', recipient: 'priya.sharma@gmail.com', sentAt: new Date() },
        ],
      },
    ];

    // Populate in-memory store
    memoryStore.families = [familyData];
    memoryStore.users = usersData;
    memoryStore.categories = categoriesData;
    memoryStore.documents = documentsData;
    memoryStore.auditLogs = auditLogsData;
    memoryStore.notifications = notificationsData;
    memoryStore.quorumRequests = quorumRequestsData;
    memoryStore.breakGlassSessions = breakGlassSessionsData;

    console.log('[Seed] In-Memory demo store initialized with Sharma Family Ghar.');

    // If real MongoDB is connected, sync documents to DB if empty
    if (isMongoConnected) {
      const existingFamily = await Family.findOne({ inviteCode: 'GHAR-9428' });
      if (!existingFamily) {
        console.log('[Seed] Syncing seed data to MongoDB Atlas...');
        await Family.create(familyData);
        await User.insertMany(usersData);
        await Category.insertMany(categoriesData);
        await Document.insertMany(documentsData);
        await AuditLog.insertMany(auditLogsData);
        await Notification.insertMany(notificationsData);
        await QuorumRequest.insertMany(quorumRequestsData);
        await BreakGlassSession.insertMany(breakGlassSessionsData);
        console.log('[Seed] Seed data successfully synced to MongoDB Atlas.');
      }
    }
  } catch (err) {
    console.error('[Seed] Error during seeding:', err.message);
  }
};
