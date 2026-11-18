import React, { useState } from 'react';
import { Shield, KeyRound, CheckCircle2, AlertCircle, X, Users, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function JoinFamilyModal({ isOpen, onClose, onJoined }) {
  const { user, refreshSession } = useAuth();
  const [inviteCode, setInviteCode] = useState('');
  const [relationship, setRelationship] = useState('Member');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanCode = inviteCode.trim().toUpperCase();
    if (!cleanCode) {
      setError('Please enter a valid family invite code (e.g. GHAR-4892)');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const res = await api.joinFamily({
        inviteCode: cleanCode,
        relationship,
        phone,
        bloodGroup,
        email: user?.email,
        name: user?.name,
      });

      if (res.error) {
        throw new Error(res.error);
      }

      if (res.token) {
        localStorage.setItem('gharvault_token', res.token);
      }

      setSuccess(`Joined "${res.family?.name || 'Family Vault'}" successfully!`);
      await refreshSession();

      if (onJoined) {
        onJoined(res.family);
      }

      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to join family vault. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-[#1C1C1C] rounded-2xl border border-slate-200 dark:border-[#2E2E2E] shadow-2xl p-6 sm:p-7 space-y-5 text-slate-900 dark:text-[#EDEDED] relative transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#262626] transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-[#10B981] dark:text-[#3ECF8E] flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Join Existing Family Vault
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Enter your family invite code (e.g. <span className="font-mono text-[#10B981] dark:text-[#3ECF8E]">GHAR-XXXX</span>)
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-[#3ECF8E] text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
              Family Invite Code *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. GHAR-4892"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#2E2E2E] bg-white dark:bg-[#141414] text-slate-900 dark:text-white font-mono text-sm tracking-widest uppercase focus:border-[#10B981] dark:focus:border-[#3ECF8E] focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                Your Relationship
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#2E2E2E] bg-white dark:bg-[#141414] text-xs font-semibold text-slate-900 dark:text-white focus:border-[#10B981] dark:focus:border-[#3ECF8E] focus:outline-none cursor-pointer"
              >
                <option value="Self">Self</option>
                <option value="Spouse">Spouse</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Son">Son</option>
                <option value="Daughter">Daughter</option>
                <option value="Brother">Brother</option>
                <option value="Sister">Sister</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                Blood Group (Optional)
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#2E2E2E] bg-white dark:bg-[#141414] text-xs font-semibold text-slate-900 dark:text-white focus:border-[#10B981] dark:focus:border-[#3ECF8E] focus:outline-none cursor-pointer"
              >
                <option value="">Not Specified</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
              Contact Phone (Optional)
            </label>
            <input
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#2E2E2E] bg-white dark:bg-[#141414] text-xs font-semibold text-slate-900 dark:text-white focus:border-[#10B981] dark:focus:border-[#3ECF8E] focus:outline-none transition-colors"
            />
          </div>

          <div className="pt-2 flex flex-col-reverse sm:flex-row items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#2E2E2E] text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-[#262626] text-xs font-bold transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !inviteCode.trim()}
              className="w-full sm:w-auto flex-1 px-4 py-2.5 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] font-bold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Joining Vault...' : 'Join Family Vault'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
