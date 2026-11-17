import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Files,
  IdCard,
  HeartPulse,
  Building2,
  Clock,
  Share2,
  History,
  UserCog,
  Settings,
  LogOut,
  Shield,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import GlobalSearchModal from '../common/GlobalSearchModal';
import EmergencyCardModal from '../common/EmergencyCardModal';

export default function AppLayout() {
  const { user, family, isEmergencyModalOpen, setIsEmergencyModalOpen, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();

  // Navigation Structure matching exact Supabase & GharVault specification
  const group1 = [
    { name: 'Home', path: '/dashboard', icon: LayoutDashboard, exact: true },
    { name: 'Family Members', path: '/family', icon: Users },
  ];

  const group2 = [
    { name: 'All Documents', path: '/vault', icon: Files, exactPath: true },
    { name: 'ID Cards', path: '/vault?category=ID Cards', icon: IdCard, search: 'category=ID' },
    { name: 'Medical & Health', path: '/vault?category=Medical & Health', icon: HeartPulse, search: 'Medical' },
    { name: 'Bank & Property', path: '/vault?category=Bank & Property', icon: Building2, search: 'Bank' },
  ];

  const group3 = [
    { name: 'Expiring Soon', path: '/vault?filter=expiring', icon: Clock, search: 'expiring', badge: 'Alert' },
    { name: 'Shared Links', path: '/vault?filter=shared', icon: Share2, search: 'shared' },
    { name: 'Recent Activity', path: '/activity', icon: History },
  ];

  const isItemActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path && !location.search;
    }
    if (item.exactPath) {
      return location.pathname === item.path && !location.search;
    }
    if (item.search) {
      const decoded = decodeURIComponent(location.search);
      return location.pathname === '/vault' && decoded.includes(item.search);
    }
    if (item.path === '/family') {
      return (
        location.pathname.startsWith('/family') &&
        !location.pathname.includes('/setup') &&
        !location.pathname.includes('/manage')
      );
    }
    return location.pathname === item.path;
  };

  const renderNavItem = (item) => {
    const Icon = item.icon;
    const active = isItemActive(item);

    return (
      <Link
        key={item.path}
        to={item.path}
        title={!isHovered ? item.name : undefined}
        className={`group/item flex items-center h-9 px-2.5 rounded-md transition-colors select-none ${
          active
            ? 'bg-[#262626] text-white font-medium'
            : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/[0.04] font-normal'
        }`}
      >
        <div className="w-5 h-5 flex items-center justify-center shrink-0">
          <Icon
            size={18}
            strokeWidth={1.75}
            className={`transition-colors ${active ? 'text-white' : 'text-[#9CA3AF] group-hover/item:text-[#F3F4F6]'}`}
          />
        </div>

        <span
          className={`whitespace-nowrap overflow-hidden transition-all duration-200 text-[13px] leading-tight ${
            isHovered
              ? 'opacity-100 max-w-[140px] ml-2.5'
              : 'opacity-0 max-w-0 ml-0 pointer-events-none'
          } ${active ? 'text-white font-medium' : 'text-[#9CA3AF] group-hover/item:text-[#F3F4F6] font-normal'}`}
        >
          {item.name}
        </span>

        {item.badge && (
          <span
            className={`ml-auto shrink-0 transition-all duration-200 ${
              isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
            }`}
          >
            {item.badge === 'Alert' ? (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono font-medium">
                Alert
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-medium">
                {item.badge}
              </span>
            )}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* ================= SUPABASE-STYLE COLLAPSIBLE HOVER SIDEBAR ================= */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed left-0 top-0 bottom-0 z-50 bg-[#141414] border-r border-[#262626] flex flex-col justify-between transition-all duration-200 ease-in-out select-none px-3 py-3 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${
          isHovered ? 'w-60 shadow-2xl shadow-black/80' : 'w-16'
        }`}
      >
        <div className="flex flex-col">
          {/* Header Brand */}
          <div className="flex items-center gap-2.5 px-1.5 py-1 mb-2">
            <Link to="/dashboard" className="flex items-center gap-2.5 min-w-0" title="GharVault Home">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-blue-500/20">
                <Shield size={18} strokeWidth={2} />
              </div>
              <div
                className={`flex flex-col min-w-0 transition-all duration-200 ${
                  isHovered ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0 pointer-events-none'
                }`}
              >
                <span className="font-headline font-bold text-sm tracking-tight text-white leading-none">
                  GharVault
                </span>
                <span className="text-[11px] text-[#9CA3AF] font-normal truncate mt-1">
                  {family?.name || 'Family Vault'}
                </span>
              </div>
            </Link>
          </div>

          {/* Section Divider */}
          <div className="border-t border-[#262626] my-2" />

          {/* Group 1: Main Overview */}
          <nav className="space-y-1">
            {group1.map(renderNavItem)}
          </nav>

          {/* Section Divider */}
          <div className="border-t border-[#262626] my-2" />

          {/* Group 2: Vault Categories */}
          <nav className="space-y-1">
            {group2.map(renderNavItem)}
          </nav>

          {/* Section Divider */}
          <div className="border-t border-[#262626] my-2" />

          {/* Group 3: Activity & Filters */}
          <nav className="space-y-1">
            {group3.map(renderNavItem)}
          </nav>
        </div>

        {/* Bottom Pinned Menu */}
        <div className="pt-2">
          <div className="border-t border-[#262626] my-2" />

          <div className="space-y-1">
            {/* Emergency Hospital Card Trigger */}
            <button
              type="button"
              onClick={() => setIsEmergencyModalOpen(true)}
              title={!isHovered ? 'Emergency Card' : undefined}
              className="group/item w-full flex items-center h-9 px-2.5 rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer select-none"
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0 relative">
                <HeartPulse size={18} strokeWidth={1.75} className="text-red-500" />
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              </div>
              <span
                className={`whitespace-nowrap overflow-hidden transition-all duration-200 text-[13px] leading-tight font-medium ${
                  isHovered ? 'opacity-100 max-w-[140px] ml-2.5' : 'opacity-0 max-w-0 ml-0 pointer-events-none'
                }`}
              >
                Emergency Card
              </span>
              <span
                className={`ml-auto shrink-0 transition-all duration-200 ${
                  isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                }`}
              >
                <span className="px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 text-[10px] font-mono font-bold">
                  SOS
                </span>
              </span>
            </button>

            {/* Family Management */}
            <Link
              to="/family/setup"
              title={!isHovered ? 'Family Management' : undefined}
              className={`group/item flex items-center h-9 px-2.5 rounded-md transition-colors select-none ${
                location.pathname.includes('/setup')
                  ? 'bg-[#262626] text-white font-medium'
                  : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/[0.04] font-normal'
              }`}
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <UserCog size={18} strokeWidth={1.75} />
              </div>
              <span
                className={`whitespace-nowrap overflow-hidden transition-all duration-200 text-[13px] leading-tight ${
                  isHovered ? 'opacity-100 max-w-[140px] ml-2.5' : 'opacity-0 max-w-0 ml-0 pointer-events-none'
                }`}
              >
                Family Settings
              </span>
            </Link>

            {/* Settings */}
            <Link
              to="/settings"
              title={!isHovered ? 'Settings' : undefined}
              className={`group/item flex items-center h-9 px-2.5 rounded-md transition-colors select-none ${
                location.pathname === '/settings'
                  ? 'bg-[#262626] text-white font-medium'
                  : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/[0.04] font-normal'
              }`}
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <Settings size={18} strokeWidth={1.75} />
              </div>
              <span
                className={`whitespace-nowrap overflow-hidden transition-all duration-200 text-[13px] leading-tight ${
                  isHovered ? 'opacity-100 max-w-[140px] ml-2.5' : 'opacity-0 max-w-0 ml-0 pointer-events-none'
                }`}
              >
                Vault Settings
              </span>
            </Link>

            {/* User Profile & Logout */}
            <div className="pt-1">
              <div
                className={`flex items-center h-9 px-1 rounded-md text-[#9CA3AF] hover:bg-white/[0.04] transition-colors ${
                  isHovered ? 'justify-between' : 'justify-center'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=2563EB&color=fff`}
                    alt={user?.name || 'User'}
                    className="w-6 h-6 rounded-full object-cover ring-1 ring-neutral-700 shrink-0"
                  />
                  <span
                    className={`whitespace-nowrap overflow-hidden transition-all duration-200 text-[12px] font-medium text-white truncate ${
                      isHovered ? 'opacity-100 max-w-[120px]' : 'opacity-0 max-w-0 pointer-events-none'
                    }`}
                  >
                    {user?.name || 'Family Admin'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  title="Sign Out"
                  className={`p-1 text-[#9CA3AF] hover:text-red-400 transition-colors cursor-pointer ${
                    isHovered ? 'opacity-100' : 'opacity-0 max-w-0 pointer-events-none'
                  }`}
                >
                  <LogOut size={16} strokeWidth={1.75} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ================= MAIN DASHBOARD WRAPPER (FIXED OFFSET pl-16) ================= */}
      <div className="pl-16 min-h-screen flex flex-col transition-all duration-200">
        {/* Fixed Topbar (Anchored left-16) */}
        <header className="fixed top-0 left-16 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 z-40 flex items-center justify-between px-6 sm:px-8 shadow-xs">
          {/* Breadcrumb / Family Status */}
          <div className="flex items-center gap-3">
            <span className="font-bold text-base text-slate-900 truncate max-w-[200px] sm:max-w-none">
              {family?.name || 'My Family Vault'}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Private & Encrypted</span>
            </span>
          </div>

          {/* Search Trigger */}
          <div className="flex-1 max-w-md mx-4 sm:mx-6">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full h-10 px-3.5 bg-slate-100 hover:bg-slate-200/70 rounded-xl text-xs text-slate-500 flex items-center justify-between border border-transparent transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Search size={16} className="text-slate-400" />
                <span className="truncate">Search Aadhaar, PAN, passport, insurance...</span>
              </div>
              <kbd className="hidden md:inline-block px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-mono text-[10px]">
                Ctrl + K
              </kbd>
            </button>
          </div>

          {/* Topbar Actions */}
          <div className="flex items-center gap-2.5">
            {/* Quick Emergency Card Button */}
            <button
              onClick={() => setIsEmergencyModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1.5 border border-red-200 transition-colors cursor-pointer"
            >
              <HeartPulse size={16} className="text-red-600" />
              <span className="hidden sm:inline">Emergency Card</span>
            </button>

            {/* Upload Document CTA */}
            <Link
              to="/vault/upload"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <span>+ Upload</span>
            </Link>
          </div>
        </header>

        {/* ================= PAGE CONTENT ================= */}
        <main className="w-full pt-16 bg-[#F8FAFC] flex-1">
          <Outlet />
        </main>
      </div>

      {/* Global Modals */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <EmergencyCardModal isOpen={isEmergencyModalOpen} onClose={() => setIsEmergencyModalOpen(false)} />
    </div>
  );
}
