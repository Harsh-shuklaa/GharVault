import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  avatar: {
    type: String,
    default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  },
  role: {
    type: String,
    enum: ['ADMIN', 'HEAD', 'GUARDIAN', 'EDITOR', 'MEMBER', 'VIEW_ONLY'],
    default: 'MEMBER',
  },
  relationship: {
    type: String,
    default: 'Member', // e.g. 'Father', 'Mother', 'Son', 'Daughter', 'Grandfather', 'Grandmother', 'Spouse', 'Self'
  },
  relativeTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  fatherOrSpouseName: {
    type: String,
    default: '',
    trim: true,
  },
  spouseName: {
    type: String,
    default: '',
    trim: true,
  },
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
  },
  googleId: {
    type: String,
  },
  phone: {
    type: String,
    default: '',
  },
  dateOfBirth: {
    type: String,
    default: '',
  },
  bloodGroup: {
    type: String,
    default: '', // 'O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'
  },
  emergencyContactPhone: {
    type: String,
    default: '',
  },
  healthInsurancePolicy: {
    type: String,
    default: '',
  },
  tpaNumber: {
    type: String,
    default: '',
  },
  allergies: {
    type: String,
    default: '',
  },
  isEmergencyContact: {
    type: Boolean,
    default: false,
  },
  mpinHash: {
    type: String,
  },
  permissions: {
    canUpload: { type: Boolean, default: true },
    canDownload: { type: Boolean, default: true },
    canDelete: { type: Boolean, default: false },
    canViewSensitive: { type: Boolean, default: true },
    canSignQuorum: { type: Boolean, default: false },
    canArmBreakGlass: { type: Boolean, default: false },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { strict: false });

export default mongoose.models.User || mongoose.model('User', userSchema);
