import React, { useState } from 'react';
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
  Cloud
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function LandingPage() {
  const { user, loginWithGoogle } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState(null);

  const handleGoogleAuth = async () => {
    try {
      if (user) {
        navigate('/dashboard');
        return;
      }
      navigate('/auth/login');
    } catch (err) {
      navigate('/auth/login');
    }
  };

  const faqs = [
    {
      q: 'How does GharVault ensure zero financial cost (₹0 setup)?',
      a: 'GharVault runs entirely on MongoDB Atlas Free Tier (M0 Cluster) for document data and Supabase Storage Free Tier for private document storage up to 25MB per file with time-limited secure links. Zero paid AWS S3 or complex cloud subscriptions required.',
    },
    {
      q: 'How does the Emergency Medical Card work in a hospital crisis?',
      a: 'One tap on the Emergency Card button instantly shows all family members’ Blood Groups, Emergency Contact numbers, and Health Insurance cashless policy details, ready to share with hospital admission staff in seconds.',
    },
    {
      q: 'What is the One-Tap "Copy Number" feature?',
      a: 'For ID cards like Aadhaar, PAN, Passport, and Bank Accounts, GharVault provides an instant copy button on each card. You can copy the number to your clipboard with a single tap without downloading or opening the file.',
    },
    {
      q: 'How does "Share Safely" protect family documents?',
      a: 'When you need to send an ID or insurance document to a travel agent or CA, the Share Safely button creates a temporary link that automatically expires after 24 hours, preventing unauthorized permanent access.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#121212] text-[#EDEDED] font-sans selection:bg-[#3ECF8E] selection:text-black transition-colors">
      {/* ================= STICKY NAVIGATION BAR ================= */}
      <header className="sticky top-0 z-50 bg-[#121212]/95 backdrop-blur-md border-b border-[#262626] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#1C1C1C] border border-[#2E2E2E] group-hover:border-[#3ECF8E]/50 flex items-center justify-center shadow-md transition-colors">
              <Shield className="w-4 h-4 text-[#3ECF8E] stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base tracking-tight text-[#EDEDED]">
                GharVault
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#8F8F8F]">
                One Family • One Space
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#8F8F8F]">
            <a href="#features" className="hover:text-[#EDEDED] transition-colors">
              Features
            </a>
            <a href="#emergency" className="hover:text-[#EDEDED] transition-colors">
              Emergency Card
            </a>
            <a href="#security" className="hover:text-[#EDEDED] transition-colors">
              Security
            </a>
            <a href="#faq" className="hover:text-[#EDEDED] transition-colors">
              FAQs
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <Link
              to={user ? "/dashboard" : "/auth/login"}
              className="px-3.5 py-1.5 rounded-lg border border-[#2E2E2E] hover:border-[#3ECF8E]/50 text-[#EDEDED] text-xs font-medium transition-colors"
            >
              {user ? "Open Vault" : "Sign In"}
            </Link>
            <Link
              to="/auth/login"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#3ECF8E] hover:bg-[#34b27b] text-black text-xs font-semibold transition-all shadow-sm"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-20 pb-24 overflow-hidden border-b border-[#262626]">
        {/* Decorative background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#3ECF8E]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3ECF8E]/10 border border-[#3ECF8E]/25 text-[#3ECF8E] text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E] animate-pulse" />
            <span>100% Free-Tier Architecture • Zero Cloud Cost</span>
            <span className="text-[#8F8F8F]">•</span>
            <span className="font-mono text-[11px] text-[#3ECF8E]">v2.5</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[#EDEDED] max-w-4xl mx-auto leading-[1.15]">
            One Family. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3ECF8E] via-emerald-400 to-teal-300">
              One Secure Space.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-sm sm:text-base text-[#8F8F8F] max-w-2xl mx-auto leading-relaxed">
            The simplest, safest place for your family's vital IDs, medical records, property papers, and insurance policies. Built for everyday Indian households with human-friendly simplicity.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/auth/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-lg bg-[#3ECF8E] hover:bg-[#34b27b] text-black font-semibold text-sm shadow-md transition-all cursor-pointer group"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              to="/auth/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#1C1C1C] hover:bg-[#242424] text-[#EDEDED] font-medium text-sm border border-[#2E2E2E] hover:border-[#3ECF8E]/40 transition-all"
            >
              <Lock className="w-4 h-4 text-[#3ECF8E]" />
              <span>Enter Vault</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ================= 4 CORE PRACTICAL FEATURES ================= */}
      <section id="features" className="py-16 bg-[#121212] border-b border-[#262626]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold text-[#3ECF8E] uppercase tracking-wider">
              Thoughtful Family Features
            </span>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#EDEDED] mt-2">
              Designed For Real Family Life.
            </h2>
            <p className="mt-2 text-sm text-[#8F8F8F] leading-relaxed">
              No technical jargon, no messy folder structures. Just what your family needs when it matters most.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. One-Tap Copy Number */}
            <div className="p-5 rounded-lg bg-[#1C1C1C] border border-[#2E2E2E] hover:border-[#3ECF8E]/40 transition-all group">
              <div className="w-9 h-9 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 text-[#3ECF8E] flex items-center justify-center mb-4 transition-colors">
                <Copy className="w-4 h-4" />
              </div>
              <h3 className="text-base font-medium text-[#EDEDED] mb-1.5">One-Tap "Copy Number"</h3>
              <p className="text-sm text-[#8F8F8F] leading-relaxed">
                Copy Aadhaar, PAN, Passport, or Bank Account numbers directly to clipboard without downloading or opening the PDF.
              </p>
            </div>

            {/* 2. Emergency Medical Card */}
            <div
              id="emergency"
              className="p-5 rounded-lg bg-[#1C1C1C] border border-[#2E2E2E] hover:border-red-500/40 transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-red-950/60 border border-red-900/50 text-red-400 flex items-center justify-center mb-4 transition-colors">
                <HeartPulse className="w-4 h-4" />
              </div>
              <h3 className="text-base font-medium text-[#EDEDED] mb-1.5">Emergency Medical Card</h3>
              <p className="text-sm text-[#8F8F8F] leading-relaxed">
                One prominent button showing every family member's Blood Group, Emergency Contact, and Health Insurance TPA details instantly.
              </p>
            </div>

            {/* 3. Simple Expiry Alerts */}
            <div className="p-5 rounded-lg bg-[#1C1C1C] border border-[#2E2E2E] hover:border-amber-500/40 transition-all group">
              <div className="w-9 h-9 rounded-lg bg-amber-950/60 border border-amber-900/50 text-amber-400 flex items-center justify-center mb-4 transition-colors">
                <Bell className="w-4 h-4" />
              </div>
              <h3 className="text-base font-medium text-[#EDEDED] mb-1.5">Simple Expiry Alerts</h3>
              <p className="text-sm text-[#8F8F8F] leading-relaxed">
                Clear 30-day alerts before Driving Licences, Passports, or Vehicle Insurance policies expire so you never miss a renewal deadline.
              </p>
            </div>

            {/* 4. Easy Sharing */}
            <div className="p-5 rounded-lg bg-[#1C1C1C] border border-[#2E2E2E] hover:border-[#3ECF8E]/40 transition-all group">
              <div className="w-9 h-9 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 text-[#3ECF8E] flex items-center justify-center mb-4 transition-colors">
                <Share2 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-medium text-[#EDEDED] mb-1.5">Share Safely (24h Link)</h3>
              <p className="text-sm text-[#8F8F8F] leading-relaxed">
                Generate temporary links that automatically expire in 24 hours. Perfect for sending IDs to hotels or travel agents securely.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECURITY & FREE TIER ARCHITECTURE ================= */}
      <section id="security" className="py-16 bg-[#121212] border-b border-[#262626]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold text-[#3ECF8E] uppercase tracking-wider">
              Zero-Knowledge & Free Architecture
            </span>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#EDEDED] mt-2">
              Enterprise Security at ₹0 Setup Cost.
            </h2>
            <p className="mt-2 text-sm text-[#8F8F8F] leading-relaxed">
              Engineered exclusively on cloud free-tiers. No surprise bills, no credit card required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-lg bg-[#1C1C1C] border border-[#2E2E2E] hover:border-[#3ECF8E]/40 transition-all">
              <div className="w-9 h-9 rounded-lg bg-[#3ECF8E]/10 text-[#3ECF8E] flex items-center justify-center mb-4">
                <Cloud className="w-4 h-4" />
              </div>
              <h3 className="text-base font-medium text-[#EDEDED] mb-1.5">Supabase Storage</h3>
              <p className="text-sm text-[#8F8F8F] leading-relaxed">
                Private encrypted buckets with secure expiring signed URLs. Files are strictly accessible only by authorized family members.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-[#1C1C1C] border border-[#2E2E2E] hover:border-[#3ECF8E]/40 transition-all">
              <div className="w-9 h-9 rounded-lg bg-[#3ECF8E]/10 text-[#3ECF8E] flex items-center justify-center mb-4">
                <Database className="w-4 h-4" />
              </div>
              <h3 className="text-base font-medium text-[#EDEDED] mb-1.5">MongoDB Atlas Free Tier</h3>
              <p className="text-sm text-[#8F8F8F] leading-relaxed">
                Robust M0 shared cluster managing metadata, category schemas, and audit logs with enterprise-grade uptime.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-[#1C1C1C] border border-[#2E2E2E] hover:border-[#3ECF8E]/40 transition-all">
              <div className="w-9 h-9 rounded-lg bg-[#3ECF8E]/10 text-[#3ECF8E] flex items-center justify-center mb-4">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-medium text-[#EDEDED] mb-1.5">Supabase Auth</h3>
              <p className="text-sm text-[#8F8F8F] leading-relaxed">
                Frictionless Google OAuth with secure JWT sessions. Zero password vulnerabilities or credential leaks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FAQ SECTION ================= */}
      <section id="faq" className="py-16 bg-[#121212]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#EDEDED]">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-sm text-[#8F8F8F]">
              Everything you need to know about GharVault security and setup.
            </p>
          </div>

          <div className="space-y-2.5">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-[#1C1C1C] rounded-lg border border-[#2E2E2E] hover:border-[#3ECF8E]/30 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between text-sm font-medium text-[#EDEDED] hover:text-[#3ECF8E] transition-colors cursor-pointer gap-4"
                  >
                    <span>{faq.q}</span>
                    <span className="shrink-0 w-6 h-6 rounded-md bg-[#141414] border border-[#2E2E2E] flex items-center justify-center text-[#8F8F8F] transition-colors">
                      {isOpen ? (
                        <Minus className="w-3.5 h-3.5 text-[#3ECF8E]" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-sm text-[#8F8F8F] leading-relaxed border-t border-[#262626] pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= SUPABASE MATTE OBSIDIAN FOOTER ================= */}
      <footer className="bg-[#121212] text-[#8F8F8F] py-10 border-t border-[#262626]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#1C1C1C] border border-[#2E2E2E] flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-[#3ECF8E] stroke-[2.2]" />
            </div>
            <span className="font-semibold text-sm text-[#EDEDED]">GharVault</span>
            <span className="text-[11px] text-[#555] font-mono">v2.5</span>
          </div>

          <p className="text-xs text-[#8F8F8F] text-center">
            © 2026 GharVault. Built with Supabase Storage, MongoDB Atlas, and React.
          </p>

          <div className="flex items-center gap-4 text-xs font-medium">
            <Link to="/auth/login" className="hover:text-[#EDEDED] transition-colors">
              Sign In
            </Link>
            <span className="text-[#333]">•</span>
            <Link to="/auth/login" className="hover:text-[#EDEDED] transition-colors">
              Vault Access
            </Link>
            <span className="text-[#333]">•</span>
            <a href="#security" className="hover:text-[#EDEDED] transition-colors">
              Security
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
