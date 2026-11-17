import mongoose from 'mongoose';

const quorumRequestSchema = new mongoose.Schema({
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: true,
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  },
  documentTitle: {
    type: String,
    required: true,
  },
  actionType: {
    type: String,
    enum: ['VIEW_SENSITIVE', 'DOWNLOAD_SENSITIVE', 'DELETE_SENSITIVE', 'REASSIGN_OWNERSHIP'],
    default: 'VIEW_SENSITIVE',
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reason: {
    type: String,
    default: 'Official verification requirement',
  },
  requiredSignatures: {
    type: Number,
    default: 2,
  },
  signatures: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    userName: String,
    userRole: String,
    signedAt: {
      type: Date,
      default: Date.now,
    },
    digitalSignature: String,
  }],
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'],
    default: 'PENDING',
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.QuorumRequest || mongoose.model('QuorumRequest', quorumRequestSchema);
