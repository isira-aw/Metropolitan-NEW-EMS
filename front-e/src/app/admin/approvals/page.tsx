'use client';

import { useEffect, useState } from 'react';
import { approvalService } from '@/lib/services/admin.service';
import { MiniJobCard, PageResponse } from '@/types';
import AdminLayout from '@/components/layouts/AdminLayout';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import Pagination from '@/components/ui/Pagination';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { formatDateTime, formatMinutes } from '@/lib/utils/format';
import { getTodayInTimezone } from '@/lib/config/timezone';
import { Check, X, Star, Eye, Layers, User as UserIcon, Clock, Hash, Calendar } from 'lucide-react';

export default function AdminApprovals() {
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<PageResponse<MiniJobCard> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState(getTodayInTimezone());
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionNoteInput, setRejectionNoteInput] = useState('');
  const [confirmingBulkApprove, setConfirmingBulkApprove] = useState(false);
  const [scoringCard, setScoringCard] = useState<MiniJobCard | null>(null);
  const [viewingCard, setViewingCard] = useState<MiniJobCard | null>(null);

  useEffect(() => {
    loadPending(0);
  }, [selectedDate]);

  const loadPending = async (page: number) => {
    try {
      setLoading(true);
      const data = await approvalService.getPending({ page: 0, size: 1000 });

      // Filter by selected date based on start time
      const filteredContent = data.content.filter((card) => {
        if (!card.startTime) return false;
        const cardDate = new Date(card.startTime).toISOString().split('T')[0];
        return cardDate === selectedDate;
      });

      // Paginate filtered results
      const pageSize = 10;
      const startIndex = page * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedContent = filteredContent.slice(startIndex, endIndex);

      setPending({
        content: paginatedContent,
        pageable: {
          pageNumber: page,
          pageSize: pageSize,
          offset: page * pageSize,
          paged: true,
          unpaged: false,
        },
        totalPages: Math.ceil(filteredContent.length / pageSize),
        totalElements: filteredContent.length,
        last: page >= Math.ceil(filteredContent.length / pageSize) - 1,
        first: page === 0,
        size: pageSize,
        number: page,
        numberOfElements: paginatedContent.length,
        empty: paginatedContent.length === 0,
      });
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading pending approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTodayFilter = () => {
    setSelectedDate(getTodayInTimezone());
    setCurrentPage(0);
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

  const openRejectDialog = (id: number) => {
    setRejectingId(id);
    setRejectionNoteInput('');
  };

  const submitReject = async () => {
    if (rejectingId == null || !rejectionNoteInput.trim()) return;
    try {
      await approvalService.reject(rejectingId, rejectionNoteInput.trim());
      alert('Job card rejected!');
      loadPending(currentPage);
      setSelectedIds((prev) => prev.filter((sid) => sid !== rejectingId));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error rejecting');
    } finally {
      setRejectingId(null);
    }
  };

  const confirmBulkApprove = async () => {
    try {
      const result = await approvalService.bulkApprove(selectedIds);
      if (result.failed.length === 0) {
        alert(`${result.approved.length} job cards approved!`);
      } else {
        const reasons = result.failed.map((f) => `#${f.id}: ${f.reason}`).join('\n');
        alert(`${result.approved.length} approved, ${result.failed.length} failed:\n${reasons}`);
      }
      setSelectedIds([]);
      loadPending(currentPage);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error bulk approving');
    } finally {
      setConfirmingBulkApprove(false);
    }
  };

  const openScoreDialog = (card: MiniJobCard) => {
    if (!card.approved) {
      alert('Please approve the job card first before assigning a score.');
      return;
    }
    setScoringCard(card);
  };

  const confirmAssignScore = async () => {
    if (!scoringCard) return;
    try {
      await approvalService.addScore({ miniJobCardId: scoringCard.id });
      alert(`Score of ${scoringCard.mainTicket.weight} assigned successfully!`);
      loadPending(currentPage);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error adding score');
    } finally {
      setScoringCard(null);
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  if (loading && !pending) return <LoadingSpinner />;

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto space-y-4 pb-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h2 className="text-2xl font-black text-black tracking-tighter uppercase">Approvals Queue</h2>
            <p className="text-xs font-black text-black/50 uppercase tracking-widest italic mt-0.5">Review and Score Technician Job Cards</p>
          </div>

          {selectedIds.length > 0 && (
            <button
              onClick={() => setConfirmingBulkApprove(true)}
              className="flex items-center gap-2 bg-brand text-cream px-5 py-2.5 rounded-xl font-black uppercase text-sm hover:shadow-lg transition-all"
            >
              <Check size={20} strokeWidth={3} />
              Bulk Approve ({selectedIds.length})
            </button>
          )}
        </div>

        {/* Date Filter */}
        <Card className="p-4 border-brand/20 shadow-sm rounded-xl bg-cream">
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-black text-black/60 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={16} className="text-brand" /> Filter by Date
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => { setSelectedDate(e.target.value); setCurrentPage(0); }}
                  className="flex-1 bg-brand/5 border-none rounded-xl py-2.5 px-3 text-sm font-bold text-black focus:ring-2 focus:ring-brand/30"
                />
                <button
                  onClick={handleTodayFilter}
                  className="bg-brand text-cream px-5 py-2.5 rounded-xl text-xs font-black uppercase hover:shadow-md transition-all whitespace-nowrap"
                >
                  Today
                </button>
              </div>
            </div>
            <div className="bg-brand/10 px-5 py-2.5 rounded-xl border border-brand/20 text-right">
              <p className="text-[10px] font-black text-black/50 uppercase">Results</p>
              <p className="text-lg font-black text-black">{pending?.totalElements || 0}</p>
            </div>
          </div>
        </Card>

        {/* Pending Cards List */}
        <div className="space-y-2.5">
          {pending && pending.content.length > 0 ? (
            pending.content.map((card) => (
              <div
                key={card.id}
                className={`bg-cream border-2 rounded-xl p-3.5 transition-all group ${
                  selectedIds.includes(card.id) ? 'border-brand shadow-md' : 'border-brand/20 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Selection Checkbox */}
                  <div className="pt-1">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(card.id)}
                      onChange={() => toggleSelection(card.id)}
                      className="w-5 h-5 rounded-md border-2 border-brand/30 text-brand focus:ring-brand cursor-pointer"
                    />
                  </div>

                  {card.imageUrl && (
                    <img
                      src={card.imageUrl}
                      alt="Job review"
                      className="w-16 h-16 rounded-xl object-cover border border-brand/20 flex-shrink-0"
                    />
                  )}

                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Header Info */}
                    <div className="flex flex-col md:flex-row justify-between items-start gap-2">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black text-brand uppercase bg-brand/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Hash size={10} /> {card.mainTicket.ticketNumber}
                          </span>
                          <span className="text-[10px] font-black text-black/50 uppercase tracking-widest">{card.mainTicket.type}</span>
                        </div>
                        <h3 className="text-base font-black text-black uppercase leading-tight truncate group-hover:text-brand transition-colors">
                          {card.mainTicket.title}
                        </h3>
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-1.5 text-black/70">
                            <UserIcon size={12} className="text-brand" />
                            <span className="text-xs font-black uppercase tracking-tight">{card.employee.fullName}</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                size={11}
                                className={`${i < card.mainTicket.weight ? 'text-brand fill-brand' : 'text-brand/20'}`}
                              />
                            ))}
                          </div>
                          <span className="flex items-center gap-1 text-[10px] font-bold text-black/60">
                            <Clock size={10} /> {formatMinutes(card.workMinutes)}
                          </span>
                        </div>
                      </div>
                      <StatusBadge status={card.status} />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        onClick={() => handleApprove(card.id)}
                        disabled={card.approved}
                        className={`px-3 py-2 rounded-lg font-black uppercase text-[10px] flex items-center justify-center gap-1.5 transition-all ${
                          card.approved ? 'bg-brand/10 text-black/30 cursor-not-allowed' : 'bg-brand text-cream hover:shadow-md'
                        }`}
                      >
                        <Check size={14} strokeWidth={3} /> Approve
                      </button>

                      <button
                        onClick={() => openRejectDialog(card.id)}
                        className="px-3 py-2 bg-red-50 text-red-600 rounded-lg font-black uppercase text-[10px] hover:bg-red-600 hover:text-white transition-all border border-red-100 flex items-center justify-center gap-1.5"
                      >
                        <X size={14} strokeWidth={3} /> Reject
                      </button>

                      <button
                        onClick={() => openScoreDialog(card)}
                        className={`px-3 py-2 rounded-lg font-black uppercase text-[10px] flex items-center justify-center gap-1.5 transition-all border-2 ${
                          card.approved
                          ? 'bg-brand/10 border-brand/30 text-brand hover:bg-brand hover:text-cream'
                          : 'bg-brand/5 border-brand/10 text-black/30 cursor-not-allowed'
                        }`}
                      >
                        <Star size={14} className={card.approved ? 'fill-current' : ''} />
                        Score ({card.mainTicket.weight})
                      </button>

                      <button
                        onClick={() => setViewingCard(card)}
                        className="px-3 py-2 bg-cream border border-brand/30 text-black rounded-lg font-black uppercase text-[10px] hover:bg-brand/10 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Eye size={14} /> View Card
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-brand/5 border-2 border-dashed border-brand/20 rounded-2xl py-20 text-center">
               <Layers size={48} className="mx-auto text-brand/30 mb-4" />
               <p className="text-sm font-black text-black/50 uppercase tracking-[0.3em]">All Job Cards Have Been Processed</p>
            </div>
          )}
        </div>

        {pending && (
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={pending.totalPages}
              onPageChange={loadPending}
            />
          </div>
        )}
      </div>

      <Modal
        open={rejectingId !== null}
        onClose={() => setRejectingId(null)}
        title="Reject Job Card"
        maxWidth="max-w-md"
      >
        <label className="text-[10px] font-black text-black/50 uppercase tracking-widest mb-2 block">
          Rejection Reason
        </label>
        <textarea
          value={rejectionNoteInput}
          onChange={(e) => setRejectionNoteInput(e.target.value)}
          className="w-full bg-brand/5 rounded-xl p-4 text-sm font-bold text-black border-none outline-none focus:ring-2 focus:ring-brand/30 min-h-[100px]"
          placeholder="Explain what needs to be corrected..."
          autoFocus
        />
        <div className="flex gap-3 justify-end mt-6">
          <Button variant="secondary" onClick={() => setRejectingId(null)}>Cancel</Button>
          <Button variant="danger" disabled={!rejectionNoteInput.trim()} onClick={submitReject}>Reject</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmingBulkApprove}
        title="Bulk Approve"
        message={`Approve ${selectedIds.length} selected job cards?`}
        confirmLabel="Approve All"
        danger={false}
        onConfirm={confirmBulkApprove}
        onCancel={() => setConfirmingBulkApprove(false)}
      />

      <ConfirmDialog
        open={scoringCard !== null}
        title="Assign Score"
        message={scoringCard ? `Assign score (weight: ${scoringCard.mainTicket.weight}) to this job card?` : ''}
        confirmLabel="Assign Score"
        danger={false}
        onConfirm={confirmAssignScore}
        onCancel={() => setScoringCard(null)}
      />

      <Modal
        open={viewingCard !== null}
        onClose={() => setViewingCard(null)}
        title="Job Card Details"
        subtitle={viewingCard ? `Ticket #${viewingCard.mainTicket.ticketNumber}` : undefined}
        maxWidth="max-w-2xl"
      >
        {viewingCard && (
          <div className="space-y-5">
            <div>
              <h3 className="text-xl font-black text-black uppercase leading-tight">{viewingCard.mainTicket.title}</h3>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1.5 text-black/70">
                  <UserIcon size={14} className="text-brand" />
                  <span className="text-xs font-black uppercase">{viewingCard.employee.fullName}</span>
                </div>
                <StatusBadge status={viewingCard.status} />
              </div>
            </div>

            {viewingCard.imageUrl && (
              <img
                src={viewingCard.imageUrl}
                alt="Job review"
                className="w-full max-h-[320px] object-contain rounded-2xl border border-brand/20 bg-brand/5"
              />
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-brand/5 p-4 rounded-xl border border-brand/10">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-black/50 uppercase tracking-widest">Work Duration</span>
                <span className="text-sm font-black text-black">{formatMinutes(viewingCard.workMinutes)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-black/50 uppercase tracking-widest">Approved State</span>
                <span className={`text-sm font-black uppercase ${viewingCard.approved ? 'text-brand' : 'text-red-500'}`}>
                  {viewingCard.approved ? 'Verified' : 'Pending'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-black/50 uppercase tracking-widest">Start Time</span>
                <span className="text-[11px] font-bold text-black/70">{viewingCard.startTime ? formatDateTime(viewingCard.startTime) : 'N/A'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-black/50 uppercase tracking-widest">End Time</span>
                <span className="text-[11px] font-bold text-black/70">{viewingCard.endTime ? formatDateTime(viewingCard.endTime) : 'N/A'}</span>
              </div>
            </div>

            {viewingCard.status === 'ON_HOLD' && viewingCard.rejectionNote && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Rejection Reason</p>
                <p className="text-sm font-bold text-red-700">{viewingCard.rejectionNote}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
