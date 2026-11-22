import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function DastavejLogo({ size = 32, showWordmark = false, subtitle = null, className = '' }) {
  const { isBlue } = useTheme();

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision Origami 'D' Icon Mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 128 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 hover:scale-105"
      >
        <defs>
          {/* Obsidian Squircle Container Background */}
          <linearGradient id={`dastavejBg_${isBlue ? 'blue' : 'emerald'}`} x1="0" y1="0" x2="128" y2="128" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#18181B" />
            <stop offset="100%" stopColor="#09090B" />
          </linearGradient>

          {/* Vertical Spine Facet */}
          <linearGradient id={`spineGrad_${isBlue ? 'blue' : 'emerald'}`} x1="0" y1="0" x2="0" y2="128" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={isBlue ? '#2563EB' : '#059669'} />
            <stop offset="100%" stopColor={isBlue ? '#1D4ED8' : '#047857'} />
          </linearGradient>

          {/* Top Fold Facet */}
          <linearGradient id={`topGrad_${isBlue ? 'blue' : 'emerald'}`} x1="0" y1="0" x2="128" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={isBlue ? '#3B82F6' : '#10B981'} />
            <stop offset="100%" stopColor={isBlue ? '#60A5FA' : '#34D399'} />
          </linearGradient>

          {/* Right Curved Paper Arc */}
          <linearGradient id={`arcGrad_${isBlue ? 'blue' : 'emerald'}`} x1="128" y1="0" x2="64" y2="128" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={isBlue ? '#38BDF8' : '#3ECF8E'} />
            <stop offset="100%" stopColor={isBlue ? '#2563EB' : '#10B981'} />
          </linearGradient>

          {/* Corner Paper Fold Flare */}
          <linearGradient id={`cornerGrad_${isBlue ? 'blue' : 'emerald'}`} x1="64" y1="32" x2="100" y2="68" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={isBlue ? '#93C5FD' : '#A7F3D0'} />
            <stop offset="100%" stopColor={isBlue ? '#38BDF8' : '#34D399'} />
          </linearGradient>

          {/* Subtle Outer Neon Rim Glow */}
          <filter id={`neonRim_${isBlue ? 'blue' : 'emerald'}`} x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor={isBlue ? '#2563EB' : '#10B981'} floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Outer Squircle Container with Glow */}
        <rect
          width="128"
          height="128"
          rx="32"
          fill={`url(#dastavejBg_${isBlue ? 'blue' : 'emerald'})`}
        />
        <rect
          x="1"
          y="1"
          width="126"
          height="126"
          rx="31"
          fill="none"
          stroke={isBlue ? 'rgba(56,189,248,0.35)' : 'rgba(62,207,142,0.35)'}
          strokeWidth="1.5"
        />

        {/* The Origami Paper-Fold 'D' */}
        <g filter={`url(#neonRim_${isBlue ? 'blue' : 'emerald'})`}>
          {/* 1. Left Vertical Spine Sheet */}
          <path
            d="M32 28 H54 V100 H32 Z"
            fill={`url(#spineGrad_${isBlue ? 'blue' : 'emerald'})`}
          />

          {/* 2. Top Horizontal Origami Bevel */}
          <path
            d="M54 28 H82 L68 48 H54 Z"
            fill={`url(#topGrad_${isBlue ? 'blue' : 'emerald'})`}
          />

          {/* 3. Outer Right Folded Sheet Arc forming the 'D' */}
          <path
            d="M82 28 C96 28 106 38 106 54 V74 C106 90 96 100 82 100 H54 L68 80 H80 C88 80 92 76 92 70 V58 C92 52 88 48 80 48 L82 28 Z"
            fill={`url(#arcGrad_${isBlue ? 'blue' : 'emerald'})`}
          />

          {/* 4. Bottom Horizontal Bevel */}
          <path
            d="M54 100 H82 L68 80 H54 Z"
            fill={`url(#spineGrad_${isBlue ? 'blue' : 'emerald'})`}
          />

          {/* 5. Precision Document Corner Turn / Origami Flip */}
          <path
            d="M82 28 L106 52 H82 Z"
            fill={`url(#cornerGrad_${isBlue ? 'blue' : 'emerald'})`}
            opacity="0.95"
          />

          {/* 6. Precision Crease Highlights */}
          <line x1="54" y1="28" x2="54" y2="100" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
          <line x1="68" y1="48" x2="68" y2="80" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          <line x1="82" y1="28" x2="106" y2="52" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" />
        </g>
      </svg>

      {/* Modern Wordmark Styling */}
      {showWordmark && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-headline font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
              Dastavej
            </span>
            <span
              className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-md font-bold tracking-wider ${
                isBlue
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 border border-blue-200/80 dark:border-blue-500/30'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-[#3ECF8E]/15 dark:text-[#3ECF8E] border border-emerald-200/80 dark:border-[#3ECF8E]/30'
              }`}
            >
              Vault
            </span>
          </div>
          {subtitle !== null && (
            <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-normal truncate mt-0.5 leading-tight">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
