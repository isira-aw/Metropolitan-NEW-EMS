'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { logsService, userService } from '@/lib/services/admin.service';
import { ActivityLogResponse, PageResponse, User } from '@/types';
import AdminLayout from '@/components/layouts/AdminLayout';
import Card from '@/components/ui/Card';
import Pagination from '@/components/ui/Pagination';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { MapPin, Search, Filter, RotateCcw, Calendar, User as UserIcon, ArrowRight, History } from 'lucide-react';

export default function AdminLogs() {
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
    } finally {
      setLoading(false);
    }
  };

  const getActivityBadgeColor = (activityType: string) => {
    // All activity types share one brand-consistent tag style; the
    // description text itself communicates which event occurred.
    return 'bg-brand/10 text-brand border-brand/20';
  };

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto space-y-4 pb-10">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-black text-black tracking-tighter uppercase">Activity Logs</h2>
          <p className="text-xs font-black text-black/50 uppercase tracking-widest italic mt-0.5">Full System Audit & Event History</p>
        </div>

        {/* Filters Card */}
        <Card className="p-4 border-brand/20 shadow-sm rounded-xl bg-cream">
          <div className="flex items-center gap-2 mb-3 text-brand">
            <Filter size={18} />
            <h3 className="text-sm font-black uppercase tracking-widest">Filter Audit Trail</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-black/50 uppercase tracking-widest px-1">Personnel</label>
              <div className="relative">
                <UserIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" />
                <select
                  value={selectedEmployee || ''}
                  onChange={(e) => setSelectedEmployee(e.target.value ? Number(e.target.value) : null)}
                  className="w-full pl-11 pr-4 py-2.5 bg-brand/5 border-none rounded-xl text-sm font-bold text-black focus:ring-2 focus:ring-brand/30 appearance-none"
                >
                  <option value="">All Personnel</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-black/50 uppercase tracking-widest px-1">From Date</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-brand/5 border-none rounded-xl text-sm font-bold text-black focus:ring-2 focus:ring-brand/30"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-black/50 uppercase tracking-widest px-1">To Date</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-brand/5 border-none rounded-xl text-sm font-bold text-black focus:ring-2 focus:ring-brand/30"
                />
              </div>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={() => loadLogs(0)}
                className="flex-1 bg-brand text-cream h-10 rounded-xl font-black uppercase text-xs hover:shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Search size={16} /> Apply
              </button>
              <button
                onClick={() => { setSelectedEmployee(null); setStartDate(''); setEndDate(''); setTimeout(() => loadLogs(0), 100); }}
                className="p-2.5 bg-cream border border-brand/30 text-black h-10 w-10 rounded-xl hover:bg-brand/10 transition-all flex items-center justify-center"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </div>
        </Card>

        {/* Logs Table */}
        <Card className="p-0 border-brand/20 shadow-sm rounded-xl bg-cream overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-brand text-cream">
                  {['Timestamp', 'Subject Personnel', 'Action Performed', 'Status Delta', 'Asset Details', 'GPS'].map((header) => (
                    <th key={header} className="px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em]">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand/10">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-14 text-center"><LoadingSpinner /></td>
                  </tr>
                ) : logs && logs.content.length > 0 ? (
                  logs.content.map((log) => (
                    <tr key={log.id} className="group hover:bg-brand/10 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="font-black text-black text-xs uppercase">{log.formattedDate}</div>
                        <div className="text-[10px] font-black text-black/50 tracking-widest">{log.formattedTime}</div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand font-black text-xs flex-shrink-0">
                            {log.employeeFullName?.charAt(0)}
                          </div>
                          <div>
                            <div className="font-black text-black text-xs uppercase leading-none mb-1">{log.employeeFullName || 'N/A'}</div>
                            <div className="text-[10px] font-bold text-black/50 lowercase">{log.employeeEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg border uppercase tracking-wider ${getActivityBadgeColor(log.activityType)}`}>
                          {log.activityDescription}
                        </span>
                        {log.ticketNumber && (
                          <div className="mt-1 text-[10px] font-black text-brand">TKT #{log.ticketNumber}</div>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {log.oldStatus && log.newStatus ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-black/50 uppercase">{log.oldStatus}</span>
                            <ArrowRight size={12} className="text-black/30" />
                            <span className="text-[10px] font-black text-brand uppercase">{log.newStatus}</span>
                          </div>
                        ) : <span className="text-black/20">—</span>}
                      </td>
                      <td className="px-4 py-2.5">
                        {log.generatorName ? (
                          <div>
                            <div className="text-xs font-black text-black uppercase leading-none mb-1">{log.generatorName}</div>
                            <div className="text-[10px] font-bold text-black/50 uppercase tracking-tighter">{log.generatorLocationName}</div>
                          </div>
                        ) : <span className="text-black/20">—</span>}
                      </td>
                      <td className="px-4 py-2.5">
                        {log.latitude && (
                          <a
                            href={log.locationMapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-brand/10 text-brand hover:bg-brand hover:text-cream transition-all"
                          >
                            <MapPin size={16} />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-8 py-14 text-center">
                      <History size={40} className="mx-auto text-brand/20 mb-3" />
                      <p className="font-black text-black/40 uppercase tracking-widest text-sm">No activity records found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {logs && logs.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-brand/10 bg-brand/5">
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
