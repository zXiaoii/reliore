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
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans">
      <div className="border-b border-zinc-200 bg-white px-3 py-4 dark:border-zinc-800 dark:bg-zinc-900 sm:px-6">
        <div className="flex items-center gap-2">
          <AlertOctagon className="h-5 w-5 text-rose-600" />
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Operations Blockers &amp; Changes Required
          </h1>
          <span className="rounded-full bg-rose-100 dark:bg-rose-950 px-2 py-0.5 text-xs font-bold text-rose-700 dark:text-rose-300 font-mono">
            {blockers.length} Blocked
          </span>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Eliminate communication bottlenecks. Every blocked task or change request is resolved here so nothing gets lost in private messages.
        </p>
      </div>

      <div className="flex-1 p-3 sm:p-6 max-w-5xl w-full space-y-4">
        {blockers.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
            <h3 className="mt-2 text-sm font-bold text-zinc-900 dark:text-white">Zero Blockers!</h3>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              All tasks are moving smoothly through the pipeline without friction.
            </p>
          </div>
        ) : (
          blockers.map((task) => (
            <div
              key={task.id}
              className="rounded-xl border border-rose-300 bg-rose-50/40 p-4 shadow-2xs dark:border-rose-900 dark:bg-rose-950/20 text-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-200 dark:border-rose-900 pb-2.5 mb-3">
                <div className="flex items-center gap-2.5">
                  <PriorityPill priority={task.priority} size="sm" />
                  <span className="font-mono font-bold text-zinc-900 dark:text-white">
                    {formatTaskNumber(task.taskNumber)}
                  </span>
                  <span className="font-bold text-zinc-900 dark:text-white">
                    {task.product} — {task.campaign}
                  </span>
                  <span className="rounded bg-rose-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                    {task.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-500 font-mono">Owner: <strong>{task.owner}</strong></span>
                  <button
                    onClick={() => setSelectedTask(task)}
                    className="rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 font-bold text-zinc-800 dark:text-zinc-200"
                  >
                    View Brief
                  </button>
                  <button
                    onClick={() => handleUnblock(task)}
                    className="rounded bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 font-bold shadow-2xs"
                  >
                    Unblock Task
                  </button>
                </div>
              </div>

              {task.feedback && (
                <div className="rounded-lg bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-800 p-3 text-rose-900 dark:text-rose-200">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-400 block mb-0.5">
                        Feedback / Blocker Reason:
                      </span>
                      <p className="font-medium">{task.feedback}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-2.5 text-[11px] text-zinc-500 flex items-center justify-between">
                <span>Action: <strong>{task.action}</strong> • Account: {task.adAccount}</span>
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
