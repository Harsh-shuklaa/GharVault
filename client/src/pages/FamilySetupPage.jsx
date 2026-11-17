import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function FamilySetupPage() {
  const { refreshSession } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('create'); // 'create' or 'join'
  const [formData, setFormData] = useState({
    name: '',
    inviteCode: '',
    memberName: '',
    memberEmail: '',
    relationship: 'Self',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Please enter a name for your family vault');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await api.setupFamily({
        name: formData.name.trim(),
      });

      if (res.success) {
        setSuccessMsg(`Family Vault "${res.family.name}" created! Your invite code: ${res.family.inviteCode}`);
        await refreshSession();
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch (err) {
      setError(err.message || 'Failed to setup family vault');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!formData.inviteCode.trim()) {
      setError('Please enter the 6-character family invite code');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await api.joinFamily({
        inviteCode: formData.inviteCode.trim().toUpperCase(),
        name: formData.memberName.trim(),
        email: formData.memberEmail.trim(),
        relationship: formData.relationship,
      });

      if (res.success) {
        setSuccessMsg(`Joined "${res.family.name}" as ${res.member.relationship}!`);
        await refreshSession();
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch (err) {
      setError(err.message || 'Failed to join family vault. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-xl mx-auto w-full relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
              <span className="material-symbols-outlined text-2xl">shield</span>
            </div>
            <span className="font-headline font-bold text-2xl text-slate-900 tracking-tight">GharVault</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Create or Join Your Family Vault
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            One safe space to store all your family's vital documents and medical emergency info.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
          {/* Simple 2-Option Switcher */}
          <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50/70 p-1.5">
            <button
              onClick={() => { setMode('create'); setError(''); }}
              className={`py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'create'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-lg">add_home</span>
              <span>Create New Vault</span>
            </button>
            <button
              onClick={() => { setMode('join'); setError(''); }}
              className={`py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'join'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-lg">group_add</span>
              <span>Enter Invite Code</span>
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>{successMsg}</span>
              </div>
            )}

            {mode === 'create' ? (
              <form onSubmit={handleCreate} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Family Vault Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm font-semibold text-slate-900"
                    placeholder="e.g. The Sharma Family, Verma Household"
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    This will be the title displayed on your private family dashboard.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/60 text-xs text-blue-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-blue-600">verified_user</span>
                    <span>100% Free Forever</span>
                  </div>
                  <p className="text-blue-800/80 leading-relaxed text-[11px]">
                    Includes unlimited family members, 50GB storage via Supabase private buckets, and instant one-click sharing.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">check</span>
                  <span>{loading ? 'Creating Family Vault...' : 'Create Family Vault & Continue'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Family Invite Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.inviteCode}
                    onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-600 text-sm font-mono font-bold tracking-widest text-slate-900 uppercase"
                    placeholder="e.g. GHAR-9428"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Ask your family administrator for their 6 or 8-character invite code.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.memberName}
                      onChange={(e) => setFormData({ ...formData, memberName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 text-xs font-semibold text-slate-900"
                      placeholder="e.g. Priya, Mom, Dad"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Relationship *
                    </label>
                    <select
                      value={formData.relationship}
                      onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 text-xs font-semibold text-slate-900 bg-white"
                    >
                      <option value="Self">Self</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Mother">Mother</option>
                      <option value="Father">Father</option>
                      <option value="Son">Son</option>
                      <option value="Daughter">Daughter</option>
                      <option value="Brother">Brother</option>
                      <option value="Sister">Sister</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Your Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={formData.memberEmail}
                    onChange={(e) => setFormData({ ...formData, memberEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 text-xs font-semibold text-slate-900"
                    placeholder="your.email@gmail.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  <span className="material-symbols-outlined text-lg">group_add</span>
                  <span>{loading ? 'Joining Family Vault...' : 'Join Family Vault'}</span>
                </button>
              </form>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/auth/login" className="font-bold text-blue-600 hover:underline">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
