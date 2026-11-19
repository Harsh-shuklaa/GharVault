import React, { useState, useEffect } from 'react';
import { KeyRound, CheckCircle2, AlertCircle, X, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function JoinFamilyModal({ isOpen, onClose, onJoined }) {
  const { user, refreshSession } = useAuth();
  const { toast } = useToast();
  const [inviteCode, setInviteCode] = useState('');
  const [relationship, setRelationship] = useState('Member');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

      const familyName = res.family?.name || 'Family Vault';
      toast.success(`Successfully joined "${familyName}"!`);
      await refreshSession();

      if (onJoined) {
        onJoined(res.family);
      }

      onClose();
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message || 'Failed to join family vault. Please check the code.');
      toast.error(err.message || 'Failed to join family vault');
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
        className="fixed inset-x-0 bottom-0 md:static md:inset-auto w-full max-w-md bg-white dark:bg-[#18181B] border-t md:border border-slate-200 dark:border-[#27272A] rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col max-h-[88vh] md:max-h-[85vh] overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle Pill */}
        <div className="md:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-neutral-600" />
        </div>

        {/* Fixed Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-[#27272A] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#3ECF8E]/10 border border-emerald-100 dark:border-[#3ECF8E]/20 text-[#10B981] dark:text-[#3ECF8E] flex items-center justify-center shrink-0">
              <KeyRound size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Join Family Vault
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Enter your invite code (e.g. <span className="font-mono text-[#10B981] dark:text-[#3ECF8E]">GHAR-XXXX</span>)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-[#27272A] text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <form id="join-family-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

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
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] bg-white dark:bg-[#141414] text-slate-900 dark:text-white font-mono text-sm tracking-widest uppercase focus:border-[#10B981] dark:focus:border-[#3ECF8E] focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                Your Relationship
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] bg-white dark:bg-[#141414] text-xs font-semibold text-slate-900 dark:text-white focus:border-[#10B981] dark:focus:border-[#3ECF8E] focus:outline-none cursor-pointer"
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
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] bg-white dark:bg-[#141414] text-xs font-semibold text-slate-900 dark:text-white focus:border-[#10B981] dark:focus:border-[#3ECF8E] focus:outline-none cursor-pointer"
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] bg-white dark:bg-[#141414] text-xs font-semibold text-slate-900 dark:text-white font-mono focus:border-[#10B981] dark:focus:border-[#3ECF8E] focus:outline-none transition-colors"
            />
          </div>
        </form>

        {/* Fixed Footer */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50 dark:bg-[#141414] border-t border-slate-100 dark:border-[#27272A] flex flex-col-reverse sm:flex-row items-center sm:justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#27272A] font-bold text-xs transition-colors cursor-pointer text-center"
          >
            Cancel
          </button>
          <button
            form="join-family-form"
            type="submit"
            disabled={loading || !inviteCode.trim()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] font-bold text-xs shadow-md shadow-[#3ECF8E]/20 disabled:opacity-50 transition-all cursor-pointer text-center"
          >
            <span>{loading ? 'Joining Vault...' : 'Join Family Vault'}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
