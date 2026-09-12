'use client';

import React, { useState } from 'react';
import { usePipeline } from '@/hooks/usePipeline';
import { useAuth } from '@/context/AuthContext';
import { WorkTask, WorkStatus } from '@/types';
import { formatTaskNumber, sortTasks } from '@/lib/pipeline';
import { PriorityPill } from '@/components/ui/PriorityPill';
import { NewActionModal } from '@/components/actions/NewActionModal';
import { CreativeTaskDetailModal } from '@/components/creative/CreativeTaskDetailModal';
import { WaitingForAccess } from '@/components/auth/WaitingForAccess';
import { Plus, Search, Filter, Zap, CheckCircle2 } from 'lucide-react';

export default function TasksPage() {
  const { tasks } = usePipeline();
  const { isPendingAccess, isMediaBuyer } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedTask, setSelectedTask] = useState<WorkTask | null>(null);
  const [isNewActionOpen, setIsNewActionOpen] = useState(false);

  if (isPendingAccess) {
    return <WaitingForAccess />;
  }

  const filtered = tasks.filter((t) => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.product.toLowerCase().includes(q) ||
        t.campaign.toLowerCase().includes(q) ||
        t.action.toLowerCase().includes(q) ||
        t.owner.toLowerCase().includes(q) ||
        formatTaskNumber(t.taskNumber).toLowerCase().includes(q)
      );
    }
    return true;
  });

  const sorted = sortTasks(filtered);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans">
      <div className="border-b border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                All Operations Tasks
              </h1>
              <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                {tasks.length} total tasks
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Comprehensive list of all active, pending, and live media buying operational tasks.
            </p>
          </div>

          {isMediaBuyer && (
            <button
              onClick={() => setIsNewActionOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 transition-colors self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              <span>+ NEW ACTION</span>
            </button>
          )}
        </div>

        {/* Filter bar */}
        <div className="mt-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-t border-zinc-200 pt-3 dark:border-zinc-800 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Status:</span>
            {['ALL', 'QUEUE', 'MAKING', 'FOR REVIEW', 'READY', 'LIVE', 'CHANGES REQUIRED', 'BLOCKED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  statusFilter === st
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 rounded-md border border-zinc-300 bg-white py-1 pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 p-3 sm:p-6 overflow-x-auto max-w-full">
        <div className="rounded-xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
          <table className="w-full text-left text-xs border-collapse min-w-[950px]">
            <thead className="border-b border-zinc-200 bg-zinc-100/80 dark:border-zinc-800 dark:bg-zinc-800/80 font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Task #</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Product</th>
                <th className="py-2.5 px-3">Campaign</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Owner</th>
                <th className="py-2.5 px-3">Deadline</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Next Action</th>
                <th className="py-2.5 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {sorted.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50">
                  <td className="py-3 px-3 font-mono font-bold text-zinc-900 dark:text-white">
                    {formatTaskNumber(t.taskNumber)}
                  </td>
                  <td className="py-3 px-3">
                    <PriorityPill priority={t.priority} size="sm" />
                  </td>
                  <td className="py-3 px-3 font-bold">{t.product}</td>
                  <td className="py-3 px-3 font-mono font-bold text-teal-800 dark:text-teal-300">
                    {t.campaign}
                  </td>
                  <td className="py-3 px-3 font-semibold">{t.action}</td>
                  <td className="py-3 px-3 font-bold">{t.owner}</td>
                  <td className="py-3 px-3 font-mono">{t.deadline}</td>
                  <td className="py-3 px-3">
                    <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 font-bold text-[10px]">
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-zinc-500 truncate max-w-xs">{t.nextAction}</td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => setSelectedTask(t)}
                      className="rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 px-2 py-1 font-bold text-[11px]"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTask && (
        <CreativeTaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {isNewActionOpen && (
        <NewActionModal
          isOpen={isNewActionOpen}
          onClose={() => setIsNewActionOpen(false)}
        />
      )}
    </div>
  );
}
