'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { logsService, userService } from '@/lib/services/admin.service';
import { authService } from '@/lib/services/auth.service';
import { ActivityLogResponse, PageResponse, User } from '@/types';
import AdminLayout from '@/components/layouts/AdminLayout';
import Card from '@/components/ui/Card';
import Pagination from '@/components/ui/Pagination';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { MapPin } from 'lucide-react';

export default function AdminLogs() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<PageResponse<ActivityLogResponse> | null>(null);
  const [employees, setEmployees] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

  // Filters
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    
    loadEmployees();
    loadLogs(0);
  }, []);

  const loadEmployees = async () => {
    try {
      // Load all employees for the filter dropdown
      const response = await userService.getEmployees({ page: 0, size: 1000, activeOnly: false });
      setEmployees(response.content);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadLogs = async (page: number) => {
    try {
      setLoading(true);
      const data = await logsService.getAll({
        employeeId: selectedEmployee,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        size: 20,
      });
      setLogs(data);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading logs:', error);
      alert('Failed to load logs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterApply = () => {
    loadLogs(0);
  };

  const handleClearFilters = () => {
    setSelectedEmployee(null);
    setStartDate('');
    setEndDate('');
    setTimeout(() => loadLogs(0), 100);
  };

  const getActivityBadgeColor = (activityType: string) => {
    switch (activityType) {
      case 'DAY_START':
        return 'bg-green-100 text-green-800';
      case 'DAY_END':
        return 'bg-red-100 text-red-800';
      case 'STATUS_UPDATE':
        return 'bg-blue-100 text-blue-800';
      case 'JOB_APPROVED':
        return 'bg-emerald-100 text-emerald-800';
      case 'JOB_REJECTED':
        return 'bg-orange-100 text-orange-800';
      case 'JOB_ASSIGNED':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !logs) {
    return (
      <>
        <AdminNav currentPage="Logs" user={user} />
        <div className="min-h-screen bg-soft-blue flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-pure-black">Activity Logs</h2>

          {/* Filters */}
          <Card className="mb-6">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-corporate-blue mb-4">Filters</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Employee Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee
                  </label>
                  <select
                    value={selectedEmployee || ''}
                    onChange={(e) => setSelectedEmployee(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-corporate-blue"
                  >
                    <option value="">All Employees</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Start Date Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-corporate-blue"
                  />
                </div>

                {/* End Date Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-corporate-blue"
                  />
                </div>

                {/* Filter Buttons */}
                <div className="flex items-end gap-2">
                  <button
                    onClick={handleFilterApply}
                    className="flex-1 bg-corporate-blue text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Apply
                  </button>
                  <button
                    onClick={handleClearFilters}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Logs Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performed By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status Change
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Generator
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center">
                        <LoadingSpinner />
                      </td>
                    </tr>
                  ) : logs && logs.content.length > 0 ? (
                    logs.content.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{log.formattedDate}</div>
                            <div className="text-gray-500">{log.formattedTime}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{log.employeeFullName || 'N/A'}</div>
                            <div className="text-gray-500 text-xs">{log.employeeEmail || ''}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{log.performerFullName || 'System'}</div>
                            <div className="text-gray-500 text-xs">{log.performerEmail || ''}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActivityBadgeColor(log.activityType)}`}>
                              {log.activityDescription}
                            </span>
                            {log.ticketNumber && (
                              <div className="text-xs text-gray-500 mt-1">
                                Ticket: {log.ticketNumber}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {log.oldStatus && log.newStatus ? (
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-gray-100 rounded text-xs">{log.oldStatus}</span>
                              <span>→</span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{log.newStatus}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {log.generatorName ? (
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">{log.generatorName}</div>
                              <div className="text-gray-500 text-xs">{log.generatorLocationName}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {log.latitude && log.longitude ? (
                            <a
                              href={log.locationMapUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-corporate-blue hover:text-blue-700 hover:underline"
                            >
                              <MapPin size={16} />
                              View Map
                            </a>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        No logs found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {logs && logs.totalPages > 1 && (
              <div className="px-6 py-4 border-t">
                <Pagination
                  currentPage={currentPage}
                  totalPages={logs.totalPages}
                  onPageChange={(page) => loadLogs(page)}
                />
              </div>
            )}
          </Card>
        </div>
      </AdminLayout>
  );
}
