import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  Square,
  Sparkles,
  Lock,
  X,
  FileText,
  Shield,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Pre-configured Sandbox Family Vault Data for live interactive testing
const SAMPLE_VAULT = [
  {
    id: 'doc-1',
    title: "Papa's Aadhaar Card",
    category: 'Identity',
    member: 'Rajesh Sharma (Father)',
    number: '9418 2049 4812',
    details: 'DOB: 14 Aug 1975 • Address: Model Town, Hisar, Haryana',
    expiry: 'No Expiry (Lifetime)',
    badge: 'Verified Aadhaar'
  },
  {
    id: 'doc-2',
    title: 'Electricity Bill (DHBVN)',
    category: 'Utility Bills',
    member: 'Family Shared',
    number: 'CA-109283746',
    details: 'Amount Due: ₹2,450 • Due Date: 15 Dec 2026',
    expiry: 'Due in 19 days',
    badge: 'Pending Bill'
  },
  {
    id: 'doc-3',
    title: "Mummy's Health Insurance Policy",
    category: 'Medical & Health',
    member: 'Sunita Sharma (Mother)',
    number: 'Star Health SH-98214',
    details: 'Coverage: ₹10 Lakhs Cashless • TPA Hotline: 1800-425-2255',
    expiry: 'Valid till 30 Sep 2027',
    badge: 'Cashless Active'
  },
  {
    id: 'doc-4',
    title: 'Honda City Car RC (Registration)',
    category: 'Vehicles',
    member: 'Rajesh Sharma (Father)',
    number: 'HR 20 AB 1234',
    details: 'Chassis: MA3EYD... • Fuel: Petrol BS-VI • Fitness Valid',
    expiry: 'Valid till 28 Oct 2029',
    badge: 'Road Fitness OK'
  }
];

const SAMPLE_QUESTIONS = [
  "Mummy ki health insurance policy dikhao",
  "Papa ka Aadhaar card number kya hai?",
  "Bijli ka bill kitna aaya hai?",
  "Gadi ki RC kab tak valid hai?"
];

export default function LiveVoiceAiDemoModal({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Namaste! Main Dastawez ka AI Assistant hoon. Main "Sharma Family" ke sample vault se juda hoon. Aap mic daba kar kuch bhi pooch sakte hain ya niche diye sample sawal par tap karein!',
      sources: []
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechLang, setSpeechLang] = useState('hi-IN');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to latest response
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimTranscript, isLoading]);

  // Clean up recording & speech on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isOpen) return null;

  // Real-Time Speech-to-Text handler
  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Aapke browser me Web Speech API available nahi hai. Aap text box me type karke ya niche ke sample questions se test kar sakte hain.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = speechLang;
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecording(true);
        setRecordingSeconds(0);
        setInterimTranscript('');
        timerRef.current = setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);
      };

      recognition.onresult = (event) => {
        let finalTrans = '';
        let interimTrans = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTrans += event.results[i][0].transcript;
          } else {
            interimTrans += event.results[i][0].transcript;
          }
        }
        if (finalTrans) {
          setInputQuery((prev) => (prev ? `${prev} ${finalTrans}` : finalTrans).trim());
        }
        setInterimTranscript(interimTrans);
      };

      recognition.onerror = (event) => {
        console.warn('SpeechRecognition error:', event.error);
        stopRecording();
      };

      recognition.onend = () => {
        stopRecording();
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Error starting recognition:', err);
      stopRecording();
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setInterimTranscript('');
  };

  // Smart Sandbox Answer Engine (Matches queries accurately against sample vault)
  const processQuery = (queryText) => {
    if (!queryText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: queryText
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsLoading(true);

    setTimeout(() => {
      const lower = queryText.toLowerCase();
      let matchedDocs = [];
      let replyText = '';

      if (lower.includes('insurance') || lower.includes('policy') || lower.includes('mummy') || lower.includes('health') || lower.includes('hospital') || lower.includes('bimari')) {
        matchedDocs = [SAMPLE_VAULT[2]];
        replyText = `Mummy (Sunita Sharma) ki Health Insurance policy mil gayi hai! Star Health Comprehensive policy hai jisme ₹10 Lakhs ka Cashless cover active hai. TPA Hotline: 1800-425-2255. Policy 30 Sep 2027 tak valid hai.`;
      } else if (lower.includes('aadhaar') || lower.includes('aadhar') || lower.includes('papa') || lower.includes('identity') || lower.includes('id')) {
        matchedDocs = [SAMPLE_VAULT[0]];
        replyText = `Papa (Rajesh Sharma) ka Aadhaar Card mil gaya! Card Number: 9418 2049 4812 hai. DOB 14 Aug 1975 hai aur address Model Town, Hisar, Haryana darj hai.`;
      } else if (lower.includes('bill') || lower.includes('bijli') || lower.includes('electricity') || lower.includes('light') || lower.includes('power')) {
        matchedDocs = [SAMPLE_VAULT[1]];
        replyText = `Electricity Bill (DHBVN) ka record mil gaya! Total amount ₹2,450 hai. Payment ki aakhri taarikh 15 Dec 2026 hai (19 din baaki hain).`;
      } else if (lower.includes('rc') || lower.includes('gadi') || lower.includes('car') || lower.includes('vehicle') || lower.includes('gaadi') || lower.includes('honda')) {
        matchedDocs = [SAMPLE_VAULT[3]];
        replyText = `Honda City Car ki Registration Certificate (RC) mil gayi! Number hai: HR 20 AB 1234. Ye vehicle registration 28 Oct 2029 tak valid hai.`;
      } else {
        matchedDocs = [SAMPLE_VAULT[0], SAMPLE_VAULT[2]];
        replyText = `Aapke sawal ke anusaar Sharma Family Vault me kul 4 documents surakshit hain: Papa ka Aadhaar Card, Mummy ki Star Health Insurance, Bijli ka Bill, aur Car ki RC. Aap inme se kisi bhi document ke bare me detail pooch sakte hain!`;
      }

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: replyText,
        sources: matchedDocs
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 600);
  };

  // Text-To-Speech (AI Answer Voice Playback)
  const speakText = (msgId, text) => {
    if (!window.speechSynthesis) return;

    if (isSpeaking && speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLang === 'hi-IN' ? 'hi-IN' : 'en-IN';
    utterance.rate = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeakingMsgId(msgId);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingMsgId(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingMsgId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Dialog Shell (Deep Carbon SafePaper Style) */}
      <div className="relative w-full max-w-2xl bg-[#090A0F] border border-[#1E293B] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] z-10 overflow-hidden text-slate-100">
        
        {/* Top Header Bar */}
        <div className="px-5 py-4 border-b border-[#1E293B] bg-[#0E131F]/90 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500/20 to-emerald-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-xs">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-100">Dastawez Voice AI</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Demo Sandbox
                </span>
              </div>
              <p className="text-xs text-slate-400">Sharma Family Sample Vault connected • Hindi & English</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#161B26] hover:bg-[#1E2535] border border-[#262F40] text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Close Demo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mini Preview of Documents in this Demo Vault */}
        <div className="px-5 py-2.5 bg-[#0B0F19] border-b border-[#1A2234] flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 text-xs">
          <span className="text-[11px] font-mono text-slate-400 shrink-0 uppercase tracking-wider">Vault Files:</span>
          {SAMPLE_VAULT.map((doc) => (
            <span
              key={doc.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#121622] border border-[#1E293B] text-slate-300 text-[11px] shrink-0"
            >
              <FileText className="w-3 h-3 text-sky-400" />
              <span>{doc.title}</span>
            </span>
          ))}
        </div>

        {/* Chat Message Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-1.5`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-sky-500 text-white font-medium rounded-br-xs shadow-md'
                    : 'bg-[#121622] border border-[#1E293B] text-slate-200 rounded-bl-xs shadow-sm'
                }`}
              >
                <p>{msg.text}</p>

                {/* Source Document Card attached to answer */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-[#1E293B]/80 space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Encrypted Record Found:
                    </span>
                    {msg.sources.map((src) => (
                      <div
                        key={src.id}
                        className="p-2.5 rounded-lg bg-[#090A0F] border border-[#222C3F] flex items-start justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-sky-400" />
                            {src.title}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{src.details}</div>
                          <div className="text-[11px] font-mono text-emerald-400 mt-1">ID: {src.number}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-sky-500/10 border border-sky-500/20 text-sky-400 shrink-0">
                          {src.badge}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Text to Speech Button for Assistant responses */}
                {msg.role === 'assistant' && (
                  <div className="mt-2.5 pt-2 border-t border-[#1E293B]/60 flex items-center justify-between text-xs text-slate-400">
                    <button
                      onClick={() => speakText(msg.id, msg.text)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#161B26] hover:bg-[#1E2535] border border-[#262F40] text-sky-400 hover:text-sky-300 text-[11px] font-medium transition-all cursor-pointer"
                    >
                      {isSpeaking && speakingMsgId === msg.id ? (
                        <>
                          <Square className="w-3 h-3 fill-current text-red-400" />
                          <span className="text-red-400">Rukiye (Stop)</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3" />
                          <span>Suniye (Listen)</span>
                        </>
                      )}
                    </button>
                    <span className="text-[10px] text-slate-400">Zero-Knowledge Query</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 p-3 bg-[#121622] border border-[#1E293B] rounded-2xl w-fit text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              <span>Vault documents scan ho rahe hain...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 1-Tap Sample Questions (Quick Test Chips) */}
        <div className="px-4 py-2 bg-[#0B0F19] border-t border-[#1A2234] shrink-0">
          <div className="text-[11px] text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-sky-400" />
            <span>Ya inme se koi sawal tap karein:</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {SAMPLE_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => processQuery(q)}
                disabled={isLoading || isRecording}
                className="px-3 py-1.5 rounded-full bg-[#121622] hover:bg-[#1A2234] border border-[#1E293B] hover:border-sky-500/40 text-slate-300 hover:text-white text-xs whitespace-nowrap transition-all cursor-pointer shrink-0 disabled:opacity-50"
              >
                💬 {q}
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Voice Recording HUD Banner */}
        {isRecording && (
          <div className="px-5 py-2.5 bg-red-950/40 border-t border-red-500/30 flex items-center justify-between text-xs animate-pulse">
            <div className="flex items-center gap-2 text-red-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>Mic on hai, bolna shuru karein ({speechLang === 'hi-IN' ? 'हिन्दी' : 'English'})...</span>
              <span className="font-mono text-slate-400">0:0{recordingSeconds}</span>
            </div>
            <button
              onClick={stopRecording}
              className="px-2.5 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[11px] font-semibold border border-red-500/30"
            >
              Stop & Send
            </button>
          </div>
        )}

        {/* Live Interim Transcript */}
        {interimTranscript && (
          <div className="px-5 py-1.5 bg-[#0D121F] border-t border-sky-500/20 text-xs text-sky-300 italic">
            "{interimTranscript}..."
          </div>
        )}

        {/* Bottom Input Capsule (ChatGPT-Style SafePaper Pill) */}
        <div className="p-3 sm:p-4 bg-[#090A0F] border-t border-[#1E293B] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              processQuery(inputQuery);
            }}
            className="flex items-center gap-2 bg-[#121622] border border-[#1E293B] focus-within:border-sky-500/60 rounded-2xl p-1.5 transition-all shadow-inner"
          >
            {/* Language toggle: Hindi vs English */}
            <button
              type="button"
              onClick={() => setSpeechLang((prev) => (prev === 'hi-IN' ? 'en-IN' : 'hi-IN'))}
              title={`Switch voice language (Current: ${speechLang === 'hi-IN' ? 'Hindi' : 'English'})`}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-[#182030] hover:bg-[#202B40] text-sky-400 border border-[#243048] transition-colors shrink-0"
            >
              {speechLang === 'hi-IN' ? 'हिन्दी' : 'ENG'}
            </button>

            {/* Mic Toggle Button */}
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/20'
                  : 'bg-[#182030] hover:bg-[#202B40] text-sky-400 border border-[#243048] active:scale-95'
              }`}
              title={isRecording ? 'Stop Recording' : 'Start Voice Input'}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={isRecording ? 'Sun raha hoon...' : 'Kuch bhi poochein ya mic par tap karein...'}
              className="flex-1 bg-transparent px-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none min-w-0"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputQuery.trim() || isLoading}
              className="w-10 h-10 rounded-xl bg-white hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-white text-slate-950 flex items-center justify-center transition-all shrink-0 cursor-pointer active:scale-95 shadow-sm"
              title="Send Query"
            >
              <Send className="w-4 h-4 text-slate-900" />
            </button>
          </form>

          {/* Bottom Conversion Hook */}
          <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-2 px-1 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-center sm:text-left">
              <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Ye sample vault tha. Apne parivar ke real documents save karne ke liye:</span>
            </span>
            <Link
              to="/auth/login"
              onClick={onClose}
              className="inline-flex items-center gap-1 font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 shrink-0"
            >
              <span>Create My Free Vault (₹0)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

