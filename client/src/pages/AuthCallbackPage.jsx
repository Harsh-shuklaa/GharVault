import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Shield,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Home,
  Check,
} from 'lucide-react';
import { supabase, isSupabaseConfigured, signInWithGoogle } from '../lib/supabaseClient';
import DastavejLogo from '../components/common/DastavejLogo';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, family, refreshSession } = useAuth();

  // Step 1: Google Auth, Step 2: Key Handshake, Step 3: Vault Unlocked
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState('Verifying your Google account...');
  const [error, setError] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showManualFallback, setShowManualFallback] = useState(false);

  const hasProcessedRef = useRef(false);
  const redirectTimeoutRef = useRef(null);

  // Helper to safely navigate to family dashboard or setup
  const proceedToVault = (targetUser = user, targetFamily = family) => {
    setStep(3);
    setIsUnlocked(true);
    setStatus('Vault decrypted! Opening your dashboard...');

    if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
    redirectTimeoutRef.current = setTimeout(() => {
      const hasFamily = Boolean(targetFamily?._id || targetUser?.familyId);
      const destination = hasFamily ? '/dashboard' : '/family/setup';
      navigate(destination, { replace: true });
    }, 600);
  };

  // 1. FAST-PATH REACTIVITY: If AuthContext already has the authenticated user, proceed immediately!
  useEffect(() => {
    if (user) {
      proceedToVault(user, family);
    }
  }, [user, family]);

  // 2. Fallback timeout: If auth takes longer than 5 seconds, show friendly manual button
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      setShowManualFallback(true);
    }, 4500);
    return () => clearTimeout(fallbackTimer);
  }, []);

  // 3. MAIN AUTHENTICATION RESOLVER
  useEffect(() => {
    if (hasProcessedRef.current) return;
    hasProcessedRef.current = true;
    let isMounted = true;

    const processAuth = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));

        // Check for OAuth error returned in URL
        const oauthError = params.get('error') || hashParams.get('error');
        const oauthErrorDesc = params.get('error_description') || hashParams.get('error_description');
        if (oauthError) {
          throw new Error(oauthErrorDesc || `Google Sign-In was not completed: ${oauthError}`);
        }

        // Check 1: If gharvault_token already exists in localStorage, verify with backend immediately
        const existingToken = localStorage.getItem('gharvault_token');
        if (existingToken && existingToken !== 'null' && existingToken !== 'undefined') {
          try {
            const meRes = await api.getMe();
            if (meRes?.user && isMounted) {
              await refreshSession();
              proceedToVault(meRes.user, meRes.family);
              return;
            }
          } catch (e) {
            console.warn('[AuthCallback] Existing token invalid, renewing...', e.message);
            localStorage.removeItem('gharvault_token');
          }
        }

        setStep(1);
        setStatus('Connecting with Google & verifying credentials...');

        let activeSession = null;

        if (isSupabaseConfigured && supabase) {
          // If URL hash contains access_token (Supabase OAuth implicit return)
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          if (accessToken && refreshToken) {
            try {
              const { data: setSessionData, error: setSessionErr } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              if (!setSessionErr && setSessionData?.session) {
                activeSession = setSessionData.session;
              }
            } catch (err) {
              console.warn('[AuthCallback] setSession notice:', err.message);
            }
          }

          // If URL query contains authorization code (PKCE flow)
          const code = params.get('code');
          if (code && !activeSession) {
            setStatus('Exchanging secure authorization code...');
            const { data: codeData, error: codeErr } = await supabase.auth.exchangeCodeForSession(code);
            if (!codeErr && codeData?.session) {
              activeSession = codeData.session;
            }
          }

          // Check if session is already stored in Supabase client
          if (!activeSession) {
            const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
            if (session) {
              activeSession = session;
            }
          }

          // Polling check: wait up to 3 seconds for Supabase background session parsing
          if (!activeSession) {
            for (let i = 0; i < 6; i++) {
              await new Promise(r => setTimeout(r, 400));
              if (!isMounted) return;

              // Check if token was written by AuthContext in background
              const currentToken = localStorage.getItem('gharvault_token');
              if (currentToken) {
                const meRes = await api.getMe();
                if (meRes?.user) {
                  await refreshSession();
                  proceedToVault(meRes.user, meRes.family);
                  return;
                }
              }

              const { data: { session: pollSession } } = await supabase.auth.getSession();
              if (pollSession?.user) {
                activeSession = pollSession;
                break;
              }
            }
          }
        }

        // If after checks still no session, check localStorage once more
        if (!activeSession?.user) {
          const freshToken = localStorage.getItem('gharvault_token');
          if (freshToken) {
            const meRes = await api.getMe();
            if (meRes?.user && isMounted) {
              await refreshSession();
              proceedToVault(meRes.user, meRes.family);
              return;
            }
          }

          // If really no session, show friendly fallback
          setShowManualFallback(true);
          setStatus('Authentication session not detected. You can sign in below.');
          return;
        }

        // Active session verified! Sync with GharVault backend
        const authUser = activeSession.user;
        setStep(2);
        setStatus('Synchronizing Zero-Knowledge 256-bit vault keys...');

        const pendingInviteCode = localStorage.getItem('pending_invite_code') || sessionStorage.getItem('pending_invite_code');
        const pendingRelation = localStorage.getItem('pending_invite_relation') || sessionStorage.getItem('pending_invite_relation') || 'Member';
        const pendingName = localStorage.getItem('pending_invite_name') || sessionStorage.getItem('pending_invite_name');

        const syncData = {
          email: authUser.email,
          name: pendingName || authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email.split('@')[0],
          avatar: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
          googleId: authUser.id,
          inviteCode: pendingInviteCode ? pendingInviteCode.trim().toUpperCase() : undefined,
          relationship: pendingRelation,
        };

        const res = await api.syncAuth(syncData);

        if (!res?.token) {
          throw new Error(res?.error || 'Could not synchronize your Family Vault.');
        }

        localStorage.setItem('gharvault_token', res.token);

        // Confirm family linkage if invite code was present
        if (pendingInviteCode) {
          setStatus(`Connecting to Family Vault (${pendingInviteCode})...`);
          try {
            const joinRes = await api.joinFamily({
              inviteCode: pendingInviteCode.trim().toUpperCase(),
              name: pendingName || syncData.name,
              email: syncData.email,
              relationship: pendingRelation,
            });
            if (joinRes?.token) {
              localStorage.setItem('gharvault_token', joinRes.token);
            }
          } catch (joinErr) {
            console.warn('[AuthCallback] joinFamily notice:', joinErr.message);
          }
          localStorage.removeItem('pending_invite_code');
          localStorage.removeItem('pending_invite_relation');
          localStorage.removeItem('pending_invite_name');
          sessionStorage.removeItem('pending_invite_code');
          sessionStorage.removeItem('pending_invite_relation');
          sessionStorage.removeItem('pending_invite_name');
        }

        // Refresh context session and smoothly open vault!
        await refreshSession();

        if (isMounted) {
          proceedToVault(res.user, res.family);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('[AuthCallback Error]', err);
        setError(err.message || 'An unexpected error occurred during Google Sign-In.');
      }
    };

    processAuth();

    return () => {
      isMounted = false;
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
    };
  }, [location]);

  const progressPercentage = step === 1 ? 40 : step === 2 ? 80 : 100;

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] dark:bg-[#0F1117] text-slate-900 dark:text-[#EDEDED] flex flex-col justify-center items-center py-6 sm:py-10 px-3.5 sm:px-6 font-sans selection:bg-[#3ECF8E] selection:text-black transition-colors overflow-hidden">
      {/* Radiant Ambient Background Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[600px] h-[340px] sm:h-[600px] bg-gradient-to-tr from-emerald-500/15 via-[#3ECF8E]/10 to-teal-500/5 dark:from-emerald-500/20 dark:via-[#3ECF8E]/15 dark:to-transparent rounded-full blur-[70px] sm:blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute -bottom-20 right-10 w-64 sm:w-96 h-64 sm:h-96 bg-emerald-500/10 dark:bg-[#3ECF8E]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-md w-full space-y-4 sm:space-y-6 z-10">
        {/* Brand Logo Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center justify-center gap-2.5 group">
            <DastavejLogo size={44} />
            <div className="text-left">
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-slate-900 dark:text-white block leading-none">
                Dastavej
              </span>
              <span className="text-[9px] sm:text-[10px] font-semibold text-emerald-600 dark:text-[#3ECF8E] tracking-wider uppercase">
                Family Security Space
              </span>
            </div>
          </Link>
        </div>

        {/* Main Content Card */}
        {error ? (
          /* Error State with Smooth Action Options */
          <div className="bg-white/95 dark:bg-[#16181F]/95 backdrop-blur-2xl rounded-3xl p-5 sm:p-8 border border-red-200 dark:border-red-900/50 shadow-2xl space-y-4 text-center transition-all">
            <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto ring-8 ring-red-500/5">
              <AlertCircle size={28} />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Authorization Incomplete</h2>
              <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed font-medium">
                {error}
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  hasProcessedRef.current = false;
                  setError('');
                  window.location.reload();
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#2E3340] hover:bg-slate-50 dark:hover:bg-[#20242E] text-slate-700 dark:text-neutral-300 text-xs font-semibold transition-all cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>Retry Sign In</span>
              </button>

              <Link
                to="/auth/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-500/25"
              >
                <span>Return to Login</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ) : (
          /* High-End, Attractive & Friendly Security Loader */
          <div className="bg-white/95 dark:bg-[#16181F]/95 backdrop-blur-2xl rounded-3xl p-5 sm:p-8 border border-emerald-500/20 dark:border-white/10 shadow-2xl shadow-emerald-500/10 space-y-5 sm:space-y-6 transition-all">
            
            {/* Animated Vault Emblem */}
            <div className="relative flex items-center justify-center mx-auto w-20 h-20 sm:w-24 sm:h-24 my-1">
              {/* Ripple aura waves */}
              <div className="absolute w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-emerald-500/15 dark:bg-[#3ECF8E]/15 animate-ping opacity-60" />
              <div className="absolute w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-emerald-500/20 dark:bg-[#3ECF8E]/20 animate-pulse" />

              {/* Central Glowing Shield */}
              <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-700 ${
                isUnlocked
                  ? 'bg-gradient-to-br from-emerald-400 via-[#3ECF8E] to-teal-400 text-white shadow-emerald-500/40 scale-105'
                  : 'bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white shadow-emerald-900/30'
              }`}>
                {isUnlocked ? (
                  <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white animate-bounce" />
                ) : (
                  <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                )}

                {/* Animated Floating Lock Indicator */}
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-[#16181F] shadow-md transition-all duration-500 ${
                  isUnlocked
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white dark:bg-[#20242E] text-emerald-600 dark:text-[#3ECF8E]'
                }`}>
                  {isUnlocked ? (
                    <Unlock size={12} strokeWidth={3} className="text-white" />
                  ) : (
                    <Lock size={12} strokeWidth={2.8} />
                  )}
                </div>
              </div>
            </div>

            {/* Dynamic Status Display */}
            <div className="text-center space-y-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-2">
                <span>{isUnlocked ? 'Vault Unlocked! 🎉' : 'Opening Family Vault'}</span>
              </h2>

              {/* Status Pill */}
              <div className="inline-flex max-w-full items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-[#3ECF8E] text-[11px] sm:text-xs font-semibold shadow-xs">
                <span className={`w-2 h-2 rounded-full shrink-0 ${isUnlocked ? 'bg-emerald-500' : 'bg-[#10B981] dark:bg-[#3ECF8E] animate-pulse'}`} />
                <span className="font-mono tracking-tight truncate">{status}</span>
              </div>
            </div>

            {/* Milestone Handshake Cards */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 text-left">
              {/* Step 1: Google Identity */}
              <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border transition-all duration-300 ${
                step >= 1
                  ? 'bg-emerald-500/10 border-emerald-500/30 dark:border-emerald-500/30 shadow-xs'
                  : 'bg-slate-50 dark:bg-[#1E222B] border-slate-200 dark:border-transparent opacity-40'
              }`}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-[#3ECF8E]">
                    Step 1
                  </span>
                  {step > 1 ? (
                    <CheckCircle2 size={12} className="text-emerald-500" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </div>
                <p className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  Google Auth
                </p>
                <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5">
                  Verified ✓
                </p>
              </div>

              {/* Step 2: Zero-Knowledge Handshake */}
              <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border transition-all duration-300 ${
                step >= 2
                  ? 'bg-emerald-500/10 border-emerald-500/30 dark:border-emerald-500/30 shadow-xs'
                  : 'bg-slate-50 dark:bg-[#1E222B] border-slate-200 dark:border-transparent opacity-40'
              }`}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-[#3ECF8E]">
                    Step 2
                  </span>
                  {step > 2 ? (
                    <CheckCircle2 size={12} className="text-emerald-500" />
                  ) : step === 2 ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-neutral-600" />
                  )}
                </div>
                <p className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  Key Sync
                </p>
                <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5">
                  AES-256
                </p>
              </div>

              {/* Step 3: Vault Ready */}
              <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border transition-all duration-300 ${
                step >= 3
                  ? 'bg-emerald-500/10 border-emerald-500/30 dark:border-emerald-500/30 shadow-xs'
                  : 'bg-slate-50 dark:bg-[#1E222B] border-slate-200 dark:border-transparent opacity-40'
              }`}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-[#3ECF8E]">
                    Step 3
                  </span>
                  {step >= 3 ? (
                    <CheckCircle2 size={12} className="text-emerald-500" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-neutral-600" />
                  )}
                </div>
                <p className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  Vault Ready
                </p>
                <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5">
                  Dashboard
                </p>
              </div>
            </div>

            {/* Glowing Laser Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-1.5 sm:h-2 rounded-full bg-slate-100 dark:bg-[#222733] overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-[#3ECF8E] to-teal-400 rounded-full transition-all duration-500 ease-out shadow-sm shadow-emerald-500/50"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 dark:text-neutral-400 font-semibold">
                <span className="flex items-center gap-1">
                  <Lock size={10} className="text-[#10B981] dark:text-[#3ECF8E]" />
                  END-TO-END ENCRYPTED
                </span>
                <span>{progressPercentage}%</span>
              </div>
            </div>

            {/* Manual Friendly Fallback: If browser pauses or takes a few seconds */}
            {showManualFallback && !isUnlocked && (
              <div className="pt-2 animate-fadeIn border-t border-slate-100 dark:border-[#222733] space-y-2">
                <p className="text-[11px] text-slate-500 dark:text-neutral-400 text-center font-medium">
                  Already signed in or taking a moment?
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const hasFamily = Boolean(family?._id || user?.familyId);
                      navigate(hasFamily ? '/dashboard' : '/family/setup', { replace: true });
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                  >
                    <Home size={13} />
                    <span>Go to Dashboard</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await signInWithGoogle();
                      } catch (e) {
                        navigate('/auth/login', { replace: true });
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-[#2E3340] hover:bg-slate-50 dark:hover:bg-[#20242E] text-slate-700 dark:text-neutral-300 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <RefreshCw size={12} />
                    <span>Re-authenticate</span>
                  </button>
                </div>
              </div>
            )}

            {/* Trust & Compliance Micro-Badges */}
            <div className="pt-1 flex items-center justify-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] font-mono text-slate-400 dark:text-neutral-400">
              <span className="flex items-center gap-1">
                <Check size={11} className="text-emerald-500" />
                ISO-27001
              </span>
              <span>•</span>
              <span>ZERO KNOWLEDGE</span>
              <span>•</span>
              <span>GOOGLE VERIFIED</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
