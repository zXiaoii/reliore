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
  const [tableDensity, setTableDensity] = useState<'fit' | 'relaxed'>('fit');

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
    <div className="flex flex-col min-h-screen bg-black text-[#ededed] font-sans w-full max-w-full min-w-0">
      {/* Top Banner - Vercel Theme */}
      <div className="border-b border-[#1f1f1f] bg-black px-3 sm:px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                Media Buying Operations
              </h1>
              <span className="rounded-md bg-[#121212] px-2 py-0.5 text-xs font-mono font-semibold text-zinc-300 border border-[#262626]">
                Pipeline SSOT
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Single source of truth: Product, Campaign, Action, Owner, Status, Deadline, and Next Action.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRunNextDayTrigger}
              className="vercel-btn-secondary flex items-center gap-1.5 cursor-pointer"
              title="Simulate automatic next-day creative task creation"
            >
              <Zap className="h-3.5 w-3.5 text-purple-400" />
              <span>Next-Day Trigger</span>
            </button>

            {isMediaBuyer && (
              <button
                onClick={() => setIsNewActionOpen(true)}
                className="vercel-btn-primary flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-black" />
                <span>New Action</span>
              </button>
            )}
          </div>
        </div>

        {/* 6 Clean Modern Dashboard Summary Counters (Vercel Metric Widgets) */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <div className="vercel-card p-3">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-rose-500/20" />
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                P1 Open
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-white">{p1OpenCount}</span>
              <span className="text-[10px] font-mono font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.2 rounded">rush</span>
            </div>
          </div>

          <div className="vercel-card p-3">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500 ring-2 ring-purple-500/20" />
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                Creative
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-white">{creativeCount}</span>
              <span className="text-[10px] font-mono font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.2 rounded">Yzah</span>
            </div>
          </div>

          <div className="vercel-card p-3">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500 ring-2 ring-teal-500/20" />
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                Setup
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-white">{setupCount}</span>
              <span className="text-[10px] font-mono font-semibold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-1.5 py-0.2 rounded">Karl</span>
            </div>
          </div>

          <div className="vercel-card p-3">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                Ready
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-white">{readyCount}</span>
              <span className="text-[10px] font-mono font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded">ready</span>
            </div>
          </div>

          <div className="vercel-card p-3">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                Live
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-white">{liveCount}</span>
              <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">Meta</span>
            </div>
          </div>

          <div className="vercel-card p-3">
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${blockedCount > 0 ? 'bg-rose-500 ring-2 ring-rose-500/20 animate-pulse' : 'bg-zinc-600'}`} />
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                Blocked
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-white">{blockedCount}</span>
              <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded ${blockedCount > 0 ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20' : 'text-zinc-500 bg-[#141414]'}`}>
                blockers
              </span>
            </div>
          </div>
        </div>

        {/* Smart Spreadsheet Toolbar: Filters, Grouping, Search, View Mode (Vercel Style) */}
        <div className="mt-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 border-t border-[#1f1f1f] pt-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1 font-mono">
              <Filter className="h-3 w-3 text-zinc-400" />
              <span>Filters:</span>
            </span>

            <select
              value={marketFilter}
              onChange={(e) => setMarketFilter(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className="rounded-md border border-[#262626] bg-black px-2.5 py-1.5 text-xs font-semibold text-zinc-200 focus:border-zinc-500 focus:outline-hidden [color-scheme:dark] hover:border-[#444] transition-colors cursor-pointer"
            >
              <option value="ALL" className="bg-black text-zinc-100">All Markets</option>
              <option value="CA" className="bg-black text-zinc-100">🇨🇦 CA</option>
              <option value="UK" className="bg-black text-zinc-100">🇬🇧 UK</option>
              <option value="US" className="bg-black text-zinc-100">🇺🇸 US</option>
              <option value="AUS" className="bg-black text-zinc-100">🇦🇺 AUS</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className="rounded-md border border-[#262626] bg-black px-2.5 py-1.5 text-xs font-semibold text-zinc-200 focus:border-zinc-500 focus:outline-hidden [color-scheme:dark] hover:border-[#444] transition-colors cursor-pointer"
            >
              <option value="ALL" className="bg-black text-zinc-100">All Priorities</option>
              <option value="P1" className="bg-black text-zinc-100">🔥 P1</option>
              <option value="P2" className="bg-black text-zinc-100">⏱️ P2</option>
              <option value="P3" className="bg-black text-zinc-100">📦 P3</option>
            </select>

            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className="rounded-md border border-[#262626] bg-black px-2.5 py-1.5 text-xs font-semibold text-zinc-200 focus:border-zinc-500 focus:outline-hidden [color-scheme:dark] hover:border-[#444] transition-colors cursor-pointer"
            >
              <option value="ALL" className="bg-black text-zinc-100">All Owners</option>
              <option value="Yzah" className="bg-black text-zinc-100">Yzah (Creative)</option>
              <option value="Karl" className="bg-black text-zinc-100">Karl (Setup)</option>
              <option value="Mark" className="bg-black text-zinc-100">Mark (Setup)</option>
              <option value="Christian" className="bg-black text-zinc-100">Christian (Setup)</option>
              <option value="Charles" className="bg-black text-zinc-100">Charles (Buyer)</option>
            </select>

            <div className="flex items-center gap-1.5 pl-1 sm:pl-2 border-l border-[#262626]">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider hidden sm:inline font-mono">
                Group:
              </span>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as any)}
                style={{ colorScheme: 'dark' }}
                className="rounded-md border border-[#262626] bg-black px-2.5 py-1.5 text-xs font-semibold text-zinc-200 focus:border-zinc-500 focus:outline-hidden [color-scheme:dark] hover:border-[#444] transition-colors cursor-pointer"
              >
                <option value="none" className="bg-black text-zinc-100">None (Flat)</option>
                <option value="campaign" className="bg-black text-zinc-100">Campaign</option>
                <option value="product" className="bg-black text-zinc-100">Product</option>
                <option value="owner" className="bg-black text-zinc-100">Owner</option>
                <option value="stage" className="bg-black text-zinc-100">Stage</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-md bg-black border border-[#262626] p-0.5 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-[#181818] text-white border border-[#383838] font-semibold shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Spreadsheet Table View"
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-[#181818] text-white border border-[#383838] font-semibold shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Responsive Cards View"
              >
                <LayoutList className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
            </div>

            {/* Vercel Search Box with / Keyboard Badge */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search pipeline..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-[#262626] bg-black py-1.5 pl-8 pr-8 text-xs text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-hidden transition-colors"
              />
              <span className="absolute right-2 top-2 vercel-kbd">/</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area: Responsive Table or Cards */}
      <div className="flex-1 p-3 sm:p-6 w-full max-w-full min-w-0">
        {viewMode === 'cards' ? (
          /* Responsive Mobile & Tablet Cards View (Vercel Cards) */
          <div className="space-y-6">
            {Object.entries(groupedTasks).map(([groupTitle, groupItems]) => (
              <div key={groupTitle} className="space-y-3">
                {groupBy !== 'none' && (
                  <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-2">
                    <span className="font-mono font-bold text-xs text-white">
                      📁 {groupTitle}
                    </span>
                    <span className="rounded-full bg-[#141414] border border-[#262626] px-2 py-0.5 text-[10px] font-mono text-zinc-400">
                      {groupItems.length} tasks
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {groupItems.map((task) => {
                    const isBlocked = task.status === 'BLOCKED' || task.status === 'CHANGES REQUIRED';
                    const isLive = task.status === 'LIVE';

                    return (
                      <div
                        key={task.id}
                        className={`vercel-card p-4 flex flex-col justify-between group ${
                          isBlocked
                            ? 'border-rose-900/60 bg-rose-950/10'
                            : isLive
                            ? 'border-emerald-900/60 bg-emerald-950/10'
                            : ''
                        }`}
                      >
                        <div>
                          {/* Card Top: Number, Priority, Status Dropdown */}
                          <div className="flex items-center justify-between gap-2 border-b border-[#1f1f1f] pb-2.5 mb-2.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold text-white">
                                {formatTaskNumber(task.taskNumber)}
                              </span>
                              <PriorityPill priority={task.priority} size="sm" />
                              <MarketBadge market={task.market} size="xs" />
                            </div>

                            <select
                              value={task.status}
                              onChange={(e) => handleInlineStatusChange(task, e.target.value as WorkStatus)}
                              style={{ colorScheme: 'dark' }}
                              className={`rounded px-2 py-0.5 text-xs font-semibold cursor-pointer border bg-black ${getStatusBadgeStyle(task.status)} [color-scheme:dark]`}
                            >
                              <option value="QUEUE" className="bg-black text-zinc-100">QUEUE</option>
                              <option value="MAKING" className="bg-black text-zinc-100">MAKING</option>
                              <option value="FOR REVIEW" className="bg-black text-zinc-100">FOR REVIEW</option>
                              <option value="CHANGES REQUIRED" className="bg-black text-zinc-100">CHANGES REQUIRED</option>
                              <option value="APPROVED" className="bg-black text-zinc-100">APPROVED</option>
                              <option value="READY" className="bg-black text-zinc-100">READY</option>
                              <option value="IN_SETUP" className="bg-black text-zinc-100">IN_SETUP</option>
                              <option value="QA" className="bg-black text-zinc-100">QA</option>
                              <option value="LIVE" className="bg-black text-zinc-100">LIVE</option>
                              <option value="BLOCKED" className="bg-black text-zinc-100">BLOCKED</option>
                            </select>
                          </div>

                          {/* Product & Campaign */}
                          <div className="space-y-0.5">
                            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                              {task.product}
                            </span>
                            <h3 className="font-mono text-sm font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                              {task.campaign}
                            </h3>
                          </div>

                          {/* Action Pill & Ad Account */}
                          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                            <span className="rounded bg-[#141414] border border-[#262626] px-2 py-0.5 font-semibold text-zinc-200 text-xs">
                              {task.action}
                            </span>
                            <span className="font-mono text-[11px] text-zinc-400 bg-black px-2 py-0.5 rounded border border-[#222222]">
                              {task.adAccount}
                            </span>
                          </div>

                          {/* Next Action & Deadline */}
                          <div className="mt-3 rounded-lg bg-black border border-[#1f1f1f] p-2.5 text-xs">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase block font-mono">Next Action</span>
                            <p className="text-zinc-300 font-medium line-clamp-2 mt-0.5">
                              {task.nextAction || 'Pending review'}
                            </p>
                            <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400 font-mono pt-1.5 border-t border-[#181818]">
                              <span>Due: {task.deadline}</span>
                              <span className="font-bold text-white">{task.stage}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer: Owner Selector & Open Detail Button */}
                        <div className="mt-3.5 pt-3 border-t border-[#1f1f1f] flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold">
                            <span className="text-[11px] text-zinc-500 font-mono">Owner:</span>
                            <select
                              value={task.owner}
                              onChange={(e) => handleInlineOwnerChange(task, e.target.value)}
                              style={{ colorScheme: 'dark' }}
                              className="rounded-md bg-black text-xs font-semibold text-zinc-200 border border-[#262626] px-2 py-1 cursor-pointer focus:outline-hidden [color-scheme:dark] hover:border-[#444] transition-colors"
                            >
                              <option value="Yzah" className="bg-black text-zinc-100">Yzah (Creative)</option>
                              <option value="Karl" className="bg-black text-zinc-100">Karl (Setup)</option>
                              <option value="Mark" className="bg-black text-zinc-100">Mark (Setup)</option>
                              <option value="Christian" className="bg-black text-zinc-100">Christian (Setup)</option>
                              <option value="Charles" className="bg-black text-zinc-100">Charles (Buyer)</option>
                            </select>
                          </div>

                          <button
                            onClick={() => setSelectedTask(task)}
                            className="vercel-btn-secondary py-1 px-3 text-xs cursor-pointer"
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
          /* Spreadsheet Table View (Vercel Style) */
          <div className="w-full max-w-full min-w-0 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400 px-1">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold font-mono text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {tableDensity === 'fit' ? 'FIT TO SCREEN' : 'RELAXED'}
                </span>
                <span className="hidden sm:inline text-zinc-500">·</span>
                <span className="hidden sm:inline text-zinc-400">
                  {tableDensity === 'fit' ? 'All 12 columns visible without scrolling' : 'Wide columns with horizontal scroll enabled'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-md bg-black border border-[#262626] p-0.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setTableDensity('fit')}
                    className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                      tableDensity === 'fit'
                        ? 'bg-[#1e1e1e] text-white border border-[#383838] font-semibold shadow-2xs'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                    title="Fit all columns to screen without horizontal scrolling"
                  >
                    Fit Screen
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableDensity('relaxed')}
                    className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                      tableDensity === 'relaxed'
                        ? 'bg-[#1e1e1e] text-white border border-[#383838] font-semibold shadow-2xs'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                    title="Relaxed wider columns with horizontal scroll"
                  >
                    Relaxed
                  </button>
                </div>
                <span className="font-mono text-[10px] bg-[#121212] px-2 py-0.5 rounded text-zinc-400 border border-[#262626]">
                  {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
                </span>
              </div>
            </div>

            <div className={`w-full max-w-full min-w-0 rounded-xl border border-[#222222] bg-[#0a0a0a] shadow-xs custom-scrollbar ${tableDensity === 'fit' ? 'overflow-x-auto lg:overflow-x-visible' : 'overflow-x-auto overscroll-x-contain'}`}>
              <table className={`w-full text-left text-xs border-collapse ${tableDensity === 'fit' ? 'w-full' : 'min-w-[1100px]'}`}>
                <thead className="border-b border-[#222222] bg-black font-semibold text-zinc-400 uppercase tracking-wider text-[10px] sticky top-0">
                  <tr>
                    <th className={`${tableDensity === 'fit' ? 'w-[48px] py-2 px-1.5' : 'py-2.5 px-3'} border-r border-[#1f1f1f]`}>Priority</th>
                    <th className={`${tableDensity === 'fit' ? 'w-[52px] py-2 px-1.5' : 'py-2.5 px-2.5'} border-r border-[#1f1f1f]`}>Mkt</th>
                    <th className={`${tableDensity === 'fit' ? 'w-[82px] py-2 px-2' : 'py-2.5 px-3'} border-r border-[#1f1f1f]`}>Product</th>
                    <th className={`${tableDensity === 'fit' ? 'w-[140px] py-2 px-2' : 'py-2.5 px-3'} border-r border-[#1f1f1f]`}>Campaign</th>
                    <th className={`${tableDensity === 'fit' ? 'w-[68px] py-2 px-1.5' : 'py-2.5 px-3'} border-r border-[#1f1f1f]`}>Account</th>
                    <th className={`${tableDensity === 'fit' ? 'w-[105px] py-2 px-1.5' : 'py-2.5 px-3'} border-r border-[#1f1f1f]`}>Action</th>
                    <th className={`${tableDensity === 'fit' ? 'w-[76px] py-2 px-1.5' : 'py-2.5 px-3'} border-r border-[#1f1f1f]`}>Owner</th>
                    <th className={`${tableDensity === 'fit' ? 'w-[54px] py-2 px-1 text-center' : 'py-2.5 px-2.5'} border-r border-[#1f1f1f]`}>Stage</th>
                    <th className={`${tableDensity === 'fit' ? 'w-[72px] py-2 px-1.5' : 'py-2.5 px-3'} border-r border-[#1f1f1f]`}>Deadline</th>
                    <th className={`${tableDensity === 'fit' ? 'w-[105px] py-2 px-1.5' : 'py-2.5 px-3'} border-r border-[#1f1f1f]`}>Status</th>
                    <th className={`${tableDensity === 'fit' ? 'py-2 px-2 min-w-[110px]' : 'py-2.5 px-3'} border-r border-[#1f1f1f]`}>Next Action</th>
                    <th className={`${tableDensity === 'fit' ? 'w-[44px] py-2 px-1 text-center' : 'py-2.5 px-3 text-right'}`}>Open</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]">
                  {Object.entries(groupedTasks).map(([groupTitle, groupItems]) => (
                    <React.Fragment key={groupTitle}>
                      {groupBy !== 'none' && (
                        <tr className="bg-[#121212] font-semibold text-xs text-white">
                          <td colSpan={12} className="py-2 px-3 border-y border-[#262626]">
                            <span className="font-mono text-white">📁 {groupTitle}</span> ({groupItems.length} active tasks)
                          </td>
                        </tr>
                      )}

                      {groupItems.map((task) => {
                        const isBlocked = task.status === 'BLOCKED' || task.status === 'CHANGES REQUIRED';
                        const isLive = task.status === 'LIVE';

                        return (
                          <tr
                            key={task.id}
                            className={`transition-colors hover:bg-[#141414] ${
                              isBlocked
                                ? 'bg-rose-950/15'
                                : isLive
                                ? 'bg-emerald-950/15'
                                : 'bg-[#0a0a0a]'
                            }`}
                          >
                            {/* Priority with inline edit */}
                            <td className={`${tableDensity === 'fit' ? 'py-1.5 px-1' : 'py-2.5 px-3'} border-r border-[#1a1a1a] whitespace-nowrap`}>
                              <select
                                value={task.priority}
                                onChange={(e) => handleInlinePriorityChange(task, e.target.value as Priority)}
                                style={{ colorScheme: 'dark' }}
                                className="w-full rounded-md bg-black text-zinc-200 border border-[#262626] px-1 py-0.5 font-bold text-[11px] cursor-pointer focus:outline-hidden [color-scheme:dark] hover:border-[#444] transition-colors"
                              >
                                <option value="P1" className="bg-black text-zinc-100">🔥 P1</option>
                                <option value="P2" className="bg-black text-zinc-100">⏱️ P2</option>
                                <option value="P3" className="bg-black text-zinc-100">📦 P3</option>
                              </select>
                            </td>

                            {/* Market with SVG flag */}
                            <td className={`${tableDensity === 'fit' ? 'py-1.5 px-1' : 'py-2.5 px-2.5'} border-r border-[#1a1a1a] whitespace-nowrap`}>
                              <MarketBadge market={task.market} size="xs" shortCode={tableDensity === 'fit'} />
                            </td>

                            {/* Product */}
                            <td className={`${tableDensity === 'fit' ? 'py-1.5 px-1.5' : 'py-2.5 px-3'} border-r border-[#1a1a1a] font-semibold text-white whitespace-nowrap`}>
                              <span className="truncate block max-w-[80px]" title={task.product}>
                                {task.product}
                              </span>
                            </td>

                            {/* Campaign */}
                            <td className={`${tableDensity === 'fit' ? 'py-1.5 px-1.5' : 'py-2.5 px-3'} border-r border-[#1a1a1a] font-mono font-bold text-white hover:text-purple-300 whitespace-nowrap`}>
                              <button
                                onClick={() => {
                                  const c = campaigns.find((camp) => camp.name === task.campaign);
                                  if (c) setSelectedCampaign(c);
                                }}
                                className="hover:underline text-left truncate max-w-[135px] block cursor-pointer"
                                title={task.campaign}
                              >
                                {task.campaign}
                              </button>
                            </td>

                            {/* Ad Account */}
                            <td className={`${tableDensity === 'fit' ? 'py-1.5 px-1.5' : 'py-2.5 px-3'} border-r border-[#1a1a1a] font-mono text-[10px] font-bold text-zinc-400 whitespace-nowrap`}>
                              <span className="truncate block max-w-[65px]" title={task.adAccount}>
                                {task.adAccount}
                              </span>
                            </td>

                            {/* Current Action */}
                            <td className={`${tableDensity === 'fit' ? 'py-1.5 px-1.5' : 'py-2.5 px-3'} border-r border-[#1a1a1a] whitespace-nowrap`}>
                              <span
                                className="rounded bg-[#141414] border border-[#262626] px-1.5 py-0.5 font-semibold text-zinc-300 text-[10px] truncate block max-w-[100px]"
                                title={task.action}
                              >
                                {task.action}
                              </span>
                            </td>

                            {/* Owner with inline edit */}
                            <td className={`${tableDensity === 'fit' ? 'py-1.5 px-1' : 'py-2.5 px-3'} border-r border-[#1a1a1a] whitespace-nowrap font-semibold`}>
                              <select
                                value={task.owner}
                                onChange={(e) => handleInlineOwnerChange(task, e.target.value)}
                                style={{ colorScheme: 'dark' }}
                                className="w-full rounded-md bg-black text-[11px] font-semibold text-zinc-200 border border-[#262626] px-1 py-0.5 cursor-pointer focus:outline-hidden [color-scheme:dark] hover:border-[#444] transition-colors truncate"
                                title={`Owner: ${task.owner}`}
                              >
                                <option value="Yzah" className="bg-black text-zinc-100 py-1">Yzah</option>
                                <option value="Karl" className="bg-black text-zinc-100 py-1">Karl</option>
                                <option value="Mark" className="bg-black text-zinc-100 py-1">Mark</option>
                                <option value="Christian" className="bg-black text-zinc-100 py-1">Christian</option>
                                <option value="Charles" className="bg-black text-zinc-100 py-1">Charles</option>
                              </select>
                            </td>

                            {/* Stage */}
                            <td className={`${tableDensity === 'fit' ? 'py-1.5 px-1 text-center' : 'py-2.5 px-2.5'} border-r border-[#1a1a1a] whitespace-nowrap`}>
                              <span
                                className={`rounded px-1.5 py-0.5 text-[9px] font-mono font-semibold border ${
                                  task.stage === 'Creative'
                                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/25'
                                    : task.stage === 'Setup'
                                    ? 'bg-teal-500/10 text-teal-400 border-teal-500/25'
                                    : task.stage === 'Live'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                                    : task.stage === 'Blocked'
                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                                }`}
                              >
                                {task.stage}
                              </span>
                            </td>

                            {/* Deadline */}
                            <td className={`${tableDensity === 'fit' ? 'py-1.5 px-1.5' : 'py-2.5 px-3'} border-r border-[#1a1a1a] font-mono text-[10px] whitespace-nowrap text-zinc-400`}>
                              <span className="truncate block max-w-[68px]" title={task.deadline}>
                                {task.deadline}
                              </span>
                            </td>

                            {/* Status with inline edit */}
                            <td className={`${tableDensity === 'fit' ? 'py-1.5 px-1' : 'py-2.5 px-3'} border-r border-[#1a1a1a] whitespace-nowrap`}>
                              <select
                                value={task.status}
                                onChange={(e) => handleInlineStatusChange(task, e.target.value as WorkStatus)}
                                style={{ colorScheme: 'dark' }}
                                className={`w-full rounded-md px-1.5 py-0.5 text-[10px] font-semibold cursor-pointer border bg-black ${getStatusBadgeStyle(task.status)} focus:outline-hidden [color-scheme:dark] truncate`}
                                title={`Status: ${task.status}`}
                              >
                                <option value="QUEUE" className="bg-black text-zinc-100">QUEUE</option>
                                <option value="MAKING" className="bg-black text-zinc-100">MAKING</option>
                                <option value="FOR REVIEW" className="bg-black text-zinc-100">FOR REVIEW</option>
                                <option value="CHANGES REQUIRED" className="bg-black text-zinc-100">CHANGES REQ</option>
                                <option value="APPROVED" className="bg-black text-zinc-100">APPROVED</option>
                                <option value="READY" className="bg-black text-zinc-100">READY</option>
                                <option value="IN_SETUP" className="bg-black text-zinc-100">IN SETUP</option>
                                <option value="QA" className="bg-black text-zinc-100">QA</option>
                                <option value="LIVE" className="bg-black text-zinc-100">LIVE</option>
                                <option value="BLOCKED" className="bg-black text-zinc-100">BLOCKED</option>
                              </select>
                            </td>

                            {/* Next Action */}
                            <td className={`${tableDensity === 'fit' ? 'py-1.5 px-2' : 'py-2.5 px-3'} border-r border-[#1a1a1a] text-[11px] text-zinc-300`}>
                              <span className="truncate block max-w-[180px] lg:max-w-[240px]" title={task.nextAction}>
                                {task.nextAction}
                              </span>
                            </td>

                            {/* Action Details Button */}
                            <td className={`${tableDensity === 'fit' ? 'py-1.5 px-1 text-center' : 'py-2.5 px-3 text-right'} whitespace-nowrap`}>
                              <button
                                onClick={() => setSelectedTask(task)}
                                className="vercel-btn-secondary py-0.5 px-2 text-[10px] cursor-pointer"
                                title="Open task details"
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
