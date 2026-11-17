import React, { useState } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import GlobalSearchModal from '../common/GlobalSearchModal';

export default function AppLayout() {
  const { user, family, notifications, unreadCount, switchUser, markAllNotificationsAsRead } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { name: 'All Documents', path: '/vault', icon: 'folder', badge: '48' },
    { name: 'Family Members', path: '/family', icon: 'group', badge: '4' },
    { name: 'Upload Document', path: '/vault/upload', icon: 'upload_file' },
    { name: 'Document Categories', path: '/categories', icon: 'category' },
    { name: 'Activity Audit', path: '/activity', icon: 'history' },
    { name: 'Permissions Matrix', path: '/permissions', icon: 'key' },
    { name: 'Settings', path: '/settings', icon: 'settings' },
  ];

  const demoUsers = [
    { role: 'Admin', name: 'Rajesh Sharma', email: 'rajesh.sharma@gmail.com', rel: 'Head of Family', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
    { role: 'Guardian', name: 'Priya Sharma', email: 'priya.sharma@gmail.com', rel: 'Spouse', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100' },
    { role: 'Member', name: 'Aarav Sharma', email: 'aarav.sharma@gmail.com', rel: 'Son', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100' },
    { role: 'Member', name: 'Sunita Sharma', email: 'sunita.sharma@gmail.com', rel: 'Grandmother', avatar: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=100' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* ================= FIXED SIDEBAR (DEEP SAPPHIRE #0F172A) ================= */}
      <aside className="fixed left-0 top-0 h-full w-[260px] bg-[#0F172A] border-r border-[#1E293B] z-50 flex flex-col justify-between text-slate-300">
        <div className="flex flex-col">
          {/* Logo & Version Header */}
          <div className="px-4 py-4 flex items-center justify-between border-b border-[#1E293B]">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <span className="material-symbols-outlined text-xl">shield</span>
              </div>
              <span className="font-headline font-bold text-lg tracking-tight text-white">GharVault</span>
            </Link>
            <span className="font-mono text-[11px] uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              v2.4
            </span>
          </div>

          {/* Family Workspace Selector */}
          <div className="px-4 pt-4 pb-2">
            <Link
              to="/settings"
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#1E293B] hover:bg-slate-800 transition-colors text-left"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-white truncate">
                  {family?.name || 'Sharma Family Ghar'}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  4 active members
                </span>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-lg">unfold_more</span>
            </Link>
          </div>

          {/* Main Navigation Links */}
          <nav className="px-2 py-2 space-y-1">
            {navLinks.map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-xl">{item.icon}</span>
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-blue-500/40 text-white'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Widgets */}
        <div className="p-3 space-y-3 border-t border-[#1E293B]">
          {/* Emergency Break-Glass Fast Action Widget */}
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-red-400 text-lg">e911_emergency</span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-red-200">Break-Glass</span>
                <span className="font-mono text-[10px] text-red-300/80">48h Protocol Ready</span>
              </div>
            </div>
            <Link
              to="/break-glass"
              className="px-2.5 py-1 rounded-md bg-red-800/80 hover:bg-red-700 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              Arm
            </Link>
          </div>

          {/* Active Profile & Fast Perspective Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-[#1E293B]/80 hover:bg-[#1E293B] transition-colors text-left"
              type="button"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  <img
                    alt={user?.name || 'Profile'}
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700"
                    src={user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                  />
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#1E293B]"></span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-white font-semibold truncate">
                    {user?.name || 'Rajesh Sharma'}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    {user?.relationship || 'Head of Family'} • <span className="text-blue-400 font-semibold">{user?.role || 'Admin'}</span>
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-lg">swap_horiz</span>
            </button>

            {/* Switch User Popover */}
            {showUserMenu && (
              <div className="absolute bottom-14 left-0 w-full bg-[#1E293B] border border-slate-700 rounded-xl shadow-2xl p-2 z-50 space-y-1">
                <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Switch Member View
                </div>
                {demoUsers.map((u) => (
                  <button
                    key={u.email}
                    onClick={() => {
                      switchUser(u.email);
                      setShowUserMenu(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                      user?.email === u.email
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <img src={u.avatar} alt={u.name} className="w-5 h-5 rounded-full object-cover" />
                    <span className="truncate">{u.name} ({u.role})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ================= FIXED TOPBAR ================= */}
      <div className="pl-[260px]">
        <header className="fixed top-0 left-[260px] right-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 z-40 flex items-center justify-between px-6 shadow-xs">
          {/* Breadcrumb & Encryption Pill */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="material-symbols-outlined text-base text-slate-400">shield</span>
              <span>Vault</span>
              <span className="material-symbols-outlined text-sm text-slate-300">chevron_right</span>
              <span className="text-slate-900 font-semibold">{family?.name || 'Sharma Ghar'}</span>
            </div>
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>256-bit AES End-to-End Encrypted</span>
            </div>
          </div>

          {/* Omnibox Search Bar */}
          <div className="flex-1 max-w-lg mx-6">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full h-10 px-3 bg-slate-100 hover:bg-slate-100/80 rounded-xl text-xs text-slate-500 flex items-center justify-between border border-transparent hover:border-slate-300 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400 text-lg">search</span>
                <span className="truncate">Search Aadhaar, PAN, insurance, property records...</span>
              </div>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-slate-200 border border-slate-300 font-mono text-[10px] text-slate-600">
                Ctrl + K
              </kbd>
            </button>
          </div>

          {/* Action CTAs & Notifications */}
          <div className="flex items-center gap-2.5">
            <Link
              to="/vault/upload"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-xs"
            >
              <span className="material-symbols-outlined text-base leading-none">add</span>
              <span>Upload Document</span>
            </Link>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                title="Notifications"
              >
                <span className="material-symbols-outlined text-xl">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-600 text-white font-mono text-[10px] flex items-center justify-center font-bold animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">Notifications</span>
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">No new notifications</div>
                    ) : (
                      notifications.map((n) => (
                        <Link
                          key={n._id}
                          to={n.link || '/notifications'}
                          onClick={() => setShowNotifications(false)}
                          className={`p-3 block hover:bg-slate-50 transition-colors ${!n.isRead ? 'bg-blue-50/40' : ''}`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className={`material-symbols-outlined text-base mt-0.5 ${
                              n.type === 'WARNING' || n.type === 'BREAK_GLASS' ? 'text-amber-600' :
                              n.type === 'QUORUM' ? 'text-blue-600' : 'text-emerald-600'
                            }`}>
                              {n.type === 'WARNING' ? 'warning' :
                               n.type === 'QUORUM' ? 'key' :
                               n.type === 'BREAK_GLASS' ? 'e911_emergency' : 'check_circle'}
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-slate-900">{n.title}</div>
                              <div className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{n.message}</div>
                            </div>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                  <div className="px-4 pt-2 border-t border-slate-100 text-center">
                    <Link
                      to="/notifications"
                      onClick={() => setShowNotifications(false)}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      View All Notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/settings"
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              title="Settings"
            >
              <span className="material-symbols-outlined text-xl">settings</span>
            </Link>
          </div>
        </header>

        {/* ================= MAIN CONTENT OUTLET ================= */}
        <main className="w-full pt-16 bg-[#F8FAFC] min-h-screen">
          <Outlet />
        </main>
      </div>

      {/* Global Search Omnibox Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
