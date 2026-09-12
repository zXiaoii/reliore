'use client';

import React, { useState } from 'react';
import { WorkTask, WorkStatus } from '@/types';
import { usePipeline } from '@/hooks/usePipeline';
import { useToast } from '@/context/ToastContext';
import { formatTaskNumber, getMarketFlag } from '@/lib/pipeline';
import { MarketBadge } from '@/components/common/MarketBadge';
import { PriorityPill } from '@/components/ui/PriorityPill';
import {
  X,
  Palette,
  Send,
  FolderOpen,
  CheckCircle2,
  ExternalLink,
  Target,
  Sparkles,
  HelpCircle,
  Trash2,
} from 'lucide-react';

interface CreativeTaskDetailModalProps {
  task: WorkTask | null;
  onClose: () => void;
}

export const CreativeTaskDetailModal: React.FC<CreativeTaskDetailModalProps> = ({
  task,
  onClose,
}) => {
  const { store } = usePipeline();
  const { toast } = useToast();

  const [folderUrl, setFolderUrl] = useState(task?.folderUrl || '');
  const [quantityDone, setQuantityDone] = useState(task?.quantityDone || 0);
  const [creativeNotes, setCreativeNotes] = useState(task?.creativeNotes || '');
  const [status, setStatus] = useState<WorkStatus>(task?.status || 'MAKING');

  if (!task) return null;

  const handleSave = () => {
    store.updateTask(
      task.id,
      {
        folderUrl: folderUrl.trim(),
        quantityDone: Number(quantityDone),
        creativeNotes: creativeNotes.trim(),
        status,
      },
      { uid: 'yzah-03', displayName: 'Yzah' }
    );
    toast.success(`Task ${formatTaskNumber(task.taskNumber)} updated.`);
    onClose();
  };

  const handleDeliver = () => {
    if (!folderUrl.trim()) {
      toast.error('Please enter Google Drive folder URL before delivering.');
      return;
    }

    store.updateTask(
      task.id,
      {
        folderUrl: folderUrl.trim(),
        quantityDone: task.quantity,
        creativeNotes: creativeNotes.trim(),
        status: 'FOR REVIEW',
        nextAction: 'Charles review creative batch & approve/request changes',
      },
      { uid: 'yzah-03', displayName: 'Yzah' }
    );
    toast.success(
      `Batch ${formatTaskNumber(task.taskNumber)} delivered to Charles for approval!`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 sm:p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2.5">
              <PriorityPill priority={task.priority} size="sm" />
              <span className="font-mono text-sm font-extrabold text-zinc-900 dark:text-white">
                {formatTaskNumber(task.taskNumber)}
              </span>
              <MarketBadge market={task.market} size="xs" />
              <span className="rounded bg-purple-100 dark:bg-purple-950 px-2 py-0.5 text-xs font-bold text-purple-700 dark:text-purple-300 font-mono">
                {task.creativeTypes.join(' + ')}
              </span>
            </div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white mt-1">
              {task.product} — {task.campaign}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* The 9 Key Creative Questions (§18) */}
        <div className="mt-4 space-y-3 text-xs">
          <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3.5 dark:border-purple-900/60 dark:bg-purple-950/20 space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300 block">
              ✨ Yzah&apos;s Creative Instructions
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-zinc-400 text-[10px] uppercase font-bold block">1. What do I make?</span>
                <span className="font-bold text-zinc-900 dark:text-white">
                  {task.quantity} variants of {task.creativeTypes.join(' + ')}
                </span>
              </div>

              <div>
                <span className="text-zinc-400 text-[10px] uppercase font-bold block">2. Why am I making it?</span>
                <span className="font-semibold text-purple-700 dark:text-purple-300">
                  {task.reasonTrigger || 'Requested by Media Buyer'}
                </span>
              </div>

              <div>
                <span className="text-zinc-400 text-[10px] uppercase font-bold block">3. Product & Market</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {task.product} ({getMarketFlag(task.market)})
                </span>
              </div>

              <div>
                <span className="text-zinc-400 text-[10px] uppercase font-bold block">4. Who gets it after me?</span>
                <span className="font-bold text-teal-700 dark:text-teal-300">
                  {task.assignedSetupUser || 'Karl'} (Setup Executor)
                </span>
              </div>

              <div>
                <span className="text-zinc-400 text-[10px] uppercase font-bold block">5. When is it due?</span>
                <span className="font-bold font-mono text-zinc-900 dark:text-white">
                  {task.deadline}
                </span>
              </div>

              <div>
                <span className="text-zinc-400 text-[10px] uppercase font-bold block">6. Target Campaign & Account</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200 truncate block">
                  {task.campaign} ({task.adAccount})
                </span>
              </div>
            </div>
          </div>

          {/* Reference & Hooks */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/40 space-y-2.5">
            <div>
              <span className="text-zinc-400 text-[10px] uppercase font-bold block">Winning Reference</span>
              <p className="font-mono font-medium text-blue-600 dark:text-blue-400 mt-0.5">
                {task.winningReference || task.referenceUrl || 'None attached'}
              </p>
            </div>

            <div>
              <span className="text-zinc-400 text-[10px] uppercase font-bold block">Winning Hook</span>
              <p className="font-bold text-zinc-900 dark:text-white mt-0.5">
                {task.winningHook || 'Create fresh hooks based on concept'}
              </p>
            </div>

            {task.winningAngle && (
              <div>
                <span className="text-zinc-400 text-[10px] uppercase font-bold block">Winning Angle</span>
                <p className="text-zinc-700 dark:text-zinc-300 mt-0.5">{task.winningAngle}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-zinc-200 dark:border-zinc-700">
              <div>
                <span className="text-emerald-600 dark:text-emerald-400 text-[10px] uppercase font-bold block">
                  What To Keep
                </span>
                <p className="text-zinc-700 dark:text-zinc-300 mt-0.5">{task.whatToKeep || 'Hook structure & offer'}</p>
              </div>

              <div>
                <span className="text-rose-600 dark:text-rose-400 text-[10px] uppercase font-bold block">
                  What To Change
                </span>
                <p className="text-zinc-700 dark:text-zinc-300 mt-0.5">{task.whatToChange || 'Visual execution'}</p>
              </div>
            </div>
          </div>

          {/* Deliverables Workspace */}
          <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Google Drive Batch Link
                </label>
                {folderUrl && (
                  <a
                    href={folderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 font-mono"
                  >
                    <ExternalLink className="h-2.5 w-2.5" />
                    <span>Open Drive</span>
                  </a>
                )}
              </div>
              <input
                type="url"
                value={folderUrl}
                onChange={(e) => setFolderUrl(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="w-full rounded border border-zinc-300 bg-white p-1.5 text-xs font-mono text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Variants Completed ({quantityDone}/{task.quantity})
                </label>
                <input
                  type="number"
                  min={0}
                  max={task.quantity}
                  value={quantityDone}
                  onChange={(e) => setQuantityDone(Number(e.target.value))}
                  className="w-full rounded border border-zinc-300 bg-white p-1.5 text-xs font-mono text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Creative Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as WorkStatus)}
                  style={{ colorScheme: 'dark' }}
                  className="w-full rounded border border-zinc-300 bg-white p-1.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-bold [color-scheme:dark]"
                >
                  <option value="QUEUE" className="bg-zinc-900 text-zinc-100 py-1">QUEUE</option>
                  <option value="MAKING" className="bg-zinc-900 text-zinc-100 py-1">MAKING</option>
                  <option value="FOR REVIEW" className="bg-zinc-900 text-zinc-100 py-1">FOR REVIEW</option>
                  <option value="CHANGES REQUIRED" className="bg-zinc-900 text-zinc-100 py-1">CHANGES REQUIRED</option>
                  <option value="BLOCKED" className="bg-zinc-900 text-zinc-100 py-1">BLOCKED</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Yzah&apos;s Notes
              </label>
              <input
                type="text"
                value={creativeNotes}
                onChange={(e) => setCreativeNotes(e.target.value)}
                placeholder="e.g. Exported hooks 1-8 in 9:16 safe-zone framing"
                className="w-full rounded border border-zinc-300 bg-white p-1.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
          </div>

          {/* Post-submission helper note */}
          {(task.status === 'FOR REVIEW' || task.status === 'APPROVED' || task.status === 'LIVE') && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-2.5 text-xs text-amber-900 dark:text-amber-200">
              💡 <strong>Under Review by Charles:</strong> You can update your Google Drive link or notes below anytime. Click <strong>Save &amp; Update Files for Charles</strong> to sync your latest files.
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                Close
              </button>
              
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this task?')) {
                    store.deleteTask(task.id);
                    onClose();
                    toast.success('Task deleted successfully');
                  }
                }}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            </div>

            {(task.status === 'FOR REVIEW' || task.status === 'APPROVED' || task.status === 'LIVE') ? (
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Save &amp; Update Files for Charles</span>
              </button>
            ) : task.status === 'CHANGES REQUIRED' ? (
              <button
                type="button"
                onClick={handleDeliver}
                className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-rose-700"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Re-Deliver to Charles</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDeliver}
                className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-purple-700"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Deliver to Charles for Review</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
