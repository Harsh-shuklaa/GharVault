import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  X,
  ArrowUp,
  Copy,
  Check,
  ExternalLink,
  FileText,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

// Clean, lightweight Markdown parser for ChatGPT-style text
function parseFormattedSegments(text) {
  if (!text) return '';
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  const parts = text.split(regex);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-neutral-900 dark:text-neutral-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={idx}
          className="font-mono text-xs px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-[#1A1A1A] text-neutral-900 dark:text-neutral-200 border border-neutral-200/80 dark:border-[#2A2A2A]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function FormattedMessage({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ');
        const content = isBullet ? trimmed.replace(/^[-*•]\s+/, '') : line;
        const rendered = parseFormattedSegments(content);

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-2 ml-1 text-sm">
              <span className="text-neutral-400 dark:text-neutral-500 select-none mt-1 text-[8px]">•</span>
              <span className="flex-1">{rendered}</span>
            </div>
          );
        }

        if (trimmed === '') {
          return <div key={idx} className="h-1.5" />;
        }

        return (
          <p key={idx} className="min-h-[1.25em]">
            {rendered}
          </p>
        );
      })}
    </div>
  );
}

export default function AskVaultAIModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedValue, setCopiedValue] = useState(null);
  const [copiedMsgId, setCopiedMsgId] = useState(null);

  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // ChatGPT-style clean conversation starter cards
  const suggestionCards = [
    { title: "Papa's ID Numbers", query: "Papa ka PAN aur Voter ID number kya hai?" },
    { title: "Utility Bill & Due Date", query: "Bijli ke bill ka CA number aur due date kya hai?" },
    { title: "Car Insurance Expiry", query: "Car insurance policy number aur expiry date kya hai?" },
    { title: "Prescription & Health", query: "Doctor prescription aur family blood groups batao" },
  ];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
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

  const handleCopy = (val, msgId = null) => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    if (msgId) {
      setCopiedMsgId(msgId);
      setTimeout(() => setCopiedMsgId(null), 2000);
    } else {
      setCopiedValue(val);
      setTimeout(() => setCopiedValue(null), 2000);
    }
    toast.success('Copied to clipboard');
  };

  const handleClearChat = () => {
    setMessages([]);
    setQuery('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  const handleSend = async (textToSend) => {
    const q = (textToSend || query).trim();
    if (!q || loading) return;

    const userMsgId = 'user_' + Date.now();
    const newMsg = { id: userMsgId, role: 'user', text: q };

    setMessages((prev) => [...prev, newMsg]);
    setQuery('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
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
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Ask Vault AI failed:', err);
      let errorDetail = err.message || 'Server connect nahi ho saka';
      if (err.message && (err.message.includes('Document not found') || err.message.includes('404'))) {
        errorDetail = 'Backend server par naya route (/api/documents/ask-ai) abhi restart/deploy ho raha hai. Kripya thodi der baad dubara try karein.';
      }
      const errorMsg = {
        id: 'err_' + Date.now(),
        role: 'assistant',
        text: `⚠️ ${errorDetail}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
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

  const handleTextareaInput = (e) => {
    setQuery(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 sm:bg-black/75 backdrop-blur-xs animate-fadeIn sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-2xl h-[100dvh] sm:h-[85vh] sm:max-h-[760px] bg-white dark:bg-[#000000] border-t sm:border border-neutral-200 dark:border-[#1F1F1F] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Minimalist Header */}
        <div className="shrink-0 h-14 border-b border-neutral-100 dark:border-[#181818] flex items-center justify-between px-4 sm:px-6 bg-white dark:bg-[#000000]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-black flex items-center justify-center">
              <Sparkles size={14} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
                  Vault AI
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleClearChat}
                title="New Chat"
                className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#161616] transition-colors cursor-pointer"
              >
                <RotateCcw size={15} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              title="Close (Esc)"
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#161616] transition-colors cursor-pointer"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 space-y-6 overscroll-contain no-scrollbar">
          {/* Empty State Welcome */}
          {messages.length === 0 && (
            <div className="py-8 sm:py-14 flex flex-col items-center text-center max-w-lg mx-auto">
              <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-black flex items-center justify-center mb-4 shadow-xs">
                <Sparkles size={18} />
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white tracking-tight">
                How can I help with your family vault?
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm">
                Poochhein kisi bhi document ka number, expiry dates, property details ya medical records.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full mt-6 text-left">
                {suggestionCards.map((card, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(card.query)}
                    className="p-3 rounded-2xl border border-neutral-200 dark:border-[#1E1E1E] bg-neutral-50/50 dark:bg-[#0D0D0D] hover:bg-neutral-100 dark:hover:bg-[#161616] hover:border-neutral-300 dark:hover:border-[#2A2A2A] transition-all cursor-pointer text-left group"
                  >
                    <div className="text-xs font-medium text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-950 dark:group-hover:text-white">
                      {card.title}
                    </div>
                    <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5 truncate">
                      "{card.query}"
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Render Messages */}
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
              >
                {/* Message Bubble / Container */}
                {isUser ? (
                  <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-br-xs px-4 py-2.5 bg-neutral-900 dark:bg-[#1E1E1E] text-white dark:text-neutral-100 text-sm font-normal break-words shadow-2xs">
                    {msg.text}
                  </div>
                ) : (
                  <div className="w-full space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-black flex items-center justify-center text-[9px] font-bold">
                        AI
                      </div>
                      <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500">
                        Vault AI
                      </span>
                    </div>

                    <div className="pl-7 pr-2">
                      <FormattedMessage text={msg.text} />

                      {/* 1-Tap Copy Action Pill */}
                      {msg.copyableValue && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.copyableValue)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-[#161616] hover:bg-neutral-200 dark:hover:bg-[#202020] border border-neutral-200 dark:border-[#262626] text-neutral-900 dark:text-neutral-100 font-mono text-xs transition-colors cursor-pointer"
                          >
                            {copiedValue === msg.copyableValue ? (
                              <>
                                <Check size={13} className="text-emerald-500" />
                                <span className="font-sans text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy size={12} className="text-neutral-500" />
                                <span>Copy: <strong>{msg.copyableValue}</strong></span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Source Document Reference */}
                      {msg.sourceDocId && (!msg.matchedDocs || msg.matchedDocs.length <= 1) && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              navigate(`/vault/documents/${msg.sourceDocId}`);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-50 dark:bg-[#111111] hover:bg-neutral-100 dark:hover:bg-[#1A1A1A] border border-neutral-200/60 dark:border-[#222222] text-[11px] font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                          >
                            <FileText size={12} className="text-neutral-400" />
                            <span>Source: {msg.sourceDocTitle || 'Document'}</span>
                            <ExternalLink size={10} className="opacity-60" />
                          </button>
                        </div>
                      )}

                      {/* Multi-Document Matches */}
                      {msg.matchedDocs && msg.matchedDocs.length > 0 && (
                        <div className="pt-3 space-y-1.5">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                            Found in {msg.matchedDocs.length} documents:
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {msg.matchedDocs.map((doc, dIdx) => (
                              <button
                                key={dIdx}
                                type="button"
                                onClick={() => {
                                  onClose();
                                  navigate(`/vault/documents/${doc.id || doc._id}`);
                                }}
                                className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-[#111111] hover:bg-neutral-100 dark:hover:bg-[#1A1A1A] border border-neutral-200/80 dark:border-[#222222] text-left transition-colors cursor-pointer group"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText size={13} className="text-neutral-400 shrink-0" />
                                  <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-950 dark:group-hover:text-white truncate">
                                    {doc.title}
                                  </span>
                                </div>
                                <ExternalLink size={11} className="text-neutral-400 shrink-0 ml-1.5 opacity-60 group-hover:opacity-100" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Message Copy Action */}
                      <div className="pt-1.5 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.text, msg.id)}
                          className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors cursor-pointer"
                        >
                          {copiedMsgId === msg.id ? (
                            <>
                              <Check size={11} className="text-emerald-500" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={11} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Calm ChatGPT 3-Dot Typing Indicator */}
          {loading && (
            <div className="w-full space-y-2 animate-fadeIn">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-black flex items-center justify-center text-[9px] font-bold">
                  AI
                </div>
                <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500">
                  Vault AI
                </span>
              </div>
              <div className="pl-7 flex items-center gap-1.5 py-1">
                <span className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-600 animate-pulse" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-600 animate-pulse" style={{ animationDelay: '200ms' }} />
                <span className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-600 animate-pulse" style={{ animationDelay: '400ms' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Pinned Bottom Input Composer (Mobile Keyboard Proof) */}
        <div className="shrink-0 border-t border-neutral-100 dark:border-[#181818] bg-white dark:bg-[#000000] p-3 sm:p-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          <div className="w-full rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-[#222222] bg-neutral-50 dark:bg-[#101010] focus-within:border-neutral-400 dark:focus-within:border-[#383838] focus-within:bg-white dark:focus-within:bg-[#080808] p-1.5 pl-3.5 sm:pl-4 flex items-end gap-2 transition-all">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Message Vault AI..."
              value={query}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="w-full bg-transparent outline-none text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 resize-none max-h-28 py-2 font-normal leading-relaxed"
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!query.trim() || loading}
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-0.5 transition-all cursor-pointer ${
                query.trim() && !loading
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-95 shadow-xs'
                  : 'bg-neutral-200 dark:bg-[#202020] text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
              }`}
            >
              <ArrowUp size={16} strokeWidth={2.5} />
            </button>
          </div>
          <div className="text-center text-[10px] text-neutral-400 dark:text-neutral-600 mt-2 font-normal select-none">
            Vault AI searches your family documents privately • 256-bit secure
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
