import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

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
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  return (
    <div className="max-w-[1000px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Notifications Center</h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            System notices, statutory expiration reminders, and multi-sig quorum alerts.
          </p>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="px-4 py-2 rounded-xl border border-slate-300 dark:border-[#262626] bg-white dark:bg-[#1C1C1C] hover:bg-slate-50 dark:hover:bg-[#262626] text-slate-700 dark:text-neutral-300 text-xs font-semibold transition-colors cursor-pointer"
        >
          Mark All Read
        </button>
      </div>

      <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl border border-slate-200/80 dark:border-[#262626] shadow-xs divide-y divide-slate-100 dark:divide-[#262626] overflow-hidden transition-colors">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-neutral-400">
            No notifications in vault inbox.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`p-5 flex items-start justify-between gap-4 transition-colors ${
                !n.isRead ? 'bg-emerald-50/30 dark:bg-[#262626]/40' : 'hover:bg-slate-50/60 dark:hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  n.type === 'WARNING' || n.type === 'BREAK_GLASS' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' :
                  n.type === 'QUORUM' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400' : 'bg-emerald-100 dark:bg-[#3ECF8E]/20 text-emerald-700 dark:text-[#3ECF8E]'
                }`}>
                  <span className="material-symbols-outlined text-2xl">
                    {n.type === 'WARNING' ? 'warning' :
                     n.type === 'QUORUM' ? 'key' :
                     n.type === 'BREAK_GLASS' ? 'e911_emergency' : 'check_circle'}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{n.title}</h3>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#10B981] dark:bg-[#3ECF8E]"></span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-neutral-300 mt-1 leading-relaxed">{n.message}</p>
                  <span className="text-[11px] text-slate-400 dark:text-neutral-500 font-mono mt-1 block">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {n.link && (
                <Link
                  to={n.link}
                  className="px-3.5 py-1.5 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] font-semibold text-xs transition-colors shrink-0"
                >
                  View Details
                </Link>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
