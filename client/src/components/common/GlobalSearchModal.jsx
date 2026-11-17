import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

export default function GlobalSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [documents, setDocuments] = useState([]);
  const [members, setMembers] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      api.getDocuments().then(data => setDocuments(data.documents || []));
      api.getMembers().then(data => setMembers(data.members || []));
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setFilteredDocs(documents.slice(0, 5));
      setFilteredMembers(members.slice(0, 3));
      return;
    }

    const q = query.toLowerCase();
    setFilteredDocs(
      documents.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        (d.documentNumber && d.documentNumber.toLowerCase().includes(q)) ||
        (d.tags && d.tags.some(t => t.toLowerCase().includes(q)))
      )
    );

    setFilteredMembers(
      members.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        m.relationship.toLowerCase().includes(q)
      )
    );
  }, [query, documents, members]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 bg-slate-50/50">
          <span className="material-symbols-outlined text-slate-400 text-2xl mr-3">search</span>
          <input
            type="text"
            className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 text-base font-medium focus:outline-none"
            placeholder="Search documents, Aadhaar, PAN, insurance, family members..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <kbd className="px-2 py-1 rounded bg-slate-200/80 text-slate-600 text-xs font-mono font-medium">ESC</kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-3 space-y-4">
          {/* Documents Section */}
          {filteredDocs.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-1.5 block">
                Documents ({filteredDocs.length})
              </span>
              <div className="space-y-1">
                {filteredDocs.map((doc) => (
                  <div
                    key={doc._id}
                    onClick={() => {
                      navigate(`/vault/documents/${doc._id}`);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50/70 hover:text-blue-900 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-blue-100/60 text-blue-600 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-xl">
                          {doc.category === 'Identity' ? 'badge' :
                           doc.category === 'Property' ? 'real_estate_agent' :
                           doc.category === 'Health' ? 'health_and_safety' :
                           doc.category === 'Financial' ? 'account_balance' : 'folder'}
                        </span>
                      </div>
                      <div className="truncate">
                        <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 truncate flex items-center gap-2">
                          <span>{doc.title}</span>
                          {doc.status === 'EXPIRING_SOON' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                              Expiring
                            </span>
                          )}
                          {doc.isSensitive && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 uppercase flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[10px]">lock</span> Quorum
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <span>{doc.category}</span>
                          <span>•</span>
                          <span>{doc.documentNumber || 'No ID'}</span>
                        </div>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-blue-600 text-lg">
                      chevron_right
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members Section */}
          {filteredMembers.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-1.5 block">
                Family Members ({filteredMembers.length})
              </span>
              <div className="space-y-1">
                {filteredMembers.map((m) => (
                  <div
                    key={m._id}
                    onClick={() => {
                      navigate(`/family/${m._id}`);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-600">
                          {m.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {m.relationship} • {m.role}
                        </div>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-blue-600 text-lg">
                      chevron_right
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredDocs.length === 0 && filteredMembers.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">search_off</span>
              <p className="text-sm">No records match "{query}"</p>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-mono">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-mono">↓</kbd> to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-mono">↵</kbd> to select
            </span>
          </div>
          <span>GharVault Global Search</span>
        </div>
      </div>
    </div>
  );
}
