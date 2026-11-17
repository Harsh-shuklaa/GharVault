import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';
import { Sun, Moon, Copy, Check, Download, Home, Cloud, User, ShieldCheck } from 'lucide-react';

export default function SettingsPage() {
  const { user, family } = useAuth();
  const { theme, isDark, setTheme } = useTheme();
  const [copiedCode, setCopiedCode] = useState(false);
  const [downloadingBackup, setDownloadingBackup] = useState(false);

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
    <div className="max-w-[1380px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Settings</h1>
        <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
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
          {/* User Profile */}
          <div className="bg-white dark:bg-[#1C1C1C] rounded-3xl p-6 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-4 transition-colors">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User size={18} className="text-[#10B981] dark:text-[#3ECF8E]" />
              <span>Your Profile</span>
            </h2>
            <div className="flex items-center gap-3.5">
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=3ECF8E&color=121212`}
                alt={user?.name}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-200 dark:ring-[#262626]"
              />
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-base">{user?.name}</div>
                <div className="text-xs text-slate-500 dark:text-neutral-400">{user?.relationship} • {user?.role === 'ADMIN' ? 'Family Admin' : 'Family Member'}</div>
                <div className="text-xs text-slate-400 dark:text-neutral-500 font-mono mt-0.5">{user?.email}</div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-[#262626] space-y-2 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-slate-500 dark:text-neutral-400">Blood Group:</span>
                <span className="font-bold text-red-600 dark:text-red-400">{user?.bloodGroup || 'Not specified'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 dark:text-neutral-400">Emergency Phone:</span>
                <span className="font-semibold text-slate-800 dark:text-neutral-200">{user?.emergencyContactPhone || user?.phone || 'Not set'}</span>
              </div>
              {user?.healthInsurancePolicy && (
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 dark:text-neutral-400">Health Insurance:</span>
                  <span className="font-semibold text-slate-800 dark:text-neutral-200">{user.healthInsurancePolicy}</span>
                </div>
              )}
            </div>
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
