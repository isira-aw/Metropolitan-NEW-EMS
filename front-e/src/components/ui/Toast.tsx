'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Module-level bridge so non-React code (the axios interceptor in lib/api.ts)
// can trigger a toast without needing access to React context.
let externalShowToast: ((message: string, variant?: ToastVariant) => void) | null = null;

export function showGlobalToast(message: string, variant: ToastVariant = 'error') {
  if (externalShowToast) {
    externalShowToast(message, variant);
  } else {
    // ToastProvider not mounted yet (e.g. during SSR) - fall back so the
    // message is never silently lost.
    // eslint-disable-next-line no-alert
    alert(message);
  }
}

const variantStyles: Record<ToastVariant, { bg: string; icon: ReactNode }> = {
  success: { bg: 'bg-emerald-600', icon: <CheckCircle2 size={18} /> },
  error: { bg: 'bg-red-600', icon: <AlertCircle size={18} /> },
  info: { bg: 'bg-slate-800', icon: <Info size={18} /> },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => dismiss(id), 5000);
  }, [dismiss]);

  useEffect(() => {
    externalShowToast = showToast;
    return () => {
      externalShowToast = null;
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 max-w-sm w-full"
        role="region"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${variantStyles[toast.variant].bg} text-white rounded-2xl shadow-2xl px-5 py-4 flex items-start gap-3`}
          >
            <span className="mt-0.5">{variantStyles[toast.variant].icon}</span>
            <p className="text-sm font-bold flex-1">{toast.message}</p>
            <button
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="opacity-70 hover:opacity-100 transition-opacity"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
