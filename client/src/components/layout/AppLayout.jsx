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
  Bell,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import GlobalSearchModal from '../common/GlobalSearchModal';
import EmergencyCardModal from '../common/EmergencyCardModal';
import LogoutModal from '../common/LogoutModal';

export default function AppLayout() {
  const {
    user,
    family,
    isEmergencyModalOpen,
    setIsEmergencyModalOpen,
    logout,
    isLogoutModalOpen,
    openLogoutModal,
    closeLogoutModal,
    isLoggingOut,
  } = useAuth();
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
            ? 'bg-emerald-50 text-emerald-700 font-medium shadow-xs dark:bg-[#262626] dark:text-white'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-normal dark:text-[#9CA3AF] dark:hover:text-[#F3F4F6] dark:hover:bg-white/[0.04]'
        }`}
      >
        <div className="w-5 h-5 flex items-center justify-center shrink-0">
          <Icon
            size={18}
            strokeWidth={1.75}
            className={`transition-colors ${
              active
                ? 'text-emerald-600 dark:text-[#3ECF8E]'
                : 'text-slate-500 group-hover/item:text-slate-900 dark:text-[#9CA3AF] dark:group-hover/item:text-[#F3F4F6]'
            }`}
          />
        </div>

        <span
          className={`whitespace-nowrap overflow-hidden transition-all duration-200 text-[13px] leading-tight ${
            isHovered
              ? 'opacity-100 max-w-[140px] ml-2.5'
              : 'opacity-0 max-w-0 ml-0 pointer-events-none'
          } ${
            active
              ? 'text-emerald-700 dark:text-white font-medium'
              : 'text-slate-600 group-hover/item:text-slate-900 dark:text-[#9CA3AF] dark:group-hover/item:text-[#F3F4F6] font-normal'
          }`}
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
              <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 text-[10px] font-mono font-medium">
                Alert
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-[#3ECF8E]/10 dark:text-[#3ECF8E] dark:border-[#3ECF8E]/20 text-[10px] font-mono font-medium">
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
      {/* ================= DESKTOP COLLAPSIBLE HOVER SIDEBAR ================= */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`hidden md:flex fixed left-0 top-0 bottom-0 z-50 bg-white dark:bg-[#141414] border-r border-slate-200 dark:border-[#262626] flex-col justify-between transition-all duration-200 ease-in-out select-none px-3 py-3 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${
          isHovered ? 'w-60 shadow-2xl shadow-slate-300/60 dark:shadow-black/80' : 'w-16'
        }`}
      >
        <div className="flex flex-col">
          {/* Header Brand */}
          <div className="flex items-center gap-2.5 px-1.5 py-1 mb-2">
            <Link to="/dashboard" className="flex items-center gap-2.5 min-w-0" title="GharVault Home">
              <div className="w-8 h-8 rounded-lg bg-[#10B981] dark:bg-[#3ECF8E] flex items-center justify-center text-white dark:text-[#121212] shrink-0 shadow-sm shadow-[#10B981]/20 font-bold">
                <Shield size={18} strokeWidth={2.2} />
              </div>
              <div
                className={`flex flex-col min-w-0 transition-all duration-200 ${
                  isHovered ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0 pointer-events-none'
                }`}
              >
                <span className="font-headline font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-none">
                  GharVault
                </span>
                <span className="text-[11px] text-slate-500 dark:text-[#9CA3AF] font-normal truncate mt-1">
                  {family?.name || 'Family Vault'}
                </span>
              </div>
            </Link>
          </div>

          {/* Section Divider */}
          <div className="border-t border-slate-200 dark:border-[#262626] my-2" />

          {/* Group 1: Main Overview */}
          <nav className="space-y-1">
            {group1.map(renderNavItem)}
          </nav>

          {/* Section Divider */}
          <div className="border-t border-slate-200 dark:border-[#262626] my-2" />

          {/* Group 2: Vault Categories */}
          <nav className="space-y-1">
            {group2.map(renderNavItem)}
          </nav>

          {/* Section Divider */}
          <div className="border-t border-slate-200 dark:border-[#262626] my-2" />

          {/* Group 3: Activity & Filters */}
          <nav className="space-y-1">
            {group3.map(renderNavItem)}
          </nav>
        </div>

        {/* Bottom Pinned Menu */}
        <div className="pt-2">
          <div className="border-t border-slate-200 dark:border-[#262626] my-2" />

          <div className="space-y-1">
            {/* Emergency Hospital Card Trigger */}
            <button
              type="button"
              onClick={() => setIsEmergencyModalOpen(true)}
              title={!isHovered ? 'Emergency Card' : undefined}
              className="group/item w-full flex items-center h-9 px-2.5 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-500/10 transition-colors cursor-pointer select-none"
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
                <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30 text-[10px] font-mono font-bold">
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
                  ? 'bg-emerald-50 text-emerald-700 font-medium dark:bg-[#262626] dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-[#9CA3AF] dark:hover:text-[#F3F4F6] dark:hover:bg-white/[0.04] font-normal'
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
                  ? 'bg-emerald-50 text-emerald-700 font-medium dark:bg-[#262626] dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-[#9CA3AF] dark:hover:text-[#F3F4F6] dark:hover:bg-white/[0.04] font-normal'
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
                className={`flex items-center h-9 px-1 rounded-md text-slate-600 dark:text-[#9CA3AF] hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors ${
                  isHovered ? 'justify-between' : 'justify-center'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=3ECF8E&color=121212`}
                    alt={user?.name || 'User'}
                    className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-300 dark:ring-neutral-700 shrink-0"
                  />
                  <span
                    className={`whitespace-nowrap overflow-hidden transition-all duration-200 text-[12px] font-medium text-slate-900 dark:text-white truncate ${
                      isHovered ? 'opacity-100 max-w-[120px]' : 'opacity-0 max-w-0 pointer-events-none'
                    }`}
                  >
                    {user?.name || 'Family Admin'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={openLogoutModal}
                  title="Sign Out"
                  className={`p-1 text-slate-500 hover:text-red-600 dark:text-[#9CA3AF] dark:hover:text-red-400 transition-colors cursor-pointer ${
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
      <div className="ml-0 md:ml-16 min-h-screen flex flex-col pb-24 md:pb-8 transition-all duration-200 overflow-x-hidden">
        {/* Fixed Topbar */}
        <header className="fixed top-0 left-0 md:left-16 right-0 h-14 sm:h-16 bg-white/95 dark:bg-[#141414]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#262626] z-40 flex items-center justify-between px-3 sm:px-6 shadow-xs transition-colors duration-200">
          {/* Left: Mobile Brand / Desktop Breadcrumb */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Mobile Brand Shield & Name */}
            <Link to="/dashboard" className="flex items-center gap-2 min-w-0" title="GharVault">
              <div className="w-8 h-8 rounded-lg bg-[#10B981] dark:bg-[#3ECF8E] flex items-center justify-center text-white dark:text-[#121212] font-bold shadow-xs shrink-0">
                <Shield size={17} strokeWidth={2.2} />
              </div>
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white truncate block md:hidden">
                GharVault
              </span>
            </Link>

            {/* Desktop Family Details */}
            <div className="hidden md:block min-w-0">
              <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate block max-w-[200px] lg:max-w-none">
                {family?.name || 'My Family Vault'}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-[#3ECF8E] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] dark:bg-[#3ECF8E] animate-pulse"></span>
                <span>Private & Encrypted</span>
              </span>
            </div>
          </div>

          {/* Search Trigger */}
          <div className="flex-1 max-w-md mx-2 sm:mx-6 flex justify-end md:justify-center">
            {/* Mobile Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="md:hidden w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#1C1C1C] text-slate-500 dark:text-neutral-400 flex items-center justify-center border border-slate-200 dark:border-[#262626] cursor-pointer"
              title="Search Vault"
            >
              <Search size={17} />
            </button>

            {/* Desktop Search Bar */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="hidden md:flex w-full h-10 px-3 bg-slate-100 dark:bg-[#1C1C1C] hover:bg-slate-200/70 dark:hover:bg-[#262626] rounded-xl text-xs text-slate-500 dark:text-neutral-400 items-center justify-between border border-slate-200 dark:border-[#262626] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Search size={15} className="text-slate-400 dark:text-neutral-500 shrink-0" />
                <span className="truncate text-xs">Search IDs, insurance, deed...</span>
              </div>
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#262626] text-slate-600 dark:text-neutral-400 font-mono text-[10px]">
                Ctrl + K
              </kbd>
            </button>
          </div>

          {/* Topbar Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Dark / Light Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
              className="w-10 h-10 rounded-xl border border-slate-200 dark:border-[#262626] bg-slate-50 dark:bg-[#1C1C1C] hover:bg-slate-100 dark:hover:bg-[#262626] text-slate-600 dark:text-[#3ECF8E] flex items-center justify-center transition-all cursor-pointer shadow-xs"
            >
              {isDark ? <Sun size={17} strokeWidth={2} /> : <Moon size={17} strokeWidth={2} />}
            </button>

            {/* Notification Bell */}
            <Link
              to="/notifications"
              title="Notifications"
              className="relative w-10 h-10 rounded-xl border border-slate-200 dark:border-[#262626] bg-slate-50 dark:bg-[#1C1C1C] hover:bg-slate-100 dark:hover:bg-[#262626] text-slate-600 dark:text-neutral-300 flex items-center justify-center transition-all cursor-pointer shadow-xs"
            >
              <Bell size={17} strokeWidth={1.8} />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#10B981] dark:bg-[#3ECF8E]" />
            </Link>

            {/* Mobile User Avatar */}
            <Link to="/settings" className="md:hidden block shrink-0" title="Profile Settings">
              <img
                src={
                  user?.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=3ECF8E&color=121212`
                }
                alt={user?.name || 'User'}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-200 dark:ring-neutral-700"
              />
            </Link>

            {/* Mobile Sign Out Button */}
            <button
              type="button"
              onClick={openLogoutModal}
              title="Sign Out of GharVault"
              className="md:hidden w-10 h-10 rounded-xl border border-slate-200 dark:border-[#262626] bg-slate-50 dark:bg-[#1C1C1C] hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-500 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400 flex items-center justify-center transition-all cursor-pointer shadow-xs"
            >
              <LogOut size={17} strokeWidth={1.8} />
            </button>

            {/* Desktop Quick Emergency Card Button */}
            <button
              type="button"
              onClick={() => setIsEmergencyModalOpen(true)}
              className="hidden md:inline-flex px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 dark:border-red-500/20 text-xs font-bold items-center gap-1.5 transition-colors cursor-pointer"
            >
              <HeartPulse size={15} className="text-red-600 dark:text-red-400 shrink-0" />
              <span>Emergency Card</span>
            </button>

            {/* Desktop Upload Document CTA */}
            <Link
              to="/vault/upload"
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#10B981] dark:bg-[#3ECF8E] hover:bg-emerald-600 dark:hover:bg-[#34B27B] text-white dark:text-[#121212] font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Upload</span>
            </Link>
          </div>
        </header>

        {/* ================= PAGE OUTLET ================= */}
        <main className="w-full pt-14 sm:pt-16 flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      {/* ================= MOBILE BOTTOM NAVIGATION BAR (< 768px) ================= */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-white/95 dark:bg-[#141414]/95 backdrop-blur-md border-t border-slate-200 dark:border-[#262626] flex items-center justify-around px-2 shadow-lg select-none pb-[env(safe-area-inset-bottom,0px)]">
        {/* Home */}
        <Link
          to="/dashboard"
          className={`flex flex-col items-center justify-center w-14 py-1 transition-colors ${
            location.pathname === '/dashboard'
              ? 'text-[#10B981] dark:text-[#3ECF8E]'
              : 'text-slate-500 dark:text-neutral-400'
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
              : 'text-slate-500 dark:text-neutral-400'
          }`}
        >
          <Files size={20} strokeWidth={location.pathname === '/vault' ? 2.2 : 1.75} />
          <span className="text-[10px] font-medium mt-1">Vault</span>
        </Link>

        {/* Central Floating Action Button (Supabase Green +) */}
        <div className="relative -top-3.5 flex items-center justify-center">
          <Link
            to="/vault/upload"
            className="w-[52px] h-[52px] rounded-full bg-[#10B981] dark:bg-[#3ECF8E] text-white dark:text-[#121212] flex items-center justify-center shadow-lg shadow-emerald-500/30 dark:shadow-[#3ECF8E]/30 active:scale-95 transition-all ring-4 ring-white dark:ring-[#141414]"
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
              : 'text-slate-500 dark:text-neutral-400'
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
              : 'text-slate-500 dark:text-neutral-400'
          }`}
        >
          <Settings size={20} strokeWidth={location.pathname === '/settings' ? 2.2 : 1.75} />
          <span className="text-[10px] font-medium mt-1">Settings</span>
        </Link>
      </nav>

      {/* Global Modals */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <EmergencyCardModal isOpen={isEmergencyModalOpen} onClose={() => setIsEmergencyModalOpen(false)} />
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={closeLogoutModal}
        onConfirm={logout}
        loading={isLoggingOut}
      />
    </div>
  );
}
