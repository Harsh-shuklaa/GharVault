import React, { useState } from 'react';
import { api } from '../../lib/api';

export default function InviteMemberModal({ isOpen, onClose, onInviteSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    relationship: 'Son',
    role: 'MEMBER',
    isEmergencyContact: false,
    canSignQuorum: false,
  });
  const [loading, setLoading] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const res = await api.inviteMember(formData);
      if (res.success) {
        setInviteResult(res);
        if (onInviteSuccess) onInviteSuccess(res.member);
      }
    } catch (err) {
      setError(err.message || 'Failed to send invite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#0F172A] px-6 py-5 text-white flex items-center justify-between border-b border-[#1E293B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center border border-blue-500/40">
              <span className="material-symbols-outlined text-2xl">person_add</span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Invite Family Member</h3>
              <p className="text-xs text-slate-400">Sharma Family Ghar Custodian Access</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="p-6">
          {inviteResult ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-3xl">mark_email_read</span>
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">Invitation Generated!</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Share this secure access link or invite code with {formData.name}.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left font-mono text-xs text-slate-800 space-y-1.5">
                <div className="text-[11px] text-slate-500 font-sans font-semibold">Invite Code:</div>
                <div className="text-base font-bold text-blue-600 tracking-wider">{inviteResult.inviteCode}</div>
                <div className="text-[11px] text-slate-500 font-sans font-semibold pt-1">Direct Link:</div>
                <div className="break-all text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200">
                  {inviteResult.inviteLink}
                </div>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(inviteResult.inviteLink);
                  alert('Invite link copied to clipboard!');
                  onClose();
                }}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">content_copy</span>
                <span>Copy Link & Done</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. aarav.sharma@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Relationship
                  </label>
                  <select
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 bg-white"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Brother">Brother</option>
                    <option value="Legal Nominee">Legal Nominee</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Role & Privileges
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 bg-white"
                  >
                    <option value="MEMBER">Member (Upload & View)</option>
                    <option value="GUARDIAN">Guardian (Quorum Signer)</option>
                    <option value="VIEW_ONLY">View-Only Custodian</option>
                    <option value="ADMIN">Co-Admin</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isEmergencyContact}
                    onChange={(e) => setFormData({ ...formData, isEmergencyContact: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Designate as Emergency Contact (Receives Break-Glass alerts)</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.canSignQuorum}
                    onChange={(e) => setFormData({ ...formData, canSignQuorum: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Authorize for Dual-Key Quorum Signatures</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  {loading ? 'Creating Invitation...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
