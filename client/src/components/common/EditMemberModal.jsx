import React, { useState, useEffect, useRef } from 'react';
import { X, User, Camera, AlertCircle, Check, ShieldAlert } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

export default function EditMemberModal({ isOpen, onClose, member, onMemberUpdated }) {
  const { toast } = useToast();
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
  const fileInputRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
        setFormData((prev) => ({ ...prev, avatar: res.avatarUrl }));
        toast.success('Profile photo updated successfully!');
      } else {
        throw new Error(res?.error || 'Failed to upload photo');
      }
    } catch (err) {
      setError(err.message || 'Avatar upload failed');
      toast.error(err.message || 'Failed to upload photo');
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
      const targetId = member._id || member.id;
      const res = await api.updateMember(targetId, formData);
      if (res?.success && res?.member) {
        toast.success(`${formData.name}'s profile saved successfully!`);
        if (onMemberUpdated) {
          onMemberUpdated(res.member);
        }
        onClose();
      } else {
        throw new Error(res?.error || 'Failed to update member profile');
      }
    } catch (err) {
      setError(err.message || 'Failed to save member profile');
      toast.error(err.message || 'Failed to save member profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="fixed inset-x-0 bottom-0 md:static md:inset-auto w-full max-w-xl bg-white dark:bg-[#18181B] border-t md:border border-slate-200 dark:border-[#27272A] rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col max-h-[88vh] md:max-h-[85vh] overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle Pill */}
        <div className="md:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-neutral-600" />
        </div>

        {/* Fixed Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-[#27272A] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-600 dark:text-[#3ECF8E] flex items-center justify-center border border-emerald-100 dark:border-[#3ECF8E]/20 shrink-0">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Edit Member Profile
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Update personal, relationship, and medical directives
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-[#27272A] text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="edit-member-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Avatar Upload Banner */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-200/80 dark:border-[#27272A] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={
                    formData.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'Member')}&background=3ECF8E&color=121212`
                  }
                  alt={formData.name}
                  className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl object-cover ring-2 ring-emerald-500/20 shadow-xs"
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
                <span className="text-[11px] text-slate-500 dark:text-neutral-400 block mt-0.5 truncate">
                  Encrypted Family Vault
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
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-[#27272A] bg-white dark:bg-[#18181B] hover:bg-slate-50 dark:hover:bg-[#27272A] text-slate-700 dark:text-neutral-300 text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
            </button>
          </div>

          {/* Row 1: Name & Relationship */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] bg-white dark:bg-[#141414] focus:border-[#10B981] dark:focus:border-[#3ECF8E] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                placeholder="e.g. Ramesh Sharma"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                Relationship *
              </label>
              <select
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] bg-white dark:bg-[#141414] focus:border-[#10B981] dark:focus:border-[#3ECF8E] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] bg-white dark:bg-[#141414] focus:border-[#10B981] dark:focus:border-[#3ECF8E] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                Blood Group (Emergency)
              </label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] bg-white dark:bg-[#141414] focus:border-[#10B981] dark:focus:border-[#3ECF8E] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                Primary Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] bg-white dark:bg-[#141414] focus:border-[#10B981] dark:focus:border-[#3ECF8E] text-xs font-semibold text-slate-900 dark:text-white font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                Emergency Contact Phone
              </label>
              <input
                type="tel"
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                placeholder="+91 98765 00000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] bg-white dark:bg-[#141414] focus:border-[#10B981] dark:focus:border-[#3ECF8E] text-xs font-semibold text-slate-900 dark:text-white font-mono focus:outline-none"
              />
            </div>
          </div>

          {/* Row 4: Health Insurance & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                Health Insurance Policy / Card #
              </label>
              <input
                type="text"
                value={formData.healthInsurancePolicy}
                onChange={(e) => setFormData({ ...formData, healthInsurancePolicy: e.target.value })}
                placeholder="e.g. Star Health #SH1029384"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] bg-white dark:bg-[#141414] focus:border-[#10B981] dark:focus:border-[#3ECF8E] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="member@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] bg-white dark:bg-[#141414] focus:border-[#10B981] dark:focus:border-[#3ECF8E] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Allergies / Medical Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Allergies / Critical Medical Directives</span>
              <span className="text-[10px] text-red-600 dark:text-red-400 font-semibold normal-case">
                Syncs with Hospital Emergency Card
              </span>
            </label>
            <textarea
              rows={2}
              value={formData.allergies}
              onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
              placeholder="e.g. Severe Penicillin allergy, Type-2 Diabetic, Asthmatic"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] bg-white dark:bg-[#141414] focus:border-[#10B981] dark:focus:border-[#3ECF8E] text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          {/* Emergency Nominee Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#141414] cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isEmergencyContact}
                onChange={(e) => setFormData({ ...formData, isEmergencyContact: e.target.checked })}
                className="mt-0.5 rounded text-[#10B981] dark:text-[#3ECF8E] border-slate-300 dark:border-[#27272A] focus:ring-[#3ECF8E]"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-red-600 dark:text-red-400" />
                  Primary Emergency Contact
                </span>
                <span className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 block leading-relaxed">
                  Badged prominently on the family dashboard and receives fast hospital admission directives.
                </span>
              </div>
            </label>
          </div>
        </form>

        {/* Fixed Footer */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-50 dark:bg-[#141414] border-t border-slate-100 dark:border-[#27272A] flex flex-col-reverse sm:flex-row items-center sm:justify-end gap-2.5 shrink-0 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] hover:bg-slate-100 dark:hover:bg-[#27272A] text-slate-700 dark:text-neutral-300 font-bold text-xs transition-colors cursor-pointer text-center"
          >
            Cancel
          </button>
          <button
            form="edit-member-form"
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] font-bold text-xs shadow-md shadow-[#3ECF8E]/20 transition-all cursor-pointer"
          >
            <Check size={15} strokeWidth={2.5} />
            <span>{loading ? 'Saving Profile...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
