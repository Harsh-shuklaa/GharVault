import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  BellOff,
  CheckCheck,
  AlertTriangle,
  KeyRound,
  ShieldAlert,
  CheckCircle2,
  Info,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export default function NotificationsDropdown({
  isOpen,
  onClose,
  notifications = [],
  unreadCount = 0,
  onMarkAllRead,
  onMarkItemRead,
  loading = false,
}) {
  const dropdownRef = useRef(null);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatTime = (dateStr) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now - d;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'WARNING':
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle size={15} />
          </div>
        );
      case 'BREAK_GLASS':
      case 'CRITICAL':
        return (
          <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center shrink-0">
            <ShieldAlert size={15} />
          </div>
        );
      case 'QUORUM':
        return (
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center shrink-0">
            <KeyRound size={15} />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-[#10B981] dark:text-[#3ECF8E] border border-emerald-500/20 flex items-center justify-center shrink-0">
            <CheckCircle2 size={15} />
          </div>
        );
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-[calc(100vw-1.5rem)] sm:w-[380px] max-w-[400px] bg-white dark:bg-[#1C1C1C] border border-slate-200 dark:border-[#262626] rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn transition-colors text-slate-900 dark:text-white"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-[#262626] bg-slate-50/50 dark:bg-[#141414]/50">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-[#10B981] dark:text-[#3ECF8E]" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#10B981]/15 text-[#10B981] dark:text-[#3ECF8E]">
              {unreadCount} new
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-neutral-400 hover:text-[#10B981] dark:hover:text-[#3ECF8E] transition-colors cursor-pointer"
          >
            <CheckCheck size={13} />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-100 dark:divide-[#262626]">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 dark:text-neutral-500">
            <span className="inline-block w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></span>
            <p>Loading alerts...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-[#262626] text-slate-400 dark:text-neutral-500 flex items-center justify-center mx-auto">
              <BellOff size={18} />
            </div>
            <p className="text-xs font-semibold text-slate-700 dark:text-neutral-300">All caught up!</p>
            <p className="text-[11px] text-slate-400 dark:text-neutral-500">
              No unread notifications in your vault.
            </p>
          </div>
        ) : (
          notifications.slice(0, 5).map((n) => (
            <div
              key={n._id}
              onClick={() => {
                if (!n.isRead && onMarkItemRead) {
                  onMarkItemRead(n._id);
                }
              }}
              className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                !n.isRead
                  ? 'bg-emerald-50/40 dark:bg-[#3ECF8E]/5 hover:bg-emerald-50/70 dark:hover:bg-[#3ECF8E]/10'
                  : 'hover:bg-slate-50 dark:hover:bg-[#202020]'
              }`}
            >
              {getIconForType(n.type)}

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1.5">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {n.title}
                  </h4>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono">
                      {formatTime(n.createdAt)}
                    </span>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#10B981] dark:bg-[#3ECF8E]" />
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-neutral-300 mt-0.5 line-clamp-2 leading-relaxed">
                  {n.message}
                </p>

                {n.link && (
                  <Link
                    to={n.link}
                    onClick={() => onClose()}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#10B981] dark:text-[#3ECF8E] hover:underline mt-1.5"
                  >
                    <span>View details</span>
                    <ArrowRight size={11} />
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-slate-100 dark:border-[#262626] bg-slate-50/60 dark:bg-[#141414]/60 text-center">
        <Link
          to="/notifications"
          onClick={() => onClose()}
          className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 dark:text-neutral-300 hover:text-[#10B981] dark:hover:text-[#3ECF8E] transition-colors py-1 w-full"
        >
          <span>Open Notifications Center</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
