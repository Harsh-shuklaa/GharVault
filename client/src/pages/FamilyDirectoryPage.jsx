import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import InviteMemberModal from '../components/common/InviteMemberModal';

export default function FamilyDirectoryPage() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

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

  return (
    <div className="max-w-[1380px] mx-auto p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Family Members Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Designated custodians, nominees, and guardians of the Sharma Family Trust repository.
          </p>
        </div>
        <button
          onClick={() => setIsInviteOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all self-start sm:self-center"
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          <span>Invite New Member</span>
        </button>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {members.map((member) => (
          <div
            key={member._id}
            className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between group"
          >
            <div>
              {/* Avatar & Status Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="relative">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-16 h-16 rounded-2xl object-cover ring-4 ring-slate-50 shadow-sm"
                  />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  member.role === 'ADMIN' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                  member.role === 'GUARDIAN' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {member.role}
                </span>
              </div>

              {/* Identity Details */}
              <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                {member.name}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{member.relationship}</p>

              <div className="mt-4 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-slate-400">mail</span>
                  <span className="truncate">{member.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-slate-400">call</span>
                  <span>{member.phone || '+91 98201 4489X'}</span>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 mt-4">
                {member.isEmergencyContact && (
                  <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">e911_emergency</span>
                    Emergency Nominee
                  </span>
                )}
                {member.permissions?.canSignQuorum && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">key</span>
                    Quorum Signer
                  </span>
                )}
              </div>
            </div>

            {/* Card Footer */}
            <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                <strong className="text-slate-900">{member.assignedDocumentsCount || 0}</strong> Documents
              </span>
              <Link
                to={`/family/${member._id}`}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
              >
                <span>Profile</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Invite Modal */}
      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onInviteSuccess={() => {
          loadMembers();
          setIsInviteOpen(false);
        }}
      />
    </div>
  );
}
