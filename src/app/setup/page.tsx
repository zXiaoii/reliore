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
} from 'lucide-react';

export default function SetupQueuePage() {
  const { tasks, store } = usePipeline();
  const { currentUser, isPendingAccess } = useAuth();
  const { toast } = useToast();

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

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
      `🚀 Ad Set "${vals.adSetName}" launched in Meta! Campaign status is LIVE and next-day automation trigger is scheduled.`
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

          <span className="rounded-md border border-[#262626] bg-[#121212] px-3 py-1.5 text-xs font-mono font-semibold text-teal-300 self-start md:self-auto">
            {setupTasks.length} Batches in Setup
          </span>
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

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-md bg-black border border-[#262626] p-0.5 text-xs self-start sm:self-auto">
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
                        <span className="font-mono font-bold text-xs text-white truncate">
                          {task.campaign}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyText(task.campaign, `camp-${task.id}`)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-white shrink-0 ml-2 cursor-pointer"
                        >
                          {copiedKey === `camp-${task.id}` ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          <span>Copy</span>
                        </button>
                      </div>
                    </div>

                    {/* Ad Account & Action */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-md bg-black p-2 border border-[#262626]">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase block font-mono">Ad Account</span>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="font-mono font-bold text-zinc-300 truncate">
                            {task.adAccount}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyText(task.adAccount, `acc-${task.id}`)}
                            className="text-zinc-500 hover:text-white cursor-pointer"
                            title="Copy Account"
                          >
                            {copiedKey === `acc-${task.id}` ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="rounded-md bg-black p-2 border border-[#262626]">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase block font-mono">Action</span>
                        <span className="font-semibold text-zinc-300 block truncate mt-0.5">
                          {task.action}
                        </span>
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
                          onClick={() => copyText(vals.adSetName, `adset-${task.id}`)}
                          className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          {copiedKey === `adset-${task.id}` ? (
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
          /* Spreadsheet Table (Vercel Style) */
          <div className="w-full max-w-full min-w-0 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold font-mono text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  FIT TO SCREEN
                </span>
                <span className="text-zinc-500 hidden sm:inline">·</span>
                <span className="hidden sm:inline">Setup queue & launch workflow</span>
              </div>
              <span className="font-mono text-[10px] bg-[#121212] px-2 py-0.5 rounded text-zinc-400 border border-[#262626]">
                {filtered.length} {filtered.length === 1 ? 'task' : 'tasks'}
              </span>
            </div>
            <div className="w-full max-w-full min-w-0 overflow-x-auto rounded-xl border border-[#222222] bg-[#0a0a0a] shadow-xs custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
              <thead className="border-b border-[#222222] bg-black font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2 px-2 border-r border-[#1f1f1f] w-[46px]">Priority</th>
                  <th className="py-2 px-2 border-r border-[#1f1f1f] w-[80px]">Product</th>
                  <th className="py-2 px-2 border-r border-[#1f1f1f] w-[140px]">Campaign</th>
                  <th className="py-2 px-2 border-r border-[#1f1f1f] w-[105px]">Action</th>
                  <th className="py-2 px-2 border-r border-[#1f1f1f] w-[75px]">Ad Account</th>
                  <th className="py-2 px-2 border-r border-[#1f1f1f] w-[140px]">Ad Set Name</th>
                  <th className="py-2 px-2 border-r border-[#1f1f1f] w-[70px]">Creative</th>
                  <th className="py-2 px-2 border-r border-[#1f1f1f] w-[75px]">Deadline</th>
                  <th className="py-2 px-2 border-r border-[#1f1f1f] w-[95px]">Status</th>
                  <th className="py-2 px-2 text-right w-[110px]">Launch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {filtered.map((task) => {
                  const vals = getFormVals(task);

                  return (
                    <tr
                      key={task.id}
                      className="transition-colors hover:bg-[#141414] bg-[#0a0a0a]"
                    >
                      <td className="py-3 px-3 border-r border-[#1a1a1a] whitespace-nowrap">
                        <PriorityPill priority={task.priority} size="sm" />
                      </td>

                      <td className="py-3 px-3 border-r border-[#1a1a1a] font-semibold text-white whitespace-nowrap">
                        {task.product}
                      </td>

                      {/* Campaign with Copy helper */}
                      <td className="py-3 px-3 border-r border-[#1a1a1a] font-mono font-bold text-white whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate max-w-[150px]">{task.campaign}</span>
                          <button
                            type="button"
                            onClick={() => copyText(task.campaign, `camp-${task.id}`)}
                            className="text-zinc-500 hover:text-white cursor-pointer"
                            title="Copy Campaign Name"
                          >
                            {copiedKey === `camp-${task.id}` ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-3 border-r border-[#1a1a1a] whitespace-nowrap">
                        <span className="rounded bg-[#141414] border border-[#262626] px-1.5 py-0.5 font-semibold text-zinc-300 text-[11px]">
                          {task.action}
                        </span>
                      </td>

                      {/* Ad Account with Copy helper */}
                      <td className="py-3 px-3 border-r border-[#1a1a1a] font-mono font-bold text-zinc-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{task.adAccount}</span>
                          <button
                            type="button"
                            onClick={() => copyText(task.adAccount, `acc-${task.id}`)}
                            className="text-zinc-500 hover:text-white cursor-pointer"
                            title="Copy Ad Account"
                          >
                            {copiedKey === `acc-${task.id}` ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Ad Set Name with inline editing and copy helper */}
                      <td className="py-3 px-3 border-r border-[#1a1a1a] min-w-[200px]">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={vals.adSetName}
                            onChange={(e) => updateFormVal(task.id, 'adSetName', e.target.value)}
                            className="w-full rounded-md border border-[#262626] bg-black p-1 text-[11px] font-mono font-bold text-white focus:border-zinc-500 focus:outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={() => copyText(vals.adSetName, `adset-${task.id}`)}
                            className="text-zinc-500 hover:text-white p-1 cursor-pointer"
                            title="Copy Ad Set Name"
                          >
                            {copiedKey === `adset-${task.id}` ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Creative Folder */}
                      <td className="py-3 px-3 border-r border-[#1a1a1a] whitespace-nowrap">
                        {task.folderUrl ? (
                          <a
                            href={task.folderUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-blue-400 hover:underline"
                          >
                            <FolderOpen className="h-3.5 w-3.5" />
                            <span>Drive ({task.quantityDone}/{task.quantity})</span>
                          </a>
                        ) : (
                          <span className="text-zinc-500 text-xs">Approved</span>
                        )}
                      </td>

                      <td className="py-3 px-3 border-r border-[#1a1a1a] font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                        {task.deadline}
                      </td>

                      <td className="py-3 px-3 border-r border-[#1a1a1a] whitespace-nowrap">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold border ${
                            task.status === 'READY'
                              ? 'bg-teal-500/10 text-teal-400 border-teal-500/25'
                              : 'bg-[#141414] text-zinc-300 border border-[#262626]'
                          }`}
                        >
                          {task.status}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleLaunch(task)}
                          className="vercel-btn-primary flex items-center gap-1.5 py-1 px-3 ml-auto cursor-pointer"
                        >
                          <Rocket className="h-3.5 w-3.5 text-black" />
                          <span>Launch</span>
                        </button>
                      </td>
                    </tr>
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
