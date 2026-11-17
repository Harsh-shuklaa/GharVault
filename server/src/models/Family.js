import mongoose from 'mongoose';

const familySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  inviteCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  settings: {
    quorumRequiredForSensitive: {
      type: Boolean,
      default: true,
    },
    quorumThreshold: {
      type: Number,
      default: 2, // 2-of-2 or 2-of-3
    },
    breakGlassDelayHours: {
      type: Number,
      default: 48,
    },
    autoColdBackupEnabled: {
      type: Boolean,
      default: true,
    },
  },
  storageLimitBytes: {
    type: Number,
    default: 53687091200, // 50 GB
  },
  storageUsedBytes: {
    type: Number,
    default: 3650722201, // ~3.4 GB
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Family || mongoose.model('Family', familySchema);
