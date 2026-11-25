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
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
  Globe,
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
    <div className="space-y-1.5 text-[14px] sm:text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ');
        const content = isBullet ? trimmed.replace(/^[-*•]\s+/, '') : line;
        const rendered = parseFormattedSegments(content);

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-2 ml-1 text-[14px] sm:text-sm">
              <span className="text-emerald-500 select-none mt-1 text-[9px]">•</span>
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

  // Audio / Speech Recognition states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceLang, setVoiceLang] = useState('hi-IN'); // 'hi-IN' (Hindi/Hinglish) | 'en-IN' (Indian English)
  const [speechInterim, setSpeechInterim] = useState('');
  const [speakingMsgId, setSpeakingMsgId] = useState(null);

  // Mobile Visual Viewport tracking for seamless virtual keyboard positioning
  const [viewportBottomOffset, setViewportBottomOffset] = useState(0);

  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // ChatGPT-style clean prompt cards
  const suggestionCards = [
    { title: "Papa's ID Numbers", query: "Papa ka PAN aur Voter ID number kya hai?" },
    { title: "Bijli Bill & CA No", query: "Bijli ke bill ka CA number aur due date kya hai?" },
    { title: "Car Insurance Expiry", query: "Car insurance policy number aur expiry date kya hai?" },
    { title: "Family Medical Vitals", query: "Doctor prescription aur family blood groups batao" },
  ];

  // Mobile keyboard visualViewport resize handler
  useEffect(() => {
    if (!isOpen) return;

    const handleViewportChange = () => {
      if (window.visualViewport) {
        const offset = Math.max(0, window.innerHeight - window.visualViewport.height);
        setViewportBottomOffset(offset);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 120);
    } else {
      document.body.style.overflow = '';
      stopSpeechRecognition();
      stopTextToSpeech();
    }
    return () => {
      document.body.style.overflow = '';
      stopSpeechRecognition();
      stopTextToSpeech();
    };
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, speechInterim]);

  // Voice recording timer
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(recordingTimerRef.current);
    }
    return () => clearInterval(recordingTimerRef.current);
  }, [isRecording]);

  // Speech Recognition (Web Speech API) Setup
  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback to MediaRecorder audio recording for Gemini backend transcription
      startMediaRecorderFallback();
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = voiceLang;

      recognition.onstart = () => {
        setIsRecording(true);
        setSpeechInterim('');
      };

      recognition.onresult = (event) => {
        let currentInterim = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            currentInterim += transcript;
          }
        }

        if (finalTranscript) {
          setQuery((prev) => (prev ? prev + ' ' : '') + finalTranscript.trim());
          setSpeechInterim('');
        } else {
          setSpeechInterim(currentInterim);
        }
      };

      recognition.onerror = (e) => {
        console.warn('[Speech Recognition Warning]:', e.error);
        if (e.error !== 'no-speech') {
          toast.error(`Mic access error: ${e.error}. Type or check mic permissions.`);
        }
        stopSpeechRecognition();
      };

      recognition.onend = () => {
        setIsRecording(false);
        setSpeechInterim('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('SpeechRecognition start failed, trying MediaRecorder:', err);
      startMediaRecorderFallback();
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    setIsRecording(false);
    setSpeechInterim('');
  };

  // MediaRecorder Fallback (Audio Upload to Backend Gemini Flash)
  const startMediaRecorderFallback = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size > 1000) {
          await handleSendAudioClip(audioBlob);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      toast.info('🎙️ Recording voice... Bolna shuru karein');
    } catch (err) {
      toast.error('Microphone permission denied or not available. Please allow mic in browser settings.');
      setIsRecording(false);
    }
  };

  const handleSendAudioClip = async (audioBlob) => {
    const userMsgId = 'user_' + Date.now();
    const newMsg = { id: userMsgId, role: 'user', text: '🎙️ [Voice Audio Query...]' };
    setMessages((prev) => [...prev, newMsg]);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice_query.webm');

      const res = await api.askVaultAIAudio(formData);
      const data = res?.data || {};
      const transcribed = res?.transcribedQuery;

      // Update user message with transcribed text if available
      if (transcribed) {
        setMessages((prev) =>
          prev.map((m) => (m.id === userMsgId ? { ...m, text: `🎙️ "${transcribed}"` } : m))
        );
      }

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
      console.error('Audio query failed:', err);
      setMessages((prev) => [
        ...prev,
        { id: 'err_' + Date.now(), role: 'assistant', text: `⚠️ Voice search failed: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVoice = () => {
    if (isRecording) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  };

  // Text-To-Speech (TTS) for AI Responses (Suno / Listen)
  const handleSpeakMessage = (text, msgId) => {
    if (!window.speechSynthesis) {
      toast.info('Text-to-speech is not supported on this device.');
      return;
    }

    if (speakingMsgId === msgId) {
      stopTextToSpeech();
      return;
    }

    window.speechSynthesis.cancel();
    // Strip markdown formatting for natural voice
    const cleanSpeechText = text
      .replace(/\*\*|`|#|\*|_/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.lang = voiceLang;
    utterance.rate = 1.0;

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const stopTextToSpeech = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgId(null);
  };

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
    stopSpeechRecognition();
    stopTextToSpeech();
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  const handleSend = async (textToSend) => {
    const q = (textToSend || query).trim();
    if (!q || loading) return;

    stopSpeechRecognition();
    stopTextToSpeech();

    const userMsgId = 'user_' + Date.now();
    const newMsg = { id: userMsgId, role: 'user', text: q };

    setMessages((prev) => [...prev, newMsg]);
    setQuery('');
    setSpeechInterim('');
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
        errorDetail = 'Backend server par naya route (/api/documents/ask-ai) abhi restart ho raha hai.';
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

  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 sm:bg-black/80 backdrop-blur-sm animate-fadeIn sm:p-4"
      onClick={onClose}
    >
      <div
        style={{
          transform: viewportBottomOffset > 0 ? `translateY(-${viewportBottomOffset}px)` : undefined,
          transition: 'transform 0.15s ease-out',
        }}
        className="w-full sm:max-w-2xl h-[100dvh] sm:h-[86vh] sm:max-h-[780px] bg-white dark:bg-[#0A0A0A] border-t sm:border border-neutral-200 dark:border-[#222222] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= TOP MODERN CHATGPT HEADER ================= */}
        <div className="shrink-0 h-14 border-b border-neutral-100 dark:border-[#1C1C1C] flex items-center justify-between px-4 sm:px-6 bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-neutral-900 to-neutral-700 dark:from-white dark:to-neutral-300 text-white dark:text-black flex items-center justify-center shadow-xs">
              <Sparkles size={15} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                  Vault AI • चैट असिस्टेंट
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Language toggle for Voice Recognition (Hindi <-> English) */}
            <button
              type="button"
              onClick={() => {
                const next = voiceLang === 'hi-IN' ? 'en-IN' : 'hi-IN';
                setVoiceLang(next);
                toast.info(`Voice input set to: ${next === 'hi-IN' ? '🇮🇳 Hindi / Hinglish' : '🌐 Indian English'}`);
              }}
              title="Voice Language (Tap to switch Hindi / English)"
              className="px-2 py-1 rounded-xl text-[11px] font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-[#1C1C1C] border border-neutral-200 dark:border-[#262626] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Globe size={11} className="text-emerald-500" />
              <span>{voiceLang === 'hi-IN' ? 'हिन्दी' : 'English'}</span>
            </button>

            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleClearChat}
                title="New Chat / नया चैट"
                className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#1C1C1C] transition-colors cursor-pointer"
              >
                <RotateCcw size={15} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              title="Close (Esc)"
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#1C1C1C] transition-colors cursor-pointer"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* ================= MESSAGES SCROLL CANVAS ================= */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 sm:px-6 space-y-5 overscroll-contain no-scrollbar">
          {/* Empty State / Welcome Screen */}
          {messages.length === 0 && (
            <div className="py-6 sm:py-12 flex flex-col items-center text-center max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-[#3ECF8E] text-white dark:text-[#0A0A0A] flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/20">
                <Sparkles size={24} />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
                Aapke Parivaar Ka AI Assistant
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm leading-relaxed">
                Aap bol kar ya likh kar apne kisi bhi dastavej (Aadhaar, PAN, Mediclaim, Bill) ki jankari turant nikaal sakte hain.
              </p>

              {/* Prompt Suggestion Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full mt-6 text-left">
                {suggestionCards.map((card, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSend(card.query)}
                    className="p-3 rounded-2xl border border-neutral-200 dark:border-[#222222] bg-neutral-50/70 hover:bg-neutral-100/80 dark:bg-[#121212] dark:hover:bg-[#181818] transition-all text-left group cursor-pointer active:scale-98"
                  >
                    <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-emerald-600 dark:group-hover:text-[#3ECF8E] transition-colors flex items-center justify-between">
                      <span>{card.title}</span>
                      <ArrowUp size={12} className="rotate-45 opacity-40 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 truncate">
                      "{card.query}"
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Conversation History */}
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex w-full animate-fadeIn ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {isUser ? (
                  <div className="max-w-[85%] sm:max-w-[75%] rounded-3xl rounded-br-sm px-4 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-black shadow-xs">
                    <p className="text-[14px] sm:text-sm leading-relaxed whitespace-pre-wrap font-medium">
                      {msg.text}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 sm:gap-3 max-w-[95%] sm:max-w-[88%]">
                    <div className="w-7 h-7 rounded-full bg-emerald-500 text-white dark:text-black flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-xs">
                      <Sparkles size={13} />
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="rounded-3xl rounded-tl-sm px-4 py-3 bg-neutral-100 dark:bg-[#161616] border border-neutral-200/70 dark:border-[#222222] shadow-xs">
                        <FormattedMessage text={msg.text} />
                      </div>

                      {/* 1-Tap Copyable Value Chip */}
                      {msg.copyableValue && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-[#3ECF8E]/10 border border-emerald-200 dark:border-[#3ECF8E]/25 text-emerald-900 dark:text-[#3ECF8E] text-xs font-mono font-bold">
                          <span>{msg.copyableValue}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.copyableValue)}
                            className="p-1 rounded-md hover:bg-emerald-100 dark:hover:bg-[#3ECF8E]/20 transition-colors cursor-pointer"
                            title="Copy Value"
                          >
                            {copiedValue === msg.copyableValue ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                        </div>
                      )}

                      {/* Matched Documents Source Chips */}
                      {msg.matchedDocs && msg.matchedDocs.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="text-[10px] uppercase font-bold text-neutral-400">Source:</span>
                          {msg.matchedDocs.map((doc, idx) => (
                            <button
                              key={doc.id || idx}
                              type="button"
                              onClick={() => {
                                onClose();
                                navigate(`/vault/documents/${doc.id}`);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-[#1E1E1E] text-neutral-700 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-[#3ECF8E] border border-neutral-200 dark:border-[#2A2A2A] transition-colors cursor-pointer"
                            >
                              <FileText size={11} className="text-emerald-500" />
                              <span className="truncate max-w-[160px]">{doc.title}</span>
                              <ExternalLink size={10} className="opacity-60" />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Message Actions: Copy + Text-To-Speech (Listen / Suniye) */}
                      <div className="flex items-center gap-3 pt-0.5 pl-1">
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.text, msg.id)}
                          className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors cursor-pointer"
                        >
                          {copiedMsgId === msg.id ? (
                            <>
                              <Check size={12} className="text-emerald-500" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>Copy text</span>
                            </>
                          )}
                        </button>

                        {/* Audio Read-Aloud (Text to Speech) */}
                        <button
                          type="button"
                          onClick={() => handleSpeakMessage(msg.text, msg.id)}
                          className={`inline-flex items-center gap-1 text-[11px] transition-colors cursor-pointer ${
                            speakingMsgId === msg.id
                              ? 'text-emerald-600 dark:text-[#3ECF8E] font-bold'
                              : 'text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300'
                          }`}
                        >
                          {speakingMsgId === msg.id ? (
                            <>
                              <Square size={11} className="fill-current text-red-500" />
                              <span className="text-red-500">Stop speaking</span>
                            </>
                          ) : (
                            <>
                              <Volume2 size={12} />
                              <span>Suniye (Listen)</span>
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

          {/* Typing Indicator */}
          {loading && (
            <div className="w-full space-y-2 animate-fadeIn pl-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-full bg-emerald-500 text-white dark:text-black flex items-center justify-center text-[9px] font-bold">
                  AI
                </div>
                <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500">
                  Dastavej AI searching vault...
                </span>
              </div>
              <div className="pl-7 flex items-center gap-1.5 py-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" style={{ animationDelay: '200ms' }} />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" style={{ animationDelay: '400ms' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ================= CHATGPT-GRADE INPUT CAPSULE (MOBILE KEYBOARD OPTIMIZED) ================= */}
        <div className="shrink-0 border-t border-neutral-100 dark:border-[#1A1A1A] bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-md p-2.5 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {/* Active Voice Waveform HUD Banner */}
          {isRecording && (
            <div className="mb-2.5 p-2.5 rounded-2xl bg-gradient-to-r from-red-500/10 via-emerald-500/10 to-teal-500/10 border border-emerald-500/30 flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
                <div className="flex items-center gap-1 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  <span>Listening... {formatTimer(recordingSeconds)}</span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-[#3ECF8E] ml-1">
                    ({voiceLang === 'hi-IN' ? 'हिन्दी' : 'English'})
                  </span>
                </div>
                {speechInterim && (
                  <span className="text-xs text-neutral-500 truncate max-w-[140px] italic">
                    "{speechInterim}"
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={stopSpeechRecognition}
                  className="px-2.5 py-1 rounded-xl bg-neutral-200 dark:bg-[#202020] text-neutral-700 dark:text-neutral-300 text-xs font-bold hover:bg-neutral-300 dark:hover:bg-[#2A2A2A] transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* ChatGPT Capsule Input Pill */}
          <div className="w-full rounded-[26px] border border-neutral-300/80 dark:border-[#2C2C2E] bg-neutral-50/90 dark:bg-[#141414] focus-within:border-emerald-500 dark:focus-within:border-[#3ECF8E] focus-within:bg-white dark:focus-within:bg-[#0D0D0D] focus-within:shadow-lg focus-within:shadow-emerald-500/5 p-1.5 pl-3 sm:pl-4 flex items-end gap-1.5 transition-all">
            {/* Auto-Expanding Textarea (16px font to prevent mobile zoom) */}
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder={isRecording ? "Listening to your voice... bol rahe hain..." : "Message Vault AI... (bol kar ya likh kar puchiye)"}
              value={query}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="w-full bg-transparent outline-none text-[16px] sm:text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 resize-none max-h-28 py-2 font-normal leading-relaxed"
            />

            {/* Right Action Buttons: Voice Mic + Send Arrow */}
            <div className="flex items-center gap-1 shrink-0 pb-0.5">
              {/* Mic / Voice Recording Button */}
              <button
                type="button"
                onClick={handleToggleVoice}
                title={isRecording ? "Stop Listening" : "Speak your query (Hindi ya English me bole)"}
                className={`w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30'
                    : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-[#222]'
                }`}
              >
                {isRecording ? <MicOff size={16} /> : <Mic size={17} />}
              </button>

              {/* Send Button (Always minimum 38px for touch ergonomics on phones) */}
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={(!query.trim() && !isRecording) || loading}
                title="Send Message"
                className={`w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  query.trim() && !loading
                    ? 'bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] hover:opacity-90 active:scale-95 shadow-md shadow-[#3ECF8E]/25'
                    : 'bg-neutral-200 dark:bg-[#202020] text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                }`}
              >
                <ArrowUp size={17} strokeWidth={2.6} />
              </button>
            </div>
          </div>

          <div className="text-center text-[10px] text-neutral-400 dark:text-neutral-500 mt-1.5 font-normal select-none truncate">
            Vault AI answers from your encrypted family documents • Tap mic to speak
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
