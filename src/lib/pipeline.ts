import { format, differenceInDays } from 'date-fns';
import { WorkTask, Priority, Market, WorkStatus } from '@/types';

export function formatTaskNumber(num: number): string {
  return `T-${String(num).padStart(3, '0')}`;
}

export function formatReqNumber(num: number): string {
  return `T-${String(num).padStart(3, '0')}`;
}

export function getMarketName(market: Market | string): string {
  const norm = (market || '').toUpperCase().trim();
  switch (norm) {
    case 'UK':
    case 'GB':
      return 'United Kingdom';
    case 'CA':
      return 'Canada';
    case 'US':
    case 'USA':
      return 'United States';
    case 'AUS':
    case 'AU':
      return 'Australia';
    default:
      return market || '';
  }
}

export function getMarketFlag(market: Market): string {
  return getMarketName(market);
}


export function getPriorityMeta(priority: Priority): {
  label: string;
  badgeClass: string;
  dotColor: string;
  iconType: 'flame' | 'clock' | 'box';
} {
  switch (priority) {
    case 'P1':
      return {
        label: 'P1 · URGENT RUSH',
        badgeClass:
          'bg-rose-600 text-white font-extrabold border-rose-700 shadow-xs ring-2 ring-rose-400/60 dark:ring-rose-500/40 animate-pulse',
        dotColor: 'bg-white',
        iconType: 'flame',
      };
    case 'P2':
      return {
        label: 'P2 · NORMAL',
        badgeClass:
          'bg-amber-500 text-white font-bold border-amber-600 shadow-2xs',
        dotColor: 'bg-white',
        iconType: 'clock',
      };
    case 'P3':
    default:
      return {
        label: 'P3 · LOW',
        badgeClass:
          'bg-zinc-200 text-zinc-800 font-semibold border-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:border-zinc-600',
        dotColor: 'bg-zinc-500',
        iconType: 'box',
      };
  }
}

export function getSuggestedAdSetName(
  dateInput: string | Date | null | undefined,
  types: string[] | string
): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  const dateStr = format(d, 'MM/dd/yy');

  let typeLabel = '';
  if (Array.isArray(types)) {
    typeLabel = types.join(' + ');
  } else if (typeof types === 'string') {
    typeLabel = types;
  }

  // If label contains SWIPES or PLAYBOOK
  if (typeLabel.toUpperCase().includes('SWIPES') && typeLabel.toUpperCase().includes('PLAYBOOK')) {
    return `${dateStr} Swipes + Playbook`;
  }
  if (typeLabel.toUpperCase().includes('SWIPES')) {
    return `${dateStr} Swipes`;
  }
  if (typeLabel.toUpperCase().includes('CURIOSITY')) {
    return `${dateStr} Curiosity`;
  }
  if (typeLabel.toUpperCase().includes('ITERATION')) {
    return `${dateStr} Iteration`;
  }
  if (typeLabel.toUpperCase().includes('VARIATION')) {
    return `${dateStr} Variation`;
  }

  return `${dateStr} ${typeLabel || 'Batch'}`;
}

export function deriveStage(status: WorkStatus): 'Creative' | 'Setup' | 'Live' | 'Review' | 'Blocked' {
  switch (status) {
    case 'QUEUE':
    case 'MAKING':
      return 'Creative';
    case 'FOR REVIEW':
    case 'CHANGES REQUIRED':
      return 'Review';
    case 'APPROVED':
    case 'READY':
    case 'IN_SETUP':
    case 'QA':
    case 'ON_HOLD':
      return 'Setup';
    case 'LIVE':
      return 'Live';
    case 'BLOCKED':
      return 'Blocked';
    case 'CANCELLED':
    default:
      return 'Review';
  }
}

export function getNextAction(task: WorkTask): string {
  switch (task.status) {
    case 'QUEUE':
      return `Yzah start creative production (${task.quantity} variants)`;
    case 'MAKING':
      return 'Yzah finish cuts & attach Drive link';
    case 'FOR REVIEW':
      return 'Charles review creative batch & approve/request changes';
    case 'CHANGES REQUIRED':
      return 'Yzah resolve feedback & re-export';
    case 'APPROVED':
    case 'READY':
      return `${task.assignedSetupUser || 'Karl'} set up ad set in ${task.campaign}`;
    case 'IN_SETUP':
      return `${task.assignedSetupUser || 'Karl'} verify pixel & upload ads`;
    case 'QA':
      return `${task.assignedSetupUser || 'Karl'} QA tracking & launch ad set`;
    case 'LIVE':
      return 'Media buyer monitor ROAS & trigger next iteration';
    case 'BLOCKED':
      return 'Resolve blocker before proceeding';
    case 'ON_HOLD':
      return 'Waiting on campaign budget/approval';
    case 'CANCELLED':
      return 'Archived';
    default:
      return 'Check task details';
  }
}

export function getDaysLive(launchDate: string | null | undefined): number {
  if (!launchDate) return 0;
  const launch = new Date(launchDate);
  const now = new Date();
  const diff = differenceInDays(now, launch);
  return Math.max(0, diff);
}

export function sortTasks(tasks: WorkTask[]): WorkTask[] {
  const priorityOrder: Record<Priority, number> = {
    P1: 1,
    P2: 2,
    P3: 3,
  };

  return [...tasks].sort((a, b) => {
    const pA = priorityOrder[a.priority] || 99;
    const pB = priorityOrder[b.priority] || 99;
    if (pA !== pB) return pA - pB;

    // Status weighting: FOR REVIEW and READY come first
    const urgency = (s: WorkStatus) => {
      if (s === 'CHANGES REQUIRED') return 1;
      if (s === 'FOR REVIEW') return 2;
      if (s === 'READY') return 3;
      if (s === 'MAKING') return 4;
      if (s === 'QUEUE') return 5;
      if (s === 'IN_SETUP') return 6;
      return 10;
    };

    const uA = urgency(a.status);
    const uB = urgency(b.status);
    if (uA !== uB) return uA - uB;

    return a.taskNumber - b.taskNumber;
  });
}
