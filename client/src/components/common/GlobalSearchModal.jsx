import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  Copy,
  Check,
  Lock,
  Plus,
  Users,
  Sparkles,
  Clock,
  ArrowRight,
  Shield,
  GraduationCap,
  Scale,
  Folder,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function GlobalSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [documents, setDocuments] = useState([]);
  const [members, setMembers] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [copiedDocId, setCopiedDocId] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const navigate = useNavigate();
  const { toast } = useToast();
  const inputRef = useRef(null);
  const resultsContainerRef = useRef(null);

  // Quick category suggestion tags for 1-tap mobile search
  const quickSearchChips = [
    { label: 'Aadhaar', query: 'Aadhaar' },
    { label: 'PAN Card', query: 'PAN' },
    { label: 'Insurance', query: 'Insurance' },
    { label: 'Passport', query: 'Passport' },
    { label: 'Driving Licence', query: 'Licence' },
    { label: 'Property Deeds', query: 'Property' },
  ];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      api.getDocuments().then((data) => setDocuments(data.documents || []));
      api.getMembers().then((data) => setMembers(data.members || []));
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // Keyboard navigation: Arrow Up, Arrow Down, Escape, Enter
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      const totalItems = filteredDocs.length + filteredMembers.length;
      if (totalItems === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % totalItems);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex < filteredDocs.length) {
          const selectedDoc = filteredDocs[selectedIndex];
          if (selectedDoc) {
            handleSelectDoc(selectedDoc);
          }
        } else {
          const memberIndex = selectedIndex - filteredDocs.length;
          const selectedMember = filteredMembers[memberIndex];
          if (selectedMember) {
            navigate(`/family/${selectedMember._id}`);
            onClose();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, filteredDocs, filteredMembers, selectedIndex]);

  // Multi-Field Filter Logic
  useEffect(() => {
    if (!query.trim()) {
      setFilteredDocs(documents.slice(0, 5));
      setFilteredMembers(members.slice(0, 3));
      setSelectedIndex(0);
      return;
    }

    const q = query.toLowerCase().trim();
    const matchedDocs = documents.filter((d) => {
      const matchTitle = (d.title || '').toLowerCase().includes(q);
      const matchCategory = (d.category || '').toLowerCase().includes(q);
      const matchNumber = (d.documentNumber || '').toLowerCase().includes(q);
      const matchMemberName = (d.assignedMember?.name || '').toLowerCase().includes(q);
      const matchTags = Array.isArray(d.tags) && d.tags.some((t) => t.toLowerCase().includes(q));
      return matchTitle || matchCategory || matchNumber || matchMemberName || matchTags;
    });

    const matchedMembers = members.filter((m) => {
      const matchName = (m.name || '').toLowerCase().includes(q);
      const matchRel = (m.relationship || '').toLowerCase().includes(q);
      const matchRole = (m.role || '').toLowerCase().includes(q);
      return matchName || matchRel || matchRole;
    });

    setFilteredDocs(matchedDocs);
    setFilteredMembers(matchedMembers);
    setSelectedIndex(0);
  }, [query, documents, members]);

  const handleCopyNumber = (num, id, e) => {
    e.stopPropagation();
    if (!num) return;
    try {
      navigator.clipboard.writeText(num);
      setCopiedDocId(id);
      toast.success(`Copied: ${num}`);
      setTimeout(() => setCopiedDocId(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleSelectDoc = (doc) => {
    navigate(`/vault/documents/${doc._id}`);
    onClose();
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'ID Cards':
        return <CreditCard size={15} />;
      case 'Medical & Health':
        return <HeartPulse size={15} />;
      case 'Bank & Property':
        return <Building2 size={15} />;
      case 'Education':
        return <GraduationCap size={15} />;
      case 'Legal':
        return <Scale size={15} />;
      default:
        return <FileText size={15} />;
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-start justify-center sm:pt-14 p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#18181B] border-t sm:border border-slate-200 dark:border-[#27272A] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[82vh] overflow-hidden transition-all text-slate-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator Handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-neutral-700" />
        </div>

        {/* ================= SEARCH INPUT HEADER ================= */}
        <div className="flex items-center px-4 py-3 sm:py-3.5 border-b border-slate-100 dark:border-[#262626] bg-slate-50/70 dark:bg-[#141414] shrink-0 gap-2.5">
          <Search className="w-5 h-5 text-emerald-600 dark:text-[#3ECF8E] shrink-0" strokeWidth={2.2} />
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 text-xs sm:text-sm font-semibold focus:outline-none"
            placeholder="Search documents, Aadhaar, PAN, insurance, flat deed..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:text-neutral-400 dark:hover:text-white cursor-pointer"
            >
              <X size={16} />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="sm:hidden text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white shrink-0 cursor-pointer"
          >
            Cancel
          </button>

          <kbd className="hidden sm:inline-block px-2 py-0.5 rounded-lg bg-slate-200/80 dark:bg-[#262626] text-slate-600 dark:text-neutral-400 text-[11px] font-mono border border-slate-300/80 dark:border-[#383838]">
            ESC
          </kbd>
        </div>

        {/* ================= QUICK 1-TAP CHIPS BAR ================= */}
        <div className="px-3.5 py-2 border-b border-slate-100 dark:border-[#222225] bg-white dark:bg-[#161619] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles size={11} className="text-[#10B981] dark:text-[#3ECF8E]" />
            Quick:
          </span>
          {quickSearchChips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => setQuery(chip.query)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                query.toLowerCase() === chip.query.toLowerCase()
                  ? 'bg-gradient-to-r from-sky-500 via-indigo-500 to-blue-600 text-white shadow-xs border border-sky-400/30'
                  : 'bg-slate-100 dark:bg-[#182030] text-slate-600 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-[#202b40] border border-slate-200/90 dark:border-[#1E293B]'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* ================= RESULTS LIST ================= */}
        <div ref={resultsContainerRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          {/* Documents Section */}
          {filteredDocs.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-2 mb-1.5">
                <span className="text-[11px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">
                  {query ? `Documents Found (${filteredDocs.length})` : 'Recent Documents in Vault'}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-neutral-500">
                  Tap to view • 1-tap copy
                </span>
              </div>

              <div className="space-y-1.5">
                {filteredDocs.map((doc, idx) => {
                  const isSelected = selectedIndex === idx;
                  const hasNumber = doc.documentNumber && doc.documentNumber.trim() !== '';
                  const isSensitive =
                    doc.isSensitive ||
                    doc.isMpinProtected ||
                    ['Property & Legal', 'Financial', 'Legal'].includes(doc.category);

                  return (
                    <div
                      key={doc._id}
                      onClick={() => handleSelectDoc(doc)}
                      className={`flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer group ${
                        isSelected
                          ? 'border-[#3ECF8E] bg-[#3ECF8E]/10 dark:bg-[#3ECF8E]/10 ring-1 ring-[#3ECF8E]/30'
                          : 'border-transparent hover:border-slate-200 dark:hover:border-[#262626] hover:bg-slate-50 dark:hover:bg-[#202024]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Category Icon */}
                        <div className="w-9 h-9 rounded-xl bg-emerald-100/70 dark:bg-[#3ECF8E]/15 border border-emerald-200/60 dark:border-[#3ECF8E]/25 text-emerald-700 dark:text-[#3ECF8E] flex items-center justify-center shrink-0">
                          {getCategoryIcon(doc.category)}
                        </div>

                        {/* Document Info */}
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-2">
                            <span className="truncate">{doc.title}</span>
                            {isSensitive && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[10px] font-bold shrink-0">
                                <Lock size={10} /> MPIN
                              </span>
                            )}
                            {doc.status === 'EXPIRING_SOON' && (
                              <span className="px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400 text-[10px] font-bold shrink-0">
                                Expiring
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-500 dark:text-neutral-400 flex items-center gap-2 mt-0.5 truncate">
                            <span className="font-semibold text-slate-600 dark:text-neutral-300">
                              {doc.category}
                            </span>
                            {doc.assignedMember?.name && (
                              <span>• {doc.assignedMember.name}</span>
                            )}
                            {hasNumber && (
                              <span className="font-mono text-emerald-800 dark:text-[#3ECF8E] font-bold">
                                • {doc.documentNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Action: 1-Tap Copy Number or Arrow */}
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {hasNumber && (
                          <button
                            type="button"
                            onClick={(e) => handleCopyNumber(doc.documentNumber, doc._id, e)}
                            className="p-1.5 rounded-xl border border-slate-200 dark:border-[#2E2E33] bg-white dark:bg-[#141414] hover:bg-emerald-50 dark:hover:bg-[#3ECF8E]/15 text-slate-500 hover:text-emerald-700 dark:text-neutral-400 dark:hover:text-[#3ECF8E] transition-colors cursor-pointer shadow-2xs"
                            title="1-Tap Copy ID Number"
                          >
                            {copiedDocId === doc._id ? (
                              <Check size={14} className="text-[#10B981] dark:text-[#3ECF8E]" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-[#3ECF8E] transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Family Members Section */}
          {filteredMembers.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider px-2 mb-1.5 block">
                {query ? `Family Members (${filteredMembers.length})` : 'Family Directory'}
              </span>

              <div className="space-y-1.5">
                {filteredMembers.map((m, idx) => {
                  const isSelected = selectedIndex === filteredDocs.length + idx;
                  const initial = (m.name || 'M').charAt(0).toUpperCase();

                  return (
                    <div
                      key={m._id}
                      onClick={() => {
                        navigate(`/family/${m._id}`);
                        onClose();
                      }}
                      className={`flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer group ${
                        isSelected
                          ? 'border-[#3ECF8E] bg-[#3ECF8E]/10 dark:bg-[#3ECF8E]/10 ring-1 ring-[#3ECF8E]/30'
                          : 'border-transparent hover:border-slate-200 dark:hover:border-[#262626] hover:bg-slate-50 dark:hover:bg-[#202024]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {m.avatar ? (
                          <img
                            src={m.avatar}
                            alt={m.name}
                            className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-[#262626] shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-[#3ECF8E]/20 text-emerald-800 dark:text-[#3ECF8E] font-bold text-xs flex items-center justify-center shrink-0">
                            {initial}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-[#3ECF8E] truncate">
                            {m.name}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-neutral-400 capitalize">
                            {m.relationship || 'Family Member'} {m.role && `• ${m.role}`}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-[#3ECF8E] transition-colors" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Actions Shortcuts (when zero query) */}
          {!query && (
            <div className="pt-2 border-t border-slate-100 dark:border-[#222226]">
              <span className="text-[11px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider px-2 mb-2 block">
                Vault Quick Actions
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigate('/vault/upload');
                    onClose();
                  }}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200/80 dark:border-[#262626] hover:border-emerald-300 dark:hover:border-[#3ECF8E]/40 hover:bg-emerald-50/40 dark:hover:bg-[#3ECF8E]/10 text-left transition-all cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] flex items-center justify-center shrink-0">
                    <Plus size={15} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Upload New Document</div>
                    <div className="text-[10px] text-slate-400 dark:text-neutral-500">Add ID, policy, deed</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigate('/vault?filter=expiring');
                    onClose();
                  }}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200/80 dark:border-[#262626] hover:border-amber-300 dark:hover:border-amber-500/40 hover:bg-amber-50/40 dark:hover:bg-amber-500/10 text-left transition-all cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <Clock size={15} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Expiring Renewals</div>
                    <div className="text-[10px] text-slate-400 dark:text-neutral-500">Check alerts in 60 days</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* No Results Found State */}
          {filteredDocs.length === 0 && filteredMembers.length === 0 && (
            <div className="text-center py-10 text-slate-500 dark:text-neutral-400 space-y-2.5">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#202024] flex items-center justify-center mx-auto text-slate-400 dark:text-neutral-500">
                <SearchX size={24} />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-neutral-200">
                No records matching "{query}"
              </p>
              <p className="text-[11px] text-slate-400 dark:text-neutral-500 max-w-xs mx-auto">
                Try searching by document ID (Aadhaar, PAN), family member name, or category.
              </p>
            </div>
          )}
        </div>

        {/* ================= FOOTER SHORTCUTS STRIP ================= */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-[#141414] border-t border-slate-100 dark:border-[#262626] flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 shrink-0 pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))]">
          <div className="hidden sm:flex items-center gap-3">
            <span className="flex items-center gap-1 text-[11px]">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#262626] text-slate-700 dark:text-neutral-300 font-mono border border-slate-300 dark:border-[#383838]">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#262626] text-slate-700 dark:text-neutral-300 font-mono border border-slate-300 dark:border-[#383838]">
                ↓
              </kbd>{' '}
              navigate
            </span>
            <span className="flex items-center gap-1 text-[11px]">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#262626] text-slate-700 dark:text-neutral-300 font-mono border border-slate-300 dark:border-[#383838]">
                ↵
              </kbd>{' '}
              open
            </span>
          </div>

          <span className="text-[11px] flex items-center gap-1 font-semibold text-emerald-800 dark:text-[#3ECF8E]">
            <Shield size={12} />
            <span>Dastavej Safe Instant Search</span>
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}
