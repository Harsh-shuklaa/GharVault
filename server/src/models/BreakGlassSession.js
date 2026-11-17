import mongoose from 'mongoose';

const breakGlassSessionSchema = new mongoose.Schema({
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: true,
  },
  triggeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  triggerName: {
    type: String,
    required: true,
  },
  reason: {
    type: String,
    required: true,
    enum: [
      'Medical Emergency / Hospitalization',
      'Unforeseen Critical Accident',
      'Legal & Succession Mandate',
      'Loss of Primary Custodian Contact',
      'Other Critical Life Event',
    ],
  },
  notes: {
    type: String,
  },
  status: {
    type: String,
    enum: ['ARMED', 'COUNTDOWN_ACTIVE', 'COMPLETED_UNLOCKED', 'REVOKED_CANCELLED'],
    default: 'ARMED',
  },
  delayHours: {
    type: Number,
    default: 48,
  },
  armedAt: {
    type: Date,
    default: Date.now,
  },
  unlocksAt: {
    type: Date,
    default: () => new Date(Date.now() + 48 * 60 * 60 * 1000), // 48h timer
  },
  revokedAt: {
    type: Date,
  },
  revokedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  notificationsSent: [{
    channel: String, // 'SMS', 'EMAIL', 'WHATSAPP'
    recipient: String,
    sentAt: Date,
  }],
});

export default mongoose.models.BreakGlassSession || mongoose.model('BreakGlassSession', breakGlassSessionSchema);
