import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
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
  Shield,
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
  KeyRound,
  Database,
  LogOut,
  Smartphone,
  Edit3,
  X,
  Lock,
  Bell,
  Send,
  Sparkles,
} from 'lucide-react';
import { usePWAInstall } from '../context/PWAInstallContext';
import { usePushNotification } from '../context/PushNotificationContext';
import JoinFamilyModal from '../components/common/JoinFamilyModal';
import SendPushModal from '../components/common/SendPushModal';

export default function SettingsPage() {
  const { user, family, updateUser, updateFamily, openLogoutModal } = useAuth();
  const { theme, isDark, setTheme, darkStyle, setDarkStyle, accentColor, isBlue, setAccentColor } = useTheme();
  const { toast } = useToast();
  const { isStandalone, isIOS, isAndroid, triggerNativeInstall } = usePWAInstall();
  const {
    isSubscribed: isPushSubscribed,
    loading: pushLoading,
    requestPushPermission,
    testLocalNotification,
  } = usePushNotification();

  const [isPushModalOpen, setIsPushModalOpen] = useState(false);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    api.getMembers().then(res => setMembers(res.members || [])).catch(() => {});
  }, []);

  // Active Tab State (with hash sync)
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return ['profile', 'family', 'security', 'appearance', 'backup', 'app'].includes(hash)
      ? hash
      : 'profile';
  });

  const switchTab = (tabId) => {
    setActiveTab(tabId);
    window.location.hash = tabId;
  };

  const [copiedCode, setCopiedCode] = useState(false);
  const [downloadingBackup, setDownloadingBackup] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [newMpin, setNewMpin] = useState('');
  const [isSavingMpin, setIsSavingMpin] = useState(false);
  const [mpinSuccess, setMpinSuccess] = useState('');
  const [mpinError, setMpinError] = useState('');

  // Family Vault Name Edit State
  const [isEditingFamilyName, setIsEditingFamilyName] = useState(false);
  const [familyNameInput, setFamilyNameInput] = useState('');
  const [isSavingFamilyName, setIsSavingFamilyName] = useState(false);
  const [familyNameError, setFamilyNameError] = useState('');

  useEffect(() => {
    if (family?.name) {
      setFamilyNameInput(family.name);
    }
  }, [family?.name]);

  const handleSaveFamilyName = async (e) => {
    e?.preventDefault();
    if (!familyNameInput.trim()) {
      setFamilyNameError('Family Vault name cannot be empty.');
      return;
    }
    try {
      setIsSavingFamilyName(true);
      setFamilyNameError('');
      const res = await api.updateFamilyName(familyNameInput.trim());
      if (res?.success && res?.family) {
        if (updateFamily) {
          updateFamily(res.family);
        }
        setIsEditingFamilyName(false);
        toast.success(`Family Vault name updated to "${res.family.name}"!`);
      } else {
        setFamilyNameError(res?.error || 'Failed to update family vault name');
      }
    } catch (err) {
      setFamilyNameError(err.message || 'Failed to update family vault name');
    } finally {
      setIsSavingFamilyName(false);
    }
  };

  const handleUpdateMpin = async (e) => {
    e.preventDefault();
    if (!newMpin || newMpin.length !== 4 || !/^\d{4}$/.test(newMpin)) {
      setMpinError('MPIN must be exactly 4 numeric digits.');
      return;
    }
    try {
      setIsSavingMpin(true);
      setMpinError('');
      const res = await api.setMpin(newMpin);
      if (res.success) {
        setMpinSuccess('4-digit Security MPIN updated successfully!');
        setNewMpin('');
        setTimeout(() => setMpinSuccess(''), 3000);
      } else {
        setMpinError(res.error || 'Failed to update MPIN');
      }
    } catch (err) {
      setMpinError(err.message || 'Failed to update MPIN');
    } finally {
      setIsSavingMpin(false);
    }
  };

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
      toast.success('Family Vault backup JSON exported successfully!');
    } catch (err) {
      toast.error('Failed to generate vault backup: ' + (err.message || 'Error'));
    } finally {
      setDownloadingBackup(false);
    }
  };

  // Tab definitions
  const tabs = [
    {
      id: 'profile',
      label: 'Personal Profile',
      desc: 'Name, photo & emergency medical data',
      icon: User,
    },
    {
      id: 'family',
      label: 'Family Vault',
      desc: 'Vault name, invite code & member join',
      icon: Home,
    },
    {
      id: 'security',
      label: 'Security & MPIN',
      desc: '4-digit MPIN & encryption locker',
      icon: ShieldCheck,
    },
    {
      id: 'appearance',
      label: 'Appearance',
      desc: 'Obsidian Dark vs Clean Light mode',
      icon: Sun,
    },
    {
      id: 'backup',
      label: 'Data & Backup',
      desc: 'Full JSON export & storage status',
      icon: Database,
    },
    {
      id: 'app',
      label: 'Mobile App & Push Alerts',
      desc: 'Install PWA & Family Push Notifications',
      icon: Smartphone,
      badge: isStandalone ? 'Installed' : 'PWA',
    },
  ];

  return (
    <div className="max-w-[1380px] mx-auto p-4 sm:p-5 lg:p-6 space-y-5 sm:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
          Configure personal health profiles, family vault credentials, security MPIN, and appearance preferences.
        </p>
      </div>

      {/* Mobile Horizontal Pill Navigation Bar (Phone & Tablet) */}
      <div className="lg:hidden">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => switchTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] shadow-sm shadow-[#3ECF8E]/25'
                    : 'bg-white dark:bg-[#1C1C1C] border border-slate-200/80 dark:border-[#262626] text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
                      isActive
                        ? 'bg-black/20 text-white'
                        : 'bg-emerald-100 dark:bg-[#3ECF8E]/15 text-emerald-800 dark:text-[#3ECF8E]'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 2-Column Layout (Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Settings Sidebar (Hidden on mobile, visible on lg+) */}
        <div className="hidden lg:block lg:col-span-4 xl:col-span-3 sticky top-20">
          <div className="bg-white dark:bg-[#1C1C1C] rounded-3xl p-3 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-1">
            {/* User Quick Identity Pill */}
            <div className="p-3 mb-2 rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-100 dark:border-[#222] flex items-center gap-3">
              <img
                src={
                  formData.avatar ||
                  user?.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || user?.name || 'User')}&background=3ECF8E&color=121212`
                }
                alt={formData.name || user?.name}
                className="w-10 h-10 rounded-xl object-cover ring-1 ring-emerald-500/30 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                  {formData.name || user?.name || 'Family User'}
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-[#3ECF8E] font-medium truncate flex items-center gap-1">
                  <span>{user?.role === 'ADMIN' ? 'Head of Family' : 'Family Member'}</span>
                  <span>•</span>
                  <span className="truncate">{family?.name || 'Family Vault'}</span>
                </div>
              </div>
            </div>

            {/* Navigation Tab Links */}
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => switchTab(tab.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-50/80 dark:bg-[#3ECF8E]/10 text-emerald-800 dark:text-[#3ECF8E] font-bold border border-emerald-200/60 dark:border-[#3ECF8E]/25 shadow-2xs'
                        : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.03] font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? 'bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212]'
                            : 'bg-slate-100 dark:bg-[#222] text-slate-500 dark:text-neutral-400'
                        }`}
                      >
                        <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs truncate">{tab.label}</div>
                        <div className="text-[10px] text-slate-400 dark:text-neutral-500 font-normal truncate">
                          {tab.desc}
                        </div>
                      </div>
                    </div>

                    {tab.badge && (
                      <span className="ml-2 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-100 dark:bg-[#3ECF8E]/15 text-emerald-800 dark:text-[#3ECF8E] shrink-0">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Quick Logout Button in Sidebar */}
            <div className="pt-2 border-t border-slate-100 dark:border-[#262626]">
              <button
                type="button"
                onClick={openLogoutModal}
                className="w-full flex items-center gap-3 p-3 rounded-2xl text-left text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 font-bold text-xs transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-500/15 flex items-center justify-center shrink-0">
                  <LogOut size={15} />
                </div>
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Active Content Area (lg:col-span-8 xl:col-span-9) */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          {/* ================= TAB 1: PERSONAL PROFILE ================= */}
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-[#1C1C1C] rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-6 animate-fadeIn transition-colors">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#262626]">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <User size={20} className="text-[#10B981] dark:text-[#3ECF8E]" />
                    <span>Personal Account & Health Profile</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                    Your details are synced to the Family Emergency Card for instant hospital access.
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-700 dark:text-[#3ECF8E] bg-emerald-50 dark:bg-[#3ECF8E]/10 px-3 py-1 rounded-full border border-emerald-200/60 dark:border-[#3ECF8E]/20">
                  {user?.role === 'ADMIN' ? 'Family Admin' : 'Family Member'}
                </span>
              </div>

              {/* Avatar Upload Section */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-100 dark:border-[#262626]">
                <div className="relative group shrink-0 self-start sm:self-auto">
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

                <div className="flex-1 space-y-1.5">
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
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#2E2E2E] bg-white dark:bg-[#1C1C1C] hover:bg-slate-100 dark:hover:bg-[#262626] text-xs font-semibold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Camera size={14} className="text-[#10B981] dark:text-[#3ECF8E]" />
                    <span>{isUploadingAvatar ? 'Uploading...' : 'Change Photo'}</span>
                  </button>
                  <p className="text-[11px] text-slate-400 dark:text-neutral-500">
                    JPG, PNG or WEBP (Max 5MB). Stored securely in your encrypted vault.
                  </p>
                </div>
              </div>

              {/* Feedback Alerts */}
              {saveSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-[#3ECF8E]" />
                  <span>Profile updated successfully! Emergency card data synced.</span>
                </div>
              )}
              {saveError && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0 text-red-500" />
                  <span>{saveError}</span>
                </div>
              )}

              {/* Profile Form */}
              <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#2E2E2E] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-neutral-400 font-semibold mb-1 flex items-center justify-between">
                    <span>Google Account Email</span>
                    <span className="text-[10px] text-emerald-700 dark:text-[#3ECF8E] flex items-center gap-1 font-medium">
                      <ShieldCheck size={12} /> Verified Google Account
                    </span>
                  </label>
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#141414]/60 border border-slate-200/80 dark:border-[#262626] text-slate-500 dark:text-neutral-400 font-mono text-xs">
                    <Mail size={14} className="shrink-0 text-slate-400" />
                    <span className="truncate">{user?.email || 'user@example.com'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 dark:text-neutral-400 font-semibold mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#2E2E2E] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs transition-colors"
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
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#2E2E2E] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 dark:text-neutral-400 font-semibold mb-1">
                      Blood Group
                    </label>
                    <select
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#2E2E2E] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs transition-colors"
                    >
                      <option value="">Select Blood Group</option>
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
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#2E2E2E] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs transition-colors"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#2E2E2E] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs transition-colors"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#2E2E2E] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs transition-colors"
                  />
                  <span className="text-[10px] text-slate-400 dark:text-neutral-500 mt-1 block">
                    Automatically included in the Family Emergency Card.
                  </span>
                </div>

                {/* Save Changes Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] dark:bg-[#3ECF8E] dark:hover:bg-[#34b27b] text-white dark:text-[#121212] font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Saving Profile...</span>
                      </>
                    ) : (
                      <>
                        <Save size={15} />
                        <span>Save Profile Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ================= TAB 2: FAMILY VAULT ================= */}
          {activeTab === 'family' && (
            <div className="bg-white dark:bg-[#1C1C1C] rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-6 animate-fadeIn transition-colors">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#262626]">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Home size={20} className="text-[#10B981] dark:text-[#3ECF8E]" />
                    <span>Family Vault Profile & Invite Code</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                    Manage vault name, share invite codes with family, or connect to another vault.
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-700 dark:text-[#3ECF8E] bg-emerald-50 dark:bg-[#3ECF8E]/10 px-3 py-1 rounded-full border border-emerald-200/60 dark:border-[#3ECF8E]/20">
                  Active Vault
                </span>
              </div>

              <div className="space-y-5 text-xs">
                {/* Vault Name */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-100 dark:border-[#262626] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-400 dark:text-neutral-500 font-bold uppercase tracking-wider text-[11px]">
                      Family Vault Name
                    </label>
                    {!isEditingFamilyName && (
                      <button
                        type="button"
                        onClick={() => {
                          setFamilyNameInput(family?.name || '');
                          setIsEditingFamilyName(true);
                          setFamilyNameError('');
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-600 dark:text-[#3ECF8E] hover:bg-emerald-50 dark:hover:bg-[#3ECF8E]/10 transition-colors cursor-pointer"
                      >
                        <Edit3 size={13} />
                        <span>Edit Name</span>
                      </button>
                    )}
                  </div>

                  {isEditingFamilyName ? (
                    <form onSubmit={handleSaveFamilyName} className="space-y-2">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="text"
                          value={familyNameInput}
                          onChange={(e) => setFamilyNameInput(e.target.value)}
                          placeholder="Enter family vault name"
                          disabled={isSavingFamilyName}
                          maxLength={50}
                          autoFocus
                          className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1C1C1C] border border-emerald-500/50 dark:border-[#3ECF8E]/50 focus:border-[#3ECF8E] focus:ring-2 focus:ring-[#3ECF8E]/20 text-slate-900 dark:text-white font-semibold text-sm outline-none transition-all"
                        />
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="submit"
                            disabled={isSavingFamilyName || !familyNameInput.trim()}
                            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-[#3ECF8E]/25 disabled:opacity-50"
                          >
                            {isSavingFamilyName ? (
                              <>
                                <Loader2 size={13} className="animate-spin" />
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <Check size={13} strokeWidth={2.5} />
                                <span>Save</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            disabled={isSavingFamilyName}
                            onClick={() => {
                              setIsEditingFamilyName(false);
                              setFamilyNameInput(family?.name || '');
                              setFamilyNameError('');
                            }}
                            className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-[#262626] text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-[#202020] font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <X size={14} />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                      {familyNameError && (
                        <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                          {familyNameError}
                        </p>
                      )}
                    </form>
                  ) : (
                    <div className="font-bold text-slate-900 dark:text-white text-base">
                      {family?.name || 'Your Family Vault'}
                    </div>
                  )}
                </div>

                {/* Invite Code */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-100 dark:border-[#262626] space-y-3">
                  <label className="block text-slate-400 dark:text-neutral-500 font-bold uppercase tracking-wider text-[11px]">
                    Family Invite Code
                  </label>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <code className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#1C1C1C] font-mono font-bold text-sm text-slate-900 dark:text-neutral-200 tracking-wider border border-slate-200 dark:border-[#262626]">
                      {family?.inviteCode || 'GHAR-VAULT'}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-[#3ECF8E]/10 hover:bg-emerald-100 dark:hover:bg-[#3ECF8E]/20 text-emerald-700 dark:text-[#3ECF8E] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedCode ? 'Copied!' : 'Copy Invite Code'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsJoinModalOpen(true)}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#2E2E2E] bg-white dark:bg-[#1C1C1C] hover:bg-slate-50 dark:hover:bg-[#202020] text-slate-800 dark:text-[#EDEDED] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <KeyRound size={14} className="text-[#10B981] dark:text-[#3ECF8E]" />
                      <span>Join Another Vault</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-neutral-500">
                    Family members can enter this code from their setup screen to join this vault.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: SECURITY & MPIN ================= */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-fadeIn">
              {/* 4-Digit Security MPIN Card */}
              <div className="bg-white dark:bg-[#1C1C1C] rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-5 transition-colors">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#262626]">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Lock size={20} className="text-[#10B981] dark:text-[#3ECF8E]" />
                      <span>4-Digit Security MPIN</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                      Extra protection layer for Property Registries, Wills, Fixed Deposits and Bank papers.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#10B981] dark:text-[#3ECF8E] bg-emerald-50 dark:bg-[#3ECF8E]/10 px-3 py-1 rounded-full border border-emerald-200/60 dark:border-[#3ECF8E]/20">
                    PIN Protection Active
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-100 dark:border-[#262626] space-y-3">
                  <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
                    Default initial PIN is <strong className="text-slate-900 dark:text-white font-mono">1234</strong>. When set, confidential documents cannot be viewed or downloaded without entering this PIN.
                  </p>
                  <form onSubmit={handleUpdateMpin} className="flex flex-wrap items-center gap-3 pt-1">
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="New 4-digit PIN"
                      value={newMpin}
                      onChange={(e) => setNewMpin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="w-40 px-4 py-2.5 rounded-xl bg-white dark:bg-[#1C1C1C] border border-slate-200 dark:border-[#262626] font-mono font-bold text-center tracking-widest text-slate-900 dark:text-white text-sm focus:border-[#3ECF8E] focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isSavingMpin || newMpin.length !== 4}
                      className="px-5 py-2.5 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      {isSavingMpin ? 'Updating...' : 'Set New MPIN'}
                    </button>
                    {mpinSuccess && (
                      <span className="text-xs text-emerald-600 dark:text-[#3ECF8E] font-bold flex items-center gap-1.5">
                        <Check size={14} />
                        {mpinSuccess}
                      </span>
                    )}
                    {mpinError && (
                      <span className="text-xs text-red-600 dark:text-red-400 font-bold">
                        {mpinError}
                      </span>
                    )}
                  </form>
                </div>
              </div>

              {/* Zero Financial Cost Cloud Infrastructure Card */}
              <div className="bg-white dark:bg-[#1C1C1C] rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-4 transition-colors">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Cloud size={18} className="text-[#10B981] dark:text-[#3ECF8E]" />
                  <span>100% Free-Tier Cloud Infrastructure (₹0 Cost)</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Dastavej runs entirely on permanent free tiers with zero AWS S3 or paid hosting overhead.
                </p>

                <div className="space-y-3 text-xs pt-1">
                  {/* Encrypted Document Locker */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-200/80 dark:border-[#262626] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#3ECF8E]/15 text-[#3ECF8E] flex items-center justify-center font-bold text-base">
                        <Shield size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">Encrypted Document Locker</div>
                        <div className="text-[11px] text-slate-500 dark:text-neutral-400">Private 256-Bit Storage • 25MB max file size • Time-limited safe links</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-[#3ECF8E]/20 text-emerald-800 dark:text-[#3ECF8E] font-mono text-[10px] font-bold">
                      ACTIVE
                    </span>
                  </div>

                  {/* Primary Family Database */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-200/80 dark:border-[#262626] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-base">
                        <Database size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">Primary Family Database</div>
                        <div className="text-[11px] text-slate-500 dark:text-neutral-400">Document metadata • Family roster • Secure indexing</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-[#3ECF8E]/20 text-emerald-800 dark:text-[#3ECF8E] font-mono text-[10px] font-bold">
                      CONNECTED
                    </span>
                  </div>

                  {/* Secure Google Sign-In */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-200/80 dark:border-[#262626] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1C1C1C] border border-[#dadce0] dark:border-[#2E2E2E] flex items-center justify-center shadow-xs shrink-0">
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">Secure Google Sign-In</div>
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
          )}

          {/* ================= TAB 4: APPEARANCE ================= */}
          {activeTab === 'appearance' && (
            <div className="bg-white dark:bg-[#1C1C1C] rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-5 animate-fadeIn transition-colors">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#262626]">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sun size={20} className="text-[#10B981] dark:text-[#3ECF8E]" />
                    <span>Appearance & Visual Theme</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                    Choose between pitch-black Obsidian Dark, Stitch Midnight Slate, or Clean Light mode.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-[#10B981] dark:text-[#3ECF8E] bg-emerald-50 dark:bg-[#3ECF8E]/10 px-3 py-1 rounded-full border border-emerald-200 dark:border-[#3ECF8E]/20">
                  {isDark ? (darkStyle === 'obsidian' ? 'Obsidian Dark' : 'Midnight Slate Dark') : 'Clean Light'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                {/* 1. Obsidian Dark (Pure Pitch-Black OLED) */}
                <button
                  type="button"
                  onClick={() => {
                    setTheme('dark');
                    setDarkStyle('obsidian');
                    toast.success('Switched to Obsidian Dark (OLED Black)!');
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    isDark && darkStyle === 'obsidian'
                      ? (isBlue ? 'border-[#2563EB] bg-blue-50/10 dark:bg-[#18181B] ring-2 ring-blue-500/25 shadow-md' : 'border-[#10B981] dark:border-[#3ECF8E] bg-emerald-50/10 dark:bg-[#18181B] ring-2 ring-[#3ECF8E]/25 shadow-md')
                      : 'border-slate-200 dark:border-[#262626] bg-slate-50 dark:bg-[#141414] hover:border-slate-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-[#121212] border border-[#27272A] text-slate-200 flex items-center justify-center shadow-xs">
                      <Moon size={17} strokeWidth={2} />
                    </div>
                    {isDark && darkStyle === 'obsidian' && (
                      <span className={`w-2.5 h-2.5 rounded-full ${isBlue ? 'bg-blue-500 ring-4 ring-blue-500/25' : 'bg-[#10B981] dark:bg-[#3ECF8E] ring-4 ring-[#3ECF8E]/20'}`}></span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Obsidian Dark</div>
                  <div className="text-[10px] font-mono font-semibold text-slate-400 dark:text-neutral-500 mt-0.5">Pitch-Black OLED (#121212)</div>
                  <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                    Pure obsidian canvas with maximum contrast. Perfect for OLED battery life & deep focus.
                  </div>
                </button>

                {/* 2. Midnight Slate Dark (Stitch Banking Navy) */}
                <button
                  type="button"
                  onClick={() => {
                    setTheme('dark');
                    setDarkStyle('midnight');
                    toast.success('Switched to Midnight Slate Dark (Stitch Navy)!');
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    isDark && darkStyle === 'midnight'
                      ? (isBlue ? 'border-[#2563EB] bg-blue-50/10 dark:bg-[#131E36] ring-2 ring-blue-500/25 shadow-md' : 'border-[#10B981] dark:border-[#3ECF8E] bg-emerald-50/10 dark:bg-[#131E36] ring-2 ring-[#3ECF8E]/25 shadow-md')
                      : 'border-slate-200 dark:border-[#262626] bg-slate-50 dark:bg-[#141414] hover:border-slate-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-[#0F172A] border border-[#1E2E4E] text-blue-400 flex items-center justify-center shadow-xs">
                      <Sparkles size={17} strokeWidth={2} />
                    </div>
                    {isDark && darkStyle === 'midnight' && (
                      <span className={`w-2.5 h-2.5 rounded-full ${isBlue ? 'bg-blue-500 ring-4 ring-blue-500/25' : 'bg-[#10B981] dark:bg-[#3ECF8E] ring-4 ring-[#3ECF8E]/20'}`}></span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Midnight Slate</div>
                  <div className="text-[10px] font-mono font-semibold text-blue-600 dark:text-blue-400 mt-0.5">Stitch Banking Navy (#0A0F1D)</div>
                  <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                    Stitch signature midnight navy canvas with rich slate cards & refined depth.
                  </div>
                </button>

                {/* 3. Clean Light */}
                <button
                  type="button"
                  onClick={() => {
                    setTheme('light');
                    toast.success('Switched to Clean Light Mode!');
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    !isDark
                      ? (isBlue ? 'border-[#2563EB] bg-white ring-2 ring-blue-500/20 shadow-md' : 'border-[#10B981] bg-white ring-2 ring-emerald-500/20 shadow-md')
                      : 'border-slate-200 dark:border-[#262626] bg-slate-50 dark:bg-[#141414] hover:border-slate-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shadow-xs">
                      <Sun size={17} strokeWidth={2} />
                    </div>
                    {!isDark && (
                      <span className={`w-2.5 h-2.5 rounded-full ${isBlue ? 'bg-blue-600 ring-4 ring-blue-500/20' : 'bg-[#10B981] ring-4 ring-[#10B981]/20'}`}></span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Clean Light</div>
                  <div className="text-[10px] font-mono font-semibold text-amber-600 mt-0.5">Daylight Crisp (#F8FAFC)</div>
                  <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                    Soft off-white background with high-contrast buttons and readable typography.
                  </div>
                </button>
              </div>

              {/* Theme Palette / Accent Color Selection */}
              <div className="pt-4 border-t border-slate-100 dark:border-[#262626] space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-[#10B981] dark:text-[#3ECF8E]" />
                    <span>Brand Theme & Accent Color</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                    Choose between Dastavej's Emerald Green or Royal Blue theme.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Theme 1: Emerald Green */}
                  <button
                    type="button"
                    onClick={() => {
                      setAccentColor('emerald');
                      toast.success('Switched to Emerald Green Theme!');
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      accentColor === 'emerald'
                        ? 'border-[#10B981] bg-emerald-50/50 dark:bg-[#141414] ring-2 ring-emerald-500/30 shadow-md'
                        : 'border-slate-200 dark:border-[#262626] bg-slate-50 dark:bg-[#141414] hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-6 h-6 rounded-full swatch-emerald ring-2 ring-emerald-500/30 shadow-xs flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                        >
                          {accentColor === 'emerald' ? '✓' : ''}
                        </span>
                        <span className="font-bold text-xs text-slate-900 dark:text-white">Emerald Green</span>
                      </div>
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full border swatch-emerald-badge font-bold"
                      >
                        Dastavej Classic
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
                      Sleek Supabase-inspired modern green styling with dark obsidian or clean light backdrop.
                    </p>
                  </button>

                  {/* Theme 2: Stitch Royal Blue */}
                  <button
                    type="button"
                    onClick={() => {
                      setAccentColor('blue');
                      toast.success('Switched to Stitch Royal Blue Theme!');
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      accentColor === 'blue'
                        ? 'border-[#2563EB] bg-blue-50/50 dark:bg-[#141414] ring-2 ring-blue-500/30 shadow-md'
                        : 'border-slate-200 dark:border-[#262626] bg-slate-50 dark:bg-[#141414] hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-6 h-6 rounded-full swatch-blue ring-2 ring-blue-500/30 shadow-xs flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                        >
                          {accentColor === 'blue' ? '✓' : ''}
                        </span>
                        <span className="font-bold text-xs text-slate-900 dark:text-white">Royal Blue</span>
                      </div>
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full border swatch-blue-badge font-bold"
                      >
                        Stitch Vault
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
                      Authoritative, banking-grade royal blue theme inspired by Stitch, DigiLocker & Family Office portals.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 5: BACKUP & DATA ================= */}
          {activeTab === 'backup' && (
            <div className="bg-white dark:bg-[#1C1C1C] rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-6 animate-fadeIn transition-colors">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#262626]">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Database size={20} className="text-[#10B981] dark:text-[#3ECF8E]" />
                    <span>Data Sovereignty & Vault Backup</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                    Download an offline copy of all your family's records and metadata in standard JSON format.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-100 dark:border-[#262626] space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-[#10B981] dark:text-[#3ECF8E] flex items-center justify-center shrink-0">
                    <Download size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Complete Vault Export</h3>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                      Exports all documents metadata, member tagged relations, cryptographic activity manifests, and family records. Keep this file in cold storage or a pen drive for disaster recovery.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  disabled={downloadingBackup}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm shadow-[#3ECF8E]/25 disabled:opacity-50"
                >
                  <Download size={15} />
                  <span>{downloadingBackup ? 'Generating Backup...' : 'Download Vault Backup (JSON)'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= TAB 6: MOBILE APP ================= */}
          {activeTab === 'app' && (
            <div className="bg-white dark:bg-[#1C1C1C] rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-6 animate-fadeIn transition-colors">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#262626]">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Smartphone size={20} className="text-[#10B981] dark:text-[#3ECF8E]" />
                    <span>Install App on Your Phone</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                    Get 1-tap fast access to your family documents, health cards, and emergency info right from your phone's home screen.
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-700 dark:text-[#3ECF8E] bg-emerald-50 dark:bg-[#3ECF8E]/10 px-3 py-1 rounded-full border border-emerald-200/60 dark:border-[#3ECF8E]/20">
                  {isStandalone ? 'Installed' : 'PWA Ready'}
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-100 dark:border-[#262626] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{isIOS ? 'Apple iPhone (Safari)' : isAndroid ? 'Android Device (Chrome)' : 'Desktop / Laptop Browser'}</span>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-[#3ECF8E]/15 text-emerald-800 dark:text-[#3ECF8E] font-medium">
                        {isStandalone ? 'Running as Installed App' : 'Browser Mode'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                      {isStandalone
                        ? 'Dastavej is currently running as an installed standalone PWA app on this device.'
                        : 'Tap below to trigger instant installation or follow simple steps to add Dastavej to your home screen.'}
                    </p>
                  </div>

                  {!isStandalone && (
                    <button
                      type="button"
                      onClick={triggerNativeInstall}
                      className="px-5 py-2.5 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-[#3ECF8E]/25 transition-all shrink-0 active:scale-95"
                    >
                      <Download size={15} />
                      <span>Install on This Phone</span>
                    </button>
                  )}
                </div>

                {/* iPhone / Android helpful instructions if in browser */}
                {!isStandalone && isIOS && (
                  <div className="p-4 rounded-xl bg-white dark:bg-[#1C1C1C] border border-slate-200 dark:border-[#262626] text-xs text-slate-600 dark:text-neutral-300 space-y-1">
                    <p className="font-bold text-slate-900 dark:text-white">iPhone Safari Install Guide:</p>
                    <p>1. Tap the <strong>Share</strong> button (box with an up arrow) at the bottom of Safari.</p>
                    <p>2. Scroll down and tap <strong>Add to Home Screen</strong>.</p>
                    <p>3. Tap <strong>Add</strong> in the top right corner.</p>
                  </div>
                )}
              </div>

              {/* Family Phone Push Notifications & Broadcast Card */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-100 dark:border-[#262626] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Bell size={16} className="text-[#10B981] dark:text-[#3ECF8E]" />
                      <span>Family Phone Push Notifications</span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${
                        isPushSubscribed
                          ? 'bg-emerald-100 dark:bg-[#3ECF8E]/15 text-emerald-800 dark:text-[#3ECF8E]'
                          : 'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300'
                      }`}>
                        {isPushSubscribed ? 'Active on This Device' : 'Not Enabled on This Device'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed max-w-xl">
                      Jab bhi koi parivaar ka member naya document upload ya update karega, system background me sabhi family phones par automatic pop-up notification bhej deta hai.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {!isPushSubscribed ? (
                      <button
                        type="button"
                        onClick={requestPushPermission}
                        disabled={pushLoading}
                        className="px-4 py-2 rounded-xl bg-[#10B981] hover:bg-emerald-600 dark:bg-[#3ECF8E] dark:hover:bg-[#34B27B] text-white dark:text-[#121212] font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <Bell size={14} />
                        <span>{pushLoading ? 'Connecting...' : 'Allow Notifications'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={testLocalNotification}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#2E2E2E] bg-white dark:bg-[#1C1C1C] hover:bg-slate-100 dark:hover:bg-[#262626] text-xs font-bold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        title="Test vibration and notification display on this screen"
                      >
                        <Sparkles size={13} className="text-[#10B981] dark:text-[#3ECF8E]" />
                        <span>Test Phone Buzz 🔔</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsPushModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <Send size={13} />
                      <span>Send Family Push Alert</span>
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-[#1C1C1C] border border-slate-200 dark:border-[#262626] text-xs text-slate-600 dark:text-neutral-400 flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-600 dark:text-[#3ECF8E] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    ✓
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    <strong>Auto-Sync Active:</strong> Documents upload hone par notification automatic jata hai. Agar aapko parivaar ko koi zaroori notice ya announcement bhejna ho (jaise <em>"Update aa gaye hain check kar"</em>), toh aap <strong>Send Family Push Alert</strong> button use kar sakte hain.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <JoinFamilyModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onJoined={() => window.location.reload()}
      />

      {/* Send Push Notification Modal */}
      <SendPushModal
        isOpen={isPushModalOpen}
        onClose={() => setIsPushModalOpen(false)}
        members={members}
      />
    </div>
  );
}
