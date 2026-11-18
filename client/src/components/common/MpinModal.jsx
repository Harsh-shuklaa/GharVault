import React, { useState } from 'react';
import { Shield, Lock, X, AlertCircle, KeyRound, Check } from 'lucide-react';
import { api } from '../../lib/api';

export default function MpinModal({ isOpen, onClose, onSuccess, title = 'Sensitive Document Lock' }) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

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
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const verify = async (pinToVerify = pin) => {
    if (pinToVerify.length !== 4) {
      setError('Please enter your 4-digit security PIN');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await api.verifyMpin(pinToVerify);
      if (res.verified || res.success) {
        // Cache in sessionStorage for current browser session
        sessionStorage.setItem('gharvault_mpin_unlocked', 'true');
        onSuccess();
        onClose();
      } else {
        setError(res.error || 'Incorrect MPIN. (Default initial PIN is 1234).');
        setPin('');
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-[#1C1C1C] rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-[#262626] text-center space-y-5 transition-colors relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
        >
          <X size={18} />
        </button>

        {/* Shield Icon */}
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-[#3ECF8E]/10 border border-emerald-200 dark:border-[#3ECF8E]/30 flex items-center justify-center mx-auto text-[#10B981] dark:text-[#3ECF8E] shadow-sm">
          <KeyRound size={26} />
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            Enter your 4-digit Security MPIN to decrypt and open this sensitive record.
          </p>
        </div>

        {/* PIN Dots Display */}
        <div className="flex justify-center items-center gap-3 py-2">
          {[0, 1, 2, 3].map((index) => {
            const hasDigit = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  hasDigit
                    ? 'bg-[#10B981] dark:bg-[#3ECF8E] scale-110 shadow-sm'
                    : 'bg-slate-200 dark:bg-[#2E2E2E]'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 p-2.5 rounded-xl border border-red-200 dark:border-red-900/30 flex items-center justify-center gap-1.5 font-medium">
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
              className="h-12 rounded-xl bg-slate-50 dark:bg-[#141414] hover:bg-slate-100 dark:hover:bg-[#262626] border border-slate-200 dark:border-[#262626] text-base font-bold text-slate-800 dark:text-neutral-100 transition-colors cursor-pointer active:scale-95 flex items-center justify-center"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            disabled={loading}
            onClick={() => setPin('')}
            className="h-12 rounded-xl bg-slate-50 dark:bg-[#141414] hover:bg-slate-100 dark:hover:bg-[#262626] border border-slate-200 dark:border-[#262626] text-xs font-bold text-slate-500 dark:text-neutral-400 transition-colors cursor-pointer flex items-center justify-center"
          >
            Clear
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleDigitClick('0')}
            className="h-12 rounded-xl bg-slate-50 dark:bg-[#141414] hover:bg-slate-100 dark:hover:bg-[#262626] border border-slate-200 dark:border-[#262626] text-base font-bold text-slate-800 dark:text-neutral-100 transition-colors cursor-pointer active:scale-95 flex items-center justify-center"
          >
            0
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleBackspace}
            className="h-12 rounded-xl bg-slate-50 dark:bg-[#141414] hover:bg-slate-100 dark:hover:bg-[#262626] border border-slate-200 dark:border-[#262626] text-xs font-bold text-slate-600 dark:text-neutral-300 transition-colors cursor-pointer flex items-center justify-center"
          >
            ⌫
          </button>
        </div>

        <div className="pt-2 text-[11px] text-slate-400 dark:text-neutral-500 font-mono">
          Default initial PIN is <strong>1234</strong>. You can change this anytime in Settings.
        </div>
      </div>
    </div>
  );
}