import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'DOCUMENT_UPLOAD',
      'DOCUMENT_VIEW',
      'DOCUMENT_DOWNLOAD',
      'DOCUMENT_DELETE',
      'DOCUMENT_RENEW',
      'SHARE_LINK_GENERATED',
      'SHARE_LINK_REVOKED',
      'QUORUM_REQUESTED',
      'QUORUM_SIGNED',
      'QUORUM_APPROVED',
      'BREAK_GLASS_ARMED',
      'BREAK_GLASS_CANCELLED',
      'BREAK_GLASS_TRIGGERED',
      'MEMBER_INVITED',
      'MEMBER_JOINED',
      'MEMBER_REMOVED',
      'OWNERSHIP_TRANSFERRED',
      'PERMISSION_CHANGED',
      'MPIN_PROTECTION_TOGGLED',
      'VAULT_BACKUP_EXPORTED',
      'INTEGRITY_CHECK_PASSED',
    ],
  },
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: true,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  performerName: {
    type: String,
    default: 'System',
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
  },
  documentTitle: {
    type: String,
  },
  ipAddress: {
    type: String,
    default: '103.21.244.18',
  },
  userAgent: {
    type: String,
    default: 'GharVault Client v2.4 (Chrome/Linux)',
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  sha256ChainHash: {
    type: String,
    required: true,
  },
  parentHash: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

auditLogSchema.index({ familyId: 1, timestamp: -1 });

export default mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
