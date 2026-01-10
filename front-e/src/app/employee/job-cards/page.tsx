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
import { User, Calendar, MapPin, Star, CheckCircle, Clock } from 'lucide-react';
import EmployeeLayout from '@/components/layouts/EmployeeLayout';

export default function EmployeeJobCards() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [jobCards, setJobCards] = useState<PageResponse<MiniJobCard> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'ALL'>('ALL');
  const [pendingCount, setPendingCount] = useState(0);

  // Date filter state - Default to today's date
  const getTodayDate = () => new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  useEffect(() => {
    
    loadJobCards(0);
    loadPendingCount();
  }, [router, statusFilter, selectedDate]);

  const loadJobCards = async (page: number) => {
    try {
      // Always use date filtering - default to today if not selected
      const dateToUse = selectedDate || getTodayDate();
      const statusToUse = statusFilter === 'ALL' ? undefined : statusFilter;

      const data = await jobCardService.getByDate(dateToUse, statusToUse, { page, size: 10 });

      setJobCards(data);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading job cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTodayFilter = () => {
    const today = getTodayDate();
    setSelectedDate(today);
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

  if (loading) return <LoadingSpinner />;

  return (
    <EmployeeLayout pendingJobsCount={pendingCount}>
      <div className="max-w-7xl mx-auto">
        {/* Page Title - Mobile Optimized */}
        <h2 className="page-title mb-6">My Job Cards</h2>

        {/* Date Navigation - Mobile Optimized */}
        <Card className="mb-4 bg-gradient-to-r from-[#E8F0FB] to-[#F4F6F8] border-l-4 border-corporate-blue">
          <div className="space-y-4 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-4 sm:items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="input-label font-semibold">Select Date to View</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setCurrentPage(0);
                }}
                className="input-field"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleTodayFilter}
                className="btn-primary flex-1 sm:flex-none flex items-center justify-center gap-2"
              >
                <Calendar size={18} />
                Today
              </button>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200">
            <div className="text-sm text-corporate-blue font-medium flex items-center gap-2">
              <Calendar size={16} />
              Viewing job cards for: <span className="font-bold">{selectedDate}</span>
            </div>
          </div>
        </Card>

        {/* Filter Tabs - Mobile Optimized with Horizontal Scroll */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-4 py-2.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-corporate-blue text-white shadow-md'
                  : 'bg-white text-pure-black hover:bg-[#E8F0FB] border border-slate-200'
              }`}
            >
              All
            </button>
            {(['PENDING', 'TRAVELING', 'STARTED', 'ON_HOLD', 'COMPLETED', 'CANCEL'] as JobStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  statusFilter === status
                    ? 'bg-corporate-blue text-white shadow-md'
                    : 'bg-white text-pure-black hover:bg-[#E8F0FB] border border-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          {/* Scroll indicator hint for mobile */}
          <p className="text-xs text-slate-500 mt-2 sm:hidden">← Swipe to see all filters →</p>
        </div>

        {/* Job Cards Grid - Mobile Optimized */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {jobCards && jobCards.content.length > 0 ? (
            jobCards.content.map((card) => (
              <Card
                key={card.id}
                className="hover:shadow-xl transition-all cursor-pointer active:scale-98 border border-slate-200 hover:border-corporate-blue"
                onClick={() => router.push(`/employee/job-cards/${card.id}`)}
              >
                {/* Card Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
                  <h3 className="font-bold text-lg sm:text-xl text-pure-black leading-tight flex-1">
                    {card.mainTicket.title}
                  </h3>
                  <div className="flex-shrink-0">
                    <StatusBadge status={card.status} />
                  </div>
                </div>

                {/* Card Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500 font-medium min-w-[60px]">Ticket:</span>
                    <span className="text-pure-black font-semibold">{card.mainTicket.ticketNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500 font-medium min-w-[60px]">Type:</span>
                    <span className="text-pure-black">{card.mainTicket.type}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500 font-medium min-w-[60px]">Priority:</span>
                    <span className="flex items-center gap-1">
                      {Array.from({ length: card.mainTicket.weight }).map((_, i) => (
                        <Star key={i} size={14} className="text-yellow-500 fill-yellow-500" />
                      ))}
                    </span>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="border-t border-slate-200 pt-4 mt-4">
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 mb-1">Work Time</p>
                      <p className="text-sm font-bold text-corporate-blue">{formatMinutes(card.workMinutes)}</p>
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-xs text-slate-500 mb-1">Status</p>
                      <p className="text-sm font-bold flex items-center justify-end gap-1">
                        {card.approved ? (
                          <>
                            <CheckCircle size={16} className="text-corporate-blue" />
                            <span className="text-corporate-blue">Approved</span>
                          </>
                        ) : (
                          <>
                            <Clock size={16} className="text-soft-blue" />
                            <span className="text-soft-blue">Pending</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tap indicator for mobile */}
                <div className="mt-3 pt-3 border-t border-slate-100 text-center sm:hidden">
                  <p className="text-xs text-slate-500">Tap to view details →</p>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full empty-state">
              <div className="empty-state-icon">
                <svg className="w-16 h-16 sm:w-20 sm:h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="empty-state-text text-base">
                No job cards scheduled for {selectedDate}
              </p>
              <p className="text-sm text-slate-500 mt-2">
                Try selecting a different date or check back later.
              </p>
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
    </EmployeeLayout>
  );
}
