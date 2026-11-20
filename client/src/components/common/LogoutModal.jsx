import React, { useEffect } from 'react';
import { LogOut, X, Shield, Lock, Trash2, CheckCircle2 } from 'lucide-react';

export default function LogoutModal({ isOpen, onClose, onConfirm, loading = false }) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
      onClick={() => {
        if (!loading) onClose();
      }}
    >
      <div
        className="fixed inset-x-0 bottom-0 md:static md:inset-auto w-full max-w-md bg-white dark:bg-[#18181B] border-t md:border border-slate-200 dark:border-[#27272A] rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden transition-all text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle Pill */}
        <div className="md:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-neutral-600" />
        </div>

        {/* Modal Header */}
        <div className="px-5 sm:px-6 pt-5 pb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-100 dark:border-red-500/20 shrink-0 shadow-2xs">
              <LogOut size={20} strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                Log Out of GharVault?
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Secure Session Termination
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-[#27272A] text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-5 sm:px-6 py-3 space-y-3">
          <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
            Are you sure you want to log out? To protect your family's sensitive documents, the following security actions will take effect immediately:
          </p>

          <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] text-xs">
            <div className="flex items-start gap-2.5 text-slate-700 dark:text-neutral-300">
              <Lock size={15} className="text-[#10B981] dark:text-[#3ECF8E] shrink-0 mt-0.5" />
              <span><strong>Vault Auto-Lock:</strong> Your active session will be securely locked.</span>
            </div>
            <div className="flex items-start gap-2.5 text-slate-700 dark:text-neutral-300">
              <Shield size={15} className="text-amber-500 shrink-0 mt-0.5" />
              <span><strong>Credentials Cleared:</strong> MPIN unlock sessions & local tokens will be wiped from this browser.</span>
            </div>
            <div className="flex items-start gap-2.5 text-slate-700 dark:text-neutral-300">
              <CheckCircle2 size={15} className="text-[#10B981] dark:text-[#3ECF8E] shrink-0 mt-0.5" />
              <span><strong>Cloud Protected:</strong> All family files remain safely stored and encrypted on the cloud.</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-4 sm:px-6 py-4 border-t border-slate-100 dark:border-[#262626] bg-slate-50/50 dark:bg-[#141414]/50 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] hover:bg-slate-100 dark:hover:bg-[#27272A] text-slate-700 dark:text-neutral-300 font-bold text-xs transition-colors cursor-pointer text-center disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 transition-all cursor-pointer text-center disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Signing Out...</span>
              </>
            ) : (
              <>
                <LogOut size={14} />
                <span>Yes, Log Out</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
