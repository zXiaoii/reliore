'use client';

import React, { useState } from 'react';
import { usePipeline } from '@/hooks/usePipeline';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { WorkTask } from '@/types';
import { formatTaskNumber } from '@/lib/pipeline';
import { PriorityPill } from '@/components/ui/PriorityPill';
import { CreativeTaskDetailModal } from '@/components/creative/CreativeTaskDetailModal';
import { WaitingForAccess } from '@/components/auth/WaitingForAccess';
import { AlertTriangle, AlertOctagon, CheckCircle2, MessageSquare } from 'lucide-react';

export default function BlockersPage() {
  const { tasks, store } = usePipeline();
  const { isPendingAccess, currentUser } = useAuth();
  const { toast } = useToast();

  const [selectedTask, setSelectedTask] = useState<WorkTask | null>(null);

  if (isPendingAccess) {
    return <WaitingForAccess />;
  }

  // Filter tasks that are BLOCKED or CHANGES REQUIRED (§9: Blockers)
  const blockers = tasks.filter(
    (t) => t.status === 'BLOCKED' || t.status === 'CHANGES REQUIRED'
  );

  const handleUnblock = (task: WorkTask) => {
    store.updateTask(
      task.id,
      { status: 'MAKING', nextAction: 'Yzah finish cuts & attach Drive link' },
      { uid: currentUser?.uid || 'charles-01', displayName: currentUser?.displayName || 'Charles' }
    );
    toast.success(`Task ${formatTaskNumber(task.taskNumber)} unblocked and moved to MAKING.`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-[#ededed] font-sans">
      <div className="border-b border-[#1f1f1f] bg-black px-4 py-5 sm:px-8">
        <div className="max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <AlertOctagon className="h-5 w-5 text-rose-500" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Operations Blockers &amp; Changes Required
            </h1>
            <span className="rounded-md bg-[#121212] border border-[#262626] px-2 py-0.5 text-xs font-mono font-semibold text-rose-400">
              {blockers.length} Blocked
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Eliminate communication bottlenecks. Every blocked task or change request is resolved here so nothing gets lost in private messages.
          </p>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-4">
        {blockers.length === 0 ? (
          <div className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-12 text-center shadow-xs">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
            <h3 className="mt-2 text-sm font-bold text-white">Zero Blockers!</h3>
            <p className="mt-1 text-xs text-zinc-400">
              All tasks are moving smoothly through the pipeline without friction.
            </p>
          </div>
        ) : (
          blockers.map((task) => (
            <div
              key={task.id}
              className="vercel-card p-5 border-rose-900/50 bg-[#0a0a0a] text-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1f1f1f] pb-3">
                <div className="flex items-center gap-2.5">
                  <PriorityPill priority={task.priority} size="sm" />
                  <span className="font-mono font-bold text-white">
                    {formatTaskNumber(task.taskNumber)}
                  </span>
                  <span className="font-semibold text-white">
                    {task.product} — {task.campaign}
                  </span>
                  <span className="rounded bg-rose-500/10 border border-rose-500/25 px-2 py-0.5 text-[10px] font-mono font-bold text-rose-400">
                    {task.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-500 font-mono">Owner: <strong className="text-zinc-300">{task.owner}</strong></span>
                  <button
                    onClick={() => setSelectedTask(task)}
                    className="vercel-btn-secondary cursor-pointer"
                  >
                    View Brief
                  </button>
                  <button
                    onClick={() => handleUnblock(task)}
                    className="vercel-btn-primary cursor-pointer"
                  >
                    Unblock Task
                  </button>
                </div>
              </div>

              {task.feedback && (
                <div className="rounded-lg bg-black border border-[#262626] p-3 text-zinc-300">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block mb-0.5 font-mono">
                        Feedback / Blocker Reason:
                      </span>
                      <p className="font-medium text-zinc-200">{task.feedback}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-[11px] text-zinc-500 font-mono flex items-center justify-between pt-1">
                <span>Action: <strong className="text-zinc-300">{task.action}</strong> • Account: {task.adAccount}</span>
                <span>Deadline: {task.deadline}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedTask && (
        <CreativeTaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
