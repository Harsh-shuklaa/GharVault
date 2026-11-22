import React from 'react';
import { ShieldCheck, Lock, Sparkles } from 'lucide-react';

export default function DashboardSkeleton() {
  return (
    <div className="max-w-[1400px] mx-auto p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-5 font-sans pb-24 lg:pb-8 animate-fadeIn">
      {/* Decrypting Status Pill */}
      <div className="flex items-center justify-between px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-[#3ECF8E] text-[11px] font-medium">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#10B981] dark:bg-[#3ECF8E] animate-ping" />
          <span className="font-bold">Decrypting 256-bit AES Family Vault...</span>
        </div>
        <span className="hidden sm:inline font-mono text-[10px] opacity-75">ZERO-KNOWLEDGE VERIFIED</span>
      </div>

      {/* ================= 1. HEADER & PERSONA SWITCHER SKELETON ================= */}
      <div className="bg-white dark:bg-[#18181B] rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-[#27272A] shadow-xs space-y-4">
        {/* Top Bar: Family Name + Status + Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-48 h-6 bg-slate-200 dark:bg-[#262626] rounded-lg animate-shimmer" />
              <div className="w-24 h-5 bg-slate-200 dark:bg-[#262626] rounded-full animate-shimmer" />
            </div>
            <div className="w-72 h-3.5 bg-slate-100 dark:bg-[#202022] rounded animate-shimmer" />
          </div>

          {/* Quick Header Launchers Placeholder */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-24 h-8 bg-slate-100 dark:bg-[#222] rounded-xl animate-shimmer" />
            <div className="w-28 h-8 bg-slate-100 dark:bg-[#222] rounded-xl animate-shimmer" />
            <div className="w-32 h-8 bg-slate-200 dark:bg-[#282828] rounded-xl animate-shimmer" />
          </div>
        </div>

        {/* Level 2: Family Persona Story Avatars Skeleton */}
        <div className="pt-2 border-t border-slate-100 dark:border-[#27272A]">
          <div className="w-36 h-3 bg-slate-100 dark:bg-[#222] rounded mb-2.5 animate-shimmer" />

          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
            {/* All Vault Circle */}
            <div className="w-28 h-8 bg-slate-200 dark:bg-[#27272A] rounded-full shrink-0 animate-shimmer" />

            {/* Member Story Skeletons */}
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-100 dark:border-[#222] bg-slate-50 dark:bg-[#161616] shrink-0"
              >
                <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-[#282828] animate-shimmer" />
                <div className="w-14 h-3 bg-slate-200 dark:bg-[#282828] rounded animate-shimmer" />
                <div className="w-8 h-3 bg-slate-100 dark:bg-[#202020] rounded animate-shimmer" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= 2. UNIVERSAL FAST SEARCH BAR SKELETON ================= */}
      <div className="w-full h-11 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-xl animate-shimmer" />

      {/* ================= 3. ESSENTIAL KYC CHECKLIST SKELETON ================= */}
      <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-slate-200 dark:border-[#27272A] p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-[#262626] animate-shimmer shrink-0" />
            <div className="space-y-1.5">
              <div className="w-60 h-4 bg-slate-200 dark:bg-[#262626] rounded animate-shimmer" />
              <div className="w-80 h-3 bg-slate-100 dark:bg-[#202020] rounded animate-shimmer" />
            </div>
          </div>
          <div className="w-32 h-8 bg-slate-100 dark:bg-[#222] rounded-xl animate-shimmer" />
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#242424] overflow-hidden">
          <div className="w-1/3 h-full bg-gradient-to-r from-emerald-500/50 to-[#3ECF8E]/50 rounded-full animate-pulse" />
        </div>

        {/* 4 Essential ID Cards Skeleton Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-3 rounded-xl border border-slate-100 dark:border-[#222] bg-slate-50 dark:bg-[#141414] space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-[#262626] animate-shimmer" />
                <div className="w-14 h-4 rounded bg-slate-200 dark:bg-[#262626] animate-shimmer" />
              </div>
              <div className="w-24 h-3.5 bg-slate-200 dark:bg-[#262626] rounded animate-shimmer" />
              <div className="w-full h-3 bg-slate-100 dark:bg-[#202020] rounded animate-shimmer" />
            </div>
          ))}
        </div>
      </div>

      {/* ================= 4. ID CARDS SHELF SKELETON (Cards Grid) ================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="w-44 h-5 bg-slate-200 dark:bg-[#262626] rounded animate-shimmer" />
          <div className="w-24 h-4 bg-slate-100 dark:bg-[#202020] rounded animate-shimmer" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#18181B] rounded-2xl border border-slate-200 dark:border-[#27272A] p-4 space-y-3.5 shadow-xs overflow-hidden"
            >
              {/* Card Header stripe */}
              <div className="w-full h-1 bg-slate-200 dark:bg-[#262626] rounded-full animate-shimmer" />

              <div className="flex items-center justify-between">
                <div className="w-24 h-4 bg-slate-200 dark:bg-[#262626] rounded-full animate-shimmer" />
                <div className="w-16 h-4 bg-slate-100 dark:bg-[#202020] rounded-full animate-shimmer" />
              </div>

              <div className="space-y-1.5">
                <div className="w-36 h-4 bg-slate-200 dark:bg-[#262626] rounded animate-shimmer" />
                <div className="w-48 h-3 bg-slate-100 dark:bg-[#202020] rounded animate-shimmer" />
              </div>

              {/* Number display box */}
              <div className="w-full h-9 bg-slate-100 dark:bg-[#141414] rounded-xl flex items-center justify-between px-3 animate-shimmer" />

              <div className="flex items-center justify-between pt-1">
                <div className="w-20 h-6 bg-slate-100 dark:bg-[#222] rounded-lg animate-shimmer" />
                <div className="w-16 h-6 bg-slate-100 dark:bg-[#222] rounded-lg animate-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
