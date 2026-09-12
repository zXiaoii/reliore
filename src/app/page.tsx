'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const { tasks, campaigns, adSets, settings, store } = usePipeline();
  const { currentUser, isMediaBuyer, isPendingAccess } = useAuth();
  const { toast } = useToast();

  // Setup users only see Setup Queue, Creative users only see Creative Queue
  useEffect(() => {
    if (currentUser?.role === 'setup') {
      router.replace('/setup');
    } else if (currentUser?.role === 'creative') {
      router.replace('/creative');
    }
  }, [currentUser, router]);

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

  // Prevent flashing Media Buying dashboard for Setup / Creative roles while redirecting
  if (currentUser?.role === 'setup' || currentUser?.role === 'creative') {
    return null;
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

  // Run 2-Day trigger simulation button (§16)
  const handleRunNextDayTrigger = () => {
    const targetCamp = campaigns.find((c) => c.status === 'LIVE') || campaigns[0];
    if (!targetCamp) {
      toast.error('No campaigns available to simulate 2-Day trigger.');
      return;
    }

    const liveAdSet =
      adSets.find((a) => a.campaignName === targetCamp.name && a.status === 'LIVE') ||
      adSets.find((a) => a.campaignName === targetCamp.name) ||
      adSets[0];
    if (!liveAdSet) {
      toast.error('No ad set available for 2-Day trigger simulation.');
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
        `⚡ 2-Day Automation Triggered! Created Task ${formatTaskNumber(newTask.taskNumber)} for Yzah (${targetCamp.name}).`
      );
    } else {
      toast.info(
        `2-Day creative task for ${liveAdSet.name} already exists. Idempotency protected!`
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
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950 text-[#ededed] font-sans w-full max-w-full min-w-0">
      {/* Top Banner - Vercel Theme */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 sm:px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Media Buying Operations
              </h1>
              <span className="rounded-md bg-[#121212] px-2 py-0.5 text-xs font-mono font-semibold text-zinc-300 border border-zinc-200 dark:border-zinc-800">
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
              title="Simulate automatic 2-Day creative task creation"
            >
              <Zap className="h-3.5 w-3.5 text-purple-400" />
              <span>48-Hour Check</span>
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
              <span className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">{p1OpenCount}</span>
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
              <span className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">{creativeCount}</span>
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
              <span className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">{setupCount}</span>
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
              <span className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">{readyCount}</span>
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
              <span className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">{liveCount}</span>
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
              <span className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">{blockedCount}</span>
              <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded ${blockedCount > 0 ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20' : 'text-zinc-500 bg-zinc-100 dark:bg-zinc-900'}`}>
                blockers
              </span>
            </div>
          </div>
        </div>

        {/* Smart Spreadsheet Toolbar: Filters, Grouping, Search, View Mode (Vercel Style) */}
        <div className="mt-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 border-t border-zinc-200 dark:border-zinc-800 pt-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1 font-mono">
              <Filter className="h-3 w-3 text-zinc-400" />
              <span>Filters:</span>
            </span>

            <select
              value={marketFilter}
              onChange={(e) => setMarketFilter(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 focus:border-zinc-500 focus:outline-hidden [color-scheme:dark] hover:border-[#444] transition-colors cursor-pointer"
            >
              <option value="ALL" className="bg-white dark:bg-zinc-950 text-zinc-100">All Markets</option>
              <option value="CA" className="bg-white dark:bg-zinc-950 text-zinc-100">🇨🇦 CA</option>
              <option value="UK" className="bg-white dark:bg-zinc-950 text-zinc-100">🇬🇧 UK</option>
              <option value="US" className="bg-white dark:bg-zinc-950 text-zinc-100">🇺🇸 US</option>
              <option value="AUS" className="bg-white dark:bg-zinc-950 text-zinc-100">🇦🇺 AUS</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 focus:border-zinc-500 focus:outline-hidden [color-scheme:dark] hover:border-[#444] transition-colors cursor-pointer"
            >
              <option value="ALL" className="bg-white dark:bg-zinc-950 text-zinc-100">All Priorities</option>
              <option value="P1" className="bg-white dark:bg-zinc-950 text-zinc-100">🔥 P1</option>
              <option value="P2" className="bg-white dark:bg-zinc-950 text-zinc-100">⏱️ P2</option>
              <option value="P3" className="bg-white dark:bg-zinc-950 text-zinc-100">📦 P3</option>
            </select>

            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 focus:border-zinc-500 focus:outline-hidden [color-scheme:dark] hover:border-[#444] transition-colors cursor-pointer"
            >
              <option value="ALL" className="bg-white dark:bg-zinc-950 text-zinc-100">All Owners</option>
              <option value="Yzah" className="bg-white dark:bg-zinc-950 text-zinc-100">Yzah (Creative)</option>
              <option value="Karl" className="bg-white dark:bg-zinc-950 text-zinc-100">Karl (Setup)</option>
              <option value="Mark" className="bg-white dark:bg-zinc-950 text-zinc-100">Mark (Setup)</option>
              <option value="Christian" className="bg-white dark:bg-zinc-950 text-zinc-100">Christian (Setup)</option>
              <option value="Charles" className="bg-white dark:bg-zinc-950 text-zinc-100">Charles (Buyer)</option>
            </select>

            <div className="flex items-center gap-1.5 pl-1 sm:pl-2 border-l border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider hidden sm:inline font-mono">
                Group:
              </span>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as any)}
                style={{ colorScheme: 'dark' }}
                className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 focus:border-zinc-500 focus:outline-hidden [color-scheme:dark] hover:border-[#444] transition-colors cursor-pointer"
              >
                <option value="none" className="bg-white dark:bg-zinc-950 text-zinc-100">None (Flat)</option>
                <option value="campaign" className="bg-white dark:bg-zinc-950 text-zinc-100">Campaign</option>
                <option value="product" className="bg-white dark:bg-zinc-950 text-zinc-100">Product</option>
                <option value="owner" className="bg-white dark:bg-zinc-950 text-zinc-100">Owner</option>
                <option value="stage" className="bg-white dark:bg-zinc-950 text-zinc-100">Stage</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-0.5 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-[#181818] text-zinc-900 dark:text-zinc-100 border border-[#383838] font-semibold shadow-xs'
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
                    ? 'bg-[#181818] text-zinc-900 dark:text-zinc-100 border border-[#383838] font-semibold shadow-xs'
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
                className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-1.5 pl-8 pr-8 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-hidden transition-colors"
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
                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                    <span className="font-mono font-bold text-xs text-zinc-900 dark:text-zinc-100">
                      📁 {groupTitle}
                    </span>
                    <span className="rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
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
                          <div className="flex items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2.5 mb-2.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                {formatTaskNumber(task.taskNumber)}
                              </span>
                              <PriorityPill priority={task.priority} size="sm" />
                              <MarketBadge market={task.market} size="xs" />
                            </div>

                            <select
                              value={task.status}
                              onChange={(e) => handleInlineStatusChange(task, e.target.value as WorkStatus)}
                              style={{ colorScheme: 'dark' }}
                              className={`rounded px-2 py-0.5 text-xs font-semibold cursor-pointer border bg-white dark:bg-zinc-950 ${getStatusBadgeStyle(task.status)} [color-scheme:dark]`}
                            >
                              <option value="QUEUE" className="bg-white dark:bg-zinc-950 text-zinc-100">QUEUE</option>
                              <option value="MAKING" className="bg-white dark:bg-zinc-950 text-zinc-100">MAKING</option>
                              <option value="FOR REVIEW" className="bg-white dark:bg-zinc-950 text-zinc-100">FOR REVIEW</option>
                              <option value="CHANGES REQUIRED" className="bg-white dark:bg-zinc-950 text-zinc-100">CHANGES REQUIRED</option>
                              <option value="APPROVED" className="bg-white dark:bg-zinc-950 text-zinc-100">APPROVED</option>
                              <option value="READY" className="bg-white dark:bg-zinc-950 text-zinc-100">READY</option>
                              <option value="IN_SETUP" className="bg-white dark:bg-zinc-950 text-zinc-100">IN_SETUP</option>
                              <option value="QA" className="bg-white dark:bg-zinc-950 text-zinc-100">QA</option>
                              <option value="LIVE" className="bg-white dark:bg-zinc-950 text-zinc-100">LIVE</option>
                              <option value="BLOCKED" className="bg-white dark:bg-zinc-950 text-zinc-100">BLOCKED</option>
                            </select>
                          </div>

                          {/* Product & Campaign */}
                          <div className="space-y-0.5">
                            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                              {task.product}
                            </span>
                            <h3 className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-purple-300 transition-colors truncate">
                              {task.campaign}
                            </h3>
                          </div>

                          {/* Action Pill & Ad Account */}
                          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                            <span className="rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 font-semibold text-zinc-200 text-xs">
                              {task.action}
                            </span>
                            <span className="font-mono text-[11px] text-zinc-400 bg-white dark:bg-zinc-950 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
                              {task.adAccount}
                            </span>
                          </div>

                          {/* Next Action & Deadline */}
                          <div className="mt-3 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 text-xs">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase block font-mono">Next Action</span>
                            <p className="text-zinc-300 font-medium line-clamp-2 mt-0.5">
                              {task.nextAction || 'Pending review'}
                            </p>
                            <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400 font-mono pt-1.5 border-t border-[#181818]">
                              <span>Due: {task.deadline}</span>
                              <span className="font-bold text-zinc-900 dark:text-zinc-100">{task.stage}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer: Owner Selector & Open Detail Button */}
                        <div className="mt-3.5 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold">
                            <span className="text-[11px] text-zinc-500 font-mono">Owner:</span>
                            <select
                              value={task.owner}
                              onChange={(e) => handleInlineOwnerChange(task, e.target.value)}
                              style={{ colorScheme: 'dark' }}
                              className="rounded-md bg-white dark:bg-zinc-950 text-xs font-semibold text-zinc-200 border border-zinc-200 dark:border-zinc-800 px-2 py-1 cursor-pointer focus:outline-hidden [color-scheme:dark] hover:border-[#444] transition-colors"
                            >
                              <option value="Yzah" className="bg-white dark:bg-zinc-950 text-zinc-100">Yzah (Creative)</option>
                              <option value="Karl" className="bg-white dark:bg-zinc-950 text-zinc-100">Karl (Setup)</option>
                              <option value="Mark" className="bg-white dark:bg-zinc-950 text-zinc-100">Mark (Setup)</option>
                              <option value="Christian" className="bg-white dark:bg-zinc-950 text-zinc-100">Christian (Setup)</option>
                              <option value="Charles" className="bg-white dark:bg-zinc-950 text-zinc-100">Charles (Buyer)</option>
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
                <div className="flex items-center rounded-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-0.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setTableDensity('fit')}
                    className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                      tableDensity === 'fit'
                        ? 'bg-[#1e1e1e] text-zinc-900 dark:text-zinc-100 border border-[#383838] font-semibold shadow-2xs'
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
                        ? 'bg-[#1e1e1e] text-zinc-900 dark:text-zinc-100 border border-[#383838] font-semibold shadow-2xs'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                    title="Relaxed wider columns with horizontal scroll"
                  >
                    Relaxed
                  </button>
                </div>
                <span className="font-mono text-[10px] bg-[#121212] px-2 py-0.5 rounded text-zinc-400 border border-zinc-200 dark:border-zinc-800">
                  {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
                </span>
              </div>
            </div>

            <div className={`w-full max-w-full min-w-0 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs custom-scrollbar `}>
              <table className={`w-full text-left text-xs border-collapse `}>
                <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-semibold text-zinc-400 uppercase tracking-wider text-[10px] sticky top-0">
                  <tr>
                    <th className={` border-r border-zinc-200 dark:border-zinc-800`}>Priority</th>
                    <th className={` border-r border-zinc-200 dark:border-zinc-800`}>Mkt</th>
                    <th className={` border-r border-zinc-200 dark:border-zinc-800`}>Product</th>
                    <th className={` border-r border-zinc-200 dark:border-zinc-800`}>Campaign</th>
                    <th className={` border-r border-zinc-200 dark:border-zinc-800`}>Account</th>
                    <th className={` border-r border-zinc-200 dark:border-zinc-800`}>Action</th>
                    <th className={` border-r border-zinc-200 dark:border-zinc-800`}>Owner</th>
                    <th className={` border-r border-zinc-200 dark:border-zinc-800`}>Stage</th>
                    <th className={` border-r border-zinc-200 dark:border-zinc-800`}>Deadline</th>
                    <th className={` border-r border-zinc-200 dark:border-zinc-800`}>Status</th>
                    <th className={` border-r border-zinc-200 dark:border-zinc-800`}>Next Action</th>
                    <th className={``}>Open</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {Object.entries(groupedTasks).map(([groupTitle, groupItems]) => (
                    <React.Fragment key={groupTitle}>
                      {groupBy !== 'none' && (
                        <tr className="bg-[#121212] font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                          <td colSpan={12} className="py-2 px-3 border-y border-zinc-200 dark:border-zinc-800">
                            <span className="font-mono text-zinc-900 dark:text-zinc-100">📁 {groupTitle}</span> ({groupItems.length} active tasks)
                          </td>
                        </tr>
                      )}

                      {groupItems.map((task) => {
                        const isBlocked = task.status === 'BLOCKED' || task.status === 'CHANGES REQUIRED';
                        const isLive = task.status === 'LIVE';

                        return (
                          <tr
                            key={task.id}
                            className={`transition-colors hover:bg-zinc-100 dark:bg-zinc-900 ${
                              isBlocked
                                ? 'bg-rose-950/15'
                                : isLive
                                ? 'bg-emerald-950/15'
                                : 'bg-white dark:bg-zinc-950'
                            }`}
                          >
                            {/* Priority with inline edit */}
                            <td className={` border-r border-zinc-200 dark:border-zinc-800 whitespace-nowrap`}>
                              <select
                                value={task.priority}
                                onChange={(e) => handleInlinePriorityChange(task, e.target.value as Priority)}
                                style={{ colorScheme: 'dark' }}
                                className="w-full rounded-md bg-white dark:bg-zinc-950 text-zinc-200 border border-zinc-200 dark:border-zinc-800 px-1 py-0.5 font-bold text-[11px] cursor-pointer focus:outline-hidden [color-scheme:dark] hover:border-[#444] transition-colors"
                              >
                                <option value="P1" className="bg-white dark:bg-zinc-950 text-zinc-100">🔥 P1</option>
                                <option value="P2" className="bg-white dark:bg-zinc-950 text-zinc-100">⏱️ P2</option>
                                <option value="P3" className="bg-white dark:bg-zinc-950 text-zinc-100">📦 P3</option>
                              </select>
                            </td>

                            {/* Market with SVG flag */}
                            <td className={` border-r border-zinc-200 dark:border-zinc-800 whitespace-nowrap`}>
                              <MarketBadge market={task.market} size="xs" shortCode={false} />
                            </td>

                            {/* Product */}
                            <td className={` border-r border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap`}>
                              <span className="truncate block max-w-[80px]" title={task.product}>
                                {task.product}
                              </span>
                            </td>

                            {/* Campaign */}
                            <td className={` border-r border-zinc-200 dark:border-zinc-800 font-mono font-bold text-zinc-900 dark:text-zinc-100 hover:text-purple-300 whitespace-nowrap`}>
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
                            <td className={` border-r border-zinc-200 dark:border-zinc-800 font-mono text-[10px] font-bold text-zinc-400 whitespace-nowrap`}>
                              <span className="truncate block max-w-[65px]" title={task.adAccount}>
                                {task.adAccount}
                              </span>
                            </td>

                            {/* Current Action */}
                            <td className={` border-r border-zinc-200 dark:border-zinc-800 whitespace-nowrap`}>
                              <span
                                className="rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 font-semibold text-zinc-300 text-[10px] truncate block max-w-[100px]"
                                title={task.action}
                              >
                                {task.action}
                              </span>
                            </td>

                            {/* Owner with inline edit */}
                            <td className={` border-r border-zinc-200 dark:border-zinc-800 whitespace-nowrap font-semibold`}>
                              <select
                                value={task.owner}
                                onChange={(e) => handleInlineOwnerChange(task, e.target.value)}
                                style={{ colorScheme: 'dark' }}
                                className="w-full rounded-md bg-white dark:bg-zinc-950 text-[11px] font-semibold text-zinc-200 border border-zinc-200 dark:border-zinc-800 px-1 py-0.5 cursor-pointer focus:outline-hidden [color-scheme:dark] hover:border-[#444] transition-colors truncate"
                                title={`Owner: ${task.owner}`}
                              >
                                <option value="Yzah" className="bg-white dark:bg-zinc-950 text-zinc-100 py-1">Yzah</option>
                                <option value="Karl" className="bg-white dark:bg-zinc-950 text-zinc-100 py-1">Karl</option>
                                <option value="Mark" className="bg-white dark:bg-zinc-950 text-zinc-100 py-1">Mark</option>
                                <option value="Christian" className="bg-white dark:bg-zinc-950 text-zinc-100 py-1">Christian</option>
                                <option value="Charles" className="bg-white dark:bg-zinc-950 text-zinc-100 py-1">Charles</option>
                              </select>
                            </td>

                            {/* Stage */}
                            <td className={` border-r border-zinc-200 dark:border-zinc-800 whitespace-nowrap`}>
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
                            <td className={` border-r border-zinc-200 dark:border-zinc-800 font-mono text-[10px] whitespace-nowrap text-zinc-400`}>
                              <span className="truncate block max-w-[68px]" title={task.deadline}>
                                {task.deadline}
                              </span>
                            </td>

                            {/* Status with inline edit */}
                            <td className={` border-r border-zinc-200 dark:border-zinc-800 whitespace-nowrap`}>
                              <select
                                value={task.status}
                                onChange={(e) => handleInlineStatusChange(task, e.target.value as WorkStatus)}
                                style={{ colorScheme: 'dark' }}
                                className={`w-full rounded-md px-1.5 py-0.5 text-[10px] font-semibold cursor-pointer border bg-white dark:bg-zinc-950 ${getStatusBadgeStyle(task.status)} focus:outline-hidden [color-scheme:dark] truncate`}
                                title={`Status: ${task.status}`}
                              >
                                <option value="QUEUE" className="bg-white dark:bg-zinc-950 text-zinc-100">QUEUE</option>
                                <option value="MAKING" className="bg-white dark:bg-zinc-950 text-zinc-100">MAKING</option>
                                <option value="FOR REVIEW" className="bg-white dark:bg-zinc-950 text-zinc-100">FOR REVIEW</option>
                                <option value="CHANGES REQUIRED" className="bg-white dark:bg-zinc-950 text-zinc-100">CHANGES REQ</option>
                                <option value="APPROVED" className="bg-white dark:bg-zinc-950 text-zinc-100">APPROVED</option>
                                <option value="READY" className="bg-white dark:bg-zinc-950 text-zinc-100">READY</option>
                                <option value="IN_SETUP" className="bg-white dark:bg-zinc-950 text-zinc-100">IN SETUP</option>
                                <option value="QA" className="bg-white dark:bg-zinc-950 text-zinc-100">QA</option>
                                <option value="LIVE" className="bg-white dark:bg-zinc-950 text-zinc-100">LIVE</option>
                                <option value="BLOCKED" className="bg-white dark:bg-zinc-950 text-zinc-100">BLOCKED</option>
                              </select>
                            </td>

                            {/* Next Action */}
                            <td className={` border-r border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-300`}>
                              <span className="truncate block max-w-[180px] lg:max-w-[240px]" title={task.nextAction}>
                                {task.nextAction}
                              </span>
                            </td>

                            {/* Action Details Button */}
                            <td className={` whitespace-nowrap`}>
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
