import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  ArrowRight,
  Copy,
  HeartPulse,
  Bell,
  Share2,
  Plus,
  Minus,
  Sparkles,
  Lock,
  Sun,
  Moon,
  CheckCircle2,
  Database,
  Cloud,
  Mic,
  Scan,
  FileCheck,
  Eye,
  Key,
  Smartphone,
  ExternalLink,
  ChevronRight,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import DastavejLogo from '../components/common/DastavejLogo';
import LiveVoiceAiDemoModal from '../components/landing/LiveVoiceAiDemoModal';

export default function LandingPage() {
  const { user, loginWithGoogle } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [activeFaq, setActiveFaq] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [isVoiceDemoOpen, setIsVoiceDemoOpen] = useState(false);
  const [showStickyBottom, setShowStickyBottom] = useState(false);

  // Show floating action button when user scrolls down
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 350) {
        setShowStickyBottom(true);
      } else {
        setShowStickyBottom(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGoogleAuth = async () => {
    if (user) {
      navigate('/dashboard');
      return;
    }
    try {
      setAuthLoading(true);
      await loginWithGoogle();
    } catch (err) {
      console.error('Google login error:', err);
      navigate('/auth/login');
    } finally {
      setAuthLoading(false);
    }
  };

  const faqs = [
    {
      q: 'Dastawez me documents kaise surakshit rehte hain (Zero-Knowledge)?',
      a: 'Aapke saare documents client-side AES-256 bank-grade encryption se secure hote hain. Server par koi bhi document bina private key ke read nahi ho sakta. Sirf aap aur aapke authorized family members hi ise decrypt kar sakte hain.',
    },
    {
      q: 'AI Voice Assistant bina file padhe kaise kaam karta hai?',
      a: 'Hamara AI Assistant metadata aur secure extracted tags par trained hai. Jab aap Hindi ya English me bolte hain ("Mummy ka insurance card dikhao"), bot query ko match karke direct relevant record aapke samne la deta hai bina privacy leak kiye.',
    },
    {
      q: 'Emergency Medical SOS Card hospital me kaise madad karta hai?',
      a: 'Emergency Card button par tap karte hi family ke sabhi members ke Blood Groups, Emergency Contacts, aur Cashless Health Insurance policy details ek screen par aa jate hain, jise hospital reception par turant share kiya ja sakta hai.',
    },
    {
      q: 'Kya Dastawez ke liye koi monthly fees ya credit card chahiye?',
      a: 'Bilkul nahi! Dastawez 100% Free Architecture par build kiya gaya hai. Zero paid subscriptions, zero credit card requirement, aur zero hidden charges.',
    },
    {
      q: 'Temporary 24h Safe Share link kaise kaam karta hai?',
      a: 'Jab aapko CA, hotel ya travel agent ko Aadhaar ya RC bhejni ho, to "Share Safely" button se ek time-limited link banta hai jo 24 ghante baad automatically self-destruct (expire) ho jata hai.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090A0F] text-slate-900 dark:text-[#F8FAFC] font-sans selection:bg-sky-500 selection:text-white transition-colors overflow-x-hidden">
      
      {/* ================= STICKY GLASSMORPHIC NAVBAR ================= */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#090A0F]/90 backdrop-blur-md border-b border-slate-200 dark:border-[#1E293B] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 sm:h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <DastavejLogo size={32} showWordmark={true} />
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-sky-500/10 text-sky-500 border border-sky-500/20">
              v2.5 Pro
            </span>
          </Link>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-600 dark:text-slate-400">
            <a href="#features" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Features
            </a>
            <button
              onClick={() => setIsVoiceDemoOpen(true)}
              className="hover:text-sky-400 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
              <span>Voice AI Demo</span>
            </button>
            <a href="#security" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Security
            </a>
            <a href="#emergency" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Emergency Card
            </a>
            <a href="#faq" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              FAQs
            </a>
          </nav>

          {/* Action Buttons & Theme Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Sun/Moon */}
            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
              className="w-8 h-8 rounded-lg border border-slate-200 dark:border-[#1E293B] bg-slate-100 dark:bg-[#121622] hover:bg-slate-200 dark:hover:bg-[#1A2234] text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer"
            >
              {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-slate-700" />}
            </button>

            {/* Quick Voice Demo Pill (Header) */}
            <button
              onClick={() => setIsVoiceDemoOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-medium transition-all cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Try Voice AI</span>
            </button>

            <Link
              to={user ? "/dashboard" : "/auth/login"}
              className="px-3 sm:px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-[#262F40] hover:border-slate-400 dark:hover:border-slate-500 text-slate-800 dark:text-slate-200 text-xs font-medium transition-colors bg-white dark:bg-[#121622]"
            >
              {user ? "Open Vault" : "Sign In"}
            </Link>

            <Link
              to="/auth/login"
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-950 text-xs font-semibold transition-all shadow-sm active:scale-95"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden border-b border-slate-200 dark:border-[#1E293B]">
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Ambient Top Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-sky-500/10 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[250px] bg-emerald-500/10 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          {/* Top Status Capsule Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100 dark:bg-[#121622] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-[#1E293B] text-xs font-medium mb-6 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">100% Client-Side AES-256</span>
            <span className="text-slate-400">•</span>
            <span>Zero Cloud Leak</span>
            <span className="text-slate-400">•</span>
            <span className="font-mono text-[11px] text-sky-500 dark:text-sky-400">Free Tier</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.15]">
            Aapke Ghar Ke Saare Documents. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-teal-400 to-emerald-400">
              Surakshit. Private. AI Powered.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-4 sm:mt-5 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Aadhaar, PAN, medical records, property papers aur insurance policies ek jagah. Built for Indian families with 
            <strong className="text-slate-900 dark:text-slate-200 font-semibold"> zero-knowledge encryption</strong> and natural Hindi/English voice search.
          </p>

          {/* CTA Buttons (Thumb-Friendly on Mobile) */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto sm:max-w-none">
            {/* Primary Action Button (Solid White SafePaper Style) */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={authLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-950 font-semibold text-sm shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-60"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{authLoading ? "Connecting..." : user ? "Open Dashboard" : "Get Started Free (₹0)"}</span>
              <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-600 transition-transform group-hover:translate-x-1" />
            </button>

            {/* Secondary Voice Demo Button */}
            <button
              type="button"
              onClick={() => setIsVoiceDemoOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#121622] dark:hover:bg-[#1A2234] text-slate-800 dark:text-slate-200 font-medium text-sm border border-slate-300 dark:border-[#262F40] hover:border-sky-500/50 transition-all cursor-pointer active:scale-95 shadow-xs"
            >
              <Mic className="w-4 h-4 text-sky-400 animate-pulse" />
              <span>Try Live Voice AI Demo</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-sky-500/10 text-sky-400 font-mono">Instant</span>
            </button>
          </div>

          {/* Micro Trust Indicators */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Zero Credit Card Required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> No Server Plaintext Storage
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> PWA Offline Compatible
            </span>
          </div>
        </div>
      </section>

      {/* ================= BENTO GRID FEATURE DESKS ================= */}
      <section id="features" className="py-16 sm:py-20 bg-slate-50/50 dark:bg-[#090A0F] border-b border-slate-200 dark:border-[#1E293B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-500 border border-sky-500/20 uppercase tracking-wider">
              <Sparkles className="w-3 h-3" /> Core Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-3">
              Engineered For Modern Indian Families.
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              High-security cryptography combined with intuitive, accessible workflows that even parents can use effortlessly.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            
            {/* Card 1: AI Vision Scanner Desk (Large 2-Col Span on Desktop) */}
            <div className="md:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200 dark:border-[#1E293B] shadow-sm hover:border-sky-500/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                    <Scan className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Gemini 1.5 Flash Vision OCR
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Instant Indian ID Auto-Scanning
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                  Upload ya camera se photo khinchein—Aadhaar, PAN, Passport, Driving License aur utility bills ke numbers, 
                  naam aur expiry dates automatically extract ho jate hain. Zero manual typing.
                </p>
              </div>

              {/* Realistic Laser Scanner Simulation Mockup */}
              <div className="mt-6 p-4 rounded-xl bg-slate-100 dark:bg-[#090A0F] border border-slate-200 dark:border-[#1E293B] relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-2 mb-3 border-b border-slate-200 dark:border-[#1E293B]">
                  <span className="font-mono text-sky-400">AADHAAR_GOVT_INDIA.PNG</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 98% Extraction Accuracy
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-[#121622] border border-slate-200 dark:border-[#1E293B]">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Full Name</div>
                    <div className="font-semibold text-slate-900 dark:text-white mt-0.5">Rajesh Kumar Sharma</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-[#121622] border border-slate-200 dark:border-[#1E293B]">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Aadhaar Number</div>
                    <div className="font-mono font-semibold text-sky-500 dark:text-sky-400 mt-0.5">9418 2049 4812</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-[#121622] border border-slate-200 dark:border-[#1E293B]">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Date of Birth</div>
                    <div className="font-semibold text-slate-900 dark:text-white mt-0.5">14 Aug 1975</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Interactive Voice AI Bot Desk */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200 dark:border-[#1E293B] shadow-sm hover:border-sky-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Mic className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    Bilingual Voice
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Bilingual Voice Assistant
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Bas mic par tap karein aur shuddh Hindi ya English me bolein: <em>"Papa ka insurance card dikhao"</em>. AI turant file dhoondh kar bol kar sunayega.
                </p>
              </div>

              {/* Interactive Demo Trigger Pill inside card */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setIsVoiceDemoOpen(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <Mic className="w-4 h-4 animate-pulse" />
                  <span>Test Voice Bot (Live Sandbox)</span>
                </button>
              </div>
            </div>

            {/* Card 3: Emergency Medical SOS Card */}
            <div id="emergency" className="p-6 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200 dark:border-[#1E293B] shadow-sm hover:border-red-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                    Crisis Ready
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Emergency Medical SOS
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Hospital admission ke waqt ek tap me sabhi parivar walo ke Blood Groups, cashless health insurance policy numbers aur emergency helpline dikh jaati hai.
                </p>
              </div>

              <div className="mt-6 p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-xs flex items-center justify-between">
                <div>
                  <div className="font-semibold text-red-400">Mother: B+ Blood Group</div>
                  <div className="text-[11px] text-slate-400">Star Health: SH-98214</div>
                </div>
                <span className="px-2 py-1 rounded bg-red-500/20 text-red-300 font-mono text-[10px]">
                  1-Tap Share
                </span>
              </div>
            </div>

            {/* Card 4: Zero-Knowledge Crypto Vault */}
            <div id="security" className="p-6 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200 dark:border-[#1E293B] shadow-sm hover:border-emerald-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    256-Bit Cryptography
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Zero-Knowledge Vault
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Documents aapke browser me hi encrypt hote hain. Server par zero plain text storage hota hai. Chahe database breach ho jaye, private key ke bina koi padh nahi sakta.
                </p>
              </div>

              <div className="mt-6 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs flex items-center justify-between font-mono text-emerald-400">
                <span>AES-256-GCM Locked</span>
                <Shield className="w-4 h-4 text-emerald-400" />
              </div>
            </div>

            {/* Card 5: Self-Destructing 24h Safe Share */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200 dark:border-[#1E293B] shadow-sm hover:border-sky-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    Auto-Expire
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  24h Safe Share Links
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Banker, CA ya travel agent ko documents bhejne ke liye temporary links banayein jo 24 ghante baad automatically expire hokar self-destruct ho jate hain.
                </p>
              </div>

              <div className="mt-6 p-3 rounded-xl bg-sky-500/5 border border-sky-500/20 text-xs flex items-center justify-between">
                <span className="text-sky-400 font-mono">https://dastawez.app/share/t...</span>
                <span className="text-slate-400 text-[11px] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-sky-400" /> 23h 59m left
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= ARCHITECTURE & PRIVACY BENCHMARK ================= */}
      <section className="py-16 sm:py-20 bg-white dark:bg-[#090A0F] border-b border-slate-200 dark:border-[#1E293B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">
              Privacy First Infrastructure
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-2">
              Bank-Grade Infrastructure at ₹0 Setup Cost.
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Standard enterprise security architecture engineered specifically on cloud free-tiers without credit cards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#121622] border border-slate-200 dark:border-[#1E293B]">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-4">
                <Cloud className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1.5">Encrypted Object Storage</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Supabase private buckets with short-lived cryptographically signed access tokens. Files cannot be accessed directly over the public internet.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#121622] border border-slate-200 dark:border-[#1E293B]">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <Database className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1.5">Isolated Family Vaults</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Multi-tenant database schema ensuring complete cryptographic isolation between different family households.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#121622] border border-slate-200 dark:border-[#1E293B]">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                <Bell className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1.5">VAPID Push Expiry Alerts</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Standard WebPush notifications reminding you 30, 15, and 7 days before passport, license, or insurance renewal deadlines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FAQ ACCORDION ================= */}
      <section id="faq" className="py-16 sm:py-20 bg-slate-50/50 dark:bg-[#090A0F]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Aapke Aksar Poochhe Gaye Sawal (FAQs)
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Dastawez ke security model aur privacy ke baare me sabhi jankari.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-[#121622] rounded-xl border border-slate-200 dark:border-[#1E293B] shadow-xs hover:border-slate-300 dark:hover:border-sky-500/30 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white hover:text-sky-500 dark:hover:text-sky-400 transition-colors cursor-pointer gap-4"
                  >
                    <span>{faq.q}</span>
                    <span className="shrink-0 w-6 h-6 rounded-md bg-slate-100 dark:bg-[#161B26] border border-slate-200 dark:border-[#262F40] flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors">
                      {isOpen ? (
                        <Minus className="w-3.5 h-3.5 text-sky-400" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-[#1E293B] pt-3.5">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= FINAL CALL TO ACTION ================= */}
      <section className="py-16 sm:py-20 bg-white dark:bg-[#0B0F19] border-t border-slate-200 dark:border-[#1E293B] relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            Apne Parivar Ke Documents Aaj Hi Secure Karein.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            100% Free setup. Koi credit card nahi, koi subscription fees nahi. Sirf 2 minute me aapka digital vault active ho jayega.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={authLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-950 font-bold text-sm shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <span>{user ? "Go To Dashboard" : "Create My Free Vault (₹0)"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsVoiceDemoOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#121622] dark:hover:bg-[#1A2234] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-[#262F40] text-sm font-semibold transition-all cursor-pointer active:scale-95"
            >
              <Mic className="w-4 h-4 text-sky-400" />
              <span>Try Voice AI Demo</span>
            </button>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-slate-50 dark:bg-[#07080C] text-slate-600 dark:text-slate-400 py-8 sm:py-10 border-t border-slate-200 dark:border-[#1E293B] transition-colors text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6">
          <div className="flex items-center gap-2.5">
            <DastavejLogo size={24} showWordmark={true} />
            <span className="text-[11px] text-slate-400 dark:text-slate-600 font-mono ml-1">v2.5</span>
          </div>

          <p className="text-slate-500 dark:text-slate-500 text-center">
            © 2026 Dastawez. Zero-Knowledge 256-Bit Cryptography. Built for Indian Households.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-600 dark:text-slate-400">
            <Link to="/auth/login" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Sign In
            </Link>
            <span className="text-slate-300 dark:text-[#262F40]">•</span>
            <button onClick={() => setIsVoiceDemoOpen(true)} className="hover:text-sky-400 transition-colors cursor-pointer">
              Voice Demo
            </button>
            <span className="text-slate-300 dark:text-[#262F40]">•</span>
            <a href="#security" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Security Proof
            </a>
          </div>
        </div>
      </footer>

      {/* ================= FLOATING STICKY MOBILE BOTTOM BAR ================= */}
      {showStickyBottom && (
        <div className="sm:hidden fixed bottom-4 inset-x-4 z-40 animate-slideUp">
          <div className="p-2 rounded-2xl bg-[#090A0F]/95 border border-[#1E293B] backdrop-blur-lg shadow-2xl flex items-center gap-2">
            <button
              onClick={() => setIsVoiceDemoOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-[#121622] border border-[#262F40] text-sky-400 text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
            >
              <Mic className="w-3.5 h-3.5 animate-pulse" />
              <span>Voice AI</span>
            </button>
            <Link
              to={user ? "/dashboard" : "/auth/login"}
              className="flex-1 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-bold text-xs text-center flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
            >
              <span>{user ? "Open Vault" : "Get Started Free (₹0)"}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
            </Link>
          </div>
        </div>
      )}

      {/* ================= LIVE VOICE AI DEMO SANDBOX MODAL ================= */}
      <LiveVoiceAiDemoModal
        isOpen={isVoiceDemoOpen}
        onClose={() => setIsVoiceDemoOpen(false)}
      />

    </div>
  );
}
