import React, { useState, useEffect } from 'react';
import { KeyRound, X, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

export default function MpinModal({ isOpen, onClose, onSuccess, title = 'Sensitive Document Security Lock' }) {
  const { toast } = useToast();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

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

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
      setIsShaking(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const triggerErrorShake = (msg) => {
    setError(msg);
    setIsShaking(true);
    setPin('');
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleDigitClick = (digit) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError('');
      if (nextPin.length === 4) {
        verify(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const verify = async (pinToVerify = pin) => {
    if (pinToVerify.length !== 4) {
      triggerErrorShake('Please enter your 4-digit security PIN');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await api.verifyMpin(pinToVerify);
      if (res.verified || res.success) {
        sessionStorage.setItem('gharvault_mpin_unlocked', 'true');
        toast.success('Security lock verified successfully!');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        triggerErrorShake(res.error || 'Incorrect MPIN. (Default initial PIN is 1234).');
      }
    } catch (err) {
      triggerErrorShake(err.message || 'Verification failed. Please try again.');
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
        className={`fixed inset-x-0 bottom-0 md:static md:inset-auto w-full max-w-sm bg-white dark:bg-[#18181B] border-t md:border border-slate-200 dark:border-[#27272A] rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col max-h-[88vh] md:max-h-[85vh] overflow-hidden transition-all ${
          isShaking ? 'animate-bounce' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle Pill */}
        <div className="md:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-neutral-600" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-[#27272A] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-600 dark:text-[#3ECF8E] flex items-center justify-center border border-emerald-100 dark:border-[#3ECF8E]/20 shrink-0">
              <KeyRound size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                {title}
              </h3>
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-center">
          <p className="text-xs text-slate-500 dark:text-neutral-400">
            Enter your 4-digit Security MPIN to open and view this sensitive family record.
          </p>

          {/* PIN Dots Display */}
          <div className="flex justify-center items-center gap-3.5 py-1">
            {[0, 1, 2, 3].map((index) => {
              const hasDigit = pin.length > index;
              return (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    hasDigit
                      ? 'bg-[#10B981] dark:bg-[#3ECF8E] scale-110 shadow-sm shadow-[#3ECF8E]/40'
                      : 'bg-slate-200 dark:bg-[#27272A]'
                  }`}
                />
              );
            })}
          </div>

          {error && (
            <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-xl border border-red-200 dark:border-red-900/40 flex items-center justify-center gap-1.5 font-medium">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <button
                key={digit}
                type="button"
                disabled={loading}
                onClick={() => handleDigitClick(digit.toString())}
                className="h-12 rounded-xl bg-slate-50 dark:bg-[#141414] hover:bg-slate-100 dark:hover:bg-[#27272A] border border-slate-200 dark:border-[#27272A] text-base font-bold text-slate-800 dark:text-neutral-100 transition-colors cursor-pointer active:scale-95 flex items-center justify-center"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              disabled={loading}
              onClick={() => setPin('')}
              className="h-12 rounded-xl bg-slate-50 dark:bg-[#141414] hover:bg-slate-100 dark:hover:bg-[#27272A] border border-slate-200 dark:border-[#27272A] text-xs font-bold text-slate-500 dark:text-neutral-400 transition-colors cursor-pointer flex items-center justify-center"
            >
              Clear
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDigitClick('0')}
              className="h-12 rounded-xl bg-slate-50 dark:bg-[#141414] hover:bg-slate-100 dark:hover:bg-[#27272A] border border-slate-200 dark:border-[#27272A] text-base font-bold text-slate-800 dark:text-neutral-100 transition-colors cursor-pointer active:scale-95 flex items-center justify-center"
            >
              0
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleBackspace}
              className="h-12 rounded-xl bg-slate-50 dark:bg-[#141414] hover:bg-slate-100 dark:hover:bg-[#27272A] border border-slate-200 dark:border-[#27272A] text-xs font-bold text-slate-600 dark:text-neutral-300 transition-colors cursor-pointer flex items-center justify-center"
            >
              ⌫
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 bg-slate-50 dark:bg-[#141414] border-t border-slate-100 dark:border-[#27272A] text-center shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <p className="text-[11px] text-slate-500 dark:text-neutral-400">
            Initial default PIN is <span className="font-mono font-bold text-slate-700 dark:text-neutral-300">1234</span>. Modify in Settings.
          </p>
        </div>
      </div>
    </div>
  );
}
