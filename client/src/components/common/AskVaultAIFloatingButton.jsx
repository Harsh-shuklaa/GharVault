import React from 'react';
import { Sparkles } from 'lucide-react';

export default function AskVaultAIFloatingButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Ask Vault AI"
      className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:bottom-6 right-4 sm:right-6 z-40 px-3.5 sm:px-4 py-2.5 rounded-full bg-white dark:bg-[#0A0A0A] hover:bg-neutral-50 dark:hover:bg-[#141414] text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-[#222222] shadow-lg shadow-neutral-950/5 dark:shadow-black/40 transition-all duration-200 flex items-center gap-2 cursor-pointer group active:scale-95"
    >
      <div className="w-5 h-5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0">
        <Sparkles size={11} />
      </div>
      <span className="text-xs font-semibold tracking-tight">
        Ask Vault
      </span>
    </button>
  );
}
