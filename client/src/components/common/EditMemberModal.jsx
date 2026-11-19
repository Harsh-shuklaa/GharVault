import React, { useState, useEffect, useRef } from 'react';
import { X, User, Camera, AlertCircle, Check, HeartPulse, ShieldAlert, Sparkles } from 'lucide-react';
import { api } from '../../lib/api';

export default function EditMemberModal({ isOpen, onClose, member, onMemberUpdated }) {
  const [formData, setFormData] = useState({
    name: '',
    relationship: 'Family Member',
    dateOfBirth: '',
    bloodGroup: '',
    phone: '',
    email: '',
    healthInsurancePolicy: '',
    tpaNumber: '',
    emergencyContactPhone: '',
    allergies: '',
    isEmergencyContact: false,
    avatar: '',
  });

  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name || '',
        relationship: member.relationship || 'Family Member',
        dateOfBirth: member.dateOfBirth || '',
        bloodGroup: member.bloodGroup || '',
        phone: member.phone || '',
        email: member.email || '',
        healthInsurancePolicy: member.healthInsurancePolicy || '',
        tpaNumber: member.tpaNumber || '',
        emergencyContactPhone: member.emergencyContactPhone || '',
        allergies: member.allergies || '',
        isEmergencyContact: Boolean(member.isEmergencyContact),
        avatar: member.avatar || '',
      });
      setError('');
      setSuccess('');
    }
  }, [member, isOpen]);

  if (!isOpen || !member) return null;

  const relationshipOptions = [
    'Father',
    'Mother',
    'Spouse',
    'Son',
    'Daughter',
    'Grandfather',
    'Grandmother',
    'Brother',
    'Sister',
    'Uncle',
    'Aunt',
    'Self',
    'Family Member',
    'Other',
  ];

  const bloodGroups = ['', 'O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'];

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Photo exceeds 10MB limit. Please choose a smaller image.');
      return;
    }

    try {
      setUploadingAvatar(true);
      setError('');
      const data = new FormData();
      data.append('avatar', file);
      const res = await api.uploadAvatar(data);
      if (res?.avatarUrl) {
        setFormData(prev => ({ ...prev, avatar: res.avatarUrl }));
        setSuccess('Profile photo uploaded!');
        setTimeout(() => setSuccess(''), 2500);
      } else {
        throw new Error(res?.error || 'Failed to upload photo');
      }
    } catch (err) {
      setError(err.message || 'Avatar upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Member name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await api.updateMember(member._id, formData);
      if (res?.success && res?.member) {
        setSuccess('Member profile saved successfully!');
        if (onMemberUpdated) {
          onMemberUpdated(res.member);
        }
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        throw new Error(res?.error || 'Failed to update member');
      }
    } catch (err) {
      setError(err.message || 'Failed to save member profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="fixed inset-x-0 bottom-0 rounded-t-2xl max-h-[90vh] overflow-y-auto md:static md:inset-auto md:rounded-xl md:max-w-lg w-full bg-white dark:bg-[#1C1C1C] p-4 sm:p-5 lg:p-6 shadow-2xl border border-slate-200 dark:border-[#2E2E2E] space-y-5 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#262626]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-600 dark:text-[#3ECF8E] flex items-center justify-center border border-emerald-100 dark:border-[#3ECF8E]/20">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Edit Member Profile
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Update personal, relationship, and emergency medical directives
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-[#262626] text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-[#3ECF8E] text-xs font-semibold flex items-center gap-2">
            <Check size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar Upload Banner */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-200/80 dark:border-[#262626] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={
                    formData.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'Member')}&background=3ECF8E&color=121212`
                  }
                  alt={formData.name}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover ring-2 ring-emerald-500/20 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] flex items-center justify-center shadow-sm hover:scale-105 transition-all cursor-pointer"
                  title="Upload profile photo"
                >
                  <Camera size={13} strokeWidth={2.2} />
                </button>
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                  Profile Photo
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-neutral-400 block mt-0.5 truncate">
                  Bank-Grade Encrypted Vault
                </span>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={handleAvatarFile}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-slate-300 dark:border-[#262626] bg-white dark:bg-[#1C1C1C] hover:bg-slate-50 dark:hover:bg-[#262626] text-slate-700 dark:text-neutral-300 text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
            </button>
          </div>

          {/* Row 1: Name & Relationship */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#262626] bg-white dark:bg-[#141414] focus:border-[#10B981] dark:focus:border-[#3ECF8E] text-xs font-semibold text-slate-900 dark:text-white"
                placeholder="e.g. Ramesh Sharma"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                Relationship *
              </label>
              <select
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#262626] bg-white dark:bg-[#141414] focus:border-[#10B981] dark:focus:border-[#3ECF8E] text-xs font-semibold text-slate-900 dark:text-white"
              >
                {relationshipOptions.map((rel) => (
                  <option key={rel} value={rel}>
                    {rel}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Date of Birth & Blood Group */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#262626] bg-white dark:bg-[#141414] focus:border-[#10B981] dark:focus:border-[#3ECF8E] text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                Blood Group (Emergency Directive)
              </label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#262626] bg-white dark:bg-[#141414] focus:border-[#10B981] dark:focus:border-[#3ECF8E] text-xs font-semibold text-slate-900 dark:text-white"
              >
                <option value="">Select Blood Group</option>
                {bloodGroups.filter(Boolean).map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Phone & Emergency Contact Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                Primary Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#262626] bg-white dark:bg-[#141414] focus:border-[#10B981] dark:focus:border-[#3ECF8E] text-xs font-semibold text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                Emergency Contact Phone
              </label>
              <input
                type="tel"
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                placeholder="+91 98765 00000"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#262626] bg-white dark:bg-[#141414] focus:border-[#10B981] dark:focus:border-[#3ECF8E] text-xs font-semibold text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          {/* Row 4: Health Insurance Policy & TPA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                Health Insurance Policy / Card #
              </label>
              <input
                type="text"
                value={formData.healthInsurancePolicy}
                onChange={(e) => setFormData({ ...formData, healthInsurancePolicy: e.target.value })}
                placeholder="e.g. Star Health #SH1029384"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#262626] bg-white dark:bg-[#141414] focus:border-[#10B981] dark:focus:border-[#3ECF8E] text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="member@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#262626] bg-white dark:bg-[#141414] focus:border-[#10B981] dark:focus:border-[#3ECF8E] text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Allergies / Medical Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Allergies / Critical Medical Directives</span>
              <span className="text-[10px] text-red-600 dark:text-red-400 font-semibold normal-case">
                Syncs with Emergency Hospital Card
              </span>
            </label>
            <textarea
              rows={2}
              value={formData.allergies}
              onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
              placeholder="e.g. Severe Penicillin allergy, Type-2 Diabetic, Asthmatic"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#262626] bg-white dark:bg-[#141414] focus:border-[#10B981] dark:focus:border-[#3ECF8E] text-xs font-medium text-slate-900 dark:text-white"
            />
          </div>

          {/* Emergency Nominee Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-[#262626] bg-slate-50 dark:bg-[#141414] cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isEmergencyContact}
                onChange={(e) => setFormData({ ...formData, isEmergencyContact: e.target.checked })}
                className="mt-0.5 rounded text-[#10B981] dark:text-[#3ECF8E] border-slate-300 dark:border-[#262626] focus:ring-[#3ECF8E]"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-red-600" />
                  Primary Emergency Contact
                </span>
                <span className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 block">
                  This member will be prominently badged and receive instant SMS/call broadcasts during hospital admission.
                </span>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-center sm:justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#262626]">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 dark:border-[#262626] hover:bg-slate-50 dark:hover:bg-[#262626] text-slate-700 dark:text-neutral-300 font-bold text-xs transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] font-bold text-xs shadow-md shadow-[#3ECF8E]/20 transition-all cursor-pointer"
            >
              <Check size={15} strokeWidth={2.5} />
              <span>{loading ? 'Saving Profile...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
