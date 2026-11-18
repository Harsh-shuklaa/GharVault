import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';
import {
  Sun,
  Moon,
  Copy,
  Check,
  Download,
  Home,
  Cloud,
  User,
  ShieldCheck,
  Camera,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Phone,
  Calendar,
  HeartPulse,
  Mail,
  ShieldAlert,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, family, updateUser } = useAuth();
  const { theme, isDark, setTheme } = useTheme();
  const [copiedCode, setCopiedCode] = useState(false);
  const [downloadingBackup, setDownloadingBackup] = useState(false);

  // Profile Edit State
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bloodGroup: user?.bloodGroup || '',
    dateOfBirth: user?.dateOfBirth || '',
    emergencyContactPhone: user?.emergencyContactPhone || '',
    healthInsurancePolicy: user?.healthInsurancePolicy || '',
    allergies: user?.allergies || '',
    avatar: user?.avatar || '',
  });
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        bloodGroup: user.bloodGroup || '',
        dateOfBirth: user.dateOfBirth || '',
        emergencyContactPhone: user.emergencyContactPhone || '',
        healthInsurancePolicy: user.healthInsurancePolicy || '',
        allergies: user.allergies || '',
        avatar: user.avatar || '',
      });
    }
  }, [user]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAvatar(true);
      setSaveError('');
      const uploadData = new FormData();
      uploadData.append('avatar', file);
      const res = await api.uploadAvatar(uploadData);
      if (res?.avatarUrl) {
        setFormData((prev) => ({ ...prev, avatar: res.avatarUrl }));
        if (updateUser) {
          updateUser({ avatar: res.avatarUrl });
        }
      }
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      setSaveError(err.message || 'Failed to upload avatar image');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSavingProfile(true);
      setSaveError('');
      setSaveSuccess(false);
      const res = await api.updateProfile(formData);
      if (res.user && updateUser) {
        updateUser(res.user);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setSaveError(err.message || 'Failed to save profile changes');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCopyCode = () => {
    if (!family?.inviteCode) return;
    navigator.clipboard.writeText(family.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadBackup = async () => {
    try {
      setDownloadingBackup(true);
      const res = await api.getDocuments();
      const exportData = {
        exportedAt: new Date().toISOString(),
        family: family?.name,
        documentsCount: res.documents?.length || 0,
        documents: res.documents || [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(family?.name || 'GharVault').replace(/\s+/g, '_')}_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to generate vault backup: ' + err.message);
    } finally {
      setDownloadingBackup(false);
    }
  };

  return (
    <div className="max-w-[1380px] mx-auto p-4 sm:p-5 lg:p-6 space-y-5 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">Settings</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
          Manage theme preferences, family vault profile, invite codes, and cloud infrastructure status.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Theme & Family Vault (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Theme Switcher Card (Supabase Dark Mode & Light Mode) */}
          <div className="bg-white dark:bg-[#1C1C1C] rounded-3xl p-6 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-4 transition-colors">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span>Appearance & Theme</span>
              <span className="text-xs font-mono font-semibold text-[#10B981] dark:text-[#3ECF8E] bg-emerald-50 dark:bg-[#3ECF8E]/10 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-[#3ECF8E]/20">
                {isDark ? 'Supabase Dark Active' : 'Light Mode Active'}
              </span>
            </h2>

            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Choose your visual design experience. Changes are persisted in your browser automatically.
            </p>

            <div className="grid grid-cols-2 gap-3.5 pt-1">
              {/* Dark Mode Option */}
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  isDark
                    ? 'border-[#3ECF8E] bg-[#141414] ring-2 ring-[#3ECF8E]/20 shadow-sm'
                    : 'border-slate-200 dark:border-[#262626] bg-slate-50 dark:bg-[#141414] hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-xl bg-[#1C1C1C] border border-[#262626] text-[#3ECF8E] flex items-center justify-center">
                    <Moon size={16} strokeWidth={2} />
                  </div>
                  {isDark && (
                    <span className="w-2 h-2 rounded-full bg-[#3ECF8E]"></span>
                  )}
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Supabase Dark</div>
                <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                  Obsidian canvas with emerald green accents
                </div>
              </button>

              {/* Light Mode Option */}
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  !isDark
                    ? 'border-[#10B981] bg-white ring-2 ring-emerald-500/20 shadow-sm'
                    : 'border-slate-200 dark:border-[#262626] bg-slate-50 dark:bg-[#141414] hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                    <Sun size={16} strokeWidth={2} />
                  </div>
                  {!isDark && (
                    <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                  )}
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Clean Light</div>
                <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                  Soft off-white with high-contrast emerald text
                </div>
              </button>
            </div>
          </div>

          {/* Family Workspace Card */}
          <div className="bg-white dark:bg-[#1C1C1C] rounded-3xl p-6 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-5 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#262626]">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Home size={18} className="text-[#10B981] dark:text-[#3ECF8E]" />
                <span>Family Vault Profile</span>
              </h2>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-[#3ECF8E] bg-emerald-50 dark:bg-[#3ECF8E]/10 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-[#3ECF8E]/20">
                Active Vault
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 dark:text-neutral-500 font-bold uppercase tracking-wider mb-1">
                  Family Vault Name
                </label>
                <div className="font-bold text-slate-900 dark:text-white text-base">
                  {family?.name || 'Your Family Vault'}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 dark:text-neutral-500 font-bold uppercase tracking-wider mb-1">
                  Family Invite Code (Share with family members)
                </label>
                <div className="flex items-center gap-3">
                  <code className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#141414] font-mono font-bold text-sm text-slate-900 dark:text-neutral-200 tracking-wider border border-slate-200 dark:border-[#262626]">
                    {family?.inviteCode || 'GHAR-VAULT'}
                  </code>
                  <button
                    onClick={handleCopyCode}
                    className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-[#3ECF8E]/10 hover:bg-emerald-100 dark:hover:bg-[#3ECF8E]/20 text-emerald-700 dark:text-[#3ECF8E] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-1">
                  Family members can use this code to join your vault from the setup screen.
                </p>
              </div>
            </div>
          </div>

          {/* Zero Financial Cost (₹0 Setup) Infrastructure Status */}
          <div className="bg-white dark:bg-[#1C1C1C] rounded-3xl p-6 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-4 transition-colors">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Cloud size={18} className="text-[#10B981] dark:text-[#3ECF8E]" />
              <span>100% Free-Tier Architecture (₹0 Setup)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              GharVault is built to run entirely on permanent free tiers with zero AWS S3 or paid hosting costs.
            </p>

            <div className="space-y-3 text-xs">
              {/* Supabase Storage */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-200/80 dark:border-[#262626] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#3ECF8E]/15 text-[#3ECF8E] flex items-center justify-center font-bold text-base">
                    S
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Supabase Storage (Free Tier)</div>
                    <div className="text-[11px] text-slate-500 dark:text-neutral-400">Private Buckets • 25MB max file size • Expiring signed links</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-[#3ECF8E]/20 text-emerald-800 dark:text-[#3ECF8E] font-mono text-[10px] font-bold">
                  ACTIVE
                </span>
              </div>

              {/* MongoDB Atlas */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-200/80 dark:border-[#262626] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-base">
                    M
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">MongoDB Atlas (M0 Free Cluster)</div>
                    <div className="text-[11px] text-slate-500 dark:text-neutral-400">Document metadata • Family roster • Secure indexing</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-[#3ECF8E]/20 text-emerald-800 dark:text-[#3ECF8E] font-mono text-[10px] font-bold">
                  CONNECTED
                </span>
              </div>

              {/* Supabase Auth */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-200/80 dark:border-[#262626] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-base">
                    G
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Google OAuth via Supabase Auth</div>
                    <div className="text-[11px] text-slate-500 dark:text-neutral-400">Frictionless 1-click login • Zero passwords to remember</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-[#3ECF8E]/20 text-emerald-800 dark:text-[#3ECF8E] font-mono text-[10px] font-bold">
                  ACTIVE
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: User Profile & Backup Export (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* User Profile Edit Card */}
          <div className="bg-white dark:bg-[#1C1C1C] rounded-3xl p-6 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-5 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#262626]">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User size={18} className="text-[#10B981] dark:text-[#3ECF8E]" />
                <span>Personal Account Profile</span>
              </h2>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-[#3ECF8E] bg-emerald-50 dark:bg-[#3ECF8E]/10 px-2.5 py-0.5 rounded-full border border-emerald-200/60 dark:border-[#3ECF8E]/20">
                {user?.role === 'ADMIN' ? 'Family Admin' : 'Family Member'}
              </span>
            </div>

            {/* Avatar Upload Section */}
            <div className="flex items-center gap-4">
              <div className="relative group shrink-0">
                <img
                  src={
                    formData.avatar ||
                    user?.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || user?.name || 'User')}&background=3ECF8E&color=121212`
                  }
                  alt={formData.name || user?.name}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-500/20 shadow-xs"
                />
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#2E2E2E] bg-slate-50 dark:bg-[#141414] hover:bg-slate-100 dark:hover:bg-[#222222] text-xs font-semibold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Camera size={14} className="text-[#10B981] dark:text-[#3ECF8E]" />
                  <span>{isUploadingAvatar ? 'Uploading...' : 'Change Photo'}</span>
                </button>
                <p className="text-[11px] text-slate-400 dark:text-neutral-500">
                  JPG, PNG or WEBP (Max 5MB). Stored securely in Supabase.
                </p>
              </div>
            </div>

            {/* Feedback Alerts */}
            {saveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-[#3ECF8E]" />
                <span>Profile updated successfully! Emergency card data synced.</span>
              </div>
            )}
            {saveError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-red-500" />
                <span>{saveError}</span>
              </div>
            )}

            {/* Profile Form */}
            <form onSubmit={handleProfileSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-neutral-400 font-semibold mb-1">
                  Full Display Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#2E2E2E] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-neutral-400 font-semibold mb-1 flex items-center justify-between">
                  <span>Google Account Email</span>
                  <span className="text-[10px] text-emerald-700 dark:text-[#3ECF8E] flex items-center gap-1">
                    <ShieldCheck size={12} /> Verified OAuth
                  </span>
                </label>
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#141414]/60 border border-slate-200/80 dark:border-[#262626] text-slate-500 dark:text-neutral-400 font-mono text-xs">
                  <Mail size={13} className="shrink-0 text-slate-400" />
                  <span className="truncate">{user?.email || 'user@example.com'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 dark:text-neutral-400 font-semibold mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#2E2E2E] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-neutral-400 font-semibold mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#2E2E2E] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 dark:text-neutral-400 font-semibold mb-1">
                    Blood Group
                  </label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#2E2E2E] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs transition-colors"
                  >
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-neutral-400 font-semibold mb-1">
                    Emergency Contact No.
                  </label>
                  <input
                    type="tel"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                    placeholder="+91 99999 88888"
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#2E2E2E] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-neutral-400 font-semibold mb-1">
                  Health Insurance Policy / TPA No.
                </label>
                <input
                  type="text"
                  value={formData.healthInsurancePolicy}
                  onChange={(e) => setFormData({ ...formData, healthInsurancePolicy: e.target.value })}
                  placeholder="e.g. Star Health #SH-8849201"
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#2E2E2E] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-neutral-400 font-semibold mb-1">
                  Allergies / Critical Medical Notes
                </label>
                <input
                  type="text"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="e.g. Penicillin allergy, Diabetic Type 2"
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#2E2E2E] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs transition-colors"
                />
                <span className="text-[10px] text-slate-400 dark:text-neutral-500 mt-1 block">
                  Included automatically in the Emergency Hospital Card for instant access.
                </span>
              </div>

              {/* Save Changes Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#10B981] hover:bg-[#059669] dark:bg-[#3ECF8E] dark:hover:bg-[#34b27b] text-white dark:text-[#121212] font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Backup Export */}
          <div className="bg-white dark:bg-[#1C1C1C] rounded-3xl p-6 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-3 transition-colors">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Download size={18} className="text-[#10B981] dark:text-[#3ECF8E]" />
              <span>Export Vault Data</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Download a complete JSON record of all documents, metadata, and timestamps stored in your family vault.
            </p>
            <button
              onClick={handleDownloadBackup}
              disabled={downloadingBackup}
              className="w-full py-3 rounded-xl bg-slate-100 dark:bg-[#141414] hover:bg-slate-200 dark:hover:bg-[#262626] text-slate-800 dark:text-neutral-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Download size={16} />
              <span>{downloadingBackup ? 'Exporting...' : 'Download Vault Backup (JSON)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
