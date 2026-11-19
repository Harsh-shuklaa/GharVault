import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Shield,
  Lock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Mail,
  Sun,
  Moon,
  KeyRound,
  UserPlus,
  Users,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';

export default function LoginPage() {
  const { loginWithGoogle, refreshSession } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode: 'signin' (Default / Create New Vault) vs 'join' (Join with Invite Code)
  const [authMode, setAuthMode] = useState('signin');

  // Sign In inputs
  const [emailInput, setEmailInput] = useState('');

  // Join inputs
  const [inviteCode, setInviteCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinEmail, setJoinEmail] = useState('');
  const [relationship, setRelationship] = useState('Member');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  // --- TAB 1: Normal Sign In / Create New Vault Handlers ---
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccessMsg('');
      // Clean any leftover pending invites
      sessionStorage.removeItem('pending_invite_code');
      sessionStorage.removeItem('pending_invite_relation');
      sessionStorage.removeItem('pending_invite_name');

      const res = await loginWithGoogle();
      if (res?.token) {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    try {
      setLoading(true);
      setError('');
      setSuccessMsg('');
      sessionStorage.removeItem('pending_invite_code');
      sessionStorage.removeItem('pending_invite_relation');
      sessionStorage.removeItem('pending_invite_name');

      const res = await loginWithGoogle(emailInput.trim());
      if (res?.token) {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Failed to sign in with email');
    } finally {
      setLoading(false);
    }
  };

  // --- TAB 2: Join with Family Invite Code Handlers ---
  const handleGoogleJoin = async () => {
    const cleanCode = inviteCode.trim().toUpperCase();
    if (!cleanCode) {
      setError('Please enter your 6-character Family Invite Code (e.g. GHAR-8578)');
      return;
    }

    try {
      setLoading(true);
      setError('');
      // Store in BOTH localStorage and sessionStorage so it never gets wiped by cross-domain OAuth redirects!
      localStorage.setItem('pending_invite_code', cleanCode);
      localStorage.setItem('pending_invite_relation', relationship);
      if (joinName.trim()) {
        localStorage.setItem('pending_invite_name', joinName.trim());
      }
      sessionStorage.setItem('pending_invite_code', cleanCode);
      sessionStorage.setItem('pending_invite_relation', relationship);
      if (joinName.trim()) {
        sessionStorage.setItem('pending_invite_name', joinName.trim());
      }

      await loginWithGoogle();
    } catch (err) {
      setError(err.message || 'Google authentication failed');
      setLoading(false);
    }
  };

  const handleEmailJoin = async (e) => {
    e.preventDefault();
    const cleanCode = inviteCode.trim().toUpperCase();
    if (!cleanCode) {
      setError('Please enter your 6-character Family Invite Code (e.g. GHAR-8578)');
      return;
    }
    if (!joinEmail || !joinEmail.includes('@')) {
      setError('Please enter your email address to link your profile');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccessMsg('');

      const res = await api.joinFamily({
        inviteCode: cleanCode,
        name: joinName.trim() || joinEmail.split('@')[0],
        email: joinEmail.trim().toLowerCase(),
        relationship,
      });

      if (res.error) {
        throw new Error(res.error);
      }

      if (res.token) {
        localStorage.setItem('gharvault_token', res.token);
      }

      setSuccessMsg(`Successfully joined ${res.family?.name || 'the family vault'}! Redirecting...`);
      await refreshSession();

      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 800);
    } catch (err) {
      setError(err.message || 'Failed to join family. Please verify the invite code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#121212] text-slate-900 dark:text-[#EDEDED] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans selection:bg-[#3ECF8E] selection:text-black transition-colors">
      {/* Top Bar with Theme Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          className="w-9 h-9 rounded-xl border border-slate-200 dark:border-[#2E2E2E] bg-white dark:bg-[#1C1C1C] hover:bg-slate-100 dark:hover:bg-[#262626] text-slate-600 dark:text-[#3ECF8E] flex items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          {isDark ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
        </button>
      </div>

      {/* Decorative Subtle Emerald Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[320px] bg-emerald-500/5 dark:bg-[#3ECF8E]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <Link to="/" className="inline-flex items-center justify-center gap-2.5 mb-5 group">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-[#1C1C1C] border border-emerald-200 dark:border-[#2E2E2E] group-hover:border-[#10B981] dark:group-hover:border-[#3ECF8E]/50 flex items-center justify-center shadow-xs transition-colors">
            <Shield className="w-6 h-6 text-[#10B981] dark:text-[#3ECF8E] stroke-[2.2]" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-slate-900 dark:text-[#EDEDED]">
            GharVault
          </span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-[#EDEDED]">
          {authMode === 'signin' ? 'Welcome to Your Family Space' : 'Join Your Family Vault'}
        </h2>
        <p className="mt-1 text-xs text-slate-600 dark:text-[#8F8F8F]">
          {authMode === 'signin'
            ? 'Access your private vault or create a brand new encrypted family safe.'
            : 'Enter the invite code shared by your family admin to link your account.'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white dark:bg-[#1C1C1C] py-6 px-6 sm:px-7 shadow-xl dark:shadow-2xl rounded-2xl border border-slate-200 dark:border-[#2E2E2E] space-y-5 transition-colors">
          
          {/* TWO-MODE TAB SWITCHER */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-[#141414] border border-slate-200/80 dark:border-[#262626]">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setError('');
                setSuccessMsg('');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'signin'
                  ? 'bg-white dark:bg-[#1F1F1F] text-slate-900 dark:text-white shadow-xs border border-slate-200/60 dark:border-[#333]'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Shield size={14} className={authMode === 'signin' ? 'text-[#10B981] dark:text-[#3ECF8E]' : ''} />
              <span>Sign In / Create</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('join');
                setError('');
                setSuccessMsg('');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'join'
                  ? 'bg-white dark:bg-[#1F1F1F] text-slate-900 dark:text-white shadow-xs border border-slate-200/60 dark:border-[#333]'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <KeyRound size={14} className={authMode === 'join' ? 'text-[#10B981] dark:text-[#3ECF8E]' : ''} />
              <span>Join with Invite Code</span>
            </button>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-[#3ECF8E] text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#10B981] dark:text-[#3ECF8E]" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ================= TAB 1: SIGN IN / CREATE NEW VAULT ================= */}
          {authMode === 'signin' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-[#8F8F8F] text-center leading-relaxed">
                Sign in with your Google account. Zero passwords to remember, 100% encrypted & free.
              </p>

              {/* Single Prominent One-Click Google Login Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-5 border border-slate-300 dark:border-[#2E2E2E] hover:border-[#10B981] dark:hover:border-[#3ECF8E]/60 rounded-xl bg-white dark:bg-[#171717] hover:bg-slate-50 dark:hover:bg-[#202020] text-slate-800 dark:text-[#EDEDED] font-semibold text-sm shadow-xs transition-all cursor-pointer group disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{loading ? 'Authenticating with Google...' : 'Continue with Google'}</span>
              </button>

              {/* Direct Email Sign-In Option */}
              <div className="pt-3 border-t border-slate-200 dark:border-[#262626]">
                <form onSubmit={handleEmailLogin} className="space-y-2.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#8F8F8F]">
                    Or sign in with email
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="w-4 h-4 text-slate-400 dark:text-[#8F8F8F] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#2E2E2E] bg-white dark:bg-[#141414] text-xs text-slate-900 dark:text-[#EDEDED] placeholder-slate-400 dark:placeholder-[#555] focus:border-[#10B981] dark:focus:border-[#3ECF8E] focus:outline-none transition-colors"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading || !emailInput}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-[#2E2E2E] dark:hover:bg-[#383838] text-white dark:text-[#EDEDED] text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Sign In
                    </button>
                  </div>
                </form>
              </div>

              <div className="pt-2 text-center space-y-1">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-[#8F8F8F] font-medium">
                  <Lock className="w-3.5 h-3.5 text-[#10B981] dark:text-[#3ECF8E]" />
                  <span>End-to-End Encrypted Sovereign Vault</span>
                </span>
                <p className="text-[11px] text-slate-500 dark:text-neutral-500 leading-relaxed">
                  First time here? Logging in will create your private family vault with 0 documents.
                </p>
              </div>
            </div>
          ) : (
            /* ================= TAB 2: JOIN WITH INVITE CODE ================= */
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-[#8F8F8F] leading-relaxed">
                Connect your account to your family's vault. Enter the 6-character code provided by your family head.
              </p>

              <div className="space-y-3">
                {/* Invite Code Input */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1">
                    Family Invite Code <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-emerald-600 dark:text-[#3ECF8E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      placeholder="e.g. GHAR-8578"
                      maxLength={12}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#2E2E2E] bg-white dark:bg-[#141414] font-mono font-bold text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-600 focus:border-[#10B981] dark:focus:border-[#3ECF8E] focus:outline-none transition-colors uppercase tracking-wider"
                    />
                  </div>
                </div>

                {/* Relationship Dropdown */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1">
                    Relationship to Family
                  </label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#2E2E2E] bg-white dark:bg-[#141414] text-xs text-slate-900 dark:text-white focus:border-[#10B981] dark:focus:border-[#3ECF8E] focus:outline-none transition-colors"
                  >
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Spouse">Spouse (Wife/Husband)</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Member">Family Member</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Name Input */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1">
                    Your Full Name <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={joinName}
                    onChange={(e) => setJoinName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#2E2E2E] bg-white dark:bg-[#141414] text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-600 focus:border-[#10B981] dark:focus:border-[#3ECF8E] focus:outline-none transition-colors"
                  />
                </div>

                {/* Continue with Google to Join */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleGoogleJoin}
                    disabled={loading || !inviteCode.trim()}
                    className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-slate-300 dark:border-[#2E2E2E] hover:border-[#10B981] dark:hover:border-[#3ECF8E] rounded-xl bg-white dark:bg-[#171717] hover:bg-slate-50 dark:hover:bg-[#202020] text-slate-800 dark:text-[#EDEDED] font-semibold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>{loading ? 'Joining Family Vault...' : 'Join with Google'}</span>
                  </button>
                </div>

                {/* Or Join with Direct Email */}
                <div className="pt-3 border-t border-slate-200 dark:border-[#262626]">
                  <form onSubmit={handleEmailJoin} className="space-y-2">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#8F8F8F]">
                      Or join with email address
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Mail className="w-4 h-4 text-slate-400 dark:text-[#8F8F8F] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="email"
                          value={joinEmail}
                          onChange={(e) => setJoinEmail(e.target.value)}
                          placeholder="your.email@example.com"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#2E2E2E] bg-white dark:bg-[#141414] text-xs text-slate-900 dark:text-[#EDEDED] placeholder-slate-400 dark:placeholder-[#555] focus:border-[#10B981] dark:focus:border-[#3ECF8E] focus:outline-none transition-colors"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading || !inviteCode.trim() || !joinEmail}
                        className="px-4 py-2.5 rounded-xl bg-[#10B981] hover:bg-emerald-600 dark:bg-[#3ECF8E] dark:hover:bg-[#34B27B] text-white dark:text-black text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                      >
                        Join Vault
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
