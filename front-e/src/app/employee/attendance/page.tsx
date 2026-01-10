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
import EmployeeLayout from '@/components/layouts/EmployeeLayout';

export default function EmployeeAttendance() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<PageResponse<EmployeeDayAttendance> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    
    loadHistory(0);
  }, []);

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
    <EmployeeLayout pendingJobsCount={pendingCount}>
      <div className="max-w-7xl mx-auto">
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
    </EmployeeLayout>
  );
}
