import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { UserPlus, Copy, Check, X, AlertCircle, MailCheck } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

export default function InviteMemberModal({ isOpen, onClose, onInviteSuccess }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    relationship: 'Family Member',
    role: 'MEMBER',
    isEmergencyContact: false,
    canSignQuorum: false,
  });
  const [loading, setLoading] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);
  const [error, setError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Close on Escape key & Lock Body Scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setInviteResult(null);
      setError('');
      setCopiedLink(false);
      setCopiedCode(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const res = await api.inviteMember(formData);
      if (res.success) {
        setInviteResult(res);
        toast.success(`Invite created for ${formData.name}!`);
        if (onInviteSuccess) onInviteSuccess(res.member);
      } else {
        throw new Error(res.error || 'Failed to create invitation');
      }
    } catch (err) {
      setError(err.message || 'Failed to send invite');
      toast.error(err.message || 'Failed to send invite');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (inviteResult?.inviteCode) {
      navigator.clipboard.writeText(inviteResult.inviteCode);
      setCopiedCode(true);
      toast.success('Invite code copied to clipboard!');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyLink = () => {
    if (inviteResult?.inviteLink) {
      navigator.clipboard.writeText(inviteResult.inviteLink);
      setCopiedLink(true);
      toast.success('Invite link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#18181B] border-t md:border border-slate-200 dark:border-[#27272A] rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] md:max-h-[85vh] overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle Pill */}
        <div className="md:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-neutral-600" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-[#27272A] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#3ECF8E]/10 border border-emerald-100 dark:border-[#3ECF8E]/20 text-[#10B981] dark:text-[#3ECF8E] flex items-center justify-center shrink-0">
              <UserPlus size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Invite Family Member
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Grant secure access to your shared family vault
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-[#27272A] text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4">
          {inviteResult ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-[#3ECF8E]/10 border border-emerald-200 dark:border-[#3ECF8E]/30 text-[#10B981] dark:text-[#3ECF8E] flex items-center justify-center mx-auto shadow-sm">
                <MailCheck size={28} />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Invitation Created!
                </h4>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                  Share this secure access code or direct link with {formData.name}.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-[#141414] rounded-2xl border border-slate-200 dark:border-[#27272A] text-left space-y-3">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1">
                    Family Invite Code:
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A]">
                    <span className="font-mono font-extrabold text-base text-[#10B981] dark:text-[#3ECF8E] tracking-widest">
                      {inviteResult.inviteCode}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-[#27272A] hover:bg-slate-200 text-slate-700 dark:text-neutral-200 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {copiedCode ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {inviteResult.inviteLink && (
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1">
                      Direct Join Link:
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] gap-2">
                      <span className="font-mono text-xs text-slate-700 dark:text-neutral-300 truncate">
                        {inviteResult.inviteLink}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        {copiedLink ? <Check size={13} /> : <Copy size={13} />}
                        <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form id="invite-member-form" onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] bg-white dark:bg-[#141414] focus:border-[#10B981] dark:focus:border-[#3ECF8E] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="member@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] bg-white dark:bg-[#141414] focus:border-[#10B981] dark:focus:border-[#3ECF8E] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                    Relationship
                  </label>
                  <select
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] bg-white dark:bg-[#141414] text-xs font-semibold text-slate-900 dark:text-white focus:border-[#10B981] dark:focus:border-[#3ECF8E] focus:outline-none cursor-pointer"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Family Member">Family Member</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                    Vault Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] bg-white dark:bg-[#141414] text-xs font-semibold text-slate-900 dark:text-white focus:border-[#10B981] dark:focus:border-[#3ECF8E] focus:outline-none cursor-pointer"
                  >
                    <option value="MEMBER">Member (View & Edit own)</option>
                    <option value="EDITOR">Editor (Manage all documents)</option>
                    <option value="VIEWER">Viewer (Read only)</option>
                  </select>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Fixed Footer */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-50 dark:bg-[#141414] border-t border-slate-100 dark:border-[#27272A] flex flex-col-reverse sm:flex-row items-center sm:justify-end gap-2.5 shrink-0 pb-[max(1.25rem,env(safe-area-inset-bottom,20px))]">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272A] text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#27272A] font-bold text-xs transition-colors cursor-pointer text-center"
          >
            {inviteResult ? 'Done' : 'Cancel'}
          </button>
          {!inviteResult && (
            <button
              form="invite-member-form"
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] font-bold text-xs shadow-md shadow-[#3ECF8E]/20 transition-all cursor-pointer text-center"
            >
              <UserPlus size={15} strokeWidth={2.5} />
              <span>{loading ? 'Generating Code...' : 'Send Invitation'}</span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
