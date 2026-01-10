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

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <EmployeeLayout pendingJobsCount={pendingCount}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Title - Mobile Optimized */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-pure-black">My Job Cards</h2>
          <p className="text-sm text-slate-600 mt-1">View and manage your assigned tasks</p>
        </div>

        {/* Date Navigation - Mobile First Design */}
        <Card className="mb-4 bg-gradient-to-r from-[#E8F0FB] to-[#F4F6F8] border-l-4 border-corporate-blue shadow-md">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-pure-black mb-2">
                  📅 Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setCurrentPage(0);
                  }}
                  className="input-field text-base w-full"
                  style={{ minHeight: '44px' }} // Better touch target for mobile
                />
              </div>
              <button
                onClick={handleTodayFilter}
                className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 font-semibold"
                style={{ minHeight: '44px' }} // Better touch target
              >
                <Calendar size={20} />
                Jump to Today
              </button>
            </div>
            <div className="pt-3 border-t border-slate-200">
              <div className="text-sm text-corporate-blue font-medium flex items-center gap-2 flex-wrap">
                <Calendar size={16} className="flex-shrink-0" />
                <span>Viewing:</span>
                <span className="font-bold bg-white px-2 py-1 rounded">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Filter Tabs - Mobile Optimized with Smooth Scrolling */}
        <div className="mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-2 overflow-x-auto pb-3 sm:flex-wrap scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-5 py-3 rounded-lg font-semibold whitespace-nowrap transition-all active:scale-95 ${
                statusFilter === 'ALL'
                  ? 'bg-corporate-blue text-white shadow-lg scale-105'
                  : 'bg-white text-pure-black hover:bg-[#E8F0FB] border-2 border-slate-200'
              }`}
              style={{ minHeight: '44px' }}
            >
              📋 All
            </button>
            {(['PENDING', 'TRAVELING', 'STARTED', 'ON_HOLD', 'COMPLETED', 'CANCEL'] as JobStatus[]).map((status) => {
              const statusEmojis: Record<string, string> = {
                PENDING: '⏳',
                TRAVELING: '🚗',
                STARTED: '⚡',
                ON_HOLD: '⏸️',
                COMPLETED: '✅',
                CANCEL: '❌'
              };
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-5 py-3 rounded-lg font-semibold whitespace-nowrap transition-all active:scale-95 ${
                    statusFilter === status
                      ? 'bg-corporate-blue text-white shadow-lg scale-105'
                      : 'bg-white text-pure-black hover:bg-[#E8F0FB] border-2 border-slate-200'
                  }`}
                  style={{ minHeight: '44px' }}
                >
                  {statusEmojis[status]} {status.replace('_', ' ')}
                </button>
              );
            })}
          </div>
          {/* Scroll indicator hint for mobile */}
          <div className="flex items-center justify-center gap-2 mt-2 sm:hidden">
            <div className="h-1 w-1 bg-slate-400 rounded-full animate-pulse"></div>
            <p className="text-xs text-slate-500 font-medium">Swipe left/right to see all filters</p>
            <div className="h-1 w-1 bg-slate-400 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Job Cards Grid - Mobile First Design */}
        <div className="space-y-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 lg:gap-6 md:space-y-0">
          {jobCards && jobCards.content.length > 0 ? (
            jobCards.content.map((card) => (
              <Card
                key={card.id}
                className="relative hover:shadow-xl transition-all cursor-pointer active:scale-[0.98] border-2 border-slate-200 hover:border-corporate-blue bg-white overflow-hidden w-full"
                onClick={() => router.push(`/employee/job-cards/${card.id}`)}
                style={{ minHeight: '220px' }}
              >
                {/* Priority Indicator Bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{
                    background: card.mainTicket.weight >= 4
                      ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                      : card.mainTicket.weight >= 2
                        ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                        : 'linear-gradient(90deg, #10b981, #059669)'
                  }}
                ></div>

                {/* Card Header */}
                <div className="pt-2">
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <h3 className="font-bold text-base sm:text-lg text-pure-black leading-tight flex-1 line-clamp-2 break-words">
                      {card.mainTicket.title}
                    </h3>
                    <div className="flex-shrink-0">
                      <StatusBadge status={card.status} />
                    </div>
                  </div>
                </div>

                {/* Card Details - Optimized for Mobile */}
                <div className="space-y-2.5 mb-4">
                  <div className="flex items-start gap-2 text-sm bg-slate-50 p-2 rounded">
                    <span className="text-slate-600 font-medium text-xs flex-shrink-0">🎫</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-slate-500">Ticket Number</span>
                      <p className="text-sm text-pure-black font-semibold truncate">{card.mainTicket.ticketNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm bg-blue-50 px-2 py-2 rounded flex-1 min-w-0">
                      <span className="text-xs flex-shrink-0">🔧</span>
                      <div className="min-w-0">
                        <span className="text-xs text-slate-600 block">Type</span>
                        <span className="text-sm font-medium text-pure-black truncate block">{card.mainTicket.type}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-2 rounded flex-shrink-0">
                      <span className="flex items-center gap-0.5">
                        {Array.from({ length: card.mainTicket.weight }).map((_, i) => (
                          <Star key={i} size={14} className="text-yellow-500 fill-yellow-500" />
                        ))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer - Enhanced for Mobile */}
                <div className="border-t-2 border-slate-100 pt-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-blue-50 p-2.5 rounded-lg">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Clock size={12} className="text-corporate-blue flex-shrink-0" />
                        <p className="text-xs text-slate-600 font-medium">Work Time</p>
                      </div>
                      <p className="text-sm font-bold text-corporate-blue">{formatMinutes(card.workMinutes)}</p>
                    </div>
                    <div className={`p-2.5 rounded-lg ${card.approved ? 'bg-green-50' : 'bg-orange-50'}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        {card.approved ? (
                          <CheckCircle size={12} className="text-green-600 flex-shrink-0" />
                        ) : (
                          <Clock size={12} className="text-orange-500 flex-shrink-0" />
                        )}
                        <p className="text-xs text-slate-600 font-medium">Approval</p>
                      </div>
                      <p className={`text-sm font-bold ${card.approved ? 'text-green-600' : 'text-orange-500'}`}>
                        {card.approved ? 'Approved' : 'Pending'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Touch Feedback Indicator */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-center gap-2 text-center">
                    <div className="flex-1 h-1 bg-corporate-blue rounded-full opacity-20"></div>
                    <p className="text-xs text-slate-500 font-medium whitespace-nowrap">👆 Tap for Details</p>
                    <div className="flex-1 h-1 bg-corporate-blue rounded-full opacity-20"></div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Card className="border-2 border-dashed border-slate-300">
                <div className="empty-state py-12">
                  <div className="empty-state-icon mb-4">
                    <svg className="w-20 h-20 sm:w-24 sm:h-24 mx-auto text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-lg font-semibold text-pure-black mb-2">
                    No Job Cards Found
                  </p>
                  <p className="text-sm text-slate-600 mb-1">
                    No job cards scheduled for <span className="font-semibold text-corporate-blue">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-3">
                    💡 Try selecting a different date or check back later
                  </p>
                </div>
              </Card>
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
