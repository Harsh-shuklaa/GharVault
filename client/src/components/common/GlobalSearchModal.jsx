import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import {
  Search,
  FileText,
  CreditCard,
  HeartPulse,
  Building2,
  ChevronRight,
  SearchX,
  X,
} from 'lucide-react';

export default function GlobalSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [documents, setDocuments] = useState([]);
  const [members, setMembers] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      api.getDocuments().then((data) => setDocuments(data.documents || []));
      api.getMembers().then((data) => setMembers(data.members || []));
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
      documents.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q) ||
          (d.documentNumber && d.documentNumber.toLowerCase().includes(q)) ||
          (d.tags && d.tags.some((t) => t.toLowerCase().includes(q)))
      )
    );

    setFilteredMembers(
      members.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.role.toLowerCase().includes(q) ||
          m.relationship.toLowerCase().includes(q)
      )
    );
  }, [query, documents, members]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-start justify-center md:pt-16 p-0 md:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="fixed inset-x-0 bottom-0 md:static md:inset-auto w-full max-w-2xl bg-white dark:bg-[#18181B] border-t md:border border-slate-200 dark:border-[#27272A] rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col max-h-[88vh] md:max-h-[80vh] overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle Pill */}
        <div className="md:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-neutral-600" />
        </div>

        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#141414] shrink-0">
          <Search className="w-5 h-5 text-slate-400 dark:text-neutral-500 mr-3 shrink-0" />
          <input
            type="text"
            className="w-full bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 text-sm font-medium focus:outline-none"
            placeholder="Search documents, Aadhaar, PAN, insurance, family members..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button
            onClick={onClose}
            className="md:hidden p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white ml-2"
          >
            <X size={18} />
          </button>
          <kbd className="hidden md:inline-block px-2 py-0.5 rounded bg-slate-200 dark:bg-[#27272A] text-slate-600 dark:text-neutral-400 text-[11px] font-mono border border-slate-300 dark:border-[#3F3F46]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Documents Section */}
          {filteredDocs.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider px-2 mb-1.5 block">
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
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#27272A] text-slate-800 dark:text-neutral-200 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-[#141414] border border-emerald-100 dark:border-[#27272A] text-[#10B981] dark:text-[#3ECF8E] flex items-center justify-center shrink-0">
                        {doc.category === 'ID Cards' ? (
                          <CreditCard className="w-4 h-4" />
                        ) : doc.category === 'Medical & Health' ? (
                          <HeartPulse className="w-4 h-4" />
                        ) : doc.category === 'Bank & Property' ? (
                          <Building2 className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-[#10B981] dark:group-hover:text-[#3ECF8E] truncate flex items-center gap-2">
                          <span>{doc.title}</span>
                          {doc.status === 'EXPIRING_SOON' && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 uppercase">
                              Expiring
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-neutral-400 flex items-center gap-2 mt-0.5">
                          <span>{doc.category}</span>
                          {doc.documentNumber && <span>• {doc.documentNumber}</span>}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#10B981] dark:text-neutral-500 dark:group-hover:text-[#3ECF8E] transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members Section */}
          {filteredMembers.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider px-2 mb-1.5 block">
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
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#27272A] text-slate-800 dark:text-neutral-200 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          m.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=3ECF8E&color=121212`
                        }
                        alt={m.name}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-[#27272A]"
                      />
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-[#10B981] dark:group-hover:text-[#3ECF8E]">
                          {m.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-neutral-400">
                          {m.relationship} • {m.role}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#10B981] dark:text-neutral-500 dark:group-hover:text-[#3ECF8E] transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredDocs.length === 0 && filteredMembers.length === 0 && (
            <div className="text-center py-8 text-slate-500 dark:text-neutral-400 space-y-2">
              <SearchX className="w-8 h-8 mx-auto text-slate-400 dark:text-neutral-500" />
              <p className="text-xs">No records match "{query}"</p>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-[#141414] border-t border-slate-200 dark:border-[#27272A] flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[11px]">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#27272A] text-slate-700 dark:text-neutral-300 font-mono border border-slate-300 dark:border-[#3F3F46]">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#27272A] text-slate-700 dark:text-neutral-300 font-mono border border-slate-300 dark:border-[#3F3F46]">
                ↓
              </kbd>{' '}
              navigate
            </span>
            <span className="flex items-center gap-1 text-[11px]">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#27272A] text-slate-700 dark:text-neutral-300 font-mono border border-slate-300 dark:border-[#3F3F46]">
                ↵
              </kbd>{' '}
              select
            </span>
          </div>
          <span className="text-[11px] font-mono">GharVault Safe Search</span>
        </div>
      </div>
    </div>
  );
}
