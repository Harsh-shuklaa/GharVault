import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function VaultPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMember, setSelectedMember] = useState('All');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [copiedHash, setCopiedHash] = useState(null);

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

  const handleCopyHash = (hash, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this document from the vault?')) {
      await api.deleteDocument(id);
      loadVault();
    }
  };

  const categories = [
    { name: 'All', icon: 'apps' },
    { name: 'Identity', icon: 'badge' },
    { name: 'Financial', icon: 'account_balance' },
    { name: 'Property', icon: 'real_estate_agent' },
    { name: 'Health', icon: 'health_and_safety' },
    { name: 'Legal', icon: 'gavel' },
  ];

  const filteredDocs = documents.filter((doc) => {
    const matchesCat = selectedCategory === 'All' || doc.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesMember = selectedMember === 'All' || doc.assignedMemberId?.toString() === selectedMember;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || (
      doc.title.toLowerCase().includes(q) ||
      doc.category.toLowerCase().includes(q) ||
      (doc.documentNumber && doc.documentNumber.toLowerCase().includes(q)) ||
      (doc.tags && doc.tags.some(t => t.toLowerCase().includes(q)))
    );
    return matchesCat && matchesMember && matchesSearch;
  });

  return (
    <div className="max-w-[1380px] mx-auto p-6 lg:p-8 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Master Document Vault</h1>
          <p className="text-xs text-slate-500 mt-1">
            256-bit AES encrypted repository with automated statutory metadata and SHA-256 seals.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/vault/upload"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            <span>Upload Document</span>
          </Link>
          <a
            href="/api/export/backup"
            download
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-xs transition-colors"
          >
            <span className="material-symbols-outlined text-lg text-slate-500">inventory_2</span>
            <span>Export Cold Backup</span>
          </a>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">search</span>
            <input
              type="text"
              placeholder="Filter by title, document #, tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Member Filter */}
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 bg-white"
            >
              <option value="All">All Family Members</option>
              {members.map(m => (
                <option key={m._id} value={m._id}>{m.name} ({m.relationship})</option>
              ))}
            </select>

            {/* Table / Grid Toggle */}
            <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-600">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'}`}
                title="Table View"
              >
                <span className="material-symbols-outlined text-lg">table_rows</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'}`}
                title="Grid View"
              >
                <span className="material-symbols-outlined text-lg">grid_view</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          {categories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
            const count = cat.name === 'All'
              ? documents.length
              : documents.filter(d => d.category.toLowerCase() === cat.name.toLowerCase()).length;

            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-base">{cat.icon}</span>
                <span>{cat.name}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? 'bg-blue-500/40 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Document Listing */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Document Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Custodian</th>
                  <th className="py-3.5 px-4">Identifier / ID</th>
                  <th className="py-3.5 px-4">Validity / Status</th>
                  <th className="py-3.5 px-4">Size</th>
                  <th className="py-3.5 px-4">Cryptographic Seal</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredDocs.map((doc) => (
                  <tr
                    key={doc._id}
                    onClick={() => navigate(`/vault/documents/${doc._id}`)}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                  >
                    {/* Title */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                          <span className="material-symbols-outlined text-xl">
                            {doc.category === 'Identity' ? 'badge' :
                             doc.category === 'Property' ? 'real_estate_agent' :
                             doc.category === 'Health' ? 'health_and_safety' :
                             doc.category === 'Legal' ? 'gavel' : 'account_balance'}
                          </span>
                        </div>
                        <div className="truncate max-w-xs">
                          <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                            {doc.title}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono truncate">{doc.originalFileName}</div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {doc.category}
                      </span>
                    </td>

                    {/* Custodian */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {doc.assignedMember && (
                          <img
                            src={doc.assignedMember.avatar}
                            alt={doc.assignedMember.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        )}
                        <span className="font-medium text-slate-800">
                          {doc.assignedMember ? doc.assignedMember.name.split(' ')[0] : 'Family'}
                        </span>
                      </div>
                    </td>

                    {/* ID */}
                    <td className="py-4 px-4 font-mono text-slate-600">
                      {doc.documentNumber || '—'}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      {doc.status === 'EXPIRING_SOON' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 font-mono text-[10px] font-bold border border-red-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                          Expires in 27d
                        </span>
                      ) : doc.isSensitive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-mono text-[10px] font-bold border border-blue-200">
                          <span className="material-symbols-outlined text-[10px]">key</span>
                          Quorum Required
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-mono text-[10px] font-semibold border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Verified Active
                        </span>
                      )}
                    </td>

                    {/* Size */}
                    <td className="py-4 px-4 font-mono text-slate-500">
                      {(doc.fileSize / (1024 * 1024)).toFixed(1)} MB
                    </td>

                    {/* Hash */}
                    <td className="py-4 px-4">
                      <button
                        onClick={(e) => handleCopyHash(doc.sha256Hash, e)}
                        className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition-colors"
                        title="Click to copy SHA-256 seal"
                      >
                        <span>{doc.sha256Hash ? `${doc.sha256Hash.slice(0, 8)}...` : 'N/A'}</span>
                        <span className="material-symbols-outlined text-xs">
                          {copiedHash === doc.sha256Hash ? 'check' : 'content_copy'}
                        </span>
                      </button>
                    </td>

                    {/* Action */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/vault/documents/${doc._id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                          title="View Details"
                        >
                          <span className="material-symbols-outlined text-lg">visibility</span>
                        </Link>
                        <button
                          onClick={(e) => handleDelete(doc._id, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 transition-colors"
                          title="Delete Document"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Showing {filteredDocs.length} records in Sharma Family Ghar</span>
            <span>All records encrypted under 256-bit AES</span>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc._id}
              onClick={() => navigate(`/vault/documents/${doc._id}`)}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <span className="material-symbols-outlined text-2xl">
                      {doc.category === 'Identity' ? 'badge' :
                       doc.category === 'Property' ? 'real_estate_agent' :
                       doc.category === 'Health' ? 'health_and_safety' : 'account_balance'}
                    </span>
                  </div>
                  {doc.status === 'EXPIRING_SOON' ? (
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-mono text-[10px] font-bold">
                      Expiring
                    </span>
                  ) : doc.isSensitive ? (
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono text-[10px] font-bold">
                      Quorum
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px] font-semibold">
                      Verified
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {doc.title}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{doc.documentNumber || doc.category}</p>

                <div className="flex flex-wrap gap-1 mt-3">
                  {(doc.tags || []).slice(0, 3).map((tag, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="font-mono">{(doc.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
                <span className="text-blue-600 font-semibold group-hover:underline flex items-center gap-0.5">
                  View →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
