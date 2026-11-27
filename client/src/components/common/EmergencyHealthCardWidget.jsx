import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HeartPulse,
  Copy,
  Check,
  Phone,
  AlertTriangle,
  ShieldAlert,
  ExternalLink,
  Sparkles,
  Plus,
  ChevronRight,
  Droplet,
  FileText,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';

export default function EmergencyHealthCardWidget({ onOpenFullModal }) {
  const { user, family, setIsEmergencyModalOpen } = useAuth();
  const { currentTheme } = useTheme();
  const { toast } = useToast();
  const isBlue = currentTheme === 'blue';

  const [emergencyData, setEmergencyData] = useState({ members: [], insuranceDocuments: [] });
  const [loading, setLoading] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getEmergencyCard();
      const members = res?.members || [];
      setEmergencyData(res || { members: [], insuranceDocuments: [] });

      if (members.length > 0) {
        // Default to logged-in user or first member
        const currentUserId = user?._id || user?.id;
        const myMember = members.find((m) => (m.id || m._id)?.toString() === currentUserId?.toString());
        setSelectedMemberId(myMember ? (myMember.id || myMember._id) : (members[0].id || members[0]._id));
      }
    } catch (err) {
      console.warn('[EmergencyHealthCardWidget] Failed to load:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeMember = emergencyData.members.find(
    (m) => (m.id || m._id)?.toString() === selectedMemberId?.toString()
  ) || emergencyData.members[0];

  const copyText = (text, fieldName, successMsg) => {
    if (!text || text === 'Not set' || text === 'None reported') return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(successMsg || 'Copied to clipboard!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyFullDirective = () => {
    if (!activeMember) return;
    const memo = `🏥 EMERGENCY MEDICAL DIRECTIVE — ${family?.name || 'GharVault'}\n` +
      `• Patient: ${activeMember.name} (${activeMember.relationship || activeMember.relation || 'Member'})\n` +
      `• Blood Group: ${activeMember.bloodGroup || 'Not specified'}\n` +
      `• Health Insurance Policy #: ${activeMember.healthInsurancePolicy || 'Not set'}\n` +
      `• TPA / Cashless Helpline: ${activeMember.tpaNumber || 'Not set'}\n` +
      `• Critical Allergies & Conditions: ${activeMember.allergies || 'None reported'}\n` +
      `• Primary Phone: ${activeMember.phone || 'Not set'}\n` +
      `• Emergency Contact: ${activeMember.emergencyContactPhone || activeMember.phone || 'Not set'}`;

    navigator.clipboard.writeText(memo);
    setCopiedField('fullDirective');
    toast.success(`Copied ${activeMember.name}'s hospital directive!`);
    setTimeout(() => setCopiedField(null), 2200);
  };

  if (loading) {
    return (
      <div className="rounded-3xl p-5 bg-white dark:bg-[#18181B] border border-red-200/80 dark:border-red-950/40 shadow-sm animate-pulse flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600">
            <HeartPulse size={20} className="animate-spin" />
          </div>
          <div className="space-y-1.5">
            <div className="w-44 h-4 bg-slate-200 dark:bg-neutral-800 rounded-md" />
            <div className="w-64 h-3 bg-slate-100 dark:bg-neutral-800 rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  // If no members in family
  if (!emergencyData.members || emergencyData.members.length === 0) {
    return null;
  }

  const hasBlood = activeMember?.bloodGroup && activeMember.bloodGroup !== 'Not specified' && activeMember.bloodGroup !== '—';
  const hasInsurance = activeMember?.healthInsurancePolicy && activeMember.healthInsurancePolicy !== 'Not set';
  const hasTpa = activeMember?.tpaNumber && activeMember.tpaNumber !== 'Not set';
  const hasAllergies = activeMember?.allergies && activeMember.allergies !== 'None reported';

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-50/80 via-white to-rose-50/60 dark:from-[#1b1214] dark:via-[#18181B] dark:to-[#1a1215] border border-red-200/90 dark:border-red-900/40 shadow-sm hover:shadow-md transition-all">
      {/* Decorative pulse ring watermark */}
      <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-red-500/5 dark:bg-red-500/10 blur-2xl pointer-events-none" />

      {/* Top Header Strip */}
      <div className="px-4 sm:px-6 py-3.5 border-b border-red-100 dark:border-red-950/50 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <HeartPulse size={18} className="animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] sm:text-xs font-black tracking-wider uppercase text-red-700 dark:text-red-400">
                1-Tap Emergency Health Card
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 text-[10px] font-bold border border-red-200 dark:border-red-900/50">
                <Sparkles size={10} className="text-red-600 dark:text-red-400" />
                Gemini Auto-Synced
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">
              Instant Hospital & Doctor Pass • Blood Groups, TPA Cashless Policies & Helpline
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (onOpenFullModal) onOpenFullModal();
              else if (setIsEmergencyModalOpen) setIsEmergencyModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Open Full Screen Doctor Pass"
          >
            <span>Doctor Pass</span>
            <ExternalLink size={12} />
          </button>
        </div>
      </div>

      {/* Member Selector Tabs */}
      <div className="px-4 sm:px-6 pt-3 pb-2 flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-red-100/60 dark:border-red-950/30">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 shrink-0 mr-1">
          Select Member:
        </span>
        {emergencyData.members.map((m) => {
          const mId = m.id || m._id;
          const isSelected = mId?.toString() === selectedMemberId?.toString();
          return (
            <button
              key={mId}
              type="button"
              onClick={() => setSelectedMemberId(mId)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-red-600 text-white shadow-xs scale-102'
                  : 'bg-white/80 dark:bg-[#201719] text-slate-700 dark:text-neutral-300 hover:bg-red-50 dark:hover:bg-red-950/40 border border-slate-200/80 dark:border-neutral-800'
              }`}
            >
              <img
                src={m.avatar || m.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name || 'Member')}&background=EF4444&color=fff`}
                alt={m.name}
                className="w-4 h-4 rounded-full object-cover"
              />
              <span className="truncate max-w-[110px]">{m.name}</span>
              {m.bloodGroup && m.bloodGroup !== 'Not specified' && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-white text-red-700 font-black' : 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300'
                }`}>
                  {m.bloodGroup}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Hospital Ready Grid for Selected Member */}
      {activeMember && (
        <div className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
            
            {/* 1. Patient Profile & Prominent Blood Badge */}
            <div className="p-4 rounded-2xl bg-white/90 dark:bg-[#151113] border border-red-200/70 dark:border-red-950/40 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={activeMember.avatar || activeMember.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeMember.name || 'Member')}&background=EF4444&color=fff`}
                  alt={activeMember.name}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover ring-2 ring-red-300 dark:ring-red-900 shadow-xs shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                      {activeMember.name}
                    </h3>
                  </div>
                  <span className="inline-block text-[10px] font-bold text-red-700 dark:text-red-400 bg-red-100/80 dark:bg-red-950/50 px-2 py-0.5 rounded-md mt-0.5">
                    {activeMember.relationship || activeMember.relation || 'Member'}
                  </span>
                  <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 flex items-center gap-2">
                    <span>{activeMember.phone || 'Phone not set'}</span>
                    {activeMember.phone && activeMember.phone !== 'Not set' && (
                      <a
                        href={`tel:${activeMember.phone}`}
                        className="inline-flex items-center gap-1 text-[10px] text-red-700 dark:text-red-400 font-bold hover:underline"
                      >
                        <Phone size={10} />
                        <span>Call</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Big High-Contrast Blood Group Badge */}
              <div className="px-3 py-2 rounded-2xl bg-gradient-to-b from-red-600 to-red-700 text-white text-center shrink-0 shadow-sm border border-red-500/30 min-w-[64px]">
                <div className="flex items-center justify-center gap-0.5 text-[9px] uppercase tracking-wider font-extrabold text-red-100">
                  <Droplet size={9} fill="currentColor" />
                  <span>Blood</span>
                </div>
                <div className="font-mono text-xl sm:text-2xl font-black leading-tight tracking-tight mt-0.5">
                  {hasBlood ? activeMember.bloodGroup : '—'}
                </div>
              </div>
            </div>

            {/* 2. Cashless Health Insurance & Policy # */}
            <div className="p-4 rounded-2xl bg-white/90 dark:bg-[#151113] border border-red-200/70 dark:border-red-950/40 flex flex-col justify-between shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-neutral-500 flex items-center gap-1">
                  <FileText size={11} className="text-red-500" />
                  <span>Health Insurance / TPA Card</span>
                </span>
                {hasInsurance && (
                  <button
                    type="button"
                    onClick={() => copyText(activeMember.healthInsurancePolicy, 'policy', 'Policy number copied!')}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 dark:text-red-400 hover:underline cursor-pointer"
                  >
                    {copiedField === 'policy' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    <span>{copiedField === 'policy' ? 'Copied' : 'Copy #'}</span>
                  </button>
                )}
              </div>

              <div>
                <div className="font-mono text-xs sm:text-sm font-extrabold text-slate-900 dark:text-neutral-200 truncate select-all">
                  {hasInsurance ? activeMember.healthInsurancePolicy : 'No policy linked yet'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-neutral-400 truncate mt-0.5 flex items-center justify-between">
                  <span>TPA: {hasTpa ? activeMember.tpaNumber : 'Auto-extracts from upload'}</span>
                  {hasTpa && activeMember.tpaNumber.match(/\d{8,12}/) && (
                    <a
                      href={`tel:${activeMember.tpaNumber.match(/\d{8,12}/)[0]}`}
                      className="text-[10px] font-bold text-red-700 dark:text-red-400 hover:underline ml-1"
                    >
                      Call TPA
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Emergency Contact & Critical Alerts */}
            <div className="p-4 rounded-2xl bg-white/90 dark:bg-[#151113] border border-red-200/70 dark:border-red-950/40 flex flex-col justify-between shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-neutral-500 flex items-center gap-1">
                  <AlertTriangle size={11} className="text-amber-500" />
                  <span>Emergency Directives</span>
                </span>
                {activeMember.emergencyContactPhone && activeMember.emergencyContactPhone !== 'Not set' && (
                  <a
                    href={`tel:${activeMember.emergencyContactPhone}`}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 dark:text-red-400 hover:underline"
                  >
                    <Phone size={11} />
                    <span>Call SOS</span>
                  </a>
                )}
              </div>

              <div>
                {hasAllergies ? (
                  <div className="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-[11px] font-bold text-amber-900 dark:text-amber-300 truncate">
                    ⚠️ {activeMember.allergies}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 dark:text-neutral-400">
                    Emergency Contact: <strong>{activeMember.emergencyContactPhone || activeMember.phone || 'Not set'}</strong>
                  </div>
                )}
                <p className="text-[10px] text-slate-400 dark:text-neutral-500 mt-1 truncate">
                  Show to hospital desk or emergency room for zero-delay cashless admission.
                </p>
              </div>
            </div>

          </div>

          {/* Action Row & Fast Upload Shortcut */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-red-100 dark:border-red-950/40 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyFullDirective}
                className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#201719] hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 font-extrabold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                {copiedField === 'fullDirective' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>{copiedField === 'fullDirective' ? 'Hospital Memo Copied!' : '1-Tap Copy Hospital Directive'}</span>
              </button>

              {(!hasBlood || !hasInsurance) && (
                <Link
                  to="/vault/upload"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 dark:text-red-400 hover:underline px-2 py-1"
                >
                  <Plus size={12} />
                  <span>Upload Medical / Policy Card</span>
                </Link>
              )}
            </div>

            <span className="text-[10px] text-slate-400 dark:text-neutral-500 hidden sm:inline">
              ✨ Uploading any mediclaim card or medical report auto-updates this card via Gemini Vision.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
