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
import { User, Play, Square, CheckCircle, Clock } from 'lucide-react';
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
      alert('Day started successfully!');
    } catch (error: any) {
      // Error is already handled by global error handler in apiClient
      console.error('Error starting day:', error);
    }
  };

  const handleEndDay = async () => {
    try {
      await attendanceService.endDay();
      loadDashboard();
      alert('Day ended successfully!');
    } catch (error: any) {
      // Error is already handled by global error handler in apiClient
      console.error('Error ending day:', error);
    }
  };

  

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <EmployeeLayout pendingJobsCount={dashboard?.pendingJobCards || 0}>

      <div className="max-w-7xl mx-auto">
        <h2 className="page-title mb-6">My Dashboard</h2>

        {/* Day Status Card - Mobile Optimized */}
        <Card className="mb-6 bg-gradient-to-r from-[#E8F0FB] to-[#F4F6F8] border-l-4 border-corporate-blue">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex-1">
              <h3 className="section-title mb-2">Today's Attendance</h3>
              <p className="text-slate-700 text-sm sm:text-base">
                Status: <strong className="text-pure-black">{dashboard?.currentStatus}</strong>
              </p>
              {dashboard?.dayStarted && (
                <p className="text-sm text-corporate-blue font-medium mt-1 flex items-center gap-2">
                  <CheckCircle size={16} />
                  Day is active
                </p>
              )}
            </div>
            <div className="flex gap-3">
              {!dashboard?.dayStarted ? (
                <button onClick={handleStartDay} className="btn-success w-full sm:w-auto py-3 sm:py-2 flex items-center justify-center gap-2">
                  <Play size={18} />
                  Start Day
                </button>
              ) : !dashboard?.dayEnded ? (
                <button onClick={handleEndDay} className="btn-danger w-full sm:w-auto py-3 sm:py-2 flex items-center justify-center gap-2">
                  <Square size={18} />
                  End Day
                </button>
              ) : (
                <span className="text-corporate-blue font-semibold text-center w-full sm:w-auto py-3 sm:py-0 flex items-center justify-center gap-2">
                  <CheckCircle size={20} />
                  Day Completed
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* Statistics Grid - Mobile Optimized */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6">
          <div className="stat-card border-corporate-blue hover:shadow-lg transition-shadow">
            <h4 className="text-xs sm:text-sm text-slate-600 mb-2 font-medium">Pending Jobs</h4>
            <p className="text-2xl sm:text-3xl font-bold text-corporate-blue">{dashboard?.pendingJobCardsCount || 0}</p>
          </div>

          <div className="stat-card border-soft-blue hover:shadow-lg transition-shadow">
            <h4 className="text-xs sm:text-sm text-slate-600 mb-2 font-medium">In Progress</h4>
            <p className="text-2xl sm:text-3xl font-bold text-soft-blue">{dashboard?.inProgressJobCardsCount || 0}</p>
          </div>

          <div className="stat-card border-corporate-blue hover:shadow-lg transition-shadow">
            <h4 className="text-xs sm:text-sm text-slate-600 mb-2 font-medium">Completed</h4>
            <p className="text-2xl sm:text-3xl font-bold text-corporate-blue">{dashboard?.completedJobCardsCount || 0}</p>
          </div>

          <div className="stat-card border-soft-blue hover:shadow-lg transition-shadow">
            <h4 className="text-xs sm:text-sm text-slate-600 mb-2 font-medium">Total Jobs</h4>
            <p className="text-2xl sm:text-3xl font-bold text-soft-blue">{dashboard?.totalJobCardsCount || 0}</p>
          </div>
        </div>

        {/* Work Time Statistics - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <Card>
            <h3 className="text-sm font-medium text-slate-600 mb-2">Total Work Time</h3>
            <p className="text-2xl sm:text-3xl font-bold text-corporate-blue">
              {formatMinutes(dashboard?.totalWorkMinutes || 0)}
            </p>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-slate-600 mb-2">Total Overtime</h3>
            <p className="text-2xl sm:text-3xl font-bold text-soft-blue">
              {formatMinutes(dashboard?.totalOTMinutes || 0)}
            </p>
            <div className="mt-3 pt-3 border-t border-slate-200 space-y-1">
              <p className="text-xs sm:text-sm text-slate-600">
                <span className="font-medium">Morning:</span> {formatMinutes(dashboard?.morningOTMinutes || 0)}
              </p>
              <p className="text-xs sm:text-sm text-slate-600">
                <span className="font-medium">Evening:</span> {formatMinutes(dashboard?.eveningOTMinutes || 0)}
              </p>
            </div>
          </Card>

          <Card className="sm:col-span-2 lg:col-span-1">
            <h3 className="text-sm font-medium text-slate-600 mb-2">Performance Score</h3>
            <p className="text-2xl sm:text-3xl font-bold text-corporate-blue">
              {dashboard?.averageScore ? dashboard.averageScore.toFixed(2) : 'N/A'} / 10
            </p>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Based on {dashboard?.totalScores || 0} evaluations
            </p>
          </Card>
        </div>

        {/* Recent Job Cards - Mobile Optimized */}
        <Card>
          <h3 className="section-title mb-4">Recent Job Cards</h3>
          {dashboard?.recentJobCards && dashboard.recentJobCards.length > 0 ? (
            <div className="space-y-3">
              {dashboard.recentJobCards.map((card) => (
                <div
                  key={card.id}
                  className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 active:bg-slate-200 cursor-pointer transition-all border border-slate-200 hover:border-blue-300"
                  onClick={() => router.push(`/employee/job-cards/${card.id}`)}
                >
                  {/* Mini Card Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base sm:text-lg text-pure-black truncate mb-1">
                        {card.mainTicket.title}
                      </p>
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm text-slate-600">
                          <span className="font-medium">Ticket:</span> {card.mainTicket.ticketNumber}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-600">
                          <span className="font-medium">Type:</span> {card.mainTicket.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <StatusBadge status={card.status} />
                    </div>
                  </div>

                  {/* Mini Card Stats */}
                  <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-200">
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 mb-0.5">Work Time</p>
                      <p className="text-sm font-bold text-corporate-blue">{formatMinutes(card.workMinutes)}</p>
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-xs text-slate-500 mb-0.5">Approval</p>
                      <p className="text-sm font-bold flex items-center justify-end gap-1">
                        {card.approved ? (
                          <>
                            <CheckCircle size={16} className="text-corporate-blue" />
                            <span className="text-corporate-blue">Yes</span>
                          </>
                        ) : (
                          <>
                            <Clock size={16} className="text-soft-blue" />
                            <span className="text-soft-blue">No</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Mobile tap indicator */}
                  <div className="mt-2 pt-2 border-t border-slate-100 sm:hidden">
                    <p className="text-xs text-slate-500 text-center">Tap for details →</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state py-8">
              <div className="empty-state-icon">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="empty-state-text">No recent job cards</p>
            </div>
          )}

          <button onClick={() => router.push('/employee/job-cards')} className="btn-primary w-full mt-4 py-3 text-base">
            View All Job Cards →
          </button>
        </Card>
      </div>
    </EmployeeLayout>
  );
}
