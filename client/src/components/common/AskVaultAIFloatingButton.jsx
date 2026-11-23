import React from 'react';
import { Sparkles, MessageSquare } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function AskVaultAIFloatingButton({ onClick }) {
  const { isBlue } = useTheme();

  return (
    <button
      type="button"
      onClick={onClick}
      title="Ask Vault AI (Gemini Assistant)"
      className={`fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:bottom-6 right-4 sm:right-6 z-40 px-3.5 sm:px-4 py-2.5 rounded-2xl shadow-xl transition-all duration-300 flex items-center gap-2 cursor-pointer group active:scale-95 border ${
        isBlue
          ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500/40 shadow-blue-500/25'
          : 'bg-[#10B981] hover:bg-[#059669] dark:bg-[#3ECF8E] dark:hover:bg-[#34b27b] text-white dark:text-[#121212] border-emerald-400/40 dark:border-[#3ECF8E]/40 shadow-emerald-500/25 dark:shadow-[#3ECF8E]/25'
      }`}
    >
      <div className="relative">
        <Sparkles size={16} className="group-hover:rotate-12 transition-transform duration-300 animate-pulse" />
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
      </div>
      <span className="text-xs font-extrabold tracking-tight">
        Ask AI
      </span>
      <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-black/20 text-white dark:text-[#121212]/80">
        Vault
      </span>
    </button>
  );
}
