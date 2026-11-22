import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Smartphone,
  Share2,
  PlusSquare,
  Check,
  Copy,
  Download,
  Sparkles,
  ExternalLink,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { usePWAInstall } from '../../context/PWAInstallContext';
import { useToast } from '../../context/ToastContext';

export default function InstallAppModal({ isOpen, onClose }) {
  const {
    isIOS,
    isIOSChrome,
    isAndroid,
    deferredPrompt,
    triggerNativeInstall,
    isStandalone,
  } = usePWAInstall();
  const { toast } = useToast();

  const [activeIosTab, setActiveIosTab] = useState(isIOSChrome ? 'chrome' : 'safari');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://gharvault.vercel.app';

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      toast.success('Website link copied! Open Safari and paste to install.');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Failed to copy link. Please copy URL from address bar.');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="w-full max-w-[calc(100vw-1.25rem)] sm:max-w-md bg-white dark:bg-[#18181B] rounded-3xl border border-slate-200 dark:border-[#262626] shadow-2xl overflow-hidden transition-all text-slate-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative p-4 sm:p-6 border-b border-slate-100 dark:border-[#262626] bg-slate-50/70 dark:bg-[#141414]/70">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3.5 top-3.5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-[#202024] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2.5 sm:gap-3 pr-8">
            <img
              src="/icon-192.svg"
              alt="Dastavej App Icon"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl shadow-md shadow-[#3ECF8E]/20 shrink-0 border border-[#3ECF8E]/30"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm sm:text-base font-extrabold tracking-tight truncate">
                  Install Dastavej App
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-[#3ECF8E]/15 text-emerald-800 dark:text-[#3ECF8E] border border-emerald-200 dark:border-[#3ECF8E]/30">
                  PWA
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-neutral-400 mt-0.5 truncate">
                Fast 1-tap access on your phone home screen
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Status Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2.5 sm:p-3 rounded-2xl bg-emerald-50/70 dark:bg-[#3ECF8E]/10 border border-emerald-200/80 dark:border-[#3ECF8E]/20 text-emerald-900 dark:text-[#3ECF8E]">
            <div className="flex items-center gap-2 text-xs font-bold min-w-0">
              <Sparkles size={14} className="shrink-0" />
              <span className="truncate">
                {isIOS
                  ? isIOSChrome
                    ? 'iPhone (Chrome Browser)'
                    : 'iPhone (Safari Browser)'
                  : isAndroid
                  ? 'Android Phone'
                  : 'Desktop Browser'}
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/80 dark:bg-[#18181B] text-emerald-800 dark:text-[#3ECF8E] border border-emerald-300 dark:border-[#3ECF8E]/30 self-start sm:self-auto shrink-0">
              No App Store Needed
            </span>
          </div>

          {/* ================= IPHONE (iOS) GUIDANCE ================= */}
          {isIOS ? (
            <div className="space-y-4">
              {/* Tab Selector if in Chrome */}
              {isIOSChrome && (
                <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveIosTab('chrome')}
                    className={`py-2 rounded-xl transition-all cursor-pointer ${
                      activeIosTab === 'chrome'
                        ? 'bg-white dark:bg-[#222226] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    In Chrome
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveIosTab('safari')}
                    className={`py-2 rounded-xl transition-all cursor-pointer ${
                      activeIosTab === 'safari'
                        ? 'bg-white dark:bg-[#222226] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    In Safari (Best)
                  </button>
                </div>
              )}

              {/* Instructions: Chrome on iPhone */}
              {activeIosTab === 'chrome' && isIOSChrome ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 dark:text-neutral-300">
                    Follow these 3 simple steps in your iPhone Chrome browser:
                  </p>

                  <div className="space-y-2.5">
                    {/* Step 1 */}
                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-200/80 dark:border-[#262626]">
                      <span className="w-6 h-6 rounded-lg bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] font-bold text-xs flex items-center justify-center shrink-0">
                        1
                      </span>
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">
                          Tap the Share Button{' '}
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#262626] text-[11px]">
                          <Share2 size={11} /> Share
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                          In Chrome, tap the Share icon near the address bar or bottom menu.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-200/80 dark:border-[#262626]">
                      <span className="w-6 h-6 rounded-lg bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] font-bold text-xs flex items-center justify-center shrink-0">
                        2
                      </span>
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">
                          Scroll down & tap{' '}
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#262626] text-[11px]">
                          <PlusSquare size={11} /> Add to Home Screen
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                          Scroll down the share sheet until you see "Add to Home Screen".
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-200/80 dark:border-[#262626]">
                      <span className="w-6 h-6 rounded-lg bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] font-bold text-xs flex items-center justify-center shrink-0">
                        3
                      </span>
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">
                          Tap "Add" in the top-right corner
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                          Dastavej will instantly appear on your iPhone home screen!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Instructions: Safari on iPhone (or default iOS) */
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 dark:text-neutral-300">
                    To install Dastavej with full-screen native experience on iPhone:
                  </p>

                  <div className="space-y-2.5">
                    {/* Step 1 */}
                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-200/80 dark:border-[#262626]">
                      <span className="w-6 h-6 rounded-lg bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] font-bold text-xs flex items-center justify-center shrink-0">
                        1
                      </span>
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">
                          Tap the Share Icon{' '}
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#262626] text-[11px]">
                          <Share2 size={11} /> (Bottom Bar)
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                          In Safari, tap the box with an arrow pointing up at the bottom of the screen.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-200/80 dark:border-[#262626]">
                      <span className="w-6 h-6 rounded-lg bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] font-bold text-xs flex items-center justify-center shrink-0">
                        2
                      </span>
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">
                          Tap "Add to Home Screen"{' '}
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#262626] text-[11px]">
                          <PlusSquare size={11} />
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                          Scroll down through the actions menu to find this option.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-200/80 dark:border-[#262626]">
                      <span className="w-6 h-6 rounded-lg bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] font-bold text-xs flex items-center justify-center shrink-0">
                        3
                      </span>
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">
                          Tap "Add" at the top right
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                          The Dastavej app icon will be added to your iPhone home screen!
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Copy Link for Safari Button */}
                  {isIOSChrome && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-[#2A2A2E] bg-slate-50 hover:bg-slate-100 dark:bg-[#141414] dark:hover:bg-[#202024] text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                      >
                        {copied ? (
                          <>
                            <Check size={16} className="text-[#10B981] dark:text-[#3ECF8E]" />
                            <span className="text-[#10B981] dark:text-[#3ECF8E]">Link Copied! Open Safari</span>
                          </>
                        ) : (
                          <>
                            <Copy size={15} />
                            <span>Copy Link to Open in Safari</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* ================= ANDROID / DESKTOP GUIDANCE ================= */
            <div className="space-y-4">
              {deferredPrompt ? (
                <div className="text-center space-y-3 py-2">
                  <p className="text-xs text-slate-600 dark:text-neutral-300">
                    Your browser supports 1-click direct installation. Tap below to install Dastavej onto your device:
                  </p>
                  <button
                    type="button"
                    onClick={triggerNativeInstall}
                    className="w-full min-h-[44px] py-3 px-6 rounded-2xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] font-bold text-xs shadow-md shadow-[#3ECF8E]/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                  >
                    <Download size={16} />
                    <span>Install Dastavej on This Device</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 dark:text-neutral-300">
                    Install Dastavej directly via your browser menu:
                  </p>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-200/80 dark:border-[#262626]">
                      <span className="w-6 h-6 rounded-lg bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] font-bold text-xs flex items-center justify-center shrink-0">
                        1
                      </span>
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">
                          Tap the browser menu (3 dots ⋮)
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                          Located in the top-right corner of Chrome or Edge.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-200/80 dark:border-[#262626]">
                      <span className="w-6 h-6 rounded-lg bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] font-bold text-xs flex items-center justify-center shrink-0">
                        2
                      </span>
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">
                          Tap "Install app" or "Add to Home screen"
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                          Confirms adding Dastavej to your home screen or desktop.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Value Props Strip */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-200/80 dark:border-[#262626] flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400">
            <span className="flex items-center gap-1.5 font-semibold">
              <Shield size={13} className="text-[#10B981] dark:text-[#3ECF8E]" />
              Zero Storage Used
            </span>
            <span>•</span>
            <span className="font-semibold">Full Offline Support</span>
            <span>•</span>
            <span className="font-semibold">1-Tap Fast Copy</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-[#262626] bg-slate-50/70 dark:bg-[#141414]/70 flex items-center justify-end pb-[max(1rem,env(safe-area-inset-bottom,16px))]">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-200 dark:border-[#262626] hover:bg-slate-100 dark:hover:bg-[#202024] text-xs font-bold transition-colors cursor-pointer text-center"
          >
            Got It
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
