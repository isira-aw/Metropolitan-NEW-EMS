import { JobStatus } from '@/types';

const statusColors: Record<JobStatus, string> = {
  PENDING: 'bg-cream text-black border border-brand/30',
  TRAVELING: 'bg-brand/15 text-black border border-brand/30',
  STARTED: 'bg-brand/30 text-black border border-brand/40',
  ON_HOLD: 'bg-brand/50 text-black border border-brand/60',
  COMPLETED: 'bg-brand text-cream border border-brand',
  CANCEL: 'bg-red-50 text-red-700 border border-red-200',
};

export default function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColors[status]}`}>
      {status}
    </span>
  );
}
