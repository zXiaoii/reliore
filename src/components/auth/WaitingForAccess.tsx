'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, RefreshCw } from 'lucide-react';

export const WaitingForAccess: React.FC = () => {
  const { currentUser, switchUserByUid, availableUsers } = useAuth();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
        Waiting for Access
      </h2>
      <p className="mt-2 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
        Signed in as <span className="font-semibold text-zinc-900 dark:text-zinc-200">{currentUser?.email}</span>.
        Your account is currently inactive or awaiting role assignment from an administrator (Danny).
      </p>

      <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-left text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 max-w-md w-full">
        <p className="font-semibold text-zinc-900 dark:text-zinc-200 mb-2">
          Testing Role Switcher
        </p>
        <p className="mb-3 text-[11px]">
          As this is an internal demo, you can test how the pipeline works by switching to an active team member using the menu below:
        </p>
        <div className="flex flex-wrap gap-2">
          {availableUsers
            .filter((u) => u.active && u.role)
            .map((u) => (
              <button
                key={u.uid}
                onClick={() => switchUserByUid(u.uid)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 shadow-2xs"
              >
                <RefreshCw className="h-3 w-3" />
                Switch to {u.displayName}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};
