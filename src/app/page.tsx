'use client';

import React, { useState } from 'react';
import { usePipeline } from '@/hooks/usePipeline';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { WorkTask, Priority, WorkStatus } from '@/types';
import {
  formatTaskNumber,
  getMarketFlag,
  getPriorityMeta,
  sortTasks,
} from '@/lib/pipeline';
import { MarketBadge } from '@/components/common/MarketBadge';
import { PriorityPill } from '@/components/ui/PriorityPill';
import { NewActionModal } from '@/components/actions/NewActionModal';
import { CreativeTaskDetailModal } from '@/components/creative/CreativeTaskDetailModal';
import { CampaignDetailModal } from '@/components/campaigns/CampaignDetailModal';
import { WaitingForAccess } from '@/components/auth/WaitingForAccess';
import {
  Plus,
  Search,
  Filter,
  Layers,
  Zap,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  History,
  Rocket,
  Flame,
  Clock,
  Sparkles,
  ExternalLink,
  LayoutList,
  Table as TableIcon,
  User,
  ArrowRightLeft,
} from 'lucide-react';

export default function SmartSpreadsheetDashboard() {
  const { tasks, campaigns, adSets, settings, store } = usePipeline();
  const { currentUser, isMediaBuyer, isPendingAccess } = useAuth();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [marketFilter, setMarketFilter] = useState('ALL');
  const [productFilter, setProductFilter] = useState('ALL');
  const [ownerFilter, setOwnerFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [groupBy, setGroupBy] = useState<'none' | 'campaign' | 'product' | 'owner' | 'stage'>('none');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modals
  const [isNewActionOpen, setIsNewActionOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<WorkTask | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);

  if (isPendingAccess) {
    return <WaitingForAccess />;
  }

  // Top Counters (§11)
  const p1OpenCount = tasks.filter((t) => t.priority === 'P1' && t.status !== 'LIVE' && t.status !== 'CANCELLED').length;
  const creativeCount = tasks.filter((t) => t.stage === 'Creative').length;
  const setupCount = tasks.filter((t) => t.stage === 'Setup').length;
  const readyCount = tasks.filter((t) => t.status === 'READY').length;
  const liveCount = tasks.filter((t) => t.status === 'LIVE').length;
  const blockedCount = tasks.filter((t) => t.status === 'BLOCKED' || t.status === 'CHANGES REQUIRED').length;

  // Filter pipeline
  const filteredTasks = tasks.filter((t) => {
    if (t.status === 'CANCELLED') return false;
    if (marketFilter !== 'ALL' && t.market !== marketFilter) return false;
    if (productFilter !== 'ALL' && t.product !== productFilter) return false;
    if (ownerFilter !== 'ALL' && t.owner !== ownerFilter) return false;
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchProduct = t.product.toLowerCase().includes(q);
      const matchCamp = t.campaign.toLowerCase().includes(q);
      const matchAction = t.action.toLowerCase().includes(q);
      const matchOwner = t.owner.toLowerCase().includes(q);
      const matchAccount = t.adAccount.toLowerCase().includes(q);
      const matchNumber = formatTaskNumber(t.taskNumber).toLowerCase().includes(q);
      if (!matchProduct && !matchCamp && !matchAction && !matchOwner && !matchAccount && !matchNumber) return false;
    }
    return true;
  });

  const sorted = sortTasks(filteredTasks);

  // Grouping logic
  const groupedTasks: Record<string, WorkTask[]> = {};
  if (groupBy === 'none') {
    groupedTasks['All Tasks'] = sorted;
  } else {
    sorted.forEach((t) => {
      const key =
        groupBy === 'campaign'
          ? t.campaign
          : groupBy === 'product'
          ? t.product
          : groupBy === 'owner'
          ? t.owner
          : t.stage;
      if (!groupedTasks[key]) groupedTasks[key] = [];
      groupedTasks[key].push(t);
    });
  }

  // Inline editing handlers
  const handleInlineStatusChange = (task: WorkTask, newStatus: WorkStatus) => {
    store.updateTask(
      task.id,
      { status: newStatus },
      { uid: currentUser?.uid || 'charles-01', displayName: currentUser?.displayName || 'Charles' }
    );
    toast.success(`Task ${formatTaskNumber(task.taskNumber)} status changed to ${newStatus}`);
  };

  const handleInlinePriorityChange = (task: WorkTask, newPriority: Priority) => {
    store.updateTask(
      task.id,
      { priority: newPriority },
      { uid: currentUser?.uid || 'charles-01', displayName: currentUser?.displayName || 'Charles' }
    );
    toast.success(`Priority updated to ${newPriority}`);
  };

  const handleInlineOwnerChange = (task: WorkTask, newOwner: string) => {
    store.updateTask(
      task.id,
      { owner: newOwner },
      { uid: currentUser?.uid || 'charles-01', displayName: currentUser?.displayName || 'Charles' }
    );
    toast.success(`Owner reassigned to ${newOwner}`);
  };

  // Run next-day trigger simulation button (§16)
  const handleRunNextDayTrigger = () => {
    const targetCamp = campaigns.find((c) => c.status === 'LIVE') || campaigns[0];
    if (!targetCamp) {
      toast.error('No campaigns available to simulate next-day trigger.');
      return;
    }

    const liveAdSet =
      adSets.find((a) => a.campaignName === targetCamp.name && a.status === 'LIVE') ||
      adSets.find((a) => a.campaignName === targetCamp.name) ||
      adSets[0];
    if (!liveAdSet) {
      toast.error('No ad set available for next-day trigger simulation.');
      return;
    }

    const newTask = store.registerNextDayCreativeTrigger(
      targetCamp.name,
      liveAdSet.id,
      targetCamp.product,
      targetCamp.market,
      targetCamp.adAccount
    );

    if (newTask) {
      toast.success(
        `⚡ Next-Day Automation Triggered! Created Task ${formatTaskNumber(newTask.taskNumber)} for Yzah (${targetCamp.name}).`
      );
    } else {
      toast.info(
        `Next-day creative task for ${liveAdSet.name} already exists. Idempotency protected!`
      );
    }
  };

  const getStatusBadgeStyle = (status: WorkStatus) => {
    switch (status) {
      case 'LIVE':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'READY':
        return 'bg-teal-500/15 text-teal-400 border-teal-500/30';
      case 'APPROVED':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'FOR REVIEW':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'CHANGES REQUIRED':
      case 'BLOCKED':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'MAKING':
      case 'IN_SETUP':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      default:
        return 'bg-zinc-800/80 text-zinc-300 border-zinc-700/80';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans w-full max-w-full min-w-0">
      {/* Top Banner */}
      <div className="border-b border-zinc-200 bg-white px-3 sm:px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/95">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Media Buying Operations
              </h1>
              <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60">
                Smart Excel View
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Single source of truth: Product, Campaign, Action, Owner, Status, Deadline, and Next Action.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRunNextDayTrigger}
              className="inline-flex items-center gap-1.5 rounded-lg border border-purple-300 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-500/20 active:scale-[0.98] transition-all shadow-xs"
              title="Simulate automatic next-day creative task creation"
            >
              <Zap className="h-3.5 w-3.5 fill-current text-purple-600 dark:text-purple-400" />
              <span>Auto Next-Day Trigger</span>
            </button>

            {isMediaBuyer && (
              <button
                onClick={() => setIsNewActionOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 active:scale-[0.98] transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Action</span>
              </button>
            )}
          </div>
        </div>

        {/* 6 Clean Modern Dashboard Summary Counters */}
        <div className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/90 p-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-2xs">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-rose-500/20" />
              <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                P1 Open
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">{p1OpenCount}</span>
              <span className="text-[10px] font-medium text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-1.5 py-0.2 rounded">rush</span>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/90 p-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-2xs">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500 ring-2 ring-purple-500/20" />
              <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Creative
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">{creativeCount}</span>
              <span className="text-[10px] font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 px-1.5 py-0.2 rounded">with Yzah</span>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/90 p-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-2xs">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500 ring-2 ring-teal-500/20" />
              <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Setup
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">{setupCount}</span>
              <span className="text-[10px] font-medium text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 px-1.5 py-0.2 rounded">executing</span>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/90 p-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-2xs">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
              <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Ready
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">{readyCount}</span>
              <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-1.5 py-0.2 rounded">to launch</span>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/90 p-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-2xs">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
              <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Live
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">{liveCount}</span>
              <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-1.5 py-0.2 rounded">in Meta</span>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/90 p-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-2xs">
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${blockedCount > 0 ? 'bg-rose-500 ring-2 ring-rose-500/20 animate-pulse' : 'bg-zinc-400'}`} />
              <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Blocked
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">{blockedCount}</span>
              <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${blockedCount > 0 ? 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20' : 'text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800'}`}>
                attention
              </span>
            </div>
          </div>
        </div>

        {/* Smart Excel Spreadsheet Toolbar: Filters, Grouping, Search, View Mode */}
        <div className="mt-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 border-t border-zinc-200 pt-2.5 dark:border-zinc-800 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <Filter className="h-3 w-3" />
              <span>Filters:</span>
            </span>

            <select
              value={marketFilter}
              onChange={(e) => setMarketFilter(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-900 dark:border-zinc-700/80 dark:bg-zinc-800/90 dark:text-white focus:outline-hidden [color-scheme:dark]"
            >
              <option value="ALL" className="bg-zinc-900 text-zinc-100">All Markets</option>
              <option value="CA" className="bg-zinc-900 text-zinc-100">🇨🇦 CA</option>
              <option value="UK" className="bg-zinc-900 text-zinc-100">🇬🇧 UK</option>
              <option value="US" className="bg-zinc-900 text-zinc-100">🇺🇸 US</option>
              <option value="AUS" className="bg-zinc-900 text-zinc-100">🇦🇺 AUS</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-900 dark:border-zinc-700/80 dark:bg-zinc-800/90 dark:text-white focus:outline-hidden [color-scheme:dark]"
            >
              <option value="ALL" className="bg-zinc-900 text-zinc-100">All Priorities</option>
              <option value="P1" className="bg-zinc-900 text-zinc-100">🔥 P1</option>
              <option value="P2" className="bg-zinc-900 text-zinc-100">⏱️ P2</option>
              <option value="P3" className="bg-zinc-900 text-zinc-100">📦 P3</option>
            </select>

            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-900 dark:border-zinc-700/80 dark:bg-zinc-800/90 dark:text-white focus:outline-hidden [color-scheme:dark]"
            >
              <option value="ALL" className="bg-zinc-900 text-zinc-100">All Owners</option>
              <option value="Yzah" className="bg-zinc-900 text-zinc-100">Yzah</option>
              <option value="Karl" className="bg-zinc-900 text-zinc-100">Karl</option>
              <option value="Mark" className="bg-zinc-900 text-zinc-100">Mark</option>
              <option value="Christian" className="bg-zinc-900 text-zinc-100">Christian</option>
              <option value="Charles" className="bg-zinc-900 text-zinc-100">Charles</option>
            </select>

            <div className="flex items-center gap-1.5 pl-1 sm:pl-2 border-l border-zinc-200 dark:border-zinc-700">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider hidden sm:inline">
                Group By:
              </span>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as any)}
                style={{ colorScheme: 'dark' }}
                className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-900 dark:border-zinc-700/80 dark:bg-zinc-800/90 dark:text-white focus:outline-hidden [color-scheme:dark]"
              >
                <option value="none" className="bg-zinc-900 text-zinc-100">None (Flat Table)</option>
                <option value="campaign" className="bg-zinc-900 text-zinc-100">Campaign</option>
                <option value="product" className="bg-zinc-900 text-zinc-100">Product</option>
                <option value="owner" className="bg-zinc-900 text-zinc-100">Owner</option>
                <option value="stage" className="bg-zinc-900 text-zinc-100">Stage</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/60 p-0.5 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white font-bold shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
                title="Spreadsheet Table View"
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white font-bold shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
                title="Responsive Cards View"
              >
                <LayoutList className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search product, campaign, action, owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white py-1.5 pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700/80 dark:bg-zinc-800/90 dark:text-white focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area: Responsive Table or Cards */}
      <div className="flex-1 p-3 sm:p-5 w-full max-w-full min-w-0">
        {viewMode === 'cards' ? (
          /* Responsive Mobile & Tablet Cards View */
          <div className="space-y-6">
            {Object.entries(groupedTasks).map(([groupTitle, groupItems]) => (
              <div key={groupTitle} className="space-y-3">
                {groupBy !== 'none' && (
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-2 dark:border-zinc-800">
                    <span className="font-mono font-bold text-xs text-purple-700 dark:text-purple-300">
                      📁 {groupTitle}
                    </span>
                    <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-500">
                      {groupItems.length} tasks
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {groupItems.map((task) => {
                    const isBlocked = task.status === 'BLOCKED' || task.status === 'CHANGES REQUIRED';
                    const isLive = task.status === 'LIVE';

                    return (
                      <div
                        key={task.id}
                        className={`flex flex-col justify-between rounded-xl border p-4 shadow-2xs transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 ${
                          isBlocked
                            ? 'border-rose-200 bg-rose-50/40 dark:border-rose-900 dark:bg-rose-950/20'
                            : isLive
                            ? 'border-emerald-200 bg-emerald-50/20 dark:border-emerald-900 dark:bg-emerald-950/10'
                            : 'border-zinc-200 bg-white'
                        }`}
                      >
                        <div>
                          {/* Card Top: Number, Priority, Status Dropdown */}
                          <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-800 mb-2.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-extrabold text-zinc-900 dark:text-white">
                                {formatTaskNumber(task.taskNumber)}
                              </span>
                              <PriorityPill priority={task.priority} size="sm" />
                              <MarketBadge market={task.market} size="xs" />
                            </div>

                            <select
                              value={task.status}
                              onChange={(e) => handleInlineStatusChange(task, e.target.value as WorkStatus)}
                              style={{ colorScheme: 'dark' }}
                              className={`rounded px-2 py-0.5 text-xs font-semibold cursor-pointer border ${getStatusBadgeStyle(task.status)} [color-scheme:dark]`}
                            >
                              <option value="QUEUE" className="bg-zinc-900 text-zinc-100">QUEUE</option>
                              <option value="MAKING" className="bg-zinc-900 text-zinc-100">MAKING</option>
                              <option value="FOR REVIEW" className="bg-zinc-900 text-zinc-100">FOR REVIEW</option>
                              <option value="CHANGES REQUIRED" className="bg-zinc-900 text-zinc-100">CHANGES REQUIRED</option>
                              <option value="APPROVED" className="bg-zinc-900 text-zinc-100">APPROVED</option>
                              <option value="READY" className="bg-zinc-900 text-zinc-100">READY</option>
                              <option value="IN_SETUP" className="bg-zinc-900 text-zinc-100">IN_SETUP</option>
                              <option value="QA" className="bg-zinc-900 text-zinc-100">QA</option>
                              <option value="LIVE" className="bg-zinc-900 text-zinc-100">LIVE</option>
                              <option value="BLOCKED" className="bg-zinc-900 text-zinc-100">BLOCKED</option>
                            </select>
                          </div>

                          {/* Product & Campaign */}
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                              {task.product}
                            </span>
                            <h3 className="font-mono text-sm font-extrabold text-teal-800 dark:text-teal-300 truncate">
                              {task.campaign}
                            </h3>
                          </div>

                          {/* Action Pill & Ad Account */}
                          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                            <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 font-semibold text-zinc-800 dark:text-zinc-200 text-xs">
                              {task.action}
                            </span>
                            <span className="font-mono text-[11px] text-zinc-500 bg-zinc-50 dark:bg-zinc-800/60 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                              {task.adAccount}
                            </span>
                          </div>

                          {/* Next Action & Deadline */}
                          <div className="mt-3 rounded bg-zinc-50 dark:bg-zinc-800/50 p-2 text-xs border border-zinc-100 dark:border-zinc-800">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase block">Next Action</span>
                            <p className="text-zinc-800 dark:text-zinc-200 font-medium line-clamp-2 mt-0.5">
                              {task.nextAction || 'Pending review'}
                            </p>
                            <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                              <span>Due: {task.deadline}</span>
                              <span className="font-bold text-blue-600 dark:text-blue-400">{task.stage}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer: Owner Selector & Open Detail Button */}
                        <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold">
                            <span className="text-[11px] text-zinc-400">Owner:</span>
                            <select
                              value={task.owner}
                              onChange={(e) => handleInlineOwnerChange(task, e.target.value)}
                              style={{ colorScheme: 'dark' }}
                              className="rounded-md bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 cursor-pointer focus:outline-hidden [color-scheme:dark]"
                            >
                              <option value="Yzah" className="bg-zinc-900 text-zinc-100">Yzah (Creative)</option>
                              <option value="Karl" className="bg-zinc-900 text-zinc-100">Karl (Setup)</option>
                              <option value="Mark" className="bg-zinc-900 text-zinc-100">Mark (Setup)</option>
                              <option value="Christian" className="bg-zinc-900 text-zinc-100">Christian (Setup)</option>
                              <option value="Charles" className="bg-zinc-900 text-zinc-100">Charles (Media Buyer)</option>
                            </select>
                          </div>

                          <button
                            onClick={() => setSelectedTask(task)}
                            className="rounded bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-3 py-1 text-xs font-bold transition-colors hover:bg-zinc-800 dark:hover:bg-zinc-100 shadow-2xs"
                          >
                            Open Details
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Spreadsheet Table View (with guaranteed horizontal touch scrolling & indicator) */
          <div className="w-full max-w-full min-w-0 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 px-1">
              <div className="flex items-center gap-1.5 font-medium">
                <ArrowRightLeft className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                <span>Scroll table horizontally to view all 12 columns</span>
              </div>
              <span className="font-mono text-[10px] bg-zinc-200/70 dark:bg-zinc-800/80 px-2 py-0.5 rounded text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700/60">
                {filteredTasks.length} tasks
              </span>
            </div>

            <div className="w-full max-w-full min-w-0 overflow-x-auto overscroll-x-contain touch-pan-x rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/95 shadow-xs custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
                <thead className="border-b border-zinc-200 bg-zinc-100/90 dark:border-zinc-800 dark:bg-zinc-800/90 font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider text-[10px] sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3 border-r border-zinc-200 dark:border-zinc-800">Priority</th>
                    <th className="py-2.5 px-2.5 border-r border-zinc-200 dark:border-zinc-800">Mkt</th>
                    <th className="py-2.5 px-3 border-r border-zinc-200 dark:border-zinc-800">Product</th>
                    <th className="py-2.5 px-3 border-r border-zinc-200 dark:border-zinc-800">Campaign</th>
                    <th className="py-2.5 px-3 border-r border-zinc-200 dark:border-zinc-800">Ad Account</th>
                    <th className="py-2.5 px-3 border-r border-zinc-200 dark:border-zinc-800">Current Action</th>
                    <th className="py-2.5 px-3 border-r border-zinc-200 dark:border-zinc-800">Owner</th>
                    <th className="py-2.5 px-2.5 border-r border-zinc-200 dark:border-zinc-800">Stage</th>
                    <th className="py-2.5 px-3 border-r border-zinc-200 dark:border-zinc-800">Deadline</th>
                    <th className="py-2.5 px-3 border-r border-zinc-200 dark:border-zinc-800">Status</th>
                    <th className="py-2.5 px-3 border-r border-zinc-200 dark:border-zinc-800">Next Action</th>
                    <th className="py-2.5 px-3 text-right">Details</th>
                  </tr>
                </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {Object.entries(groupedTasks).map(([groupTitle, groupItems]) => (
                  <React.Fragment key={groupTitle}>
                    {groupBy !== 'none' && (
                      <tr className="bg-zinc-100/60 dark:bg-zinc-800/60 font-bold text-xs text-zinc-800 dark:text-zinc-200">
                        <td colSpan={12} className="py-2 px-3 border-y border-zinc-200 dark:border-zinc-700">
                          <span className="font-mono text-purple-700 dark:text-purple-300">📁 {groupTitle}</span> ({groupItems.length} active tasks)
                        </td>
                      </tr>
                    )}

                    {groupItems.map((task) => {
                      const isBlocked = task.status === 'BLOCKED' || task.status === 'CHANGES REQUIRED';
                      const isLive = task.status === 'LIVE';

                      return (
                        <tr
                          key={task.id}
                          className={`transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 ${
                            isBlocked
                              ? 'bg-rose-50/40 dark:bg-rose-950/20'
                              : isLive
                              ? 'bg-emerald-50/20 dark:bg-emerald-950/10'
                              : ''
                          }`}
                        >
                          {/* Priority with inline edit */}
                          <td className="py-2.5 px-3 border-r border-zinc-200 dark:border-zinc-800 whitespace-nowrap">
                            <select
                              value={task.priority}
                              onChange={(e) => handleInlinePriorityChange(task, e.target.value as Priority)}
                              style={{ colorScheme: 'dark' }}
                              className="rounded-md bg-zinc-100 dark:bg-zinc-800/90 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700/80 px-1.5 py-0.5 font-bold text-xs cursor-pointer focus:outline-hidden [color-scheme:dark]"
                            >
                              <option value="P1" className="bg-zinc-900 text-zinc-100">🔥 P1</option>
                              <option value="P2" className="bg-zinc-900 text-zinc-100">⏱️ P2</option>
                              <option value="P3" className="bg-zinc-900 text-zinc-100">📦 P3</option>
                            </select>
                          </td>

                          {/* Market */}
                          <td className="py-2.5 px-2.5 border-r border-zinc-200 dark:border-zinc-800 font-medium whitespace-nowrap">
                            {task.market}
                          </td>

                          {/* Product */}
                          <td className="py-2.5 px-3 border-r border-zinc-200 dark:border-zinc-800 font-bold text-zinc-900 dark:text-white whitespace-nowrap">
                            {task.product}
                          </td>

                          {/* Campaign */}
                          <td className="py-2.5 px-3 border-r border-zinc-200 dark:border-zinc-800 font-mono font-bold text-teal-800 dark:text-teal-300 whitespace-nowrap">
                            <button
                              onClick={() => {
                                const c = campaigns.find((camp) => camp.name === task.campaign);
                                if (c) setSelectedCampaign(c);
                              }}
                              className="hover:underline text-left truncate max-w-[180px] block"
                              title={task.campaign}
                            >
                              {task.campaign}
                            </button>
                          </td>

                          {/* Ad Account */}
                          <td className="py-2.5 px-3 border-r border-zinc-200 dark:border-zinc-800 font-mono text-[11px] font-bold text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                            {task.adAccount}
                          </td>

                          {/* Current Action */}
                          <td className="py-2.5 px-3 border-r border-zinc-200 dark:border-zinc-800 whitespace-nowrap">
                            <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 font-semibold text-zinc-800 dark:text-zinc-200 text-[11px]">
                              {task.action}
                            </span>
                          </td>

                          {/* Owner with inline edit */}
                          <td className="py-2.5 px-3 border-r border-zinc-200 dark:border-zinc-800 whitespace-nowrap font-semibold">
                            <select
                              value={task.owner}
                              onChange={(e) => handleInlineOwnerChange(task, e.target.value)}
                              style={{ colorScheme: 'dark' }}
                              className="rounded-md bg-zinc-100 dark:bg-zinc-800/90 text-xs font-semibold text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700/80 px-2 py-1 cursor-pointer focus:outline-hidden [color-scheme:dark]"
                            >
                              <option value="Yzah" className="bg-zinc-900 text-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 py-1">Yzah (Creative)</option>
                              <option value="Karl" className="bg-zinc-900 text-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 py-1">Karl (Setup)</option>
                              <option value="Mark" className="bg-zinc-900 text-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 py-1">Mark (Setup)</option>
                              <option value="Christian" className="bg-zinc-900 text-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 py-1">Christian (Setup)</option>
                              <option value="Charles" className="bg-zinc-900 text-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 py-1">Charles (Media Buyer)</option>
                            </select>
                          </td>

                          {/* Stage */}
                          <td className="py-2.5 px-2.5 border-r border-zinc-200 dark:border-zinc-800 whitespace-nowrap">
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-semibold border ${
                                task.stage === 'Creative'
                                  ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/20'
                                  : task.stage === 'Setup'
                                  ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-500/20'
                                  : task.stage === 'Live'
                                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20'
                                  : task.stage === 'Blocked'
                                  ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/20'
                                  : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20'
                              }`}
                            >
                              {task.stage}
                            </span>
                          </td>

                          {/* Deadline */}
                          <td className="py-2.5 px-3 border-r border-zinc-200 dark:border-zinc-800 font-mono text-[11px] whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                            {task.deadline}
                          </td>

                          {/* Status with inline edit */}
                          <td className="py-2.5 px-3 border-r border-zinc-200 dark:border-zinc-800 whitespace-nowrap">
                            <select
                              value={task.status}
                              onChange={(e) => handleInlineStatusChange(task, e.target.value as WorkStatus)}
                              style={{ colorScheme: 'dark' }}
                              className={`rounded-md px-2 py-0.5 text-xs font-semibold cursor-pointer border ${getStatusBadgeStyle(task.status)} focus:outline-hidden [color-scheme:dark]`}
                            >
                              <option value="QUEUE" className="bg-zinc-900 text-zinc-100">QUEUE</option>
                              <option value="MAKING" className="bg-zinc-900 text-zinc-100">MAKING</option>
                              <option value="FOR REVIEW" className="bg-zinc-900 text-zinc-100">FOR REVIEW</option>
                              <option value="CHANGES REQUIRED" className="bg-zinc-900 text-zinc-100">CHANGES REQUIRED</option>
                              <option value="APPROVED" className="bg-zinc-900 text-zinc-100">APPROVED</option>
                              <option value="READY" className="bg-zinc-900 text-zinc-100">READY</option>
                              <option value="IN_SETUP" className="bg-zinc-900 text-zinc-100">IN_SETUP</option>
                              <option value="QA" className="bg-zinc-900 text-zinc-100">QA</option>
                              <option value="LIVE" className="bg-zinc-900 text-zinc-100">LIVE</option>
                              <option value="BLOCKED" className="bg-zinc-900 text-zinc-100">BLOCKED</option>
                            </select>
                          </td>

                          {/* Next Action (§2) */}
                          <td className="py-2.5 px-3 border-r border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-300 truncate max-w-[220px]">
                            {task.nextAction}
                          </td>

                          {/* Action Details Button */}
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <button
                              onClick={() => setSelectedTask(task)}
                              className="rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700/60 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 transition-colors shadow-2xs"
                            >
                              Open
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>

      {/* Modals */}
      {isNewActionOpen && (
        <NewActionModal
          isOpen={isNewActionOpen}
          onClose={() => setIsNewActionOpen(false)}
        />
      )}

      {selectedTask && (
        <CreativeTaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {selectedCampaign && (
        <CampaignDetailModal
          campaign={selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
          onNewAction={(actionName, campaignName) => {
            setIsNewActionOpen(true);
          }}
        />
      )}
    </div>
  );
}
