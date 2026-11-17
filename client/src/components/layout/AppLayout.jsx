import React, { useState } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import GlobalSearchModal from '../common/GlobalSearchModal';
import EmergencyCardModal from '../common/EmergencyCardModal';

export default function AppLayout() {
  const { user, family, isEmergencyModalOpen, setIsEmergencyModalOpen, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();

  // Simple 4-Tab Core Navigation (Clutter-free and friendly for elders)
  const navTabs = [
    { name: 'Home', path: '/dashboard', icon: 'home' },
    { name: 'Family Members', path: '/family', icon: 'group' },
    { name: 'All Documents', path: '/vault', icon: 'folder' },
    { name: 'Settings', path: '/settings', icon: 'settings' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* ================= FIXED SIDEBAR (DEEP SAPPHIRE #0F172A) ================= */}
      <aside className="fixed left-0 top-0 h-full w-[260px] bg-[#0F172A] border-r border-[#1E293B] z-50 flex flex-col justify-between text-slate-300">
        <div className="flex flex-col">
          {/* Logo */}
          <div className="px-5 py-5 flex items-center justify-between border-b border-[#1E293B]">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <span className="material-symbols-outlined text-2xl">shield</span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline font-bold text-xl tracking-tight text-white">GharVault</span>
                <span className="text-[10px] text-slate-400 font-medium">One Family. One Space.</span>
              </div>
            </Link>
          </div>

          {/* Family Workspace Pill */}
          <div className="px-4 pt-4 pb-2">
            <div className="px-3 py-2.5 rounded-xl bg-[#1E293B] border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Your Family Vault</span>
              <span className="text-sm font-bold text-white truncate block mt-0.5">
                {family?.name || 'My Family Vault'}
              </span>
            </div>
          </div>

          {/* Core 4-Tab Navigation */}
          <nav className="px-3 py-3 space-y-1.5">
            {navTabs.map((tab) => {
              const isActive = location.pathname === tab.path ||
                (tab.path !== '/dashboard' && location.pathname.startsWith(tab.path));

              return (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-2xl">{tab.icon}</span>
                  <span className="text-base">{tab.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom: Emergency Card Button & User Profile */}
        <div className="p-4 space-y-3 border-t border-[#1E293B]">
          {/* Prominent Red Emergency Medical Card Button */}
          <button
            type="button"
            onClick={() => setIsEmergencyModalOpen(true)}
            className="w-full p-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-between transition-all shadow-md shadow-red-900/30 cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">
                local_hospital
              </span>
              <div className="text-left">
                <div className="text-sm font-bold leading-tight">Emergency Card</div>
                <div className="text-[10px] text-red-200">Blood Groups & Insurance</div>
              </div>
            </div>
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>

          {/* User Profile Footer */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#1E293B]/60 text-left">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=2563EB&color=fff`}
                alt={user?.name || 'User'}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700 shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-white font-bold truncate">
                  {user?.name || 'Family Admin'}
                </span>
                <span className="text-[11px] text-slate-400 truncate">
                  {user?.relationship || 'Head of Family'}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="text-slate-400 hover:text-red-400 p-1 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ================= FIXED TOPBAR ================= */}
      <div className="pl-[260px]">
        <header className="fixed top-0 left-[260px] right-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 z-40 flex items-center justify-between px-8 shadow-xs">
          {/* Breadcrumb / Status */}
          <div className="flex items-center gap-3">
            <span className="font-bold text-base text-slate-900">
              {family?.name || 'My Family Vault'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Private & Encrypted</span>
            </span>
          </div>

          {/* Search Trigger */}
          <div className="flex-1 max-w-md mx-6">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full h-10 px-3.5 bg-slate-100 hover:bg-slate-200/70 rounded-xl text-xs text-slate-500 flex items-center justify-between border border-transparent transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400 text-lg">search</span>
                <span className="truncate">Search Aadhaar, PAN, passport, insurance...</span>
              </div>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-mono text-[10px]">
                Ctrl + K
              </kbd>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Quick Emergency Card Button in Topbar */}
            <button
              onClick={() => setIsEmergencyModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1.5 border border-red-200 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">local_hospital</span>
              <span className="hidden sm:inline">Emergency Card</span>
            </button>

            {/* Quick Upload Button */}
            <Link
              to="/vault/upload"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>Upload Document</span>
            </Link>
          </div>
        </header>

        {/* ================= MAIN CONTENT OUTLET ================= */}
        <main className="w-full pt-16 bg-[#F8FAFC] min-h-screen">
          <Outlet />
        </main>
      </div>

      {/* Global Modals */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <EmergencyCardModal isOpen={isEmergencyModalOpen} onClose={() => setIsEmergencyModalOpen(false)} />
    </div>
  );
}
