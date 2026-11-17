import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function FamilyDirectoryPage() {
  const { family, user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    relationship: 'Spouse',
    email: '',
    phone: '',
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
    <div className="max-w-[1380px] mx-auto p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Family Members</h1>
          <p className="text-xs text-slate-500 mt-1">
            Everyone in {family?.name || 'your family vault'} with their emergency blood group, contacts, and documents.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all self-start sm:self-center cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          <span>+ Add Family Member</span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-6 animate-pulse space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-slate-200 rounded-2xl"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                </div>
              </div>
              <div className="h-8 bg-slate-100 rounded-xl"></div>
            </div>
          ))}
        </div>
      ) : members.length === 0 ? (
        /* Clean Zero-Mock Empty State */
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center max-w-2xl mx-auto shadow-sm">
          <div className="w-20 h-20 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-5 shadow-inner">
            <span className="material-symbols-outlined text-4xl">diversity_1</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">No family members added yet</h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-md mx-auto">
            Add your parents, spouse, or children so everyone's important IDs, health insurance, and emergency blood group info stay organized in one safe space.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">person_add</span>
              <span>+ Add First Family Member</span>
            </button>
          </div>
        </div>
      ) : (
        /* Members Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {members.map((member) => (
            <div
              key={member._id}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Avatar & Badges Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="relative">
                    <img
                      src={member.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name)}`}
                      alt={member.name}
                      className="w-16 h-16 rounded-2xl object-cover ring-4 ring-slate-50 shadow-sm"
                    />
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                  </div>

                  {/* Blood Group Badge */}
                  <span className="px-2.5 py-1 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1 shadow-xs">
                    <span>🩸</span>
                    <span>{member.bloodGroup || 'Blood: N/A'}</span>
                  </span>
                </div>

                {/* Identity Details */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                      {member.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">{member.relationship}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    member.role === 'ADMIN' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {member.role === 'ADMIN' ? 'Admin' : 'Member'}
                  </span>
                </div>

                {/* Contact & Medical Info */}
                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  {member.phone && (
                    <a href={`tel:${member.phone}`} className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                      <span className="material-symbols-outlined text-base text-slate-400">call</span>
                      <span className="font-medium">{member.phone}</span>
                    </a>
                  )}
                  {member.email && (
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-slate-400">mail</span>
                      <span className="truncate">{member.email}</span>
                    </div>
                  )}
                  {member.healthInsurancePolicy && (
                    <div className="flex items-center gap-2 text-emerald-700 font-semibold bg-emerald-50/70 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                      <span className="material-symbols-outlined text-sm">health_and_safety</span>
                      <span className="truncate">Policy: {member.healthInsurancePolicy}</span>
                    </div>
                  )}
                </div>

                {/* Nominee / Emergency tags */}
                {member.isEmergencyContact && (
                  <div className="mt-3">
                    <span className="px-2.5 py-1 rounded-lg bg-red-100/70 text-red-800 text-[10px] font-bold flex items-center gap-1.5 w-fit">
                      <span className="material-symbols-outlined text-xs">e911_emergency</span>
                      Primary Emergency Contact
                    </span>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between">
                <Link
                  to={`/vault?member=${member._id}`}
                  className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">folder</span>
                  <span><strong className="text-slate-900">{member.assignedDocumentsCount || 0}</strong> Docs</span>
                </Link>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/family/${member._id}`}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 bg-blue-50 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <span>Profile</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>

                  {member._id !== user?._id && (
                    <button
                      onClick={() => handleDeleteMember(member._id, member.name)}
                      className="p-1 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Remove Member"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">person_add</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Add Family Member</h3>
                  <p className="text-xs text-slate-500">Include their emergency medical details</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAddMember} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Papa, Sunita, Aarav"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 text-xs font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Relationship *
                  </label>
                  <select
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 text-xs font-semibold text-slate-900 bg-white"
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
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Blood Group
                  </label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 text-xs font-semibold text-slate-900 bg-white"
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
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone (Emergency Contact)
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Health Insurance Policy / TPA Card #
                </label>
                <input
                  type="text"
                  placeholder="e.g. Star Health 019283921 / Care Health"
                  value={formData.healthInsurancePolicy}
                  onChange={(e) => setFormData({ ...formData, healthInsurancePolicy: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 text-xs font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email (Optional - for vault invitation)
                </label>
                <input
                  type="email"
                  placeholder="family.member@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 text-xs font-semibold text-slate-900"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isEmergencyContact"
                  checked={formData.isEmergencyContact}
                  onChange={(e) => setFormData({ ...formData, isEmergencyContact: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="isEmergencyContact" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Designate as Primary Emergency Hospital Contact
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  {submitting ? 'Adding...' : 'Save Family Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
