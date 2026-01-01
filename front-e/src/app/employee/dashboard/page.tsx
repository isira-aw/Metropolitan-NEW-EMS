'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { employeeDashboardService, attendanceService } from '@/lib/services/employee.service';
import { authService } from '@/lib/services/auth.service';
import { EmployeeDashboardResponse } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatMinutes, formatDateTime } from '@/lib/utils/format';

export default function EmployeeDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<EmployeeDashboardResponse | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const role = authService.getRole();
    if (role !== 'EMPLOYEE') {
      router.push('/login');
      return;
    }

    setUser(authService.getStoredUser());
    loadDashboard();
  }, [router]);

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
      alert('Day started successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error starting day');
    }
  };

  const handleEndDay = async () => {
    try {
      await attendanceService.endDay();
      loadDashboard();
      alert('Day ended successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error ending day');
    }
  };

  const handleLogout = () => {
    authService.logout();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-green-600 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">EMS Employee Portal</h1>
          <div className="flex items-center gap-6">
            <button onClick={() => router.push('/employee/dashboard')} className="hover:text-green-200">
              Dashboard
            </button>
            <button onClick={() => router.push('/employee/attendance')} className="hover:text-green-200">
              Attendance
            </button>
            <button onClick={() => router.push('/employee/job-cards')} className="hover:text-green-200">
              Job Cards
            </button>
            <div className="border-l border-green-400 pl-6 flex items-center gap-4">
              <span className="text-sm">👤 {user?.fullName}</span>
              <button onClick={handleLogout} className="btn-secondary text-sm">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-6">
        <h2 className="text-3xl font-bold mb-6">My Dashboard</h2>

        {/* Day Status Card */}
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-green-50 border-l-4 border-green-600">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold mb-2">Today's Attendance</h3>
              <p className="text-gray-700">
                Status: <strong>{dashboard?.currentStatus}</strong>
              </p>
              {dashboard?.dayStarted && <p className="text-sm text-gray-600 mt-1">Day is active</p>}
            </div>
            <div className="flex gap-3">
              {!dashboard?.dayStarted ? (
                <button onClick={handleStartDay} className="btn-success">
                  ▶️ Start Day
                </button>
              ) : !dashboard?.dayEnded ? (
                <button onClick={handleEndDay} className="btn-danger">
                  ⏹️ End Day
                </button>
              ) : (
                <span className="text-green-700 font-semibold">✅ Day Completed</span>
              )}
            </div>
          </div>
        </Card>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="stat-card border-blue-600">
            <h4 className="text-sm text-gray-600 mb-2">Pending Jobs</h4>
            <p className="text-3xl font-bold text-blue-600">{dashboard?.pendingJobCardsCount || 0}</p>
          </div>

          <div className="stat-card border-yellow-600">
            <h4 className="text-sm text-gray-600 mb-2">In Progress</h4>
            <p className="text-3xl font-bold text-yellow-600">{dashboard?.inProgressJobCardsCount || 0}</p>
          </div>

          <div className="stat-card border-green-600">
            <h4 className="text-sm text-gray-600 mb-2">Completed Jobs</h4>
            <p className="text-3xl font-bold text-green-600">{dashboard?.completedJobCardsCount || 0}</p>
          </div>

          <div className="stat-card border-purple-600">
            <h4 className="text-sm text-gray-600 mb-2">Total Jobs</h4>
            <p className="text-3xl font-bold text-purple-600">{dashboard?.totalJobCardsCount || 0}</p>
          </div>
        </div>

        {/* Work Time Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card title="Total Work Time">
            <p className="text-2xl font-bold text-blue-600">{formatMinutes(dashboard?.totalWorkMinutes || 0)}</p>
          </Card>

          <Card title="Total Overtime">
            <p className="text-2xl font-bold text-orange-600">{formatMinutes(dashboard?.totalOTMinutes || 0)}</p>
            <div className="mt-2 text-sm text-gray-600">
              <p>Morning OT: {formatMinutes(dashboard?.morningOTMinutes || 0)}</p>
              <p>Evening OT: {formatMinutes(dashboard?.eveningOTMinutes || 0)}</p>
            </div>
          </Card>

          <Card title="Performance Score">
            <p className="text-2xl font-bold text-purple-600">
              {dashboard?.averageScore ? dashboard.averageScore.toFixed(2) : 'N/A'} / 10
            </p>
            <p className="text-sm text-gray-600 mt-2">Based on {dashboard?.totalScores || 0} evaluations</p>
          </Card>
        </div>

        {/* Recent Job Cards */}
        <Card title="Recent Job Cards">
          {dashboard?.recentJobCards && dashboard.recentJobCards.length > 0 ? (
            <div className="space-y-3">
              {dashboard.recentJobCards.map((card) => (
                <div
                  key={card.id}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => router.push(`/employee/job-cards/${card.id}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-lg">{card.mainTicket.title}</p>
                      <p className="text-sm text-gray-600">Ticket: {card.mainTicket.ticketNumber}</p>
                      <p className="text-sm text-gray-600">Type: {card.mainTicket.type}</p>
                    </div>
                    <StatusBadge status={card.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p>Work: {formatMinutes(card.workMinutes)}</p>
                    <p>Approved: {card.approved ? '✅ Yes' : '❌ No'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No recent job cards</p>
          )}

          <button onClick={() => router.push('/employee/job-cards')} className="btn-primary w-full mt-4">
            View All Job Cards →
          </button>
        </Card>
      </div>
    </div>
  );
}
