'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { jobCardService } from '@/lib/services/employee.service';
import { MiniJobCard, PageResponse, JobStatus } from '@/types';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import Pagination from '@/components/ui/Pagination';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatMinutes } from '@/lib/utils/format';
import { Calendar, Star, Clock, ChevronRight, Filter } from 'lucide-react';
import EmployeeLayout from '@/components/layouts/EmployeeLayout';

const STEPS: JobStatus[] = ['PENDING', 'TRAVELING', 'STARTED', 'ON_HOLD', 'COMPLETED'];

/** Compact linear stepper for the job card list rows. */
function MiniStepper({ status }: { status: JobStatus }) {
  if (status === 'CANCEL') return null;
  const currentIndex = STEPS.indexOf(status);
  return (
    <div className="flex items-center w-full">
      {STEPS.map((step, i) => {
        const done = i <= currentIndex;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div
              className={`w-2.5 h-2.5 rounded-full shrink-0 border-2 ${
                done ? 'bg-brand border-brand' : 'bg-cream border-brand/30'
              }`}
            />
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 ${i < currentIndex ? 'bg-brand' : 'bg-brand/20'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function EmployeeJobCards() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [jobCards, setJobCards] = useState<PageResponse<MiniJobCard> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'ALL'>('ALL');
  const [pendingCount, setPendingCount] = useState(0);

  const getTodayDate = () => {
    // Get current date in Sri Lanka timezone (Asia/Colombo, UTC+5:30)
    const sriLankaDate = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Colombo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    // Convert from MM/DD/YYYY to YYYY-MM-DD
    const [month, day, year] = sriLankaDate.split('/');
    return `${year}-${month}-${day}`;
  };
  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  useEffect(() => {
    loadJobCards(0);
    loadPendingCount();
  }, [statusFilter, selectedDate]);

  const loadJobCards = async (page: number) => {
    try {
      setLoading(true);
      const statusToUse = statusFilter === 'ALL' ? undefined : statusFilter;
      const data = await jobCardService.getByDate(selectedDate, statusToUse, { page, size: 12 });
      setJobCards(data);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading job cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTodayFilter = () => {
    setSelectedDate(getTodayDate());
    setCurrentPage(0);
  };

  const loadPendingCount = async () => {
    try {
      const count = await jobCardService.getPendingCount();
      setPendingCount(count);
    } catch (error) {
      console.error('Error loading pending count:', error);
    }
  };

  return (
    <EmployeeLayout pendingJobsCount={pendingCount}>
      <div className="min-h-screen bg-cream">
        <div className="max-w-[400px] md:max-w-5xl mx-auto px-4 py-6">

          {/* Header Section */}
          <div className="mb-6">
            <h2 className="text-2xl font-black text-black tracking-tight">MY JOB CARDS</h2>
            <p className="text-sm text-black/50 font-medium">{jobCards?.totalElements || 0} tasks found</p>
          </div>

          {/* Filter Bar */}
          <Card className="mb-6 space-y-4">
            {/* Date Selection */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-black/50 uppercase tracking-widest">Target Date</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => { setSelectedDate(e.target.value); setCurrentPage(0); }}
                  className="flex-1 bg-cream border-2 border-brand/30 rounded-xl px-4 py-3 text-sm font-bold text-black focus:ring-2 focus:ring-brand outline-none transition-all min-h-[48px]"
                />
                <button
                  onClick={handleTodayFilter}
                  className="bg-brand text-cream border-2 border-brand px-6 py-3 rounded-xl text-xs font-black uppercase active:scale-95 transition-all min-h-[48px]"
                >
                  Today
                </button>
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-black/50 uppercase tracking-widest">Work Status</label>

              {/* Mobile Dropdown */}
              <div className="md:hidden relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full appearance-none bg-cream border-2 border-brand/30 rounded-xl px-4 py-3 text-sm font-bold text-black outline-none min-h-[48px]"
                >
                  <option value="ALL">ALL STATUSES</option>
                  <option value="PENDING">PENDING</option>
                  <option value="TRAVELING">TRAVELING</option>
                  <option value="STARTED">STARTED</option>
                  <option value="ON_HOLD">ON HOLD</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
                <Filter size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 pointer-events-none" />
              </div>

              {/* Desktop Tabs */}
              <div className="hidden md:flex flex-wrap gap-2">
                {['ALL', 'PENDING', 'TRAVELING', 'STARTED', 'ON_HOLD', 'COMPLETED'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status as any)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all border-2 ${
                      statusFilter === status
                      ? 'bg-brand border-brand text-cream'
                      : 'bg-cream border-brand/20 text-black/60 hover:border-brand/50'
                    }`}
                  >
                    {status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Job List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <LoadingSpinner />
              <p className="mt-4 text-xs font-black text-black/40 tracking-tighter">Loading...</p>
            </div>
          ) : jobCards && jobCards.content.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobCards.content.map((card) => (
                  <button
                    type="button"
                    key={card.id}
                    onClick={() => router.push(`/employee/job-cards/${card.id}`)}
                    className="group bg-cream border-2 border-brand/20 rounded-2xl overflow-hidden hover:border-brand transition-all text-left flex flex-col w-full"
                  >
                    <div className="p-5 flex-1 space-y-4">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black bg-brand/10 text-black px-2.5 py-1 rounded-lg border border-brand/20">
                          #{card.mainTicket.ticketNumber}
                        </span>
                        <StatusBadge status={card.status} />
                      </div>

                      <h3 className="text-lg font-black text-black leading-tight line-clamp-2">
                        {card.mainTicket.title}
                      </h3>

                      <MiniStepper status={card.status} />

                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-brand/10">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-black/40 uppercase">Duration</p>
                          <div className="flex items-center gap-2 text-black">
                            <Clock size={16} className="text-brand" />
                            <span className="text-sm font-black">{formatMinutes(card.workMinutes)}</span>
                          </div>
                        </div>
                        <div className="space-y-1 text-right">
                          <p className="text-[10px] font-black text-black/40 uppercase">Complexity</p>
                          <div className="flex justify-end gap-0.5">
                            {[...Array(card.mainTicket.weight)].map((_, i) => (
                              <Star key={i} size={14} className="text-brand fill-brand" />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="px-5 py-4 flex items-center justify-between bg-brand/5 border-t border-brand/10">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${card.approved ? 'bg-brand' : 'bg-brand/40'}`}></div>
                        <span className="text-[11px] font-black uppercase text-black/60">
                          {card.approved ? 'Verified by Admin' : 'Pending Verification'}
                        </span>
                      </div>
                      <ChevronRight size={18} className="text-brand/50" />
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-10 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={jobCards.totalPages}
                  onPageChange={loadJobCards}
                />
              </div>
            </>
          ) : (
            <div className="bg-cream border-2 border-dashed border-brand/30 rounded-[2rem] py-16 flex flex-col items-center text-center px-6">
              <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mb-4">
                <Calendar size={32} className="text-brand" />
              </div>
              <h3 className="text-lg font-black text-black">NO TASKS FOUND</h3>
              <p className="text-black/50 max-w-xs mt-2 font-medium text-sm">There are no job cards assigned to you for the selected date.</p>
            </div>
          )}
        </div>
      </div>
    </EmployeeLayout>
  );
}
