#!/bin/bash

cd /home/user/Metropolitan-NEW-EMS/front-e

# ====================================
# EMPLOYEE JOB CARD DETAIL PAGE
# ====================================

mkdir -p src/app/employee/job-cards/[id]
cat > src/app/employee/job-cards/[id]/page.tsx << 'EOF'
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { jobCardService } from '@/lib/services/employee.service';
import { authService } from '@/lib/services/auth.service';
import { MiniJobCard, JobStatusLog, JobStatus } from '@/types';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDateTime, formatMinutes } from '@/lib/utils/format';

export default function JobCardDetail() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);
  
  const [loading, setLoading] = useState(true);
  const [jobCard, setJobCard] = useState<MiniJobCard | null>(null);
  const [logs, setLogs] = useState<JobStatusLog[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const role = authService.getRole();
    if (role !== 'EMPLOYEE') {
      router.push('/login');
      return;
    }

    setUser(authService.getStoredUser());
    loadJobCard();
    loadLogs();
  }, [id]);

  const loadJobCard = async () => {
    try {
      const data = await jobCardService.getById(id);
      setJobCard(data);
    } catch (error) {
      console.error('Error loading job card:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const data = await jobCardService.getLogs(id);
      setLogs(data);
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const updateStatus = async (newStatus: JobStatus) => {
    try {
      await jobCardService.updateStatus(id, { newStatus });
      loadJobCard();
      loadLogs();
      alert(`Status updated to ${newStatus}`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error updating status');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!jobCard) return <div className="p-6">Job card not found</div>;

  const canUpdateStatus = (status: JobStatus) => {
    const currentStatus = jobCard.status;
    if (currentStatus === 'PENDING') return ['TRAVELING', 'STARTED'].includes(status);
    if (currentStatus === 'TRAVELING') return ['STARTED', 'ON_HOLD'].includes(status);
    if (currentStatus === 'STARTED') return ['COMPLETED', 'ON_HOLD'].includes(status);
    if (currentStatus === 'ON_HOLD') return ['STARTED'].includes(status);
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-green-600 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">EMS Employee Portal</h1>
          <div className="flex items-center gap-6">
            <button onClick={() => router.push('/employee/dashboard')} className="hover:text-green-200">Dashboard</button>
            <button onClick={() => router.push('/employee/attendance')} className="hover:text-green-200">Attendance</button>
            <button onClick={() => router.push('/employee/job-cards')} className="hover:text-green-200">Job Cards</button>
            <div className="border-l border-green-400 pl-6 flex items-center gap-4">
              <span className="text-sm">👤 {user?.fullName}</span>
              <button onClick={() => authService.logout()} className="btn-secondary text-sm">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-6">
        <button onClick={() => router.push('/employee/job-cards')} className="btn-secondary mb-6">← Back to Job Cards</button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Job Card Details */}
          <div className="lg:col-span-2">
            <Card>
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{jobCard.mainTicket.title}</h2>
                <StatusBadge status={jobCard.status} />
              </div>

              <div className="space-y-3 mb-6">
                <p><strong>Ticket Number:</strong> {jobCard.mainTicket.ticketNumber}</p>
                <p><strong>Type:</strong> {jobCard.mainTicket.type}</p>
                <p><strong>Weight:</strong> {'⭐'.repeat(jobCard.mainTicket.weight)}</p>
                <p><strong>Description:</strong> {jobCard.mainTicket.description || 'N/A'}</p>
                <p><strong>Generator:</strong> {jobCard.mainTicket.generator.name} ({jobCard.mainTicket.generator.model})</p>
                <p><strong>Location:</strong> {jobCard.mainTicket.generator.locationName}</p>
                <p><strong>Work Time:</strong> {formatMinutes(jobCard.workMinutes)}</p>
                <p><strong>Approved:</strong> {jobCard.approved ? '✅ Yes' : '❌ No'}</p>
              </div>

              {/* Status Update Buttons */}
              {jobCard.status !== 'COMPLETED' && jobCard.status !== 'CANCEL' && (
                <div>
                  <h3 className="font-semibold mb-3">Update Status:</h3>
                  <div className="flex gap-2 flex-wrap">
                    {(['TRAVELING', 'STARTED', 'ON_HOLD', 'COMPLETED'] as JobStatus[]).map((status) => (
                      canUpdateStatus(status) && (
                        <button
                          key={status}
                          onClick={() => updateStatus(status)}
                          className="btn-primary"
                        >
                          {status}
                        </button>
                      )
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Activity Logs */}
          <div>
            <Card title="Activity Logs">
              <div className="space-y-3">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <div key={log.id} className="border-l-4 border-blue-500 pl-3 py-2">
                      <p className="font-semibold">{log.newStatus}</p>
                      <p className="text-sm text-gray-600">{formatDateTime(log.loggedAt)}</p>
                      {log.prevStatus && <p className="text-xs text-gray-500">From: {log.prevStatus}</p>}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No activity logs</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
EOF

# ====================================
# ADMIN DASHBOARD
# ====================================

mkdir -p src/app/admin/dashboard
cat > src/app/admin/dashboard/page.tsx << 'EOFADMIN'
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
EOFADMIN

echo "✅ All pages created successfully!"
