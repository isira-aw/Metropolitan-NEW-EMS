'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { reportService, userService } from '@/lib/services/admin.service';
import { authService } from '@/lib/services/auth.service';
import AdminNav from '@/components/layouts/AdminNav';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  DailyTimeTrackingReportDTO,
  EmployeeDailyWorkTimeReportDTO,
  User,
  UserRole,
} from '@/types';

export default function AdminReports() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [employees, setEmployees] = useState<User[]>([]);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

  // Reports data
  const [timeTrackingReport, setTimeTrackingReport] = useState<DailyTimeTrackingReportDTO[]>([]);
  const [workTimeReport, setWorkTimeReport] = useState<EmployeeDailyWorkTimeReportDTO[]>([]);

  // UI states
  const [loadingReport1, setLoadingReport1] = useState(false);
  const [loadingReport2, setLoadingReport2] = useState(false);
  const [showReport1, setShowReport1] = useState(false);
  const [showReport2, setShowReport2] = useState(false);

  useEffect(() => {
    const role = authService.getRole();
    if (role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    setUser(authService.getStoredUser());
    loadEmployees();

    // Set default dates (last 7 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);

    setLoading(false);
  }, [router]);

  const loadEmployees = async () => {
    try {
      const response = await userService.getEmployees({ page: 0, size: 1000 });
      setEmployees(response.content);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleGenerateReport1 = async () => {
    if (!startDate || !endDate) {
      alert('Please select date range');
      return;
    }

    setLoadingReport1(true);
    try {
      const employeeId = selectedEmployee ? parseInt(selectedEmployee) : undefined;
      const data = await reportService.getDailyTimeTracking(startDate, endDate, employeeId);
      setTimeTrackingReport(data);
      setShowReport1(true);
      setShowReport2(false);
    } catch (error: any) {
      alert('Error generating report: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoadingReport1(false);
    }
  };

  const handleGenerateReport2 = async () => {
    if (!startDate || !endDate) {
      alert('Please select date range');
      return;
    }

    if (!selectedEmployee) {
      alert('Please select an employee');
      return;
    }

    setLoadingReport2(true);
    try {
      const data = await reportService.getEmployeeDailyWorkTime(
        parseInt(selectedEmployee),
        startDate,
        endDate
      );
      setWorkTimeReport(data);
      setShowReport2(true);
      setShowReport1(false);
    } catch (error: any) {
      alert('Error generating report: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoadingReport2(false);
    }
  };

  const formatTime = (datetime?: string) => {
    if (!datetime) return 'N/A';
    return new Date(datetime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatHours = (hours: number) => {
    return hours.toFixed(2);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNav currentPage="Reports" user={user} />

      <div className="container mx-auto p-6 max-w-7xl">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Reports</h2>

        {/* Filters Card */}
        <Card className="mb-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-700">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Employee
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </Card>

        {/* Report Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <h3 className="text-lg font-bold mb-2 text-gray-800">
              Daily Time Tracking Report
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              View employee daily work time, start/end times, location, working hours, idle time,
              and travel time
            </p>
            <button
              onClick={handleGenerateReport1}
              disabled={loadingReport1}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400"
            >
              {loadingReport1 ? 'Generating...' : 'Generate Report'}
            </button>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <h3 className="text-lg font-bold mb-2 text-gray-800">
              Employee Daily Work Time Report
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              View employee daily work hours, morning OT, evening OT, and weight earned (Select one
              employee)
            </p>
            <button
              onClick={handleGenerateReport2}
              disabled={loadingReport2 || !selectedEmployee}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400"
            >
              {loadingReport2 ? 'Generating...' : 'Generate Report'}
            </button>
          </Card>
        </div>

        {/* Report 1: Daily Time Tracking */}
        {showReport1 && (
          <Card className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Daily Time Tracking Report
              </h3>
              <button
                onClick={() => setShowReport1(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>

            {timeTrackingReport.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No data available for the selected period</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Start Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        End Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Working (hrs)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Idle (hrs)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Travel (hrs)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Total (hrs)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {timeTrackingReport.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {row.employeeName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatDate(row.date)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatTime(row.startTime)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatTime(row.endTime)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {row.location}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatHours(row.dailyWorkingHours)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatHours(row.idleHours)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatHours(row.travelHours)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {formatHours(row.totalHours)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Report 2: Employee Daily Work Time */}
        {showReport2 && (
          <Card className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Employee Daily Work Time Report
              </h3>
              <button
                onClick={() => setShowReport2(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>

            {workTimeReport.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No data available for the selected period</p>
            ) : (
              <>
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-2">Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Days:</span>{' '}
                      <span className="font-medium">{workTimeReport.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Work Hours:</span>{' '}
                      <span className="font-medium">
                        {formatHours(workTimeReport.reduce((sum, r) => sum + r.workingHours, 0))}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total OT Hours:</span>{' '}
                      <span className="font-medium">
                        {formatHours(workTimeReport.reduce((sum, r) => sum + r.totalOtHours, 0))}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Weight Earned:</span>{' '}
                      <span className="font-medium">
                        {workTimeReport.reduce((sum, r) => sum + r.totalWeightEarned, 0)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Start Time
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          End Time
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Morning OT (hrs)
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Evening OT (hrs)
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Working Hours
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Weight Earned
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {workTimeReport.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {formatDate(row.date)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {formatTime(row.startTime)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {formatTime(row.endTime)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {formatHours(row.morningOtHours)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {formatHours(row.eveningOtHours)}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {formatHours(row.workingHours)}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-green-600">
                            {row.totalWeightEarned}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
