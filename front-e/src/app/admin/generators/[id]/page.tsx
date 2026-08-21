'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { generatorService, ticketService } from '@/lib/services/admin.service';
import { Generator, GeneratorStatistics, MainTicket, PageResponse } from '@/types';
import AdminLayout from '@/components/layouts/AdminLayout'; // FIXED: Added missing import
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Pagination from '@/components/ui/Pagination';
import {
  Zap, ArrowLeft, Calendar, BarChart3,
  CheckCircle2, Clock, Filter, X,
  MapPin, Mail, Phone, MessageSquare, Star
} from 'lucide-react';

export default function AdminGeneratorDetail() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);

  const [loading, setLoading] = useState(true);
  const [generator, setGenerator] = useState<Generator | null>(null);
  const [statistics, setStatistics] = useState<GeneratorStatistics | null>(null);
  const [tickets, setTickets] = useState<PageResponse<MainTicket> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const [selectedDate, setSelectedDate] = useState('');
  const [dateFilterActive, setDateFilterActive] = useState(false);

  useEffect(() => {
    loadGenerator();
    loadStatistics();
    loadTickets(0);
  }, [id, dateFilterActive, selectedDate]);

  const loadGenerator = async () => {
    try {
      const data = await generatorService.getById(id);
      setGenerator(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const data = await generatorService.getStatistics(id);
      setStatistics(data);
    } catch (error) { console.error(error); }
  };

  const loadTickets = async (page: number) => {
    try {
      let data: PageResponse<MainTicket>;
      if (dateFilterActive && selectedDate) {
        const allTickets = await ticketService.getByDateRange(selectedDate, selectedDate, { page, size: 10 });
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
    } catch (error) { console.error(error); }
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
    loadTickets(0);
  };

  if (loading) return <LoadingSpinner />;
  if (!generator) return <div className="p-10 text-center font-black uppercase text-black/50">Asset not found</div>;

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto space-y-4">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin/generators')}
              className="p-2.5 bg-cream border border-brand/20 rounded-xl text-black/50 hover:text-brand hover:shadow-md transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-black text-black tracking-tighter uppercase">{generator.name}</h2>
              <p className="text-[10px] font-black text-black/50 uppercase tracking-widest italic">Asset ID: #{id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-cream p-1.5 rounded-xl border border-brand/20 shadow-sm">
             <div className="px-3 py-1.5 bg-brand/5 rounded-lg text-center">
                <p className="text-[9px] font-black text-black/50 uppercase leading-none">Model</p>
                <p className="text-xs font-black text-black">{generator.model}</p>
             </div>
             <div className="px-3 py-1.5 bg-brand/10 rounded-lg text-center">
                <p className="text-[9px] font-black text-brand uppercase leading-none">Capacity</p>
                <p className="text-xs font-black text-brand">{generator.capacity || 'N/A'}</p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column: Asset Info */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-cream rounded-xl p-4 border border-brand/20 shadow-sm space-y-3">
              <p className="text-[10px] font-black text-brand uppercase tracking-widest flex items-center gap-2">
                <MapPin size={14} /> Technical Location
              </p>
              <div className="p-3 bg-brand/5 rounded-xl border border-brand/10">
                <p className="text-sm font-black text-black">{generator.locationName}</p>
                <p className="text-[10px] font-bold text-black/50 uppercase mt-1">Primary Deployment Site</p>
              </div>

              <p className="text-[10px] font-black text-brand uppercase tracking-widest flex items-center gap-2 pt-1">
                <Phone size={14} /> Contact Registry
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm font-bold text-black/70">
                  <Mail size={16} className="text-black/30" /> {generator.ownerEmail || 'No Email'}
                </div>
                {generator.whatsAppNumber && (
                  <div className="flex items-center gap-3 text-sm font-bold text-black/70">
                    <MessageSquare size={16} className="text-black/30" /> {generator.whatsAppNumber}
                  </div>
                )}
                {generator.landlineNumber && (
                  <div className="flex items-center gap-3 text-sm font-bold text-black/70">
                    <Phone size={16} className="text-black/30" /> {generator.landlineNumber}
                  </div>
                )}
              </div>

              {generator.note && (
                <div className="pt-3 border-t border-brand/10">
                   <p className="text-[10px] font-black text-black/50 uppercase tracking-widest mb-1.5">Technical Note</p>
                   <p className="text-xs font-bold text-black/70 leading-relaxed bg-brand/5 p-3 rounded-xl italic">"{generator.note}"</p>
                </div>
              )}
            </div>

            {/* Visual Stats */}
            {statistics && (
              <div className="grid grid-cols-1 gap-3">
                <div className="bg-brand rounded-xl p-4 text-cream flex justify-between items-center overflow-hidden relative">
                  <BarChart3 className="absolute -right-2 -bottom-2 w-24 h-24 text-cream/10 rotate-12" />
                  <div>
                    <p className="text-[10px] font-black text-cream/70 uppercase tracking-[0.2em]">Total Tickets</p>
                    <p className="text-3xl font-black">{statistics.totalTickets}</p>
                  </div>
                  <div className="h-11 w-11 bg-cream/10 rounded-xl flex items-center justify-center">
                    <Zap size={22} className="text-cream" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 bg-cream border border-brand/20 rounded-xl p-3.5">
                    <p className="text-[9px] font-black text-black/50 uppercase tracking-widest mb-1">Completed</p>
                    <p className="text-xl font-black text-black flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-brand" /> {statistics.completedTickets}
                    </p>
                  </div>
                  <div className="flex-1 bg-cream border border-brand/20 rounded-xl p-3.5">
                    <p className="text-[9px] font-black text-black/50 uppercase tracking-widest mb-1">Pending</p>
                    <p className="text-xl font-black text-black flex items-center gap-2">
                      <Clock size={18} className="text-brand" /> {statistics.pendingTickets}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Ticket Management */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-cream rounded-xl border border-brand/20 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-brand/10 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-brand/5">
                <h3 className="text-sm font-black text-black uppercase tracking-widest">Maintenance History</h3>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" size={14} />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        if (e.target.value) { setDateFilterActive(true); setCurrentPage(0); }
                      }}
                      className="bg-cream border border-brand/20 rounded-xl py-2 pl-9 pr-4 text-[10px] font-black uppercase text-black outline-none"
                    />
                  </div>
                  <button onClick={handleTodayFilter} className="bg-brand text-cream p-2.5 rounded-xl hover:shadow-md transition-all">
                    <Filter size={14} />
                  </button>
                  {dateFilterActive && (
                    <button onClick={handleClearFilter} className="bg-red-50 text-red-600 p-2.5 rounded-xl hover:bg-red-100 transition-all">
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 space-y-2.5">
                {tickets && tickets.content.length > 0 ? (
                  tickets.content.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => router.push(`/admin/tickets/${ticket.id}`)}
                      className="group bg-cream border border-brand/20 p-3.5 rounded-xl hover:shadow-md hover:border-brand/40 transition-all cursor-pointer relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                         <ArrowLeft className="rotate-180 text-brand" size={18} />
                      </div>

                      <div className="flex justify-between items-start mb-2.5">
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-black text-brand uppercase tracking-widest">Ticket #{ticket.ticketNumber}</p>
                          <h4 className="text-sm font-black text-black uppercase tracking-tight">{ticket.title}</h4>
                        </div>
                        <StatusBadge status={ticket.status} />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-brand/10 pt-2.5">
                        <div>
                          <p className="text-[9px] font-black text-black/50 uppercase">Service Type</p>
                          <p className="text-xs font-bold text-black/70">{ticket.type}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-black/50 uppercase">Priority Weight</p>
                          <div className="flex gap-0.5 mt-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={10} className={`${i < ticket.weight ? 'fill-brand text-brand' : 'text-brand/20'}`} />
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-black/50 uppercase">Scheduled Date</p>
                          <p className="text-xs font-bold text-black/70">{ticket.scheduledDate}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-black/50 uppercase">Target Time</p>
                          <p className="text-xs font-bold text-black/70">{ticket.scheduledTime}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 bg-brand/5 rounded-xl border-2 border-dashed border-brand/20">
                    <p className="text-xs font-black text-black/50 uppercase tracking-widest">No Maintenance Logs Recorded</p>
                  </div>
                )}

                {tickets && tickets.totalPages > 1 && (
                  <div className="pt-3">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={tickets.totalPages}
                      onPageChange={loadTickets}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
