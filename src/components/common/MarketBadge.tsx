'use client';

import React from 'react';
import { Market } from '@/types';

export function CanadaFlag({ className = 'w-4 h-2.5 rounded-2xs shrink-0 shadow-2xs' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 20" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="8" height="20" fill="#D80027" />
      <rect x="8" width="16" height="20" fill="#FFFFFF" />
      <rect x="24" width="8" height="20" fill="#D80027" />
      <path
        d="M16 4.2l.9 2.4 2.3-.9-.9 2.4 2.4.9-1.6 1.6 2 2-2.8.4.6 2.7-2.7-1.6v3h-1.6v-3l-2.7 1.6.6-2.7-2.8-.4 2-2-1.6-1.6 2.4-.9-.9-2.4 2.3.9z"
        fill="#D80027"
      />
    </svg>
  );
}

export function UkFlag({ className = 'w-4 h-2.5 rounded-2xs shrink-0 shadow-2xs' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 20" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="20" fill="#012169" />
      <path d="M0 0l32 20M32 0L0 20" stroke="#FFFFFF" strokeWidth="4" />
      <path d="M0 0l32 20M32 0L0 20" stroke="#C8102E" strokeWidth="2.2" />
      <path d="M16 0v20M0 10h32" stroke="#FFFFFF" strokeWidth="6" />
      <path d="M16 0v20M0 10h32" stroke="#C8102E" strokeWidth="3.6" />
    </svg>
  );
}

export function UsFlag({ className = 'w-4 h-2.5 rounded-2xs shrink-0 shadow-2xs' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 20" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="20" fill="#B22234" />
      <path d="M0 3h32M0 6h32M0 9h32M0 12h32M0 15h32M0 18h32" stroke="#FFFFFF" strokeWidth="1.5" />
      <rect width="14" height="11" fill="#3C3B6E" />
      <circle cx="3" cy="2.5" r="0.8" fill="#FFFFFF" />
      <circle cx="7" cy="2.5" r="0.8" fill="#FFFFFF" />
      <circle cx="11" cy="2.5" r="0.8" fill="#FFFFFF" />
      <circle cx="5" cy="5.5" r="0.8" fill="#FFFFFF" />
      <circle cx="9" cy="5.5" r="0.8" fill="#FFFFFF" />
      <circle cx="3" cy="8.5" r="0.8" fill="#FFFFFF" />
      <circle cx="7" cy="8.5" r="0.8" fill="#FFFFFF" />
      <circle cx="11" cy="8.5" r="0.8" fill="#FFFFFF" />
    </svg>
  );
}

export function AusFlag({ className = 'w-4 h-2.5 rounded-2xs shrink-0 shadow-2xs' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 20" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="20" fill="#00008B" />
      <g transform="scale(0.48)">
        <rect width="32" height="20" fill="#012169" />
        <path d="M0 0l32 20M32 0L0 20" stroke="#FFFFFF" strokeWidth="4" />
        <path d="M0 0l32 20M32 0L0 20" stroke="#C8102E" strokeWidth="2.2" />
        <path d="M16 0v20M0 10h32" stroke="#FFFFFF" strokeWidth="6" />
        <path d="M16 0v20M0 10h32" stroke="#C8102E" strokeWidth="3.6" />
      </g>
      <circle cx="7.5" cy="14" r="2" fill="#FFFFFF" />
      <circle cx="24" cy="4.5" r="1.1" fill="#FFFFFF" />
      <circle cx="21" cy="8.5" r="1.1" fill="#FFFFFF" />
      <circle cx="27" cy="9.5" r="1.1" fill="#FFFFFF" />
      <circle cx="23.5" cy="14.5" r="1.1" fill="#FFFFFF" />
      <circle cx="25" cy="11.2" r="0.7" fill="#FFFFFF" />
    </svg>
  );
}

export function MarketFlagIcon({ market, className }: { market: Market | string; className?: string }) {
  if (!market || typeof market !== 'string') return null;
  const norm = market.toUpperCase().trim();
  switch (norm) {
    case 'CA':
      return <CanadaFlag className={className} />;
    case 'UK':
    case 'GB':
      return <UkFlag className={className} />;
    case 'US':
    case 'USA':
      return <UsFlag className={className} />;
    case 'AUS':
    case 'AU':
      return <AusFlag className={className} />;
    default:
      return null;
  }
}

export function getMarketLabel(market: Market | string): string {
  if (!market || typeof market !== 'string') return 'Unknown';
  const norm = market.toUpperCase().trim();
  switch (norm) {
    case 'CA':
      return 'Canada';
    case 'UK':
    case 'GB':
      return 'United Kingdom';
    case 'US':
    case 'USA':
      return 'United States';
    case 'AUS':
    case 'AU':
      return 'Australia';
    default:
      return market;
  }
}

interface MarketBadgeProps {
  market: Market | string;
  showName?: boolean;
  shortCode?: boolean;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export function MarketBadge({
  market,
  showName = true,
  shortCode = false,
  size = 'sm',
  className = '',
}: MarketBadgeProps) {
  const norm = (typeof market === 'string' ? market : '').toUpperCase().trim();
  const fullName = getMarketLabel(market);
  const code = norm === 'GB' ? 'UK' : norm === 'AU' ? 'AUS' : norm;
  const label = shortCode ? code : fullName;

  // Styled colors per country
  let colorStyles =
    'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700';

  if (norm === 'CA') {
    colorStyles =
      'bg-rose-50 text-rose-700 border-rose-200/90 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60';
  } else if (norm === 'UK' || norm === 'GB') {
    colorStyles =
      'bg-sky-50 text-sky-700 border-sky-200/90 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60';
  } else if (norm === 'US' || norm === 'USA') {
    colorStyles =
      'bg-indigo-50 text-indigo-700 border-indigo-200/90 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60';
  } else if (norm === 'AUS' || norm === 'AU') {
    colorStyles =
      'bg-amber-50 text-amber-800 border-amber-200/90 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60';
  }

  const sizeStyles =
    size === 'xs'
      ? 'text-[10px] py-0.5 px-1.5 gap-1'
      : size === 'md'
      ? 'text-xs py-1 px-2.5 gap-2'
      : 'text-[11px] py-0.5 px-2 gap-1.5';

  const flagSize = size === 'xs' ? 'w-3.5 h-2.5' : size === 'md' ? 'w-4.5 h-3' : 'w-4 h-2.5';

  return (
    <span
      title={fullName}
      className={`inline-flex items-center font-semibold rounded-md border tracking-tight shrink-0 shadow-2xs transition-colors ${colorStyles} ${sizeStyles} ${className}`}
    >
      <MarketFlagIcon market={market} className={`${flagSize} rounded-2xs shrink-0 shadow-2xs`} />
      {showName && <span>{label}</span>}
    </span>
  );
}
