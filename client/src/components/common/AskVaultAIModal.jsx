import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  X,
  Send,
  Copy,
  Check,
  ExternalLink,
  Shield,
  FileText,
  CreditCard,
  HeartPulse,
  Clock,
  Car,
  AlertCircle,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

export default function AskVaultAIModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Namaste! Main aapka **Dastavej AI Assistant** hoon. Apne family vault ke kisi bhi document ka number, expiry ya details seedha mujhse poochhein!',
      copyableValue: null,
      sourceDocId: null,
      sourceDocTitle: null,
      suggestedAction: null,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [copiedText, setCopiedText] = useState(null);

  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Quick suggestion prompts
  const suggestionChips = [
    { label: "💳 Papa ka PAN number", text: "Papa ka PAN card number kya hai?" },
    { label: "🏡 Khasra & Chauhaddi", text: "Khet ka Khasra number aur plot ki chauhaddi kya hai?" },
    { label: "⚡ Bijli Bill & CA No", text: "Bijli ke bill ka CA number aur due date kya hai?" },
    { label: "🏥 Hospital & Dawai", text: "Doctor ne kaunsi dawai likhi thi aur hospital ke documents dikhao" },
    { label: "🎓 College & Marksheets", text: "BCA / University ke saare semester ke marksheets aur certificates dikhao" },
    { label: "🚗 Car Insurance Expiry", text: "Car insurance kab expire ho rahi hai aur policy number kya hai?" },
    { label: "🩸 Family Blood Groups", text: "Family members ke blood groups aur emergency numbers kya hain?" },
  ];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleCopy = (val) => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopiedText(val);
    toast.success(`Copied: "${val}" to clipboard!`);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleSend = async (textToSend) => {
    const q = (textToSend || query).trim();
    if (!q || loading) return;

    const userMsgId = 'user_' + Date.now();
    const newMsg = { id: userMsgId, role: 'user', text: q };

    setMessages((prev) => [...prev, newMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await api.askVaultAI(q);
      const data = res?.data || {};

      const aiMsg = {
        id: 'ai_' + Date.now(),
        role: 'assistant',
        text: data.answer || 'Mujhe iska answer nahi mil saka.',
        copyableValue: data.copyableValue || null,
        sourceDocId: data.sourceDocId || null,
        sourceDocTitle: data.sourceDocTitle || null,
        matchedDocs: Array.isArray(data.matchedDocs) ? data.matchedDocs : [],
        suggestedAction: data.suggestedAction || null,
        category: data.category || null,
        engine: data.engine || 'gemini',
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Ask Vault AI failed:', err);
      let errorDetail = err.message || 'Server connect nahi ho saka';
      if (err.message && (err.message.includes('Document not found') || err.message.includes('404'))) {
        errorDetail = 'Backend server par naya route (/api/documents/ask-ai) abhi deploy/restart nahi hua hai. Kripya git push karke Render deploy hone dein ya local backend restart karein.';
      }
      const errorMsg = {
        id: 'err_' + Date.now(),
        role: 'assistant',
        text: `⚠️ ${errorDetail}`,
        copyableValue: null,
      };
      setMessages((prev) => [...prev, errorMsg]);
      toast.error(errorDetail.slice(0, 80));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#141416] border border-slate-200 dark:border-[#26262B] rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#222227] flex items-center justify-between bg-slate-50/50 dark:bg-[#18181C]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 text-[#10B981] dark:text-[#3ECF8E] flex items-center justify-center shrink-0 shadow-xs border border-emerald-500/20">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                  Ask Vault AI
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-[#3ECF8E]/20 text-emerald-800 dark:text-[#3ECF8E] border border-emerald-200 dark:border-[#3ECF8E]/30">
                  Gemini Vision & Reasoning
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                Poochhein kisi bhi document ka ID number, expiry, ya policy helpline
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#202024] hover:bg-slate-200 dark:hover:bg-[#2A2A30] text-slate-500 dark:text-neutral-400 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2.5 bg-slate-100/70 dark:bg-[#16161A] border-b border-slate-200/60 dark:border-[#222227] overflow-x-auto no-scrollbar flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 shrink-0">
            Suggestions:
          </span>
          {suggestionChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(chip.text)}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#202026] hover:bg-emerald-50 dark:hover:bg-[#3ECF8E]/10 border border-slate-200 dark:border-[#2A2A30] text-[11px] font-medium text-slate-700 dark:text-neutral-300 hover:text-emerald-700 dark:hover:text-[#3ECF8E] shrink-0 transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] flex items-center justify-center shrink-0 shadow-xs font-bold text-xs mt-1">
                    AI
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm space-y-2.5 transition-all ${
                    isUser
                      ? 'bg-[#10B981] text-white rounded-br-xs font-medium'
                      : 'bg-slate-50 dark:bg-[#1A1A1E] text-slate-800 dark:text-neutral-200 rounded-bl-xs border border-slate-200/70 dark:border-[#282830]'
                  }`}
                >
                  {/* Message Prose with bolding support */}
                  <div className="leading-relaxed whitespace-pre-wrap font-sans">
                    {msg.text.split(/(\*\*.*?\*\*)/g).map((part, pIdx) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return (
                          <strong key={pIdx} className="font-extrabold text-slate-900 dark:text-white">
                            {part.slice(2, -2)}
                          </strong>
                        );
                      }
                      return part;
                    })}
                  </div>

                  {/* 1-Tap Copy Action Pill */}
                  {msg.copyableValue && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.copyableValue)}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#25252B] border border-emerald-300 dark:border-[#3ECF8E]/30 text-emerald-800 dark:text-[#3ECF8E] font-mono font-extrabold text-xs shadow-2xs hover:bg-emerald-50 dark:hover:bg-[#3ECF8E]/20 transition-all cursor-pointer active:scale-95 group"
                      >
                        {copiedText === msg.copyableValue ? (
                          <>
                            <Check size={14} className="text-[#10B981]" strokeWidth={3} />
                            <span>COPIED!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} className="group-hover:scale-110 transition-transform" />
                            <span>1-Tap Copy: {msg.copyableValue}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Source Document Jump Card */}
                  {msg.sourceDocId && (!msg.matchedDocs || msg.matchedDocs.length <= 1) && (
                    <div className="pt-1 border-t border-slate-200/60 dark:border-[#282830] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          navigate(`/vault/documents/${msg.sourceDocId}`);
                        }}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-[#3ECF8E] transition-colors cursor-pointer"
                      >
                        <FileText size={13} />
                        <span>Open "{msg.sourceDocTitle || 'Document'}"</span>
                        <ExternalLink size={11} className="opacity-70" />
                      </button>
                    </div>
                  )}

                  {/* Multi-Document Match Cards (e.g. "Iss hospital ke saare documents", "University DMC") */}
                  {msg.matchedDocs && msg.matchedDocs.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-[#282830] space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                        Related Documents ({msg.matchedDocs.length}):
                      </div>
                      <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto no-scrollbar">
                        {msg.matchedDocs.map((doc, dIdx) => (
                          <button
                            key={dIdx}
                            type="button"
                            onClick={() => {
                              onClose();
                              navigate(`/vault/documents/${doc.id || doc._id}`);
                            }}
                            className="w-full flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#25252B] hover:bg-emerald-50 dark:hover:bg-[#3ECF8E]/10 border border-slate-200/80 dark:border-[#333] text-left transition-all cursor-pointer group shadow-2xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-[#3ECF8E]/20 text-emerald-800 dark:text-[#3ECF8E] flex items-center justify-center shrink-0 text-xs font-bold">
                                {doc.category?.includes('Medical') ? '🏥' : (doc.category?.includes('Education') ? '🎓' : '📄')}
                              </div>
                              <div className="min-w-0">
                                <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-700 dark:group-hover:text-[#3ECF8E]">
                                  {doc.title}
                                </div>
                                {doc.institutionOrDoctor && (
                                  <div className="text-[10px] text-slate-500 dark:text-neutral-400 truncate">
                                    {doc.institutionOrDoctor}
                                  </div>
                                )}
                              </div>
                            </div>
                            <ExternalLink size={12} className="text-slate-400 group-hover:text-emerald-600 shrink-0 ml-2" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Thinking Shimmer when loading */}
          {loading && (
            <div className="flex gap-3 justify-start items-center animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-[#10B981]/20 text-[#10B981] dark:text-[#3ECF8E] flex items-center justify-center shrink-0">
                <Sparkles size={16} className="animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              <div className="bg-slate-50 dark:bg-[#1A1A1E] border border-slate-200/70 dark:border-[#282830] rounded-2xl px-4 py-3 text-xs text-slate-500 dark:text-neutral-400 flex items-center gap-2">
                <span>Reading family vault with Gemini AI...</span>
                <div className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-[#222227] bg-white dark:bg-[#141416]">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#1C1C20] rounded-2xl px-3.5 py-2 border border-slate-200/80 dark:border-[#282830] focus-within:border-emerald-500 dark:focus-within:border-[#3ECF8E] transition-all shadow-inner">
            <input
              ref={inputRef}
              type="text"
              placeholder='Poochhein (e.g. "Papa ka PAN number", "Car insurance expiry")...'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="w-full bg-transparent outline-none text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500"
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!query.trim() || loading}
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                query.trim() && !loading
                  ? 'bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] shadow-sm hover:scale-105 active:scale-95'
                  : 'bg-slate-200 dark:bg-[#282830] text-slate-400 dark:text-neutral-600 cursor-not-allowed'
              }`}
            >
              <Send size={14} />
            </button>
          </div>
          <div className="flex items-center justify-between px-2 pt-2 text-[10px] text-slate-400 dark:text-neutral-500 font-mono">
            <span>Press Enter to send</span>
            <span>256-Bit Private • Family Scoped Only</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
