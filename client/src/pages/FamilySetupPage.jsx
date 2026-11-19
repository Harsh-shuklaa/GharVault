import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Home, UserPlus, CheckCircle2, AlertCircle, Check, Sparkles } from 'lucide-react';
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
        if (res.token) {
          localStorage.setItem('gharvault_token', res.token);
        }
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
        if (res.token) {
          localStorage.setItem('gharvault_token', res.token);
        }
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
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#121212] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center relative overflow-hidden transition-colors">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl mx-auto w-full relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 dark:bg-[#3ECF8E] text-white dark:text-black flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Shield className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="font-headline font-bold text-2xl text-slate-900 dark:text-white tracking-tight">
              GharVault
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Create or Join Your Family Vault
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-neutral-400">
            One safe space to store all your family's vital documents and medical emergency info.
          </p>
        </div>

        <div className="bg-white dark:bg-[#1C1C1C] rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-200 dark:border-[#262626] overflow-hidden">
          {/* Simple 2-Option Switcher */}
          <div className="grid grid-cols-2 border-b border-slate-200 dark:border-[#262626] bg-slate-50/70 dark:bg-[#171717] p-1.5">
            <button
              onClick={() => {
                setMode('create');
                setError('');
              }}
              className={`py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'create'
                  ? 'bg-white dark:bg-[#262626] text-emerald-600 dark:text-[#3ECF8E] shadow-sm'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Create New Vault</span>
            </button>
            <button
              onClick={() => {
                setMode('join');
                setError('');
              }}
              className={`py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'join'
                  ? 'bg-white dark:bg-[#262626] text-emerald-600 dark:text-[#3ECF8E] shadow-sm'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Enter Invite Code</span>
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-[#3ECF8E] text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {mode === 'create' ? (
              <form onSubmit={handleCreate} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                    Family Vault Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-[#262626] bg-white dark:bg-[#171717] focus:border-emerald-600 dark:focus:border-[#3ECF8E] focus:ring-2 focus:ring-emerald-500/20 text-sm font-semibold text-slate-900 dark:text-white"
                    placeholder="e.g. The Sharma Family, Verma Household"
                  />
                  <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-1.5">
                    This will be the title displayed on your private family dashboard.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/30 text-xs text-emerald-900 dark:text-emerald-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-[#3ECF8E]" />
                    <span>100% Free Forever</span>
                  </div>
                  <p className="text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed text-[11px]">
                    Includes unlimited family members, 256-bit private encrypted family locker storage, and instant one-click sharing.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 dark:bg-[#3ECF8E] dark:hover:bg-[#34b27b] disabled:opacity-50 text-white dark:text-black font-bold text-sm shadow-md shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{loading ? 'Creating Family Vault...' : 'Create Family Vault & Continue'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                    Family Invite Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.inviteCode}
                    onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-[#262626] bg-white dark:bg-[#171717] focus:border-emerald-600 dark:focus:border-[#3ECF8E] text-sm font-mono font-bold tracking-widest text-slate-900 dark:text-white uppercase"
                    placeholder="e.g. GHAR-9428"
                  />
                  <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-1">
                    Ask your family administrator for their 6 or 8-character invite code.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.memberName}
                      onChange={(e) => setFormData({ ...formData, memberName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#262626] bg-white dark:bg-[#171717] focus:border-emerald-600 dark:focus:border-[#3ECF8E] text-xs font-semibold text-slate-900 dark:text-white"
                      placeholder="e.g. Priya, Mom, Dad"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                      Relationship *
                    </label>
                    <select
                      value={formData.relationship}
                      onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#262626] bg-white dark:bg-[#171717] focus:border-emerald-600 dark:focus:border-[#3ECF8E] text-xs font-semibold text-slate-900 dark:text-white"
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                    Your Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={formData.memberEmail}
                    onChange={(e) => setFormData({ ...formData, memberEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#262626] bg-white dark:bg-[#171717] focus:border-emerald-600 dark:focus:border-[#3ECF8E] text-xs font-semibold text-slate-900 dark:text-white"
                    placeholder="your.email@gmail.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 dark:bg-[#3ECF8E] dark:hover:bg-[#34b27b] disabled:opacity-50 text-white dark:text-black font-bold text-sm shadow-md shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{loading ? 'Joining Family Vault...' : 'Join Family Vault'}</span>
                </button>
              </form>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#262626] text-center text-xs text-slate-500 dark:text-neutral-400">
              Already have an account?{' '}
              <Link to="/auth/login" className="font-bold text-emerald-600 dark:text-[#3ECF8E] hover:underline">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
