import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { loginWithGoogle } = useAuth();
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
      q: 'How does GharVault ensure zero financial cost on the free tier?',
      a: 'GharVault utilizes MongoDB Atlas Free Tier (M0 Cluster) for document metadata and Supabase Storage Free Tier for secure private document storage up to 25MB per file with time-limited signed URLs, requiring zero paid cloud infrastructure.',
    },
    {
      q: 'What is the 48-Hour Emergency Break-Glass Protocol?',
      a: 'In a medical emergency or unforeseen incapacity, a designated family custodian can arm the protocol. A 48-hour countdown is broadcast across SMS, Email, and WhatsApp to all guardians. If not cancelled by the primary admin, pre-authorized emergency custody safely unlocks critical medical and insurance records.',
    },
    {
      q: 'How does Dual-Key Quorum Sign-off work for sensitive records?',
      a: 'High-value documents like Registered Wills, 7/12 Land Extracts, and Property Deeds require approvals from at least 2 of 2 designated guardians (e.g. Rajesh & Priya Sharma) before sensitive details or full downloads can occur.',
    },
    {
      q: 'Are documents legally compliant in India?',
      a: 'Yes. Every uploaded record receives a FIPS 180-4 SHA-256 cryptographic seal compliant with Section 65B of the Indian Evidence Act and the Indian Succession Act, 1925.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* ================= STICKY NAVIGATION BAR ================= */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="material-symbols-outlined text-2xl">shield</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline font-bold text-xl tracking-tight text-slate-900">GharVault</span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">One Family • One Space</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#security" className="hover:text-blue-600 transition-colors">Zero-Knowledge Security</a>
            <a href="#compliance" className="hover:text-blue-600 transition-colors">Indian Law Ready</a>
            <a href="#faq" className="hover:text-blue-600 transition-colors">FAQs</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <Link
              to="/auth/login"
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-sm transition-colors"
            >
              Sign In
            </Link>
            <button
              onClick={handleGoogleAuth}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-md shadow-blue-600/20 group"
            >
              <span>Get Started Free</span>
              <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-0.5">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-16 pb-20 overflow-hidden">
        {/* Decorative background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Security Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-800 text-xs font-semibold mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>256-bit AES End-to-End Encrypted • Private Cloud Vault</span>
            <span className="text-slate-300">•</span>
            <span className="font-mono text-[11px] text-blue-600">v2.4.9</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 max-w-5xl mx-auto leading-[1.1]">
            One Family. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600">
              One Secure Space.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            End-to-end encrypted storage for 7/12 land records, health directives, demat portfolios, and registered wills — with automated statutory inheritance protocols and 48-hour emergency break-glass custody for your loved ones under Indian law.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleGoogleAuth}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-xl shadow-blue-600/25 transition-all group cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Sign in with Google — Free 50GB</span>
              <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-1">arrow_forward</span>
            </button>

            <Link
              to="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-base border border-slate-300 shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-blue-600 text-xl">play_circle</span>
              <span>Launch Live Interactive Demo</span>
            </Link>
          </div>

          {/* Social Proof */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-slate-500 text-xs sm:text-sm font-medium">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-600 text-lg">verified</span>
              <span>14,000+ Indian Families & HNIs</span>
            </div>
            <span className="hidden sm:inline text-slate-300">•</span>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-blue-600 text-lg">account_balance</span>
              <span>DigiLocker & Aadhaar e-KYC Compliant</span>
            </div>
            <span className="hidden sm:inline text-slate-300">•</span>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-indigo-600 text-lg">gavel</span>
              <span>Indian Succession Act, 1925 Ready</span>
            </div>
          </div>
        </div>

        {/* ================= INTERACTIVE PRODUCT PREVIEW SHOWCASE ================= */}
        <div className="mt-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl bg-[#0F172A] p-2 sm:p-3 shadow-2xl ring-1 ring-slate-800">
            {/* Window bar */}
            <div className="h-10 px-4 flex items-center justify-between border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                </div>
                <span className="ml-3 font-mono text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-emerald-400 text-sm">lock</span>
                  GharVault v2.4.9 — Rajesh & Priya Sharma Family Trust
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Live Encrypted Session</span>
              </div>
            </div>

            {/* Simulated Live Viewport */}
            <div className="bg-[#F8FAFC] rounded-xl p-6 sm:p-8 space-y-6 text-left">
              {/* Expiry Banner */}
              <div className="w-full bg-amber-50/90 border border-amber-200/90 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl">warning</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>Attention: 1 critical document expires within next 30 days</span>
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-mono text-[10px] font-bold uppercase">
                        Action Required
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      Term Life Policy #8821 - Priya Sharma (Expires in 27 days)
                    </div>
                  </div>
                </div>
                <Link
                  to="/dashboard"
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shrink-0"
                >
                  Renew / View in Vault
                </Link>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Family Members</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">4 Active</div>
                  <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">sync</span> All Synced
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Stored Records</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">48 Files</div>
                  <div className="text-xs text-blue-600 mt-1">6 Verified Categories</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Vault Storage</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">3.4 GB</div>
                  <div className="text-xs text-slate-500 mt-1">6.8% of 50 GB Used</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Quorum</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">1 Sign-off</div>
                  <div className="text-xs text-amber-600 mt-1">Flat 402 Registry Deed</div>
                </div>
              </div>

              {/* Sample Document List */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">Recent Sealed Vault Documents</span>
                  <Link to="/vault" className="text-xs font-semibold text-blue-600 hover:underline">
                    View all 48 files →
                  </Link>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-blue-600 text-lg">badge</span>
                      <div>
                        <div className="font-semibold text-slate-900">Indian Passport - Rajesh</div>
                        <div className="text-slate-500">Identity • Valid thru 2035 • #V6924108</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px] font-semibold">
                      Renewed & Verified
                    </span>
                  </div>
                  <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-indigo-600 text-lg">real_estate_agent</span>
                      <div>
                        <div className="font-semibold text-slate-900">Flat 402 Registry Deed</div>
                        <div className="text-slate-500">Property • 14.1 MB • Sub-Registrar Mumbai</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono text-[10px] font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[10px]">key</span> Dual-Key Quorum
                    </span>
                  </div>
                  <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-red-600 text-lg">health_and_safety</span>
                      <div>
                        <div className="font-semibold text-slate-900">HDFC Ergo Health Policy 2025</div>
                        <div className="text-slate-500">Health Insurance • Cashless Floater ₹50 Lakhs</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px] font-semibold">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 4 PILLARS FEATURE SECTION ================= */}
      <section id="features" className="py-24 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Built For Indian Families</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">
              Enterprise-Grade Custody. Family-First Simplicity.
            </h2>
            <p className="mt-4 text-slate-600 text-base">
              Say goodbye to scattered WhatsApp PDFs, misplaced bank locker keys, and desperate searches during medical crises.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-2xl">enhanced_encryption</span>
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Zero-Knowledge Storage</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Supabase Private Buckets with time-limited signed URLs. Every document is hashed with SHA-256 for mathematical tamper proofing.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-400 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-2xl">group_work</span>
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Dual-Key Quorum</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Multi-signature security. High-stakes documents like property deeds and wills cannot be viewed or downloaded without 2 authorized custodians.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-red-400 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-5 group-hover:bg-red-600 group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-2xl">e911_emergency</span>
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Break-Glass 48h Protocol</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Medical emergency safety net. Nominees can trigger emergency access with multi-channel alerts and a 48h cancel window.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-amber-400 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-5 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-2xl">account_balance</span>
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Indian Statutory Ready</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Pre-configured categories for Aadhaar, PAN, 7/12 land records, Demat statements, and Section 65B IT Act evidentiary manifests.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FAQ SECTION ================= */}
      <section id="faq" className="py-24 bg-[#F8FAFC]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
            <p className="mt-3 text-slate-600">Everything you need to know about GharVault security and zero-cost architecture.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden transition-all shadow-xs"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between font-bold text-slate-900 hover:text-blue-600 transition-colors"
                >
                  <span>{faq.q}</span>
                  <span className={`material-symbols-outlined transition-transform duration-200 ${activeFaq === idx ? 'rotate-180 text-blue-600' : 'text-slate-400'}`}>
                    expand_more
                  </span>
                </button>
                {activeFaq === idx && (
                  <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-[#0F172A] text-slate-400 py-12 border-t border-[#1E293B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-lg">shield</span>
            </div>
            <span className="font-headline font-bold text-lg text-white">GharVault</span>
            <span className="text-xs text-slate-500 font-mono">v2.4.9</span>
          </div>

          <p className="text-xs text-slate-400 text-center">
            © 2026 GharVault Technologies. Designed in Google Stitch. Protected under 256-bit AES Zero-Knowledge Encryption.
          </p>

          <div className="flex items-center gap-4 text-xs">
            <Link to="/auth/login" className="hover:text-white transition-colors">Sign In</Link>
            <span>•</span>
            <Link to="/dashboard" className="hover:text-white transition-colors">Open Vault</Link>
            <span>•</span>
            <Link to="/family/setup" className="hover:text-white transition-colors">Create Workspace</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
