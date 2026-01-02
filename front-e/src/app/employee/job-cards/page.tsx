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
  const [allJobCards, setAllJobCards] = useState<MiniJobCard[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'ALL'>('ALL');
  const [pendingCount, setPendingCount] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Date filter state
  const [selectedDate, setSelectedDate] = useState('');
  const [dateFilterActive, setDateFilterActive] = useState(false);

  useEffect(() => {
    const role = authService.getRole();
    if (role !== 'EMPLOYEE') {
      router.push('/login');
      return;
    }

    setUser(authService.getStoredUser());
    loadJobCards(0);
    loadPendingCount();
  }, [router, statusFilter, dateFilterActive, selectedDate]);

  const loadJobCards = async (page: number) => {
    try {
      const data = statusFilter === 'ALL'
        ? await jobCardService.getAll({ page, size: 10 })
        : await jobCardService.getByStatus(statusFilter, { page, size: 10 });

      setAllJobCards(data.content);

      // Apply date filter if active
      let filteredContent = data.content;
      if (dateFilterActive && selectedDate) {
        filteredContent = data.content.filter(card => {
          const scheduledDate = card.mainTicket.scheduledDate;
          return scheduledDate === selectedDate;
        });
      }

      setJobCards({
        ...data,
        content: filteredContent,
        totalElements: filteredContent.length,
        totalPages: Math.ceil(filteredContent.length / 10),
      });
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading job cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTodayFilter = () => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    setDateFilterActive(true);
    setCurrentPage(0);
  };

  const handleClearFilter = () => {
    setSelectedDate('');
    setDateFilterActive(false);
    setCurrentPage(0);
    loadJobCards(0);
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
    <div className="min-h-screen bg-slate-50">
      {/* Mobile-Optimized Navigation */}
      <nav className="bg-green-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-3">
          {/* Mobile Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-lg sm:text-2xl font-bold">EMS Employee</h1>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-green-700 rounded-lg transition-colors"
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
              <button onClick={() => router.push('/employee/dashboard')} className="hover:text-green-200 transition-colors">Dashboard</button>
              <button className="font-bold">
                Job Cards
                {pendingCount > 0 && (
                  <span className="bg-red-500 px-2 py-1 rounded-full text-xs ml-2 animate-pulse">{pendingCount}</span>
                )}
              </button>
              <button onClick={() => router.push('/employee/attendance')} className="hover:text-green-200 transition-colors">Attendance</button>
              
              <div className="border-l border-green-400 pl-6 flex items-center gap-4">
                <span className="text-sm">👤 {user?.fullName}</span>
                <button onClick={() => authService.logout()} className="px-3 py-1.5 bg-white text-green-600 rounded-lg hover:bg-green-50 text-sm font-medium transition-colors">
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-4 pb-4 space-y-2 border-t border-green-500 pt-4">
              <button
                onClick={() => { router.push('/employee/dashboard'); setMobileMenuOpen(false); }}
                className="block w-full text-left px-4 py-3 hover:bg-green-700 rounded-lg transition-colors"
              >
                Dashboard
              </button>
                            <button className="block w-full text-left px-4 py-3 font-bold bg-green-700 rounded-lg">
                Job Cards
                {pendingCount > 0 && (
                  <span className="bg-red-500 px-2 py-1 rounded-full text-xs ml-2">{pendingCount}</span>
                )}
              </button>
              <button
                onClick={() => { router.push('/employee/attendance'); setMobileMenuOpen(false); }}
                className="block w-full text-left px-4 py-3 hover:bg-green-700 rounded-lg transition-colors"
              >
                Attendance
              </button>

              <div className="border-t border-green-500 pt-3 mt-3 px-4">
                <p className="text-sm mb-3">👤 {user?.fullName}</p>
                <button
                  onClick={() => authService.logout()}
                  className="w-full px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6">
        {/* Page Title - Mobile Optimized */}
        <h2 className="page-title mb-6">My Job Cards</h2>

        {/* Date Filter Controls - Mobile Optimized */}
        <Card className="mb-4">
          <div className="space-y-4 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-4 sm:items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="input-label">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  if (e.target.value) {
                    setDateFilterActive(true);
                    setCurrentPage(0);
                  }
                }}
                className="input-field"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleTodayFilter}
                className="btn-primary flex-1 sm:flex-none"
              >
                📅 Today
              </button>
              {dateFilterActive && (
                <button
                  onClick={handleClearFilter}
                  className="btn-secondary flex-1 sm:flex-none"
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>
          {dateFilterActive && selectedDate && (
            <div className="mt-3 text-sm text-blue-600 font-medium">
              📌 Showing job cards for {selectedDate}
            </div>
          )}
        </Card>

        {/* Filter Tabs - Mobile Optimized with Horizontal Scroll */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-4 py-2.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
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
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          {/* Scroll indicator hint for mobile */}
          <p className="text-xs text-slate-400 mt-2 sm:hidden">← Swipe to see all filters →</p>
        </div>

        {/* Job Cards Grid - Mobile Optimized */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {jobCards && jobCards.content.length > 0 ? (
            jobCards.content.map((card) => (
              <Card
                key={card.id}
                className="hover:shadow-xl transition-all cursor-pointer active:scale-98 border border-slate-200"
                onClick={() => router.push(`/employee/job-cards/${card.id}`)}
              >
                {/* Card Header */}
                <div className="flex justify-between items-start gap-3 mb-4">
                  <h3 className="font-bold text-lg sm:text-xl text-slate-900 leading-tight flex-1">
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
                    <span className="text-slate-900 font-semibold">{card.mainTicket.ticketNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500 font-medium min-w-[60px]">Type:</span>
                    <span className="text-slate-900">{card.mainTicket.type}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500 font-medium min-w-[60px]">Priority:</span>
                    <span className="text-amber-600 text-base">{'⭐'.repeat(card.mainTicket.weight)}</span>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="border-t border-slate-200 pt-4 mt-4">
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 mb-1">Work Time</p>
                      <p className="text-sm font-bold text-blue-600">{formatMinutes(card.workMinutes)}</p>
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-xs text-slate-500 mb-1">Status</p>
                      <p className="text-sm font-bold">
                        {card.approved ? (
                          <span className="text-green-600">✅ Approved</span>
                        ) : (
                          <span className="text-amber-600">⏳ Pending</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tap indicator for mobile */}
                <div className="mt-3 pt-3 border-t border-slate-100 text-center sm:hidden">
                  <p className="text-xs text-slate-400">Tap to view details →</p>
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
                {dateFilterActive ? 'No job cards found for selected date' : 'No job cards available'}
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
    </div>
  );
}
