import React, { useState, useEffect } from 'react';
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
  Sparkles,
  ArrowLeft,
  Fingerprint
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import DastavejLogo from '../components/common/DastavejLogo';
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

  useEffect(() => {
    try {
      const wasLoggedOut = sessionStorage.getItem('gharvault_logged_out');
      if (wasLoggedOut) {
        sessionStorage.removeItem('gharvault_logged_out');
        setSuccessMsg('Aapka session securely lock ho gaya hai. Dobara access ke liye login karein.');
      }
    } catch (e) {}
  }, []);

  // --- TAB 1: Normal Sign In / Create New Vault Handlers ---
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccessMsg('');
      sessionStorage.removeItem('pending_invite_code');
      sessionStorage.removeItem('pending_invite_relation');
      sessionStorage.removeItem('pending_invite_name');

      const res = await loginWithGoogle();
      if (res?.token) {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Google authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes('@')) {
      setError('Kripya ek valid email address enter karein');
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
        const hasFamily = Boolean(res.family?._id || res.user?.familyId);
        navigate(hasFamily ? from : '/family/setup', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Email se sign in karne me samasya aayi');
    } finally {
      setLoading(false);
    }
  };

  // --- TAB 2: Join with Family Invite Code Handlers ---
  const handleGoogleJoin = async () => {
    const cleanCode = inviteCode.trim().toUpperCase();
    if (!cleanCode) {
      setError('Kripya apna Family Invite Code enter karein (jaise GHAR-8578)');
      return;
    }

    try {
      setLoading(true);
      setError('');
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
      setError('Kripya apna Family Invite Code enter karein (jaise GHAR-8578)');
      return;
    }
    if (!joinEmail || !joinEmail.includes('@')) {
      setError('Apna account link karne ke liye email address darj karein');
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

      setSuccessMsg(`Badhai ho! Aap successfully ${res.family?.name || 'parivar vault'} se jud gaye hain. Redirecting...`);
      await refreshSession();

      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 800);
    } catch (err) {
      setError(err.message || 'Family join karne me samasya aayi. Invite code check karein.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090A0F] text-slate-900 dark:text-[#F8FAFC] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans selection:bg-sky-500 selection:text-white transition-colors">
      
      {/* Subtle Engineering Dot Grid Texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top Ambient Security Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[320px] bg-sky-500/10 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Back Link & Theme Toggle */}
      <div className="absolute top-4 inset-x-4 sm:top-6 sm:inset-x-8 z-20 flex items-center justify-between max-w-5xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#1E293B] bg-white/80 dark:bg-[#121622]/80 backdrop-blur-md text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        <button
          type="button"
          onClick={toggleTheme}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          className="w-9 h-9 rounded-lg border border-slate-200 dark:border-[#1E293B] bg-white/80 dark:bg-[#121622]/80 backdrop-blur-md hover:bg-slate-100 dark:hover:bg-[#1A2234] text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-slate-700" />}
        </button>
      </div>

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mt-6 sm:mt-0">
        <Link to="/" className="inline-flex items-center justify-center gap-2.5 mb-4 group">
          <DastavejLogo size={40} showWordmark={true} />
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {authMode === 'signin' ? 'Welcome to Your Family Space' : 'Join Your Family Vault'}
        </h2>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
          {authMode === 'signin'
            ? 'Apne private digital vault me pravesh karein ya naya secure parivar safe banayein.'
            : 'Apne family head se mila hua invite code enter karke account link karein.'}
        </p>
      </div>

      {/* Main Auth Card (SafePaper Deep Carbon Style) */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white dark:bg-[#121622] py-6 px-5 sm:px-7 rounded-2xl border border-slate-200 dark:border-[#1E293B] shadow-xl dark:shadow-2xl space-y-5 transition-colors">
          
          {/* TWO-MODE TAB SWITCHER (Segmented Pill Capsule) */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-[#0B0F19] border border-slate-200/80 dark:border-[#1E293B]">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setError('');
                setSuccessMsg('');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'signin'
                  ? 'bg-white dark:bg-[#182030] text-slate-900 dark:text-sky-400 shadow-xs border border-slate-200/60 dark:border-sky-500/30'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Shield size={14} className={authMode === 'signin' ? 'text-sky-500 dark:text-sky-400' : ''} />
              <span>Sign In / Create</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('join');
                setError('');
                setSuccessMsg('');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'join'
                  ? 'bg-white dark:bg-[#182030] text-slate-900 dark:text-sky-400 shadow-xs border border-slate-200/60 dark:border-sky-500/30'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <KeyRound size={14} className={authMode === 'join' ? 'text-sky-500 dark:text-sky-400' : ''} />
              <span>Join Family</span>
            </button>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ================= TAB 1: SIGN IN / CREATE NEW VAULT ================= */}
          {authMode === 'signin' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-400 text-center leading-relaxed">
                Apne Google account se sign in karein. Zero passwords, 100% free bank-grade encryption.
              </p>

              {/* High-Contrast One-Click Google Login Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-5 border border-slate-300 dark:border-[#262F40] hover:border-slate-400 dark:hover:border-sky-500/50 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#0B0F19] dark:hover:bg-[#121824] text-slate-800 dark:text-slate-100 font-semibold text-sm shadow-xs transition-all cursor-pointer group active:scale-95 disabled:opacity-50"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
              <div className="pt-3 border-t border-slate-200 dark:border-[#1E293B]">
                <form onSubmit={handleEmailLogin} className="space-y-2.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Ya email se sign in karein
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="apna.email@gmail.com"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-sky-500 dark:focus:border-sky-500 focus:outline-none transition-colors"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading || !emailInput}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-950 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer active:scale-95 shrink-0"
                    >
                      Sign In
                    </button>
                  </div>
                </form>
              </div>

              {/* Zero-Knowledge Security Badge */}
              <div className="pt-2 text-center space-y-1">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <Lock className="w-3.5 h-3.5" />
                  <span>256-Bit Zero-Knowledge Encrypted</span>
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  First time? Sign in karte hi aapka encrypted family safe 0 documents ke sath active ho jayega.
                </p>
              </div>
            </div>
          ) : (
            /* ================= TAB 2: JOIN WITH INVITE CODE ================= */
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Apne family head dwara share kiya gaya 6-character ka code darj karein aur vault se jud jayein.
              </p>

              <div className="space-y-3">
                {/* Invite Code Input */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Family Invite Code <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-sky-500 dark:text-sky-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      placeholder="e.g. GHAR-8578"
                      maxLength={12}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] font-mono font-bold text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:border-sky-500 dark:focus:border-sky-500 focus:outline-none transition-colors uppercase tracking-widest"
                    />
                  </div>
                </div>

                {/* Relationship Dropdown */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Parivar Se Rishta (Relationship)
                  </label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] text-xs text-slate-900 dark:text-white focus:border-sky-500 dark:focus:border-sky-500 focus:outline-none transition-colors"
                  >
                    <option value="Mother">Mummy (Mother)</option>
                    <option value="Father">Papa (Father)</option>
                    <option value="Spouse">Spouse (Pati/Patni)</option>
                    <option value="Son">Beta (Son)</option>
                    <option value="Daughter">Beti (Daughter)</option>
                    <option value="Brother">Bhai (Brother)</option>
                    <option value="Sister">Behan (Sister)</option>
                    <option value="Member">Family Member</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Name Input */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Aapka Naam <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={joinName}
                    onChange={(e) => setJoinName(e.target.value)}
                    placeholder="jaise Priya Sharma"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:border-sky-500 dark:focus:border-sky-500 focus:outline-none transition-colors"
                  />
                </div>

                {/* Continue with Google to Join */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleGoogleJoin}
                    disabled={loading || !inviteCode.trim()}
                    className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-slate-300 dark:border-[#262F40] hover:border-slate-400 dark:hover:border-sky-500/50 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#0B0F19] dark:hover:bg-[#121824] text-slate-800 dark:text-slate-100 font-semibold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-95"
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
                <div className="pt-3 border-t border-slate-200 dark:border-[#1E293B]">
                  <form onSubmit={handleEmailJoin} className="space-y-2">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Ya email address se judein
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="email"
                          value={joinEmail}
                          onChange={(e) => setJoinEmail(e.target.value)}
                          placeholder="apna.email@gmail.com"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-sky-500 dark:focus:border-sky-500 focus:outline-none transition-colors"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading || !inviteCode.trim() || !joinEmail}
                        className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-950 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer active:scale-95 shadow-xs shrink-0"
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

        {/* Security Footnote */}
        <div className="mt-5 text-center flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Fingerprint className="w-4 h-4 text-sky-400" />
          <span>Secured by Sovereign Zero-Knowledge Cryptography</span>
        </div>
      </div>
    </div>
  );
}
