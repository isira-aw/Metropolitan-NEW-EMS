'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { reportService, approvalService } from '@/lib/services/admin.service';
import { authService } from '@/lib/services/auth.service';
import { DashboardStats } from '@/types';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatMinutes } from '@/lib/utils/format';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const role = authService.getRole();
    if (role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    setUser(authService.getStoredUser());
    loadStats();
  }, [router]);

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
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">EMS Admin Portal</h1>
          <div className="flex items-center gap-6">
            <button onClick={() => router.push('/admin/dashboard')} className="font-bold">Dashboard</button>
            <button onClick={() => router.push('/admin/users')} className="hover:text-blue-200">Users</button>
            <button onClick={() => router.push('/admin/generators')} className="hover:text-blue-200">Generators</button>
            <button onClick={() => router.push('/admin/tickets')} className="hover:text-blue-200">Tickets</button>
            <button onClick={() => router.push('/admin/approvals')} className="hover:text-blue-200">Approvals</button>
            <button onClick={() => router.push('/admin/reports')} className="hover:text-blue-200">Reports</button>
            <div className="border-l border-blue-400 pl-6 flex items-center gap-4">
              <span className="text-sm">👤 {user?.fullName}</span>
              <button onClick={() => authService.logout()} className="btn-secondary text-sm">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-6">
        <h2 className="text-3xl font-bold mb-6">Admin Dashboard</h2>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="stat-card border-blue-600">
            <h4 className="text-sm text-gray-600 mb-2">Total Employees</h4>
            <p className="text-3xl font-bold text-blue-600">{stats?.totalEmployees || 0}</p>
            <p className="text-sm text-gray-600 mt-1">Active: {stats?.activeEmployees || 0}</p>
          </div>

          <div className="stat-card border-green-600">
            <h4 className="text-sm text-gray-600 mb-2">Generators</h4>
            <p className="text-3xl font-bold text-green-600">{stats?.totalGenerators || 0}</p>
          </div>

          <div className="stat-card border-purple-600">
            <h4 className="text-sm text-gray-600 mb-2">Total Tickets</h4>
            <p className="text-3xl font-bold text-purple-600">{stats?.totalTickets || 0}</p>
            <p className="text-sm text-gray-600 mt-1">Completed: {stats?.completedTickets || 0}</p>
          </div>

          <div className="stat-card border-orange-600">
            <h4 className="text-sm text-gray-600 mb-2">Pending Approvals</h4>
            <p className="text-3xl font-bold text-orange-600">{stats?.pendingApprovals || 0}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/users')}>
            <h3 className="text-xl font-bold mb-2">👥 User Management</h3>
            <p className="text-gray-600">Manage employees and administrators</p>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/generators')}>
            <h3 className="text-xl font-bold mb-2">⚡ Generators</h3>
            <p className="text-gray-600">Manage generator inventory</p>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/tickets')}>
            <h3 className="text-xl font-bold mb-2">🎫 Tickets</h3>
            <p className="text-gray-600">Create and manage service tickets</p>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/approvals')}>
            <h3 className="text-xl font-bold mb-2">✅ Approvals</h3>
            <p className="text-gray-600">Approve completed job cards</p>
            {stats && stats.pendingApprovals > 0 && (
              <span className="inline-block bg-red-500 text-white px-3 py-1 rounded-full text-sm mt-2">
                {stats.pendingApprovals} pending
              </span>
            )}
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/reports')}>
            <h3 className="text-xl font-bold mb-2">📊 Reports</h3>
            <p className="text-gray-600">View analytics and export reports</p>
          </Card>
        </div>

        {/* This Month Summary */}
        {stats && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="This Month - Work Time">
              <p className="text-2xl font-bold text-blue-600">{formatMinutes(stats.totalWorkMinutesThisMonth || 0)}</p>
            </Card>

            <Card title="This Month - Overtime">
              <p className="text-2xl font-bold text-orange-600">{formatMinutes(stats.totalOTMinutesThisMonth || 0)}</p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
