import React from 'react';

export default function VaultPageSkeleton() {
  return (
    <div className="max-w-[1400px] mx-auto p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-6 font-sans pb-24 lg:pb-8 animate-fadeIn">
      {/* Decrypting Status Pill */}
      <div className="flex items-center justify-between px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-[#3ECF8E] text-[11px] font-medium">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#10B981] dark:bg-[#3ECF8E] animate-ping" />
          <span className="font-bold">Opening Encrypted Vault Records...</span>
        </div>
        <span className="font-mono text-[10px] opacity-75">AES-256 GCM</span>
      </div>

      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="w-48 h-7 bg-slate-200 dark:bg-[#262626] rounded-xl animate-shimmer" />
          <div className="w-64 h-3.5 bg-slate-100 dark:bg-[#202020] rounded animate-shimmer" />
        </div>
        <div className="w-36 h-9 bg-slate-200 dark:bg-[#262626] rounded-xl animate-shimmer" />
      </div>

      {/* Quick Filter Tabs Skeleton */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="w-28 h-8 rounded-full bg-slate-200 dark:bg-[#202022] animate-shimmer shrink-0"
          />
        ))}
      </div>

      {/* Search Bar & View Mode Toggle Skeleton */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-11 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-xl animate-shimmer" />
        <div className="w-20 h-11 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-xl animate-shimmer shrink-0" />
      </div>

      {/* Member Filter Avatars Row Skeleton */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-100 dark:border-[#222] bg-slate-50 dark:bg-[#161616] shrink-0"
          >
            <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-[#282828] animate-shimmer" />
            <div className="w-16 h-3 bg-slate-200 dark:bg-[#282828] rounded animate-shimmer" />
          </div>
        ))}
      </div>

      {/* Document Grid Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#18181B] rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-4 overflow-hidden"
          >
            {/* Top Row: Icon + Title */}
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 bg-slate-200 dark:bg-[#262626] rounded-2xl animate-shimmer shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="w-3/4 h-4 bg-slate-200 dark:bg-[#262626] rounded animate-shimmer" />
                <div className="w-1/2 h-3 bg-slate-100 dark:bg-[#202020] rounded animate-shimmer" />
              </div>
            </div>

            {/* Document Number Box */}
            <div className="w-full h-10 bg-slate-100 dark:bg-[#141414] rounded-2xl animate-shimmer" />

            {/* Footer tags and action button */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#222]">
              <div className="w-20 h-4 bg-slate-100 dark:bg-[#202020] rounded animate-shimmer" />
              <div className="w-24 h-7 bg-slate-200 dark:bg-[#262626] rounded-xl animate-shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
