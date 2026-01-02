'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { generatorService, ticketService } from '@/lib/services/admin.service';
import { authService } from '@/lib/services/auth.service';
import { Generator, GeneratorStatistics, MainTicket, PageResponse } from '@/types';
import AdminNav from '@/components/layouts/AdminNav';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Pagination from '@/components/ui/Pagination';

export default function AdminGeneratorDetail() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);

  const [loading, setLoading] = useState(true);
  const [generator, setGenerator] = useState<Generator | null>(null);
  const [statistics, setStatistics] = useState<GeneratorStatistics | null>(null);
  const [tickets, setTickets] = useState<PageResponse<MainTicket> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [user, setUser] = useState<any>(null);

  // Date filter state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateFilterActive, setDateFilterActive] = useState(false);

  useEffect(() => {
    const role = authService.getRole();
    if (role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    setUser(authService.getStoredUser());
    loadGenerator();
    loadStatistics();
    loadTickets(0);
  }, [id, router]);

  const loadGenerator = async () => {
    try {
      const data = await generatorService.getById(id);
      setGenerator(data);
    } catch (error) {
      console.error('Error loading generator:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const data = await generatorService.getStatistics(id);
      setStatistics(data);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const loadTickets = async (page: number) => {
    try {
      let data: PageResponse<MainTicket>;

      if (dateFilterActive && startDate && endDate) {
        // Get all tickets by date range first
        const allTickets = await ticketService.getByDateRange(startDate, endDate, { page, size: 10 });
        // Filter by generator ID on the client side
        const filteredContent = allTickets.content.filter(ticket => ticket.generator.id === id);
        data = {
          ...allTickets,
          content: filteredContent,
          totalElements: filteredContent.length,
          totalPages: Math.ceil(filteredContent.length / 10),
        };
      } else {
        data = await generatorService.getTickets(id, { page, size: 10 });
      }

      setTickets(data);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading tickets:', error);
    }
  };

  const handleTodayFilter = () => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
    setDateFilterActive(true);
    setCurrentPage(0);

    // Reload tickets with today's date
    setTimeout(() => loadTickets(0), 100);
  };

  const handleDateFilter = () => {
    if (startDate && endDate) {
      setDateFilterActive(true);
      setCurrentPage(0);
      loadTickets(0);
    }
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    setDateFilterActive(false);
    setCurrentPage(0);
    loadTickets(0);
  };

  if (loading) return <LoadingSpinner />;
  if (!generator) return <div className="p-6">Generator not found</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNav currentPage="Generators" user={user} />

      <div className="container mx-auto p-6">
        <button
          onClick={() => router.push('/admin/generators')}
          className="btn-secondary mb-6"
        >
          ← Back to Generators
        </button>

        {/* Generator Details */}
        <Card className="mb-6">
          <h2 className="text-2xl font-bold mb-4">{generator.name}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p><strong>Model:</strong> {generator.model}</p>
              <p><strong>Capacity:</strong> {generator.capacity || 'N/A'}</p>
              <p><strong>Location:</strong> {generator.locationName}</p>
            </div>
            <div>
              <p><strong>Owner Email:</strong> {generator.ownerEmail || 'N/A'}</p>
              {generator.latitude && generator.longitude && (
                <p><strong>Coordinates:</strong> {generator.latitude}, {generator.longitude}</p>
              )}
              {generator.note && (
                <p className="mt-2"><strong>Note:</strong> {generator.note}</p>
              )}
            </div>
          </div>

          {/* Statistics */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-sm text-gray-600">Total Tickets</p>
                <p className="text-2xl font-bold text-blue-600">{statistics.totalTickets}</p>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{statistics.completedTickets}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{statistics.pendingTickets}</p>
              </div>
            </div>
          )}
        </Card>

        {/* Ticket Management Section */}
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-4">Ticket Management</h3>

          {/* Date Filter Controls */}
          <Card className="mb-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm font-semibold mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleTodayFilter}
                  className="btn-primary"
                >
                  📅 Today
                </button>
                <button
                  onClick={handleDateFilter}
                  disabled={!startDate || !endDate}
                  className="btn-success disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply Filter
                </button>
                {dateFilterActive && (
                  <button
                    onClick={handleClearFilter}
                    className="btn-secondary"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>
            {dateFilterActive && (
              <div className="mt-3 text-sm text-blue-600">
                📌 Showing tickets from {startDate} to {endDate}
              </div>
            )}
          </Card>

          {/* Tickets List */}
          <div className="space-y-4">
            {tickets && tickets.content.length > 0 ? (
              tickets.content.map((ticket) => (
                <Card
                  key={ticket.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/admin/tickets/${ticket.id}`)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-lg font-semibold">{ticket.title}</h4>
                      <p className="text-sm text-gray-600">Ticket #{ticket.ticketNumber}</p>
                    </div>
                    <StatusBadge status={ticket.status} />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Type</p>
                      <p className="font-semibold">{ticket.type}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Weight</p>
                      <p className="font-semibold">{'⭐'.repeat(ticket.weight)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Scheduled Date</p>
                      <p className="font-semibold">{ticket.scheduledDate}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Scheduled Time</p>
                      <p className="font-semibold">{ticket.scheduledTime}</p>
                    </div>
                  </div>

                  {ticket.description && (
                    <p className="text-sm text-gray-600 mt-3 border-t pt-3">
                      {ticket.description}
                    </p>
                  )}
                </Card>
              ))
            ) : (
              <Card>
                <p className="text-center text-gray-500 py-8">
                  {dateFilterActive ? 'No tickets found for selected date range' : 'No tickets found'}
                </p>
              </Card>
            )}
          </div>

          {tickets && tickets.totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={tickets.totalPages}
              onPageChange={loadTickets}
            />
          )}
        </div>
      </div>
    </div>
  );
}
