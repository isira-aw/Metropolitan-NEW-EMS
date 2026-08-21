'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { employeeDashboardService, attendanceService } from '@/lib/services/employee.service';
import { EmployeeDashboardResponse } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Play, Square, CheckCircle, Clock, ChevronRight, Zap, Briefcase } from 'lucide-react';
import EmployeeLayout from '@/components/layouts/EmployeeLayout';

export default function EmployeeDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<EmployeeDashboardResponse | null>(null);
  const [confirmAction, setConfirmAction] = useState<'start' | 'end' | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await employeeDashboardService.getSummary();
      setDashboard(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartDay = async () => {
    try {
      await attendanceService.startDay();
      loadDashboard();
    } catch (error) {
      console.error('Error starting day:', error);
    }
  };

  const handleEndDay = async () => {
    try {
      await attendanceService.endDay();
      loadDashboard();
    } catch (error) {
      console.error('Error ending day:', error);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><LoadingSpinner /></div>;

  return (
    <EmployeeLayout pendingJobsCount={dashboard?.pendingJobCardsCount || 0}>
      <div className="max-w-[400px] md:max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* Header Section */}
        <div>
          <h2 className="text-2xl font-black text-black tracking-tight">MY DASHBOARD</h2>
          <p className="text-xs font-bold text-black/50 uppercase tracking-widest">Today's status & pending jobs</p>
        </div>

        {/* 1. Attendance Action Card (The Most Important Item) */}
        <div className={`relative overflow-hidden rounded-[2rem] p-6 transition-all border-2 ${
          dashboard?.dayStarted && !dashboard?.dayEnded
          ? 'bg-brand border-brand text-cream shadow-lg'
          : 'bg-cream border-brand/30 text-black'
        }`}>
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <Zap size={18} />
              <h3 className="text-xs font-black uppercase tracking-[0.15em] opacity-80">Shift Status</h3>
            </div>
            <p className="text-2xl font-black">
              {dashboard?.currentStatus === 'ACTIVE' ? 'Currently On Duty' : 'Not Started'}
            </p>

            <div>
              {!dashboard?.dayStarted ? (
                <button
                  onClick={() => setConfirmAction('start')}
                  className="w-full bg-brand text-cream border-2 border-brand px-8 py-4 rounded-2xl font-black uppercase text-sm tracking-widest transition-all active:scale-95 hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center gap-2 min-h-[52px]"
                >
                  <Play size={18} fill="currentColor" /> Start Work Day
                </button>
              ) : !dashboard?.dayEnded ? (
                <button
                  onClick={() => setConfirmAction('end')}
                  className="w-full bg-cream text-black border-2 border-cream px-8 py-4 rounded-2xl font-black uppercase text-sm tracking-widest transition-all active:scale-95 hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center gap-2 min-h-[52px]"
                >
                  <Square size={18} fill="currentColor" /> End Work Day
                </button>
              ) : (
                <div className="bg-cream/20 border-2 border-cream/40 px-6 py-4 rounded-2xl flex items-center justify-center gap-2">
                  <CheckCircle size={20} />
                  <span className="text-sm font-black uppercase tracking-widest">Shift Completed</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Primary Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Pending', value: dashboard?.pendingJobCardsCount, icon: Clock },
            { label: 'In Progress', value: dashboard?.inProgressJobCardsCount, icon: Play },
            { label: 'Completed', value: dashboard?.completedJobCardsCount, icon: CheckCircle },
            { label: 'Total Jobs', value: dashboard?.totalJobCardsCount, icon: Briefcase },
          ].map((stat, i) => (
            <div key={i} className="bg-cream border-2 border-brand/20 p-5 rounded-[1.5rem]">
              <div className="flex items-center justify-between mb-3">
                <stat.icon size={16} className="text-brand" />
                <span className="text-[10px] font-black text-black/50 uppercase tracking-tighter">{stat.label}</span>
              </div>
              <p className="text-3xl font-black tracking-tight text-black">{stat.value || 0}</p>
            </div>
          ))}
        </div>

        {/* 3. Recent Jobs List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-black uppercase tracking-widest">Pending Job Cards</h3>
            <button onClick={() => router.push('/employee/job-cards')} className="text-[11px] font-black text-brand uppercase hover:underline">View All</button>
          </div>

          <div className="space-y-3">
            {dashboard?.recentJobCards?.map((card) => (
              <button
                type="button"
                key={card.id}
                onClick={() => router.push(`/employee/job-cards/${card.id}`)}
                className="group bg-cream border-2 border-brand/20 p-4 rounded-2xl hover:border-brand transition-all flex items-center justify-between text-left w-full min-h-[64px]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-brand/10 flex items-center justify-center text-brand">
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-black line-clamp-1">{card.mainTicket.title}</h4>
                    <p className="text-[10px] font-bold text-black/50 uppercase">Ticket #{card.mainTicket.ticketNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={card.status} />
                  <ChevronRight size={18} className="text-brand/50" />
                </div>
              </button>
            ))}
          </div>

          {!dashboard?.recentJobCards?.length && (
             <div className="text-center py-10 bg-cream rounded-[1.5rem] border-2 border-dashed border-brand/30">
                <p className="text-xs font-black text-black/40 uppercase tracking-widest">No Pending Job Cards</p>
             </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmAction !== null}
        title={confirmAction === 'start' ? 'Start Work Day' : 'End Work Day'}
        message={
          confirmAction === 'start'
            ? 'Are you sure you want to start your work day?'
            : 'Are you sure you want to end your work day?'
        }
        confirmLabel="OK"
        cancelLabel="Cancel"
        danger={false}
        onConfirm={() => {
          const action = confirmAction;
          setConfirmAction(null);
          if (action === 'start') handleStartDay();
          else if (action === 'end') handleEndDay();
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </EmployeeLayout>
  );
}
