'use client';

import React, { useState } from 'react';
import { Campaign, CampaignStatus } from '@/types';
import { usePipeline } from '@/hooks/usePipeline';
import { useToast } from '@/context/ToastContext';
import { getMarketFlag, getDaysLive } from '@/lib/pipeline';
import { MarketBadge } from '@/components/common/MarketBadge';
import {
  X,
  Layers,
  TrendingUp,
  PlusCircle,
  Copy,
  Check,
  History,
  Rocket,
  AlertTriangle,
  Flame,
  Calendar,
  DollarSign,
  Trash2,
} from 'lucide-react';

interface CampaignDetailModalProps {
  campaign: Campaign | null;
  onClose: () => void;
  onNewAction?: (actionName: any, campaignName: string) => void;
}

export const CampaignDetailModal: React.FC<CampaignDetailModalProps> = ({
  campaign,
  onClose,
  onNewAction,
}) => {
  const { adSets, store } = usePipeline();
  const { toast } = useToast();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!campaign) return null;

  const campaignAdSets = adSets.filter((a) => a.campaignName === campaign.name);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.info(`Copied: "${text}"`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleStatusChange = (newStatus: CampaignStatus) => {
    store.updateCampaignStatus(campaign.id, newStatus, 'Charles');
    toast.success(`Campaign status changed to ${newStatus}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 sm:p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2.5">
              <MarketBadge market={campaign.market} size="sm" />
              <h2 className="text-lg font-mono font-extrabold text-zinc-900 dark:text-white">
                {campaign.name}
              </h2>
              <button
                type="button"
                onClick={() => copyText(campaign.name, 'camp-name')}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                {copiedKey === 'camp-name' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <span>Product: <strong className="text-zinc-800 dark:text-zinc-200">{campaign.product}</strong></span>
              <span>•</span>
              <span>Account: <strong className="text-zinc-800 dark:text-zinc-200">{campaign.adAccount}</strong></span>
              <span>•</span>
              <span>Launch: <strong className="text-zinc-800 dark:text-zinc-200">{campaign.launchDate}</strong></span>
              <span>•</span>
              <span>Stage: <strong className="text-blue-600 dark:text-blue-400">{campaign.stage}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={campaign.status}
              onChange={(e) => handleStatusChange(e.target.value as CampaignStatus)}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold border transition-colors ${
                campaign.status === 'SCALE'
                  ? 'bg-emerald-600 text-white border-emerald-700'
                  : campaign.status === 'LIVE'
                  ? 'bg-blue-600 text-white border-blue-700'
                  : campaign.status === 'WATCH'
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'bg-rose-600 text-white border-rose-700'
              }`}
            >
              <option value="LIVE">LIVE</option>
              <option value="SCALE">SCALE</option>
              <option value="WATCH">WATCH</option>
              <option value="PAUSE">PAUSE</option>
              <option value="KILL">KILL</option>
            </select>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (confirm('WARNING: Are you sure you want to delete this campaign?')) {
                    store.deleteCampaign(campaign.id);
                    onClose();
                    toast.success('Campaign deleted');
                  }
                }}
                className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors"
                title="Delete Campaign"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons (§12) */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              onClose();
              if (onNewAction) onNewAction('ADD NEW AD SET', campaign.name);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-teal-700"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>+ ADD AD SET</span>
          </button>

          <button
            onClick={() => {
              onClose();
              if (onNewAction) onNewAction('LAUNCH NEW CREATIVE BATCH', campaign.name);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-purple-700"
          >
            <Flame className="h-3.5 w-3.5" />
            <span>+ REQUEST CREATIVES</span>
          </button>

          <button
            onClick={() => {
              onClose();
              if (onNewAction) onNewAction('LAUNCH WINNER ITERATIONS', campaign.name);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-zinc-700 dark:bg-zinc-700"
          >
            <span>+ NEW ITERATION</span>
          </button>

          <button
            onClick={() => handleStatusChange('SCALE')}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>SCALE</span>
          </button>

          <button
            onClick={() => handleStatusChange('KILL')}
            className="flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>KILL / PAUSE</span>
          </button>
        </div>

        {/* Ad Sets Section (§14) */}
        <div className="mt-5">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2 dark:border-zinc-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-600" />
              <span>Ad Sets in this Campaign ({campaignAdSets.length})</span>
            </h3>
          </div>

          <div className="mt-3 space-y-2">
            {campaignAdSets.length === 0 ? (
              <p className="text-xs text-zinc-400 py-4 text-center">No ad sets launched yet.</p>
            ) : (
              campaignAdSets.map((adSet) => {
                return (
                  <div
                    key={adSet.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border border-zinc-200 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-800/40 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-zinc-900 dark:text-white">
                          {adSet.name}
                        </span>
                        <span className="rounded bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                          {adSet.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        Type: <strong className="text-zinc-700 dark:text-zinc-300">{adSet.creativeType}</strong> • Launch Date: {adSet.launchDate} • Setup by {adSet.assignedSetupUser}
                      </div>
                      {adSet.notes && (
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1 italic">
                          Notes: {adSet.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete ad set "${adSet.name}"?`)) {
                            store.deleteAdSet(adSet.id);
                            toast.success('Ad set deleted');
                          }
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-red-500 hover:text-red-700 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => copyText(adSet.name, `adset-${adSet.id}`)}
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                      >
                        {copiedKey === `adset-${adSet.id}` ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        <span>Copy Name</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chronological History (§13: Activity Events) */}
        <div className="mt-6">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2 dark:border-zinc-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <History className="h-4 w-4 text-purple-600" />
              <span>Campaign Chronological History</span>
            </h3>
            <span className="text-[10px] text-zinc-400 font-mono">Automated Activity Log</span>
          </div>

          <div className="mt-3 relative pl-4 border-l-2 border-zinc-200 dark:border-zinc-800 space-y-3 text-xs">
            {campaign.history.length === 0 ? (
              <p className="text-xs text-zinc-400 py-2">No history recorded yet.</p>
            ) : (
              campaign.history.map((ev, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-purple-600 ring-4 ring-white dark:ring-zinc-900" />
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[10px] font-bold text-purple-600 dark:text-purple-400">
                      {ev.at}
                    </span>
                    <span className="font-bold text-zinc-900 dark:text-white">
                      {ev.action}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      by {ev.userDisplayName || 'Charles'}
                    </span>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 mt-0.5 leading-snug">
                    {ev.detail}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
