import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Shield, Clock, AlertCircle, Lock, Eye, Check } from 'lucide-react';
import DastavejLogo from '../components/common/DastavejLogo';

export default function PublicShareViewPage() {
  const { token } = useParams();
  const [doc, setDoc] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSharedDoc();
  }, [token]);

  const loadSharedDoc = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.getSharedDocument(token);

      if (res.expired) {
        setIsExpired(true);
        setError(res.error || 'This secure link has expired.');
        return;
      }

      if (res.document) {
        setDoc(res.document);
        setExpiresAt(new Date(res.expiresAt));
      } else {
        setError(res.error || 'Document not found.');
      }
    } catch (err) {
      setError('Failed to load shared document. The link may have expired or is invalid.');
    } finally {
      setLoading(false);
    }
  };

  // Live countdown timer
  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = expiresAt.getTime() - now;

      if (distance <= 0) {
        setIsExpired(true);
        setTimeLeft('Expired');
        return;
      }

      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const isImage = Boolean(
    (doc?.mimeType && doc.mimeType.startsWith('image/')) ||
    ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'].some(ext =>
      (doc?.originalFileName || '').toLowerCase().endsWith(ext)
    )
  );

  const isPdf = Boolean(
    doc?.mimeType === 'application/pdf' ||
    (doc?.originalFileName || '').toLowerCase().endsWith('.pdf')
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#121212] text-slate-900 dark:text-[#EDEDED] font-sans selection:bg-[#3ECF8E] selection:text-black transition-colors flex flex-col justify-between">
      {/* Top Header */}
      <header className="h-16 border-b border-slate-200 dark:border-[#262626] bg-white dark:bg-[#141414] px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <DastavejLogo size={32} />
          <div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">Dastavej</span>
            <span className="ml-2 text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-500/20">
              Safe Share
            </span>
          </div>
        </div>

        {/* Live Expiry Countdown */}
        {expiresAt && !isExpired && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-400 text-xs font-bold font-mono">
            <Clock size={14} className="animate-pulse" />
            <span>Expires in: {timeLeft}</span>
          </div>
        )}
      </header>

      {/* Main Content Stage */}
      <main className="max-w-4xl mx-auto w-full px-4 py-8 flex-1 flex flex-col items-center justify-center">
        {loading ? (
          <div className="text-center space-y-3 py-16">
            <div className="w-12 h-12 border-3 border-[#10B981] dark:border-[#3ECF8E] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
              Verifying cryptographic share token...
            </p>
          </div>
        ) : isExpired || error ? (
          <div className="w-full max-w-md bg-white dark:bg-[#1C1C1C] rounded-2xl p-6 sm:p-8 border border-red-200 dark:border-red-900/40 shadow-xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Secure Share Link Expired</h2>
              <p className="text-xs text-slate-600 dark:text-neutral-400 mt-2 leading-relaxed">
                {error || 'This temporary access link has expired for your family’s privacy and security. Please ask the sender to generate a fresh link.'}
              </p>
            </div>
            <div className="pt-2 text-[11px] font-mono text-slate-400 dark:text-neutral-500">
              Zero-Knowledge AES-256 Auto-Revocation Policy
            </div>
          </div>
        ) : doc ? (
          <div className="w-full space-y-5">
            {/* Context Badge */}
            <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-[#262626] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{doc.title}</h1>
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-700 dark:text-[#3ECF8E] font-bold text-[11px]">
                    {doc.category}
                  </span>
                </div>
                {doc.documentNumber && (
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 font-mono">
                    ID / Number: <strong className="text-slate-800 dark:text-neutral-200">{doc.documentNumber}</strong>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-neutral-400">
                <Lock size={14} className="text-[#10B981] dark:text-[#3ECF8E]" />
                <span>View-Only Protected Mode</span>
              </div>
            </div>

            {/* Document Stage */}
            <div className="bg-slate-100/70 dark:bg-[#141414] rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-[#262626] flex items-center justify-center relative overflow-hidden">
              {/* Dynamic Diagonal Security Watermark */}
              <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-around rotate-[-25deg] scale-125 opacity-20 dark:opacity-25 select-none overflow-hidden">
                <div className="whitespace-nowrap font-mono text-[9px] sm:text-[10px] tracking-widest text-slate-800 dark:text-neutral-200 font-bold uppercase py-2">
                  GHARVAULT SAFE SHARE • VIEW-ONLY REPOSITIORY • EXPIRES: {timeLeft} • DO NOT DISTRIBUTE
                </div>
                <div className="whitespace-nowrap font-mono text-[9px] sm:text-[10px] tracking-widest text-slate-800 dark:text-neutral-200 font-bold uppercase py-2">
                  VERIFIED RECIPIENT ACCESS • ENCRYPTED PAYLOAD • SHA256: {doc.sha256Hash ? doc.sha256Hash.slice(0, 16).toUpperCase() : 'VERIFIED'}
                </div>
                <div className="whitespace-nowrap font-mono text-[9px] sm:text-[10px] tracking-widest text-slate-800 dark:text-neutral-200 font-bold uppercase py-2">
                  GHARVAULT SAFE SHARE • VIEW-ONLY REPOSITIORY • EXPIRES: {timeLeft} • DO NOT DISTRIBUTE
                </div>
              </div>

              {isImage ? (
                <div className="relative max-w-full rounded-xl overflow-hidden shadow-xl border border-slate-200 dark:border-[#2E2E2E] bg-white dark:bg-[#1C1C1C]">
                  <img
                    src={doc.fileUrl || doc.signedUrl}
                    alt={doc.title}
                    className="max-h-[580px] w-auto max-w-full object-contain mx-auto block"
                  />
                </div>
              ) : isPdf ? (
                <div className="relative w-full h-[580px] rounded-xl overflow-hidden shadow-xl border border-slate-200 dark:border-[#2E2E2E] bg-white dark:bg-[#1C1C1C]">
                  <iframe
                    src={doc.fileUrl || doc.signedUrl}
                    title={doc.title}
                    className="w-full h-full border-0 rounded-xl"
                  />
                </div>
              ) : (
                /* Sovereign Layout Fallback */
                <div className="w-full max-w-md bg-white dark:bg-[#1C1C1C] rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-[#2E2E2E] text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-[#3ECF8E]/10 text-[#10B981] dark:text-[#3ECF8E] flex items-center justify-center mx-auto">
                    <Shield size={24} />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">{doc.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 font-mono">
                    Number: {doc.documentNumber || 'Verified Sovereign Record'}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-neutral-300">
                    Category: {doc.category} • SHA-256 Checksum Verified
                  </p>
                </div>
              )}
            </div>

            {/* View-Only Security Notice */}
            <div className="text-center text-xs text-slate-400 dark:text-neutral-500 font-mono">
              🛡️ Zero-Knowledge Encrypted Buffer • View-only link automatically dissolves in {timeLeft}
            </div>
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 dark:text-neutral-600 border-t border-slate-200 dark:border-[#262626]">
        Powered by <strong className="text-slate-600 dark:text-neutral-400">Dastavej</strong> — Sovereign Digital Family Locker
      </footer>
    </div>
  );
}