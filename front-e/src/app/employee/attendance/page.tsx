'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { attendanceService } from '@/lib/services/employee.service';
import { authService } from '@/lib/services/auth.service';
import { EmployeeDayAttendance, PageResponse } from '@/types';
import Card from '@/components/ui/Card';
import Pagination from '@/components/ui/Pagination';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDate, formatDateTime, formatMinutes } from '@/lib/utils/format';
import { User } from 'lucide-react';

export default function EmployeeAttendance() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<PageResponse<EmployeeDayAttendance> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [user, setUser] = useState<any>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const role = authService.getRole();
    if (role !== 'EMPLOYEE') {
      router.push('/login');
      return;
    }

    setUser(authService.getStoredUser());
    loadHistory(0);
  }, [router]);

  const loadHistory = async (page: number) => {
    try {
      const data = await attendanceService.getHistory({ page, size: 10 });
      setHistory(data);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading attendance history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-light-bg">
      {/* Navigation */}
      <nav className="bg-corporate-blue text-white shadow-lg">
        <div className="container mx-auto px-4 py-3">
          {/* Mobile Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-lg sm:text-2xl font-bold">EMS Employee</h1>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-[#0F3A7A] rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6">
              <button onClick={() => router.push('/employee/dashboard')} className="hover:text-[#A0BFE0] transition-colors">Dashboard</button>
              <button onClick={() => router.push('/employee/job-cards')} className="hover:text-[#A0BFE0] transition-colors">
                Job Cards
                {pendingCount > 0 && (
                  <span className="bg-red-500 px-2 py-1 rounded-full text-xs ml-2 animate-pulse">{pendingCount}</span>
                )}
              </button>
              <button className="font-bold">Attendance</button>
              <div className="border-l border-soft-blue pl-6 flex items-center gap-4">
                <span className="text-sm flex items-center gap-2">
                  <User size={18} />
                  {user?.fullName}
                </span>
                <button onClick={() => authService.logout()} className="px-3 py-1.5 bg-white text-corporate-blue rounded-lg hover:bg-[#E8F0FB] text-sm font-medium transition-colors">
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-4 pb-4 space-y-2 border-t border-soft-blue pt-4">
              <button
                onClick={() => { router.push('/employee/dashboard'); setMobileMenuOpen(false); }}
                className="block w-full text-left px-4 py-3 hover:bg-soft-blue rounded-lg transition-colors"
              >
                Dashboard
              </button>
              <button
                className="block w-full text-left px-4 py-3 hover:bg-soft-blue rounded-lg transition-colors"
                onClick={() => { router.push('/employee/job-cards'); setMobileMenuOpen(false); }}
              >
                Job Cards
                {pendingCount > 0 && (
                  <span className="bg-red-500 px-2 py-1 rounded-full text-xs ml-2">{pendingCount}</span>
                )}
              </button>
              <button className="block w-full text-left px-4 py-3 font-bold bg-[#0F3A7A] rounded-lg">
                Attendance
              </button>

              <div className="border-t border-soft-blue pt-3 mt-3 px-4">
                <p className="text-sm mb-3 flex items-center gap-2">
                  <User size={18} />
                  {user?.fullName}
                </p>
                <button
                  onClick={() => authService.logout()}
                  className="w-full px-4 py-2 bg-white text-corporate-blue rounded-lg hover:bg-[#E8F0FB] font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="container mx-auto p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-3xl font-bold text-pure-black">Attendance History</h2>
          <button onClick={() => router.push('/employee/dashboard')} className="btn-secondary">← Back to Dashboard</button>
        </div>

        <Card>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Work Time</th>
                  <th>Morning OT</th>
                  <th>Evening OT</th>
                  <th>Total OT</th>
                </tr>
              </thead>
              <tbody>
                {history && history.content.length > 0 ? (
                  history.content.map((record) => (
                    <tr key={record.id}>
                      <td className="font-semibold">{formatDate(record.date)}</td>
                      <td>{record.dayStartTime ? formatDateTime(record.dayStartTime) : '-'}</td>
                      <td>{record.dayEndTime ? formatDateTime(record.dayEndTime) : '-'}</td>
                      <td className="font-semibold text-corporate-blue">{formatMinutes(record.totalWorkMinutes)}</td>
                      <td className="text-soft-blue">{formatMinutes(record.morningOtMinutes)}</td>
                      <td className="text-soft-blue">{formatMinutes(record.eveningOtMinutes)}</td>
                      <td className="font-semibold text-corporate-blue">
                        {formatMinutes(record.morningOtMinutes + record.eveningOtMinutes)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center text-slate-500">No attendance records found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {history && (
            <Pagination
              currentPage={currentPage}
              totalPages={history.totalPages}
              onPageChange={loadHistory}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
