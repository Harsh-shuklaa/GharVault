import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  AlertTriangle,
  FileText,
  ShieldAlert,
  Trash2,
  CheckCircle2,
  Lock,
  Archive,
  Info,
  Sparkles,
  ArrowRightLeft,
  FolderSync,
  Copy,
  FolderInput
} from 'lucide-react';
import { api } from '../../lib/api';

export default function DeleteMemberModal({ isOpen, onClose, member, onDeleted }) {
  const [deleteDocuments, setDeleteDocuments] = useState(false);
  const [keepOldCopy, setKeepOldCopy] = useState(true);
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

  if (!isOpen || !member) return null;

  const docCount = member.assignedDocumentsCount || 0;
  const isGoogleLinked = Boolean(
    (member.googleId && !member.googleId.startsWith('local_')) ||
    (member.email &&
      !member.email.includes('@family.ghar') &&
      !member.email.includes('@gharvault.local') &&
      !member.email.includes('member_') &&
      !member.email.includes('admin_'))
  );

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await api.deleteMember(member._id || member.id, {
        deleteDocuments,
        keepOldCopy,
      });

      if (onDeleted) {
        onDeleted(res);
      }
      onClose();
    } catch (err) {
      console.error('Failed to remove member:', err);
      setError(err.message || 'Failed to remove family member. Please try again.');
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
            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center ring-1 shrink-0 ${
              isGoogleLinked
                ? 'bg-[#10B981]/10 text-[#10B981] dark:text-[#3ECF8E] ring-[#10B981]/20'
                : 'bg-red-500/10 text-red-500 ring-red-500/20'
            }`}>
              {isGoogleLinked ? <ArrowRightLeft size={20} /> : <Trash2 size={20} />}
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                {isGoogleLinked ? 'Partition & Move Member' : 'Remove Member Profile'}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-neutral-400">
                {isGoogleLinked
                  ? 'Independent Vault & Document Safety'
                  : 'Safe Removal & Archive Control'}
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

        {/* Member Preview Card */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200/80 dark:border-[#262626]">
          <div className="flex items-center gap-3">
            <img
              src={member.avatar || member.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name)}`}
              alt={member.name}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover ring-2 ring-slate-200 dark:ring-[#262626]"
            />
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                {member.name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
                {member.relationship || member.relation || 'Family Member'} •{' '}
                <span className="font-semibold text-slate-700 dark:text-neutral-300">
                  {docCount} document{docCount !== 1 ? 's' : ''} tagged
                </span>
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
              isGoogleLinked
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-[#3ECF8E] border border-emerald-500/20'
                : 'bg-slate-200 dark:bg-[#262626] text-slate-700 dark:text-neutral-300'
            }`}>
              {isGoogleLinked ? 'Linked Google Account' : 'Offline Profile'}
            </span>
          </div>
        </div>

        {/* Scenario A: Google-Linked Member (Vault Partitioning) */}
        {isGoogleLinked ? (
          <div className="space-y-3.5">
            <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-[#3ECF8E]/10 border border-emerald-200/70 dark:border-[#3ECF8E]/20 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-[#3ECF8E] font-bold text-xs">
                <Sparkles size={16} className="shrink-0" />
                <span>Automatic Vault Creation for {member.name}</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-neutral-300">
                GharVault will automatically create an independent Family Vault for <strong>{member.name}</strong> (with a fresh invite code and them as Head of Family). All {docCount} personal document(s) will be migrated so they never lose access.
              </p>
            </div>

            {/* Document Handling Choice for Google-Linked Member */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider">
                Original Family Vault Copy ({docCount} Document{docCount !== 1 ? 's' : ''})
              </label>

              {/* Option 1: Keep a Copy in Family Vault (Recommended) */}
              <div
                onClick={() => setKeepOldCopy(true)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  keepOldCopy
                    ? 'border-[#10B981] dark:border-[#3ECF8E] bg-emerald-50/50 dark:bg-[#3ECF8E]/10 ring-1 ring-[#10B981] dark:ring-[#3ECF8E]'
                    : 'border-slate-200 dark:border-[#262626] bg-white dark:bg-[#141414] hover:border-slate-300 dark:hover:border-[#333]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="googleDocHandling"
                    checked={keepOldCopy}
                    onChange={() => setKeepOldCopy(true)}
                    className="mt-0.5 text-[#10B981] dark:text-[#3ECF8E] focus:ring-[#3ECF8E] cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Copy size={14} className="text-[#10B981] dark:text-[#3ECF8E]" />
                        Keep a Copy in Family Vault
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] dark:text-[#3ECF8E]">
                        Recommended
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                      Keeps a shared archive copy in this family vault under Joint Records, while also copying documents into {member.name}'s new personal vault.
                    </p>
                  </div>
                </div>
              </div>

              {/* Option 2: Remove from This Family Vault */}
              <div
                onClick={() => setKeepOldCopy(false)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  !keepOldCopy
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-500/10 ring-1 ring-amber-500'
                    : 'border-slate-200 dark:border-[#262626] bg-white dark:bg-[#141414] hover:border-slate-300 dark:hover:border-[#333]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="googleDocHandling"
                    checked={!keepOldCopy}
                    onChange={() => setKeepOldCopy(false)}
                    className="mt-0.5 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                        <FolderInput size={14} className="text-amber-500" />
                        Remove from This Family Vault
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        Exclusive Move
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                      Moves documents exclusively to {member.name}'s new vault. This family vault will no longer retain copies.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Scenario B: Offline Member Profile */
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Info size={14} className="shrink-0" />
                <span>Offline Profile Information</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-900/80 dark:text-amber-200/80 pl-5">
                Yeh ek offline profile hai jiska koi Google account nahi hai. Isko remove karne par aap choose kar sakte hain ki inke documents safe rakhne hain ya delete karne hain.
              </p>
            </div>

            {/* Document Handling Choice for Local Member */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider">
                Document Safety ({docCount} Document{docCount !== 1 ? 's' : ''} Tagged)
              </label>

              {/* Option 1: Keep in Family Vault (Recommended) */}
              <div
                onClick={() => setDeleteDocuments(false)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  !deleteDocuments
                    ? 'border-[#10B981] dark:border-[#3ECF8E] bg-emerald-50/50 dark:bg-[#3ECF8E]/10 ring-1 ring-[#10B981] dark:ring-[#3ECF8E]'
                    : 'border-slate-200 dark:border-[#262626] bg-white dark:bg-[#141414] hover:border-slate-300 dark:hover:border-[#333]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="localDocHandling"
                    checked={!deleteDocuments}
                    onChange={() => setDeleteDocuments(false)}
                    className="mt-0.5 text-[#10B981] dark:text-[#3ECF8E] focus:ring-[#3ECF8E] cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Archive size={14} className="text-[#10B981] dark:text-[#3ECF8E]" />
                        Keep in Family Vault
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] dark:text-[#3ECF8E]">
                        Recommended
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                      Re-assigns documents to Joint / Family Archive (owned by Family Head). Vital records (Property, Will, Health policies) will stay safe in this vault.
                    </p>
                  </div>
                </div>
              </div>

              {/* Option 2: Delete Associated Documents */}
              <div
                onClick={() => setDeleteDocuments(true)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  deleteDocuments
                    ? 'border-red-500 bg-red-50/50 dark:bg-red-500/10 ring-1 ring-red-500'
                    : 'border-slate-200 dark:border-[#262626] bg-white dark:bg-[#141414] hover:border-slate-300 dark:hover:border-[#333]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="localDocHandling"
                    checked={deleteDocuments}
                    onChange={() => setDeleteDocuments(true)}
                    className="mt-0.5 text-red-600 focus:ring-red-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Trash2 size={14} className="text-red-500" />
                        Delete Associated Documents
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400">
                        Irreversible
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                      Permanently deletes all {docCount} tagged document(s) and removes the files from encrypted storage.
                    </p>
                  </div>
                </div>
              </div>
            </div>
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
            onClick={handleDelete}
            disabled={loading}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer text-center flex items-center justify-center gap-2 ${
              isGoogleLinked
                ? 'bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] shadow-md shadow-[#3ECF8E]/20'
                : 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20'
            }`}
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                <span>{isGoogleLinked ? 'Partitioning Vault...' : 'Removing...'}</span>
              </>
            ) : (
              <>
                {isGoogleLinked ? <FolderSync size={14} /> : <Trash2 size={14} />}
                <span>
                  {isGoogleLinked
                    ? `Partition & Move ${member.name}`
                    : `Remove Member Profile`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
