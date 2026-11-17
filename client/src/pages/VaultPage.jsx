import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Plus, Search, X, Table, Grid, Copy, Check, Share2, Trash2 } from 'lucide-react';

export default function VaultPage() {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const filterParam = searchParams.get('filter');
  const initialMember = searchParams.get('member') || 'All';

  const [documents, setDocuments] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || 'All');
  const [selectedMember, setSelectedMember] = useState(initialMember);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [copiedNumber, setCopiedNumber] = useState(null);
  const [shareFeedback, setShareFeedback] = useState(null);

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    } else {
      setSelectedCategory('All');
    }
  }, [categoryParam]);

  useEffect(() => {
    loadVault();
  }, []);

  const loadVault = async () => {
    try {
      setLoading(true);
      const [docsRes, membersRes] = await Promise.all([
        api.getDocuments(),
        api.getMembers(),
      ]);
      setDocuments(docsRes.documents || []);
      setMembers(membersRes.members || []);
    } catch (err) {
      console.error('Failed to load vault documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyNumber = (num, e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  const handleShareSafely = async (docId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await api.createShareLink(docId, { expiresInHours: 24 });
      if (res.shareLink) {
        navigator.clipboard.writeText(res.shareLink);
        setShareFeedback({ id: docId, text: '24h Safe Link Copied!' });
        setTimeout(() => setShareFeedback(null), 2500);
      }
    } catch (err) {
      alert('Could not generate share link: ' + err.message);
    }
  };

  const handleDelete = async (id, title, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      try {
        await api.deleteDocument(id);
        loadVault();
      } catch (err) {
        alert('Delete failed: ' + err.message);
      }
    }
  };

  const categories = [
    { name: 'All', icon: 'apps' },
    { name: 'ID Cards', icon: 'badge' },
    { name: 'Medical & Health', icon: 'health_and_safety' },
    { name: 'Bank & Property', icon: 'account_balance' },
    { name: 'Education', icon: 'school' },
    { name: 'Legal', icon: 'gavel' },
    { name: 'Other', icon: 'folder' },
  ];

  const filteredDocs = documents.filter((doc) => {
    const matchesCat = selectedCategory === 'All' || doc.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesMember = selectedMember === 'All' || doc.assignedMemberId?.toString() === selectedMember;
    
    let matchesFilter = true;
    if (filterParam === 'expiring') {
      if (!doc.expiryDate) {
        matchesFilter = false;
      } else {
        const diffDays = Math.ceil((new Date(doc.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        matchesFilter = diffDays <= 60;
      }
    } else if (filterParam === 'shared') {
      matchesFilter = !!(doc.shareLink && doc.shareLink.token);
    }

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      doc.title?.toLowerCase().includes(q) ||
      doc.category?.toLowerCase().includes(q) ||
      (doc.documentNumber && doc.documentNumber.toLowerCase().includes(q)) ||
      (doc.assignedMember?.name && doc.assignedMember.name.toLowerCase().includes(q)) ||
      (doc.tags && doc.tags.some(t => t.toLowerCase().includes(q)))
    );
    return matchesCat && matchesMember && matchesFilter && matchesSearch;
  });

  const getExpiryBadge = (expiryDate) => {
    if (!expiryDate) return null;
    const now = new Date();
    const exp = new Date(expiryDate);
    const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-400 text-[10px] font-bold">
          Expired
        </span>
      );
    }
    if (diffDays <= 30) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 text-[10px] font-bold">
          Expires in {diffDays}d
        </span>
      );
    }
    return null;
  };

  return (
    <div className="max-w-[1380px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">All Documents</h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            Family ID cards, medical policies, bank passbooks, and certificates stored securely.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/vault/upload"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] font-bold text-xs shadow-md shadow-[#3ECF8E]/20 transition-all cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Upload Document</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-[#262626] shadow-xs space-y-4 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Large Search Box */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-2.5 text-slate-400 dark:text-neutral-500" />
            <input
              type="text"
              placeholder="Search by document name, number (Aadhaar, PAN), or person..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-[#3ECF8E] focus:bg-white dark:focus:bg-[#141414] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Member Filter Dropdown */}
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] text-xs font-bold text-slate-700 dark:text-neutral-300"
            >
              <option value="All">All Family Members</option>
              {members.map(m => (
                <option key={m._id} value={m._id}>{m.name} ({m.relationship})</option>
              ))}
            </select>

            {/* Table / Grid Toggle */}
            <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] text-slate-600 dark:text-neutral-400">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-white dark:bg-[#262626] text-[#10B981] dark:text-[#3ECF8E] shadow-xs' : 'hover:text-slate-900 dark:hover:text-white'}`}
                title="Grid Cards"
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-white dark:bg-[#262626] text-[#10B981] dark:text-[#3ECF8E] shadow-xs' : 'hover:text-slate-900 dark:hover:text-white'}`}
                title="Table View"
              >
                <Table size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-[#262626]">
          {categories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
            const count = cat.name === 'All'
              ? documents.length
              : documents.filter(d => d.category.toLowerCase() === cat.name.toLowerCase()).length;

            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] shadow-xs'
                    : 'bg-slate-50 dark:bg-[#141414] hover:bg-slate-100 dark:hover:bg-[#262626] text-slate-600 dark:text-neutral-400 border border-transparent dark:border-[#262626]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{cat.icon}</span>
                <span>{cat.name}</span>
                <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-white/20 dark:bg-black/20 text-white dark:text-[#121212]' : 'bg-slate-200 dark:bg-[#262626] text-slate-700 dark:text-neutral-300'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-6 border border-slate-200 dark:border-[#262626] animate-pulse space-y-3">
              <div className="w-10 h-10 bg-slate-200 dark:bg-[#262626] rounded-xl"></div>
              <div className="h-4 bg-slate-200 dark:bg-[#262626] rounded w-3/4"></div>
              <div className="h-3 bg-slate-200 dark:bg-[#262626] rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : documents.length === 0 ? (
        /* Empty State for brand new users (Zero Mock Data) */
        <div className="bg-white dark:bg-[#1C1C1C] rounded-3xl border border-slate-200/80 dark:border-[#262626] p-12 text-center max-w-xl mx-auto shadow-sm space-y-4 transition-colors">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-600 dark:text-[#3ECF8E] flex items-center justify-center mx-auto shadow-inner">
            <span className="material-symbols-outlined text-4xl">folder_zip</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Your vault is empty</h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
            Upload your family's Aadhaar cards, PAN cards, property deeds, health insurance policies, and marksheets. Everything is encrypted and private to your family.
          </p>
          <div className="pt-2">
            <Link
              to="/vault/upload"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] font-bold text-xs shadow-md shadow-[#3ECF8E]/25 transition-all"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Upload First Document</span>
            </Link>
          </div>
        </div>
      ) : filteredDocs.length === 0 ? (
        /* Empty State for filtered search */
        <div className="bg-white dark:bg-[#1C1C1C] rounded-3xl border border-slate-200/80 dark:border-[#262626] p-10 text-center max-w-md mx-auto space-y-3 transition-colors">
          <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-neutral-600">search_off</span>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">No matching documents found</h3>
          <p className="text-xs text-slate-500 dark:text-neutral-400">
            No records matched your search query or filters.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setSelectedMember('All'); }}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#141414] hover:bg-slate-200 dark:hover:bg-[#262626] text-slate-700 dark:text-neutral-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW WITH ONE-TAP COPY NUMBER BAR */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => (
            <div
              key={doc._id}
              className="bg-white dark:bg-[#1C1C1C] rounded-2xl border border-slate-200/80 dark:border-[#262626] p-5 shadow-xs hover:border-[#3ECF8E] dark:hover:border-[#3ECF8E] hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-600 dark:text-[#3ECF8E] flex items-center justify-center shrink-0 border border-emerald-100 dark:border-[#3ECF8E]/20">
                      <span className="material-symbols-outlined text-2xl">
                        {doc.category === 'ID Cards' ? 'badge' :
                         doc.category === 'Medical & Health' ? 'health_and_safety' :
                         doc.category === 'Bank & Property' ? 'account_balance' :
                         doc.category === 'Education' ? 'school' : 'description'}
                      </span>
                    </div>
                    <div className="truncate">
                      <Link
                        to={`/vault/documents/${doc._id}`}
                        className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-[#3ECF8E] transition-colors truncate block"
                      >
                        {doc.title}
                      </Link>
                      <div className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium">
                        {doc.category} • For {doc.assignedMember?.name || 'Family'}
                      </div>
                    </div>
                  </div>
                  {getExpiryBadge(doc.expiryDate)}
                </div>

                {/* ONE-TAP "COPY NUMBER" BAR */}
                {doc.documentNumber ? (
                  <div className="my-3 p-2.5 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200/80 dark:border-[#262626] flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-neutral-500 tracking-wider">Number:</span>
                      <code className="text-xs font-mono font-bold text-slate-900 dark:text-neutral-200 truncate">
                        {doc.documentNumber}
                      </code>
                    </div>
                    <button
                      onClick={(e) => handleCopyNumber(doc.documentNumber, e)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-[#3ECF8E]/10 hover:bg-emerald-100 dark:hover:bg-[#3ECF8E]/20 text-emerald-700 dark:text-[#3ECF8E] text-xs font-bold flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                      title="Copy document number in one tap"
                    >
                      {copiedNumber === doc.documentNumber ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedNumber === doc.documentNumber ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="my-3 py-1 text-[11px] text-slate-400 dark:text-neutral-500 italic">
                    No document number saved
                  </div>
                )}

                {/* Meta details */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-neutral-500 font-medium pt-1">
                  <span>Size: {(doc.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                  {doc.expiryDate && (
                    <span>Valid to: {new Date(doc.expiryDate).toLocaleDateString()}</span>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3.5 mt-4 border-t border-slate-100 dark:border-[#262626] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => handleShareSafely(doc._id, e)}
                    className="p-1.5 rounded-lg text-slate-500 dark:text-neutral-400 hover:text-[#3ECF8E] hover:bg-emerald-50 dark:hover:bg-[#3ECF8E]/10 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    title="Share Safely (24-hour expiring link)"
                  >
                    <Share2 size={14} />
                    <span>{shareFeedback?.id === doc._id ? 'Copied!' : 'Share Safely'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <Link
                    to={`/vault/documents/${doc._id}`}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#141414] hover:bg-emerald-50 dark:hover:bg-[#3ECF8E]/10 text-slate-700 dark:text-neutral-300 hover:text-[#3ECF8E] text-xs font-bold transition-colors"
                  >
                    View
                  </Link>
                  <button
                    onClick={(e) => handleDelete(doc._id, doc.title, e)}
                    className="p-1.5 rounded-lg text-slate-300 dark:text-neutral-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Delete document"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW WITH ONE-TAP COPY NUMBER COLUMN */
        <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl border border-slate-200/80 dark:border-[#262626] overflow-hidden shadow-xs transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-[#141414] border-b border-slate-200 dark:border-[#262626] text-slate-500 dark:text-neutral-400 uppercase font-bold tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Document</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Family Member</th>
                  <th className="px-4 py-3.5">Document Number & Copy</th>
                  <th className="px-4 py-3.5">Expiry</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#262626] font-medium text-slate-700 dark:text-neutral-300">
                {filteredDocs.map((doc) => (
                  <tr key={doc._id} className="hover:bg-emerald-50/30 dark:hover:bg-[#262626]/40 transition-colors">
                    <td className="px-5 py-4">
                      <Link to={`/vault/documents/${doc._id}`} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-600 dark:text-[#3ECF8E] flex items-center justify-center font-bold shrink-0">
                          <span className="material-symbols-outlined text-base">
                            {doc.category === 'ID Cards' ? 'badge' :
                             doc.category === 'Medical & Health' ? 'health_and_safety' : 'description'}
                          </span>
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white hover:text-[#3ECF8E] transition-colors">
                            {doc.title}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-neutral-500">
                            {(doc.fileSize / (1024 * 1024)).toFixed(1)} MB
                          </div>
                        </div>
                      </Link>
                    </td>

                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#141414] text-slate-700 dark:text-neutral-300 font-semibold text-[11px] border border-transparent dark:border-[#262626]">
                        {doc.category}
                      </span>
                    </td>

                    <td className="px-4 py-4 font-semibold text-slate-900 dark:text-white">
                      {doc.assignedMember?.name || 'Whole Family'}
                    </td>

                    {/* ONE-TAP COPY COLUMN */}
                    <td className="px-4 py-4">
                      {doc.documentNumber ? (
                        <div className="flex items-center gap-2">
                          <code className="font-mono font-bold text-slate-900 dark:text-neutral-200 bg-slate-100 dark:bg-[#141414] px-2 py-0.5 rounded text-[11px] border border-transparent dark:border-[#262626]">
                            {doc.documentNumber}
                          </code>
                          <button
                            onClick={(e) => handleCopyNumber(doc.documentNumber, e)}
                            className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-[#3ECF8E]/10 hover:bg-emerald-100 dark:hover:bg-[#3ECF8E]/20 text-emerald-700 dark:text-[#3ECF8E] font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                            title="Copy number"
                          >
                            {copiedNumber === doc.documentNumber ? <Check size={10} /> : <Copy size={10} />}
                            <span>{copiedNumber === doc.documentNumber ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-neutral-500 text-[11px]">—</span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      {doc.expiryDate ? (
                        <div className="space-y-0.5">
                          <div className="text-[11px] font-semibold text-slate-800 dark:text-neutral-200">
                            {new Date(doc.expiryDate).toLocaleDateString()}
                          </div>
                          {getExpiryBadge(doc.expiryDate)}
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-neutral-500 text-[11px]">No Expiry</span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => handleShareSafely(doc._id, e)}
                          className="px-2.5 py-1 rounded-lg text-slate-500 dark:text-neutral-400 hover:text-[#3ECF8E] hover:bg-emerald-50 dark:hover:bg-[#3ECF8E]/10 text-[11px] font-bold cursor-pointer"
                          title="Share 24h link"
                        >
                          {shareFeedback?.id === doc._id ? 'Copied!' : 'Share'}
                        </button>
                        <Link
                          to={`/vault/documents/${doc._id}`}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-[#3ECF8E]/10 text-emerald-700 dark:text-[#3ECF8E] hover:bg-emerald-100 dark:hover:bg-[#3ECF8E]/20 text-[11px] font-bold"
                        >
                          View
                        </Link>
                        <button
                          onClick={(e) => handleDelete(doc._id, doc.title, e)}
                          className="p-1 rounded text-slate-300 dark:text-neutral-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
