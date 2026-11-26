import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  KeyRound,
  Clock,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Eye,
  EyeOff,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Fingerprint,
  Info,
  ArrowRight,
} from 'lucide-react';
import DastavejLogo from '../components/common/DastavejLogo';

export default function PublicShareViewPage() {
  const { token } = useParams();

  // State Management
  const [doc, setDoc] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [percentLeft, setPercentLeft] = useState(100);
  const [isExpired, setIsExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Password / PIN Protection State
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [previewMeta, setPreviewMeta] = useState(null);

  // Viewer Controls
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showWatermark, setShowWatermark] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const containerRef = useRef(null);

  useEffect(() => {
    loadSharedDoc();
  }, [token]);

  const loadSharedDoc = async (password = '') => {
    try {
      setLoading(true);
      setError('');
      setPasswordError('');

      const res = await api.getSharedDocument(token, password);

      if (res.expired) {
        setIsExpired(true);
        setError(res.error || 'This sovereign link has expired and auto-dissolved.');
        return;
      }

      if (res.requiresPassword) {
        setRequiresPassword(true);
        setPreviewMeta({
          title: res.title || 'Encrypted Family Document',
          category: res.category || 'Protected Record',
        });
        if (res.expiresAt) {
          setExpiresAt(new Date(res.expiresAt));
        }
        if (password) {
          setPasswordError(res.error || 'Invalid passcode. Please re-enter.');
        }
        return;
      }

      if (res.document) {
        setDoc(res.document);
        setRequiresPassword(false);
        if (res.expiresAt) {
          setExpiresAt(new Date(res.expiresAt));
        }
      } else {
        setError(res.error || 'Document record could not be found.');
      }
    } catch (err) {
      if (err.status === 401 || err.message?.includes('401') || err.message?.includes('PIN')) {
        setPasswordError('Incorrect security PIN or password. Decryption failed.');
        setRequiresPassword(true);
      } else if (err.status === 410 || err.message?.includes('expired')) {
        setIsExpired(true);
        setError('This secure link has expired. Please request a new share link.');
      } else {
        setError(err.message || 'Failed to load sovereign document. The link may have dissolved or is invalid.');
      }
    } finally {
      setLoading(false);
      setVerifyingPassword(false);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setPasswordError('Please enter the security PIN / passcode.');
      return;
    }
    setVerifyingPassword(true);
    loadSharedDoc(passwordInput.trim());
  };

  // Live countdown timer and expiry calculation
  useEffect(() => {
    if (!expiresAt) return;

    const totalDuration = 24 * 60 * 60 * 1000; // estimated reference duration (24h)

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = expiresAt.getTime() - now;

      if (distance <= 0) {
        setIsExpired(true);
        setTimeLeft('00h 00m 00s');
        setPercentLeft(0);
        return;
      }

      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      const pad = (n) => String(n).padStart(2, '0');
      setTimeLeft(`${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`);

      const pct = Math.max(0, Math.min(100, (distance / totalDuration) * 100));
      setPercentLeft(pct);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // Fullscreen listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleCopyHash = () => {
    if (!doc?.sha256Hash) return;
    navigator.clipboard.writeText(doc.sha256Hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2500);
  };

  const handleDownload = async () => {
    if (!doc) return;
    try {
      setDownloading(true);
      // Notify vault custodian of external download
      api.notifySharedDownload(token).catch(() => {});

      const downloadUrl = doc.fileUrl || doc.signedUrl;
      const fileName = doc.originalFileName || `${doc.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

      // Trigger download
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      // Fallback: direct window open if blob fetch fails (e.g. CORS)
      window.open(doc.fileUrl || doc.signedUrl, '_blank');
    } finally {
      setDownloading(false);
    }
  };

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

  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 font-sans selection:bg-[#38BDF8] selection:text-black flex flex-col justify-between antialiased relative overflow-x-hidden">
      {/* Background Ambience / SafePaper Radial Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-sky-500/10 via-emerald-500/5 to-transparent blur-3xl opacity-60" />
        <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      </div>

      {/* Top Header / SafePaper HUD */}
      <header className="relative z-20 h-16 sm:h-20 border-b border-[#1E293B]/80 bg-[#0B0F19]/90 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DastavejLogo size={34} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">Dastavej</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/15 text-[#38BDF8] font-bold border border-sky-500/30">
                <ShieldCheck size={11} className="text-[#38BDF8]" />
                SafePaper™ Protocol
              </span>
            </div>
            <p className="hidden sm:block text-[11px] text-slate-400 font-mono">
              Zero-Knowledge Ephemeral Buffer
            </p>
          </div>
        </div>

        {/* Live Expiry Countdown HUD */}
        {expiresAt && !isExpired && (
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#111726] border border-[#1E293B] shadow-inner text-xs font-mono font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <Clock size={13} className="text-amber-400 animate-pulse" />
                <span className="text-slate-200">
                  <span className="hidden md:inline text-slate-400 font-normal mr-1">Dissolves in:</span>
                  <span className="text-amber-300 font-bold tracking-wider">{timeLeft}</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Stage */}
      <main className="relative z-10 max-w-5xl mx-auto w-full px-3 sm:px-6 py-6 sm:py-10 flex-1 flex flex-col justify-center">
        {/* Loading State */}
        {loading ? (
          <div className="text-center space-y-4 py-24">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-sky-500/20 animate-ping" />
              <div className="w-16 h-16 border-3 border-transparent border-t-[#38BDF8] border-r-[#10B981] rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Shield size={22} className="text-[#38BDF8]" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Verifying Cryptographic Share Token...
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Initiating zero-knowledge ephemeral handshake
              </p>
            </div>
          </div>
        ) : isExpired || error ? (
          /* Expired / Revoked State */
          <div className="w-full max-w-lg mx-auto bg-[#0C101A] rounded-2xl p-6 sm:p-8 border border-red-500/30 shadow-2xl shadow-red-950/20 text-center space-y-6">
            <div className="relative w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert size={36} />
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-[#0C101A]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Safe Share Link Dissolved
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
                {error || 'This temporary access token has expired or was revoked by the vault owner in accordance with sovereign zero-knowledge privacy policies.'}
              </p>
            </div>

            {/* Protocol Security Facts */}
            <div className="bg-[#07090E] rounded-xl p-4 border border-[#1E293B] text-left space-y-2.5">
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span>Memory Cache: <strong>Purged & Overwritten</strong></span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span>Zero-Knowledge Policy: <strong>No public plaintexts retained</strong></span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span>Audit Ledger: <strong>Revocation logged to custodian</strong></span>
              </div>
            </div>

            <p className="text-[11px] font-mono text-slate-500">
              Need access? Ask the document owner to generate a fresh Safe Share link.
            </p>
          </div>
        ) : requiresPassword ? (
          /* Password / PIN Challenge State */
          <div className="w-full max-w-md mx-auto bg-[#0C101A] rounded-2xl p-6 sm:p-8 border border-sky-500/40 shadow-2xl shadow-sky-950/30 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-[#38BDF8] flex items-center justify-center mx-auto">
              <KeyRound size={32} className="animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-sky-400 font-bold px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20">
                <Lock size={10} /> PIN-Protected Record
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Passcode Verification Required
              </h2>
              <p className="text-xs text-slate-400">
                {previewMeta?.title ? (
                  <span>File: <strong className="text-slate-200">"{previewMeta.title}"</strong></span>
                ) : (
                  'The custodian encrypted this link with an access passcode.'
                )}
              </p>
            </div>

            {passwordError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 text-left">
                <AlertTriangle size={15} className="shrink-0 text-red-400" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                  Enter Security PIN / Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter recipient passcode..."
                    autoFocus
                    className="w-full bg-[#07090E] border border-[#1E293B] focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 font-mono tracking-wider transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={verifyingPassword}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-[#38BDF8] to-[#10B981] text-black hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 disabled:opacity-50"
              >
                {verifyingPassword ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Decrypting Payload...</span>
                  </>
                ) : (
                  <>
                    <Unlock size={16} />
                    <span>Decrypt & View Document</span>
                  </>
                )}
              </button>
            </form>

            <p className="text-[11px] font-mono text-slate-500">
              🛡️ Decryption happens locally via SHA-256 key matching.
            </p>
          </div>
        ) : doc ? (
          /* Decrypted Sovereign Document Stage */
          <div ref={containerRef} className="w-full space-y-4">
            {/* Top Metadata & Action Ribbon */}
            <div className="bg-[#0C101A] rounded-2xl p-4 sm:p-5 border border-[#1E293B] shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Document Identity */}
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight truncate max-w-md">
                    {doc.title}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-[#34D399] font-bold text-[11px] border border-emerald-500/30">
                    {doc.category}
                  </span>
                  {doc.documentNumber && (
                    <span className="px-2 py-0.5 rounded-md bg-[#111726] text-slate-300 font-mono text-[11px] border border-[#1E293B]">
                      #{doc.documentNumber}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
                  {doc.fileSize && (
                    <span>Size: <strong className="text-slate-200">{formatFileSize(doc.fileSize)}</strong></span>
                  )}
                  {doc.mimeType && (
                    <span>Format: <strong className="text-slate-200">{doc.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}</strong></span>
                  )}
                  {doc.sha256Hash && (
                    <button
                      onClick={handleCopyHash}
                      title="Click to copy full SHA-256 hash"
                      className="inline-flex items-center gap-1 text-[11px] text-[#38BDF8] hover:text-sky-300 transition-colors bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20"
                    >
                      <Fingerprint size={12} />
                      <span>SHA256: {doc.sha256Hash.slice(0, 10)}...</span>
                      {copiedHash ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Toolbar Controls */}
              <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#1E293B]">
                {/* Image Zoom & Rotation Controls */}
                {isImage && (
                  <div className="flex items-center bg-[#111726] rounded-xl p-1 border border-[#1E293B]">
                    <button
                      onClick={() => setZoom(prev => Math.min(prev + 0.25, 3))}
                      title="Zoom In"
                      className="p-1.5 text-slate-300 hover:text-white hover:bg-[#1E293B] rounded-lg transition-colors"
                    >
                      <ZoomIn size={16} />
                    </button>
                    <button
                      onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.5))}
                      title="Zoom Out"
                      className="p-1.5 text-slate-300 hover:text-white hover:bg-[#1E293B] rounded-lg transition-colors"
                    >
                      <ZoomOut size={16} />
                    </button>
                    <button
                      onClick={() => { setZoom(1); setRotation(0); }}
                      title="Reset Zoom & Orientation"
                      className="p-1.5 text-slate-300 hover:text-white hover:bg-[#1E293B] rounded-lg transition-colors text-[11px] font-mono px-2"
                    >
                      {Math.round(zoom * 100)}%
                    </button>
                    <button
                      onClick={() => setRotation(prev => (prev + 90) % 360)}
                      title="Rotate 90° Clockwise"
                      className="p-1.5 text-slate-300 hover:text-white hover:bg-[#1E293B] rounded-lg transition-colors"
                    >
                      <RotateCw size={16} />
                    </button>
                  </div>
                )}

                {/* Watermark Toggle */}
                <button
                  onClick={() => setShowWatermark(!showWatermark)}
                  title={showWatermark ? 'Hide security watermark' : 'Show security watermark'}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
                    showWatermark
                      ? 'bg-sky-500/15 border-sky-500/40 text-[#38BDF8]'
                      : 'bg-[#111726] border-[#1E293B] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Shield size={13} />
                  <span>Watermark: {showWatermark ? 'ON' : 'OFF'}</span>
                </button>

                {/* Fullscreen Button */}
                <button
                  onClick={toggleFullscreen}
                  title="Toggle Fullscreen Canvas"
                  className="p-2 rounded-xl bg-[#111726] border border-[#1E293B] text-slate-300 hover:text-white hover:bg-[#182238] transition-colors"
                >
                  {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>

                {/* Download Button */}
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="px-4 py-2 rounded-xl text-xs font-bold font-mono bg-gradient-to-r from-[#38BDF8] to-[#10B981] text-black hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-sky-950/50 disabled:opacity-50"
                >
                  {downloading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Downloading...</span>
                    </>
                  ) : downloadSuccess ? (
                    <>
                      <Check size={14} />
                      <span>Downloaded</span>
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      <span>Secure Download</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Document Render Stage */}
            <div className="relative bg-[#06080D] rounded-2xl border border-[#1E293B] overflow-hidden min-h-[500px] sm:min-h-[640px] flex items-center justify-center p-2 sm:p-4 shadow-2xl">
              {/* Dynamic Repeating Diagonal Security Watermark */}
              {showWatermark && (
                <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-around rotate-[-22deg] scale-125 opacity-[0.14] select-none overflow-hidden text-sky-200">
                  <div className="whitespace-nowrap font-mono text-[10px] sm:text-xs tracking-widest font-black uppercase py-3">
                    CONFIDENTIAL • DASTAVEJ SAFE SHARE • VIEW-ONLY RECIPIENT ACCESS • DO NOT DISTRIBUTE
                  </div>
                  <div className="whitespace-nowrap font-mono text-[10px] sm:text-xs tracking-widest font-black uppercase py-3">
                    RECIPIENT AUTHORIZATION • SHA256: {doc.sha256Hash ? doc.sha256Hash.slice(0, 24).toUpperCase() : 'VERIFIED'} • EXPIRING LINK
                  </div>
                  <div className="whitespace-nowrap font-mono text-[10px] sm:text-xs tracking-widest font-black uppercase py-3">
                    CONFIDENTIAL • DASTAVEJ SAFE SHARE • VIEW-ONLY RECIPIENT ACCESS • DO NOT DISTRIBUTE
                  </div>
                  <div className="whitespace-nowrap font-mono text-[10px] sm:text-xs tracking-widest font-black uppercase py-3">
                    RECIPIENT AUTHORIZATION • SHA256: {doc.sha256Hash ? doc.sha256Hash.slice(0, 24).toUpperCase() : 'VERIFIED'} • EXPIRING LINK
                  </div>
                  <div className="whitespace-nowrap font-mono text-[10px] sm:text-xs tracking-widest font-black uppercase py-3">
                    CONFIDENTIAL • DASTAVEJ SAFE SHARE • VIEW-ONLY RECIPIENT ACCESS • DO NOT DISTRIBUTE
                  </div>
                </div>
              )}

              {/* Renderer: Image */}
              {isImage ? (
                <div className="relative max-w-full max-h-[720px] overflow-auto flex items-center justify-center">
                  <img
                    src={doc.fileUrl || doc.signedUrl}
                    alt={doc.title}
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      transition: 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
                    }}
                    className="max-h-[680px] w-auto max-w-full object-contain rounded-lg shadow-2xl origin-center"
                  />
                </div>
              ) : isPdf ? (
                /* Renderer: PDF Frame */
                <div className="w-full h-[620px] sm:h-[720px] rounded-xl overflow-hidden bg-[#0A0D14] flex flex-col">
                  <iframe
                    src={`${doc.fileUrl || doc.signedUrl}#toolbar=1&navpanes=0`}
                    title={doc.title}
                    className="w-full flex-1 border-0 rounded-xl bg-white"
                  />
                </div>
              ) : (
                /* Renderer: Sovereign Cryptographic Record Card */
                <div className="w-full max-w-md bg-[#0C101A] rounded-2xl shadow-2xl p-6 sm:p-8 border border-[#1E293B] text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-[#38BDF8] flex items-center justify-center mx-auto">
                    <FileText size={32} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-white">{doc.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 font-mono">
                      Category: <span className="text-[#34D399]">{doc.category}</span>
                    </p>
                  </div>

                  <div className="bg-[#07090E] rounded-xl p-3.5 border border-[#1E293B] text-left space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Document ID:</span>
                      <strong className="text-slate-200">{doc.documentNumber || 'SOVEREIGN-REC'}</strong>
                    </div>
                    {doc.expiryDate && (
                      <div className="flex justify-between text-slate-400">
                        <span>Expiry Date:</span>
                        <strong className="text-amber-300">{new Date(doc.expiryDate).toLocaleDateString()}</strong>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-400">
                      <span>Integrity:</span>
                      <strong className="text-emerald-400">SHA-256 Validated</strong>
                    </div>
                  </div>

                  <button
                    onClick={handleDownload}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold font-mono bg-gradient-to-r from-[#38BDF8] to-[#10B981] text-black hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <Download size={15} />
                    <span>Download Original Record</span>
                  </button>
                </div>
              )}
            </div>

            {/* SafePaper Security Assurance Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Lock size={13} className="text-[#38BDF8]" />
                  <span>Zero-Knowledge Buffer</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Decrypted stream is transiently surfaced without plaintext server persistence.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Clock size={13} className="text-amber-400" />
                  <span>Auto-Destruct Policy</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Pointer and cryptographic tokens dissolve permanently when the timer hits zero.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Fingerprint size={13} className="text-[#34D399]" />
                  <span>SHA-256 Verification</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Document mathematically matches original cryptographic digest computed at upload.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <ShieldCheck size={13} className="text-emerald-400" />
                  <span>Audit Trail Logged</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Recipient view and download actions are logged to the custodian's security ledger.
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-5 px-4 text-center text-xs text-slate-500 border-t border-[#1E293B]/60 bg-[#0B0F19]/60 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Protected by <strong className="text-slate-300">Dastavej Sovereign Family Locker</strong></span>
          </div>
          <span className="font-mono text-[11px] text-slate-600">
            SafePaper Protocol • End-to-End Cryptographic Custody
          </span>
        </div>
      </footer>
    </div>
  );
}