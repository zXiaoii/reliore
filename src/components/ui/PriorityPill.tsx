import React from 'react';
import { Priority } from '@/types';
import { getPriorityMeta } from '@/lib/pipeline';
import { Flame, Clock, Box } from 'lucide-react';

interface PriorityPillProps {
  priority: Priority;
  size?: 'sm' | 'md' | 'lg';
  compact?: boolean;
}

export const PriorityPill: React.FC<PriorityPillProps> = ({ priority, size = 'md', compact = false }) => {
  const meta = getPriorityMeta(priority);

  const sizeClasses =
    size === 'sm'
      ? 'px-1.5 py-0.5 text-[10px]'
      : size === 'lg'
      ? 'px-3 py-1 text-xs'
      : 'px-2 py-0.5 text-[11px]';

  return (
    <span
      title={meta.label}
      className={`inline-flex items-center justify-center gap-1 rounded font-mono uppercase tracking-wide shrink-0 ${meta.badgeClass} ${sizeClasses}`}
    >
      {meta.iconType === 'flame' && <Flame className="h-3 w-3 fill-white" />}
      {meta.iconType === 'clock' && <Clock className="h-3 w-3" />}
      {meta.iconType === 'box' && <Box className="h-3 w-3" />}
      <span>{compact ? priority : meta.label}</span>
    </span>
  );
};
