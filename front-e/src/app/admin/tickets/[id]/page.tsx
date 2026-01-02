'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ticketService, approvalService } from '@/lib/services/admin.service';
import { authService } from '@/lib/services/auth.service';
import { MainTicket, MiniJobCard, PageResponse } from '@/types';
import AdminNav from '@/components/layouts/AdminNav';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Pagination from '@/components/ui/Pagination';
import { formatDateTime, formatMinutes } from '@/lib/utils/format';

export default function AdminTicketDetail() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);

  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<MainTicket | null>(null);
  const [miniJobs, setMiniJobs] = useState<PageResponse<MiniJobCard> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const role = authService.getRole();
    if (role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    setUser(authService.getStoredUser());
    loadTicket();
    loadMiniJobs(0);
  }, [id, router]);

  const loadTicket = async () => {
    try {
      const data = await ticketService.getById(id);
      setTicket(data);
    } catch (error) {
      console.error('Error loading ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMiniJobs = async (page: number) => {
    try {
      const data = await ticketService.getMiniJobs(id, { page, size: 10 });
      setMiniJobs(data);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading mini job cards:', error);
    }
  };

  const handleApprove = async (miniJobId: number) => {
    if (!confirm('Approve this job card?')) return;

    try {
      await approvalService.approve(miniJobId);
      alert('Job card approved!');
      loadMiniJobs(currentPage);
      loadTicket(); // Reload to update ticket status
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error approving');
    }
  };

  const handleReject = async (miniJobId: number) => {
    const note = prompt('Enter rejection reason:');
    if (!note) return;

    try {
      await approvalService.reject(miniJobId, note);
      alert('Job card rejected!');
      loadMiniJobs(currentPage);
      loadTicket();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error rejecting');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!ticket) return <div className="p-6">Ticket not found</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNav currentPage="Tickets" user={user} />

      <div className="container mx-auto p-6">
        <button
          onClick={() => router.push('/admin/tickets')}
          className="btn-secondary mb-6"
        >
          ← Back to Tickets
        </button>

        {/* Ticket Details */}
        <Card className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold">{ticket.title}</h2>
              <p className="text-gray-600">Ticket #{ticket.ticketNumber}</p>
            </div>
            <StatusBadge status={ticket.status} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><strong>Type:</strong> {ticket.type}</p>
              <p><strong>Weight:</strong> {'⭐'.repeat(ticket.weight)}</p>
              <p><strong>Description:</strong> {ticket.description || 'N/A'}</p>
            </div>
            <div>
              <p><strong>Generator:</strong> {ticket.generator.name}</p>
              <p><strong>Model:</strong> {ticket.generator.model}</p>
              <p><strong>Location:</strong> {ticket.generator.locationName}</p>
              <p><strong>Scheduled:</strong> {ticket.scheduledDate} {ticket.scheduledTime}</p>
            </div>
          </div>
        </Card>

        {/* Mini Job Cards */}
        <h3 className="text-xl font-bold mb-4">Employee Job Cards</h3>
        <div className="space-y-4">
          {miniJobs && miniJobs.content.length > 0 ? (
            miniJobs.content.map((job) => (
              <Card key={job.id}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-lg font-semibold">{job.employee.fullName}</h4>
                    <p className="text-sm text-gray-600">{job.employee.email}</p>
                  </div>
                  <StatusBadge status={job.status} />
                </div>

                {/* Display uploaded image if available */}
                {job.imageUrl && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Review Image:</p>
                    <img
                      src={job.imageUrl}
                      alt="Job review"
                      className="rounded-lg shadow-sm border border-gray-200"
                      style={{ maxHeight: '300px', maxWidth: '100%' }}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                  <div>
                    <p className="text-gray-600">Work Time</p>
                    <p className="font-semibold">{formatMinutes(job.workMinutes)}</p>
                  </div>
                  {job.startTime && (
                    <div>
                      <p className="text-gray-600">Started</p>
                      <p className="font-semibold">{formatDateTime(job.startTime)}</p>
                    </div>
                  )}
                  {job.endTime && (
                    <div>
                      <p className="text-gray-600">Ended</p>
                      <p className="font-semibold">{formatDateTime(job.endTime)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-600">Approved</p>
                    <p className="font-semibold">{job.approved ? '✅ Yes' : '❌ No'}</p>
                  </div>
                </div>

                {job.status === 'COMPLETED' && !job.approved && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(job.id)}
                      className="btn-success text-sm"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleReject(job.id)}
                      className="btn-danger text-sm"
                    >
                      ✗ Reject
                    </button>
                  </div>
                )}

                {job.approved && (
                  <div className="bg-green-50 border border-green-200 rounded p-2 text-sm text-green-700">
                    ✓ This job card has been approved
                  </div>
                )}
              </Card>
            ))
          ) : (
            <Card>
              <p className="text-center text-gray-500 py-8">No job cards found</p>
            </Card>
          )}
        </div>

        {miniJobs && miniJobs.totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={miniJobs.totalPages}
            onPageChange={loadMiniJobs}
          />
        )}
      </div>
    </div>
  );
}
