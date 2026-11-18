import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Plus, UserPlus, Phone, Mail, ShieldAlert, Folder, ArrowRight, Trash2, X, AlertCircle, Edit3 } from 'lucide-react';
import EditMemberModal from '../components/common/EditMemberModal';

export default function FamilyDirectoryPage() {
  const { family, user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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
    try {
      setSubmitting(true);
      setError('');
      await api.addMember(formData);
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        relationship: 'Spouse',
        email: '',
        phone: '',
        bloodGroup: 'O+',
        healthInsurancePolicy: '',
        allergies: '',
        isEmergencyContact: false,
      });
      loadMembers();
    } catch (err) {
      setError(err.message || 'Failed to add family member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = async (memberId, memberName) => {
    if (window.confirm(`Are you sure you want to remove ${memberName} from this family vault?`)) {
      try {
        await api.deleteMember(memberId);
        loadMembers();
      } catch (err) {
        alert('Could not remove member: ' + err.message);
      }
    }
  };

  return (
    <div className="max-w-[1380px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">Family Members</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
            Everyone in {family?.name || 'your family vault'} with their emergency blood group, contacts, and documents.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] font-bold text-xs shadow-md shadow-[#3ECF8E]/20 transition-all self-stretch sm:self-center cursor-pointer"
        >
          <UserPlus size={16} strokeWidth={2.2} />
          <span>+ Add Family Member</span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-[#1C1C1C] rounded-2xl border border-slate-200/80 dark:border-[#262626] p-6 animate-pulse space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-slate-200 dark:bg-[#262626] rounded-2xl"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 dark:bg-[#262626] rounded w-2/3"></div>
                  <div className="h-3 bg-slate-200 dark:bg-[#262626] rounded w-1/3"></div>
                </div>
              </div>
              <div className="h-8 bg-slate-100 dark:bg-[#262626] rounded-xl"></div>
            </div>
          ))}
        </div>
      ) : members.length === 0 ? (
        /* Clean Zero-Mock Empty State */
        <div className="bg-white dark:bg-[#1C1C1C] rounded-3xl border border-slate-200/80 dark:border-[#262626] p-12 text-center max-w-2xl mx-auto shadow-sm transition-colors">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-600 dark:text-[#3ECF8E] flex items-center justify-center mx-auto mb-5 shadow-inner">
            <span className="material-symbols-outlined text-4xl">diversity_1</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">No family members added yet</h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-2 leading-relaxed max-w-md mx-auto">
            Add your parents, spouse, or children so everyone's important IDs, health insurance, and emergency blood group info stay organized in one safe space.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] font-bold text-xs shadow-md shadow-[#3ECF8E]/25 transition-all cursor-pointer"
            >
              <UserPlus size={16} strokeWidth={2.2} />
              <span>+ Add First Family Member</span>
            </button>
          </div>
        </div>
      ) : (
        /* Members Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {members.map((member) => (
            <div
              key={member._id}
              className="bg-white dark:bg-[#1C1C1C] rounded-2xl border border-slate-200/80 dark:border-[#262626] p-4 sm:p-5 lg:p-6 shadow-xs hover:border-[#3ECF8E] dark:hover:border-[#3ECF8E] hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Avatar & Badges Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="relative">
                    <img
                      src={member.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name)}`}
                      alt={member.name}
                      className="w-16 h-16 rounded-2xl object-cover ring-4 ring-slate-50 dark:ring-[#262626] shadow-sm"
                    />
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#3ECF8E] ring-2 ring-white dark:ring-[#1C1C1C]"></span>
                  </div>

                  {/* Blood Group Badge */}
                  <span className="px-2.5 py-1 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20 text-xs font-bold flex items-center gap-1 shadow-xs">
                    <span>🩸</span>
                    <span>{member.bloodGroup || 'Blood: N/A'}</span>
                  </span>
                </div>

                {/* Identity Details */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-[#3ECF8E] transition-colors">
                      {member.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 font-semibold mt-0.5">{member.relationship}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    member.role === 'ADMIN' ? 'bg-[#3ECF8E]/10 text-emerald-800 dark:text-[#3ECF8E]' : 'bg-slate-100 dark:bg-[#262626] text-slate-600 dark:text-neutral-400'
                  }`}>
                    {member.role === 'ADMIN' ? 'Admin' : 'Member'}
                  </span>
                </div>

                {/* Contact & Medical Info */}
                <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-neutral-300">
                  {member.phone && (
                    <a href={`tel:${member.phone}`} className="flex items-center gap-2 hover:text-[#3ECF8E] transition-colors">
                      <Phone size={14} className="text-slate-400 dark:text-neutral-500" />
                      <span className="font-medium">{member.phone}</span>
                    </a>
                  )}
                  {member.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-slate-400 dark:text-neutral-500" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  )}
                  {member.healthInsurancePolicy && (
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-[#3ECF8E] font-semibold bg-emerald-50/70 dark:bg-[#3ECF8E]/10 px-2.5 py-1 rounded-lg border border-emerald-200/60 dark:border-[#3ECF8E]/20">
                      <span className="material-symbols-outlined text-sm">health_and_safety</span>
                      <span className="truncate">Policy: {member.healthInsurancePolicy}</span>
                    </div>
                  )}
                </div>

                {/* Nominee / Emergency tags */}
                {member.isEmergencyContact && (
                  <div className="mt-3">
                    <span className="px-2.5 py-1 rounded-lg bg-red-100/70 dark:bg-red-500/20 text-red-800 dark:text-red-400 text-[10px] font-bold flex items-center gap-1.5 w-fit">
                      <ShieldAlert size={12} />
                      Primary Emergency Contact
                    </span>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="pt-4 mt-5 border-t border-slate-100 dark:border-[#262626] flex items-center justify-between">
                <Link
                  to={`/vault?member=${member._id}`}
                  className="text-xs font-semibold text-slate-500 dark:text-neutral-400 hover:text-[#3ECF8E] transition-colors flex items-center gap-1"
                >
                  <Folder size={14} />
                  <span><strong className="text-slate-900 dark:text-white">{member.assignedDocumentsCount || 0}</strong> Docs</span>
                </Link>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditingMember(member)}
                    className="p-1 rounded-lg text-slate-400 hover:text-[#10B981] dark:hover:text-[#3ECF8E] hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                    title="Edit Member Profile"
                  >
                    <Edit3 size={14} />
                  </button>

                  <Link
                    to={`/family/${member._id}`}
                    className="text-xs font-bold text-emerald-700 dark:text-[#3ECF8E] hover:underline flex items-center gap-0.5 bg-emerald-50 dark:bg-[#3ECF8E]/10 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <span>Profile</span>
                    <ArrowRight size={13} />
                  </Link>

                  {member._id !== user?._id && (
                    <button
                      onClick={() => handleDeleteMember(member._id, member.name)}
                      className="p-1 rounded-lg text-slate-300 dark:text-neutral-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Remove Member"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Family Member Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="fixed inset-x-0 bottom-0 rounded-t-2xl max-h-[90vh] overflow-y-auto md:static md:inset-auto md:rounded-xl md:max-w-lg w-full bg-white dark:bg-[#1C1C1C] p-4 sm:p-5 lg:p-6 shadow-2xl border border-slate-200 dark:border-[#262626] space-y-4 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#262626]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-600 dark:text-[#3ECF8E] flex items-center justify-center">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">Add Family Member</h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">Include their emergency medical details</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-[#262626] text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAddMember} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Papa, Sunita, Aarav"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#262626] bg-white dark:bg-[#141414] focus:border-[#3ECF8E] text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                    Relationship *
                  </label>
                  <select
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#262626] focus:border-[#3ECF8E] text-xs font-semibold text-slate-900 dark:text-white bg-white dark:bg-[#141414]"
                  >
                    <option value="Self">Self</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                    Blood Group
                  </label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#262626] focus:border-[#3ECF8E] text-xs font-semibold text-slate-900 dark:text-white bg-white dark:bg-[#141414]"
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#262626] bg-white dark:bg-[#141414] focus:border-[#3ECF8E] text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Phone (Emergency Contact)
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#262626] bg-white dark:bg-[#141414] focus:border-[#3ECF8E] text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Health Insurance Policy / TPA Card #
                </label>
                <input
                  type="text"
                  placeholder="e.g. Star Health 019283921 / Care Health"
                  value={formData.healthInsurancePolicy}
                  onChange={(e) => setFormData({ ...formData, healthInsurancePolicy: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#262626] bg-white dark:bg-[#141414] focus:border-[#3ECF8E] text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Email (Optional - for vault invitation)
                </label>
                <input
                  type="email"
                  placeholder="family.member@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#262626] bg-white dark:bg-[#141414] focus:border-[#3ECF8E] text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isEmergencyContact"
                  checked={formData.isEmergencyContact}
                  onChange={(e) => setFormData({ ...formData, isEmergencyContact: e.target.checked })}
                  className="w-4 h-4 rounded text-[#10B981] dark:text-[#3ECF8E] border-slate-300 dark:border-[#262626] focus:ring-[#3ECF8E] cursor-pointer"
                />
                <label htmlFor="isEmergencyContact" className="text-xs font-semibold text-slate-700 dark:text-neutral-300 cursor-pointer">
                  Designate as Primary Emergency Hospital Contact
                </label>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center sm:justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-[#262626]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#262626] text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-[#262626] font-bold text-xs transition-colors cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] font-bold text-xs shadow-md shadow-[#3ECF8E]/20 transition-all cursor-pointer text-center"
                >
                  {submitting ? 'Adding...' : 'Save Family Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Family Member Modal */}
      <EditMemberModal
        isOpen={Boolean(editingMember)}
        member={editingMember}
        onClose={() => setEditingMember(null)}
        onMemberUpdated={(updated) => {
          setMembers(prev => prev.map(m => m._id === updated._id ? { ...m, ...updated } : m));
          setEditingMember(null);
        }}
      />
    </div>
  );
}
