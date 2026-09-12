import React from 'react';
import { WorkStatus } from '@/types';

interface StageBadgeProps {
  stage: string | WorkStatus;
  showWaitingOn?: boolean;
}

export const StageBadge: React.FC<StageBadgeProps> = ({ stage }) => {
  const getBadgeClass = (s: string) => {
    switch (s) {
      case 'LIVE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300';
      case 'READY':
      case 'Setup':
        return 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950 dark:text-teal-300';
      case 'Creative':
      case 'MAKING':
        return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300';
      case 'FOR REVIEW':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300';
      case 'CHANGES REQUIRED':
      case 'BLOCKED':
        return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300';
      default:
        return 'bg-zinc-100 text-zinc-800 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${getBadgeClass(
        stage
      )}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      <span>{stage}</span>
    </span>
  );
};
