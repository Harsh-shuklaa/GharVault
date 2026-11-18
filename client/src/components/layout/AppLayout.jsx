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
  Sun,
  Moon,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import GlobalSearchModal from '../common/GlobalSearchModal';
import EmergencyCardModal from '../common/EmergencyCardModal';

export default function AppLayout() {
  const { user, family, isEmergencyModalOpen, setIsEmergencyModalOpen, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();

  // Navigation Groups matching exact Supabase & GharVault specifications
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
        className={`group/item flex items-center h-9 px-2.5 rounded-md transition-all select-none ${
          active
            ? 'bg-[#262626] text-white font-medium shadow-xs'
            : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/[0.04] font-normal'
        }`}
      >
        <div className="w-5 h-5 flex items-center justify-center shrink-0">
          <Icon
            size={18}
            strokeWidth={1.75}
            className={`transition-colors ${active ? 'text-[#3ECF8E]' : 'text-[#9CA3AF] group-hover/item:text-[#F3F4F6]'}`}
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
              <span className="px-1.5 py-0.5 rounded-full bg-[#3ECF8E]/10 text-[#3ECF8E] border border-[#3ECF8E]/20 text-[10px] font-mono font-medium">
                {item.badge}
              </span>
            )}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#121212] text-slate-900 dark:text-[#EDEDED] font-sans transition-colors duration-200">
      {/* ================= DESKTOP COLLAPSIBLE HOVER SIDEBAR (SUPABASE OBSIDIAN) ================= */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`hidden md:flex fixed left-0 top-0 bottom-0 z-50 bg-[#141414] border-r border-[#262626] flex-col justify-between transition-all duration-200 ease-in-out select-none px-3 py-3 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${
          isHovered ? 'w-60 shadow-2xl shadow-black/80' : 'w-16'
        }`}
      >
        <div className="flex flex-col">
          {/* Header Brand */}
          <div className="flex items-center gap-2.5 px-1.5 py-1 mb-2">
            <Link to="/dashboard" className="flex items-center gap-2.5 min-w-0" title="GharVault Home">
              <div className="w-8 h-8 rounded-lg bg-[#3ECF8E] flex items-center justify-center text-[#121212] shrink-0 shadow-sm shadow-[#3ECF8E]/20 font-bold">
                <Shield size={18} strokeWidth={2.2} />
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
              title={!isHovered ? 'Family Settings' : undefined}
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
                Settings
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
                    src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=3ECF8E&color=121212`}
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

      {/* ================= MAIN CONTENT WRAPPER ================= */}
      <div className="md:pl-16 min-h-screen flex flex-col pb-20 md:pb-0 transition-all duration-200">
        {/* Fixed Topbar */}
        <header className="fixed top-0 left-0 md:left-16 right-0 h-16 bg-white/95 dark:bg-[#141414]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#262626] z-40 flex items-center justify-between px-4 sm:px-8 shadow-xs transition-colors duration-200">
          {/* Left: Mobile Brand / Desktop Breadcrumb */}
          <div className="flex items-center gap-2.5">
            {/* Mobile Brand Shield */}
            <div className="md:hidden w-8 h-8 rounded-lg bg-[#3ECF8E] flex items-center justify-center text-[#121212] font-bold">
              <Shield size={17} strokeWidth={2.2} />
            </div>

            <div>
              <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate block max-w-[150px] sm:max-w-none">
                {family?.name || 'My Family Vault'}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-[#3ECF8E] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E] animate-pulse"></span>
                <span>Private & Encrypted</span>
              </span>
            </div>
          </div>

          {/* Search Trigger */}
          <div className="flex-1 max-w-md mx-2 sm:mx-6">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full h-9 sm:h-10 px-3 bg-slate-100 dark:bg-[#1C1C1C] hover:bg-slate-200/70 dark:hover:bg-[#262626] rounded-xl text-xs text-slate-500 dark:text-neutral-400 flex items-center justify-between border border-transparent dark:border-[#262626] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Search size={15} className="text-slate-400 dark:text-neutral-500 shrink-0" />
                <span className="truncate text-[11px] sm:text-xs">Search IDs, insurance, deed...</span>
              </div>
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#262626] text-slate-600 dark:text-neutral-400 font-mono text-[10px]">
                Ctrl + K
              </kbd>
            </button>
          </div>

          {/* Topbar Actions: Theme Toggle + Emergency Card + Upload */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Dark / Light Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-[#262626] bg-slate-50 dark:bg-[#1C1C1C] hover:bg-slate-100 dark:hover:bg-[#262626] text-slate-600 dark:text-[#3ECF8E] flex items-center justify-center transition-all cursor-pointer"
            >
              {isDark ? <Sun size={17} strokeWidth={2} /> : <Moon size={17} strokeWidth={2} />}
            </button>

            {/* Quick Emergency Card Button in Topbar */}
            <button
              type="button"
              onClick={() => setIsEmergencyModalOpen(true)}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-700 dark:text-red-400 text-xs font-bold flex items-center gap-1.5 border border-red-200 dark:border-red-500/20 transition-colors cursor-pointer"
            >
              <HeartPulse size={15} className="text-red-600 dark:text-red-400 shrink-0" />
              <span className="hidden sm:inline">Emergency Card</span>
            </button>

            {/* Upload Document CTA (Desktop) */}
            <Link
              to="/vault/upload"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Upload</span>
            </Link>
          </div>
        </header>

        {/* ================= PAGE OUTLET ================= */}
        <main className="w-full pt-16 flex-1">
          <Outlet />
        </main>
      </div>

      {/* ================= MOBILE BOTTOM NAVIGATION BAR (< 768px) ================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-[#141414]/95 backdrop-blur-md border-t border-slate-200 dark:border-[#262626] z-50 flex items-center justify-around px-2 shadow-lg">
        {/* Home */}
        <Link
          to="/dashboard"
          className={`flex flex-col items-center justify-center w-14 py-1 transition-colors ${
            location.pathname === '/dashboard'
              ? 'text-[#10B981] dark:text-[#3ECF8E]'
              : 'text-slate-400 dark:text-neutral-400'
          }`}
        >
          <LayoutDashboard size={20} strokeWidth={location.pathname === '/dashboard' ? 2.2 : 1.75} />
          <span className="text-[10px] font-medium mt-1">Home</span>
        </Link>

        {/* All Documents / Vault */}
        <Link
          to="/vault"
          className={`flex flex-col items-center justify-center w-14 py-1 transition-colors ${
            location.pathname === '/vault'
              ? 'text-[#10B981] dark:text-[#3ECF8E]'
              : 'text-slate-400 dark:text-neutral-400'
          }`}
        >
          <Files size={20} strokeWidth={location.pathname === '/vault' ? 2.2 : 1.75} />
          <span className="text-[10px] font-medium mt-1">Vault</span>
        </Link>

        {/* Central Floating Action Button (Supabase Green +) */}
        <div className="relative -top-4">
          <Link
            to="/vault/upload"
            className="w-13 h-13 w-[52px] h-[52px] rounded-full bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] flex items-center justify-center shadow-lg shadow-[#3ECF8E]/30 active:scale-95 transition-all"
            title="Upload Document"
          >
            <Plus size={26} strokeWidth={2.8} />
          </Link>
        </div>

        {/* Family Directory */}
        <Link
          to="/family"
          className={`flex flex-col items-center justify-center w-14 py-1 transition-colors ${
            location.pathname.startsWith('/family')
              ? 'text-[#10B981] dark:text-[#3ECF8E]'
              : 'text-slate-400 dark:text-neutral-400'
          }`}
        >
          <Users size={20} strokeWidth={location.pathname.startsWith('/family') ? 2.2 : 1.75} />
          <span className="text-[10px] font-medium mt-1">Family</span>
        </Link>

        {/* Settings */}
        <Link
          to="/settings"
          className={`flex flex-col items-center justify-center w-14 py-1 transition-colors ${
            location.pathname === '/settings'
              ? 'text-[#10B981] dark:text-[#3ECF8E]'
              : 'text-slate-400 dark:text-neutral-400'
          }`}
        >
          <Settings size={20} strokeWidth={location.pathname === '/settings' ? 2.2 : 1.75} />
          <span className="text-[10px] font-medium mt-1">Settings</span>
        </Link>
      </nav>

      {/* Global Modals */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <EmergencyCardModal isOpen={isEmergencyModalOpen} onClose={() => setIsEmergencyModalOpen(false)} />
    </div>
  );
}
