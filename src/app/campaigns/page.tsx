'use client';

import React, { useState, useMemo } from 'react';
import { usePipeline } from '@/hooks/usePipeline';
import { useAuth } from '@/context/AuthContext';
import { Campaign, CampaignStatus, Market } from '@/types';
import { CampaignDetailModal } from '@/components/campaigns/CampaignDetailModal';
import { NewActionModal } from '@/components/actions/NewActionModal';
import { WaitingForAccess } from '@/components/auth/WaitingForAccess';
import {
  MarketBadge,
  MarketFlagIcon,
  getMarketLabel,
} from '@/components/common/MarketBadge';
import {
  Layers,
  Plus,
  TrendingUp,
  Search,
  ExternalLink,
  Flame,
  Calendar,
  CreditCard,
  History,
  Filter,
  X,
  RotateCcw,
  Globe2,
  SlidersHorizontal,
} from 'lucide-react';

export default function CampaignsPage() {
  const { campaigns, adSets, settings } = usePipeline();
  const { isPendingAccess, isMediaBuyer } = useAuth();

  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isNewActionOpen, setIsNewActionOpen] = useState(false);
  const [newActionDefault, setNewActionDefault] = useState<{ action: any; campaign: string }>({
    action: 'LAUNCH NEW CBO',
    campaign: '',
  });

  // Filter States
  const [marketFilter, setMarketFilter] = useState<'ALL' | Market>('ALL');
  const [adAccountFilter, setAdAccountFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (isPendingAccess) {
    return <WaitingForAccess />;
  }

  // Safe arrays
  const safeCampaigns: Campaign[] = Array.isArray(campaigns) ? campaigns.filter(Boolean) : [];
  const safeAdSets = Array.isArray(adSets) ? adSets.filter(Boolean) : [];

  // Derive unique markets & account counts
  const marketsList: { code: 'ALL' | Market; label: string }[] = [
    { code: 'ALL', label: 'All Markets' },
    { code: 'CA', label: 'Canada' },
    { code: 'UK', label: 'United Kingdom' },
    { code: 'AUS', label: 'Australia' },
    { code: 'US', label: 'United States' },
  ];

  const marketCounts = useMemo(() => {
    return {
      ALL: safeCampaigns.length,
      CA: safeCampaigns.filter((c) => c?.market === 'CA').length,
      UK: safeCampaigns.filter((c) => c?.market === 'UK').length,
      AUS: safeCampaigns.filter((c) => c?.market === 'AUS').length,
      US: safeCampaigns.filter((c) => c?.market === 'US').length,
    };
  }, [safeCampaigns]);

  // Account -> Market mapping
  const accountMarketMap = useMemo(() => {
    const map: Record<string, Market> = {};
    safeCampaigns.forEach((c) => {
      if (c?.adAccount && c?.market) {
        map[c.adAccount] = c.market;
      }
    });
    return map;
  }, [safeCampaigns]);

  // All unique ad accounts from active campaigns + settings (defensive against objects)
  const allAccounts = useMemo(() => {
    const set = new Set<string>();
    safeCampaigns.forEach((c) => {
      if (c?.adAccount && typeof c.adAccount === 'string') {
        set.add(c.adAccount.trim());
      }
    });

    const rawSettingsAccounts = settings?.adAccounts;
    const settingsList: any[] = Array.isArray(rawSettingsAccounts)
      ? rawSettingsAccounts
      : rawSettingsAccounts && typeof rawSettingsAccounts === 'object'
      ? Object.values(rawSettingsAccounts)
      : [];

    settingsList.forEach((acc) => {
      if (acc && typeof acc === 'string') {
        set.add(acc.trim());
      }
    });

    return Array.from(set).filter(Boolean).sort();
  }, [safeCampaigns, settings]);

  // Filter accounts by currently active market
  const relevantAccounts = useMemo(() => {
    if (marketFilter === 'ALL') return allAccounts;
    return allAccounts.filter((acc) => {
      if (!acc) return false;
      const campM = accountMarketMap[acc];
      if (campM) return campM === marketFilter;

      // Fallback prefix matching
      const norm = (acc || '').toUpperCase();
      if (marketFilter === 'CA' && norm.startsWith('CA')) return true;
      if (marketFilter === 'AUS' && (norm.startsWith('AU') || norm.startsWith('AUS'))) return true;
      if (
        marketFilter === 'UK' &&
        (norm.startsWith('UK') ||
          norm.startsWith('GB') ||
          norm.startsWith('RL-01') ||
          norm.startsWith('RL-02'))
      )
        return true;
      if (marketFilter === 'US' && (norm.startsWith('US') || norm.startsWith('USA'))) return true;
      return false;
    });
  }, [allAccounts, marketFilter, accountMarketMap]);

  // Handle market selection change
  const handleMarketChange = (code: 'ALL' | Market) => {
    setMarketFilter(code);
    if (adAccountFilter !== 'ALL') {
      const campM = accountMarketMap[adAccountFilter];
      if (code !== 'ALL' && campM && campM !== code) {
        setAdAccountFilter('ALL');
      }
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setMarketFilter('ALL');
    setAdAccountFilter('ALL');
    setStatusFilter('ALL');
    setSearchQuery('');
  };

  const isAnyFilterActive =
    marketFilter !== 'ALL' ||
    adAccountFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    searchQuery.trim().length > 0;

  // Filtered campaigns with null-safe string lookups
  const filteredCampaigns = useMemo(() => {
    return safeCampaigns.filter((c) => {
      if (!c) return false;
      if (marketFilter !== 'ALL' && c.market !== marketFilter) return false;
      if (adAccountFilter !== 'ALL' && c.adAccount !== adAccountFilter) return false;
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (c.name || '').toLowerCase();
        const product = (c.product || '').toLowerCase();
        const adAccount = (c.adAccount || '').toLowerCase();
        const stage = (c.stage || '').toLowerCase();
        const marketLabel = getMarketLabel(c.market || '').toLowerCase();
        return (
          name.includes(q) ||
          product.includes(q) ||
          adAccount.includes(q) ||
          stage.includes(q) ||
          marketLabel.includes(q)
        );
      }
      return true;
    });
  }, [safeCampaigns, marketFilter, adAccountFilter, statusFilter, searchQuery]);

  const liveCount = filteredCampaigns.filter(
    (c) => c && (c.status === 'LIVE' || c.status === 'SCALE')
  ).length;

  return (
    <div className="flex flex-col min-h-screen bg-black text-[#ededed] font-sans pb-16">
      {/* Top Header - Vercel Clean Aesthetic */}
      <div className="border-b border-[#1f1f1f] bg-black px-4 py-5 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 max-w-7xl mx-auto w-full">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-white">
                Campaigns Directory
              </h1>
              <span className="rounded-md bg-[#121212] border border-[#262626] px-2 py-0.5 text-xs font-semibold text-zinc-300 font-mono">
                {filteredCampaigns.length} {filteredCampaigns.length === 1 ? 'Project' : 'Projects'} ({liveCount} Live)
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Manage campaign lifecycles, ad sets, chronological activity history, and scaling actions.
            </p>
          </div>

          {isMediaBuyer && (
            <button
              onClick={() => {
                setNewActionDefault({ action: 'LAUNCH NEW CBO', campaign: '' });
                setIsNewActionOpen(true);
              }}
              className="vercel-btn-primary flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 text-black" />
              <span>+ Launch New CBO</span>
            </button>
          )}
        </div>

        {/* 1. Market Tabs Selector (Vercel Segmented Control) */}
        <div className="mt-5 pt-4 border-t border-[#1a1a1a] max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <Globe2 className="w-3 h-3 text-zinc-400" />
              <span>Filter by Market</span>
            </span>
            {marketFilter !== 'ALL' && (
              <button
                onClick={() => handleMarketChange('ALL')}
                className="text-[11px] text-zinc-400 hover:text-white hover:underline font-medium"
              >
                Reset to All Markets
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar flex-nowrap sm:flex-wrap">
            {marketsList.map((m) => {
              const isSelected = marketFilter === m.code;
              const count = marketCounts[m.code] || 0;

              return (
                <button
                  key={m.code}
                  onClick={() => handleMarketChange(m.code)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all shrink-0 border cursor-pointer ${
                    isSelected
                      ? 'bg-[#181818] text-white border-[#383838] shadow-xs'
                      : 'bg-black text-zinc-400 border-[#222222] hover:text-white hover:border-[#333333] hover:bg-white/[0.03]'
                  }`}
                >
                  {m.code !== 'ALL' ? (
                    <MarketFlagIcon market={m.code} className="w-4 h-2.5 rounded-2xs shrink-0 shadow-2xs" />
                  ) : (
                    <Globe2 className="w-3.5 h-3.5 text-zinc-400" />
                  )}
                  <span>{m.label}</span>
                  <span
                    className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-mono font-semibold ${
                      isSelected
                        ? 'bg-[#2a2a2a] text-zinc-200'
                        : 'bg-[#141414] text-zinc-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Secondary Filter Bar: Search [/], Account Dropdown & Status Pills */}
        <div className="mt-3 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-3 border-t border-[#1a1a1a] text-xs max-w-7xl mx-auto w-full">
          {/* Vercel Search Box with / Keyboard Badge */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search campaigns, products, accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-[#262626] bg-black py-1.5 pl-8 pr-8 text-xs text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-hidden transition-colors shadow-inner"
            />
            <span className="absolute right-2.5 top-2 vercel-kbd">/</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Ad Account Dropdown Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold shrink-0">
                Account:
              </span>
              <select
                value={adAccountFilter}
                onChange={(e) => setAdAccountFilter(e.target.value)}
                style={{ colorScheme: 'dark' }}
                className="rounded-md border border-[#262626] bg-[#0a0a0a] py-1.5 px-2.5 text-xs font-mono font-semibold text-white focus:border-zinc-500 focus:outline-hidden cursor-pointer shadow-xs"
              >
                <option value="ALL" className="bg-[#121212] text-white">
                  All Accounts ({relevantAccounts.length})
                </option>
                {relevantAccounts.map((acc) => {
                  const count = safeCampaigns.filter((c) => c?.adAccount === acc).length;
                  const accM = accountMarketMap[acc];
                  const mLabel = accM ? ` · ${getMarketLabel(accM)}` : '';
                  return (
                    <option key={acc} value={acc} className="bg-[#121212] text-white">
                      {acc} ({count} camp{count === 1 ? '' : 's'}){mLabel}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-0.5 bg-[#0a0a0a] p-0.5 rounded-md border border-[#222222]">
              {['ALL', 'LIVE', 'SCALE', 'WATCH', 'PAUSE', 'KILL'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-1 rounded text-[10px] font-bold font-mono transition-colors cursor-pointer ${
                    statusFilter === st
                      ? 'bg-white text-black shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Quick Ad Account Pills (when a market is selected) */}
        {marketFilter !== 'ALL' && relevantAccounts.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs max-w-7xl mx-auto w-full">
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider shrink-0">
              Accounts ({getMarketLabel(marketFilter)}):
            </span>
            <button
              onClick={() => setAdAccountFilter('ALL')}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-colors shrink-0 ${
                adAccountFilter === 'ALL'
                  ? 'bg-white text-black font-semibold'
                  : 'bg-[#121212] border border-[#222] text-zinc-400 hover:text-white'
              }`}
            >
              All
            </button>
            {relevantAccounts.map((acc) => {
              const count = safeCampaigns.filter((c) => c?.adAccount === acc).length;
              return (
                <button
                  key={acc}
                  onClick={() => setAdAccountFilter(acc)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-colors shrink-0 border cursor-pointer ${
                    adAccountFilter === acc
                      ? 'bg-white text-black border-white font-semibold'
                      : 'bg-[#0e0e0e] text-zinc-400 border-[#222222] hover:border-[#333] hover:text-white'
                  }`}
                >
                  {acc} <span className="opacity-60 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* 4. Active Filters Bar with Reset */}
        {isAnyFilterActive && (
          <div className="mt-3 pt-2.5 border-t border-[#1a1a1a] flex flex-wrap items-center justify-between gap-2 text-xs max-w-7xl mx-auto w-full">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold">
                Active:
              </span>

              {marketFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#121212] text-zinc-300 text-[11px] font-medium border border-[#2a2a2a]">
                  <MarketFlagIcon market={marketFilter} className="w-3.5 h-2 rounded-2xs" />
                  <span>Market: {getMarketLabel(marketFilter)}</span>
                  <button onClick={() => handleMarketChange('ALL')} className="text-zinc-500 hover:text-white cursor-pointer">
                    <X className="w-3 h-3 ml-0.5" />
                  </button>
                </span>
              )}

              {adAccountFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#121212] text-zinc-300 text-[11px] font-mono border border-[#2a2a2a]">
                  <span>Account: {adAccountFilter}</span>
                  <button onClick={() => setAdAccountFilter('ALL')} className="text-zinc-500 hover:text-white cursor-pointer">
                    <X className="w-3 h-3 ml-0.5" />
                  </button>
                </span>
              )}

              {statusFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#121212] text-zinc-300 text-[11px] font-mono border border-[#2a2a2a]">
                  <span>Status: {statusFilter}</span>
                  <button onClick={() => setStatusFilter('ALL')} className="text-zinc-500 hover:text-white cursor-pointer">
                    <X className="w-3 h-3 ml-0.5" />
                  </button>
                </span>
              )}

              {searchQuery.trim() && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#121212] text-zinc-300 text-[11px] border border-[#2a2a2a]">
                  <span>&quot;{searchQuery}&quot;</span>
                  <button onClick={() => setSearchQuery('')} className="text-zinc-500 hover:text-white cursor-pointer">
                    <X className="w-3 h-3 ml-0.5" />
                  </button>
                </span>
              )}
            </div>

            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Campaigns Grid - Vercel Project Cards */}
      <div className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
        {filteredCampaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center rounded-xl border border-dashed border-[#262626] bg-[#0a0a0a]">
            <Layers className="w-8 h-8 text-zinc-600 mb-2" />
            <h3 className="text-sm font-semibold text-white">
              No matching campaigns found
            </h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
              Try adjusting your market, account, or status filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-4 vercel-btn-secondary inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-zinc-400" />
              <span>Reset Filters</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCampaigns.map((camp) => {
              if (!camp) return null;
              const campAdSets = safeAdSets.filter((a) => a && a.campaignName === camp.name);
              const historyCount = Array.isArray(camp.history) ? camp.history.length : 0;

              return (
                <div
                  key={camp.id}
                  className="vercel-card p-5 flex flex-col justify-between group"
                >
                  <div>
                    {/* Header: Market Badge + Product & Minimal Status */}
                    <div className="flex items-center justify-between gap-2 border-b border-[#1f1f1f] pb-3 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <MarketBadge market={camp.market} size="sm" />
                        <span className="font-semibold text-xs text-zinc-300 truncate">
                          {camp.product || 'Product'}
                        </span>
                      </div>

                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold shrink-0 border ${
                          camp.status === 'SCALE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                            : camp.status === 'LIVE'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/25'
                            : camp.status === 'WATCH'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                        }`}
                      >
                        {camp.status || 'LIVE'}
                      </span>
                    </div>

                    {/* Campaign Title */}
                    <h3 className="font-mono text-base font-bold text-white tracking-tight truncate group-hover:text-blue-400 transition-colors">
                      {camp.name || 'Untitled Campaign'}
                    </h3>

                    {/* Vercel-Style Metadata Grid */}
                    <div className="mt-3.5 grid grid-cols-2 gap-2 text-[11px] font-mono rounded-lg bg-black/60 p-3 border border-[#1f1f1f]">
                      <div>
                        <span className="text-zinc-500 text-[10px] block uppercase font-bold">Account</span>
                        <button
                          type="button"
                          onClick={() => camp.adAccount && setAdAccountFilter(camp.adAccount)}
                          title={`Filter by account ${camp.adAccount}`}
                          className="font-semibold text-zinc-200 hover:text-white transition-colors inline-flex items-center gap-1 group/acc text-left cursor-pointer"
                        >
                          <span>{camp.adAccount || '—'}</span>
                          <Filter className="w-2.5 h-2.5 opacity-0 group-hover/acc:opacity-100 text-zinc-400 transition-opacity" />
                        </button>
                      </div>

                      <div>
                        <span className="text-zinc-500 text-[10px] block uppercase font-bold">Ad Sets</span>
                        <span className="font-semibold text-teal-400">
                          {campAdSets.length} live sets
                        </span>
                      </div>

                      <div>
                        <span className="text-zinc-500 text-[10px] block uppercase font-bold">Launch Date</span>
                        <span className="font-semibold text-zinc-300">{camp.launchDate || '—'}</span>
                      </div>

                      <div>
                        <span className="text-zinc-500 text-[10px] block uppercase font-bold">Stage</span>
                        <span className="font-semibold text-blue-400 truncate block">
                          {camp.stage || 'Scale Phase'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-5 pt-3.5 border-t border-[#1f1f1f] flex items-center justify-between gap-2">
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {historyCount} event{historyCount === 1 ? '' : 's'}
                    </span>

                    <button
                      onClick={() => setSelectedCampaign(camp)}
                      className="vercel-btn-secondary flex items-center gap-1.5 cursor-pointer hover:border-zinc-500"
                    >
                      <span>Open Campaign</span>
                      <ExternalLink className="h-3 w-3 text-zinc-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Campaign Detail Modal */}
      {selectedCampaign && (
        <CampaignDetailModal
          campaign={selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
          onNewAction={(actionName, campName) => {
            setNewActionDefault({ action: actionName, campaign: campName });
            setIsNewActionOpen(true);
          }}
        />
      )}

      {/* New Action Modal */}
      {isNewActionOpen && (
        <NewActionModal
          isOpen={isNewActionOpen}
          onClose={() => setIsNewActionOpen(false)}
          defaultAction={newActionDefault.action}
          defaultCampaign={newActionDefault.campaign}
        />
      )}
    </div>
  );
}
