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
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans pb-16">
      {/* Top Header */}
      <div className="border-b border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900 sm:px-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Campaigns Directory
              </h1>
              <span className="rounded-md bg-blue-100 dark:bg-blue-950 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 font-mono">
                {filteredCampaigns.length} {filteredCampaigns.length === 1 ? 'Campaign' : 'Campaigns'} ({liveCount} Live)
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Manage campaign lifecycles, ad sets, chronological activity history, and scaling actions.
            </p>
          </div>

          {isMediaBuyer && (
            <button
              onClick={() => {
                setNewActionDefault({ action: 'LAUNCH NEW CBO', campaign: '' });
                setIsNewActionOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 transition-colors self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              <span>+ LAUNCH NEW CBO</span>
            </button>
          )}
        </div>

        {/* 1. Market Tabs Selector (§ Optimized UI) */}
        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Globe2 className="w-3 h-3" />
              <span>Filter by Market:</span>
            </span>
            {marketFilter !== 'ALL' && (
              <button
                onClick={() => handleMarketChange('ALL')}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                Show All Markets
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar flex-nowrap sm:flex-wrap">
            {marketsList.map((m) => {
              const isSelected = marketFilter === m.code;
              const count = marketCounts[m.code] || 0;

              return (
                <button
                  key={m.code}
                  onClick={() => handleMarketChange(m.code)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 border ${
                    isSelected
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs dark:bg-white dark:text-zinc-900 dark:border-white ring-2 ring-zinc-900/10 dark:ring-white/20'
                      : 'bg-zinc-100/80 text-zinc-700 border-zinc-200 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-750'
                  }`}
                >
                  {m.code !== 'ALL' ? (
                    <MarketFlagIcon market={m.code} className="w-4 h-2.5 rounded-2xs shrink-0 shadow-2xs" />
                  ) : (
                    <Globe2 className="w-3.5 h-3.5 text-zinc-400" />
                  )}
                  <span>{m.label}</span>
                  <span
                    className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                      isSelected
                        ? 'bg-zinc-750 text-white dark:bg-zinc-200 dark:text-zinc-900'
                        : 'bg-zinc-200/90 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Secondary Filter Bar: Ad Account, Status & Search */}
        <div className="mt-2.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 text-xs">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Ad Account Dropdown Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-zinc-400" />
                <span>Account:</span>
              </span>
              <select
                value={adAccountFilter}
                onChange={(e) => setAdAccountFilter(e.target.value)}
                style={{ colorScheme: 'dark' }}
                className="rounded-md border border-zinc-300 bg-white py-1 px-2 text-xs font-mono font-bold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white [color-scheme:dark] shadow-2xs focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL" className="bg-zinc-900 text-zinc-100">
                  All Accounts ({relevantAccounts.length})
                </option>
                {relevantAccounts.map((acc) => {
                  const count = safeCampaigns.filter((c) => c?.adAccount === acc).length;
                  const accM = accountMarketMap[acc];
                  const mLabel = accM ? ` · ${getMarketLabel(accM)}` : '';
                  return (
                    <option key={acc} value={acc} className="bg-zinc-900 text-zinc-100">
                      {acc} ({count} camp{count === 1 ? '' : 's'}){mLabel}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider shrink-0 mr-1">
                Status:
              </span>
              {['ALL', 'LIVE', 'SCALE', 'WATCH', 'PAUSE', 'KILL'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                    statusFilter === st
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                      : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search campaign, product, account..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white py-1 pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white shadow-2xs"
            />
          </div>
        </div>

        {/* 3. Quick Ad Account Pills (when a market is selected) */}
        {marketFilter !== 'ALL' && relevantAccounts.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider shrink-0">
              Quick Accounts ({getMarketLabel(marketFilter)}):
            </span>
            <button
              onClick={() => setAdAccountFilter('ALL')}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-colors shrink-0 ${
                adAccountFilter === 'ALL'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
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
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-colors shrink-0 border ${
                    adAccountFilter === acc
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-700'
                  }`}
                >
                  {acc} <span className="opacity-75 font-normal">({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* 4. Active Filters Bar with Reset */}
        {isAnyFilterActive && (
          <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Active Filters:
              </span>

              {marketFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 text-[11px] font-semibold border border-blue-200 dark:border-blue-900">
                  <MarketFlagIcon market={marketFilter} className="w-3.5 h-2 rounded-2xs" />
                  <span>Market: {getMarketLabel(marketFilter)}</span>
                  <button onClick={() => handleMarketChange('ALL')} className="hover:opacity-75">
                    <X className="w-3 h-3 ml-0.5" />
                  </button>
                </span>
              )}

              {adAccountFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 text-[11px] font-semibold border border-teal-200 dark:border-teal-900 font-mono">
                  <span>Account: {adAccountFilter}</span>
                  <button onClick={() => setAdAccountFilter('ALL')} className="hover:opacity-75">
                    <X className="w-3 h-3 ml-0.5" />
                  </button>
                </span>
              )}

              {statusFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 text-[11px] font-semibold border border-purple-200 dark:border-purple-900">
                  <span>Status: {statusFilter}</span>
                  <button onClick={() => setStatusFilter('ALL')} className="hover:opacity-75">
                    <X className="w-3 h-3 ml-0.5" />
                  </button>
                </span>
              )}

              {searchQuery.trim() && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 text-[11px] font-semibold border border-zinc-200 dark:border-zinc-700">
                  <span>Search: &quot;{searchQuery}&quot;</span>
                  <button onClick={() => setSearchQuery('')} className="hover:opacity-75">
                    <X className="w-3 h-3 ml-0.5" />
                  </button>
                </span>
              )}
            </div>

            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Campaigns Grid */}
      <div className="flex-1 p-4 sm:p-6 max-w-7xl w-full">
        {filteredCampaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 mt-4">
            <Layers className="w-10 h-10 text-zinc-400 mb-2" />
            <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
              No campaigns match your active filters
            </h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-md">
              Try changing your market, ad account, status, or search keywords to see more results.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-bold shadow-xs hover:opacity-90 transition-opacity"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
            {filteredCampaigns.map((camp) => {
              if (!camp) return null;
              const campAdSets = safeAdSets.filter((a) => a && a.campaignName === camp.name);
              const historyCount = Array.isArray(camp.history) ? camp.history.length : 0;

              return (
                <div
                  key={camp.id}
                  className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-4.5 shadow-2xs transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div>
                    {/* Header: Market Badge + Product & Status Pill */}
                    <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-2.5 dark:border-zinc-800 mb-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <MarketBadge market={camp.market} size="sm" />
                        <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200 truncate">
                          {camp.product || 'Product'}
                        </span>
                      </div>

                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-extrabold shrink-0 shadow-2xs ${
                          camp.status === 'SCALE'
                            ? 'bg-emerald-600 text-white'
                            : camp.status === 'LIVE'
                            ? 'bg-blue-600 text-white'
                            : camp.status === 'WATCH'
                            ? 'bg-amber-500 text-white'
                            : 'bg-rose-600 text-white'
                        }`}
                      >
                        {camp.status || 'LIVE'}
                      </span>
                    </div>

                    <h3 className="font-mono text-base font-extrabold text-zinc-900 dark:text-white truncate">
                      {camp.name || 'Untitled Campaign'}
                    </h3>

                    {/* Metadata Grid */}
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] font-mono rounded-lg bg-zinc-50 dark:bg-zinc-800/60 p-2.5 border border-zinc-100 dark:border-zinc-800">
                      <div>
                        <span className="text-zinc-400 text-[10px] block uppercase">Account</span>
                        <button
                          type="button"
                          onClick={() => camp.adAccount && setAdAccountFilter(camp.adAccount)}
                          title={`Filter by account ${camp.adAccount}`}
                          className="font-bold text-zinc-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-1 group text-left"
                        >
                          <span>{camp.adAccount || '—'}</span>
                          <Filter className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity" />
                        </button>
                      </div>

                      <div>
                        <span className="text-zinc-400 text-[10px] block uppercase">Ad Sets</span>
                        <span className="font-bold text-teal-700 dark:text-teal-300">
                          {campAdSets.length} live sets
                        </span>
                      </div>

                      <div>
                        <span className="text-zinc-400 text-[10px] block uppercase">Launch Date</span>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">{camp.launchDate || '—'}</span>
                      </div>

                      <div>
                        <span className="text-zinc-400 text-[10px] block uppercase">Stage</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400 truncate block">
                          {camp.stage || 'Scale Phase'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {historyCount} event history
                    </span>

                    <button
                      onClick={() => setSelectedCampaign(camp)}
                      className="flex items-center gap-1 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 transition-colors"
                    >
                      <span>Open Campaign</span>
                      <ExternalLink className="h-3 w-3" />
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
