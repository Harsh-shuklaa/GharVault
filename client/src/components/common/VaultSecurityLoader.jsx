import React from 'react';
import { ShieldCheck, Lock, Sparkles } from 'lucide-react';

export default function VaultSecurityLoader({
  message = 'Verifying Encrypted Vault Session...',
  subtitle = 'AES-256 Bit Cryptographic Security Active',
  fullScreen = true,
}) {
  const containerClass = fullScreen
    ? 'min-h-screen bg-[#F8FAFC] dark:bg-[#121212] flex flex-col items-center justify-center text-center p-6 transition-colors font-sans'
    : 'w-full py-16 flex flex-col items-center justify-center text-center p-6 font-sans';

  return (
    <div className={containerClass}>
      {/* Central Radar Pulse Shield */}
      <div className="relative flex items-center justify-center mb-6">
        {/* Outer expanding ripple 1 */}
        <div className="absolute w-24 h-24 rounded-3xl bg-[#10B981]/15 dark:bg-[#3ECF8E]/15 animate-ping opacity-60" />

        {/* Outer expanding ripple 2 */}
        <div className="absolute w-20 h-20 rounded-2xl bg-[#10B981]/20 dark:bg-[#3ECF8E]/20 animate-pulse" />

        {/* Shield Container */}
        <div className="relative w-16 h-16 rounded-2xl bg-white dark:bg-[#1C1C1C] border border-emerald-500/30 dark:border-[#3ECF8E]/30 flex items-center justify-center shadow-lg shadow-emerald-500/10 dark:shadow-[#3ECF8E]/10 z-10">
          <ShieldCheck className="w-8 h-8 text-[#10B981] dark:text-[#3ECF8E]" />

          {/* Micro Lock Badge */}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] flex items-center justify-center ring-2 ring-white dark:ring-[#121212]">
            <Lock size={10} strokeWidth={2.8} />
          </div>
        </div>
      </div>

      {/* Message and Subtitle */}
      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-1.5">
          <span>{message}</span>
        </h3>
        <p className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium tracking-wide">
          {subtitle}
        </p>
      </div>

      {/* High-tech Emerald Progress Beam */}
      <div className="w-48 h-1 rounded-full bg-slate-200 dark:bg-[#242424] overflow-hidden mt-5">
        <div className="h-full bg-gradient-to-r from-emerald-500 via-[#3ECF8E] to-teal-400 rounded-full animate-pulse w-3/4 mx-auto" />
      </div>

      {/* Micro Status Badges */}
      <div className="flex items-center gap-2 mt-4 text-[10px] font-mono text-slate-400 dark:text-neutral-500">
        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] dark:bg-[#3ECF8E] animate-pulse" />
        <span>ZERO-KNOWLEDGE PRIVACY</span>
        <span>•</span>
        <span>FAMILY VAULT</span>
      </div>
    </div>
  );
}
