import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  icon: {
    type: String,
    default: 'folder', // Material symbol name e.g. badge, real_estate_agent, health_and_safety, account_balance
  },
  color: {
    type: String,
    default: '#2563EB', // Hex color or tailwind class
  },
  description: {
    type: String,
    trim: true,
  },
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: true,
  },
  documentCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

categorySchema.index({ familyId: 1, slug: 1 }, { unique: true });

export default mongoose.models.Category || mongoose.model('Category', categorySchema);
