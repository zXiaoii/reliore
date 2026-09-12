'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const { tasks } = usePipeline();
  const { currentUser, isPendingAccess, isMediaBuyer } = useAuth();

  // Setup users only access the Setup Queue
  useEffect(() => {
    if (currentUser?.role === 'setup') {
      router.replace('/setup');
    }
  }, [currentUser, router]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedTask, setSelectedTask] = useState<WorkTask | null>(null);
  const [isNewActionOpen, setIsNewActionOpen] = useState(false);

  if (currentUser?.role === 'setup') {
    return null;
  }

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
    <div className="flex flex-col min-h-screen bg-black text-[#ededed] font-sans">
      <div className="border-b border-[#1f1f1f] bg-black px-4 py-5 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 max-w-7xl mx-auto w-full">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                All Operations Tasks
              </h1>
              <span className="rounded-md bg-[#121212] border border-[#262626] px-2 py-0.5 text-xs font-mono font-semibold text-zinc-300">
                {tasks.length} total tasks
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Comprehensive list of all active, pending, and live media buying operational tasks.
            </p>
          </div>

          {isMediaBuyer && (
            <button
              onClick={() => setIsNewActionOpen(true)}
              className="vercel-btn-primary flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="h-3.5 w-3.5 text-black" />
              <span>+ New Action</span>
            </button>
          )}
        </div>

        {/* Filter bar */}
        <div className="mt-4 pt-3 border-t border-[#1a1a1a] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs max-w-7xl mx-auto w-full">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Status:</span>
            {['ALL', 'QUEUE', 'MAKING', 'FOR REVIEW', 'READY', 'LIVE', 'CHANGES REQUIRED', 'BLOCKED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer border ${
                  statusFilter === st
                    ? 'bg-[#181818] text-white border-[#383838] font-bold shadow-xs'
                    : 'bg-black text-zinc-400 border-[#222222] hover:text-white hover:border-[#333]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-[#262626] bg-black py-1.5 pl-8 pr-8 text-xs text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-hidden transition-colors"
            />
            <span className="absolute right-2 top-2 vercel-kbd">/</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 p-4 sm:p-8 overflow-x-auto max-w-7xl mx-auto w-full">
        <div className="rounded-xl border border-[#222222] bg-[#0a0a0a] shadow-xs overflow-hidden custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse min-w-[950px]">
            <thead className="border-b border-[#222222] bg-black font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3 border-r border-[#1f1f1f]">Task #</th>
                <th className="py-2.5 px-3 border-r border-[#1f1f1f]">Priority</th>
                <th className="py-2.5 px-3 border-r border-[#1f1f1f]">Product</th>
                <th className="py-2.5 px-3 border-r border-[#1f1f1f]">Campaign</th>
                <th className="py-2.5 px-3 border-r border-[#1f1f1f]">Action</th>
                <th className="py-2.5 px-3 border-r border-[#1f1f1f]">Owner</th>
                <th className="py-2.5 px-3 border-r border-[#1f1f1f]">Deadline</th>
                <th className="py-2.5 px-3 border-r border-[#1f1f1f]">Status</th>
                <th className="py-2.5 px-3 border-r border-[#1f1f1f]">Next Action</th>
                <th className="py-2.5 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {sorted.map((t) => (
                <tr key={t.id} className="hover:bg-[#141414] bg-[#0a0a0a] transition-colors">
                  <td className="py-3 px-3 border-r border-[#1a1a1a] font-mono font-bold text-white whitespace-nowrap">
                    {formatTaskNumber(t.taskNumber)}
                  </td>
                  <td className="py-3 px-3 border-r border-[#1a1a1a] whitespace-nowrap">
                    <PriorityPill priority={t.priority} size="sm" />
                  </td>
                  <td className="py-3 px-3 border-r border-[#1a1a1a] font-semibold text-white whitespace-nowrap">{t.product}</td>
                  <td className="py-3 px-3 border-r border-[#1a1a1a] font-mono font-bold text-white whitespace-nowrap">
                    {t.campaign}
                  </td>
                  <td className="py-3 px-3 border-r border-[#1a1a1a] whitespace-nowrap">
                    <span className="rounded bg-[#141414] border border-[#262626] px-1.5 py-0.5 font-semibold text-zinc-300 text-[11px]">
                      {t.action}
                    </span>
                  </td>
                  <td className="py-3 px-3 border-r border-[#1a1a1a] font-semibold text-zinc-200 whitespace-nowrap">{t.owner}</td>
                  <td className="py-3 px-3 border-r border-[#1a1a1a] font-mono text-zinc-400 whitespace-nowrap">{t.deadline}</td>
                  <td className="py-3 px-3 border-r border-[#1a1a1a] whitespace-nowrap">
                    <span className="rounded bg-[#141414] border border-[#262626] px-2 py-0.5 font-mono font-semibold text-zinc-300 text-[10px]">
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 border-r border-[#1a1a1a] text-zinc-400 truncate max-w-xs">{t.nextAction}</td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => setSelectedTask(t)}
                      className="vercel-btn-secondary py-1 px-2.5 text-[11px] cursor-pointer"
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
