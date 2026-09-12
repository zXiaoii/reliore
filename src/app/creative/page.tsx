'use client';

import React, { useState } from 'react';
import { usePipeline } from '@/hooks/usePipeline';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { WorkTask, WorkStatus } from '@/types';
import {
  formatTaskNumber,
  getMarketFlag,
  sortTasks,
} from '@/lib/pipeline';
import { MarketBadge } from '@/components/common/MarketBadge';
import { PriorityPill } from '@/components/ui/PriorityPill';
import { CreativeTaskDetailModal } from '@/components/creative/CreativeTaskDetailModal';
import { WaitingForAccess } from '@/components/auth/WaitingForAccess';
import {
  Palette,
  Search,
  FolderOpen,
  CheckCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  Send,
  Save,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Edit3,
  Sparkles,
  Check,
  CheckCircle2,
  Info,
  LayoutList,
  Table as TableIcon,
  ArrowRightLeft,
} from 'lucide-react';
import { sendSlackCreativeNotification } from '@/lib/slack';

export default function CreativeQueuePage() {
  const { tasks, store } = usePipeline();
  const { isPendingAccess } = useAuth();
  const { toast } = useToast();

  const [selectedTask, setSelectedTask] = useState<WorkTask | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'owed' | 'delivered'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [tableDensity, setTableDensity] = useState<'fit' | 'relaxed'>('fit');
  
  // Track expanded rows in table: Set of task IDs
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['task-001']));

  // Local draft state for editable inputs: { [taskId]: { folderUrl, quantityDone, creativeNotes } }
  const [drafts, setDrafts] = useState<
    Record<
      string,
      {
        folderUrl: string;
        quantityDone: number;
        creativeNotes: string;
      }
    >
  >({});

  if (isPendingAccess) {
    return <WaitingForAccess />;
  }

  // Filter tasks for Yzah:
  // Active/Owed: QUEUE, MAKING, CHANGES REQUIRED
  // Delivered/Under Review: FOR REVIEW, APPROVED, READY, IN_SETUP, LIVE
  const creativeTasks = tasks.filter((t) => t.owner === 'Yzah' || t.stage === 'Creative');

  const owedQueue = creativeTasks.filter(
    (t) => t.status === 'QUEUE' || t.status === 'MAKING' || t.status === 'CHANGES REQUIRED'
  );

  const deliveredQueue = creativeTasks.filter(
    (t) =>
      t.status === 'FOR REVIEW' ||
      t.status === 'APPROVED' ||
      t.status === 'READY' ||
      t.status === 'IN_SETUP' ||
      t.status === 'LIVE'
  );

  const currentList =
    activeTab === 'all'
      ? creativeTasks
      : activeTab === 'owed'
      ? owedQueue
      : deliveredQueue;

  const sorted = sortTasks(currentList);

  const filtered = sorted.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.product.toLowerCase().includes(q) ||
      t.campaign.toLowerCase().includes(q) ||
      t.creativeTypes.join(' ').toLowerCase().includes(q) ||
      (t.winningHook && t.winningHook.toLowerCase().includes(q)) ||
      (t.reasonTrigger && t.reasonTrigger.toLowerCase().includes(q))
    );
  });

  const getDraft = (task: WorkTask) => {
    return (
      drafts[task.id] || {
        folderUrl: task.folderUrl || '',
        quantityDone: task.quantityDone !== undefined ? task.quantityDone : task.quantity,
        creativeNotes: task.creativeNotes || '',
      }
    );
  };

  const updateDraft = (taskId: string, field: string, value: any) => {
    setDrafts((prev) => {
      const task = tasks.find((t) => t.id === taskId);
      const existing = prev[taskId] || {
        folderUrl: task?.folderUrl || '',
        quantityDone: task?.quantityDone !== undefined ? task.quantityDone : (task?.quantity || 8),
        creativeNotes: task?.creativeNotes || '',
      };
      return {
        ...prev,
        [taskId]: {
          ...existing,
          [field]: value,
        },
      };
    });
  };

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

  // 1. Save changes to Drive link or notes on an ALREADY SUBMITTED task
  const handleUpdateSubmittedFiles = (task: WorkTask) => {
    const draft = getDraft(task);
    const url = draft.folderUrl.trim();

    const updatedTask = {
      ...task,
      folderUrl: url,
      quantityDone: Number(draft.quantityDone),
      creativeNotes: draft.creativeNotes.trim(),
    };

    store.updateTask(
      task.id,
      {
        folderUrl: url,
        quantityDone: Number(draft.quantityDone),
        creativeNotes: draft.creativeNotes.trim(),
      },
      { uid: 'yzah-03', displayName: 'Yzah' }
    );

    // Send Slack alert
    sendSlackCreativeNotification(updatedTask, 'Yzah (Creative)').then((res) => {
      if (res.ok && !res.simulated) {
        toast.success('🔔 Slack notification sent to team channel!');
      }
    });

    toast.success(`Updated Drive files & notes for ${task.campaign}! Charles can see the latest assets.`);
  };

  // 2. Save a work-in-progress draft
  const handleSaveDraft = (task: WorkTask) => {
    const draft = getDraft(task);
    store.updateTask(
      task.id,
      {
        folderUrl: draft.folderUrl.trim(),
        quantityDone: Number(draft.quantityDone),
        creativeNotes: draft.creativeNotes.trim(),
        status: 'MAKING',
      },
      { uid: 'yzah-03', displayName: 'Yzah' }
    );
    toast.success(`Draft saved for ${formatTaskNumber(task.taskNumber)}.`);
  };

  // 3. Initial deliver batch to Charles
  const handleDeliver = (task: WorkTask) => {
    const draft = getDraft(task);
    const url = draft.folderUrl.trim();

    if (!url) {
      toast.error('Please paste Google Drive folder URL before delivering.');
      return;
    }

    const updatedTask: WorkTask = {
      ...task,
      folderUrl: url,
      quantityDone: task.quantity,
      creativeNotes: draft.creativeNotes.trim(),
      status: 'FOR REVIEW',
      nextAction: 'Charles review creative batch & approve/request changes',
    };

    store.updateTask(
      task.id,
      {
        folderUrl: url,
        quantityDone: task.quantity,
        creativeNotes: draft.creativeNotes.trim(),
        status: 'FOR REVIEW',
        nextAction: 'Charles review creative batch & approve/request changes',
      },
      { uid: 'yzah-03', displayName: 'Yzah' }
    );

    // Dispatch Slack alert to Charles & media buying channel
    sendSlackCreativeNotification(updatedTask, 'Yzah (Creative)').then((res) => {
      if (res.ok) {
        if (!res.simulated) {
          toast.success('🔔 Slack alert posted to #creative-deliveries!');
        } else {
          toast.info('⚡ Slack notification simulated (set webhook in Settings to send to live channel)');
        }
      }
    });

    toast.success(
      `Batch ${formatTaskNumber(task.taskNumber)} delivered to Charles for approval!`
    );
  };

  // 4. Re-deliver after revisions were requested
  const handleReDeliver = (task: WorkTask) => {
    const draft = getDraft(task);
    const url = draft.folderUrl.trim();

    if (!url) {
      toast.error('Please paste Google Drive folder URL before re-submitting.');
      return;
    }

    const updatedTask: WorkTask = {
      ...task,
      folderUrl: url,
      quantityDone: task.quantity,
      creativeNotes: draft.creativeNotes.trim(),
      status: 'FOR REVIEW',
      nextAction: 'Charles review revised creative batch',
    };

    store.updateTask(
      task.id,
      {
        folderUrl: url,
        quantityDone: task.quantity,
        creativeNotes: draft.creativeNotes.trim(),
        status: 'FOR REVIEW',
        nextAction: 'Charles review revised creative batch',
      },
      { uid: 'yzah-03', displayName: 'Yzah' }
    );

    // Dispatch Slack alert
    sendSlackCreativeNotification(updatedTask, 'Yzah (Creative)').then((res) => {
      if (res.ok && !res.simulated) {
        toast.success('🔔 Slack alert posted for revised batch!');
      }
    });

    toast.success(`Revised batch re-submitted to Charles!`);
  };

  // Auto-save Drive link when edited in compact row (on Enter or Blur)
  const handleAutoSaveDriveUrl = (task: WorkTask) => {
    const draft = getDraft(task);
    if (draft.folderUrl !== task.folderUrl) {
      store.updateTask(
        task.id,
        { folderUrl: draft.folderUrl.trim() },
        { uid: 'yzah-03', displayName: 'Yzah' }
      );
      toast.success('Drive link saved.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-[#ededed] font-sans w-full max-w-full min-w-0">
      {/* Top Banner - Vercel Clean Aesthetic */}
      <div className="border-b border-[#1f1f1f] bg-black px-4 py-5 sm:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 max-w-7xl mx-auto w-full">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                Creative Production Queue
              </h1>
              <span className="rounded-md bg-[#121212] border border-[#262626] px-2 py-0.5 text-xs font-mono font-semibold text-purple-300">
                Yzah&apos;s Dedicated Workspace
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Strictly prioritized. Expand any brief below to view requirements or update your Google Drive link and notes anytime.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Filter Tabs (Vercel Segmented Control) */}
            <div className="flex items-center rounded-md bg-black border border-[#262626] p-0.5 text-xs font-medium">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-[#181818] text-white border border-[#383838] font-bold shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                All Tasks ({creativeTasks.length})
              </button>

              <button
                onClick={() => setActiveTab('owed')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors cursor-pointer ${
                  activeTab === 'owed'
                    ? 'bg-[#181818] text-white border border-[#383838] font-bold shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                <span>To Make ({owedQueue.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('delivered')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors cursor-pointer ${
                  activeTab === 'delivered'
                    ? 'bg-[#181818] text-white border border-[#383838] font-bold shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                <span>Under Review / Live ({deliveredQueue.length})</span>
              </button>
            </div>

            {/* Expand / Collapse All */}
            <button
              onClick={() => {
                if (expandedIds.size === filtered.length && filtered.length > 0) {
                  collapseAll();
                } else {
                  expandAll();
                }
              }}
              className="vercel-btn-secondary flex items-center gap-1 cursor-pointer"
              title="Expand or collapse all briefs"
            >
              <ChevronsUpDown className="h-3.5 w-3.5 text-zinc-400" />
              <span>
                {expandedIds.size === filtered.length && filtered.length > 0
                  ? 'Collapse All'
                  : 'Expand All'}
              </span>
            </button>
          </div>
        </div>

        {/* Search & View Mode */}
        <div className="mt-4 pt-3 border-t border-[#1a1a1a] flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-7xl mx-auto w-full">
          {/* Vercel Search Box with / Keyboard Badge */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search tasks, products, hooks, reasons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-[#262626] bg-black py-1.5 pl-8 pr-8 text-xs text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-hidden transition-colors"
            />
            <span className="absolute right-2 top-2 vercel-kbd">/</span>
          </div>

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

      {/* Main Table with In-Place Expansion */}
      <div className="flex-1 p-4 sm:p-8 overflow-x-auto max-w-7xl mx-auto w-full">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-12 text-center shadow-xs">
            <CheckCircle className="mx-auto h-8 w-8 text-emerald-400" />
            <h3 className="mt-2 text-sm font-bold text-white">
              {activeTab === 'owed'
                ? 'No pending creative batches to make!'
                : 'No tasks matching your filter.'}
            </h3>
            <p className="mt-1 text-xs text-zinc-400">
              New tasks assigned by Charles will appear here immediately.
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          /* Responsive Cards View for Mobile & Tablet */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((task) => {
              const draft = getDraft(task);
              const isExpanded = expandedIds.has(task.id);
              const isChangesRequired = task.status === 'CHANGES REQUIRED';
              const isForReview = task.status === 'FOR REVIEW';
              const isApproved = task.status === 'APPROVED' || task.status === 'READY' || task.status === 'LIVE';

              return (
                <div
                  key={task.id}
                  className={`flex flex-col justify-between rounded-xl border p-4 shadow-2xs transition-all dark:bg-zinc-900 ${
                    isChangesRequired
                      ? 'border-rose-300 bg-rose-50/40 dark:border-rose-900 dark:bg-rose-950/20'
                      : isExpanded
                      ? 'border-purple-300 bg-purple-50/20 dark:border-purple-900 dark:bg-purple-950/10'
                      : 'border-zinc-200 bg-white'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2 dark:border-zinc-800">
                      <div className="flex items-center gap-1.5">
                        <PriorityPill priority={task.priority} size="sm" />
                        <span className="font-mono text-xs font-bold text-zinc-900 dark:text-white">
                          {formatTaskNumber(task.taskNumber)}
                        </span>
                        <MarketBadge market={task.market} size="xs" />
                        <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">
                          {task.product}
                        </span>
                      </div>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-extrabold ${
                          isChangesRequired
                            ? 'bg-rose-600 text-white'
                            : isForReview
                            ? 'bg-amber-500 text-white'
                            : isApproved
                            ? 'bg-emerald-600 text-white'
                            : task.status === 'MAKING'
                            ? 'bg-purple-600 text-white'
                            : 'bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200'
                        }`}
                      >
                        {isForReview ? 'UNDER REVIEW' : task.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-mono text-sm font-extrabold text-teal-800 dark:text-teal-300 truncate">
                        {task.campaign}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="rounded bg-purple-100 dark:bg-purple-950 px-2 py-0.5 font-bold font-mono text-purple-700 dark:text-purple-300 text-[11px]">
                          {task.creativeTypes.join(' + ')}
                        </span>
                        <span className="text-zinc-500 font-mono text-[11px]">
                          {task.quantity} Variants ({task.format || '9:16 Video'})
                        </span>
                      </div>
                    </div>

                    {task.reasonTrigger && (
                      <div className="rounded bg-zinc-50 dark:bg-zinc-800/50 p-2 text-xs border border-zinc-100 dark:border-zinc-800">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase block">Why (Trigger)</span>
                        <p className="text-purple-700 dark:text-purple-300 font-medium line-clamp-1 mt-0.5">
                          {task.reasonTrigger}
                        </p>
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase text-zinc-500">
                          Google Drive Batch Folder
                        </label>
                        {draft.folderUrl.trim() && (
                          <a
                            href={draft.folderUrl.trim()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 font-mono font-bold"
                          >
                            <ExternalLink className="h-2.5 w-2.5" />
                            <span>Open</span>
                          </a>
                        )}
                      </div>
                      <input
                        type="url"
                        placeholder="Paste Drive URL..."
                        value={draft.folderUrl}
                        onChange={(e) => updateDraft(task.id, 'folderUrl', e.target.value)}
                        onBlur={() => handleAutoSaveDriveUrl(task)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                        }}
                        className="w-full rounded-md border border-zinc-300 bg-white p-2 text-xs font-mono text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => toggleExpand(task.id)}
                        className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800 dark:text-purple-400"
                      >
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        <span>{isExpanded ? 'Hide Brief Details' : 'View Full Brief & Instructions ▾'}</span>
                      </button>

                      {isExpanded && (
                        <div className="mt-2 space-y-2 rounded-lg bg-purple-50/50 p-3 border border-purple-200 dark:border-purple-900/40 dark:bg-purple-950/20 text-xs">
                          <div>
                            <span className="text-[10px] text-zinc-400 font-bold uppercase block">Winning Reference</span>
                            <p className="font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5">{task.winningReference || task.referenceUrl || 'None'}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-400 font-bold uppercase block">Winning Hook</span>
                            <p className="font-semibold text-zinc-900 dark:text-white mt-0.5">{task.winningHook || 'Concept angles'}</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            <div className="rounded bg-emerald-50 dark:bg-emerald-950/20 p-2 border border-emerald-200 dark:border-emerald-900/40">
                              <span className="text-emerald-700 dark:text-emerald-400 text-[10px] font-bold block">✓ Keep</span>
                              <p className="text-zinc-800 dark:text-zinc-200 text-[11px] mt-0.5">{task.whatToKeep || 'Core hook & offer'}</p>
                            </div>
                            <div className="rounded bg-rose-50 dark:bg-rose-950/20 p-2 border border-rose-200 dark:border-rose-900/40">
                              <span className="text-rose-700 dark:text-rose-400 text-[10px] font-bold block">✗ Change</span>
                              <p className="text-zinc-800 dark:text-zinc-200 text-[11px] mt-0.5">{task.whatToChange || 'Pacing & visuals'}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    {isForReview ? (
                      <button
                        type="button"
                        onClick={() => handleUpdateSubmittedFiles(task)}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-2xs transition-colors"
                      >
                        <Save className="h-4 w-4" />
                        <span>Save &amp; Update Files for Charles</span>
                      </button>
                    ) : isChangesRequired ? (
                      <button
                        type="button"
                        onClick={() => handleReDeliver(task)}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow-2xs transition-colors"
                      >
                        <Send className="h-4 w-4" />
                        <span>Re-Submit Revised Batch to Charles</span>
                      </button>
                    ) : isApproved ? (
                      <button
                        type="button"
                        onClick={() => handleUpdateSubmittedFiles(task)}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-2xs transition-colors"
                      >
                        <Save className="h-4 w-4" />
                        <span>Save Updated Files for Karl</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDeliver(task)}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-purple-600 hover:bg-purple-700 px-4 py-2 text-xs font-bold text-white shadow-2xs transition-colors"
                      >
                        <Send className="h-4 w-4" />
                        <span>Deliver to Charles ({task.quantity})</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="w-full max-w-full min-w-0 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400 px-1">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold font-mono text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {tableDensity === 'fit' ? 'FIT TO SCREEN' : 'RELAXED'}
                </span>
                <span className="hidden sm:inline text-zinc-500">·</span>
                <span className="hidden sm:inline text-zinc-400">
                  {tableDensity === 'fit' ? 'All 13 columns visible without scrolling' : 'Wide columns with horizontal scroll enabled'}
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
                  {filtered.length} {filtered.length === 1 ? 'task' : 'tasks'}
                </span>
              </div>
            </div>

            <div className={`w-full max-w-full min-w-0 rounded-xl border border-[#222222] bg-[#0a0a0a] shadow-xs custom-scrollbar ${tableDensity === 'fit' ? 'overflow-x-auto lg:overflow-x-visible' : 'overflow-x-auto overscroll-x-contain'}`}>
              <table className={`w-full text-left text-xs border-collapse ${tableDensity === 'fit' ? 'w-full' : 'min-w-[1150px]'}`}>
                <thead className="border-b border-[#222222] bg-black font-semibold text-zinc-400 uppercase tracking-wider text-[10px] sticky top-0">
                  <tr>
                    <th className={`${tableDensity === 'fit' ? 'w-[28px] py-2 px-1' : 'py-2.5 px-2'} text-center border-r border-[#1f1f1f]`}>View</th>
                    <th className={`${tableDensity === 'fit' ? 'w-[48px] py-2 px-1' : 'py-2.5 px-3'} border-r border-[#1f1f1f]`}>Priority</th>
                    <th className={`${tableDensity === 'fit' ? 'w-[75px] py-2 px-1.5' : 'py-2.5 px-3'} border-r border-[#1f1f1f]`}>Product</th>
                    <th className={`${tableDensity === 'fit' ? 'w-[50px] py-2 px-1' : 'py-2.5 px-2'} border-r border-[#1f1f1f]`}>Mkt</th>
                    <th className={`${tableDensity === 'fit' ? 'w-[115px] py-2 px-1.5' : 'py-2.5 px-3'} border-r border-[#1f1f1f]`}>Campaign</th>
                    <th className={`${tableDensity === 'fit' ? 'w-[95px] py-2 px-1.5' : 'py-2.5 px-3'} border-r border-[#1f1f1f]`}>Trigger</th>
                    <th className={`${tableDensity === 'fit' ? 'w-[110px] py-2 px-1.5' : 'py-2.5 px-3'} border-r border-[#1f1f1f]`}>Task</th>
                    <th className={`${tableDensity === 'fit' ? 'w-[110px] py-2 px-1.5' : 'py-2.5 px-3'} border-r border-[#1f1f1f]`}>Winning Hook</th>
                    <th className={`${tableDensity === 'fit' ? 'w-[32px] py-2 px-1' : 'py-2.5 px-2'} text-center border-r border-[#1f1f1f]`}>Qty</th>
                    <th className={`${tableDensity === 'fit' ? 'w-[105px] py-2 px-1' : 'py-2.5 px-3'} border-r border-[#1f1f1f]`}>Drive Link</th>
                    <th className={`${tableDensity === 'fit' ? 'w-[58px] py-2 px-1' : 'py-2.5 px-3'} border-r border-[#1f1f1f]`}>Deadline</th>
                    <th className={`${tableDensity === 'fit' ? 'w-[75px] py-2 px-1 text-center' : 'py-2.5 px-3'} border-r border-[#1f1f1f]`}>Status</th>
                    <th className={`${tableDensity === 'fit' ? 'w-[78px] py-2 px-1 text-right' : 'py-2.5 px-3 text-right'}`}>Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]">
                  {filtered.map((task) => {
                    const draft = getDraft(task);
                    const isExpanded = expandedIds.has(task.id);
                    const isChangesRequired = task.status === 'CHANGES REQUIRED';
                    const isForReview = task.status === 'FOR REVIEW';
                    const isApproved = task.status === 'APPROVED' || task.status === 'READY' || task.status === 'LIVE';

                    return (
                      <React.Fragment key={task.id}>
                        {/* Summary Row */}
                        <tr
                          className={`transition-colors hover:bg-[#141414] ${
                            isChangesRequired
                              ? 'bg-rose-950/20'
                              : isExpanded
                              ? 'bg-purple-950/15'
                              : 'bg-[#0a0a0a]'
                          }`}
                        >
                          {/* Expand / Collapse Toggle Chevron */}
                          <td className={`${tableDensity === 'fit' ? 'py-1.5 px-1' : 'py-3 px-2'} text-center border-r border-[#1a1a1a]`}>
                            <button
                              onClick={() => toggleExpand(task.id)}
                              className="p-1 rounded hover:bg-[#222] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                              title={isExpanded ? 'Collapse brief' : 'Expand full brief'}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-3.5 w-3.5 text-purple-400 font-bold" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </td>

                          {/* Priority */}
                          <td className={`${tableDensity === 'fit' ? 'py-1.5 px-1' : 'py-3 px-3'} border-r border-[#1a1a1a] whitespace-nowrap`}>
                            <PriorityPill priority={task.priority} size="sm" compact={tableDensity === 'fit'} />
                          </td>

                          {/* Product */}
                          <td className={`${tableDensity === 'fit' ? 'py-1.5 px-1.5' : 'py-3 px-3'} border-r border-[#1a1a1a] font-semibold text-white whitespace-nowrap`}>
                            <span className="truncate block max-w-[75px]" title={task.product}>
                              {task.product}
                            </span>
                          </td>

                          {/* Market */}
                          <td className={`${tableDensity === 'fit' ? 'py-1.5 px-1' : 'py-3 px-2'} border-r border-[#1a1a1a] whitespace-nowrap`}>
                            <MarketBadge market={task.market} size="xs" shortCode={tableDensity === 'fit'} />
                          </td>

                          {/* Campaign */}
                          <td className={`${tableDensity === 'fit' ? 'py-1.5 px-1.5' : 'py-3 px-3'} border-r border-[#1a1a1a] font-mono font-bold text-white whitespace-nowrap`}>
                            <span className="truncate block max-w-[115px]" title={task.campaign}>
                              {task.campaign}
                            </span>
                          </td>

                          {/* Why / Trigger */}
                          <td
                            className={`${tableDensity === 'fit' ? 'py-1.5 px-1.5' : 'py-3 px-3'} border-r border-[#1a1a1a] text-purple-400 font-medium whitespace-nowrap`}
                          >
                            <span className="truncate block max-w-[95px]" title={task.reasonTrigger || '+1 Day Trigger'}>
                              {task.reasonTrigger || '+1 Day Trigger'}
                            </span>
                          </td>

                          {/* Task / Concept */}
                          <td className={`${tableDensity === 'fit' ? 'py-1.5 px-1.5' : 'py-3 px-3'} border-r border-[#1a1a1a] font-mono font-bold text-zinc-300 whitespace-nowrap`}>
                            <span className="truncate block max-w-[110px]" title={task.creativeTypes.join(' + ')}>
                              {task.creativeTypes.join(' + ')}
                            </span>
                          </td>

                          {/* Winning Hook */}
                          <td
                            className={`${tableDensity === 'fit' ? 'py-1.5 px-1.5' : 'py-3 px-3'} border-r border-[#1a1a1a] font-medium text-zinc-300 whitespace-nowrap`}
                          >
                            <span className="truncate block max-w-[110px]" title={task.winningHook || 'Concept angles'}>
                              {task.winningHook || 'Concept angles'}
                            </span>
                          </td>

                          {/* Qty */}
                          <td className={`${tableDensity === 'fit' ? 'py-1.5 px-1' : 'py-3 px-2'} border-r border-[#1a1a1a] font-mono font-bold text-center text-white`}>
                            {task.quantity}
                          </td>

                          {/* Drive Link Input */}
                          <td className={`${tableDensity === 'fit' ? 'py-1.5 px-1' : 'py-3 px-3'} border-r border-[#1a1a1a]`}>
                            <div className="flex items-center gap-1">
                              <input
                                type="url"
                                placeholder="Drive URL..."
                                value={draft.folderUrl}
                                onChange={(e) => updateDraft(task.id, 'folderUrl', e.target.value)}
                                onBlur={() => handleAutoSaveDriveUrl(task)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.currentTarget.blur();
                                  }
                                }}
                                className="w-full rounded border border-[#262626] bg-black px-1.5 py-0.5 text-[10px] font-mono text-white placeholder-zinc-500 focus:border-zinc-400 focus:outline-hidden"
                              />
                              {draft.folderUrl.trim() && (
                                <a
                                  href={draft.folderUrl.trim()}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 text-blue-400 hover:text-blue-300 shrink-0"
                                  title="Open Drive folder"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </td>

                          {/* Deadline */}
                          <td className={`${tableDensity === 'fit' ? 'py-1.5 px-1' : 'py-3 px-3'} border-r border-[#1a1a1a] font-mono text-[10px] font-bold text-zinc-400 whitespace-nowrap`}>
                            <span className="truncate block max-w-[58px]" title={task.deadline}>
                              {task.deadline}
                            </span>
                          </td>

                          {/* Status */}
                          <td className={`${tableDensity === 'fit' ? 'py-1.5 px-1 text-center' : 'py-3 px-3'} border-r border-[#1a1a1a] whitespace-nowrap`}>
                            <span
                              className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-extrabold ${
                                task.status === 'CHANGES REQUIRED'
                                  ? 'bg-rose-600/90 text-white'
                                  : task.status === 'FOR REVIEW'
                                  ? 'bg-amber-500/90 text-white'
                                  : task.status === 'APPROVED'
                                  ? 'bg-emerald-600/90 text-white'
                                  : task.status === 'MAKING'
                                  ? 'bg-purple-600/90 text-white'
                                  : 'bg-[#181818] border border-[#2e2e2e] text-zinc-300'
                              }`}
                            >
                              {task.status === 'FOR REVIEW' ? 'REVIEW' : task.status === 'CHANGES REQUIRED' ? 'CHANGES' : task.status}
                            </span>
                          </td>

                          {/* Single Clear Action Button */}
                          <td className={`${tableDensity === 'fit' ? 'py-1.5 px-1 text-right' : 'py-3 px-3 text-right'} whitespace-nowrap`}>
                            {isChangesRequired ? (
                              <button
                                onClick={() => {
                                  if (!isExpanded) toggleExpand(task.id);
                                  else handleReDeliver(task);
                                }}
                                className="rounded bg-rose-600 hover:bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs cursor-pointer"
                              >
                                {isExpanded ? 'Re-Submit' : 'Feedback'}
                              </button>
                            ) : isForReview ? (
                              <button
                                onClick={() => toggleExpand(task.id)}
                                className="rounded bg-[#161616] border border-[#2a2a2a] hover:bg-[#202020] px-2 py-0.5 text-[10px] font-bold text-zinc-200 cursor-pointer"
                              >
                                {isExpanded ? 'Collapse' : 'Review ▾'}
                              </button>
                            ) : isApproved ? (
                              <button
                                onClick={() => toggleExpand(task.id)}
                                className="rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/80 px-2 py-0.5 text-[10px] font-bold cursor-pointer"
                              >
                                {isExpanded ? 'Collapse' : 'Approved'}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDeliver(task)}
                                className="vercel-btn-primary px-2 py-0.5 text-[10px] cursor-pointer"
                              >
                                Deliver ({task.quantity})
                              </button>
                            )}
                          </td>
                        </tr>

                      {/* IN-PLACE EXPANDED WORKSPACE ACCORDION */}
                      {isExpanded && (
                        <tr className="bg-zinc-100/70 dark:bg-zinc-900/90 border-y-2 border-purple-300 dark:border-purple-800">
                          <td colSpan={13} className="p-4 sm:p-6">
                            <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                              {/* Header of expanded card */}
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 gap-2">
                                <div className="flex items-center gap-2.5">
                                  <PriorityPill priority={task.priority} size="sm" />
                                  <span className="font-mono text-sm font-extrabold text-zinc-900 dark:text-white">
                                    {formatTaskNumber(task.taskNumber)}
                                  </span>
                                  <MarketBadge market={task.market} size="xs" />
                                  <span className="rounded bg-purple-100 dark:bg-purple-950 px-2 py-0.5 text-xs font-bold text-purple-700 dark:text-purple-300 font-mono">
                                    {task.creativeTypes.join(' + ')}
                                  </span>
                                  <span className="text-xs text-zinc-500 font-medium">
                                    {task.product} — <span className="font-mono font-bold text-teal-700 dark:text-teal-300">{task.campaign}</span> ({task.adAccount})
                                  </span>
                                </div>

                                <div className="flex items-center gap-3 text-xs">
                                  <span className="text-zinc-500 dark:text-zinc-400">
                                    Next Handover: <strong className="text-teal-600 dark:text-teal-400">{task.assignedSetupUser || 'Karl'}</strong> (Setup Executor)
                                  </span>
                                  <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                                    Due: {task.deadline}
                                  </span>
                                </div>
                              </div>

                              {/* 2-Column Layout: Left = Brief, Right = Editable Inputs */}
                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
                                {/* LEFT: Comprehensive Creative Brief (§18) */}
                                <div className="lg:col-span-7 space-y-3">
                                  <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 dark:border-purple-900/50 dark:bg-purple-950/20 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        <span>Production Brief Instructions</span>
                                      </span>
                                      <span className="font-mono text-[11px] font-bold text-purple-700 dark:text-purple-300">
                                        {task.format || '9:16 Video'} • {task.quantity} Variants
                                      </span>
                                    </div>

                                    {/* 1. What & Why */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                      <div className="bg-white/80 dark:bg-zinc-900/80 p-2.5 rounded-lg border border-purple-100 dark:border-purple-900/40">
                                        <span className="text-zinc-400 text-[10px] uppercase font-bold block">
                                          1. What do I make?
                                        </span>
                                        <p className="font-bold text-zinc-900 dark:text-white mt-0.5">
                                          {task.quantity} variants of {task.creativeTypes.join(' + ')}
                                        </p>
                                      </div>

                                      <div className="bg-white/80 dark:bg-zinc-900/80 p-2.5 rounded-lg border border-purple-100 dark:border-purple-900/40">
                                        <span className="text-zinc-400 text-[10px] uppercase font-bold block">
                                          2. Why am I making it?
                                        </span>
                                        <p className="font-semibold text-purple-700 dark:text-purple-300 mt-0.5">
                                          {task.reasonTrigger || 'Winner iteration / CBO testing'}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Reference & Winning Hook */}
                                    <div className="space-y-2 pt-1">
                                      <div>
                                        <span className="text-zinc-400 text-[10px] uppercase font-bold block">
                                          3. Winning Reference / Swipe
                                        </span>
                                        <p className="font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5 bg-white/70 dark:bg-zinc-900/70 p-2 rounded border border-zinc-200 dark:border-zinc-800">
                                          {task.winningReference || task.referenceUrl || 'None attached'}
                                        </p>
                                      </div>

                                      <div>
                                        <span className="text-zinc-400 text-[10px] uppercase font-bold block">
                                          4. Winning Hook / Angle
                                        </span>
                                        <div className="mt-0.5 rounded-lg bg-amber-500/10 p-2.5 border border-amber-500/30 text-zinc-900 dark:text-white">
                                          <p className="font-bold text-amber-900 dark:text-amber-200">
                                            {task.winningHook || 'Fresh hook variations'}
                                          </p>
                                          {task.winningAngle && (
                                            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1">
                                              Angle: <em>{task.winningAngle}</em>
                                            </p>
                                          )}
                                        </div>
                                      </div>

                                      {/* Keep vs Change */}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 p-2.5">
                                          <span className="text-emerald-700 dark:text-emerald-400 text-[10px] uppercase font-bold block">
                                            ✓ What To Keep
                                          </span>
                                          <p className="text-zinc-800 dark:text-zinc-200 font-medium mt-0.5">
                                            {task.whatToKeep || 'Hook structure & core offer'}
                                          </p>
                                        </div>

                                        <div className="rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 p-2.5">
                                          <span className="text-rose-700 dark:text-rose-400 text-[10px] uppercase font-bold block">
                                            ✗ What To Change
                                          </span>
                                          <p className="text-zinc-800 dark:text-zinc-200 font-medium mt-0.5">
                                            {task.whatToChange || 'Visual execution & pacing'}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* RIGHT: Deliverables Workspace (Crystal Clear Action Based on Status) */}
                                <div className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/70 space-y-4">
                                  <div className="space-y-3">
                                    {/* 1. EXPLICIT STATUS BANNER: Explains exactly what state the task is in */}
                                    {isForReview ? (
                                      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                                        <div className="flex items-center gap-1.5 font-bold mb-1">
                                          <Clock className="h-4 w-4 text-amber-600" />
                                          <span>Batch Delivered — Currently Under Review</span>
                                        </div>
                                        <p className="text-[11px] leading-relaxed">
                                          Charles has this batch in his approval queue. If you need to replace files, fix a link, or add comments, edit below and click <strong>Save &amp; Update Files</strong>.
                                        </p>
                                      </div>
                                    ) : isChangesRequired ? (
                                      <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                                        <div className="flex items-center gap-1.5 font-bold mb-1 text-rose-700 dark:text-rose-300">
                                          <AlertTriangle className="h-4 w-4" />
                                          <span>Revisions Requested by Charles</span>
                                        </div>
                                        <p className="font-medium text-[11px]">
                                          &ldquo;{task.feedback || 'Please adjust hooks according to feedback.'}&rdquo;
                                        </p>
                                      </div>
                                    ) : isApproved ? (
                                      <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
                                        <div className="flex items-center gap-1.5 font-bold mb-1">
                                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                          <span>Approved — Handed to Setup ({task.assignedSetupUser || 'Karl'})</span>
                                        </div>
                                        <p className="text-[11px] leading-relaxed">
                                          This batch is approved for launch in Meta. Any link changes made here will automatically sync to Karl&apos;s setup queue.
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="rounded-lg border border-purple-200 bg-purple-50/70 p-2.5 text-xs text-purple-900 dark:border-purple-900/50 dark:bg-purple-950/30 dark:text-purple-200">
                                        <div className="flex items-center gap-1.5 font-bold">
                                          <Palette className="h-4 w-4 text-purple-600" />
                                          <span>In Creative Production</span>
                                        </div>
                                        <p className="text-[11px] mt-0.5">
                                          Paste your Google Drive batch folder below and click Deliver when all variants are rendered.
                                        </p>
                                      </div>
                                    )}

                                    {/* 2. Drive Link Input */}
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                                          Google Drive Batch Folder
                                        </label>
                                        {draft.folderUrl.trim() && (
                                          <a
                                            href={draft.folderUrl.trim()}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 font-mono font-bold"
                                          >
                                            <ExternalLink className="h-2.5 w-2.5" />
                                            <span>Open in Drive</span>
                                          </a>
                                        )}
                                      </div>
                                      <input
                                        type="url"
                                        value={draft.folderUrl}
                                        onChange={(e) => updateDraft(task.id, 'folderUrl', e.target.value)}
                                        placeholder="https://drive.google.com/drive/folders/..."
                                        className="w-full rounded-md border border-zinc-300 bg-white p-2 text-xs font-mono text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                      />
                                    </div>

                                    {/* 3. Variants Completed Counter */}
                                    <div className="space-y-1">
                                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                                        Variants Exported ({draft.quantityDone}/{task.quantity})
                                      </label>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="number"
                                          min={0}
                                          max={task.quantity}
                                          value={draft.quantityDone}
                                          onChange={(e) => updateDraft(task.id, 'quantityDone', Number(e.target.value))}
                                          className="w-16 rounded border border-zinc-300 bg-white p-1 text-xs font-mono text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white text-center font-bold"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => updateDraft(task.id, 'quantityDone', Math.floor(task.quantity / 2))}
                                          className="rounded bg-zinc-200 dark:bg-zinc-700 px-2 py-1 text-[10px] font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-300"
                                        >
                                          Half ({Math.floor(task.quantity / 2)})
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => updateDraft(task.id, 'quantityDone', task.quantity)}
                                          className="rounded bg-purple-100 dark:bg-purple-950 px-2 py-1 text-[10px] font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-200"
                                        >
                                          All ({task.quantity}) Done
                                        </button>
                                      </div>
                                    </div>

                                    {/* 4. Yzah's Creative Notes */}
                                    <div className="space-y-1">
                                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                                        Yzah&apos;s Revision &amp; Batch Notes
                                      </label>
                                      <textarea
                                        rows={2}
                                        value={draft.creativeNotes}
                                        onChange={(e) => updateDraft(task.id, 'creativeNotes', e.target.value)}
                                        placeholder="Add notes for Charles (e.g. 'Updated hooks 1-4 with larger text, hook 5 has new VO')..."
                                        className="w-full rounded-md border border-zinc-300 bg-white p-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                      />
                                    </div>
                                  </div>

                                  {/* 5. SINGLE UNAMBIGUOUS ACTION FOOTER: Clear purpose for every state */}
                                  <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
                                    {isForReview ? (
                                      <div className="space-y-1">
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateSubmittedFiles(task)}
                                          className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-2xs transition-colors"
                                        >
                                          <Save className="h-4 w-4" />
                                          <span>Save &amp; Update Files for Charles</span>
                                        </button>
                                        <p className="text-[10px] text-zinc-500 text-center">
                                          Charles automatically receives your updated Drive folder link and notes.
                                        </p>
                                      </div>
                                    ) : isChangesRequired ? (
                                      <div className="space-y-1">
                                        <button
                                          type="button"
                                          onClick={() => handleReDeliver(task)}
                                          className="w-full flex items-center justify-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow-2xs transition-colors"
                                        >
                                          <Send className="h-4 w-4" />
                                          <span>Re-Submit Revised Batch to Charles</span>
                                        </button>
                                        <p className="text-[10px] text-zinc-500 text-center">
                                          Notifies Charles that revisions are ready for re-review.
                                        </p>
                                      </div>
                                    ) : isApproved ? (
                                      <div className="space-y-1">
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateSubmittedFiles(task)}
                                          className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-2xs transition-colors"
                                        >
                                          <Save className="h-4 w-4" />
                                          <span>Save Updated Files for Karl</span>
                                        </button>
                                        <p className="text-[10px] text-zinc-500 text-center">
                                          Syncs latest folder link directly to Karl&apos;s setup queue.
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-between gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handleSaveDraft(task)}
                                          className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                                        >
                                          <Save className="h-3.5 w-3.5" />
                                          <span>Save Draft</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => handleDeliver(task)}
                                          className="flex items-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 px-4 py-1.5 text-xs font-bold text-white shadow-2xs"
                                        >
                                          <Send className="h-3.5 w-3.5" />
                                          <span>Deliver to Charles ({task.quantity})</span>
                                        </button>
                                      </div>
                                    )}
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

      {/* Standalone Task Detail Modal */}
      {selectedTask && (
        <CreativeTaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
