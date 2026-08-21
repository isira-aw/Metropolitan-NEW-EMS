'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ticketService, approvalService } from '@/lib/services/admin.service';
import { MainTicket, MiniJobCard, PageResponse } from '@/types';
import AdminLayout from '@/components/layouts/AdminLayout';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Pagination from '@/components/ui/Pagination';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { formatDateTime, formatMinutes } from '@/lib/utils/format';
import {
  ArrowLeft,
  Send,
  Mail,
  MessageSquare,
  Calendar,
  Settings,
  MapPin,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Image as ImageIcon,
  Download
} from 'lucide-react';

export default function AdminTicketDetail() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);

  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<MainTicket | null>(null);
  const [miniJobs, setMiniJobs] = useState<PageResponse<MiniJobCard> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Notification state
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [sendEmail, setSendEmail] = useState(false);
  const [sendWhatsApp, setSendWhatsApp] = useState(false);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionNoteInput, setRejectionNoteInput] = useState('');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  useEffect(() => {
    loadTicket();
    loadMiniJobs(0);
  }, [id]);

  const loadTicket = async () => {
    try {
      const data = await ticketService.getById(id);
      setTicket(data);
      setNotificationMessage(`Dear Generator Owner,\n\nUpdate for Ticket: ${data.ticketNumber}\nGenerator: ${data.generator.name}\nStatus: ${data.status}\n\nThank you.`);
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

  const confirmApprove = async () => {
    if (approvingId == null) return;
    try {
      await approvalService.approve(approvingId);
      loadMiniJobs(currentPage);
      loadTicket();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error approving');
    } finally {
      setApprovingId(null);
    }
  };

  const openRejectDialog = (miniJobId: number) => {
    setRejectingId(miniJobId);
    setRejectionNoteInput('');
  };

  const submitReject = async () => {
    if (rejectingId == null || !rejectionNoteInput.trim()) return;
    try {
      await approvalService.reject(rejectingId, rejectionNoteInput.trim());
      loadMiniJobs(currentPage);
      loadTicket();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error rejecting');
    } finally {
      setRejectingId(null);
    }
  };

  const getImageExtension = (url: string) => {
    const match = url.match(/^data:image\/(\w+);/);
    return match ? match[1] : 'jpg';
  };

  if (loading) return <LoadingSpinner />;
  if (!ticket) return <div className="p-12 text-center font-black uppercase text-black/50">Ticket not found</div>;

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto space-y-4 pb-10">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div className="space-y-2">
            <button
              onClick={() => router.push('/admin/tickets')}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-black/50 hover:text-brand transition-colors"
            >
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-black text-black tracking-tighter uppercase">{ticket.title}</h2>
                <StatusBadge status={ticket.status} />
              </div>
              <p className="text-xs font-black text-black/50 uppercase tracking-[0.2em] italic">Reference: #{ticket.ticketNumber}</p>
            </div>
          </div>

          <button
            onClick={() => setShowNotificationForm(!showNotificationForm)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black uppercase text-xs transition-all shadow-sm ${
              showNotificationForm ? 'bg-cream border border-brand/30 text-black' : 'bg-brand text-cream'
            }`}
          >
            <Send size={16} /> {showNotificationForm ? 'Close Messenger' : 'Notify Owner'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Notification Panel */}
            {showNotificationForm && (
              <Card className="p-5 border border-brand/20 shadow-sm rounded-xl bg-cream">
                <div className="flex items-center gap-3 mb-4 text-brand">
                  <MessageSquare size={20} />
                  <h3 className="text-sm font-black uppercase tracking-widest">Customer Correspondence</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-brand/5 rounded-xl border border-brand/10">
                    <p className="text-[10px] font-black text-black/50 uppercase tracking-widest mb-1">Email Destination</p>
                    <p className="text-sm font-bold text-black">{ticket.generator.ownerEmail || 'No Email provided'}</p>
                  </div>
                  <div className="p-3 bg-brand/5 rounded-xl border border-brand/10">
                    <p className="text-[10px] font-black text-black/50 uppercase tracking-widest mb-1">WhatsApp Mobile</p>
                    <p className="text-sm font-bold text-black">{ticket.generator.whatsAppNumber || 'No Phone provided'}</p>
                  </div>
                </div>

                <textarea
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  rows={5}
                  className="w-full bg-brand/5 border-none rounded-xl p-4 text-sm font-bold text-black focus:ring-2 focus:ring-brand/30 mb-4"
                  placeholder="Enter dispatch message..."
                />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={sendEmail}
                          onChange={(e) => setSendEmail(e.target.checked)}
                          className="peer sr-only"
                          disabled={!ticket.generator.ownerEmail}
                        />
                        <div className="w-5 h-5 bg-brand/5 border-2 border-brand/20 rounded-md peer-checked:bg-brand peer-checked:border-brand transition-all" />
                        <CheckCircle2 size={12} className="absolute top-1 left-1 text-cream opacity-0 peer-checked:opacity-100 transition-all" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-black/60 group-hover:text-brand transition-colors">Email</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={sendWhatsApp}
                          onChange={(e) => setSendWhatsApp(e.target.checked)}
                          className="peer sr-only"
                          disabled={!ticket.generator.whatsAppNumber}
                        />
                        <div className="w-5 h-5 bg-brand/5 border-2 border-brand/20 rounded-md peer-checked:bg-brand peer-checked:border-brand transition-all" />
                        <CheckCircle2 size={12} className="absolute top-1 left-1 text-cream opacity-0 peer-checked:opacity-100 transition-all" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-black/60 group-hover:text-brand transition-colors">WhatsApp</span>
                    </label>
                  </div>

                  <button
                    onClick={() => {}} // handleSendNotification logic
                    disabled={sendingNotification || (!sendEmail && !sendWhatsApp)}
                    className="px-6 py-2.5 bg-brand text-cream rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-sm disabled:opacity-50"
                  >
                    {sendingNotification ? 'Processing...' : 'Dispatch Notification'}
                  </button>
                </div>
              </Card>
            )}

            {/* Job Cards Section */}
            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-black text-black uppercase tracking-tighter">Field Personnel Activity</h3>
                <p className="text-[10px] font-black text-black/50 uppercase tracking-widest">Verification of labor and site evidence</p>
              </div>

              {miniJobs && miniJobs.content.length > 0 ? (
                miniJobs.content.map((job) => (
                  <Card key={job.id} className="p-4 border border-brand/20 shadow-sm rounded-xl bg-cream group overflow-hidden relative">
                    {job.approved && (
                      <div className="absolute top-0 right-0 p-3">
                        <CheckCircle2 size={24} className="text-brand/20" />
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-brand/10 flex items-center justify-center font-black text-brand">
                          {job.employee.fullName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-black text-black uppercase leading-none mb-1 text-sm">{job.employee.fullName}</h4>
                          <p className="text-[10px] font-bold text-black/50 tracking-widest lowercase">{job.employee.email}</p>
                        </div>
                      </div>
                      <StatusBadge status={job.status} />
                    </div>

                    {job.status === 'ON_HOLD' && job.rejectionNote && (
                      <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Rejection Reason</p>
                        <p className="text-sm font-bold text-red-700">{job.rejectionNote}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Evidence Image */}
                      <div className="md:col-span-1">
                        <p className="text-[10px] font-black text-black/50 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <ImageIcon size={13} /> Site Evidence
                        </p>
                        {job.imageUrl ? (
                          <button
                            type="button"
                            onClick={() => setPreviewImageUrl(job.imageUrl!)}
                            className="relative group/img cursor-zoom-in block w-full text-left"
                          >
                            <img
                              src={job.imageUrl}
                              alt="Site work evidence"
                              className="rounded-xl w-full h-28 object-cover shadow-sm grayscale group-hover/img:grayscale-0 transition-all duration-500"
                            />
                            <div className="absolute inset-0 bg-brand/30 opacity-0 group-hover/img:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                              <span className="text-[10px] font-black text-cream uppercase tracking-widest">View Full Size</span>
                            </div>
                          </button>
                        ) : (
                          <div className="h-28 rounded-xl bg-brand/5 border-2 border-dashed border-brand/20 flex flex-col items-center justify-center text-black/30">
                            <ImageIcon size={26} />
                            <span className="text-[10px] font-black uppercase mt-1 tracking-widest">No Image</span>
                          </div>
                        )}
                      </div>

                      {/* Work Details */}
                      <div className="md:col-span-2 flex flex-col justify-between">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-[10px] font-black text-black/50 uppercase tracking-widest mb-1">Labor Time</p>
                            <p className="text-base font-black text-black uppercase italic flex items-center gap-2">
                              <Clock size={15} className="text-brand" /> {formatMinutes(job.workMinutes)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-black/50 uppercase tracking-widest mb-1">Approval State</p>
                            <p className={`text-base font-black uppercase italic ${job.approved ? 'text-brand' : 'text-black/30'}`}>
                              {job.approved ? 'Verified' : 'Pending'}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[10px] font-black text-black/50 uppercase tracking-widest mb-1">Session Windows</p>
                            <div className="flex items-center gap-2 text-xs font-bold text-black/70">
                              <span className="px-2 py-1 bg-brand/5 rounded-lg">{formatDateTime(job.startTime)}</span>
                              <span className="text-black/30">→</span>
                              <span className="px-2 py-1 bg-brand/5 rounded-lg">{formatDateTime(job.endTime)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Bar */}
                        <div className="mt-3 pt-3 border-t border-brand/10">
                          {job.status === 'COMPLETED' && !job.approved ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => setApprovingId(job.id)}
                                className="flex-1 bg-brand text-cream py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:shadow-md transition-all flex items-center justify-center gap-2"
                              >
                                <CheckCircle2 size={15} /> Approve Labor
                              </button>
                              <button
                                onClick={() => openRejectDialog(job.id)}
                                className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                              >
                                <XCircle size={15} /> Reject
                              </button>
                            </div>
                          ) : job.approved && (
                            <div className="w-full py-2.5 bg-brand/10 text-brand rounded-xl font-black uppercase text-[10px] tracking-[0.2em] text-center border border-brand/20">
                              Personnel Activity Verified by Admin
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-16 text-center bg-cream rounded-xl border border-brand/20 shadow-sm">
                  <AlertCircle size={40} className="mx-auto text-brand/20 mb-3" />
                  <p className="font-black text-black/40 uppercase tracking-widest text-sm">No job cards assigned to this ticket</p>
                </Card>
              )}
            </div>
          </div>

          {/* Sidebar Info Column */}
          <div className="space-y-4">
            <Card className="border border-brand/20 shadow-sm rounded-xl bg-brand text-cream overflow-hidden relative">
              <div className="relative z-10 p-5">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-cream">Technical Audit</h3>
                  <div className="h-2 w-2 rounded-full bg-cream animate-pulse" />
                </div>

                <div className="space-y-5">
                  {/* Asset Details */}
                  <div className="group">
                    <p className="text-[10px] font-black text-cream/70 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                      <Settings size={12} className="text-cream" /> Machine Specs
                    </p>
                    <div className="pl-4 border-l border-cream/30">
                      <p className="font-black text-sm uppercase leading-tight">{ticket.generator.name}</p>
                      <p className="text-xs font-bold text-cream/70 mt-1 italic">{ticket.generator.model}</p>
                    </div>
                  </div>

                  {/* Location Details */}
                  <div className="group">
                    <p className="text-[10px] font-black text-cream/70 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                      <MapPin size={12} className="text-cream" /> Deployment Site
                    </p>
                    <div className="pl-4 border-l border-cream/30">
                      <p className="font-black text-sm uppercase leading-tight tracking-tight">
                        {ticket.generator.locationName}
                      </p>
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="group">
                    <p className="text-[10px] font-black text-cream/70 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                      <Calendar size={12} className="text-cream" /> Ops Window
                    </p>
                    <div className="pl-4 border-l border-cream/30">
                      <p className="font-black text-sm uppercase tracking-widest">
                        {ticket.scheduledDate} <span className="text-cream/70 mx-1">@</span> {ticket.scheduledTime}
                      </p>
                    </div>
                  </div>

                  {/* Complexity Weight (Stars) */}
                  <div className="group">
                    <p className="text-[10px] font-black text-cream/70 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                      <AlertCircle size={12} className="text-cream" /> Complexity Weight
                    </p>
                    <div className="pl-4 border-l border-cream/30">
                      <div className="flex gap-1.5 items-center">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${i < ticket.weight ? 'text-cream' : 'text-cream/20'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.388 2.46a1 1 0 00-.364 1.118l1.286 3.97c.3.921-.755 1.688-1.54 1.118l-3.388-2.46a1 1 0 00-1.175 0l-3.388 2.46c-.784.57-1.838-.197-1.539-1.118l1.286-3.97a1 1 0 00-.364-1.118L2.05 9.397c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69l1.286-3.97z" />
                          </svg>
                        ))}
                        <span className="ml-2 text-[10px] font-black text-cream/70">LVL {ticket.weight}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Internal Briefing Section */}
                <div className="mt-6 p-4 bg-cream/10 rounded-xl border border-cream/20">
                  <p className="text-[10px] font-black text-cream/70 uppercase tracking-widest mb-2">Service Briefing</p>
                  <p className="text-xs italic font-medium text-cream/90 leading-relaxed">
                    "{ticket.description || 'No specific instructions provided for this maintenance cycle.'}"
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {miniJobs && miniJobs.totalPages > 1 && (
          <div className="flex justify-center mt-4">
             <Pagination
              currentPage={currentPage}
              totalPages={miniJobs.totalPages}
              onPageChange={loadMiniJobs}
            />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={approvingId !== null}
        title="Approve Job Card"
        message="Approve this job card?"
        confirmLabel="Approve"
        danger={false}
        onConfirm={confirmApprove}
        onCancel={() => setApprovingId(null)}
      />

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

      <Modal
        open={previewImageUrl !== null}
        onClose={() => setPreviewImageUrl(null)}
        title="Site Evidence"
        maxWidth="max-w-3xl"
      >
        {previewImageUrl && (
          <div className="space-y-4">
            <img
              src={previewImageUrl}
              alt="Site work evidence full size"
              className="w-full max-h-[70vh] object-contain rounded-xl"
            />
            <a
              href={previewImageUrl}
              download={`site-evidence-${ticket.ticketNumber}.${getImageExtension(previewImageUrl)}`}
              className="flex items-center justify-center gap-2 w-full bg-brand text-cream py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:shadow-lg transition-all"
            >
              <Download size={16} /> Download Image
            </a>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
