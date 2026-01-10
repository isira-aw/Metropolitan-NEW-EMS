'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { employeeDashboardService, attendanceService } from '@/lib/services/employee.service';
import { EmployeeDashboardResponse } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatMinutes } from '@/lib/utils/format';
import { Play, Square, CheckCircle, Clock, ChevronRight, Zap, TrendingUp, Briefcase } from 'lucide-react';
import EmployeeLayout from '@/components/layouts/EmployeeLayout';

export default function EmployeeDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<EmployeeDashboardResponse | null>(null);

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
      <div className="max-w-[400px] md:max-w-7xl mx-auto px-4 py-6 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">MY DASHBOARD</h2>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Real-time Performance & Operations</p>
          </div>
          <div className="hidden md:block">
             <div className="bg-white border-2 border-slate-100 rounded-2xl px-4 py-2 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
                <span className="text-[10px] font-black text-slate-500 uppercase">System Online</span>
             </div>
          </div>
        </div>

        {/* 1. Attendance Action Card (The Most Important Item) */}
        <div className={`relative overflow-hidden rounded-[2.5rem] p-6 md:p-8 transition-all border-2 ${
          dashboard?.dayStarted && !dashboard?.dayEnded 
          ? 'bg-slate-900 border-slate-900 text-white shadow-2xl shadow-blue-900/20' 
          : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap size={18} className={dashboard?.dayStarted && !dashboard?.dayEnded ? 'text-corporate-blue' : 'text-slate-300'} />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-70">Shift Status</h3>
              </div>
              <p className={`text-2xl md:text-3xl font-black ${dashboard?.dayStarted && !dashboard?.dayEnded ? 'text-white' : 'text-slate-900'}`}>
                {dashboard?.currentStatus === 'PRESENT' ? 'Currently On Duty' : dashboard?.currentStatus || 'Not Started'}
              </p>
            </div>

            <div className="flex gap-3">
              {!dashboard?.dayStarted ? (
                <button onClick={handleStartDay} className="flex-1 md:flex-none bg-corporate-blue hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30">
                  <Play size={18} fill="currentColor" /> Start Work Day
                </button>
              ) : !dashboard?.dayEnded ? (
                <button onClick={handleEndDay} className="flex-1 md:flex-none bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2">
                  <Square size={18} fill="currentColor" /> End Work Day
                </button>
              ) : (
                <div className="bg-green-500/10 border border-green-500/20 text-green-500 px-6 py-4 rounded-2xl flex items-center gap-2">
                  <CheckCircle size={20} />
                  <span className="text-xs font-black uppercase tracking-widest">Shift Completed</span>
                </div>
              )}
            </div>
          </div>
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-corporate-blue/5 rounded-full blur-3xl"></div>
        </div>

        {/* 2. Primary Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[
            { label: 'Pending', value: dashboard?.pendingJobCardsCount, color: 'text-orange-500', icon: Clock },
            { label: 'In Progress', value: dashboard?.inProgressJobCardsCount, color: 'text-blue-500', icon: Play },
            { label: 'Completed', value: dashboard?.completedJobCardsCount, color: 'text-green-500', icon: CheckCircle },
            { label: 'Total Jobs', value: dashboard?.totalJobCardsCount, color: 'text-slate-900', icon: Briefcase },
          ].map((stat, i) => (
            <div key={i} className="bg-white border-2 border-slate-100 p-5 rounded-[2rem] hover:border-corporate-blue transition-colors group">
              <div className="flex items-center justify-between mb-3">
                <stat.icon size={16} className="text-slate-300 group-hover:text-corporate-blue transition-colors" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{stat.label}</span>
              </div>
              <p className={`text-3xl font-black tracking-tight ${stat.color}`}>{stat.value || 0}</p>
            </div>
          ))}
        </div>

        {/* 3. Performance & Time (Secondary Data) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-2 border-slate-100 p-6 rounded-[2rem] space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Total Work Time</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-black text-slate-900 leading-none">{formatMinutes(dashboard?.totalWorkMinutes || 0)}</p>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
               <div className="h-full bg-corporate-blue w-[75%]"></div>
            </div>
          </div>

          <div className="bg-white border-2 border-slate-100 p-6 rounded-[2rem] space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Overtime Earned</p>
            <p className="text-3xl font-black text-corporate-blue leading-none">{formatMinutes(dashboard?.totalOTMinutes || 0)}</p>
            <div className="flex gap-4 text-[10px] font-bold text-slate-500 uppercase">
              <span>AM: {formatMinutes(dashboard?.morningOTMinutes || 0)}</span>
              <span className="text-slate-200">|</span>
              <span>PM: {formatMinutes(dashboard?.eveningOTMinutes || 0)}</span>
            </div>
          </div>

          <div className="bg-corporate-blue p-6 rounded-[2rem] text-white flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.1em]">Efficiency Score</p>
              <TrendingUp size={16} />
            </div>
            <div>
              <p className="text-4xl font-black">{dashboard?.averageScore ? dashboard.averageScore.toFixed(1) : 'N/A'}<span className="text-lg opacity-50">/10</span></p>
              <p className="text-[10px] font-bold opacity-60 mt-1 uppercase">Based on {dashboard?.totalScores || 0} Ratings</p>
            </div>
          </div>
        </div>

        {/* 4. Recent Jobs List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Recent Activity</h3>
            <button onClick={() => router.push('/employee/job-cards')} className="text-[10px] font-black text-corporate-blue uppercase hover:underline">View All</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboard?.recentJobCards?.map((card) => (
              <div 
                key={card.id}
                onClick={() => router.push(`/employee/job-cards/${card.id}`)}
                className="group bg-white border-2 border-slate-100 p-5 rounded-3xl hover:border-corporate-blue cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-corporate-blue group-hover:bg-corporate-blue group-hover:text-white transition-colors">
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 group-hover:text-corporate-blue transition-colors line-clamp-1">{card.mainTicket.title}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Ticket #{card.mainTicket.ticketNumber} • {formatMinutes(card.workMinutes)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={card.status} />
                  <ChevronRight size={18} className="text-slate-200 group-hover:text-corporate-blue group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
          </div>

          {!dashboard?.recentJobCards?.length && (
             <div className="text-center py-10 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No Recent Activity Found</p>
             </div>
          )}
        </div>
      </div>
    </EmployeeLayout>
  );
}