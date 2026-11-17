import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function SettingsPage() {
  const { user, family, refreshSession } = useAuth();
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
    <div className="max-w-[1380px] mx-auto p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your family vault, invite members, view emergency contacts, and export backup.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Family Vault & Free-Tier Infrastructure (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Family Workspace Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-xl">home</span>
                <span>Family Vault Profile</span>
              </h2>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                Active Vault
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Family Vault Name
                </label>
                <div className="font-bold text-slate-900 text-base">{family?.name || 'Your Family Vault'}</div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Family Invite Code (Share with family members)
                </label>
                <div className="flex items-center gap-3">
                  <code className="px-4 py-2 rounded-xl bg-slate-100 font-mono font-bold text-sm text-slate-900 tracking-wider border border-slate-200">
                    {family?.inviteCode || 'GHAR-VAULT'}
                  </code>
                  <button
                    onClick={handleCopyCode}
                    className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {copiedCode ? 'check' : 'content_copy'}
                    </span>
                    <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Family members can use this code to join your vault from the setup screen.
                </p>
              </div>
            </div>
          </div>

          {/* Zero Financial Cost (₹0 Setup) Infrastructure Status */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-xl">cloud_done</span>
              <span>100% Free-Tier Architecture (₹0 Setup)</span>
            </h2>
            <p className="text-xs text-slate-500">
              GharVault is built to run entirely on permanent free tiers with zero AWS S3 or paid hosting costs.
            </p>

            <div className="space-y-3 text-xs">
              {/* Supabase Storage */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-base">
                    S
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Supabase Storage (Free Tier)</div>
                    <div className="text-[11px] text-slate-500">Private Buckets • 25MB max file size • Expiring signed links</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
                  ACTIVE
                </span>
              </div>

              {/* MongoDB Atlas */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base">
                    M
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">MongoDB Atlas (M0 Free Cluster)</div>
                    <div className="text-[11px] text-slate-500">Document metadata • Family roster • Secure indexing</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
                  CONNECTED
                </span>
              </div>

              {/* Supabase Auth */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-base">
                    G
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Google OAuth via Supabase Auth</div>
                    <div className="text-[11px] text-slate-500">Frictionless 1-click login • Zero passwords to remember</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
                  ACTIVE
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: User Profile & Backup Export (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* User Profile */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Your Profile</h2>
            <div className="flex items-center gap-3.5">
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'User')}`}
                alt={user?.name}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-200"
              />
              <div>
                <div className="font-bold text-slate-900 text-base">{user?.name}</div>
                <div className="text-xs text-slate-500">{user?.relationship} • {user?.role === 'ADMIN' ? 'Family Admin' : 'Family Member'}</div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">{user?.email}</div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Blood Group:</span>
                <span className="font-bold text-red-700">{user?.bloodGroup || 'Not specified'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Emergency Phone:</span>
                <span className="font-semibold text-slate-800">{user?.emergencyContactPhone || user?.phone || 'Not set'}</span>
              </div>
              {user?.healthInsurancePolicy && (
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Health Insurance:</span>
                  <span className="font-semibold text-slate-800">{user.healthInsurancePolicy}</span>
                </div>
              )}
            </div>
          </div>

          {/* Backup Export */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-xl">file_download</span>
              <span>Export Vault Data</span>
            </h2>
            <p className="text-xs text-slate-500">
              Download a complete JSON record of all documents, metadata, and timestamps stored in your family vault.
            </p>
            <button
              onClick={handleDownloadBackup}
              disabled={downloadingBackup}
              className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">download</span>
              <span>{downloadingBackup ? 'Exporting...' : 'Download Vault Backup (JSON)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
