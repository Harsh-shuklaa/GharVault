import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  UserPlus,
  Phone,
  Mail,
  ShieldAlert,
  Folder,
  ArrowRight,
  Trash2,
  X,
  AlertCircle,
  Edit3,
  KeyRound,
  Crown,
  CheckCircle2,
  Search,
  Share2,
  Copy,
  Check,
  HeartPulse,
  ChevronDown,
  ChevronUp,
  Users,
  PhoneCall,
  Activity,
  FileText,
  ShieldCheck,
  Shield,
  MessageCircle,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import EditMemberModal from '../components/common/EditMemberModal';
import JoinFamilyModal from '../components/common/JoinFamilyModal';
import DeleteMemberModal from '../components/common/DeleteMemberModal';
import TransferOwnershipModal from '../components/common/TransferOwnershipModal';

export default function FamilyDirectoryPage() {
  const { family, user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [notification, setNotification] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Hover Collapsible Sidebar State (matches AppLayout behavior)
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  // Tab State: 'members' | 'medical' | 'roles'
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(() => {
    return tabParam === 'medical' || tabParam === 'roles' ? tabParam : 'members';
  });

  useEffect(() => {
    if (tabParam && ['members', 'medical', 'roles'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams(newTab === 'members' ? {} : { tab: newTab });
  };

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRelation, setSelectedRelation] = useState('ALL');

  // Mobile Accordion Expansion: memberId or null
  const [expandedMemberId, setExpandedMemberId] = useState(null);

  // Copied State Indicators
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPolicyId, setCopiedPolicyId] = useState(null);

  // Close Add Modal on Escape & Lock Body Scroll
  useEffect(() => {
    if (isAddModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isAddModalOpen) {
        setIsAddModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAddModalOpen]);

  const [formData, setFormData] = useState({
    name: '',
    relationship: 'Spouse',
    email: '',
    phone: '',
    dob: '',
    bloodGroup: 'O+',
    healthInsurancePolicy: '',
    allergies: '',
    isEmergencyContact: false,
  });

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const res = await api.getMembers();
      setMembers(res.members || []);
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Please enter the full name of the family member.');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      const res = await api.addMember({
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      });

      // Immediate optimistic UI render
      if (res?.member) {
        setMembers((prev) => {
          const newId = (res.member._id || res.member.id)?.toString();
          const exists = prev.some((m) => (m._id || m.id)?.toString() === newId);
          return exists ? prev : [...prev, res.member];
        });
      }

      const addedName = formData.name.trim();
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        relationship: 'Spouse',
        email: '',
        phone: '',
        dob: '',
        bloodGroup: 'O+',
        healthInsurancePolicy: '',
        allergies: '',
        isEmergencyContact: false,
      });

      toast.success(`${addedName} was added to your family vault!`);
      // Background sync with database
      await loadMembers();
    } catch (err) {
      console.error('Add member error:', err);
      setError(err.message || 'Failed to add family member. Please check details and try again.');
      toast.error(err.message || 'Failed to add family member.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (member) => {
    setMemberToDelete(member);
  };

  const handleMemberDeleted = (result) => {
    if (memberToDelete) {
      const removedId = memberToDelete._id || memberToDelete.id;
      setMembers((prev) => prev.filter((m) => (m._id || m.id) !== removedId));
      const msg = result?.message || `${memberToDelete.name} was removed from the family vault.`;
      setNotification({
        type: 'success',
        message: msg,
      });
      toast.success(msg);
      setTimeout(() => setNotification(null), 6000);
      loadMembers();
    }
  };

  const handleOwnershipTransferred = (res) => {
    const msg = res?.message || 'Family Vault ownership transferred successfully!';
    setNotification({
      type: 'success',
      message: msg,
    });
    toast.success(msg);
    setTimeout(() => setNotification(null), 6000);
    loadMembers();
  };

  const adminId = family?.adminId?._id || family?.adminId;
  const isCurrentUserAdmin =
    user?.role === 'ADMIN' ||
    user?.role === 'HEAD' ||
    (adminId && (user?._id?.toString() === adminId.toString() || user?.id?.toString() === adminId.toString()));

  // Filter members based on Search and Relationship Category
  const filteredMembers = members.filter((member) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      member.name?.toLowerCase().includes(query) ||
      member.relationship?.toLowerCase().includes(query) ||
      member.phone?.toLowerCase().includes(query) ||
      member.email?.toLowerCase().includes(query) ||
      member.bloodGroup?.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (selectedRelation === 'ALL') return true;
    if (selectedRelation === 'Parents') {
      return ['Father', 'Mother', 'Grandfather', 'Grandmother'].includes(member.relationship);
    }
    if (selectedRelation === 'Kids') {
      return ['Son', 'Daughter'].includes(member.relationship);
    }
    if (selectedRelation === 'Spouse') {
      return member.relationship === 'Spouse';
    }
    if (selectedRelation === 'Emergency') {
      return Boolean(member.isEmergencyContact);
    }
    return true;
  });

  const toggleAccordion = (memberId) => {
    setExpandedMemberId((prev) => (prev === memberId ? null : memberId));
  };

  const handleCopyInviteCode = () => {
    const code = family?.inviteCode;
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast.success('Family invite code copied to clipboard!');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyPolicy = (id, policy) => {
    if (!policy) return;
    navigator.clipboard.writeText(policy);
    setCopiedPolicyId(id);
    toast.success(`Copied policy number: ${policy}`);
    setTimeout(() => setCopiedPolicyId(null), 2500);
  };

  // Generate Emergency Medical WhatsApp text
  const handleCopyOrShareAllEmergency = (shareWhatsApp = false) => {
    const vaultName = family?.name || 'GharVault Family';
    let text = `🚨 *EMERGENCY MEDICAL SUMMARY - ${vaultName.toUpperCase()}*\n`;
    text += `Generated securely via GharVault on ${new Date().toLocaleDateString('en-IN')}\n\n`;

    members.forEach((m, idx) => {
      text += `${idx + 1}. *${m.name}* (${m.relationship || 'Member'})\n`;
      text += `   🩸 Blood Group: *${m.bloodGroup || 'Not specified'}*\n`;
      if (m.phone) text += `   📞 Phone: ${m.phone}\n`;
      if (m.healthInsurancePolicy) text += `   🏥 Insurance Policy: ${m.healthInsurancePolicy}\n`;
      if (m.allergies) text += `   ⚠️ Allergies/Notes: ${m.allergies}\n`;
      if (m.isEmergencyContact) text += `   🚨 *Primary Emergency Contact*\n`;
      text += `\n`;
    });

    if (shareWhatsApp) {
      const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Emergency Medical Summary copied to clipboard!');
    }
  };

  const emergencyCount = members.filter((m) => m.isEmergencyContact).length;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-[#F8FAFC] dark:bg-[#121212]">
      {/* ================= COLLAPSIBLE HOVER SECONDARY SIDEBAR ================= */}
      <aside
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`hidden md:flex flex-col justify-between shrink-0 bg-white dark:bg-[#141414] border-r border-slate-200 dark:border-[#262626] transition-all duration-200 ease-in-out select-none px-3 py-3 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${
          isSidebarHovered ? 'w-56' : 'w-16'
        }`}
      >
        <div className="flex flex-col">
          {/* Family Brand & Vault Summary */}
          <div className="flex items-center gap-2.5 px-1 py-1 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] flex items-center justify-center font-bold shadow-xs shrink-0">
              <Users size={18} strokeWidth={2.2} />
            </div>
            <div
              className={`flex flex-col min-w-0 transition-all duration-200 ${
                isSidebarHovered ? 'opacity-100 max-w-[150px] ml-2.5' : 'opacity-0 max-w-0 ml-0 pointer-events-none'
              }`}
            >
              <span className="font-bold text-xs text-slate-900 dark:text-white truncate leading-tight">
                {family?.name || 'Family Vault'}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-neutral-400 truncate mt-0.5">
                {members.length} Members Registered
              </span>
            </div>
          </div>

          {/* Section Divider */}
          <div className="border-t border-slate-200 dark:border-[#262626] my-2" />

          {/* Group 1: DIRECTORIES & LISTS */}
          <nav className="space-y-1">
            {/* Nav Item: Family Roster */}
            <button
              type="button"
              onClick={() => handleTabChange('members')}
              title={!isSidebarHovered ? 'Family Roster' : undefined}
              className={`w-full group/item flex items-center h-9 px-2.5 rounded-md transition-all select-none cursor-pointer text-left ${
                activeTab === 'members'
                  ? 'bg-emerald-50 text-emerald-700 font-medium shadow-xs dark:bg-[#262626] dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-normal dark:text-[#9CA3AF] dark:hover:text-[#F3F4F6] dark:hover:bg-white/[0.04]'
              }`}
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <Users
                  size={18}
                  strokeWidth={1.75}
                  className={activeTab === 'members' ? 'text-emerald-600 dark:text-[#3ECF8E]' : 'text-slate-500'}
                />
              </div>
              <span
                className={`whitespace-nowrap overflow-hidden transition-all duration-200 text-[13px] leading-tight ${
                  isSidebarHovered ? 'opacity-100 max-w-[140px] ml-2.5' : 'opacity-0 max-w-0 ml-0 pointer-events-none'
                } ${activeTab === 'members' ? 'text-emerald-700 dark:text-white font-medium' : 'text-slate-600 font-normal'}`}
              >
                Family Roster
              </span>
              <span
                className={`ml-auto shrink-0 transition-all duration-200 ${
                  isSidebarHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                }`}
              >
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    activeTab === 'members'
                      ? 'bg-emerald-200/60 text-emerald-800 dark:bg-[#3ECF8E]/20 dark:text-[#3ECF8E] font-bold'
                      : 'bg-slate-100 dark:bg-[#262626] text-slate-500'
                  }`}
                >
                  {members.length}
                </span>
              </span>
            </button>

            {/* Nav Item: Emergency Medical Deck */}
            <button
              type="button"
              onClick={() => handleTabChange('medical')}
              title={!isSidebarHovered ? 'Emergency Medical Deck' : undefined}
              className={`w-full group/item flex items-center h-9 px-2.5 rounded-md transition-all select-none cursor-pointer text-left ${
                activeTab === 'medical'
                  ? 'bg-red-50 text-red-700 font-medium shadow-xs dark:bg-red-950/40 dark:text-red-300'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-normal dark:text-[#9CA3AF] dark:hover:text-[#F3F4F6] dark:hover:bg-white/[0.04]'
              }`}
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <HeartPulse
                  size={18}
                  strokeWidth={1.75}
                  className={activeTab === 'medical' ? 'text-red-600 dark:text-red-400' : 'text-slate-500'}
                />
              </div>
              <span
                className={`whitespace-nowrap overflow-hidden transition-all duration-200 text-[13px] leading-tight ${
                  isSidebarHovered ? 'opacity-100 max-w-[140px] ml-2.5' : 'opacity-0 max-w-0 ml-0 pointer-events-none'
                } ${activeTab === 'medical' ? 'text-red-700 dark:text-red-300 font-medium' : 'text-slate-600 font-normal'}`}
              >
                Emergency Deck
              </span>
              <span
                className={`ml-auto shrink-0 transition-all duration-200 ${
                  isSidebarHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                }`}
              >
                {emergencyCount > 0 ? (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 font-bold">
                    {emergencyCount} SOS
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 dark:bg-[#262626] text-slate-500">
                    Triage
                  </span>
                )}
              </span>
            </button>

            {/* Nav Item: Roles & Access */}
            <button
              type="button"
              onClick={() => handleTabChange('roles')}
              title={!isSidebarHovered ? 'Vault Roles & Ownership' : undefined}
              className={`w-full group/item flex items-center h-9 px-2.5 rounded-md transition-all select-none cursor-pointer text-left ${
                activeTab === 'roles'
                  ? 'bg-amber-50 text-amber-800 font-medium shadow-xs dark:bg-amber-500/10 dark:text-amber-300'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-normal dark:text-[#9CA3AF] dark:hover:text-[#F3F4F6] dark:hover:bg-white/[0.04]'
              }`}
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <Crown
                  size={18}
                  strokeWidth={1.75}
                  className={activeTab === 'roles' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}
                />
              </div>
              <span
                className={`whitespace-nowrap overflow-hidden transition-all duration-200 text-[13px] leading-tight ${
                  isSidebarHovered ? 'opacity-100 max-w-[140px] ml-2.5' : 'opacity-0 max-w-0 ml-0 pointer-events-none'
                } ${activeTab === 'roles' ? 'text-amber-800 dark:text-amber-300 font-medium' : 'text-slate-600 font-normal'}`}
              >
                Roles & Access
              </span>
              <span
                className={`ml-auto shrink-0 transition-all duration-200 ${
                  isSidebarHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                }`}
              >
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 dark:bg-[#262626] text-slate-500">
                  Admin
                </span>
              </span>
            </button>
          </nav>

          {/* Section Divider */}
          <div className="border-t border-slate-200 dark:border-[#262626] my-2" />

          {/* Group 2: ACTIONS */}
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              title={!isSidebarHovered ? 'Add Family Member' : undefined}
              className="w-full group/item flex items-center h-9 px-2.5 rounded-md bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] transition-colors cursor-pointer select-none"
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <UserPlus size={17} strokeWidth={2.2} />
              </div>
              <span
                className={`whitespace-nowrap overflow-hidden transition-all duration-200 text-[13px] leading-tight font-bold ${
                  isSidebarHovered ? 'opacity-100 max-w-[140px] ml-2.5' : 'opacity-0 max-w-0 ml-0 pointer-events-none'
                }`}
              >
                + Add Member
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsJoinModalOpen(true)}
              title={!isSidebarHovered ? 'Join via Invite Code' : undefined}
              className="w-full group/item flex items-center h-9 px-2.5 rounded-md border border-slate-300 dark:border-[#2E2E2E] bg-white dark:bg-[#1C1C1C] hover:bg-slate-50 dark:hover:bg-[#262626] text-slate-800 dark:text-[#EDEDED] transition-colors cursor-pointer select-none"
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <KeyRound size={16} strokeWidth={2} className="text-[#10B981] dark:text-[#3ECF8E]" />
              </div>
              <span
                className={`whitespace-nowrap overflow-hidden transition-all duration-200 text-[13px] leading-tight font-bold ${
                  isSidebarHovered ? 'opacity-100 max-w-[140px] ml-2.5' : 'opacity-0 max-w-0 ml-0 pointer-events-none'
                }`}
              >
                Join via Code
              </span>
            </button>
          </div>
        </div>

        {/* Bottom Pinned Family Code Card */}
        <div className="pt-2 border-t border-slate-200 dark:border-[#262626] my-1">
          {isSidebarHovered ? (
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#18181B] border border-slate-200/80 dark:border-[#262626] animate-fadeIn">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                <span>Invite Code</span>
                <button
                  type="button"
                  onClick={handleCopyInviteCode}
                  className="text-[#10B981] dark:text-[#3ECF8E] hover:underline cursor-pointer"
                >
                  {copiedCode ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="font-mono font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
                <span>{family?.inviteCode || 'N/A'}</span>
                {family?.inviteCode && (
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Join our GharVault family vault! Use this invite code during sign up: ${family.inviteCode}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-600 dark:text-[#3ECF8E] hover:opacity-80"
                    title="Share on WhatsApp"
                  >
                    <Share2 size={13} />
                  </a>
                )}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleCopyInviteCode}
              title={`Invite Code: ${family?.inviteCode || 'N/A'} (Click to copy)`}
              className="w-full flex items-center justify-center h-9 rounded-md text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              <Copy size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* ================= RIGHT MAIN CONTENT CANVAS ================= */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
        {/* Mobile Navigation Pill Bar (< 768px) */}
        <div className="md:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-2 px-2">
          <button
            onClick={() => handleTabChange('members')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 ${
              activeTab === 'members'
                ? 'bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212]'
                : 'bg-white dark:bg-[#1C1C1C] text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-[#262626]'
            }`}
          >
            <Users size={14} />
            <span>Roster ({members.length})</span>
          </button>
          <button
            onClick={() => handleTabChange('medical')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 ${
              activeTab === 'medical'
                ? 'bg-red-600 text-white'
                : 'bg-white dark:bg-[#1C1C1C] text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-[#262626]'
            }`}
          >
            <HeartPulse size={14} />
            <span>Medical {emergencyCount > 0 ? `(${emergencyCount} SOS)` : ''}</span>
          </button>
          <button
            onClick={() => handleTabChange('roles')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 ${
              activeTab === 'roles'
                ? 'bg-amber-600 text-white'
                : 'bg-white dark:bg-[#1C1C1C] text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-[#262626]'
            }`}
          >
            <Crown size={14} />
            <span>Roles</span>
          </button>
        </div>

        {/* Top Header Row for Content Pane */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#262626] pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {activeTab === 'members'
                  ? 'Family Roster'
                  : activeTab === 'medical'
                  ? 'Emergency Medical Deck'
                  : 'Vault Roles & Ownership'}
              </h1>
              {activeTab === 'members' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-700 dark:text-[#3ECF8E] border border-emerald-200/60 dark:border-[#3ECF8E]/20">
                  {members.length} {members.length === 1 ? 'Member' : 'Members'}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
              {activeTab === 'members'
                ? `Directory of all members registered in ${family?.name || 'your family vault'}.`
                : activeTab === 'medical'
                ? 'High-contrast blood groups, verified insurance policies, and hospital triage directives.'
                : 'Primary administration status, family invite code sharing, and access permissions.'}
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            {isCurrentUserAdmin && members.length > 1 && (
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(true)}
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/10 hover:bg-amber-100/60 dark:hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold text-xs transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Crown size={14} className="text-amber-500" />
                <span>Transfer Head</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="min-h-[38px] px-4 py-1.5 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] font-bold text-xs shadow-md shadow-[#3ECF8E]/20 transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <UserPlus size={14} strokeWidth={2.4} />
              <span>+ Add Member</span>
            </button>
          </div>
        </div>

        {/* Notification Toast Banner */}
        {notification && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-[#3ECF8E]/10 border border-emerald-200 dark:border-[#3ECF8E]/20 text-emerald-800 dark:text-[#3ECF8E] text-xs font-semibold flex items-center justify-between shadow-xs animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0 text-[#10B981] dark:text-[#3ECF8E]" />
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-emerald-700 dark:text-[#3ECF8E] hover:opacity-75 cursor-pointer ml-3"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Dynamic Tab Body */}
        {loading ? (
          /* Loading Skeleton */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#1C1C1C] rounded-2xl border border-slate-200/80 dark:border-[#262626] p-5 animate-pulse space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-200 dark:bg-[#262626] rounded-xl"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-200 dark:bg-[#262626] rounded w-2/3"></div>
                    <div className="h-3 bg-slate-200 dark:bg-[#262626] rounded w-1/3"></div>
                  </div>
                </div>
                <div className="h-8 bg-slate-100 dark:bg-[#262626] rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : members.length === 0 ? (
          /* Empty State */
          <div className="bg-white dark:bg-[#1C1C1C] rounded-3xl border border-slate-200/80 dark:border-[#262626] p-10 sm:p-14 text-center max-w-xl mx-auto shadow-sm transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-600 dark:text-[#3ECF8E] flex items-center justify-center mx-auto mb-4">
              <Users size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              No family members added yet
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-2 leading-relaxed">
              Add your parents, spouse, or children so their IDs, blood groups, and insurance policies are safely organized together.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setIsJoinModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-[#2E2E2E] bg-white dark:bg-[#141414] hover:bg-slate-50 dark:hover:bg-[#202020] text-slate-800 dark:text-[#EDEDED] font-bold text-xs transition-all shadow-xs cursor-pointer"
              >
                <KeyRound size={15} className="text-[#10B981] dark:text-[#3ECF8E]" />
                <span>Join via Invite Code</span>
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] font-bold text-xs shadow-md shadow-[#3ECF8E]/25 transition-all cursor-pointer"
              >
                <UserPlus size={16} strokeWidth={2.2} />
                <span>+ Add First Member</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* TAB 1: FAMILY ROSTER */}
            {activeTab === 'members' && (
              <div className="space-y-4">
                {/* Search Bar & Relationship Filter Chips */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-[#18181B] p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-[#27272A] shadow-xs">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, relation, phone, or blood group..."
                      className="w-full pl-9 pr-8 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-[#10B981] dark:focus:border-[#3ECF8E]"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                    {['ALL', 'Parents', 'Kids', 'Spouse', 'Emergency'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedRelation(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          selectedRelation === cat
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-xs'
                            : 'bg-slate-100 dark:bg-[#222225] text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {cat === 'Emergency' ? '🚨 Emergency' : cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Zero Filter Result */}
                {filteredMembers.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-[#1C1C1C] rounded-2xl border border-dashed border-slate-300 dark:border-[#27272A]">
                    <p className="text-sm font-semibold text-slate-600 dark:text-neutral-400">
                      No family members matched "{searchQuery}".
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedRelation('ALL');
                      }}
                      className="mt-3 text-xs font-bold text-[#10B981] dark:text-[#3ECF8E] hover:underline cursor-pointer"
                    >
                      Clear search and filters
                    </button>
                  </div>
                ) : (
                  <>
                    {/* MOBILE VIEW: COMPACT SMART ROWS (sm:hidden) */}
                    <div className="sm:hidden space-y-2.5">
                      {filteredMembers.map((member) => {
                        const adminIdVal = family?.adminId?._id || family?.adminId;
                        const isVaultAdmin = Boolean(
                          adminIdVal &&
                            (member._id?.toString() === adminIdVal.toString() ||
                              member.id?.toString() === adminIdVal.toString())
                        );
                        const isSelf =
                          member._id?.toString() === user?._id?.toString() ||
                          member.id?.toString() === user?._id?.toString();
                        const canDelete = !isVaultAdmin && (isCurrentUserAdmin || isSelf);
                        const isExpanded = expandedMemberId === (member._id || member.id);

                        return (
                          <div
                            key={member._id || member.id}
                            className="bg-white dark:bg-[#1C1C1C] rounded-2xl border border-slate-200/80 dark:border-[#262626] shadow-xs overflow-hidden transition-all"
                          >
                            <div
                              onClick={() => toggleAccordion(member._id || member.id)}
                              className="p-3 flex items-center justify-between gap-2.5 cursor-pointer active:bg-slate-50 dark:active:bg-[#222225]"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="relative shrink-0">
                                  <img
                                    src={
                                      member.avatar ||
                                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name)}`
                                    }
                                    alt={member.name}
                                    className="w-11 h-11 rounded-xl object-cover ring-2 ring-slate-100 dark:ring-[#262626]"
                                  />
                                  {isVaultAdmin ? (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center ring-1 ring-white dark:ring-[#1C1C1C]">
                                      <Crown size={9} />
                                    </span>
                                  ) : (
                                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#10B981] dark:bg-[#3ECF8E] ring-1.5 ring-white dark:ring-[#1C1C1C]" />
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                      {member.name}
                                    </h3>
                                    {isSelf && (
                                      <span className="shrink-0 text-[10px] font-bold text-emerald-700 dark:text-[#3ECF8E] bg-emerald-50 dark:bg-[#3ECF8E]/10 px-1.5 py-0.2 rounded-md border border-emerald-200/60 dark:border-[#3ECF8E]/20">
                                        You
                                      </span>
                                    )}
                                    {isVaultAdmin && (
                                      <span className="shrink-0 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.2 rounded-md">
                                        Head
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                                    <span className="font-medium truncate">{member.relationship}</span>
                                    <span>•</span>
                                    <span className="font-bold text-red-600 dark:text-red-400 shrink-0">
                                      🩸 {member.bloodGroup || 'N/A'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {member.phone && (
                                  <>
                                    <a
                                      href={`tel:${member.phone}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-600 dark:text-[#3ECF8E] flex items-center justify-center hover:bg-emerald-100 dark:hover:bg-[#3ECF8E]/20"
                                      title="Call Member"
                                    >
                                      <PhoneCall size={14} />
                                    </a>
                                    <a
                                      href={`https://wa.me/${member.phone.replace(/[^0-9]/g, '').length === 10 ? '91' + member.phone.replace(/[^0-9]/g, '') : member.phone.replace(/[^0-9]/g, '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-600 dark:text-[#3ECF8E] flex items-center justify-center hover:bg-emerald-100 dark:hover:bg-[#3ECF8E]/20"
                                      title="WhatsApp Member"
                                    >
                                      <MessageCircle size={14} />
                                    </a>
                                  </>
                                )}

                                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-[#262626] text-slate-500 dark:text-neutral-400 flex items-center justify-center">
                                  {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                </div>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="px-3.5 pb-3.5 pt-2 border-t border-slate-100 dark:border-[#262626] bg-slate-50/50 dark:bg-[#141414]/50 space-y-3 animate-fadeIn text-xs">
                                <div className="space-y-1.5 text-slate-600 dark:text-neutral-300">
                                  {member.phone && (
                                    <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-[#222225]">
                                      <span className="text-[11px] text-slate-400 dark:text-neutral-500">Phone:</span>
                                      <div className="flex items-center gap-2">
                                        <a
                                          href={`tel:${member.phone}`}
                                          className="font-mono font-semibold text-slate-900 dark:text-white hover:text-[#10B981]"
                                        >
                                          {member.phone}
                                        </a>
                                        <a
                                          href={`https://wa.me/${member.phone.replace(/[^0-9]/g, '').length === 10 ? '91' + member.phone.replace(/[^0-9]/g, '') : member.phone.replace(/[^0-9]/g, '')}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="px-1.5 py-0.2 rounded text-[10px] font-bold text-emerald-700 dark:text-[#3ECF8E] bg-emerald-50 dark:bg-[#3ECF8E]/10 hover:bg-emerald-100"
                                        >
                                          WhatsApp
                                        </a>
                                      </div>
                                    </div>
                                  )}
                                  {member.email && (
                                    <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-[#222225]">
                                      <span className="text-[11px] text-slate-400 dark:text-neutral-500">Email:</span>
                                      <span className="font-medium text-slate-800 dark:text-neutral-200 truncate max-w-[200px]">
                                        {member.email}
                                      </span>
                                    </div>
                                  )}
                                  {member.healthInsurancePolicy && (
                                    <div className="flex items-center justify-between py-1.5 bg-emerald-50/80 dark:bg-[#3ECF8E]/10 px-2.5 rounded-lg border border-emerald-100 dark:border-[#3ECF8E]/20">
                                      <div className="min-w-0">
                                        <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-[#3ECF8E] block">
                                          Health Insurance Policy:
                                        </span>
                                        <span className="font-mono font-bold text-slate-900 dark:text-white truncate block">
                                          {member.healthInsurancePolicy}
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleCopyPolicy(member._id, member.healthInsurancePolicy)}
                                        className="p-1 rounded-md text-emerald-700 dark:text-[#3ECF8E] hover:bg-emerald-100 dark:hover:bg-[#3ECF8E]/20"
                                        title="Copy Policy No"
                                      >
                                        {copiedPolicyId === member._id ? <Check size={14} /> : <Copy size={14} />}
                                      </button>
                                    </div>
                                  )}
                                  {member.allergies && (
                                    <div className="py-1 text-amber-700 dark:text-amber-400 font-medium">
                                      ⚠️ Allergies: {member.allergies}
                                    </div>
                                  )}
                                  {member.isEmergencyContact && (
                                    <div className="py-1">
                                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 dark:text-red-400 bg-red-100/70 dark:bg-red-500/20 px-2 py-0.5 rounded-md">
                                        <ShieldAlert size={12} />
                                        Primary Emergency Contact
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-200/60 dark:border-[#262626]">
                                  <Link
                                    to={`/vault?member=${member._id || member.id}`}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-200/70 dark:bg-[#262626] text-slate-700 dark:text-neutral-200 font-bold text-[11px] hover:bg-slate-300 dark:hover:bg-[#333]"
                                  >
                                    <Folder size={12} />
                                    <span>{member.assignedDocumentsCount || 0} Docs</span>
                                  </Link>

                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setEditingMember(member)}
                                      className="p-1.5 rounded-lg text-slate-500 hover:text-[#10B981] dark:hover:text-[#3ECF8E] bg-white dark:bg-[#1E1E22] border border-slate-200 dark:border-[#2E2E32]"
                                      title="Edit Profile"
                                    >
                                      <Edit3 size={14} />
                                    </button>

                                    <Link
                                      to={`/family/${member._id || member.id}`}
                                      className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-700 dark:text-[#3ECF8E] font-bold text-[11px] inline-flex items-center gap-1"
                                    >
                                      <span>Profile</span>
                                      <ArrowRight size={12} />
                                    </Link>

                                    {canDelete && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteClick(member)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 bg-white dark:bg-[#1E1E22] border border-slate-200 dark:border-[#2E2E32]"
                                        title={isSelf ? 'Leave Family' : 'Remove Member'}
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* DESKTOP VIEW: COMPACT MODERN CARDS (hidden sm:grid) */}
                    <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-3.5">
                      {filteredMembers.map((member) => {
                        const adminIdVal = family?.adminId?._id || family?.adminId;
                        const isVaultAdmin = Boolean(
                          adminIdVal &&
                            (member._id?.toString() === adminIdVal.toString() ||
                              member.id?.toString() === adminIdVal.toString())
                        );
                        const isSelf =
                          member._id?.toString() === user?._id?.toString() ||
                          member.id?.toString() === user?._id?.toString();
                        const canDelete = !isVaultAdmin && (isCurrentUserAdmin || isSelf);

                        return (
                          <div
                            key={member._id || member.id}
                            className="bg-white dark:bg-[#1C1C1C] rounded-xl border border-slate-200/80 dark:border-[#262626] p-3.5 sm:p-4 shadow-2xs hover:border-[#10B981] dark:hover:border-[#3ECF8E] hover:shadow-sm transition-all flex flex-col justify-between group"
                          >
                            <div>
                              <div className="flex items-start justify-between mb-2.5">
                                <div className="relative">
                                  <img
                                    src={
                                      member.avatar ||
                                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name)}`
                                    }
                                    alt={member.name}
                                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-100 dark:ring-[#262626] shadow-2xs"
                                  />
                                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#10B981] dark:bg-[#3ECF8E] ring-1.5 ring-white dark:ring-[#1C1C1C]" />
                                </div>

                                <span className="px-2 py-0.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200/80 dark:border-red-500/20 text-[11px] font-bold flex items-center gap-1 shadow-2xs">
                                  <span>🩸</span>
                                  <span>{member.bloodGroup || 'Blood: N/A'}</span>
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-1">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-[#10B981] dark:group-hover:text-[#3ECF8E] transition-colors truncate">
                                      {member.name}
                                    </h3>
                                    {isSelf && (
                                      <span className="shrink-0 text-[9px] font-bold text-emerald-700 dark:text-[#3ECF8E] bg-emerald-50 dark:bg-[#3ECF8E]/10 px-1.5 py-0.2 rounded-md border border-emerald-200/60 dark:border-[#3ECF8E]/20">
                                        You
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 dark:text-neutral-400 font-semibold truncate">
                                    {member.relationship}
                                  </p>
                                </div>

                                {isVaultAdmin ? (
                                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 flex items-center gap-0.5">
                                    <Crown size={10} className="text-amber-500" />
                                    <span>Head</span>
                                  </span>
                                ) : (
                                  <span
                                    className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                      member.role === 'ADMIN'
                                        ? 'bg-[#3ECF8E]/10 text-emerald-800 dark:text-[#3ECF8E]'
                                        : 'bg-slate-100 dark:bg-[#262626] text-slate-600 dark:text-neutral-400'
                                    }`}
                                  >
                                    {member.role === 'ADMIN' ? 'Admin' : 'Member'}
                                  </span>
                                )}
                              </div>

                              <div className="mt-2.5 space-y-1.5 text-xs text-slate-600 dark:text-neutral-300">
                                {member.phone && (
                                  <div className="flex items-center justify-between gap-1">
                                    <a
                                      href={`tel:${member.phone}`}
                                      className="flex items-center gap-1.5 hover:text-[#10B981] dark:hover:text-[#3ECF8E] transition-colors text-xs truncate"
                                    >
                                      <Phone size={12} className="text-slate-400 dark:text-neutral-500 shrink-0" />
                                      <span className="font-mono font-medium truncate">{member.phone}</span>
                                    </a>
                                    <a
                                      href={`https://wa.me/${member.phone.replace(/[^0-9]/g, '').length === 10 ? '91' + member.phone.replace(/[^0-9]/g, '') : member.phone.replace(/[^0-9]/g, '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-1.5 py-0.2 rounded text-[10px] font-bold text-emerald-700 dark:text-[#3ECF8E] bg-emerald-50 dark:bg-[#3ECF8E]/10 hover:bg-emerald-100 dark:hover:bg-[#3ECF8E]/20 transition-colors shrink-0"
                                      title="Message on WhatsApp"
                                    >
                                      WhatsApp
                                    </a>
                                  </div>
                                )}
                                {member.email && (
                                  <div className="flex items-center gap-1.5 text-xs">
                                    <Mail size={12} className="text-slate-400 dark:text-neutral-500 shrink-0" />
                                    <span className="truncate">{member.email}</span>
                                  </div>
                                )}
                                {member.healthInsurancePolicy && (
                                  <div className="flex items-center justify-between text-emerald-700 dark:text-[#3ECF8E] font-semibold bg-emerald-50/70 dark:bg-[#3ECF8E]/10 px-2 py-1 rounded-md border border-emerald-200/60 dark:border-[#3ECF8E]/20 text-[10px]">
                                    <span className="truncate">Policy: {member.healthInsurancePolicy}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyPolicy(member._id, member.healthInsurancePolicy)}
                                      className="p-0.5 hover:opacity-75 cursor-pointer ml-1"
                                      title="Copy Policy"
                                    >
                                      {copiedPolicyId === member._id ? <Check size={11} /> : <Copy size={11} />}
                                    </button>
                                  </div>
                                )}
                              </div>

                              {member.isEmergencyContact && (
                                <div className="mt-2">
                                  <span className="px-2 py-0.5 rounded-md bg-red-100/70 dark:bg-red-500/20 text-red-800 dark:text-red-400 text-[10px] font-bold flex items-center gap-1 w-fit">
                                    <ShieldAlert size={11} />
                                    Emergency Contact
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="pt-2.5 mt-3 border-t border-slate-100 dark:border-[#262626] flex items-center justify-between">
                              <Link
                                to={`/vault?member=${member._id || member.id}`}
                                className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 hover:text-[#10B981] dark:hover:text-[#3ECF8E] transition-colors flex items-center gap-1"
                              >
                                <Folder size={13} />
                                <span>
                                  <strong className="text-slate-900 dark:text-white">
                                    {member.assignedDocumentsCount || 0}
                                  </strong>{' '}
                                  Docs
                                </span>
                              </Link>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingMember(member)}
                                  className="p-1 rounded-md text-slate-400 hover:text-[#10B981] dark:hover:text-[#3ECF8E] hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                                  title="Edit Member Profile"
                                >
                                  <Edit3 size={13} />
                                </button>

                                <Link
                                  to={`/family/${member._id || member.id}`}
                                  className="text-[11px] font-bold text-emerald-700 dark:text-[#3ECF8E] hover:underline flex items-center gap-0.5 bg-emerald-50 dark:bg-[#3ECF8E]/10 px-2 py-1 rounded-md transition-colors"
                                >
                                  <span>Profile</span>
                                  <ArrowRight size={11} />
                                </Link>

                                {isCurrentUserAdmin && !isVaultAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => setIsTransferModalOpen(true)}
                                    className="p-1 rounded-md text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors cursor-pointer"
                                    title="Transfer Vault Ownership to this member"
                                  >
                                    <Crown size={13} />
                                  </button>
                                )}

                                {canDelete ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteClick(member)}
                                    className="p-1 rounded-md text-slate-400 dark:text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                                    title={isSelf ? 'Leave Family Vault' : 'Remove Member'}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                ) : isVaultAdmin ? (
                                  <span
                                    className="p-1 rounded-md text-slate-300 dark:text-neutral-700 cursor-not-allowed opacity-60"
                                    title="Transfer ownership before leaving"
                                  >
                                    <Trash2 size={13} />
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB 2: EMERGENCY MEDICAL DECK */}
            {activeTab === 'medical' && (
              <div className="space-y-6">
                {/* Emergency Broadcast Card */}
                <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 rounded-2xl p-5 sm:p-6 text-white shadow-lg shadow-red-500/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <HeartPulse size={22} className="animate-pulse text-white" />
                      <h2 className="text-lg sm:text-xl font-bold tracking-tight">Hospital & Triage Emergency Deck</h2>
                    </div>
                    <p className="text-xs sm:text-sm text-red-100 max-w-xl">
                      High-contrast blood groups, verified health insurance policies, and 1-tap emergency dialers ready for immediate hospital admissions.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleCopyOrShareAllEmergency(true)}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-white text-red-700 hover:bg-red-50 font-bold text-xs shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Share2 size={15} />
                      <span>Share on WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyOrShareAllEmergency(false)}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-red-800/80 hover:bg-red-800 text-white font-bold text-xs border border-white/20 transition-all inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Copy size={15} />
                      <span>Copy All Medical Info</span>
                    </button>
                  </div>
                </div>

                {/* Medical Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-3.5">
                  {members.map((member) => (
                    <div
                      key={member._id || member.id}
                      className="bg-white dark:bg-[#1C1C1C] rounded-xl border border-slate-200/90 dark:border-[#27272A] p-3.5 sm:p-4 shadow-2xs hover:border-red-400 dark:hover:border-red-500/50 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={
                                member.avatar ||
                                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name)}`
                              }
                              alt={member.name}
                              className="w-10 h-10 rounded-xl object-cover ring-1.5 ring-slate-100 dark:ring-[#262626] shrink-0"
                            />
                            <div className="min-w-0">
                              <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">{member.name}</h3>
                              <p className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium truncate">{member.relationship}</p>
                            </div>
                          </div>

                          {member.isEmergencyContact && (
                            <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-red-500 text-white flex items-center gap-0.5 shadow-2xs">
                              <ShieldAlert size={10} />
                              SOS
                            </span>
                          )}
                        </div>

                        <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/40 flex items-center justify-between">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-red-600 dark:text-red-400 block tracking-wider">
                              Blood Group
                            </span>
                            <span className="text-base font-black text-red-700 dark:text-red-300">
                              {member.bloodGroup || 'Not Specified'}
                            </span>
                          </div>
                          <span className="text-xl">🩸</span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#141414] border border-slate-200/80 dark:border-[#27272A] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-neutral-400 tracking-wider">
                              Insurance Policy / TPA
                            </span>
                            {member.healthInsurancePolicy && (
                              <button
                                type="button"
                                onClick={() => handleCopyPolicy(member._id, member.healthInsurancePolicy)}
                                className="text-[11px] text-[#10B981] dark:text-[#3ECF8E] font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                              >
                                {copiedPolicyId === member._id ? <Check size={11} /> : <Copy size={11} />}
                                <span>{copiedPolicyId === member._id ? 'Copied' : 'Copy'}</span>
                              </button>
                            )}
                          </div>
                          <p className="font-mono text-xs font-bold text-slate-900 dark:text-white truncate">
                            {member.healthInsurancePolicy || 'No policy added yet'}
                          </p>
                        </div>

                        <div className="text-xs space-y-1">
                          <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-neutral-400 tracking-wider block">
                            Allergies & Alerts
                          </span>
                          <p className="text-[11px] text-slate-700 dark:text-neutral-300 font-medium bg-slate-50 dark:bg-[#141414] p-2 rounded-lg border border-slate-200/60 dark:border-[#262626]">
                            {member.allergies || 'No known allergies recorded.'}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2.5 mt-3 border-t border-slate-100 dark:border-[#262626] flex items-center justify-between gap-2">
                        {member.phone ? (
                          <a
                            href={`tel:${member.phone}`}
                            className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors"
                          >
                            <PhoneCall size={13} />
                            <span className="truncate">Call ({member.phone})</span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400 dark:text-neutral-500 italic">No phone saved</span>
                        )}

                        <button
                          type="button"
                          onClick={() => setEditingMember(member)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-[#2E2E32] text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#222225] font-bold text-xs transition-colors cursor-pointer"
                          title="Edit Medical Details"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: VAULT ROLES & OWNERSHIP */}
            {activeTab === 'roles' && (
              <div className="space-y-6">
                {/* Head of Family Status Card */}
                <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl border border-slate-200/80 dark:border-[#262626] p-5 sm:p-6 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-500/20 shrink-0">
                        <Crown size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Head of Family</h2>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                            Primary Admin
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                          The Primary Admin holds supreme permissions over vault invitations, member management, and partition requests.
                        </p>
                      </div>
                    </div>

                    {isCurrentUserAdmin && members.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setIsTransferModalOpen(true)}
                        className="min-h-[42px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all inline-flex items-center justify-center gap-2 cursor-pointer shrink-0"
                      >
                        <Crown size={15} />
                        <span>Transfer Vault Ownership</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Family Invite Code Card */}
                <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl border border-slate-200/80 dark:border-[#262626] p-5 sm:p-6 shadow-xs space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <KeyRound size={18} className="text-[#10B981] dark:text-[#3ECF8E]" />
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                        Family Invite Code
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                      Share this unique code with family members so they can link their own Google accounts to this vault.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 dark:bg-[#141414] border border-slate-200 dark:border-[#27272A] flex items-center justify-between gap-4 font-mono font-black text-lg tracking-widest text-emerald-700 dark:text-[#3ECF8E]">
                      <span>{family?.inviteCode || 'N/A'}</span>
                      <button
                        type="button"
                        onClick={handleCopyInviteCode}
                        className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                        title="Copy Invite Code"
                      >
                        {copiedCode ? <Check size={16} className="text-[#10B981]" /> : <Copy size={16} />}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleCopyInviteCode}
                        className="flex-1 sm:flex-none min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 dark:border-[#2E2E32] text-slate-800 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-[#222225] font-bold text-xs inline-flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {copiedCode ? <Check size={14} className="text-[#10B981]" /> : <Copy size={14} />}
                        <span>{copiedCode ? 'Code Copied!' : 'Copy Code'}</span>
                      </button>

                      {family?.inviteCode && (
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(
                            `Join our GharVault family vault! Use this invite code during sign up: ${family.inviteCode}`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 sm:flex-none min-h-[44px] px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs inline-flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                        >
                          <Share2 size={14} />
                          <span>Invite via WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Role Privileges Breakdown */}
                <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl border border-slate-200/80 dark:border-[#262626] p-5 sm:p-6 shadow-xs space-y-4">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Role Privileges Matrix</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-amber-200/70 dark:border-amber-500/20 bg-amber-50/40 dark:bg-amber-500/5 space-y-2">
                      <div className="flex items-center gap-2">
                        <Crown size={16} className="text-amber-500" />
                        <span className="font-bold text-sm text-slate-900 dark:text-white">Vault Head / Owner</span>
                      </div>
                      <ul className="text-xs text-slate-600 dark:text-neutral-300 space-y-1 list-disc list-inside">
                        <li>Full administrative control of the family vault</li>
                        <li>Can add, edit, or remove any member</li>
                        <li>Can initiate Vault Ownership transfer</li>
                        <li>Can invite new members via code</li>
                        <li>View and manage all family records</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#141414] space-y-2">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-slate-600 dark:text-neutral-400" />
                        <span className="font-bold text-sm text-slate-900 dark:text-white">Vault Member</span>
                      </div>
                      <ul className="text-xs text-slate-600 dark:text-neutral-300 space-y-1 list-disc list-inside">
                        <li>Access assigned documents and personal records</li>
                        <li>Upload and categorize new family documents</li>
                        <li>View hospital-ready emergency medical deck</li>
                        <li>Update own profile, blood group, and policy data</li>
                        <li>Self-initiated partition / leave vault option</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Add Family Member Modal */}
      {isAddModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-white dark:bg-[#18181B] border-t md:border border-slate-200 dark:border-[#27272A] rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] md:max-h-[85vh] overflow-hidden transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="md:hidden flex justify-center pt-2.5 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-neutral-600" />
            </div>

            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-[#27272A] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-600 dark:text-[#3ECF8E] flex items-center justify-center border border-emerald-100 dark:border-[#3ECF8E]/20 shrink-0">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">Add Family Member</h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">Include relationship and emergency directives</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-[#27272A] text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form id="add-member-form" onSubmit={handleAddMember} className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Papa, Sunita, Aarav"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] bg-white dark:bg-[#141414] focus:border-[#10B981] dark:focus:border-[#3ECF8E] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                    Relationship *
                  </label>
                  <select
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] focus:border-[#10B981] dark:focus:border-[#3ECF8E] text-xs font-semibold text-slate-900 dark:text-white bg-white dark:bg-[#141414] focus:outline-none cursor-pointer"
                  >
                    <option value="Self">Self</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Grandfather">Grandfather</option>
                    <option value="Grandmother">Grandmother</option>
                    <option value="Uncle">Uncle</option>
                    <option value="Aunt">Aunt</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                    Blood Group (Emergency)
                  </label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] focus:border-[#10B981] dark:focus:border-[#3ECF8E] text-xs font-semibold text-slate-900 dark:text-white bg-white dark:bg-[#141414] focus:outline-none cursor-pointer"
                  >
                    <option value="O+">O+ (Positive)</option>
                    <option value="O-">O- (Negative)</option>
                    <option value="A+">A+ (Positive)</option>
                    <option value="A-">A- (Negative)</option>
                    <option value="B+">B+ (Positive)</option>
                    <option value="B-">B- (Negative)</option>
                    <option value="AB+">AB+ (Positive)</option>
                    <option value="AB-">AB- (Negative)</option>
                    <option value="Unknown">Unknown / Not Tested</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] bg-white dark:bg-[#141414] focus:border-[#10B981] dark:focus:border-[#3ECF8E] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                  Phone (Emergency Contact)
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] bg-white dark:bg-[#141414] focus:border-[#10B981] dark:focus:border-[#3ECF8E] text-xs font-semibold text-slate-900 dark:text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                  Health Insurance Policy / TPA Card #
                </label>
                <input
                  type="text"
                  placeholder="e.g. Star Health #SH1029384 / Care Health"
                  value={formData.healthInsurancePolicy}
                  onChange={(e) => setFormData({ ...formData, healthInsurancePolicy: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] bg-white dark:bg-[#141414] focus:border-[#10B981] dark:focus:border-[#3ECF8E] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                  Email (Optional - for vault invitation)
                </label>
                <input
                  type="email"
                  placeholder="family.member@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] bg-white dark:bg-[#141414] focus:border-[#10B981] dark:focus:border-[#3ECF8E] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#141414] cursor-pointer">
                  <input
                    type="checkbox"
                    id="isEmergencyContact"
                    checked={formData.isEmergencyContact}
                    onChange={(e) => setFormData({ ...formData, isEmergencyContact: e.target.checked })}
                    className="mt-0.5 rounded text-[#10B981] dark:text-[#3ECF8E] border-slate-300 dark:border-[#27272A] focus:ring-[#3ECF8E] cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <ShieldAlert size={14} className="text-red-600 dark:text-red-400" />
                      Primary Emergency Contact
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 block">
                      Badged prominently on dashboard for hospital check-ins and emergency broadcasts.
                    </span>
                  </div>
                </label>
              </div>
            </form>

            <div className="px-4 sm:px-6 py-3.5 bg-slate-50 dark:bg-[#141414] border-t border-slate-100 dark:border-[#27272A] flex flex-col-reverse sm:flex-row items-center sm:justify-end gap-2.5 shrink-0 pb-[max(1.25rem,env(safe-area-inset-bottom,20px))]">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#27272A] font-bold text-xs transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                form="add-member-form"
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] font-bold text-xs shadow-md shadow-[#3ECF8E]/20 transition-all cursor-pointer text-center"
              >
                <UserPlus size={15} strokeWidth={2.5} />
                <span>{submitting ? 'Adding...' : 'Save Family Member'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Join Family via Invite Code Modal */}
      <JoinFamilyModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onJoined={() => {
          setIsJoinModalOpen(false);
          loadMembers();
        }}
      />

      {/* Edit Family Member Modal */}
      <EditMemberModal
        isOpen={Boolean(editingMember)}
        member={editingMember}
        onClose={() => setEditingMember(null)}
        onMemberUpdated={(updated) => {
          setMembers((prev) => prev.map((m) => (m._id === updated._id ? { ...m, ...updated } : m)));
          setEditingMember(null);
        }}
      />

      {/* Delete Member Confirmation Modal */}
      <DeleteMemberModal
        isOpen={Boolean(memberToDelete)}
        member={memberToDelete}
        onClose={() => setMemberToDelete(null)}
        onDeleted={handleMemberDeleted}
      />

      {/* Transfer Ownership Modal */}
      <TransferOwnershipModal
        isOpen={isTransferModalOpen}
        members={members}
        currentUserId={user?._id || user?.id}
        onClose={() => setIsTransferModalOpen(false)}
        onTransferred={handleOwnershipTransferred}
      />
    </div>
  );
}
