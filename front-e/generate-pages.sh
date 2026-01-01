#!/bin/bash

# This script generates all the comprehensive frontend pages for the EMS system

cd /home/user/Metropolitan-NEW-EMS/front-e

# Create Employee Attendance Page
mkdir -p src/app/employee/attendance
cat > src/app/employee/attendance/page.tsx << 'EMPLOYEE_ATTENDANCE_EOF'
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

export default function EmployeeAttendance() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<PageResponse<EmployeeDayAttendance> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [user, setUser] = useState<any>(null);

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
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-green-600 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">EMS Employee Portal</h1>
          <div className="flex items-center gap-6">
            <button onClick={() => router.push('/employee/dashboard')} className="hover:text-green-200">Dashboard</button>
            <button className="font-bold">Attendance</button>
            <button onClick={() => router.push('/employee/job-cards')} className="hover:text-green-200">Job Cards</button>
            <div className="border-l border-green-400 pl-6 flex items-center gap-4">
              <span className="text-sm">👤 {user?.fullName}</span>
              <button onClick={() => authService.logout()} className="btn-secondary text-sm">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Attendance History</h2>
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
                      <td>{formatMinutes(record.totalWorkMinutes)}</td>
                      <td className="text-orange-600">{formatMinutes(record.morningOtMinutes)}</td>
                      <td className="text-orange-600">{formatMinutes(record.eveningOtMinutes)}</td>
                      <td className="font-semibold text-orange-600">
                        {formatMinutes(record.morningOtMinutes + record.eveningOtMinutes)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center text-gray-500">No attendance records found</td>
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
EMPLOYEE_ATTENDANCE_EOF

# Create Employee Job Cards List Page
mkdir -p src/app/employee/job-cards
cat > src/app/employee/job-cards/page.tsx << 'EMPLOYEE_JOBCARDS_EOF'
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { jobCardService } from '@/lib/services/employee.service';
import { authService } from '@/lib/services/auth.service';
import { MiniJobCard, PageResponse, JobStatus } from '@/types';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import Pagination from '@/components/ui/Pagination';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDateTime, formatMinutes } from '@/lib/utils/format';

export default function EmployeeJobCards() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [jobCards, setJobCards] = useState<PageResponse<MiniJobCard> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'ALL'>('ALL');
  const [pendingCount, setPendingCount] = useState(0);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const role = authService.getRole();
    if (role !== 'EMPLOYEE') {
      router.push('/login');
      return;
    }

    setUser(authService.getStoredUser());
    loadJobCards(0);
    loadPendingCount();
  }, [router, statusFilter]);

  const loadJobCards = async (page: number) => {
    try {
      const data = statusFilter === 'ALL'
        ? await jobCardService.getAll({ page, size: 10 })
        : await jobCardService.getByStatus(statusFilter, { page, size: 10 });

      setJobCards(data);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading job cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingCount = async () => {
    try {
      const count = await jobCardService.getPendingCount();
      setPendingCount(count);
    } catch (error) {
      console.error('Error loading pending count:', error);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-green-600 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">EMS Employee Portal</h1>
          <div className="flex items-center gap-6">
            <button onClick={() => router.push('/employee/dashboard')} className="hover:text-green-200">Dashboard</button>
            <button onClick={() => router.push('/employee/attendance')} className="hover:text-green-200">Attendance</button>
            <button className="font-bold">Job Cards {pendingCount > 0 && <span className="bg-red-500 px-2 py-1 rounded-full text-xs ml-1">{pendingCount}</span>}</button>
            <div className="border-l border-green-400 pl-6 flex items-center gap-4">
              <span className="text-sm">👤 {user?.fullName}</span>
              <button onClick={() => authService.logout()} className="btn-secondary text-sm">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">My Job Cards</h2>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-4 py-2 rounded ${statusFilter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            All
          </button>
          {(['PENDING', 'TRAVELING', 'STARTED', 'ON_HOLD', 'COMPLETED', 'CANCEL'] as JobStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded ${statusFilter === status ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Job Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobCards && jobCards.content.length > 0 ? (
            jobCards.content.map((card) => (
              <Card key={card.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(`/employee/job-cards/${card.id}`)}>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg">{card.mainTicket.title}</h3>
                  <StatusBadge status={card.status} />
                </div>
                <p className="text-sm text-gray-600 mb-2">Ticket: {card.mainTicket.ticketNumber}</p>
                <p className="text-sm text-gray-600 mb-2">Type: {card.mainTicket.type}</p>
                <p className="text-sm text-gray-600 mb-2">Weight: {'⭐'.repeat(card.mainTicket.weight)}</p>
                <div className="border-t pt-3 mt-3">
                  <p className="text-sm">Work Time: <strong>{formatMinutes(card.workMinutes)}</strong></p>
                  <p className="text-sm">Approved: <strong>{card.approved ? '✅ Yes' : '❌ No'}</strong></p>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500">
              No job cards found
            </div>
          )}
        </div>

        {jobCards && (
          <Pagination
            currentPage={currentPage}
            totalPages={jobCards.totalPages}
            onPageChange={loadJobCards}
          />
        )}
      </div>
    </div>
  );
}
EMPLOYEE_JOBCARDS_EOF

echo "✅ Employee pages created successfully!"
echo "📦 Next: Run this script with: bash front-e/generate-pages.sh"
