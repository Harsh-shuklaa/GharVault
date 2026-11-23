import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import {
  Bell,
  BellOff,
  CheckCheck,
  AlertTriangle,
  KeyRound,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleMarkItemRead = async (id) => {
    await api.markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getIconForType = (type) => {
    switch (type) {
      case 'WARNING':
        return (
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} />
          </div>
        );
      case 'BREAK_GLASS':
      case 'CRITICAL':
        return (
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center shrink-0">
            <ShieldAlert size={18} />
          </div>
        );
      case 'QUORUM':
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center shrink-0">
            <KeyRound size={18} />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-[#10B981] dark:text-[#3ECF8E] border border-emerald-500/20 flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} />
          </div>
        );
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-[#10B981] dark:text-[#3ECF8E] border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Bell size={18} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Notifications Center
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#10B981]/15 text-[#10B981] dark:text-[#3ECF8E] border border-[#10B981]/20">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1 pl-0 sm:pl-11">
            System notices, statutory expiration reminders, and multi-sig quorum alerts.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="self-start sm:self-auto px-4 py-2 rounded-xl border border-slate-200 dark:border-[#262626] bg-white dark:bg-[#1C1C1C] hover:bg-slate-50 dark:hover:bg-[#262626] text-slate-700 dark:text-neutral-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <CheckCheck size={14} className="text-[#10B981] dark:text-[#3ECF8E]" />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl border border-slate-200/80 dark:border-[#262626] shadow-xs divide-y divide-slate-100 dark:divide-[#262626] overflow-hidden transition-colors">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-neutral-400">
            <span className="inline-block w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></span>
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#262626] text-slate-400 dark:text-neutral-500 flex items-center justify-center mx-auto">
              <BellOff size={22} />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-neutral-300">
              No notifications in vault inbox
            </p>
            <p className="text-xs text-slate-400 dark:text-neutral-500 max-w-sm mx-auto">
              You are all caught up! When documents near expiration or quorum actions are requested, alerts will appear here.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => !n.isRead && handleMarkItemRead(n._id)}
              className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-colors cursor-pointer ${
                !n.isRead
                  ? 'bg-emerald-50/40 dark:bg-[#3ECF8E]/5 hover:bg-emerald-50/70 dark:hover:bg-[#3ECF8E]/10'
                  : 'hover:bg-slate-50/60 dark:hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                {getIconForType(n.type)}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {n.title}
                    </h3>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#10B981] dark:bg-[#3ECF8E] shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-neutral-300 mt-1 leading-relaxed">
                    {n.message}
                  </p>
                  <span className="text-[11px] text-slate-400 dark:text-neutral-500 font-mono mt-1 block">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center shrink-0 flex-wrap sm:flex-nowrap">
                {n.renewalLink && (
                  <a
                    href={n.renewalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-bold text-xs transition-colors flex items-center gap-1"
                  >
                    <span>Renew Online</span>
                    <ExternalLink size={12} />
                  </a>
                )}

                {n.renewalLink && (
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                      `⚠️ *Dastavej Expiry Alert* ⏰\n\n${n.message}\n🔗 Official Renewal Link: ${n.renewalLink}\n\n_Protected by Dastavej Family Vault_`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-[#3ECF8E] border border-emerald-500/20 font-bold text-xs transition-colors flex items-center gap-1"
                    title="Send WhatsApp Reminder to family"
                  >
                    <MessageCircle size={12} />
                    <span>WhatsApp</span>
                  </a>
                )}

                {n.link && (
                  <Link
                    to={n.link}
                    className="px-4 py-1.5 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] font-bold text-xs transition-colors flex items-center gap-1 shadow-sm shadow-[#3ECF8E]/20"
                  >
                    <span>View Details</span>
                    <ArrowRight size={13} />
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
