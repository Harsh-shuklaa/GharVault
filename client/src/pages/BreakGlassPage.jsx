import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  X,
  ShieldAlert,
  Lock,
  Unlock,
  Clock,
  Users,
  FileText,
  CheckCircle2,
  KeyRound,
  Phone,
  Mail,
  PhoneCall,
  ArrowRight,
  FileCheck,
  AlertCircle,
  Crown,
  Fingerprint,
  Activity,
  Check,
  Copy,
  Plus,
  RefreshCw,
  Share2,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function BreakGlassPage() {
  const { toast } = useToast();
  const { user, family } = useAuth();

  // Tab State: 'sos' | 'quorum' | 'guardians' | 'logs'
  const [activeTab, setActiveTab] = useState('sos');

  // Break-Glass Session State
  const [session, setSession] = useState(null);
  const [delayHours, setDelayHours] = useState(48);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [reason, setReason] = useState('Medical Emergency / Hospitalization');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ hours: 47, minutes: 59, seconds: 40 });
  const [confirmModal, setConfirmModal] = useState(null);

  // Multi-Sig Quorum State
  const [quorumRequests, setQuorumRequests] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [isQuorumModalOpen, setIsQuorumModalOpen] = useState(false);
  const [quorumDocId, setQuorumDocId] = useState('');
  const [quorumReason, setQuorumReason] = useState('Verification for emergency financial support');
  const [signingId, setSigningId] = useState(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Copied indicator
  const [copiedHash, setCopiedHash] = useState(null);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (confirmModal) setConfirmModal(null);
        if (isQuorumModalOpen) setIsQuorumModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmModal, isQuorumModalOpen]);

  // Initial Data Load
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setPageLoading(true);
      await Promise.allSettled([
        loadBreakGlassState(),
        loadQuorumRequests(),
        loadEmergencyAuditLogs(),
        loadDocumentsList(),
      ]);
    } finally {
      setPageLoading(false);
    }
  };

  const loadBreakGlassState = async () => {
    try {
      const res = await api.getBreakGlass();
      setSession(res.session);
      setDelayHours(res.delayHours || 48);
      setEmergencyContacts(res.emergencyContacts || []);

      // If active session with unlocksAt, calculate initial timeLeft
      if (res.session?.unlocksAt) {
        const diffMs = new Date(res.session.unlocksAt).getTime() - Date.now();
        if (diffMs > 0) {
          const totalSecs = Math.floor(diffMs / 1000);
          const hours = Math.floor(totalSecs / 3600);
          const minutes = Math.floor((totalSecs % 3600) / 60);
          const seconds = totalSecs % 60;
          setTimeLeft({ hours, minutes, seconds });
        }
      }
    } catch (err) {
      console.error('Failed to load break glass state:', err);
    }
  };

  const loadQuorumRequests = async () => {
    try {
      const res = await api.getQuorumRequests();
      setQuorumRequests(res.requests || []);
    } catch (err) {
      console.error('Failed to load quorum requests:', err);
    }
  };

  const loadDocumentsList = async () => {
    try {
      const res = await api.getDocuments();
      const docs = res.documents || [];
      setDocuments(docs);
      if (docs.length > 0 && !quorumDocId) {
        setQuorumDocId(docs[0]._id || docs[0].id);
      }
    } catch (err) {
      console.error('Failed to load documents list:', err);
    }
  };

  const loadEmergencyAuditLogs = async () => {
    try {
      setAuditLoading(true);
      const res = await api.getAuditLogs({ limit: 40 });
      const logs = res.logs || [];
      // Filter logs relevant to emergency, break-glass, or quorum
      const emergencyLogs = logs.filter((l) =>
        l.action?.includes('BREAK_GLASS') ||
        l.action?.includes('QUORUM') ||
        l.action?.includes('EMERGENCY') ||
        l.action?.includes('EXPORT') ||
        l.action?.includes('LEGAL')
      );
      setAuditLogs(emergencyLogs.length > 0 ? emergencyLogs : logs.slice(0, 8));
    } catch (err) {
      console.error('Failed to load emergency audit logs:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  // Live countdown ticker
  useEffect(() => {
    if (session && session.status === 'COUNTDOWN_ACTIVE') {
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
          if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
          if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
          return prev;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [session]);

  // Execute Arm Action
  const executeArm = async () => {
    try {
      setLoading(true);
      const res = await api.armBreakGlass({ reason, notes });
      setSession(res.session);
      toast.success('Break-Glass Protocol armed. 48-Hour countdown initiated.');
      await Promise.allSettled([loadBreakGlassState(), loadEmergencyAuditLogs()]);
    } catch (err) {
      toast.error('Failed to arm protocol: ' + (err.message || 'Error'));
    } finally {
      setLoading(false);
      setConfirmModal(null);
    }
  };

  const handleArm = (e) => {
    e.preventDefault();
    setConfirmModal({
      title: 'Arm 48-Hour Break-Glass Protocol',
      desc: 'Are you sure you want to arm the 48-Hour Emergency Break-Glass Protocol? All designated family guardians will be notified immediately via SMS, Email, and WhatsApp.',
      confirmText: 'Arm Protocol Now',
      isDanger: true,
      onConfirm: executeArm,
    });
  };

  // Execute Cancel Action
  const executeCancel = async () => {
    try {
      setLoading(true);
      const res = await api.cancelBreakGlass();
      setSession(res.session);
      toast.success('Emergency break-glass protocol disarmed. Vault safely re-sealed.');
      await Promise.allSettled([loadBreakGlassState(), loadEmergencyAuditLogs()]);
    } catch (err) {
      toast.error('Failed to cancel protocol: ' + (err.message || 'Error'));
    } finally {
      setLoading(false);
      setConfirmModal(null);
    }
  };

  const handleCancel = () => {
    setConfirmModal({
      title: 'Disarm Emergency Protocol',
      desc: 'Are you sure you want to cancel the emergency countdown and re-seal the vault? Notifications will be dispatched to confirm custody remains locked.',
      confirmText: 'Disarm & Re-Seal',
      isDanger: false,
      onConfirm: executeCancel,
    });
  };

  // Execute Force Trigger (Immediate Medical Override)
  const executeForceTrigger = async () => {
    try {
      setLoading(true);
      const res = await api.triggerBreakGlass();
      setSession(res.session);
      toast.success('Emergency override triggered: all critical records unlocked.');
      await Promise.allSettled([loadBreakGlassState(), loadEmergencyAuditLogs()]);
    } catch (err) {
      toast.error('Failed to trigger override: ' + (err.message || 'Error'));
    } finally {
      setLoading(false);
      setConfirmModal(null);
    }
  };

  const handleForceTrigger = () => {
    setConfirmModal({
      title: 'Emergency Medical Override (Immediate Unlock)',
      desc: 'CRITICAL ICU OVERRIDE: Are you sure you want to bypass the 48-hour delay window and immediately unlock all sealed deeds, wills, and health records for hospital triage?',
      confirmText: 'Trigger Immediate Override',
      isDanger: true,
      onConfirm: executeForceTrigger,
    });
  };

  // Quorum: Create New Request
  const handleCreateQuorum = async (e) => {
    e.preventDefault();
    if (!quorumDocId) {
      toast.error('Please select a document to unlock.');
      return;
    }
    try {
      setLoading(true);
      const res = await api.createQuorumRequest({
        documentId: quorumDocId,
        reason: quorumReason.trim(),
        actionType: 'VIEW_SENSITIVE',
      });
      toast.success(res.message || 'Multi-Sig Quorum sign-off initiated!');
      setIsQuorumModalOpen(false);
      await loadQuorumRequests();
      await loadEmergencyAuditLogs();
    } catch (err) {
      toast.error(err.message || 'Failed to create quorum request.');
    } finally {
      setLoading(false);
    }
  };

  // Quorum: Sign Request
  const handleSignQuorum = async (requestId) => {
    try {
      setSigningId(requestId);
      const res = await api.signQuorumRequest(requestId, {
        signerEmail: user?.email || 'guardian@gharvault.app',
      });
      toast.success(res.message || 'Cryptographic signature successfully sealed!');
      await loadQuorumRequests();
      await loadEmergencyAuditLogs();
    } catch (err) {
      toast.error(err.message || 'Failed to sign quorum request.');
    } finally {
      setSigningId(null);
    }
  };

  const handleCopyHash = (hash) => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    toast.success('Hash copied to clipboard!');
    setTimeout(() => setCopiedHash(null), 2500);
  };

  const isCountdownActive = session && session.status === 'COUNTDOWN_ACTIVE';
  const isUnlocked = session && session.status === 'COMPLETED_UNLOCKED';
  const pendingQuorumCount = quorumRequests.filter((q) => q.status === 'PENDING').length;

  return (
    <div className="max-w-[1380px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Warning Banner / Header */}
      <div className="bg-gradient-to-r from-red-950 via-red-900 to-rose-950 text-white rounded-2xl p-5 sm:p-6 border border-red-700/60 dark:border-red-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-white/10 border border-white/20 text-white flex items-center justify-center shrink-0 shadow-inner">
            <ShieldAlert size={28} className="text-red-300 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Emergency & Break-Glass Center
              </h1>
              {isCountdownActive ? (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-black font-mono text-[10px] font-extrabold uppercase animate-pulse">
                  Countdown Running
                </span>
              ) : isUnlocked ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-black font-mono text-[10px] font-extrabold uppercase">
                  Vault Unlocked
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-red-100 font-mono text-[10px] font-bold uppercase">
                  Sealed & Protected
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-red-100/90 mt-1 max-w-2xl leading-relaxed">
              Hospital triage protocol, 48-hour challenge countdown, and multi-signature succession custody compliant with Section 63 of the Indian Succession Act.
            </p>
          </div>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-stretch sm:self-auto">
          {isCountdownActive && (
            <button
              onClick={handleCancel}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-white text-red-900 font-bold text-xs hover:bg-red-50 transition-all shadow-md cursor-pointer inline-flex items-center gap-1.5"
            >
              <Lock size={14} />
              <span>Disarm Protocol</span>
            </button>
          )}

          {isUnlocked && (
            <button
              onClick={handleCancel}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all shadow-md cursor-pointer inline-flex items-center gap-1.5 border border-white/20"
            >
              <Lock size={14} />
              <span>Re-Seal Vault</span>
            </button>
          )}

          <button
            onClick={loadAllData}
            className="min-h-[42px] px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5 border border-white/15"
            title="Refresh status"
          >
            <RefreshCw size={14} className={pageLoading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* 4 Clean Segmented Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-[#262626] pb-1">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {/* Tab 1: Emergency SOS Unlock */}
          <button
            type="button"
            onClick={() => setActiveTab('sos')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'sos'
                ? 'bg-red-600 text-white dark:bg-red-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/20'
            }`}
          >
            <ShieldAlert size={16} className={isCountdownActive ? 'animate-pulse text-amber-300' : ''} />
            <span>Emergency SOS Unlock</span>
            {isCountdownActive ? (
              <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-amber-400 text-black font-extrabold animate-pulse">
                {timeLeft.hours}h {timeLeft.minutes}m
              </span>
            ) : isUnlocked ? (
              <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-emerald-400 text-black font-extrabold">
                OPEN
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300">
                48h Delay
              </span>
            )}
          </button>

          {/* Tab 2: Multi-Sig Quorum */}
          <button
            type="button"
            onClick={() => setActiveTab('quorum')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'quorum'
                ? 'bg-slate-900 text-white dark:bg-[#3ECF8E] dark:text-[#121212] shadow-sm'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1C1C1C]'
            }`}
          >
            <KeyRound size={16} />
            <span>Multi-Sig Quorum</span>
            {pendingQuorumCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-amber-500 text-black font-black animate-pulse">
                {pendingQuorumCount} PENDING
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-slate-200 dark:bg-[#262626] text-slate-700 dark:text-neutral-300">
                Dual-Key
              </span>
            )}
          </button>

          {/* Tab 3: Trusted Guardians */}
          <button
            type="button"
            onClick={() => setActiveTab('guardians')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'guardians'
                ? 'bg-slate-900 text-white dark:bg-[#3ECF8E] dark:text-[#121212] shadow-sm'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1C1C1C]'
            }`}
          >
            <Users size={16} />
            <span>Trusted Guardians</span>
            <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-slate-200 dark:bg-[#262626] text-slate-700 dark:text-neutral-300">
              {emergencyContacts.length}
            </span>
          </button>

          {/* Tab 4: Emergency Logs */}
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-slate-900 text-white dark:bg-[#3ECF8E] dark:text-[#121212] shadow-sm'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1C1C1C]'
            }`}
          >
            <Activity size={16} />
            <span>Emergency Logs</span>
            <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-slate-200 dark:bg-[#262626] text-slate-700 dark:text-neutral-300">
              Audit
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: 🚨 EMERGENCY SOS UNLOCK */}
      {activeTab === 'sos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Action Area (7 Cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-[#1C1C1C] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-6 transition-colors">
            {isUnlocked ? (
              /* State: Vault Unlocked */
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-[#3ECF8E]/20 text-emerald-600 dark:text-[#3ECF8E] flex items-center justify-center mx-auto shadow-inner">
                  <Unlock size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Emergency Custody Unlocked</h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
                  All high-value property deeds, registered wills, and medical directives are currently accessible to designated custodians.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    to="/vault"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] font-bold text-xs shadow-md shadow-[#3ECF8E]/20"
                  >
                    <span>Browse Unsealed Vault</span>
                    <ArrowRight size={14} />
                  </Link>
                  <button
                    onClick={handleCancel}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 dark:border-[#262626] text-slate-700 dark:text-neutral-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-[#262626] cursor-pointer"
                  >
                    Reset & Re-Seal Vault
                  </button>
                </div>
              </div>
            ) : isCountdownActive ? (
              /* State: Active Countdown */
              <div className="space-y-6">
                <div className="text-center py-4 space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-xs font-bold uppercase tracking-widest animate-pulse border border-red-200 dark:border-red-900/50">
                    <Clock size={14} />
                    <span>Countdown Challenge Running</span>
                  </div>

                  {/* 3-Digit Clock Display */}
                  <div className="flex items-center justify-center gap-2.5 sm:gap-3.5 pt-2">
                    <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-950/40 rounded-2xl border border-red-200 dark:border-red-900/40 text-center min-w-[76px] sm:min-w-[90px] shadow-xs">
                      <span className="text-3xl sm:text-4xl font-extrabold font-mono text-red-700 dark:text-red-400">
                        {String(timeLeft.hours).padStart(2, '0')}
                      </span>
                      <span className="block text-[10px] uppercase font-bold text-red-600 dark:text-red-400 mt-1">
                        Hours
                      </span>
                    </div>
                    <span className="text-2xl sm:text-3xl font-bold text-red-400">:</span>
                    <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-950/40 rounded-2xl border border-red-200 dark:border-red-900/40 text-center min-w-[76px] sm:min-w-[90px] shadow-xs">
                      <span className="text-3xl sm:text-4xl font-extrabold font-mono text-red-700 dark:text-red-400">
                        {String(timeLeft.minutes).padStart(2, '0')}
                      </span>
                      <span className="block text-[10px] uppercase font-bold text-red-600 dark:text-red-400 mt-1">
                        Minutes
                      </span>
                    </div>
                    <span className="text-2xl sm:text-3xl font-bold text-red-400">:</span>
                    <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-950/40 rounded-2xl border border-red-200 dark:border-red-900/40 text-center min-w-[76px] sm:min-w-[90px] shadow-xs">
                      <span className="text-3xl sm:text-4xl font-extrabold font-mono text-red-700 dark:text-red-400">
                        {String(timeLeft.seconds).padStart(2, '0')}
                      </span>
                      <span className="block text-[10px] uppercase font-bold text-red-600 dark:text-red-400 mt-1">
                        Seconds
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-2">
                    Emergency custody will automatically unlock on{' '}
                    <strong className="text-slate-900 dark:text-white font-mono">
                      {session?.unlocksAt ? new Date(session.unlocksAt).toLocaleString('en-IN') : 'in 48 hours'}
                    </strong>{' '}
                    unless cancelled by the vault admin.
                  </p>
                </div>

                {/* Dispatch Status Cards */}
                <div className="p-4 bg-slate-50 dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-[#262626] space-y-2 text-xs">
                  <span className="font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider block text-[11px]">
                    Emergency Multi-Channel Broadcast Status
                  </span>
                  <div className="space-y-2 text-slate-600 dark:text-neutral-300 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Phone size={13} className="text-slate-400" />
                        <span>SMS Directives to Nominees:</span>
                      </span>
                      <span className="font-mono text-[#10B981] dark:text-[#3ECF8E] font-bold">Delivered (2/2)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Mail size={13} className="text-slate-400" />
                        <span>Email Custody Notices:</span>
                      </span>
                      <span className="font-mono text-[#10B981] dark:text-[#3ECF8E] font-bold">Dispatched</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Share2 size={13} className="text-slate-400" />
                        <span>WhatsApp HSM Verified Broadcast:</span>
                      </span>
                      <span className="font-mono text-[#10B981] dark:text-[#3ECF8E] font-bold">Confirmed</span>
                    </div>
                  </div>
                </div>

                {/* Action Controls */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    onClick={handleCancel}
                    className="w-full sm:flex-1 py-3 rounded-xl border border-slate-300 dark:border-[#262626] text-slate-700 dark:text-neutral-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-[#262626] cursor-pointer text-center"
                  >
                    Disarm / Cancel Protocol
                  </button>
                  <button
                    onClick={handleForceTrigger}
                    className="w-full sm:flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 cursor-pointer text-center"
                  >
                    Force Immediate ICU Override
                  </button>
                </div>
              </div>
            ) : (
              /* State: Idle / Arm Protocol Form */
              <form onSubmit={handleArm} className="space-y-5">
                <div className="border-b border-slate-100 dark:border-[#262626] pb-3">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldAlert size={18} className="text-red-600 dark:text-red-400" />
                    <span>Arm Emergency Break-Glass Countdown</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                    Trigger a verified 48-hour safety window before sealed family records are unlocked.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                    Emergency Crisis Justification *
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#262626] text-xs font-semibold text-slate-900 dark:text-white bg-white dark:bg-[#141414] focus:border-[#10B981] dark:focus:border-[#3ECF8E] focus:outline-none cursor-pointer"
                  >
                    <option value="Medical Emergency / Hospitalization">Medical Emergency / Hospitalization</option>
                    <option value="Unforeseen Critical Accident">Unforeseen Critical Accident</option>
                    <option value="Legal & Succession Mandate">Legal & Succession Mandate</option>
                    <option value="Loss of Primary Custodian Contact">Loss of Primary Custodian Contact</option>
                    <option value="Other Critical Life Event">Other Critical Life Event</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                    Emergency Hospital / Case Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Admitted to Lilavati Hospital ICU, attending Dr. Mehta. Emergency access requested for insurance and locker paperwork."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-[#262626] text-xs font-medium text-slate-900 dark:text-white bg-white dark:bg-[#141414] focus:border-[#10B981] dark:focus:border-[#3ECF8E] focus:outline-none"
                  />
                </div>

                <div className="p-4 bg-red-50/70 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl text-xs text-red-900 dark:text-red-300 space-y-1.5">
                  <span className="font-bold flex items-center gap-1.5 text-xs">
                    <AlertTriangle size={15} className="text-red-600 dark:text-red-400" />
                    Strict Verification Policy:
                  </span>
                  <p className="text-[11px] text-red-800 dark:text-red-300/80 leading-relaxed">
                    Arming this protocol initiates a strict {delayHours}-hour countdown verification period. SMS and WhatsApp alerts are dispatched to all designated family nominees. The primary vault owner can cancel and disarm at any moment before the countdown finishes.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldAlert size={16} />
                  <span>{loading ? 'Arming Protocol...' : `Arm ${delayHours}-Hour Break-Glass Countdown`}</span>
                </button>
              </form>
            )}
          </div>

          {/* Right Explanatory & Protocol Workflow (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* 3-Step Safety Workflow Card */}
            <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Clock size={16} className="text-[#10B981] dark:text-[#3ECF8E]" />
                <span>How Break-Glass Security Works</span>
              </h3>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-[#262626] text-slate-700 dark:text-neutral-300 font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Protocol Triggered</h4>
                    <p className="text-slate-500 dark:text-neutral-400 text-[11px] mt-0.5">
                      Nominee requests emergency access due to medical or unforeseen hospitalization.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">48-Hour Challenge Window</h4>
                    <p className="text-slate-500 dark:text-neutral-400 text-[11px] mt-0.5">
                      SMS and WhatsApp alerts give the primary admin a 48-hour window to cancel if unauthorized.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-[#3ECF8E]/20 text-emerald-800 dark:text-[#3ECF8E] font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Automatic Custody Transfer</h4>
                    <p className="text-slate-500 dark:text-neutral-400 text-[11px] mt-0.5">
                      If uncontested after 48 hours, sealed property deeds, wills, and insurance are made accessible to guardians.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Legal Succession Compliance */}
            <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-3 text-xs text-slate-600 dark:text-neutral-400">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck size={16} className="text-emerald-600 dark:text-[#3ECF8E]" />
                <span>Indian Succession Act Compliance</span>
              </h3>
              <p className="leading-relaxed text-[11px]">
                Under Section 63 of the Indian Succession Act 1925, digitally stored testamentary records and health directives are held in trust. The break-glass countdown prevents unauthorized takeover while guaranteeing immediate availability during critical life events.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 🔑 MULTI-SIG QUORUM REQUESTS */}
      {activeTab === 'quorum' && (
        <div className="space-y-6">
          {/* Quorum Explanatory Card */}
          <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-[#262626] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-600 dark:text-[#3ECF8E] flex items-center justify-center shrink-0">
                <KeyRound size={24} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Multi-Signature Quorum Protocol
                </h2>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 max-w-xl">
                  Like a bank joint-locker key, sensitive assets (Property Deeds, Wills) require approval signatures from multiple family guardians before unlocking.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsQuorumModalOpen(true)}
              className="min-h-[42px] px-5 py-2.5 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] font-bold text-xs shadow-md shadow-[#3ECF8E]/20 transition-all inline-flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Initiate Quorum Request</span>
            </button>
          </div>

          {/* Quorum Requests List */}
          {quorumRequests.length === 0 ? (
            <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl border border-dashed border-slate-300 dark:border-[#27272A] p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#262626] text-slate-400 flex items-center justify-center mx-auto">
                <Lock size={22} />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">No active quorum requests</h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-md mx-auto">
                All sensitive documents are safely locked behind cryptographic dual-key protection. Click "Initiate Quorum Request" to ask family guardians for access.
              </p>
              <button
                type="button"
                onClick={() => setIsQuorumModalOpen(true)}
                className="mt-2 text-xs font-bold text-[#10B981] dark:text-[#3ECF8E] hover:underline cursor-pointer"
              >
                + Request Multi-Sig Document Access
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {quorumRequests.map((reqItem) => {
                const totalReq = reqItem.requiredSignatures || 2;
                const signedCount = reqItem.signatures?.length || 0;
                const percent = Math.min(100, Math.round((signedCount / totalReq) * 100));
                const isApproved = reqItem.status === 'APPROVED' || signedCount >= totalReq;
                const alreadySignedByMe = reqItem.signatures?.some(
                  (s) => s.userId?.toString() === user?._id?.toString() || s.userName === user?.name
                );

                return (
                  <div
                    key={reqItem._id}
                    className="bg-white dark:bg-[#1C1C1C] rounded-2xl border border-slate-200/80 dark:border-[#262626] p-5 shadow-xs space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Request Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-neutral-500">
                            Dual-Key Quorum #{reqItem._id.slice(-6)}
                          </span>
                          <h3 className="font-bold text-base text-slate-900 dark:text-white mt-0.5">
                            {reqItem.documentTitle || 'High-Value Sensitive Document'}
                          </h3>
                        </div>

                        {isApproved ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-700 dark:text-[#3ECF8E] border border-emerald-200 dark:border-[#3ECF8E]/20 flex items-center gap-1 shrink-0">
                            <CheckCircle2 size={12} />
                            <span>Approved</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 flex items-center gap-1 shrink-0">
                            <Clock size={12} />
                            <span>Awaiting Signatures</span>
                          </span>
                        )}
                      </div>

                      {/* Reason */}
                      <p className="text-xs text-slate-600 dark:text-neutral-300 bg-slate-50 dark:bg-[#141414] p-2.5 rounded-xl border border-slate-200/60 dark:border-[#262626]">
                        <strong className="text-slate-800 dark:text-white">Reason:</strong> {reqItem.reason}
                      </p>

                      {/* Signatures Progress */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-neutral-300">
                          <span>Quorum Threshold:</span>
                          <span className="font-mono text-emerald-700 dark:text-[#3ECF8E]">
                            {signedCount} of {totalReq} Signatures
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#262626] overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              isApproved ? 'bg-[#10B981] dark:bg-[#3ECF8E]' : 'bg-amber-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      {/* Signers list */}
                      <div className="space-y-2 pt-1">
                        <span className="text-[11px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider block">
                          Digital Signatures Sealed:
                        </span>
                        {reqItem.signatures?.map((sig, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#141414] border border-slate-100 dark:border-[#222225] text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <Fingerprint size={14} className="text-[#10B981] dark:text-[#3ECF8E]" />
                              <div>
                                <span className="font-bold text-slate-800 dark:text-white">{sig.userName}</span>
                                <span className="text-[10px] text-slate-400 ml-1.5">
                                  ({new Date(sig.signedAt).toLocaleDateString()})
                                </span>
                              </div>
                            </div>
                            <span className="font-mono text-[10px] text-slate-400 truncate max-w-[120px]">
                              {sig.digitalSignature?.slice(0, 14)}...
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-[#262626]">
                      {isApproved ? (
                        <Link
                          to={`/vault?search=${encodeURIComponent(reqItem.documentTitle || '')}`}
                          className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-700 dark:text-[#3ECF8E] font-bold text-xs hover:bg-emerald-100 dark:hover:bg-[#3ECF8E]/20 transition-colors"
                        >
                          <FileText size={14} />
                          <span>View Unlocked Document</span>
                        </Link>
                      ) : alreadySignedByMe ? (
                        <div className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-[#262626] text-slate-500 dark:text-neutral-400 font-bold text-xs text-center">
                          ✓ Signed by You (Awaiting Next Guardian)
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={signingId === reqItem._id}
                          onClick={() => handleSignQuorum(reqItem._id)}
                          className="w-full py-2.5 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] font-bold text-xs shadow-md shadow-[#3ECF8E]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Fingerprint size={15} />
                          <span>
                            {signingId === reqItem._id ? 'Signing with Digital Key...' : 'Sign & Seal Approval'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: 🛡️ TRUSTED GUARDIANS */}
      {activeTab === 'guardians' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-[#262626] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users size={18} className="text-[#10B981] dark:text-[#3ECF8E]" />
                <span>Designated Emergency Nominees & Guardians</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                These trusted members receive immediate challenge alerts and hold the emergency keys for hospital and succession handovers.
              </p>
            </div>

            <Link
              to="/family"
              className="min-h-[40px] px-4 py-2 rounded-xl border border-slate-300 dark:border-[#2E2E32] text-slate-800 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-[#262626] font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-colors shrink-0"
            >
              <span>Manage in Family Directory</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Guardians Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {emergencyContacts.map((contact) => (
              <div
                key={contact._id || contact.id}
                className="bg-white dark:bg-[#1C1C1C] rounded-2xl border border-slate-200/80 dark:border-[#262626] p-5 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Guardian Identity */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          contact.avatar ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(contact.name)}`
                        }
                        alt={contact.name}
                        className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-100 dark:ring-[#262626]"
                      />
                      <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">{contact.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-neutral-400 font-semibold">
                          {contact.relationship} • {contact.role || 'Guardian'}
                        </p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400">
                      SOS Nominee
                    </span>
                  </div>

                  {/* Verification & Channels */}
                  <div className="p-3 bg-slate-50 dark:bg-[#141414] rounded-xl border border-slate-100 dark:border-[#262626] space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600 dark:text-neutral-300">
                      <span>SMS Alerts:</span>
                      <span className="text-emerald-700 dark:text-[#3ECF8E] font-bold">✓ Active</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 dark:text-neutral-300">
                      <span>WhatsApp HSM:</span>
                      <span className="text-emerald-700 dark:text-[#3ECF8E] font-bold">✓ Verified</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 dark:text-neutral-300">
                      <span>Break-Glass Authority:</span>
                      <span className="font-bold text-slate-900 dark:text-white">Tier-1 Custodian</span>
                    </div>
                  </div>
                </div>

                {/* Direct Dial Action */}
                <div className="pt-3 border-t border-slate-100 dark:border-[#262626]">
                  {contact.phone ? (
                    <a
                      href={`tel:${contact.phone}`}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                    >
                      <PhoneCall size={14} />
                      <span>Call Guardian ({contact.phone})</span>
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 italic block text-center">No phone number recorded</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: 📜 EMERGENCY LOGS */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-[#262626] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity size={18} className="text-[#10B981] dark:text-[#3ECF8E]" />
                <span>Emergency Custody Audit Trail</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Tamper-evident, cryptographically chained logs of every emergency access attempt and quorum sign-off.
              </p>
            </div>

            <button
              onClick={loadEmergencyAuditLogs}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-[#2E2E32] text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-[#262626] font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <RefreshCw size={14} className={auditLoading ? 'animate-spin' : ''} />
              <span>Refresh Ledger</span>
            </button>
          </div>

          {/* Logs Table / List */}
          {auditLogs.length === 0 ? (
            <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl border border-slate-200/80 dark:border-[#262626] p-8 text-center text-xs text-slate-500">
              No emergency events recorded in the audit ledger yet.
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl border border-slate-200/80 dark:border-[#262626] shadow-xs overflow-hidden">
              <div className="divide-y divide-slate-100 dark:divide-[#262626]">
                {auditLogs.map((log) => {
                  const isArmed = log.action?.includes('ARMED');
                  const isCancelled = log.action?.includes('CANCELLED');
                  const isTriggered = log.action?.includes('TRIGGERED');
                  const isQuorum = log.action?.includes('QUORUM');

                  return (
                    <div
                      key={log._id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-[#222225]/40 transition-colors"
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isTriggered
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                              : isArmed
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : isQuorum
                              ? 'bg-[#3ECF8E]/10 text-emerald-700 dark:text-[#3ECF8E]'
                              : 'bg-slate-100 dark:bg-[#262626] text-slate-600 dark:text-neutral-300'
                          }`}
                        >
                          {isTriggered ? (
                            <Unlock size={18} />
                          ) : isArmed ? (
                            <AlertTriangle size={18} />
                          ) : isQuorum ? (
                            <KeyRound size={18} />
                          ) : (
                            <Lock size={18} />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                              {log.action?.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500">
                              by {log.performerName || 'Vault Admin'}
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                            {log.details?.reason || log.details?.status || 'Emergency security mandate processed.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 shrink-0 text-xs text-slate-400">
                        <span className="font-mono text-[11px]">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN') : 'Just now'}
                        </span>
                        {log.sha256ChainHash && (
                          <button
                            type="button"
                            onClick={() => handleCopyHash(log.sha256ChainHash)}
                            className="font-mono text-[10px] text-slate-400 hover:text-[#10B981] inline-flex items-center gap-1 cursor-pointer"
                            title="Click to copy SHA-256 seal"
                          >
                            <span>#{log.sha256ChainHash.slice(0, 10)}...</span>
                            {copiedHash === log.sha256ChainHash ? <Check size={11} /> : <Copy size={11} />}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal (Arm / Disarm / Override) */}
      {confirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
          onClick={() => setConfirmModal(null)}
        >
          <div
            className="fixed inset-x-0 bottom-0 md:static md:inset-auto w-full max-w-md bg-white dark:bg-[#18181B] border-t md:border border-slate-200 dark:border-[#27272A] rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col max-h-[88vh] md:max-h-[85vh] overflow-hidden transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="md:hidden flex justify-center pt-2.5 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-neutral-600" />
            </div>

            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-[#27272A] shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    confirmModal.isDanger
                      ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40'
                  }`}
                >
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">{confirmModal.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">Emergency Protocol Confirmation</p>
                </div>
              </div>
              <button
                onClick={() => setConfirmModal(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-[#27272A] text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-3">
              <p className="text-xs text-slate-700 dark:text-neutral-300 leading-relaxed">
                {confirmModal.desc}
              </p>
            </div>

            <div className="px-4 sm:px-6 py-3.5 bg-slate-50 dark:bg-[#141414] border-t border-slate-100 dark:border-[#27272A] flex flex-col-reverse sm:flex-row items-center sm:justify-end gap-2.5 shrink-0 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#27272A] font-bold text-xs transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                disabled={loading}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer text-center ${
                  confirmModal.isDanger
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
                    : 'bg-slate-900 dark:bg-[#262626] hover:bg-slate-800 text-white'
                }`}
              >
                <span>{loading ? 'Processing...' : confirmModal.confirmText || 'Confirm'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Quorum Request Modal */}
      {isQuorumModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsQuorumModalOpen(false)}
        >
          <div
            className="fixed inset-x-0 bottom-0 md:static md:inset-auto w-full max-w-lg bg-white dark:bg-[#18181B] border-t md:border border-slate-200 dark:border-[#27272A] rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col max-h-[88vh] md:max-h-[85vh] overflow-hidden transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="md:hidden flex justify-center pt-2.5 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-neutral-600" />
            </div>

            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-[#27272A] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-600 dark:text-[#3ECF8E] flex items-center justify-center shrink-0">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                    Initiate Dual-Key Quorum
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">Request family guardian sign-off</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuorumModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-[#27272A] text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form id="new-quorum-form" onSubmit={handleCreateQuorum} className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                  Select Document to Unlock *
                </label>
                {documents.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No sensitive documents found in vault.</p>
                ) : (
                  <select
                    value={quorumDocId}
                    onChange={(e) => setQuorumDocId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] text-xs font-semibold text-slate-900 dark:text-white bg-white dark:bg-[#141414] focus:border-[#10B981] dark:focus:border-[#3ECF8E] focus:outline-none cursor-pointer"
                  >
                    {documents.map((doc) => (
                      <option key={doc._id || doc.id} value={doc._id || doc.id}>
                        {doc.title} ({doc.category || 'General'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                  Reason for Emergency Access *
                </label>
                <textarea
                  rows={3}
                  required
                  value={quorumReason}
                  onChange={(e) => setQuorumReason(e.target.value)}
                  placeholder="Explain why this document needs multi-sig approval (e.g. Bank loan verification, property transfer)..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-[#27272A] text-xs font-medium text-slate-900 dark:text-white bg-white dark:bg-[#141414] focus:border-[#10B981] dark:focus:border-[#3ECF8E] focus:outline-none"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#27272A] text-xs text-slate-600 dark:text-neutral-400 space-y-1">
                <span className="font-bold text-slate-800 dark:text-white block">Quorum Rule:</span>
                <p className="text-[11px] leading-relaxed">
                  Requires 2 digital signatures from designated family guardians. Once sealed, access is granted for 24 hours.
                </p>
              </div>
            </form>

            <div className="px-4 sm:px-6 py-3.5 bg-slate-50 dark:bg-[#141414] border-t border-slate-100 dark:border-[#27272A] flex flex-col-reverse sm:flex-row items-center sm:justify-end gap-2.5 shrink-0 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => setIsQuorumModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#27272A] font-bold text-xs transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                form="new-quorum-form"
                type="submit"
                disabled={loading || documents.length === 0}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] font-bold text-xs shadow-md shadow-[#3ECF8E]/20 transition-all cursor-pointer text-center"
              >
                <KeyRound size={15} />
                <span>{loading ? 'Submitting...' : 'Dispatch Quorum Request'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
