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
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/95 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="flex h-13 items-center justify-between px-3 sm:px-6">
          {/* Brand & Desktop Nav */}
          <div className="flex items-center gap-3 xl:gap-5 min-w-0">
            <Link
              href="/"
              className="group flex items-center gap-2.5 font-semibold text-zinc-900 dark:text-white shrink-0 transition-opacity hover:opacity-95"
            >
              {/* App Icon Squircle */}
              <div className="relative flex h-8 w-8 items-center justify-center rounded-[9px] bg-gradient-to-b from-zinc-700 to-zinc-900 dark:from-zinc-700 dark:to-zinc-900 p-[1px] shadow-sm shadow-black/30 ring-1 ring-white/15 group-hover:ring-white/30 transition-all">
                <div className="flex h-full w-full items-center justify-center rounded-[8px] bg-gradient-to-b from-zinc-800 to-zinc-950 dark:from-zinc-850 dark:to-black">
                  <Sparkles className="h-4 w-4 text-blue-400 dark:text-blue-300 drop-shadow-[0_0_6px_rgba(96,165,250,0.5)] transition-transform group-hover:scale-110" />
                </div>
                {/* Live Indicator Dot */}
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 ring-2 ring-white dark:ring-zinc-950"></span>
                </span>
              </div>

              {/* Brand Typography */}
              <div className="flex flex-col leading-none">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-extrabold tracking-tight text-zinc-900 dark:text-white">
                    Media Ops
                  </span>
                  <span className="rounded-[4px] bg-blue-500/10 dark:bg-blue-400/10 px-1.5 py-0.5 text-[9px] font-mono font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    SSOT
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-400 font-medium tracking-wide mt-0.5 hidden sm:inline">
                  Single Source of Truth
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800/60'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{item.label}</span>
                    {item.badge !== null && item.badge !== undefined && (
                      <span
                        className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-bold font-mono ${
                          item.badgeColor || 'bg-zinc-200 text-zinc-700'
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
            <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/90 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700/60">
              <span className="text-[10px] uppercase font-bold text-zinc-400 px-1 hidden md:inline">
                Role:
              </span>
              <select
                value={currentUser?.uid || 'charles-01'}
                onChange={(e) => switchUserByUid(e.target.value)}
                style={{ colorScheme: 'dark' }}
                className="bg-transparent text-xs font-bold text-zinc-900 dark:text-white focus:outline-hidden cursor-pointer max-w-[110px] sm:max-w-none [color-scheme:dark]"
              >
                {availableUsers.map((u) => (
                  <option key={u.uid} value={u.uid} className="bg-zinc-900 text-zinc-100 dark:bg-zinc-900 dark:text-white py-1">
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
              className="hidden sm:flex p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
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
          <div className="lg:hidden border-t border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900 shadow-xl">
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold'
                        : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge !== null && item.badge !== undefined && (
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold font-mono shrink-0 ${
                          isActive
                            ? 'bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900'
                            : item.badgeColor || 'bg-zinc-200 text-zinc-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-500 font-mono text-[11px]">User: {currentUser?.displayName}</span>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (confirm('Reset operations demo data to initial clean state?')) {
                    store.resetDemoData();
                  }
                }}
                className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-xs font-semibold py-1 px-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset Demo Data</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* iOS Mobile Sticky Bottom Tab Bar (< 1024px) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex lg:hidden items-center justify-around border-t border-zinc-200/80 dark:border-white/10 bg-white/80 dark:bg-zinc-950/80 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] px-2 backdrop-blur-2xl shadow-xl">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[10px] font-semibold transition-all ${
                isActive
                  ? 'text-purple-600 dark:text-purple-400 font-bold scale-[1.02]'
                  : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.3]' : 'stroke-[1.8]'}`} />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-bold text-white shadow-xs">
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
