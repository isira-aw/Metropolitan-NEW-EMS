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
  }, [router, statusFilter]);

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

    // Apply filter to current data
    setTimeout(() => loadJobCards(0), 100);
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

        {/* Date Filter Controls */}
        <Card className="mb-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold mb-1">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  if (e.target.value) {
                    setDateFilterActive(true);
                    setCurrentPage(0);
                    setTimeout(() => loadJobCards(0), 100);
                  }
                }}
                className="input"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleTodayFilter}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                📅 Today
              </button>
              {dateFilterActive && (
                <button
                  onClick={handleClearFilter}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>
          {dateFilterActive && selectedDate && (
            <div className="mt-3 text-sm text-blue-600">
              📌 Showing job cards for {selectedDate}
            </div>
          )}
        </Card>

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
              {dateFilterActive ? 'No job cards found for selected date' : 'No job cards found'}
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
