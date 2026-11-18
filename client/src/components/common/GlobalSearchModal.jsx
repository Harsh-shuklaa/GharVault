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
  User,
  SearchX
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
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/70 backdrop-blur-xs p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#1C1C1C] rounded-xl shadow-2xl border border-[#2E2E2E] overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#262626] bg-[#141414]">
          <Search className="w-5 h-5 text-[#8F8F8F] mr-3 shrink-0" />
          <input
            type="text"
            className="w-full bg-transparent text-[#EDEDED] placeholder:text-[#666] text-sm font-medium focus:outline-none"
            placeholder="Search documents, Aadhaar, PAN, insurance, family members..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <kbd className="px-2 py-0.5 rounded bg-[#262626] text-[#8F8F8F] text-[11px] font-mono border border-[#333]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-3 space-y-3">
          {/* Documents Section */}
          {filteredDocs.length > 0 && (
            <div>
              <span className="text-[11px] font-medium text-[#8F8F8F] uppercase tracking-wider px-2 mb-1.5 block">
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
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#252525] text-[#EDEDED] cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#141414] border border-[#2E2E2E] text-[#3ECF8E] flex items-center justify-center shrink-0">
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
                        <div className="text-xs font-medium text-[#EDEDED] group-hover:text-[#3ECF8E] truncate flex items-center gap-2">
                          <span>{doc.title}</span>
                          {doc.status === 'EXPIRING_SOON' && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
                              Expiring
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#8F8F8F] flex items-center gap-2 mt-0.5">
                          <span>{doc.category}</span>
                          {doc.documentNumber && <span>• {doc.documentNumber}</span>}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#666] group-hover:text-[#3ECF8E] transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members Section */}
          {filteredMembers.length > 0 && (
            <div>
              <span className="text-[11px] font-medium text-[#8F8F8F] uppercase tracking-wider px-2 mb-1.5 block">
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
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#252525] text-[#EDEDED] cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={m.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.name)}`}
                        alt={m.name}
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-[#333]"
                      />
                      <div>
                        <div className="text-xs font-medium text-[#EDEDED] group-hover:text-[#3ECF8E]">
                          {m.name}
                        </div>
                        <div className="text-[11px] text-[#8F8F8F]">
                          {m.relationship} • {m.role}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#666] group-hover:text-[#3ECF8E] transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredDocs.length === 0 && filteredMembers.length === 0 && (
            <div className="text-center py-8 text-[#8F8F8F] space-y-2">
              <SearchX className="w-8 h-8 mx-auto text-[#555]" />
              <p className="text-xs">No records match "{query}"</p>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-[#141414] border-t border-[#262626] flex items-center justify-between text-xs text-[#8F8F8F]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[11px]">
              <kbd className="px-1.5 py-0.5 rounded bg-[#262626] text-[#EDEDED] font-mono border border-[#333]">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-[#262626] text-[#EDEDED] font-mono border border-[#333]">↓</kbd> navigate
            </span>
            <span className="flex items-center gap-1 text-[11px]">
              <kbd className="px-1.5 py-0.5 rounded bg-[#262626] text-[#EDEDED] font-mono border border-[#333]">↵</kbd> select
            </span>
          </div>
          <span className="text-[11px]">GharVault Search</span>
        </div>
      </div>
    </div>
  );
}
