'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { approvalService } from '@/lib/services/admin.service';
import { authService } from '@/lib/services/auth.service';
import { MiniJobCard, PageResponse } from '@/types';
import AdminLayout from '@/components/layouts/AdminLayout';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import Pagination from '@/components/ui/Pagination';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDateTime, formatMinutes } from '@/lib/utils/format';
import { Check, X, Star } from 'lucide-react';

export default function AdminApprovals() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<PageResponse<MiniJobCard> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    
    loadPending(0);
  }, []);

  const loadPending = async (page: number) => {
    try {
      const data = await approvalService.getPending({ page, size: 10 });
      setPending(data);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading pending approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await approvalService.approve(id);
      alert('Job card approved!');
      loadPending(currentPage);
      setSelectedIds(selectedIds.filter((sid) => sid !== id));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error approving');
    }
  };

  const handleReject = async (id: number) => {
    const note = prompt('Enter rejection reason:');
    if (!note) return;
    try {
      await approvalService.reject(id, note);
      alert('Job card rejected!');
      loadPending(currentPage);
      setSelectedIds(selectedIds.filter((sid) => sid !== id));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error rejecting');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) {
      alert('No job cards selected!');
      return;
    }
    if (!confirm(`Approve ${selectedIds.length} job cards?`)) return;
    try {
      await approvalService.bulkApprove(selectedIds);
      alert(`${selectedIds.length} job cards approved!`);
      setSelectedIds([]);
      loadPending(currentPage);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error bulk approving');
    }
  };

  const handleAssignScore = async (card: MiniJobCard) => {
    // Check if job card is approved
    if (!card.approved) {
      alert('Please approve the job card first before assigning a score.');
      return;
    }

    if (!confirm(`Assign score (weight: ${card.mainTicket.weight}) to this job card?`)) {
      return;
    }

    try {
      await approvalService.addScore({
        miniJobCardId: card.id,
      });
      alert(`Score of ${card.mainTicket.weight} assigned successfully!`);
      loadPending(currentPage);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error adding score');
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-3xl font-bold text-pure-black">Pending Approvals</h2>
          {selectedIds.length > 0 && (
            <button onClick={handleBulkApprove} className="btn-success flex items-center gap-2">
              <Check size={18} />
              Bulk Approve ({selectedIds.length})
            </button>
          )}
        </div>

        {/* Pending Cards */}
        <div className="space-y-4">
          {pending && pending.content.length > 0 ? (
            pending.content.map((card) => (
              <Card key={card.id}>
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(card.id)}
                    onChange={() => toggleSelection(card.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row justify-between items-start mb-2 gap-2">
                      <div>
                        <h3 className="text-lg font-bold text-pure-black">{card.mainTicket.title}</h3>
                        <p className="text-sm text-slate-600">Ticket: {card.mainTicket.ticketNumber}</p>
                        <p className="text-sm text-slate-600">Employee: {card.employee.fullName}</p>
                        <p className="text-sm text-slate-600 flex items-center gap-2">
                          Type: {card.mainTicket.type} | Weight:
                          <span className="flex items-center gap-1">
                            {Array.from({ length: card.mainTicket.weight }).map((_, i) => (
                              <Star key={i} size={14} className="text-yellow-500 fill-yellow-500" />
                            ))}
                          </span>
                        </p>
                      </div>
                      <StatusBadge status={card.status} />
                    </div>

                    {/* Display uploaded image if available */}
                    {card.imageUrl && (
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-pure-black mb-1">Review Image:</p>
                        <img
                          src={card.imageUrl}
                          alt="Job review"
                          className="rounded-lg shadow-sm border border-slate-200"
                          style={{ maxHeight: '200px', maxWidth: '100%' }}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-3 text-pure-black">
                      <p>Work Time: <strong>{formatMinutes(card.workMinutes)}</strong></p>
                      {card.startTime && <p>Started: <strong>{formatDateTime(card.startTime)}</strong></p>}
                      {card.endTime && <p>Ended: <strong>{formatDateTime(card.endTime)}</strong></p>}
                      <p>Approved: <strong>{card.approved ? 'Yes' : 'No'}</strong></p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => handleApprove(card.id)} className="btn-success text-sm flex items-center gap-1">
                        <Check size={16} />
                        Approve
                      </button>
                      <button onClick={() => handleReject(card.id)} className="btn-danger text-sm flex items-center gap-1">
                        <X size={16} />
                        Reject
                      </button>
                      <button onClick={() => handleAssignScore(card)} className="btn-secondary text-sm flex items-center gap-1">
                        <Star size={16} />
                        Assign Score ({card.mainTicket.weight})
                      </button>
                      <button onClick={() => router.push(`/employee/job-cards/${card.id}`)} className="btn-secondary text-sm">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <p className="text-center text-slate-600 py-8">No pending approvals</p>
            </Card>
          )}
        </div>

        {pending && <Pagination currentPage={currentPage} totalPages={pending.totalPages} onPageChange={loadPending} />}
      </div>
    </AdminLayout>
  );
}
