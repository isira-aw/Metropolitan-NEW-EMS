'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { reportService, approvalService } from '@/lib/services/admin.service';
import { authService } from '@/lib/services/auth.service';
import { DashboardStats } from '@/types';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatMinutes } from '@/lib/utils/format';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Users, Zap, Ticket, CheckCircle, BarChart3 } from 'lucide-react';

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
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-pure-black">Admin Dashboard</h2>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          <div className="stat-card border-corporate-blue">
            <h4 className="text-sm text-slate-600 mb-2">Total Employees</h4>
            <p className="text-3xl font-bold text-corporate-blue">{stats?.totalEmployees || 0}</p>
            <p className="text-sm text-slate-600 mt-1">Active: {stats?.activeEmployees || 0}</p>
          </div>

          <div className="stat-card border-soft-blue">
            <h4 className="text-sm text-slate-600 mb-2">Generators</h4>
            <p className="text-3xl font-bold text-soft-blue">{stats?.totalGenerators || 0}</p>
          </div>

          <div className="stat-card border-corporate-blue">
            <h4 className="text-sm text-slate-600 mb-2">Total Tickets</h4>
            <p className="text-3xl font-bold text-corporate-blue">{stats?.totalTickets || 0}</p>
            <p className="text-sm text-slate-600 mt-1">Completed: {stats?.completedTickets || 0}</p>
          </div>

          <div className="stat-card border-soft-blue">
            <h4 className="text-sm text-slate-600 mb-2">Pending Approvals</h4>
            <p className="text-3xl font-bold text-soft-blue">{stats?.pendingApprovals || 0}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer hover:border-corporate-blue" onClick={() => router.push('/admin/users')}>
            <div className="flex items-center gap-3 mb-2">
              <Users size={24} className="text-corporate-blue" />
              <h3 className="text-xl font-bold text-pure-black">User Management</h3>
            </div>
            <p className="text-slate-600">Manage employees and administrators</p>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer hover:border-corporate-blue" onClick={() => router.push('/admin/generators')}>
            <div className="flex items-center gap-3 mb-2">
              <Zap size={24} className="text-soft-blue" />
              <h3 className="text-xl font-bold text-pure-black">Generators</h3>
            </div>
            <p className="text-slate-600">Manage generator inventory</p>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer hover:border-corporate-blue" onClick={() => router.push('/admin/tickets')}>
            <div className="flex items-center gap-3 mb-2">
              <Ticket size={24} className="text-corporate-blue" />
              <h3 className="text-xl font-bold text-pure-black">Tickets</h3>
            </div>
            <p className="text-slate-600">Create and manage service tickets</p>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer hover:border-corporate-blue" onClick={() => router.push('/admin/approvals')}>
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle size={24} className="text-soft-blue" />
              <h3 className="text-xl font-bold text-pure-black">Approvals</h3>
            </div>
            <p className="text-slate-600">Approve completed job cards</p>
            {stats && stats.pendingApprovals > 0 && (
              <span className="inline-block bg-red-500 text-white px-3 py-1 rounded-full text-sm mt-2">
                {stats.pendingApprovals} pending
              </span>
            )}
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer hover:border-corporate-blue" onClick={() => router.push('/admin/reports')}>
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 size={24} className="text-corporate-blue" />
              <h3 className="text-xl font-bold text-pure-black">Reports</h3>
            </div>
            <p className="text-slate-600">View analytics and export reports</p>
          </Card>
        </div>

        {/* This Month Summary */}
        {stats && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <Card title="This Month - Work Time">
              <p className="text-2xl font-bold text-corporate-blue">{formatMinutes(stats.totalWorkMinutesThisMonth || 0)}</p>
            </Card>

            <Card title="This Month - Overtime">
              <p className="text-2xl font-bold text-soft-blue">{formatMinutes(stats.totalOTMinutesThisMonth || 0)}</p>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
