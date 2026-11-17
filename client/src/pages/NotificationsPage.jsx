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
    <div className="max-w-[1000px] mx-auto p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Notifications Center</h1>
          <p className="text-xs text-slate-500 mt-1">
            System notices, statutory expiration reminders, and multi-sig quorum alerts.
          </p>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
        >
          Mark All Read
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No notifications in vault inbox.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`p-5 flex items-start justify-between gap-4 transition-colors ${
                !n.isRead ? 'bg-blue-50/40' : 'hover:bg-slate-50/60'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  n.type === 'WARNING' || n.type === 'BREAK_GLASS' ? 'bg-amber-100 text-amber-700' :
                  n.type === 'QUORUM' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  <span className="material-symbols-outlined text-2xl">
                    {n.type === 'WARNING' ? 'warning' :
                     n.type === 'QUORUM' ? 'key' :
                     n.type === 'BREAK_GLASS' ? 'e911_emergency' : 'check_circle'}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{n.title}</h3>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                  <span className="text-[11px] text-slate-400 font-mono mt-1 block">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {n.link && (
                <Link
                  to={n.link}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shrink-0"
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
