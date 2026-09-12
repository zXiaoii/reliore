'use client';

import React, { useState } from 'react';
import { usePipeline } from '@/hooks/usePipeline';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { WorkTask } from '@/types';
import {
  formatTaskNumber,
  getSuggestedAdSetName,
  getMarketFlag,
  sortTasks,
} from '@/lib/pipeline';
import { MarketBadge } from '@/components/common/MarketBadge';
import { PriorityPill } from '@/components/ui/PriorityPill';
import { WaitingForAccess } from '@/components/auth/WaitingForAccess';
import {
  Flame,
  Rocket,
  FolderOpen,
  Copy,
  Check,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Search,
  LayoutList,
  Table as TableIcon,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function SetupQueuePage() {
  const { tasks, store } = usePipeline();
  const { currentUser, isPendingAccess } = useAuth();
  const { toast } = useToast();

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Setup form states: { [taskId]: { adSetName, dailyBudget, setupNotes, launchDate } }
  const [setupForm, setSetupForm] = useState<
    Record<
      string,
      {
        adSetName: string;
        dailyBudget: number;
        setupNotes: string;
        launchDate: string;
      }
    >
  >({});

  if (isPendingAccess) {
    return <WaitingForAccess />;
  }

  // Filter tasks in Setup phase:
  // READY, IN_SETUP, QA
  const setupTasks = tasks.filter(
    (t) =>
      t.status === 'READY' ||
      t.status === 'APPROVED' ||
      t.status === 'IN_SETUP' ||
      t.status === 'QA' ||
      (t.stage === 'Setup' && t.status !== 'LIVE')
  );

  const sorted = sortTasks(setupTasks);

  const filtered = sorted.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.product.toLowerCase().includes(q) ||
      t.campaign.toLowerCase().includes(q) ||
      t.adAccount.toLowerCase().includes(q) ||
      t.action.toLowerCase().includes(q)
    );
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(filtered.map((t) => t.id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const getFormVals = (task: WorkTask) => {
    if (setupForm[task.id]) return setupForm[task.id];
    const todayStr = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
    const suggested = task.adSetName || getSuggestedAdSetName(new Date(), task.creativeTypes);
    return {
      adSetName: suggested,
      dailyBudget: task.dailyBudget || 150,
      setupNotes: task.setupNotes || '',
      launchDate: todayStr,
    };
  };

  const updateFormVal = (taskId: string, field: string, val: any) => {
    setSetupForm((prev) => ({
      ...prev,
      [taskId]: {
        ...(prev[taskId] || {
          adSetName: '',
          dailyBudget: 150,
          setupNotes: '',
          launchDate: '',
        }),
        [field]: val,
      },
    }));
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.info(`Copied: "${text}"`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleLaunch = (task: WorkTask) => {
    const vals = getFormVals(task);

    store.launchAdSet(
      task.id,
      {
        adSetName: vals.adSetName.trim() || 'New Ad Set',
        campaignName: task.campaign,
        launchDate: vals.launchDate,
        dailyBudget: Number(vals.dailyBudget) || 150,
        setupNotes: vals.setupNotes.trim(),
      },
      { uid: currentUser?.uid || 'karl-02', displayName: currentUser?.displayName || 'Karl' }
    );

    toast.success(
      `🚀 Ad Set "${vals.adSetName}" launched in Meta! Campaign status is LIVE and 2-Day automation trigger is scheduled.`
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-[#ededed] font-sans w-full max-w-full min-w-0">
      {/* Top Banner - Vercel Clean Aesthetic */}
      <div className="border-b border-[#1f1f1f] bg-black px-4 py-5 sm:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 max-w-7xl mx-auto w-full">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                Campaign &amp; Ad Set Setup Queue
              </h1>
              <span className="rounded-md bg-[#121212] border border-[#262626] px-2 py-0.5 text-xs font-semibold text-teal-300 font-mono">
                Karl / Mark / Christian&apos;s Workspace
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Approved creative batches ready for Funnelish, pixel verification, tracking QA, and Meta launch.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <span className="rounded-md border border-[#262626] bg-[#121212] px-3 py-1.5 text-xs font-mono font-semibold text-teal-300">
              {setupTasks.length} Batches in Setup
            </span>
          </div>
        </div>

        {/* Search & View Mode Toolbar */}
        <div className="mt-4 pt-3 border-t border-[#1a1a1a] flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-7xl mx-auto w-full">
          {/* Vercel Search Box with / Keyboard Badge */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search campaign, ad account, product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-[#262626] bg-black py-1.5 pl-8 pr-8 text-xs text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-hidden transition-colors"
            />
            <span className="absolute right-2 top-2 vercel-kbd">/</span>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Expand / Collapse All */}
            <button
              onClick={() => {
                if (expandedIds.size === filtered.length && filtered.length > 0) {
                  collapseAll();
                } else {
                  expandAll();
                }
              }}
              className="vercel-btn-secondary flex items-center gap-1 text-xs cursor-pointer"
              title="Expand or collapse all launch drawers"
            >
              <span>
                {expandedIds.size === filtered.length && filtered.length > 0
                  ? 'Collapse All'
                  : 'Expand All'}
              </span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-md bg-black border border-[#262626] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-[#181818] text-white border border-[#383838] font-bold shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span>Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-[#181818] text-white border border-[#383838] font-bold shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <LayoutList className="h-3.5 w-3.5" />
                <span>Cards</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Content matching §20 */}
      <div className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-12 text-center shadow-xs">
            <CheckCircle2 className="mx-auto h-8 w-8 text-teal-400" />
            <h3 className="mt-2 text-sm font-bold text-white">
              Setup queue is clear!
            </h3>
            <p className="mt-1 text-xs text-zinc-400">
              Batches approved by Charles will automatically appear here for Karl, Mark, or Christian.
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          /* Responsive Mobile Cards for Setup Queue (Vercel Style) */
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((task) => {
              const vals = getFormVals(task);
              return (
                <div
                  key={task.id}
                  className="vercel-card p-4 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    {/* Top Row */}
                    <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-2.5">
                      <div className="flex items-center gap-1.5">
                        <PriorityPill priority={task.priority} size="sm" />
                        <span className="font-mono text-xs font-bold text-white">
                          {formatTaskNumber(task.taskNumber)}
                        </span>
                        <MarketBadge market={task.market} size="xs" />
                        <span className="font-semibold text-xs text-zinc-300">
                          {task.product}
                        </span>
                      </div>
                      <span className="rounded bg-teal-500/10 border border-teal-500/25 px-2 py-0.5 text-[10px] font-mono font-bold text-teal-400">
                        {task.status}
                      </span>
                    </div>

                    {/* Campaign with Copy helper */}
                    <div>
                      <span className="text-[10px] font-bold uppercase text-zinc-500 block font-mono">
                        Campaign
                      </span>
                      <div className="flex items-center justify-between mt-1 rounded-md bg-black p-2 border border-[#262626]">
                        <span className="font-mono font-bold text-xs text-white truncate mr-2">
                          {task.campaign}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyText(task.campaign, `camp-card-${task.id}`)}
                          className="text-zinc-500 hover:text-white shrink-0 cursor-pointer"
                          title="Copy Campaign Name"
                        >
                          {copiedKey === `camp-card-${task.id}` ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-zinc-400 font-mono">
                        <span>{task.adAccount}</span>
                        <span>·</span>
                        <span className="text-zinc-300 font-sans">{task.action}</span>
                      </div>
                    </div>

                    {/* Ad Set Name Input */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase text-zinc-500 font-mono">
                          Ad Set Name (Meta)
                        </label>
                        <button
                          type="button"
                          onClick={() => copyText(vals.adSetName, `adset-card-${task.id}`)}
                          className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          {copiedKey === `adset-card-${task.id}` ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          <span>Copy</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={vals.adSetName}
                        onChange={(e) => updateFormVal(task.id, 'adSetName', e.target.value)}
                        className="mt-1 w-full rounded-md border border-[#262626] bg-black p-1.5 text-xs font-mono font-bold text-white focus:border-zinc-500 focus:outline-hidden"
                      />
                    </div>

                    {/* Drive Folder Link & Setup Notes */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      {task.folderUrl ? (
                        <a
                          href={task.folderUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-blue-400 hover:underline text-xs"
                        >
                          <FolderOpen className="h-3.5 w-3.5" />
                          <span>Drive Files ({task.quantityDone}/{task.quantity})</span>
                        </a>
                      ) : (
                        <span className="text-zinc-500 text-xs">Approved files</span>
                      )}
                      <span className="font-mono text-[11px] text-zinc-500">Due: {task.deadline}</span>
                    </div>
                  </div>

                  {/* Launch Button */}
                  <div className="mt-4 pt-3 border-t border-[#1f1f1f]">
                    <button
                      onClick={() => handleLaunch(task)}
                      className="w-full vercel-btn-primary flex items-center justify-center gap-2 py-2 cursor-pointer"
                    >
                      <Rocket className="h-4 w-4 text-black" />
                      <span>Launch Ad Set in Meta</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Multi-Tier 5-Column Table (Zero Horizontal Scrollbar, 100% Fit to Screen) */
          <div className="w-full max-w-full min-w-0 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400 px-1">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-teal-400 font-semibold font-mono text-[10px] bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
                  SMART PIPELINE
                </span>
                <span className="hidden sm:inline text-zinc-500">·</span>
                <span className="hidden sm:inline text-zinc-400">
                  Full campaign, ad account, and ad set name fully visible without horizontal scrolling
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] bg-[#121212] px-2 py-0.5 rounded text-zinc-400 border border-[#262626]">
                  {filtered.length} {filtered.length === 1 ? 'task' : 'tasks'}
                </span>
              </div>
            </div>

            <div className="w-full max-w-full min-w-0 rounded-xl border border-[#222222] bg-[#0a0a0a] shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="border-b border-[#222222] bg-black font-semibold text-zinc-400 uppercase tracking-wider text-[10px] sticky top-0">
                  <tr>
                    <th className="w-[60px] py-2.5 px-2 text-center border-r border-[#1f1f1f]">Priority</th>
                    <th className="py-2.5 px-3 border-r border-[#1f1f1f] w-[28%]">Campaign &amp; Product</th>
                    <th className="py-2.5 px-3 border-r border-[#1f1f1f] w-[36%]">Ad Set to Launch (Meta)</th>
                    <th className="w-[125px] py-2.5 px-3 border-r border-[#1f1f1f]">Drive Assets</th>
                    <th className="w-[160px] py-2.5 px-3 text-right">Status / Launch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]">
                  {filtered.map((task) => {
                    const vals = getFormVals(task);
                    const isExpanded = expandedIds.has(task.id);
                    const isReady = task.status === 'READY';

                    return (
                      <React.Fragment key={task.id}>
                        <tr
                          className={`transition-colors hover:bg-[#141414] ${
                            isExpanded ? 'bg-teal-950/15' : 'bg-[#0a0a0a]'
                          }`}
                        >
                          {/* Priority & Expand Chevron */}
                          <td className="py-3 px-2 text-center border-r border-[#1a1a1a] whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => toggleExpand(task.id)}
                                className="p-1 rounded hover:bg-[#222] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                title={isExpanded ? 'Collapse launch drawer' : 'Expand launch checklist & settings'}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4 text-teal-400 font-bold" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </button>
                              <PriorityPill priority={task.priority} size="sm" compact />
                            </div>
                          </td>

                          {/* Campaign & Product (Multi-tier, uncropped) */}
                          <td className="py-3 px-3 border-r border-[#1a1a1a]">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => toggleExpand(task.id)}
                                  className="font-bold text-white text-xs hover:text-teal-300 text-left transition-colors cursor-pointer"
                                >
                                  {task.campaign}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => copyText(task.campaign, `camp-${task.id}`)}
                                  className="text-zinc-500 hover:text-white cursor-pointer shrink-0"
                                  title="Copy Campaign Name"
                                >
                                  {copiedKey === `camp-${task.id}` ? (
                                    <Check className="h-3 w-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <MarketBadge market={task.market} size="xs" />
                                <span className="text-[11px] text-zinc-300 font-medium">
                                  {task.product}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                                  · {task.adAccount}
                                  <button
                                    type="button"
                                    onClick={() => copyText(task.adAccount, `acc-${task.id}`)}
                                    className="text-zinc-500 hover:text-white cursor-pointer"
                                    title="Copy Ad Account"
                                  >
                                    {copiedKey === `acc-${task.id}` ? (
                                      <Check className="h-2.5 w-2.5 text-emerald-400 inline" />
                                    ) : (
                                      <Copy className="h-2.5 w-2.5 inline" />
                                    )}
                                  </button>
                                </span>
                                <span className="rounded bg-[#141414] border border-[#262626] px-1.5 py-0.2 font-semibold text-zinc-300 text-[10px]">
                                  {task.action}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Ad Set to Launch (Inline editable + Copy + Budget) */}
                          <td className="py-3 px-3 border-r border-[#1a1a1a]">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={vals.adSetName}
                                  onChange={(e) => updateFormVal(task.id, 'adSetName', e.target.value)}
                                  className="w-full rounded-md border border-[#262626] bg-black px-2 py-1 text-[11px] font-mono font-bold text-white focus:border-zinc-500 focus:outline-hidden"
                                  title="Ad Set Name (editable)"
                                />
                                <button
                                  type="button"
                                  onClick={() => copyText(vals.adSetName, `adset-${task.id}`)}
                                  className="vercel-btn-secondary p-1 text-zinc-400 hover:text-white cursor-pointer shrink-0"
                                  title="Copy Ad Set Name to Clipboard"
                                >
                                  {copiedKey === `adset-${task.id}` ? (
                                    <Check className="h-3 w-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
                                <span className="text-teal-400 font-semibold">€{vals.dailyBudget}/day</span>
                                <span>·</span>
                                <span className="text-zinc-500">{task.creativeTypes.join(' + ')}</span>
                                {task.reasonTrigger && (
                                  <>
                                    <span>·</span>
                                    <span className="truncate max-w-[180px] text-purple-400">{task.reasonTrigger}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Drive Assets */}
                          <td className="py-3 px-3 border-r border-[#1a1a1a] whitespace-nowrap">
                            {task.folderUrl ? (
                              <div className="flex flex-col gap-0.5">
                                <a
                                  href={task.folderUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="vercel-btn-secondary inline-flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-blue-300 py-1 px-2.5 rounded-md cursor-pointer transition-colors"
                                  title="Open Google Drive folder with approved assets"
                                >
                                  <FolderOpen className="h-3 w-3 text-blue-400 shrink-0" />
                                  <span>Drive ({task.quantityDone || task.quantity}) ↗</span>
                                </a>
                                <span className="text-[10px] font-mono text-zinc-500 pl-0.5">
                                  Due: {task.deadline}
                                </span>
                              </div>
                            ) : (
                              <span className="text-zinc-500 text-xs">Ready</span>
                            )}
                          </td>

                          {/* Status & Launch */}
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <span
                                className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold border ${
                                  isReady
                                    ? 'bg-teal-500/10 text-teal-400 border-teal-500/25'
                                    : 'bg-[#141414] text-zinc-300 border border-[#262626]'
                                }`}
                              >
                                {task.status}
                              </span>
                              <button
                                onClick={() => handleLaunch(task)}
                                className="vercel-btn-primary flex items-center gap-1.5 py-1 px-3 text-xs font-semibold cursor-pointer"
                              >
                                <Rocket className="h-3.5 w-3.5 text-black shrink-0" />
                                <span>Launch</span>
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* In-Place Expanded Setup & Launch Drawer */}
                        {isExpanded && (
                          <tr className="bg-zinc-100/70 dark:bg-zinc-900/90 border-y-2 border-teal-500/30">
                            <td colSpan={5} className="p-4 sm:p-6">
                              <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                                {/* Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 gap-2">
                                  <div className="flex items-center gap-2.5">
                                    <PriorityPill priority={task.priority} size="sm" />
                                    <span className="font-mono text-sm font-extrabold text-zinc-900 dark:text-white">
                                      {formatTaskNumber(task.taskNumber)}
                                    </span>
                                    <MarketBadge market={task.market} size="xs" />
                                    <span className="text-xs font-bold text-zinc-300">
                                      {task.product} — <span className="text-teal-400 font-mono">{task.campaign}</span>
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs">
                                    <span className="text-zinc-500">
                                      Assigned Setup: <strong className="text-teal-400">{task.assignedSetupUser || 'Karl'}</strong>
                                    </span>
                                    <span className="font-mono text-zinc-400 bg-[#141414] px-2 py-0.5 rounded border border-[#262626]">
                                      Due: {task.deadline}
                                    </span>
                                  </div>
                                </div>

                                {/* 2-Column Grid: Checklist vs Launch Form */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
                                  {/* LEFT: Pre-Flight Launch Checklist */}
                                  <div className="lg:col-span-6 space-y-3">
                                    <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-4 space-y-3">
                                      <h4 className="font-mono font-bold text-teal-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                        <CheckCircle2 className="h-4 w-4 text-teal-400" />
                                        <span>Meta &amp; Funnelish Pre-Flight Checklist</span>
                                      </h4>

                                      <div className="space-y-2 pt-1 text-xs">
                                        <div className="flex items-start gap-2 bg-black/40 p-2.5 rounded-lg border border-[#222]">
                                          <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                                          <div>
                                            <span className="font-bold text-white block">1. Funnelish Checkout &amp; Bundles</span>
                                            <p className="text-[11px] text-zinc-400 mt-0.5">
                                              Ensure product variant, offer price, and bundle discounts match the creative hook.
                                            </p>
                                          </div>
                                        </div>

                                        <div className="flex items-start gap-2 bg-black/40 p-2.5 rounded-lg border border-[#222]">
                                          <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                                          <div>
                                            <span className="font-bold text-white block">2. Meta Pixel &amp; CAPI Event QA</span>
                                            <p className="text-[11px] text-zinc-400 mt-0.5">
                                              Verify InitiateCheckout &amp; Purchase events trigger cleanly in Meta Pixel Helper.
                                            </p>
                                          </div>
                                        </div>

                                        <div className="flex items-start gap-2 bg-black/40 p-2.5 rounded-lg border border-[#222]">
                                          <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                                          <div>
                                            <span className="font-bold text-white block">3. Approved Creative Assets</span>
                                            <p className="text-[11px] text-zinc-400 mt-0.5">
                                              All {task.quantity} variants downloaded from Google Drive and uploaded into Meta Ads Manager.
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* RIGHT: Launch Parameters & Action */}
                                  <div className="lg:col-span-6 flex flex-col justify-between rounded-xl border border-[#262626] bg-[#0d0d0d] p-4 space-y-4">
                                    <div className="space-y-3">
                                      <h4 className="font-mono font-bold text-white text-xs uppercase tracking-wider">
                                        Launch Parameters
                                      </h4>

                                      {/* Ad Set Name */}
                                      <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                          <label className="text-[10px] font-bold uppercase text-zinc-400 font-mono">
                                            Ad Set Name in Meta
                                          </label>
                                          <button
                                            type="button"
                                            onClick={() => copyText(vals.adSetName, `drawer-adset-${task.id}`)}
                                            className="text-[10px] text-teal-400 hover:underline flex items-center gap-1 font-mono"
                                          >
                                            {copiedKey === `drawer-adset-${task.id}` ? (
                                              <Check className="h-3 w-3 text-emerald-400" />
                                            ) : (
                                              <Copy className="h-3 w-3" />
                                            )}
                                            <span>Copy Name</span>
                                          </button>
                                        </div>
                                        <input
                                          type="text"
                                          value={vals.adSetName}
                                          onChange={(e) => updateFormVal(task.id, 'adSetName', e.target.value)}
                                          className="w-full rounded-md border border-[#262626] bg-black p-2 text-xs font-mono font-bold text-white focus:border-zinc-500 focus:outline-hidden"
                                        />
                                      </div>

                                      {/* Budget & Date */}
                                      <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                          <label className="text-[10px] font-bold uppercase text-zinc-400 font-mono">
                                            Daily Budget (€EUR)
                                          </label>
                                          <input
                                            type="number"
                                            value={vals.dailyBudget}
                                            onChange={(e) => updateFormVal(task.id, 'dailyBudget', Number(e.target.value))}
                                            className="w-full rounded-md border border-[#262626] bg-black p-2 text-xs font-mono font-bold text-white focus:border-zinc-500 focus:outline-hidden"
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <label className="text-[10px] font-bold uppercase text-zinc-400 font-mono">
                                            Launch Date
                                          </label>
                                          <input
                                            type="text"
                                            value={vals.launchDate}
                                            onChange={(e) => updateFormVal(task.id, 'launchDate', e.target.value)}
                                            className="w-full rounded-md border border-[#262626] bg-black p-2 text-xs font-mono text-white focus:border-zinc-500 focus:outline-hidden"
                                          />
                                        </div>
                                      </div>

                                      {/* Setup Notes */}
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-zinc-400 font-mono">
                                          Setup &amp; Tracking Notes
                                        </label>
                                        <textarea
                                          rows={2}
                                          value={vals.setupNotes}
                                          onChange={(e) => updateFormVal(task.id, 'setupNotes', e.target.value)}
                                          placeholder="Notes regarding pixel, UTM tags, or target audience..."
                                          className="w-full rounded-md border border-[#262626] bg-black p-2 text-xs text-white focus:border-zinc-500 focus:outline-hidden"
                                        />
                                      </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="pt-3 border-t border-[#262626]">
                                      <button
                                        onClick={() => handleLaunch(task)}
                                        className="w-full vercel-btn-primary flex items-center justify-center gap-2 py-2.5 cursor-pointer font-bold"
                                      >
                                        <Rocket className="h-4 w-4 text-black" />
                                        <span>Confirm Launch in Meta (Trigger 2-Day Automation)</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
