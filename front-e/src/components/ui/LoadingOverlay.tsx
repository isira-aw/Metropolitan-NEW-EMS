'use client';

import { ReactNode, useEffect, useState } from 'react';

// Module-level pending-request counter so non-React code (the axios
// interceptors in lib/api.ts) can drive the overlay without React context.
let pendingCount = 0;
let externalSetLoading: ((loading: boolean) => void) | null = null;

function notify() {
  externalSetLoading?.(pendingCount > 0);
}

export function beginGlobalLoading() {
  pendingCount += 1;
  notify();
}

export function endGlobalLoading() {
  pendingCount = Math.max(0, pendingCount - 1);
  notify();
}

export function LoadingOverlayProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    externalSetLoading = setLoading;
    return () => {
      externalSetLoading = null;
    };
  }, []);

  return (
    <>
      {children}
      {loading && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
          role="status"
          aria-live="assertive"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="h-14 w-14 border-4 border-white/20 border-t-corporate-blue rounded-full animate-spin" />
            <span className="text-xs font-black text-white uppercase tracking-widest">Processing...</span>
          </div>
        </div>
      )}
    </>
  );
}
