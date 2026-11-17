import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';

export default function DocumentUploadPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedMember = searchParams.get('member') || '';

  const [members, setMembers] = useState([]);
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    category: 'ID Cards',
    assignedMemberId: preselectedMember,
    documentNumber: '',
    expiryDate: '',
    whoCanViewType: 'ALL', // 'ALL' or 'SPECIFIC'
    selectedWhoCanView: [],
    notes: '',
  });

  useEffect(() => {
    api.getMembers().then(res => {
      const list = res.members || [];
      setMembers(list);
      if (list.length > 0 && !formData.assignedMemberId) {
        setFormData(prev => ({ ...prev, assignedMemberId: list[0]._id }));
      }
    });
  }, []);

  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;
    if (selectedFile.size > 25 * 1024 * 1024) {
      setError('File size exceeds free-tier limit of 25MB. Please choose a smaller file.');
      return;
    }
    setError('');
    setFile(selectedFile);

    // Auto-fill title if empty
    if (!formData.title) {
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setFormData(prev => ({ ...prev, title: cleanName }));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleToggleMemberView = (memberId) => {
    setFormData(prev => {
      const exists = prev.selectedWhoCanView.includes(memberId);
      const updated = exists
        ? prev.selectedWhoCanView.filter(id => id !== memberId)
        : [...prev.selectedWhoCanView, memberId];
      return { ...prev, selectedWhoCanView: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please choose or drop a document to upload.');
      return;
    }
    try {
      setLoading(true);
      setError('');

      const data = new FormData();
      data.append('file', file);
      data.append('title', formData.title || file.name);
      data.append('category', formData.category);
      if (formData.assignedMemberId) {
        data.append('assignedMemberId', formData.assignedMemberId);
      }
      data.append('documentNumber', formData.documentNumber);
      data.append('expiryDate', formData.expiryDate);

      // Who Can View
      const whoCanViewArray = formData.whoCanViewType === 'ALL'
        ? ['ALL']
        : formData.selectedWhoCanView.length > 0
        ? formData.selectedWhoCanView
        : ['ALL'];
      data.append('whoCanView', JSON.stringify(whoCanViewArray));

      const res = await api.uploadDocument(data);
      if (res.document) {
        navigate(`/vault/documents/${res.document._id}`);
      } else {
        navigate('/vault');
      }
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'ID Cards', label: 'ID Cards', sub: 'Aadhaar, PAN, Passport, Driving Licence' },
    { id: 'Medical & Health', label: 'Medical & Health', sub: 'Health Insurance, Prescriptions, Blood Tests' },
    { id: 'Bank & Property', label: 'Bank & Property', sub: 'Passbooks, FD Receipts, Land/Flat Deeds' },
    { id: 'Education', label: 'Education', sub: 'Degree Certificates, Marksheets' },
    { id: 'Legal', label: 'Legal', sub: 'Affidavits, Wills, Agreements' },
    { id: 'Other', label: 'Other', sub: 'Utility Bills, Warranties, Receipts' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-8 space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Upload New Document</h1>
        <p className="text-xs text-slate-500 mt-1">
          Simple 3-step upload with private encrypted cloud storage up to 25MB.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2.5">
          <span className="material-symbols-outlined text-lg">error</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Pick File */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              1
            </span>
            <h2 className="text-base font-bold text-slate-900">Choose or Drop Your Document</h2>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all flex flex-col items-center justify-center min-h-[200px] cursor-pointer ${
              isDragging
                ? 'border-blue-600 bg-blue-50/50 scale-[1.01]'
                : file
                ? 'border-emerald-500 bg-emerald-50/20'
                : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50'
            }`}
            onClick={() => document.getElementById('file-upload-input').click()}
          >
            <input
              id="file-upload-input"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files[0])}
            />

            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${
              file ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
            }`}>
              <span className="material-symbols-outlined text-3xl">
                {file ? 'task' : 'cloud_upload'}
              </span>
            </div>

            {file ? (
              <div className="space-y-1">
                <div className="text-sm font-bold text-slate-900">{file.name}</div>
                <div className="text-xs text-slate-500 font-mono">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                </div>
                <span className="inline-block mt-2 text-xs font-bold text-blue-600 hover:underline">
                  Click to choose different file
                </span>
              </div>
            ) : (
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Click to select file, or drag and drop here
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports PDF, PNG, JPG, or JPEG (up to 25MB on Supabase Free Tier)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Choose Category & Family Member */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              2
            </span>
            <h2 className="text-base font-bold text-slate-900">Category & Family Member</h2>
          </div>

          {/* Category Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Category *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.id })}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    formData.category === cat.id
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900">{cat.label}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{cat.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Family Member Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Whose document is this? *
            </label>
            <select
              value={formData.assignedMemberId}
              onChange={(e) => setFormData({ ...formData, assignedMemberId: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-600 text-xs font-bold text-slate-900 bg-white"
            >
              <option value="">Whole Family / Joint Document</option>
              {members.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.relationship})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Step 3: Document Details & Who Can View */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              3
            </span>
            <h2 className="text-base font-bold text-slate-900">Document Details & Privacy</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Document Name / Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Papa's Aadhaar Card, Car Insurance 2026"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 text-xs font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Document ID Number (For 1-Tap Copy)
              </label>
              <input
                type="text"
                placeholder="e.g. 5928 1029 4812 or ABCDE1234F"
                value={formData.documentNumber}
                onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 font-mono text-xs font-semibold text-slate-900"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                This number will have an instant 1-tap copy button in your vault.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Expiry Date (Optional)
            </label>
            <input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              className="w-full sm:w-1/2 px-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 text-xs font-semibold text-slate-900"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              GharVault will remind you 30 days before it expires (useful for Driving Licences, Passports, and Insurance).
            </p>
          </div>

          {/* Who Can View */}
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Who Can View This Document?
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                formData.whoCanViewType === 'ALL'
                  ? 'border-blue-600 bg-blue-50/50'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}>
                <input
                  type="radio"
                  name="whoCanViewType"
                  checked={formData.whoCanViewType === 'ALL'}
                  onChange={() => setFormData({ ...formData, whoCanViewType: 'ALL' })}
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">Whole Family (Everyone)</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    All family vault members can see and copy this document.
                  </div>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                formData.whoCanViewType === 'SPECIFIC'
                  ? 'border-blue-600 bg-blue-50/50'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}>
                <input
                  type="radio"
                  name="whoCanViewType"
                  checked={formData.whoCanViewType === 'SPECIFIC'}
                  onChange={() => setFormData({ ...formData, whoCanViewType: 'SPECIFIC' })}
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">Specific Members Only</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Restrict viewing to designated family members.
                  </div>
                </div>
              </label>
            </div>

            {formData.whoCanViewType === 'SPECIFIC' && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Select allowed members:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {members.map((m) => (
                    <label key={m._id} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.selectedWhoCanView.includes(m._id)}
                        onChange={() => handleToggleMemberView(m._id)}
                        className="rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                      />
                      <span>{m.name} ({m.relationship})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/vault')}
            className="px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">
              {loading ? 'hourglass_top' : 'cloud_upload'}
            </span>
            <span>{loading ? 'Uploading & Encrypting...' : 'Save to Family Vault'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
