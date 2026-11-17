import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  ArrowRight,
  Eye,
  Copy,
  HeartPulse,
  Bell,
  Share2,
  ChevronDown,
  Sparkles,
  Lock,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function LandingPage() {
  const { loginWithGoogle } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState(null);

  const handleGoogleAuth = async () => {
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      navigate('/dashboard');
    }
  };

  const faqs = [
    {
      q: 'How does GharVault ensure zero financial cost (₹0 setup)?',
      a: 'GharVault runs entirely on MongoDB Atlas Free Tier (M0 Cluster) for document data and Supabase Storage Free Tier for private document storage up to 25MB per file with time-limited secure links. No AWS S3 or paid hosting required.',
    },
    {
      q: 'How does the Emergency Medical Card work in a hospital crisis?',
      a: 'One tap on the red Emergency Card button instantly shows all family members’ Blood Groups, Emergency Contact numbers, and Health Insurance cashless policy details, ready to share with hospital admission staff in seconds.',
    },
    {
      q: 'What is the One-Tap "Copy Number" feature?',
      a: 'For ID cards like Aadhaar, PAN, Passport, and Bank Accounts, GharVault provides an instant copy button on each card. You can copy the number to your clipboard with a single tap without downloading or opening the file.',
    },
    {
      q: 'How does "Share Safely" protect family documents?',
      a: 'When you need to send an ID or insurance document to a travel agent or CA, the Share Safely button creates a temporary link that automatically expires after 24 hours.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#121212] text-slate-900 dark:text-neutral-100 font-sans selection:bg-emerald-500 selection:text-white transition-colors">
      {/* ================= STICKY NAVIGATION BAR ================= */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#141414]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#262626] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 dark:bg-[#3ECF8E] text-white dark:text-black flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield className="w-5 h-5 stroke-[2.3]" />
            </div>
            <div className="flex flex-col">
              <span className="font-headline font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                GharVault
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 dark:text-neutral-500">
                One Family • One Space
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-neutral-300">
            <a href="#features" className="hover:text-emerald-600 dark:hover:text-[#3ECF8E] transition-colors">
              Features
            </a>
            <a href="#emergency" className="hover:text-emerald-600 dark:hover:text-[#3ECF8E] transition-colors">
              Emergency Card
            </a>
            <a href="#security" className="hover:text-emerald-600 dark:hover:text-[#3ECF8E] transition-colors">
              Security
            </a>
            <a href="#faq" className="hover:text-emerald-600 dark:hover:text-[#3ECF8E] transition-colors">
              FAQs
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-[#262626] transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
            <Link
              to="/auth/login"
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#262626] hover:border-slate-400 dark:hover:border-neutral-500 text-slate-700 dark:text-neutral-200 font-bold text-xs transition-colors"
            >
              Sign In
            </Link>
            <button
              onClick={handleGoogleAuth}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-[#3ECF8E] dark:hover:bg-[#34b27b] text-white dark:text-black font-bold text-xs transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <span>Continue with Google</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-16 pb-20 overflow-hidden">
        {/* Decorative background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/40 text-emerald-800 dark:text-[#3ECF8E] text-xs font-semibold mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>100% Free-Tier Architecture • Zero Paid Cloud Costs</span>
            <span className="text-slate-300 dark:text-neutral-600">•</span>
            <span className="font-mono text-[11px] text-emerald-600 dark:text-[#3ECF8E]">v2.5</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-5xl mx-auto leading-[1.1]">
            One Family. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-blue-600 dark:from-[#3ECF8E] dark:via-emerald-400 dark:to-teal-300">
              One Secure Space.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-xl text-slate-600 dark:text-neutral-400 max-w-3xl mx-auto leading-relaxed">
            The simplest, safest place for your family's vital IDs, medical records, property papers, and insurance policies. Built for everyday Indian households so parents, kids, and elders can use it effortlessly.
          </p>

          {/* CTA Button */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleGoogleAuth}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 dark:bg-[#3ECF8E] dark:hover:bg-[#34b27b] text-white dark:text-black font-bold text-base shadow-xl shadow-emerald-600/25 transition-all cursor-pointer group"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google — Free 50GB</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <Link
              to="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-white dark:bg-[#1C1C1C] hover:bg-slate-50 dark:hover:bg-[#262626] text-slate-800 dark:text-neutral-200 font-bold text-sm border border-slate-300 dark:border-[#262626] shadow-xs transition-all"
            >
              <Eye className="w-4 h-4 text-emerald-600 dark:text-[#3ECF8E]" />
              <span>Open Family Vault</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ================= 4 CORE PRACTICAL FEATURES ================= */}
      <section id="features" className="py-20 bg-white dark:bg-[#171717] border-y border-slate-200 dark:border-[#262626] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-emerald-600 dark:text-[#3ECF8E] uppercase tracking-widest">
              Thoughtful Family Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-2">
              Designed For Real Family Life.
            </h2>
            <p className="mt-4 text-slate-600 dark:text-neutral-400 text-sm">
              No technical jargon, no messy folder structures. Just what your family needs when it matters most.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. One-Tap Copy Number */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-[#1C1C1C] border border-slate-200 dark:border-[#262626] hover:border-emerald-500 dark:hover:border-[#3ECF8E] hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-[#3ECF8E] flex items-center justify-center mb-5 group-hover:bg-emerald-600 group-hover:text-white dark:group-hover:bg-[#3ECF8E] dark:group-hover:text-black transition-colors">
                <Copy className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">One-Tap "Copy Number"</h3>
              <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                Copy Aadhaar, PAN, Passport, or Bank Account numbers instantly to clipboard with one tap, without having to open the PDF.
              </p>
            </div>

            {/* 2. Emergency Medical Card */}
            <div
              id="emergency"
              className="p-6 rounded-3xl bg-slate-50 dark:bg-[#1C1C1C] border border-slate-200 dark:border-[#262626] hover:border-red-500 hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mb-5 group-hover:bg-red-600 group-hover:text-white transition-colors">
                <HeartPulse className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">Emergency Medical Card</h3>
              <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                One prominent red button showing every family member's Blood Group, Emergency Contact, and Health Insurance TPA details in an instant.
              </p>
            </div>

            {/* 3. Simple Expiry Alerts */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-[#1C1C1C] border border-slate-200 dark:border-[#262626] hover:border-amber-500 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">Simple Expiry Alerts</h3>
              <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                Clear amber and red badges 30 days before Driving Licences, Passports, or Vehicle Insurance expire so you never miss a renewal.
              </p>
            </div>

            {/* 4. Easy Sharing */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-[#1C1C1C] border border-slate-200 dark:border-[#262626] hover:border-emerald-500 dark:hover:border-[#3ECF8E] hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-[#3ECF8E] flex items-center justify-center mb-5 group-hover:bg-emerald-600 group-hover:text-white dark:group-hover:bg-[#3ECF8E] dark:group-hover:text-black transition-colors">
                <Share2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">Share Safely (24h Link)</h3>
              <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                Generate temporary links that automatically expire in 24 hours. Perfect for sending IDs to hotels or travel agents safely.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FAQ SECTION ================= */}
      <section id="faq" className="py-20 bg-[#F8FAFC] dark:bg-[#121212] transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Frequently Asked Questions</h2>
            <p className="mt-2 text-slate-500 dark:text-neutral-400 text-xs">
              Everything you need to know about GharVault security and setup.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-[#1C1C1C] rounded-2xl border border-slate-200/80 dark:border-[#262626] overflow-hidden transition-all shadow-xs"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between font-bold text-sm text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-[#3ECF8E] transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      activeFaq === idx ? 'rotate-180 text-emerald-600 dark:text-[#3ECF8E]' : 'text-slate-400 dark:text-neutral-500'
                    }`}
                  />
                </button>
                {activeFaq === idx && (
                  <div className="px-6 pb-5 text-xs text-slate-600 dark:text-neutral-400 leading-relaxed border-t border-slate-100 dark:border-[#262626] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-[#0F172A] dark:bg-[#0A0A0A] text-slate-400 dark:text-neutral-500 py-12 border-t border-[#1E293B] dark:border-[#262626]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 dark:bg-[#3ECF8E] text-white dark:text-black flex items-center justify-center font-bold">
              <Shield className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="font-headline font-bold text-lg text-white">GharVault</span>
            <span className="text-xs text-slate-500 dark:text-neutral-600 font-mono">v2.5</span>
          </div>

          <p className="text-xs text-slate-400 dark:text-neutral-400 text-center">
            © 2026 GharVault. Replicated from Google Stitch designs. 100% Free-Tier Architecture.
          </p>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link to="/auth/login" className="hover:text-white transition-colors">
              Sign In
            </Link>
            <span>•</span>
            <Link to="/dashboard" className="hover:text-white transition-colors">
              Dashboard
            </Link>
            <span>•</span>
            <Link to="/family/setup" className="hover:text-white transition-colors">
              Family Setup
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
