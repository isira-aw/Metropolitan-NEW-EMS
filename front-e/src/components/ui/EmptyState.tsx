import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  message: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-slate-300 mb-4">{icon}</div>
      <p className="text-slate-400 text-sm font-bold mb-2">{message}</p>
      {action}
    </div>
  );
}
