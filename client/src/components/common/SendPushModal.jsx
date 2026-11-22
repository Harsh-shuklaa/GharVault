import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Bell,
  Send,
  Sparkles,
  Smartphone,
  Users,
  User,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { usePushNotification } from '../../context/PushNotificationContext';
import { useToast } from '../../context/ToastContext';

export default function SendPushModal({ isOpen, onClose, members = [] }) {
  const { sendPushAlert, isSubscribed, requestPushPermission, testLocalNotification } = usePushNotification();
  const { toast } = useToast();

  const [title, setTitle] = useState('🔔 Dastavej Update');
  const [body, setBody] = useState('Naye updates aur documents aa gaye hain, abhi check karein!');
  const [url, setUrl] = useState('/dashboard');
  const [targetMemberId, setTargetMemberId] = useState('ALL');
  const [isSending, setIsSending] = useState(false);

  // Quick 1-tap templates
  const templates = [
    {
      id: 'update',
      icon: '🚀',
      label: 'Update aa gaye hain check kar',
      title: '🔔 Naya Update Aa Gaya Hai!',
      body: 'Dastavej me naye updates aur documents aa gaye hain, abhi open karke check karein!',
      url: '/dashboard',
    },
    {
      id: 'kyc',
      icon: '🪪',
      label: 'Essential KYC upload reminder',
      title: '⚠️ Essential Documents Pending Hain',
      body: 'Aapke account me Aadhaar, PAN ya Health card upload hona baki hai. Kripya safe vault me upload karein.',
      url: '/vault/upload',
    },
    {
      id: 'doc',
      icon: '📄',
      label: 'Naya Document Add Hua',
      title: '📄 Naya Family Document Add Hua',
      body: 'Parivaar ke safe vault me naya document record secure kiya gaya hai.',
      url: '/vault',
    },
    {
      id: 'emergency',
      icon: '🚨',
      label: 'Emergency Alert',
      title: '🚨 Emergency Family Notice',
      body: 'Parivaar ke medical cards aur emergency emergency SOS info check karein.',
      url: '/dashboard',
    },
  ];

  const applyTemplate = (t) => {
    setTitle(t.title);
    setBody(t.body);
    setUrl(t.url);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error('Please enter both title and message.');
      return;
    }

    try {
      setIsSending(true);
      await sendPushAlert({
        title: title.trim(),
        body: body.trim(),
        url: url.trim(),
        targetMemberId,
      });
      setIsSending(false);
      onClose();
    } catch (err) {
      setIsSending(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#18181B] border-t sm:border border-slate-200 dark:border-[#27272A] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[85vh] overflow-hidden transition-all text-slate-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-neutral-600" />
        </div>

        {/* Modal Header */}
        <div className="flex items-start justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-[#262626] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#10B981]/15 text-[#10B981] dark:text-[#3ECF8E] flex items-center justify-center ring-1 ring-[#10B981]/30 shrink-0">
              <Smartphone size={22} />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <span>Send Phone Push Notification</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Direct phone screen pop-up for members who downloaded the app
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-[#262626] text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSend} className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
          {/* Device Subscription Status */}
          {!isSubscribed ? (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="font-medium text-[11px]">
                  Is phone par notifications off hain. Pehle allow karein taaki aapko bhi alert mile.
                </span>
              </div>
              <button
                type="button"
                onClick={requestPushPermission}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] shrink-0 cursor-pointer text-center"
              >
                Allow Notifications
              </button>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-[#3ECF8E] text-[11px] flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 size={14} className="shrink-0" />
                <span>Is device par Push Notifications active hain</span>
              </div>
              <button
                type="button"
                onClick={testLocalNotification}
                className="text-[10px] underline hover:opacity-80 font-semibold cursor-pointer"
              >
                Send Test Buzz 🔔
              </button>
            </div>
          )}

          {/* Tip Banner */}
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-[#3ECF8E]/10 border border-emerald-200 dark:border-[#3ECF8E]/20 text-xs text-emerald-900 dark:text-[#3ECF8E] flex items-start gap-2.5">
            <Sparkles size={16} className="shrink-0 mt-0.5 text-emerald-600 dark:text-[#3ECF8E]" />
            <p className="text-[11px] leading-relaxed">
              Ye notification member ke phone ki <strong>lock screen</strong> aur <strong>notification bar</strong> par bajega, chahe unhone app band hi kar rakhi ho.
            </p>
          </div>

          {/* 1-Tap Preset Templates */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">
              1-Tap Ready Templates
            </label>
            <div className="flex flex-wrap gap-1.5">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-[#262626] dark:hover:bg-[#333] text-slate-800 dark:text-neutral-200 border border-slate-200 dark:border-neutral-700 transition-colors cursor-pointer"
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Target Recipient Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
              Kisko Bhejna Hai? (Recipient)
            </label>
            <select
              value={targetMemberId}
              onChange={(e) => setTargetMemberId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#202022] border border-slate-200 dark:border-[#27272A] text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:border-[#10B981] dark:focus:border-[#3ECF8E]"
            >
              <option value="ALL">📢 Sabhi Family Members (Broadcast to all phones)</option>
              {members.map((m) => (
                <option key={m._id} value={m._id}>
                  👤 {m.name} ({m.relationship || 'Member'})
                </option>
              ))}
            </select>
          </div>

          {/* Notification Title Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
              Notification Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 🔔 Naya Update Aa Gaya Hai!"
              required
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#202022] border border-slate-200 dark:border-[#27272A] text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#10B981] dark:focus:border-[#3ECF8E]"
            />
          </div>

          {/* Notification Message Body */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
              Message Body *
            </label>
            <textarea
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="e.g. Update aa gaye hain, abhi check kar!"
              required
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#202022] border border-slate-200 dark:border-[#27272A] text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#10B981] dark:focus:border-[#3ECF8E] resize-none"
            />
          </div>

          {/* Live Mobile Notification Preview */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-[11px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">
              Phone Screen Preview
            </label>
            <div className="p-3 rounded-2xl bg-slate-900 text-white shadow-md border border-slate-800 space-y-1 font-sans">
              <div className="flex items-center justify-between text-[10px] text-neutral-400">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-sm bg-[#10B981] flex items-center justify-center text-[8px] font-bold text-black">
                    G
                  </div>
                  <span className="font-bold tracking-tight text-neutral-300">GHARVAULT • NOW</span>
                </div>
                <span className="text-[9px]">just now</span>
              </div>
              <div className="text-xs font-bold text-white pl-5">{title || 'Notification Title'}</div>
              <div className="text-[11px] text-neutral-300 pl-5 leading-snug">{body || 'Message text...'}</div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50 dark:bg-[#141414] border-t border-slate-100 dark:border-[#262626] flex flex-col-reverse sm:flex-row items-center sm:justify-end gap-2.5 shrink-0 pb-[max(1.25rem,env(safe-area-inset-bottom,20px))]">
          <button
            type="button"
            onClick={testLocalNotification}
            className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#262626] text-emerald-700 dark:text-[#3ECF8E] hover:bg-emerald-50 dark:hover:bg-[#3ECF8E]/10 font-bold text-xs transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
          >
            <Bell size={13} />
            <span>Test on this Phone</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#262626] text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-[#262626] font-bold text-xs transition-colors cursor-pointer text-center"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={isSending || !title.trim() || !body.trim()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] dark:bg-[#3ECF8E] dark:hover:bg-[#34B27B] text-white dark:text-[#121212] font-bold text-xs shadow-md shadow-[#10B981]/20 transition-all cursor-pointer text-center flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                <span>Sending Push Alert...</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>Send Push Alert to Phones</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
