'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { reportService } from '@/lib/services/admin.service';
import { DashboardStats } from '@/types';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatMinutes } from '@/lib/utils/format';
import AdminLayout from '@/components/layouts/AdminLayout';
import {
  Users,
  Zap,
  Ticket,
  CheckCircle,
  BarChart3,
  ArrowUpRight,
  Clock,
  Activity,
  ChevronRight
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await reportService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto space-y-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mb-1">System Overview</p>
            <h2 className="text-3xl font-black text-black tracking-tighter uppercase">Command <span className="text-brand">Center</span></h2>
          </div>
          <div className="flex items-center gap-2 text-black/60 bg-cream px-3 py-1.5 rounded-xl border border-brand/20">
            <Activity size={16} className="text-brand" />
            <span className="text-xs font-bold uppercase tracking-tight">System Live: 2026-01-10</span>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total Employees', value: stats?.totalEmployees, sub: `Active: ${stats?.activeEmployees}` , icon: Users },
            { label: 'Generators', value: stats?.totalGenerators, sub: 'Units Online', icon: Zap },
            { label: 'Total Tickets', value: stats?.totalTickets, sub: `Completed: ${stats?.completedTickets}`, icon: Ticket },
            { label: 'Pending Approvals', value: stats?.pendingApprovals, sub: 'Requires Action', icon: CheckCircle },
          ].map((item, i) => (
            <div key={i} className="group bg-cream p-4 rounded-xl border border-brand/20 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start mb-2">
                <div className="bg-brand p-2 rounded-lg text-cream shadow-sm">
                  <item.icon size={18} />
                </div>
                <ArrowUpRight size={18} className="text-black/20 group-hover:text-brand transition-colors" />
              </div>
              <p className="text-[10px] font-black text-black/50 uppercase tracking-widest">{item.label}</p>
              <h3 className="text-2xl font-black text-black mt-1">{item.value || 0}</h3>
              <p className="text-[10px] font-bold text-black/60 uppercase mt-1">{item.sub}</p>
            </div>
          ))}
        </div>

        {/* Main Action Hub */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
            <h3 className="md:col-span-2 text-xs font-black text-black/50 uppercase tracking-[0.2em]">Operations</h3>

            {[
              { title: 'User Registry', desc: 'Personnel & Access Control', path: '/admin/users', icon: Users },
              { title: 'Asset Tracking', desc: 'Generator Inventory', path: '/admin/generators', icon: Zap },
              { title: 'Service Tickets', desc: 'Maintenance Logs', path: '/admin/tickets', icon: Ticket },
              { title: 'Final Approvals', desc: 'Job Card Verification', path: '/admin/approvals', icon: CheckCircle, badge: stats?.pendingApprovals },
            ].map((action, i) => (
              <button
                key={i}
                onClick={() => router.push(action.path)}
                className="group flex items-center justify-between p-4 bg-brand rounded-xl hover:shadow-lg transition-all duration-300 text-left overflow-hidden relative shadow-sm"
              >
                <div className="relative z-10">
                  <h4 className="text-cream font-black uppercase tracking-tight text-sm leading-tight">{action.title}</h4>
                  <p className="text-cream/70 text-[10px] font-bold uppercase tracking-tighter">{action.desc}</p>
                </div>
                <div className="relative z-10 bg-cream/20 p-2 rounded-lg text-cream group-hover:bg-cream group-hover:text-brand transition-all">
                  <ChevronRight size={18} />
                </div>
                {action.badge !== undefined && action.badge > 0 && (
                  <span className="absolute top-2 right-2 bg-cream text-brand text-[9px] font-black px-2 py-0.5 rounded-full border border-cream">
                    {action.badge} NEW
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Time Analytics */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-black/50 uppercase tracking-[0.2em]">Efficiency Tracker</h3>
            <div className="bg-cream rounded-xl border border-brand/20 p-4 shadow-sm h-full flex flex-col justify-center">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 text-brand">
                    <Clock size={16} strokeWidth={3} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Work Time (Month)</span>
                  </div>
                  <h4 className="text-2xl font-black text-black tracking-tighter">
                    {formatMinutes(stats?.totalWorkMinutesThisMonth || 0)}
                  </h4>
                  <div className="w-full h-1.5 bg-brand/10 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-brand w-[70%]" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1.5 text-brand">
                    <Activity size={16} strokeWidth={3} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Overtime (Month)</span>
                  </div>
                  <h4 className="text-2xl font-black text-black tracking-tighter">
                    {formatMinutes(stats?.totalOTMinutesThisMonth || 0)}
                  </h4>
                  <div className="w-full h-1.5 bg-brand/10 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-brand w-[30%]" />
                  </div>
                </div>
              </div>

              <button
                onClick={() => router.push('/admin/reports')}
                className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 border-2 border-brand/20 rounded-xl text-[10px] font-black text-black/50 uppercase tracking-[0.2em] hover:bg-brand hover:text-cream hover:border-brand transition-all"
              >
                <BarChart3 size={16} />
                View Full Analytics
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
