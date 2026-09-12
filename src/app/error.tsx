'use client';

import React, { useEffect } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App runtime error caught by boundary:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center bg-zinc-950 font-sans">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 max-w-md shadow-2xl">
        <div className="w-10 h-10 rounded-full bg-rose-950/60 text-rose-400 border border-rose-800/60 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <h2 className="text-base font-bold text-white">Something interrupted the page</h2>
        <p className="mt-2 text-xs text-zinc-400 font-mono break-words bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80">
          {error?.message || 'An unexpected rendering error occurred.'}
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-zinc-900 text-xs font-bold shadow-sm hover:bg-zinc-100 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
          <a
            href="/"
            className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-200 text-xs font-semibold hover:bg-zinc-750 transition-colors border border-zinc-700"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
