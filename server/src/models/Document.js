import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  originalFileName: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
    default: 'application/pdf',
  },
  fileSize: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
    default: 'ID Cards',
  },
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: true,
  },
  assignedMemberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  documentNumber: {
    type: String,
    trim: true,
    default: '',
  },
  issueDate: {
    type: Date,
  },
  expiryDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'ARCHIVED'],
    default: 'ACTIVE',
  },
  isSensitive: {
    type: Boolean,
    default: false,
  },
  whoCanView: {
    type: [String],
    default: ['ALL'], // 'ALL' or array of member IDs
  },
  shareLink: {
    token: String,
    expiresAt: Date,
    isPasswordProtected: { type: Boolean, default: false },
    passwordHash: String,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  notes: {
    type: String,
    trim: true,
    default: '',
  },
  storagePath: {
    type: String,
    required: true,
  },
  sha256Hash: {
    type: String,
    required: true,
  },
  ocrExtractedData: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  uploaderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  version: {
    type: Number,
    default: 1,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

documentSchema.index({ familyId: 1, category: 1 });
documentSchema.index({ familyId: 1, assignedMemberId: 1 });
documentSchema.index({ familyId: 1, expiryDate: 1 });
documentSchema.index({ title: 'text', documentNumber: 'text', tags: 'text' });

export default mongoose.models.Document || mongoose.model('Document', documentSchema);
