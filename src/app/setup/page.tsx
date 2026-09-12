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
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans w-full max-w-full min-w-0">
      {/* Top Banner */}
      <div className="border-b border-zinc-200 bg-white px-3 sm:px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Campaign &amp; Ad Set Setup Queue
              </h1>
              <span className="rounded-md bg-teal-100 dark:bg-teal-950 px-2 py-0.5 text-xs font-semibold text-teal-700 dark:text-teal-300 font-mono">
                Karl / Mark / Christian&apos;s Workspace
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Approved creative batches ready for Funnelish, pixel verification, tracking QA, and Meta launch.
            </p>
          </div>

          <span className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-300 self-start md:self-auto">
            {setupTasks.length} Batches in Setup
          </span>
        </div>

        {/* Search & View Mode Toolbar */}
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search campaign, ad account, product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white py-1.5 pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 text-xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white font-bold shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white font-bold shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <LayoutList className="h-3.5 w-3.5" />
              <span>Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Content matching §20 */}
      <div className="flex-1 p-3 sm:p-6 max-w-full">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <CheckCircle2 className="mx-auto h-8 w-8 text-teal-600" />
            <h3 className="mt-2 text-sm font-bold text-zinc-900 dark:text-white">
              Setup queue is clear!
            </h3>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Batches approved by Charles will automatically appear here for Karl, Mark, or Christian.
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          /* Responsive Mobile Cards for Setup Queue */
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((task) => {
              const vals = getFormVals(task);
              return (
                <div
                  key={task.id}
                  className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="space-y-3">
                    {/* Top Row */}
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2 dark:border-zinc-800">
                      <div className="flex items-center gap-1.5">
                        <PriorityPill priority={task.priority} size="sm" />
                        <span className="font-mono text-xs font-bold text-zinc-900 dark:text-white">
                          {formatTaskNumber(task.taskNumber)}
                        </span>
                        <MarketBadge market={task.market} size="xs" />
                        <span className="font-bold text-xs text-zinc-700 dark:text-zinc-300">
                          {task.product}
                        </span>
                      </div>
                      <span className="rounded bg-teal-100 dark:bg-teal-950 px-2 py-0.5 text-[10px] font-bold text-teal-700 dark:text-teal-300">
                        {task.status}
                      </span>
                    </div>

                    {/* Campaign with Copy helper */}
                    <div>
                      <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                        Campaign
                      </span>
                      <div className="flex items-center justify-between mt-0.5 rounded bg-zinc-50 dark:bg-zinc-800/60 p-2 border border-zinc-200 dark:border-zinc-700">
                        <span className="font-mono font-bold text-xs text-teal-800 dark:text-teal-300 truncate">
                          {task.campaign}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyText(task.campaign, `camp-${task.id}`)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white shrink-0 ml-2"
                        >
                          {copiedKey === `camp-${task.id}` ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          <span>Copy</span>
                        </button>
                      </div>
                    </div>

                    {/* Ad Account & Action */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded bg-zinc-50 dark:bg-zinc-800/60 p-2 border border-zinc-200 dark:border-zinc-700">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase block">Ad Account</span>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200 truncate">
                            {task.adAccount}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyText(task.adAccount, `acc-${task.id}`)}
                            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                            title="Copy Account"
                          >
                            {copiedKey === `acc-${task.id}` ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="rounded bg-zinc-50 dark:bg-zinc-800/60 p-2 border border-zinc-200 dark:border-zinc-700">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase block">Action</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 block truncate mt-0.5">
                          {task.action}
                        </span>
                      </div>
                    </div>

                    {/* Ad Set Name Input */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase text-zinc-400">
                          Ad Set Name (Meta)
                        </label>
                        <button
                          type="button"
                          onClick={() => copyText(vals.adSetName, `adset-${task.id}`)}
                          className="text-[10px] text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 font-semibold"
                        >
                          {copiedKey === `adset-${task.id}` ? (
                            <Check className="h-3 w-3 text-emerald-600" />
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
                        className="mt-1 w-full rounded-md border border-zinc-300 bg-white p-1.5 text-xs font-mono font-bold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                      />
                    </div>

                    {/* Drive Folder Link & Setup Notes */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      {task.folderUrl ? (
                        <a
                          href={task.folderUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-blue-600 hover:underline text-xs"
                        >
                          <FolderOpen className="h-3.5 w-3.5" />
                          <span>Drive Files ({task.quantityDone}/{task.quantity})</span>
                        </a>
                      ) : (
                        <span className="text-zinc-400 text-xs">Approved files</span>
                      )}
                      <span className="font-mono text-[11px] text-zinc-500">Due: {task.deadline}</span>
                    </div>
                  </div>

                  {/* Launch Button */}
                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                      onClick={() => handleLaunch(task)}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-2xs transition-colors"
                    >
                      <Rocket className="h-4 w-4" />
                      <span>Launch Ad Set in Meta</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Spreadsheet Table (with horizontal scroll wrapper) */
          <div className="w-full max-w-full min-w-0 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 px-1">
              <div className="flex items-center gap-1.5 font-medium">
                <ArrowRightLeft className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>Scroll table horizontally for setup fields & launch</span>
              </div>
              <span className="font-mono text-[10px] bg-zinc-200/70 dark:bg-zinc-800/80 px-2 py-0.5 rounded text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700/60">
                {filtered.length} tasks
              </span>
            </div>
            <div className="w-full max-w-full min-w-0 overflow-x-auto overscroll-x-contain touch-pan-x rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/95 shadow-xs custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
              <thead className="border-b border-zinc-200 bg-zinc-100/80 dark:border-zinc-800 dark:bg-zinc-800/80 font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Campaign</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Ad Account</th>
                  <th className="py-2.5 px-3">Ad Set Name</th>
                  <th className="py-2.5 px-3">Creative</th>
                  <th className="py-2.5 px-3">Deadline</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Launch Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filtered.map((task) => {
                  const vals = getFormVals(task);

                  return (
                    <tr
                      key={task.id}
                      className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50"
                    >
                      <td className="py-3 px-3 whitespace-nowrap">
                        <PriorityPill priority={task.priority} size="sm" />
                      </td>

                      <td className="py-3 px-3 font-bold text-zinc-900 dark:text-white whitespace-nowrap">
                        {task.product}
                      </td>

                      {/* Campaign with Copy helper */}
                      <td className="py-3 px-3 font-mono font-bold text-teal-800 dark:text-teal-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate max-w-[150px]">{task.campaign}</span>
                          <button
                            type="button"
                            onClick={() => copyText(task.campaign, `camp-${task.id}`)}
                            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                            title="Copy Campaign Name"
                          >
                            {copiedKey === `camp-${task.id}` ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 font-semibold text-zinc-800 dark:text-zinc-200 text-[11px]">
                          {task.action}
                        </span>
                      </td>

                      {/* Ad Account with Copy helper */}
                      <td className="py-3 px-3 font-mono font-bold text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{task.adAccount}</span>
                          <button
                            type="button"
                            onClick={() => copyText(task.adAccount, `acc-${task.id}`)}
                            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                            title="Copy Ad Account"
                          >
                            {copiedKey === `acc-${task.id}` ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Ad Set Name with inline editing and copy helper */}
                      <td className="py-3 px-3 min-w-[200px]">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={vals.adSetName}
                            onChange={(e) => updateFormVal(task.id, 'adSetName', e.target.value)}
                            className="w-full rounded border border-zinc-300 bg-white p-1 text-[11px] font-mono font-bold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => copyText(vals.adSetName, `adset-${task.id}`)}
                            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1"
                            title="Copy Ad Set Name"
                          >
                            {copiedKey === `adset-${task.id}` ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Creative Folder */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {task.folderUrl ? (
                          <a
                            href={task.folderUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-blue-600 hover:underline"
                          >
                            <FolderOpen className="h-3.5 w-3.5" />
                            <span>Drive ({task.quantityDone}/{task.quantity})</span>
                          </a>
                        ) : (
                          <span className="text-zinc-400">Approved</span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] whitespace-nowrap">
                        {task.deadline}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-extrabold ${
                            task.status === 'READY'
                              ? 'bg-teal-600 text-white'
                              : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'
                          }`}
                        >
                          {task.status}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleLaunch(task)}
                          className="flex items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition-colors ml-auto"
                        >
                          <Rocket className="h-3.5 w-3.5" />
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
