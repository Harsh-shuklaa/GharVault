import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function FamilySetupPage() {
  const { refreshSession } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('create'); // 'create' or 'join'
  const [formData, setFormData] = useState({
    name: 'Sharma Family Ghar',
    quorumThreshold: 2,
    breakGlassHours: 48,
    inviteCode: 'GHAR-9428',
    memberName: 'Priya Sharma',
    memberEmail: 'priya.sharma@gmail.com',
    relationship: 'Spouse',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const res = await api.setupFamily({
        name: formData.name,
        quorumThreshold: parseInt(formData.quorumThreshold),
        breakGlassHours: parseInt(formData.breakGlassHours),
      });

      if (res.success) {
        setSuccessMsg(`Family Vault "${res.family.name}" created! Invite code: ${res.family.inviteCode}`);
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
    try {
      setLoading(true);
      setError('');
      const res = await api.joinFamily({
        inviteCode: formData.inviteCode,
        name: formData.memberName,
        email: formData.memberEmail,
        relationship: formData.relationship,
      });

      if (res.success) {
        setSuccessMsg(`Joined ${res.family.name} as ${res.member.relationship}!`);
        await refreshSession();
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch (err) {
      setError(err.message || 'Failed to join family workspace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-xl mx-auto w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-2xl">shield</span>
            </div>
            <span className="font-headline font-bold text-2xl text-slate-900">GharVault</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900">Family Workspace Configuration</h1>
          <p className="mt-2 text-sm text-slate-600">
            Establish multi-signature governance or join your existing family trust.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50/70 p-1.5">
            <button
              onClick={() => { setMode('create'); setError(''); }}
              className={`py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
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
              className={`py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                mode === 'join'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-lg">group_add</span>
              <span>Join via Invite Code</span>
            </button>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">error</span>
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">check_circle</span>
                <span>{successMsg}</span>
              </div>
            )}

            {mode === 'create' ? (
              <form onSubmit={handleCreate} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Family Workspace Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm font-medium text-slate-900"
                    placeholder="e.g. Sharma Family Ghar"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    This represents your unified family storage repository.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Dual-Key Quorum Rule
                    </label>
                    <select
                      value={formData.quorumThreshold}
                      onChange={(e) => setFormData({ ...formData, quorumThreshold: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm font-medium text-slate-900 bg-white"
                    >
                      <option value={2}>2 of 2 Guardians Required</option>
                      <option value={3}>2 of 3 Guardians Required</option>
                      <option value={1}>Single Guardian (Standard)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Emergency Break-Glass Window
                    </label>
                    <select
                      value={formData.breakGlassHours}
                      onChange={(e) => setFormData({ ...formData, breakGlassHours: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm font-medium text-slate-900 bg-white"
                    >
                      <option value={48}>48 Hours (Standard Protection)</option>
                      <option value={24}>24 Hours (Fast Escalation)</option>
                      <option value={72}>72 Hours (Extended Notice)</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900 flex items-start gap-3">
                  <span className="material-symbols-outlined text-blue-600 text-lg mt-0.5">verified_user</span>
                  <div>
                    <span className="font-bold">Zero Cloud Cost Allocation:</span> Your workspace is provisioned on Supabase Storage Free Tier (Private Buckets) & MongoDB Atlas M0 cluster. Free 50GB allocated.
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">shield</span>
                  <span>{loading ? 'Initializing Vault...' : 'Create Family Vault'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleJoin} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    8-Character Family Invite Code
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.inviteCode}
                    onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 font-mono text-center tracking-widest text-lg font-bold text-slate-900 uppercase focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    placeholder="GHAR-XXXX"
                  />
                  <p className="mt-1 text-xs text-slate-500 text-center">
                    Demo invite code: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-bold text-blue-600">GHAR-9428</code>
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.memberName}
                      onChange={(e) => setFormData({ ...formData, memberName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium text-slate-900"
                      placeholder="e.g. Priya Sharma"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Family Relationship
                    </label>
                    <select
                      value={formData.relationship}
                      onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 bg-white"
                    >
                      <option value="Spouse">Spouse / Guardian</option>
                      <option value="Son">Son</option>
                      <option value="Daughter">Daughter</option>
                      <option value="Mother">Mother</option>
                      <option value="Father">Father</option>
                      <option value="Legal Nominee">Legal Nominee / Executor</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.memberEmail}
                    onChange={(e) => setFormData({ ...formData, memberEmail: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium text-slate-900"
                    placeholder="e.g. priya.sharma@gmail.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">check</span>
                  <span>{loading ? 'Joining Vault...' : 'Join Family Workspace'}</span>
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/dashboard" className="text-xs font-semibold text-slate-500 hover:text-blue-600">
            ← Back to Dashboard Demo
          </Link>
        </div>
      </div>
    </div>
  );
}
