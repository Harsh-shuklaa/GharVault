import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import confetti from 'canvas-confetti';
import { KeyRound, ShieldCheck, CheckCircle2, Clock, Lock, X, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function QuorumSignModal({ isOpen, onClose, quorumRequest, onSignSuccess }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [signing, setSigning] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Close on Escape key & Lock Body Scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !quorumRequest) return null;

  const currentSignatures = quorumRequest.signatures || [];
  const required = quorumRequest.requiredSignatures || 2;
  const isUserSigned = currentSignatures.some(
    (s) => s.userId?.toString() === user?._id?.toString()
  );

  const handleSign = async () => {
    try {
      setSigning(true);
      setError('');
      const res = await api.signQuorum(quorumRequest._id, user?.email || 'priya.sharma@gmail.com');

      if (res.approved || res.success) {
        setSuccess(true);
        toast.success('Dual-Key Quorum signed successfully!');
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#3ECF8E', '#059669', '#34B27B'],
        });
        if (onSignSuccess) onSignSuccess(res.request);
      } else {
        throw new Error(res.error || 'Failed to sign quorum');
      }
    } catch (err) {
      setError(err.message || 'Failed to sign quorum');
      toast.error(err.message || 'Failed to sign quorum');
    } finally {
      setSigning(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#18181B] border-t md:border border-slate-200 dark:border-[#27272A] rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] md:max-h-[85vh] overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle Pill */}
        <div className="md:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-neutral-600" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-[#27272A] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#3ECF8E]/10 border border-emerald-100 dark:border-[#3ECF8E]/20 text-[#10B981] dark:text-[#3ECF8E] flex items-center justify-center shrink-0">
              <KeyRound size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Dual-Key Quorum Sign-off
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Multi-Signature Family Governance Protocol
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-[#27272A] text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
          {success ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-[#3ECF8E]/10 border border-emerald-200 dark:border-[#3ECF8E]/30 text-[#10B981] dark:text-[#3ECF8E] flex items-center justify-center mx-auto shadow-sm">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Quorum Verification Succeeded!
                </h4>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
                  Dual-key cryptographic sign-off is complete. The sensitive document is now accessible for authorized family custodians.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#27272A] text-left font-mono text-xs text-slate-700 dark:text-neutral-300 space-y-1.5">
                <div>Document: <strong className="text-slate-900 dark:text-white">{quorumRequest.documentTitle}</strong></div>
                <div>Signers: {currentSignatures.map((s) => s.userName).join(', ')}, {user?.name}</div>
                <div>Status: <span className="text-[#10B981] dark:text-[#3ECF8E] font-bold">QUORUM_SATISFIED (2 of 2)</span></div>
                <div className="text-slate-500 dark:text-neutral-400 text-[11px] truncate">
                  Verification Seal: {currentSignatures[0]?.digitalSignature || 'SIG_RSA4096_VERIFIED'}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Document Info Card */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-200/80 dark:border-[#27272A] flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center shrink-0">
                  <Lock size={16} />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                    {quorumRequest.documentTitle}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-neutral-400">
                    Action requested: <span className="font-semibold text-slate-700 dark:text-neutral-200">{quorumRequest.actionType}</span>
                  </div>
                  {quorumRequest.reason && (
                    <div className="text-xs text-slate-600 dark:text-neutral-300 bg-white dark:bg-[#18181B] p-2.5 rounded-xl border border-slate-200 dark:border-[#27272A]">
                      <span className="font-semibold">Reason:</span> "{quorumRequest.reason}"
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-600 dark:text-neutral-400">Custodian Quorum Status</span>
                  <span className="text-[#10B981] dark:text-[#3ECF8E] font-bold">
                    {currentSignatures.length} of {required} Signed
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#141414] overflow-hidden flex border border-slate-200 dark:border-[#27272A]">
                  <div
                    className="bg-[#10B981] dark:bg-[#3ECF8E] h-full transition-all duration-500"
                    style={{ width: `${(currentSignatures.length / required) * 100}%` }}
                  />
                </div>
              </div>

              {/* Signatures List */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider block">
                  Designated Signers
                </span>
                <div className="space-y-2">
                  {currentSignatures.map((sig, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <CheckCircle2 size={16} className="text-[#10B981] dark:text-[#3ECF8E] shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {sig.userName}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
                            Signed on {new Date(sig.signedAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-[#3ECF8E]/20 text-emerald-800 dark:text-[#3ECF8E] uppercase shrink-0">
                        Signed
                      </span>
                    </div>
                  ))}

                  {!isUserSigned && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Clock size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {user?.name} (You)
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-neutral-400">
                            Role: {user?.role} • Ready to provide 2nd digital key
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 uppercase shrink-0 animate-pulse">
                        Pending Your Key
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Fixed Footer */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-50 dark:bg-[#141414] border-t border-slate-100 dark:border-[#27272A] flex flex-col-reverse sm:flex-row items-center sm:justify-end gap-2.5 shrink-0 pb-[max(1.25rem,env(safe-area-inset-bottom,20px))]">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#27272A] font-bold text-xs transition-colors cursor-pointer text-center"
          >
            {success ? 'Close' : 'Cancel'}
          </button>
          {!success && (
            <button
              type="button"
              onClick={handleSign}
              disabled={signing || isUserSigned}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] font-bold text-xs shadow-md shadow-[#3ECF8E]/20 disabled:opacity-50 transition-all cursor-pointer text-center"
            >
              <KeyRound size={15} strokeWidth={2.2} />
              <span>
                {signing
                  ? 'Signing Digital Key...'
                  : isUserSigned
                  ? 'Already Signed'
                  : 'Sign & Unlock Document'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
