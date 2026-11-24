import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  X,
  AlertTriangle,
  ShieldCheck,
  Plus,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Clock
} from 'lucide-react';

export default function PersonalKycPromptModal({
  isOpen,
  onClose,
  user,
  kycStatus
}) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen || !kycStatus || kycStatus.isComplete) return null;

  const missing = kycStatus.missing || [];
  const completedCount = kycStatus.completedCount || 0;
  const total = kycStatus.total || 4;
  const progressPercent = Math.round((completedCount / total) * 100);
  const userName = user?.name?.split(' ')[0] || 'Member';

  const firstMissing = missing[0];

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#18181B] border-t sm:border border-slate-200 dark:border-[#27272A] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[85vh] overflow-hidden transition-all text-slate-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle Pill */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-neutral-600" />
        </div>

        {/* Modal Header */}
        <div className="flex items-start justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-[#262626] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center ring-1 ring-amber-500/25 shrink-0">
              <ShieldAlert size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                  Essential Documents Required / आवश्यक दस्तावेज़
                </h3>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300">
                  {completedCount}/{total} Vaulted
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Personal Identity Vault for <strong>{user?.name || 'Verified Member'}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-[#262626] text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
          {/* Warning Message Card */}
          <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 text-amber-900 dark:text-amber-200 text-xs leading-relaxed space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
              <AlertTriangle size={15} className="shrink-0" />
              <span>Namaste {userName}! Apne essential documents upload karein</span>
            </div>
            <p className="text-[11px] text-slate-700 dark:text-neutral-300 pl-5 leading-normal">
              Aapke personal vault me zaroori identity documents missing hain. Emergency verification, banking aur cashless hospital admission ke liye inko safe vault me upload karein.
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 font-medium">
              <span>Your Personal KYC Progress</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#262626] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-[#10B981] transition-all duration-500 rounded-full"
                style={{ width: `${Math.max(progressPercent, 10)}%` }}
              />
            </div>
          </div>

          {/* Document Checklist Items */}
          <div className="space-y-2">
            <span className="block text-[11px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">
              Missing Essential Documents ({missing.length})
            </span>

            {missing.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-dashed border-amber-300/80 dark:border-amber-500/30 bg-amber-50/30 dark:bg-amber-500/5 flex items-center justify-between gap-3 transition-colors hover:border-emerald-500 dark:hover:border-[#3ECF8E]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl shrink-0">{item.icon}</span>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">
                      {item.category} • Required
                    </p>
                  </div>
                </div>

                <Link
                  to={`/vault/upload?category=${encodeURIComponent(item.category)}&title=${encodeURIComponent(item.title)}&member=${encodeURIComponent(user?._id || user?.id || '')}`}
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg bg-[#10B981] hover:bg-emerald-600 dark:bg-[#3ECF8E] dark:hover:bg-[#34B27B] text-white dark:text-[#121212] font-bold text-xs flex items-center gap-1 shadow-2xs shrink-0 transition-all cursor-pointer"
                >
                  <Plus size={13} strokeWidth={2.5} />
                  <span>Upload</span>
                </Link>
              </div>
            ))}
          </div>

          {/* Vault Security Note */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] text-[11px] text-slate-500 dark:text-neutral-400">
            <ShieldCheck size={16} className="text-[#10B981] dark:text-[#3ECF8E] shrink-0" />
            <span>
              All documents are protected with zero-knowledge 256-bit AES encryption.
            </span>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50 dark:bg-[#141414] border-t border-slate-100 dark:border-[#262626] flex flex-col-reverse sm:flex-row items-center sm:justify-end gap-2.5 shrink-0 pb-[max(1.25rem,env(safe-area-inset-bottom,20px))]">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#27272A] font-bold text-xs transition-colors cursor-pointer text-center"
          >
            Remind Me Later
          </button>

          {firstMissing && (
            <Link
              to={`/vault/upload?category=${encodeURIComponent(firstMissing.category)}&title=${encodeURIComponent(firstMissing.title)}&member=${encodeURIComponent(user?._id || user?.id || '')}`}
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#10B981] hover:bg-emerald-600 dark:bg-[#3ECF8E] dark:hover:bg-[#34B27B] text-white dark:text-[#121212] font-bold text-xs shadow-md shadow-[#3ECF8E]/20 transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
            >
              <span>Upload {firstMissing.title} Now</span>
              <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
