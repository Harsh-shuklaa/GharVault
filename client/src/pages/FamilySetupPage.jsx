import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Shield,
  Home,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Check,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  KeyRound,
  Users,
  Sun,
  Moon,
  Lock,
  FileText,
  HeartPulse,
  Mic,
  Share2,
  Zap
} from 'lucide-react';
import DastavejLogo from '../components/common/DastavejLogo';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Common Indian joint & nuclear family relationship presets
const RELATIONSHIP_OPTIONS = [
  { id: 'Father', label: 'Papa (Father)', icon: '👨' },
  { id: 'Mother', label: 'Mummy (Mother)', icon: '👩' },
  { id: 'Spouse', label: 'Spouse (Pati/Patni)', icon: '💍' },
  { id: 'Son', label: 'Beta (Son)', icon: '👦' },
  { id: 'Daughter', label: 'Beti (Daughter)', icon: '👧' },
  { id: 'Brother', label: 'Bhai (Brother)', icon: '🧑' },
  { id: 'Sister', label: 'Behan (Sister)', icon: '👧' },
  { id: 'Chacha', label: 'Chacha (Uncle)', icon: '🧔' },
  { id: 'Chachi', label: 'Chachi (Aunt)', icon: '🧕' },
  { id: 'Dada', label: 'Dada (Grandfather)', icon: '👴' },
  { id: 'Dadi', label: 'Dadi (Grandmother)', icon: '👵' },
  { id: 'Member', label: 'Other Member', icon: '👤' },
];

export default function FamilySetupPage() {
  const { user, updateUser, updateFamily, refreshSession } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState(() =>
    location.pathname.includes('/join') || location.search.includes('mode=join') ? 'join' : 'create'
  );
  const [formData, setFormData] = useState({
    name: user?.name ? `${user.name.split(' ')[0]}'s Family Vault` : 'The Sharma Family',
    inviteCode: '',
    memberName: user?.name || '',
    memberEmail: user?.email || '',
    relationship: 'Father',
  });

  const [customRelation, setCustomRelation] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [verifiedFamily, setVerifiedFamily] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-verify invite code when user types 6+ characters
  useEffect(() => {
    const code = formData.inviteCode.trim().toUpperCase();
    if (code.length >= 6) {
      let isMounted = true;
      setVerifyingCode(true);
      api.verifyInviteCode(code)
        .then((res) => {
          if (isMounted) {
            if (res.valid && res.family) {
              setVerifiedFamily(res.family);
              setError('');
            } else {
              setVerifiedFamily(null);
            }
          }
        })
        .catch(() => {
          if (isMounted) setVerifiedFamily(null);
        })
        .finally(() => {
          if (isMounted) setVerifyingCode(false);
        });
      return () => { isMounted = false; };
    } else {
      setVerifiedFamily(null);
    }
  }, [formData.inviteCode]);

  // Quick name suggestion pills
  const nameSuggestions = [
    `${user?.name ? user.name.split(' ')[0] : 'Sharma'} Parivar`,
    `${user?.name ? user.name.split(' ')[user.name.split(' ').length - 1] : 'Sharma'} Household`,
    'Mera Private Digital Safe'
  ];

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Kripya apne parivar vault ka naam enter karein');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await api.setupFamily({
        name: formData.name.trim(),
      });

      if (res.success) {
        if (res.token) {
          localStorage.setItem('gharvault_token', res.token);
        }
        if (res.user && updateUser) updateUser(res.user);
        if (res.family && updateFamily) updateFamily(res.family);
        setSuccessMsg(`"${res.family.name}" vault successfully create ho gaya! Invite code: ${res.family.inviteCode}`);
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Vault setup karne me samasya aayi');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    const cleanCode = formData.inviteCode.trim().toUpperCase();
    if (!cleanCode) {
      setError('Kripya 6-character ka Family Invite Code enter karein');
      return;
    }

    const finalRelationship = showCustomInput && customRelation.trim()
      ? customRelation.trim()
      : formData.relationship;

    try {
      setLoading(true);
      setError('');
      const res = await api.joinFamily({
        inviteCode: cleanCode,
        name: formData.memberName.trim() || user?.name || 'Family Member',
        email: formData.memberEmail.trim() || user?.email,
        relationship: finalRelationship,
      });

      if (res.success) {
        if (res.token) {
          localStorage.setItem('gharvault_token', res.token);
        }
        if (res.user && updateUser) updateUser(res.user);
        if (res.family && updateFamily) updateFamily(res.family);
        setSuccessMsg(`Badhai ho! Aap "${res.family.name}" se jud gaye hain as ${finalRelationship}!`);
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Family vault join nahi ho paya. Kripya invite code check karein.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090A0F] text-slate-900 dark:text-[#F8FAFC] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center relative overflow-hidden font-sans selection:bg-sky-500 selection:text-white transition-colors">
      
      {/* Subtle Engineering Dot Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Ambient Top Glows */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-sky-500/10 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[450px] h-[300px] bg-emerald-500/10 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Back Link & Theme Toggle */}
      <div className="absolute top-4 inset-x-4 sm:top-6 sm:inset-x-8 z-20 flex items-center justify-between max-w-6xl mx-auto">
        <Link
          to="/auth/login"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#1E293B] bg-white/80 dark:bg-[#121622]/80 backdrop-blur-md text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
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

      <div className="max-w-5xl mx-auto w-full relative z-10 mt-8 sm:mt-4">
        
        {/* Brand Header */}
        <div className="text-center mb-6 sm:mb-8">
          <Link to="/" className="inline-flex items-center justify-center gap-2.5 mb-3 group">
            <DastavejLogo size={42} showWordmark={true} />
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Setup Wizard
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {mode === 'create' ? 'Create Your Family Safe' : 'Join Your Family Safe'}
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            {mode === 'create'
              ? 'Bas ek naam chuniye aur aapka 256-bit encrypted parivar safe tayar ho jayega.'
              : 'Ghar ke admin se mila invite code enter karke safe se jud jayein.'}
          </p>
        </div>

        {/* ================= 2-COLUMN RESPONSIVE WORKSPACE (DESKTOP + MOBILE) ================= */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
          
          {/* LEFT COLUMN: Main Form & Tabs (7 Columns on Desktop, Full Width on Mobile) */}
          <div className="lg:col-span-7">
            <div className="bg-white dark:bg-[#121622] rounded-2xl shadow-xl dark:shadow-2xl border border-slate-200 dark:border-[#1E293B] overflow-hidden transition-colors">
              
              {/* Segmented 2-Mode Tab Switcher */}
              <div className="grid grid-cols-2 p-1.5 bg-slate-100 dark:bg-[#0B0F19] border-b border-slate-200 dark:border-[#1E293B]">
                <button
                  onClick={() => {
                    setMode('create');
                    setError('');
                    setSuccessMsg('');
                  }}
                  className={`py-2.5 px-3 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    mode === 'create'
                      ? 'bg-white dark:bg-[#182030] text-slate-900 dark:text-sky-400 shadow-xs border border-slate-200/60 dark:border-sky-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Home className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                  <span>Naya Vault Banayein</span>
                </button>
                <button
                  onClick={() => {
                    setMode('join');
                    setError('');
                    setSuccessMsg('');
                  }}
                  className={`py-2.5 px-3 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    mode === 'join'
                      ? 'bg-white dark:bg-[#182030] text-slate-900 dark:text-sky-400 shadow-xs border border-slate-200/60 dark:border-sky-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <UserPlus className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                  <span>Invite Code Se Judein</span>
                </button>
              </div>

              <div className="p-5 sm:p-7">
                {/* Feedback Alerts */}
                {error && (
                  <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                    <span>{error}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* ================= OPTION 1: CREATE NEW VAULT ================= */}
                {mode === 'create' ? (
                  <form onSubmit={handleCreate} className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                        Aapke Parivar Ka Naam (Family Vault Name) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] focus:border-sky-500 dark:focus:border-sky-500 focus:outline-none text-[16px] sm:text-sm font-semibold text-slate-900 dark:text-white transition-colors"
                        placeholder="e.g. The Sharma Family, Verma Household"
                      />

                      {/* 1-Tap Quick Name Suggestions */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="text-[11px] text-slate-400 mr-1">Suggestions:</span>
                        {nameSuggestions.map((sug, idx) => (
                          <button
                            type="button"
                            key={idx}
                            onClick={() => setFormData({ ...formData, name: sug })}
                            className="px-3 py-1.5 min-h-[36px] rounded-lg bg-slate-100 dark:bg-[#161B26] hover:bg-slate-200 dark:hover:bg-[#1E2535] border border-slate-200 dark:border-[#262F40] text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer active:scale-95"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Mobile-only Preview Card (Desktop has large side panel) */}
                    <div className="lg:hidden p-4 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] relative overflow-hidden">
                      <div className="text-[10px] uppercase font-mono tracking-wider text-sky-500 mb-1 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" /> Dashboard Preview
                      </div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {formData.name.trim() || 'Aapka Parivar Safe'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>Admin: {user?.name || 'Aap'}</span>
                        <span>•</span>
                        <span className="text-emerald-500 font-medium flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> 256-Bit Encrypted
                        </span>
                      </div>
                    </div>

                    {/* Free Tier Guarantee Badge */}
                    <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/30 text-xs text-emerald-900 dark:text-emerald-300 flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] leading-relaxed">
                        <strong>100% Free Forever:</strong> Unlimited family members add karein, private storage locker payein, aur emergency medical share karein bina kisi credit card ke.
                      </p>
                    </div>

                    {/* Primary Action Button (Solid White SafePaper Style - 48px Height) */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full min-h-[48px] py-3.5 px-5 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-950 font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                      <span>{loading ? 'Creating Family Safe...' : 'Create Family Safe & Continue'}</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  </form>
                ) : (
                  /* ================= OPTION 2: JOIN WITH INVITE CODE ================= */
                  <form onSubmit={handleJoin} className="space-y-5">
                    {/* Invite Code Box */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        Family Invite Code *
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-sky-500 dark:text-sky-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={formData.inviteCode}
                          onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value.toUpperCase() })}
                          className="w-full min-h-[48px] pl-10 pr-3 py-3 rounded-xl border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] focus:border-sky-500 text-[16px] sm:text-sm font-mono font-bold tracking-widest text-slate-900 dark:text-white uppercase transition-colors"
                          placeholder="e.g. GHAR-8578"
                        />
                        {verifyingCode && (
                          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-sky-400 flex items-center gap-1 font-mono">
                            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                            <span>Checking...</span>
                          </div>
                        )}
                      </div>

                      {/* Verified Family & Admin Banner */}
                      {verifiedFamily && (
                        <div className="mt-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs flex items-center justify-between animate-fadeIn">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-emerald-400">
                                Verified: {verifiedFamily.name}
                              </div>
                              <div className="text-[11px] text-slate-300">
                                Vault Admin: <strong className="text-white">{verifiedFamily.adminName}</strong>
                              </div>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 shrink-0">
                            Match Found
                          </span>
                        </div>
                      )}

                      {!verifiedFamily && !verifyingCode && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          Ghar ke admin dwara diya gaya 6-character code enter karein.
                        </p>
                      )}
                    </div>

                    {/* Name Input */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        Aapka Naam (Your Full Name) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.memberName}
                        onChange={(e) => setFormData({ ...formData, memberName: e.target.value })}
                        className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] focus:border-sky-500 text-[16px] sm:text-xs font-semibold text-slate-900 dark:text-white transition-colors"
                        placeholder="jaise Priya Sharma, Rajesh Kumar"
                      />
                    </div>

                    {/* Relationship Selection (Dynamic Admin-Anchored Relations) */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          {verifiedFamily?.adminName
                            ? `Aapka ${verifiedFamily.adminName} Se Kya Rishta Hai? *`
                            : 'Parivar Se Rishta (Choose Relationship) *'}
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowCustomInput(!showCustomInput)}
                          className="text-[11px] text-sky-500 hover:text-sky-400 underline font-medium cursor-pointer"
                        >
                          {showCustomInput ? 'Choose from list' : '+ Kuch aur (Custom)'}
                        </button>
                      </div>

                      {showCustomInput ? (
                        <input
                          type="text"
                          value={customRelation}
                          onChange={(e) => setCustomRelation(e.target.value)}
                          placeholder="jaise Mama, Bhabhi, Nanad, Jija ji, Tauji"
                          className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] focus:border-sky-500 text-[16px] sm:text-xs font-semibold text-slate-900 dark:text-white transition-colors"
                        />
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {RELATIONSHIP_OPTIONS.map((rel) => {
                            const isSelected = formData.relationship === rel.id;
                            const dynamicLabel = verifiedFamily?.adminName
                              ? (rel.id === 'Father' ? 'Unke Papa'
                                : rel.id === 'Mother' ? 'Unki Mummy'
                                : rel.id === 'Spouse' ? 'Unki Patni/Pati'
                                : rel.id === 'Son' ? 'Unka Beta'
                                : rel.id === 'Daughter' ? 'Unki Beti'
                                : rel.id === 'Brother' ? 'Unke Bhai'
                                : rel.id === 'Sister' ? 'Unki Behan'
                                : rel.id === 'Chacha' ? 'Unke Chacha'
                                : rel.id === 'Chachi' ? 'Unki Chachi'
                                : rel.id === 'Dada' ? 'Unke Dada'
                                : rel.id === 'Dadi' ? 'Unki Dadi'
                                : rel.label)
                              : rel.label;

                            return (
                              <button
                                type="button"
                                key={rel.id}
                                onClick={() => setFormData({ ...formData, relationship: rel.id })}
                                className={`p-2.5 min-h-[48px] rounded-xl text-xs font-medium border text-left flex items-center justify-between gap-2 transition-all cursor-pointer active:scale-95 ${
                                  isSelected
                                    ? 'bg-sky-500/10 border-sky-500 text-sky-400 font-bold shadow-xs ring-1 ring-sky-500/30'
                                    : 'bg-slate-50 dark:bg-[#0B0F19] border-slate-200 dark:border-[#1E293B] text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className="text-base shrink-0">{rel.icon}</span>
                                  <span className="truncate">{dynamicLabel}</span>
                                </div>
                                {isSelected && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Primary Join Action Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full min-h-[48px] py-3.5 px-5 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-950 font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 mt-2"
                    >
                      <UserPlus className="w-4 h-4 text-sky-400 dark:text-sky-600" />
                      <span>{loading ? 'Joining Family Vault...' : 'Join Family Safe & Continue'}</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  </form>
                )}

                {/* Bottom Footer Note */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#1E293B] text-center text-xs text-slate-500 dark:text-slate-400">
                  Already have an active vault?{' '}
                  <Link to="/dashboard" className="font-bold text-sky-500 dark:text-sky-400 hover:underline">
                    Go to Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: LIVE DESKTOP SHOWCASE (Visible on lg+ screens) ================= */}
          <div className="hidden lg:flex lg:col-span-5 flex-col gap-5 sticky top-24">
            
            {/* Live Interactive Vault Card Showcase */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200 dark:border-[#1E293B] shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-[#1E293B]">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-sky-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Live Vault Simulation</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  AES-256 Armed
                </span>
              </div>

              {/* Simulated Dashboard Header */}
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                  {mode === 'create'
                    ? (formData.name.trim() || 'The Sharma Family Vault')
                    : 'Family Vault Sync'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {mode === 'create'
                    ? `Admin: ${user?.name || 'Aap'} • Sovereign Household Locker`
                    : `Linking: ${formData.memberName || 'Aap'} as ${showCustomInput && customRelation ? customRelation : formData.relationship}`}
                </p>
              </div>

              {/* Simulated 4 Quick Document Slots */}
              <div className="mt-5 space-y-2.5">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Essential Documents Radar</span>
                  <span className="text-sky-400">Ready to Ingest</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#090A0F] border border-slate-200 dark:border-[#1E293B] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-sky-400" />
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">Aadhaar & PAN Cards</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">AI auto-extracts numbers & DOB</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-sky-500/10 text-sky-400 font-mono">OCR Ready</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#090A0F] border border-slate-200 dark:border-[#1E293B] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <HeartPulse className="w-4 h-4 text-red-400" />
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">Emergency Medical Card</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Blood group & Health insurance policy</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/10 text-red-400 font-mono">1-Tap SOS</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#090A0F] border border-slate-200 dark:border-[#1E293B] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">Expiry Renewal Radar</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Passport, DL & Vehicle Insurance alerts</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 font-mono">Push Alerts</span>
                </div>
              </div>

              {/* Bottom Feature Pill Row */}
              <div className="mt-5 pt-4 border-t border-slate-200 dark:border-[#1E293B] flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 text-emerald-500">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ₹0 Cloud Cost
                </span>
                <span className="flex items-center gap-1 text-sky-400">
                  <Mic className="w-3.5 h-3.5" /> Voice AI Ready
                </span>
                <span className="flex items-center gap-1 text-purple-400">
                  <Share2 className="w-3.5 h-3.5" /> 24h Safe Share
                </span>
              </div>
            </div>

            {/* Desktop Quick Guarantee Card */}
            <div className="p-4 rounded-xl bg-[#090A0F]/80 border border-[#1E293B] text-xs text-slate-400 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <p className="leading-relaxed text-[11px]">
                Aapke documents Supabase ke private encrypted bucket me rehte hain. Bina signed token ke unhe internet se download nahi kiya ja sakta.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
