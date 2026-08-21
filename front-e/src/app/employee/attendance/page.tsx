'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { attendanceService } from '@/lib/services/employee.service';
import { EmployeeDayAttendance, PageResponse } from '@/types';
import Pagination from '@/components/ui/Pagination';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDate, formatDateTime, formatMinutes } from '@/lib/utils/format';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';
import EmployeeLayout from '@/components/layouts/EmployeeLayout';

export default function EmployeeAttendance() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<PageResponse<EmployeeDayAttendance> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

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

  if (loading) return <div className="flex h-screen items-center justify-center"><LoadingSpinner /></div>;

  return (
    <EmployeeLayout>
      <div className="max-w-[400px] md:max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* Header Action Area */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-black tracking-tight uppercase">Attendance</h2>
            <p className="text-[10px] font-black text-black/50 uppercase tracking-widest">Your work day history</p>
          </div>
          <button
            onClick={() => router.push('/employee/dashboard')}
            className="p-3 bg-cream border-2 border-brand/20 rounded-2xl text-black/60 hover:text-brand hover:border-brand transition-all active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        {/* Stats Summary Strip */}
        <div className="bg-brand rounded-2xl p-4 text-cream">
          <p className="text-[9px] font-black opacity-70 uppercase mb-1">Total Days Recorded</p>
          <p className="text-2xl font-black">{history?.totalElements || 0}</p>
        </div>

        {/* Attendance List/Table Container */}
        <div className="bg-cream border-2 border-brand/20 rounded-[2rem] overflow-hidden">

          {/* Desktop Header - Hidden on Mobile */}
          <div className="hidden md:grid grid-cols-4 gap-4 px-8 py-5 bg-brand text-cream">
            {['Date', 'Shift Start', 'Shift End', 'Worked Time'].map((h) => (
              <span key={h} className="text-[10px] font-black uppercase tracking-tighter">{h}</span>
            ))}
          </div>

          <div className="divide-y divide-brand/10">
            {history && history.content.length > 0 ? (
              history.content.map((record) => (
                <div key={record.id} className="hover:bg-brand/5 transition-colors">

                  {/* Desktop Row */}
                  <div className="hidden md:grid grid-cols-4 gap-4 px-8 py-5 items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-brand/10 rounded-lg">
                        <Calendar size={14} className="text-brand" />
                      </div>
                      <span className="text-sm font-black text-black">{formatDate(record.date)}</span>
                    </div>

                    <span className="text-xs font-bold text-black/70">{record.dayStartTime ? formatDateTime(record.dayStartTime) : '--:--'}</span>
                    <span className="text-xs font-bold text-black/70">{record.dayEndTime ? formatDateTime(record.dayEndTime) : '--:--'}</span>

                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-brand" />
                      <span className="text-sm font-black text-black">{formatMinutes(record.totalWorkMinutes)}</span>
                    </div>
                  </div>

                  {/* Mobile Card - Hidden on Desktop */}
                  <div className="md:hidden p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center">
                          <Calendar size={18} className="text-brand" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-black">{formatDate(record.date)}</p>
                          <p className="text-[10px] font-bold text-black/50 uppercase">Work Day</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-brand">{formatMinutes(record.totalWorkMinutes)}</p>
                        <p className="text-[10px] font-bold text-black/50 uppercase tracking-tighter">Worked</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-brand/5 rounded-2xl p-3 flex items-center gap-3">
                        <Clock size={14} className="text-brand" />
                        <div>
                          <p className="text-[8px] font-black text-black/50 uppercase">Start</p>
                          <p className="text-[10px] font-bold text-black">{record.dayStartTime ? formatDateTime(record.dayStartTime) : '--:--'}</p>
                        </div>
                      </div>
                      <div className="bg-brand/5 rounded-2xl p-3 flex items-center gap-3">
                        <Clock size={14} className="text-brand" />
                        <div>
                          <p className="text-[8px] font-black text-black/50 uppercase">End</p>
                          <p className="text-[10px] font-bold text-black">{record.dayEndTime ? formatDateTime(record.dayEndTime) : '--:--'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center">
                <p className="text-xs font-black text-black/30 uppercase tracking-[0.2em]">No Logs Available</p>
              </div>
            )}
          </div>

          {/* Pagination Area */}
          {history && (
            <div className="px-8 py-6 bg-brand/5 border-t border-brand/10 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={history.totalPages}
                onPageChange={loadHistory}
              />
            </div>
          )}
        </div>
      </div>
    </EmployeeLayout>
  );
}
