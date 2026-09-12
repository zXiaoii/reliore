'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePipeline } from '@/hooks/usePipeline';
import {
  Layers,
  Palette,
  Settings,
  Flame,
  LayoutGrid,
  Sparkles,
  AlertOctagon,
  CreditCard,
  Package,
  RotateCcw,
  Zap,
  Menu,
  X,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { currentUser, switchUserByUid, availableUsers } = useAuth();
  const { tasks, store } = usePipeline();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on page navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Metrics for badges
  const creativeCount = tasks.filter(
    (t) => t.status === 'QUEUE' || t.status === 'MAKING' || t.status === 'CHANGES REQUIRED'
  ).length;

  const setupCount = tasks.filter(
    (t) => t.status === 'READY' || t.status === 'IN_SETUP' || t.status === 'QA'
  ).length;

  const blockersCount = tasks.filter(
    (t) => t.status === 'BLOCKED' || t.status === 'CHANGES REQUIRED'
  ).length;

  const navItems = [
    {
      href: '/',
      label: 'Dashboard',
      icon: LayoutGrid,
    },
    {
      href: '/campaigns',
      label: 'Campaigns',
      icon: Layers,
    },
    {
      href: '/tasks',
      label: 'Tasks',
      icon: Zap,
    },
    {
      href: '/creative',
      label: 'Creative Queue',
      icon: Palette,
      badge: creativeCount > 0 ? creativeCount : null,
      badgeColor: 'bg-purple-600 text-white',
    },
    {
      href: '/setup',
      label: 'Setup Queue',
      icon: Flame,
      badge: setupCount > 0 ? setupCount : null,
      badgeColor: 'bg-teal-600 text-white',
    },
    {
      href: '/products',
      label: 'Products',
      icon: Package,
    },
    {
      href: '/ad-accounts',
      label: 'Ad Accounts',
      icon: CreditCard,
    },
    {
      href: '/blockers',
      label: 'Blockers',
      icon: AlertOctagon,
      badge: blockersCount > 0 ? blockersCount : null,
      badgeColor: 'bg-rose-600 text-white',
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  // Primary bottom mobile tabs
  const bottomNavItems = [
    { href: '/', label: 'Dashboard', icon: LayoutGrid },
    { href: '/creative', label: 'Creative', icon: Palette, badge: creativeCount },
    { href: '/setup', label: 'Setup', icon: Flame, badge: setupCount },
    { href: '/campaigns', label: 'Campaigns', icon: Layers },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#1f1f1f] bg-black/90 backdrop-blur-md">
        <div className="flex h-13 items-center justify-between px-3 sm:px-6">
          {/* Brand & Desktop Nav */}
          <div className="flex items-center gap-3 xl:gap-6 min-w-0">
            <Link
              href="/"
              className="group flex items-center gap-2.5 font-semibold text-white shrink-0 transition-opacity hover:opacity-90"
            >
              {/* App Icon Squircle */}
              <div className="relative flex h-7.5 w-7.5 items-center justify-center rounded-[8px] bg-gradient-to-b from-[#262626] to-[#121212] p-[1px] shadow-sm border border-[#333333] group-hover:border-[#555555] transition-all">
                <div className="flex h-full w-full items-center justify-center rounded-[7px] bg-black">
                  <Sparkles className="h-3.5 w-3.5 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-transform group-hover:scale-110" />
                </div>
                {/* Live Indicator Dot */}
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 ring-2 ring-black"></span>
                </span>
              </div>

              {/* Brand Typography */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-tight text-white">
                  Media Ops
                </span>
                <span className="rounded px-1.5 py-0.5 text-[9px] font-mono font-bold text-zinc-300 border border-[#2a2a2a] bg-[#121212]">
                  SSOT
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-0.5 overflow-x-auto py-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-white/[0.08] text-white font-semibold'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 opacity-75" />
                    <span>{item.label}</span>
                    {item.badge !== null && item.badge !== undefined && (
                      <span
                        className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-bold font-mono ${
                          item.badgeColor || 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Area: Persona Switcher, Reset & Mobile Menu Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Persona Switcher */}
            <div className="flex items-center gap-1.5 bg-[#0a0a0a] p-1 rounded-md border border-[#222222]">
              <span className="text-[10px] uppercase font-mono font-bold text-zinc-500 px-1 hidden md:inline">
                Role:
              </span>
              <select
                value={currentUser?.uid || 'charles-01'}
                onChange={(e) => switchUserByUid(e.target.value)}
                style={{ colorScheme: 'dark' }}
                className="bg-transparent text-xs font-semibold text-white focus:outline-hidden cursor-pointer max-w-[110px] sm:max-w-none [color-scheme:dark]"
              >
                {availableUsers.map((u) => (
                  <option key={u.uid} value={u.uid} className="bg-black text-white py-1">
                    {u.displayName} ({u.role?.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Button (Desktop & Tablet) */}
            <button
              onClick={() => {
                if (confirm('Reset operations demo data to initial clean state?')) {
                  store.resetDemoData();
                }
              }}
              className="hidden sm:flex p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors border border-transparent hover:border-[#262626]"
              title="Reset demo data"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex lg:hidden p-1.5 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-[#222222] bg-[#0a0a0a] px-4 py-3 shadow-2xl">
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-white text-black font-semibold'
                        : 'bg-[#121212] border border-[#222222] text-zinc-300 hover:bg-[#181818] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge !== null && item.badge !== undefined && (
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold font-mono shrink-0 ${
                          isActive ? 'bg-black text-white' : 'bg-[#222] text-zinc-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="mt-3 pt-3 border-t border-[#222222] flex items-center justify-between text-xs">
              <span className="text-zinc-500 font-mono text-[11px]">User: {currentUser?.displayName}</span>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (confirm('Reset operations demo data to initial clean state?')) {
                    store.resetDemoData();
                  }
                }}
                className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs font-medium py-1 px-2 rounded-md hover:bg-[#181818] transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset Demo Data</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Sticky Bottom Tab Bar (< 1024px) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex lg:hidden items-center justify-around border-t border-[#1f1f1f] bg-black/90 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] px-2 backdrop-blur-2xl shadow-2xl">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[10px] font-medium transition-all ${
                isActive
                  ? 'text-white font-semibold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.7]'}`} />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-blue-600 px-1 text-[8px] font-bold text-white shadow-xs">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="tracking-tight">{item.label}</span>
              {isActive && (
                <span className="h-0.5 w-3 rounded-full bg-purple-600 dark:bg-purple-400 -mt-0.5" />
              )}
            </Link>
          );
        })}

        {/* More button toggles the mobile drawer */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[10px] font-semibold transition-colors ${
            isMobileMenuOpen
              ? 'text-purple-600 dark:text-purple-400 font-bold'
              : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
          }`}
        >
          <Menu className="h-5 w-5 stroke-[1.8]" />
          <span className="tracking-tight">More</span>
        </button>
      </div>
    </>
  );
};
