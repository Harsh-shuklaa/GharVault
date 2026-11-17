import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function SettingsPage() {
  const { user, family, refreshSession } = useAuth();
  const [copiedCode, setCopiedCode] = useState(false);
  const [downloadingBackup, setDownloadingBackup] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(family?.inviteCode || 'GHAR-9428');
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="max-w-[1380px] mx-auto p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Account & Vault Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Workspace governance, zero-cost cloud infrastructure status, and disaster recovery exports.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Workspace & Infrastructure (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Family Workspace Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>Family Workspace Profile</span>
              <span className="font-mono text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-bold">
                Active Repository
              </span>
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">
                  Workspace Name
                </label>
                <div className="font-bold text-slate-900 text-sm">{family?.name || 'Sharma Family Ghar'}</div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">
                  Invite Code (For Family Members)
                </label>
                <div className="flex items-center gap-2">
                  <code className="px-3 py-1.5 rounded-xl bg-slate-100 font-mono font-bold text-sm text-slate-900 tracking-wider">
                    {family?.inviteCode || 'GHAR-9428'}
                  </code>
                  <button
                    onClick={handleCopyCode}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                    <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-slate-500 block">Dual-Key Quorum Policy:</span>
                  <strong className="text-slate-900">2 of 2 Guardians Required</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Break-Glass Protocol Delay:</span>
                  <strong className="text-slate-900">48-Hour Emergency Timer</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Zero-Cost Cloud Infrastructure Status */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-lg">cloud_done</span>
              <span>100% Free-Tier Architecture Status</span>
            </h2>

            <div className="space-y-3 text-xs">
              {/* Supabase Storage */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    S
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Supabase Storage (Free Tier)</div>
                    <div className="text-[11px] text-slate-500">Private Buckets • Time-Limited Signed URLs</div>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
                  ACTIVE
                </span>
              </div>

              {/* MongoDB Atlas */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    M
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">MongoDB Atlas (M0 Cluster)</div>
                    <div className="text-[11px] text-slate-500">Mongoose Schemas • Strict Indexing</div>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
                  CONNECTED
                </span>
              </div>

              {/* Storage Capacity Bar */}
              <div className="pt-2 space-y-1.5">
                <div className="flex justify-between text-xs text-slate-600 font-medium">
                  <span>Vault Storage Allocated:</span>
                  <span className="font-mono">3.4 GB of 50.0 GB (6.8% Used)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: '6.8%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: User Profile & Cold Storage (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Custodian Profile */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Custodian Profile</h2>
            <div className="flex items-center gap-3.5">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                alt={user?.name}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-200"
              />
              <div>
                <div className="font-bold text-slate-900 text-base">{user?.name}</div>
                <div className="text-xs text-slate-500">{user?.relationship} • {user?.role}</div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">{user?.email}</div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Multi-Factor Authentication:</span>
                <span className="font-bold text-emerald-700">Google OAuth / MPIN</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Emergency Contact Nominee:</span>
                <span className="font-bold text-red-700">Active</span>
              </div>
            </div>
          </div>

          {/* Cold Backup Export */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-blue-600">
              <span className="material-symbols-outlined text-2xl">archive</span>
              <h2 className="text-base font-bold text-slate-900">Disaster Recovery Cold Backup</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Export an offline ZIP archive containing all encrypted documents, cryptographic SHA-256 manifests, and legal instructions under the Indian Succession Act 1925.
            </p>
            <a
              href="/api/export/backup"
              download
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">download</span>
              <span>Download Encrypted ZIP Cold Backup</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
