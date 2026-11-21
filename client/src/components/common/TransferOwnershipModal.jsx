import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Crown,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  ArrowRight
} from 'lucide-react';
import { api } from '../../lib/api';

export default function TransferOwnershipModal({ isOpen, onClose, members = [], currentUserId, onTransferred }) {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Eligible members: Everyone in the family except current user / current admin
  const eligibleMembers = members.filter(
    (m) => (m._id || m.id)?.toString() !== currentUserId?.toString()
  );

  const selectedMember = eligibleMembers.find(
    (m) => (m._id || m.id)?.toString() === selectedMemberId?.toString()
  );

  const handleTransfer = async () => {
    if (!selectedMemberId) {
      setError('Please select an eligible family member to transfer ownership to.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await api.transferOwnership(selectedMemberId);
      if (onTransferred) {
        onTransferred(res);
      }
      onClose();
    } catch (err) {
      console.error('Transfer ownership failed:', err);
      setError(err.message || 'Failed to transfer ownership. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-[#1C1C1C] border-t sm:border border-slate-200 dark:border-[#262626] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[85vh] overflow-hidden transition-all text-slate-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle Pill */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-neutral-600" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-[#262626] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center ring-1 ring-amber-500/20 shrink-0">
              <Crown size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                Transfer Vault Ownership
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-neutral-400">
                Designate a new Primary Head of Family
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-[#262626] text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-xs font-semibold flex items-center gap-2.5">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Notice Card */}
        <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-900 dark:text-amber-300 text-xs space-y-1.5">
          <div className="font-bold flex items-center gap-1.5">
            <ShieldCheck size={15} className="shrink-0 text-amber-600 dark:text-amber-400" />
            <span>Important Ownership Rule</span>
          </div>
          <p className="text-[11px] leading-relaxed text-amber-900/80 dark:text-amber-200/80 pl-5">
            Transferring ownership promotes the selected member to <strong>Head of Family</strong>. You will automatically become an <strong>Editor</strong> so no vault is ever left orphaned.
          </p>
        </div>

        {/* Select Eligible Member */}
        <div className="space-y-2.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider">
            Choose New Head of Family *
          </label>

          {eligibleMembers.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#141414] text-center text-xs text-slate-500 dark:text-neutral-400">
              No other family members found. Add or invite an adult member to transfer ownership.
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {eligibleMembers.map((m) => {
                const isSelected = (m._id || m.id)?.toString() === selectedMemberId?.toString();
                const isGoogle = Boolean(
                  (m.googleId && !m.googleId.startsWith('local_')) ||
                  (m.email && !m.email.includes('@family.ghar') && !m.email.includes('@gharvault.local'))
                );

                return (
                  <div
                    key={m._id || m.id}
                    onClick={() => setSelectedMemberId(m._id || m.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-500/10 ring-1 ring-amber-500'
                        : 'border-slate-200 dark:border-[#262626] bg-white dark:bg-[#141414] hover:border-slate-300 dark:hover:border-[#333]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={m.avatar || m.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.name)}`}
                        alt={m.name}
                        className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-100 dark:ring-[#262626] shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {m.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">
                          {m.relationship || 'Family Member'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        isGoogle
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-[#3ECF8E]'
                          : 'bg-slate-200 dark:bg-[#262626] text-slate-600 dark:text-neutral-400'
                      }`}>
                        {isGoogle ? 'Verified User' : 'Profile'}
                      </span>
                      <input
                        type="radio"
                        name="newHead"
                        checked={isSelected}
                        onChange={() => setSelectedMemberId(m._id || m.id)}
                        className="text-amber-500 focus:ring-amber-500 cursor-pointer"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Member Summary */}
        {selectedMember && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] flex items-center gap-2 text-xs text-slate-700 dark:text-neutral-300 font-medium">
            <UserCheck size={16} className="text-amber-500 shrink-0" />
            <span>
              Promoting <strong>{selectedMember.name}</strong> to Primary Head of Family.
            </span>
          </div>
        )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-50 dark:bg-[#141414] border-t border-slate-100 dark:border-[#262626] flex flex-col-reverse sm:flex-row items-center sm:justify-end gap-2.5 shrink-0 pb-[max(1.25rem,env(safe-area-inset-bottom,20px))]">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#262626] text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-[#262626] font-bold text-xs transition-colors cursor-pointer text-center"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleTransfer}
            disabled={loading || !selectedMemberId}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer text-center flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Transferring Ownership...</span>
              </>
            ) : (
              <>
                <Crown size={14} />
                <span>Confirm Transfer</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
