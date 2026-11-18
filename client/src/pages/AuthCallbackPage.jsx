import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Shield, AlertCircle, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshSession } = useAuth();
  const [status, setStatus] = useState('Connecting to Supabase...');
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const processAuthCallback = async () => {
      try {
        // Check for error parameters in URL (from Supabase / Google OAuth)
        const params = new URLSearchParams(location.search);
        const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));
        const oauthError = params.get('error') || hashParams.get('error');
        const oauthErrorDesc = params.get('error_description') || hashParams.get('error_description');

        if (oauthError) {
          throw new Error(oauthErrorDesc || `Authentication failed: ${oauthError}`);
        }

        setStatus('Verifying Google OAuth session...');

        let activeSession = null;

        if (isSupabaseConfigured && supabase) {
          // If PKCE code exists in query params, exchange it for session
          const code = params.get('code');
          if (code) {
            setStatus('Exchanging authorization code...');
            const { data: codeData, error: codeErr } = await supabase.auth.exchangeCodeForSession(code);
            if (codeErr) {
              console.warn('[AuthCallback] exchangeCodeForSession notice:', codeErr.message);
            } else if (codeData?.session) {
              activeSession = codeData.session;
            }
          }

          // Check current active session
          if (!activeSession) {
            const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
            if (sessionErr) {
              console.warn('[AuthCallback] getSession notice:', sessionErr.message);
            }
            if (session) {
              activeSession = session;
            }
          }

          // If still waiting, set a listener onAuthStateChange for SIGNED_IN event
          if (!activeSession) {
            setStatus('Synchronizing encrypted session credentials...');
            await new Promise((resolve) => {
              const timer = setTimeout(resolve, 2000);
              const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
                  activeSession = session;
                  clearTimeout(timer);
                  subscription?.unsubscribe();
                  resolve();
                }
              });
            });
          }
        }

        if (!activeSession?.user) {
          // Check if local session token already exists
          const existingToken = localStorage.getItem('gharvault_token');
          if (existingToken) {
            const meRes = await api.getMe();
            if (meRes?.user) {
              await refreshSession();
              navigate(meRes.user.familyId ? '/dashboard' : '/family/setup', { replace: true });
              return;
            }
          }

          throw new Error('No active Google authentication session was detected. Please try signing in again.');
        }

        const authUser = activeSession.user;
        setStatus('Syncing family vault profile with MongoDB...');

        const syncData = {
          email: authUser.email,
          name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email.split('@')[0],
          avatar: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
          googleId: authUser.id,
        };

        const res = await api.syncAuth(syncData);

        if (!res?.token) {
          throw new Error(res?.error || 'Failed to synchronize user session with GharVault backend.');
        }

        localStorage.setItem('gharvault_token', res.token);
        await refreshSession();

        setStatus('Success! Redirecting to your family vault...');

        if (!isMounted) return;

        // Redirect: New user with no family -> /family/setup, Returning user with family -> /dashboard
        const hasFamily = Boolean(res.family?._id || res.user?.familyId);
        if (res.isNewUser || !hasFamily) {
          navigate('/family/setup', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('[AuthCallback Error]', err);
        setError(err.message || 'An unexpected error occurred during Google Sign-In.');
      }
    };

    processAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [retryCount, location]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#121212] text-slate-900 dark:text-[#EDEDED] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#3ECF8E] selection:text-black transition-colors">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Brand Shield */}
        <Link to="/" className="inline-flex items-center justify-center gap-2.5 group">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-[#1C1C1C] border border-emerald-200 dark:border-[#2E2E2E] group-hover:border-[#10B981] dark:group-hover:border-[#3ECF8E]/50 flex items-center justify-center shadow-sm transition-colors">
            <Shield className="w-6 h-6 text-[#10B981] dark:text-[#3ECF8E] stroke-[2.2]" />
          </div>
          <span className="font-semibold text-2xl tracking-tight text-slate-900 dark:text-[#EDEDED]">
            GharVault
          </span>
        </Link>

        {error ? (
          /* Error State */
          <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-6 sm:p-8 border border-red-200 dark:border-red-900/40 shadow-xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <AlertCircle size={30} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Authentication Unsuccessful</h2>
              <p className="text-xs text-red-600 dark:text-red-400 mt-2 leading-relaxed font-medium">
                {error}
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => { setError(''); setRetryCount(prev => prev + 1); }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-[#2E2E2E] hover:bg-slate-50 dark:hover:bg-[#262626] text-slate-700 dark:text-neutral-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>Retry Authorization</span>
              </button>

              <Link
                to="/auth/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] text-xs font-bold transition-all shadow-sm"
              >
                <span>Return to Sign In</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ) : (
          /* Loading State */
          <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-8 border border-slate-200 dark:border-[#2E2E2E] shadow-xl space-y-5">
            <div className="relative flex items-center justify-center mx-auto w-16 h-16">
              <div className="w-16 h-16 border-3 border-[#10B981]/20 dark:border-[#3ECF8E]/20 rounded-full" />
              <div className="absolute inset-0 w-16 h-16 border-3 border-[#10B981] dark:border-[#3ECF8E] border-t-transparent rounded-full animate-spin" />
              <Shield className="w-7 h-7 text-[#10B981] dark:text-[#3ECF8E] absolute animate-pulse" />
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Connecting to Family Vault
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#8F8F8F] mt-1.5 font-medium animate-pulse">
                {status}
              </p>
            </div>

            <div className="pt-2 text-[11px] text-slate-400 dark:text-[#666] font-mono">
              Zero-Knowledge AES-256 • Supabase Live Session
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
