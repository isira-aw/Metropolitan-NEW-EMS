import { JobStatus } from '@/types';

const statusColors: Record<JobStatus, string> = {
  PENDING: 'bg-slate-100 text-slate-600 border border-slate-200',
  TRAVELING: 'bg-corporate-blue/10 text-corporate-blue border border-corporate-blue/20',
  STARTED: 'bg-amber-50 text-amber-700 border border-amber-200',
  ON_HOLD: 'bg-orange-50 text-orange-700 border border-orange-200',
  COMPLETED: 'bg-green-50 text-green-700 border border-green-200',
  CANCEL: 'bg-red-50 text-red-700 border border-red-200',
};

export default function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColors[status]}`}>
      {status}
    </span>
  );
}
