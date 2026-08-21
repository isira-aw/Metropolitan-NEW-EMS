'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ticketService, generatorService, userService } from '@/lib/services/admin.service';
import { MainTicket, MainTicketRequest, PageResponse, Generator, User, JobCardType, JobStatus, TicketAssignment } from '@/types';
import AdminLayout from '@/components/layouts/AdminLayout';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import Pagination from '@/components/ui/Pagination';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Avatar from '@/components/ui/Avatar';
import { formatDate } from '@/lib/utils/format';
import {
  Plus, Search, Calendar, User as UserIcon,
  Settings2, Filter, X, Clock, Star,
  MapPin, ClipboardList, ChevronRight, CheckCircle2, Trash2
} from 'lucide-react';

export default function AdminTickets() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<PageResponse<MainTicket> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'ALL'>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingTicketId, setEditingTicketId] = useState<number | null>(null);
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Filters
  const getTodayDate = () => {
    // Get current date in Sri Lanka timezone (Asia/Colombo, UTC+5:30)
    const sriLankaDate = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Colombo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    // Convert from MM/DD/YYYY to YYYY-MM-DD
    const [month, day, year] = sriLankaDate.split('/');
    return `${year}-${month}-${day}`;
  };
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [employees, setEmployees] = useState<User[]>([]);
  const [generatorSearchTerm, setGeneratorSearchTerm] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState<number | 'ALL'>('ALL');
  const [ticketAssignments, setTicketAssignments] = useState<Record<number, User[]>>({});

  // Modal Specific State
  const [modalGeneratorSearch, setModalGeneratorSearch] = useState('');
  const [modalEmployeeSearch, setModalEmployeeSearch] = useState('');
  const [modalGenerators, setModalGenerators] = useState<Generator[]>([]);
  const [modalEmployees, setModalEmployees] = useState<User[]>([]);
  const [selectedGenerator, setSelectedGenerator] = useState<Generator | null>(null);
  const [showGeneratorDropdown, setShowGeneratorDropdown] = useState(false);

  const [formData, setFormData] = useState<MainTicketRequest>({
    generatorId: 0,
    title: '',
    description: '',
    type: JobCardType.SERVICE,
    weight: 3,
    scheduledDate: '',
    scheduledTime: '09:00:00',
    employeeIds: [],
  });

  // --- Data Loading Logic ---

  useEffect(() => {
    loadTickets(0);
    loadEmployees();
  }, [statusFilter, selectedDate, generatorSearchTerm, employeeFilter]);

  const loadTickets = async (page: number) => {
    try {
      setLoading(true);
      let data: PageResponse<MainTicket>;
      const allTickets = await ticketService.getByDateRange(selectedDate, selectedDate, { page, size: 10 });

      if (statusFilter !== 'ALL') {
        const filteredContent = allTickets.content.filter(ticket => ticket.status === statusFilter);
        data = { ...allTickets, content: filteredContent, totalElements: filteredContent.length, totalPages: Math.ceil(filteredContent.length / 10) };
      } else {
        data = allTickets;
      }

      if (generatorSearchTerm.trim() !== '') {
        const searchLower = generatorSearchTerm.toLowerCase();
        data.content = data.content.filter(ticket => ticket.generator.name.toLowerCase().includes(searchLower));
        data.totalElements = data.content.length;
        data.totalPages = Math.ceil(data.content.length / 10);
      }

      const assignments: Record<number, User[]> = {};
      const filteredTickets: MainTicket[] = [];

      for (const ticket of data.content) {
        try {
          const ticketAssignments = await ticketService.getAssignments(ticket.id);
          const assignedEmployees = ticketAssignments.map((a: TicketAssignment) => a.employee);
          assignments[ticket.id] = assignedEmployees;
          if (employeeFilter !== 'ALL') {
            if (assignedEmployees.some(emp => emp.id === employeeFilter)) filteredTickets.push(ticket);
          } else {
            filteredTickets.push(ticket);
          }
        } catch (error) {
          assignments[ticket.id] = [];
          if (employeeFilter === 'ALL') filteredTickets.push(ticket);
        }
      }

      setTicketAssignments(assignments);
      if (employeeFilter !== 'ALL') {
        data.content = filteredTickets;
        data.totalElements = filteredTickets.length;
        data.totalPages = Math.ceil(filteredTickets.length / 10);
      }

      setTickets(data);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await userService.getEmployees({ page: 0, size: 100, activeOnly: true });
      setEmployees(data.content);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  // --- Modal Search Logic ---

  useEffect(() => {
    if (modalGeneratorSearch.length >= 3) {
      const delay = setTimeout(async () => {
        try {
          const data = await generatorService.searchByName(modalGeneratorSearch, { page: 0, size: 10 });
          setModalGenerators(data.content);
        } catch (err) { console.error(err); }
      }, 300);
      return () => clearTimeout(delay);
    } else {
      setModalGenerators([]);
    }
  }, [modalGeneratorSearch]);

  useEffect(() => {
    if (modalEmployeeSearch.length >= 3) {
      const delay = setTimeout(async () => {
        try {
          const data = await userService.search(modalEmployeeSearch, { page: 0, size: 10 });
          const employeesOnly = data.content.filter(u => u.role === 'EMPLOYEE' && u.active);
          setModalEmployees(employeesOnly);
        } catch (err) { console.error(err); }
      }, 300);
      return () => clearTimeout(delay);
    }
  }, [modalEmployeeSearch]);

  // Job Title is derived, not typed: Primary Asset must be picked first, then
  // Type, and only then does "(Type)-Asset" become available to generate.
  useEffect(() => {
    if (selectedGenerator && formData.type) {
      const generatedTitle = `(${formData.type})-${selectedGenerator.name}`;
      setFormData(prev => prev.title === generatedTitle ? prev : { ...prev, title: generatedTitle });
    }
  }, [selectedGenerator, formData.type]);

  // --- Event Handlers ---

  const handleTodayFilter = () => {
    setSelectedDate(getTodayDate());
    setCurrentPage(0);
  };

  const confirmCancel = async () => {
    if (cancelingId == null) return;
    try {
      await ticketService.cancel(cancelingId);
      loadTickets(currentPage);
    } catch (error) {
      alert("Failed to cancel ticket");
    } finally {
      setCancelingId(null);
    }
  };

  const confirmDelete = async () => {
    if (deletingId == null) return;
    try {
      await ticketService.delete(deletingId);
      loadTickets(currentPage);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to delete ticket");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setEditMode(false);
    setEditingTicketId(null);
    setFormData({
      generatorId: 0, title: '', description: '', type: JobCardType.SERVICE,
      weight: 3, scheduledDate: tomorrow.toISOString().split('T')[0],
      scheduledTime: '09:00:00', employeeIds: [],
    });
    setSelectedGenerator(null);
    setModalGeneratorSearch('');
    setModalEmployeeSearch('');
    setModalEmployees([]);
    setShowModal(true);
  };

  const handleEdit = async (ticket: MainTicket) => {
    try {
      const assignments = await ticketService.getAssignments(ticket.id);
      const employeeIds = assignments.map((a: TicketAssignment) => a.employee.id);
      setEditMode(true);
      setEditingTicketId(ticket.id);
      setFormData({
        generatorId: ticket.generator.id, title: ticket.title, description: ticket.description || '',
        type: ticket.type, weight: ticket.weight, scheduledDate: ticket.scheduledDate,
        scheduledTime: ticket.scheduledTime, employeeIds: employeeIds,
      });
      setSelectedGenerator(ticket.generator);
      setModalEmployees(assignments.map(a => a.employee));
      setShowModal(true);
    } catch (error) { alert('Failed to load ticket details'); }
  };

  const toggleEmployee = (empId: number) => {
    setFormData(prev => {
      const isSelected = prev.employeeIds.includes(empId);
      if (!isSelected && prev.employeeIds.length >= 5) {
        alert("Maximum 5 employees allowed");
        return prev;
      }
      return {
        ...prev,
        employeeIds: isSelected
          ? prev.employeeIds.filter(id => id !== empId)
          : [...prev.employeeIds, empId]
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.generatorId === 0) return alert("Please select a generator");
    if (formData.employeeIds.length === 0) return alert("Assign at least 1 employee");

    try {
      if (editMode && editingTicketId) {
        await ticketService.update(editingTicketId, formData);
      } else {
        await ticketService.create(formData);
      }
      setShowModal(false);
      loadTickets(currentPage);
    } catch (error: any) { alert(error.response?.data?.message || 'Save failed'); }
  };

  if (loading && !tickets) return <LoadingSpinner />;

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto space-y-4 pb-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-black tracking-tighter uppercase">Ticket Management</h2>
            <p className="text-xs font-black text-black/50 uppercase tracking-widest italic mt-0.5">Operations & Dispatch Control</p>
          </div>
          <button onClick={handleCreate} className="flex items-center justify-center gap-2 bg-brand text-cream px-5 py-2.5 rounded-xl font-black uppercase text-sm hover:shadow-lg transition-all">
            <Plus size={20} /> Create New Ticket
          </button>
        </div>

        {/* Filters */}
        <Card className="p-4 border-brand/20 shadow-sm rounded-xl bg-cream">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-black/60 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={16} className="text-brand" /> Schedule Date
              </label>
              <div className="flex gap-2">
                <input type="date" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setCurrentPage(0); }} className="flex-1 bg-brand/5 border-none rounded-xl py-2.5 px-3 text-sm font-bold text-black focus:ring-2 focus:ring-brand/30" />
                <button
                  onClick={handleTodayFilter}
                  className="bg-brand text-cream px-4 py-2.5 rounded-xl text-xs font-black uppercase hover:shadow-md transition-all whitespace-nowrap"
                >
                  Today
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-black/60 uppercase tracking-widest flex items-center gap-2">
                <Search size={16} className="text-brand" /> Asset Search
              </label>
              <input type="text" value={generatorSearchTerm} onChange={(e) => { setGeneratorSearchTerm(e.target.value); setCurrentPage(0); }} placeholder="Generator name..." className="bg-brand/5 border-none rounded-xl py-2.5 px-3 text-sm font-bold text-black w-full focus:ring-2 focus:ring-brand/30" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-black/60 uppercase tracking-widest flex items-center gap-2">
                <UserIcon size={16} className="text-brand" /> Team Filter
              </label>
              <select value={employeeFilter} onChange={(e) => { setEmployeeFilter(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value)); setCurrentPage(0); }} className="bg-brand/5 border-none rounded-xl py-2.5 px-3 text-sm font-bold text-black w-full focus:ring-2 focus:ring-brand/30 appearance-none">
                <option value="ALL">All Personnel</option>
                {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
               <label className="text-xs font-black text-black/60 uppercase tracking-widest flex items-center gap-2">
                <Settings2 size={16} className="text-brand" /> Quick Status
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {(['ALL', JobStatus.PENDING, JobStatus.STARTED, JobStatus.COMPLETED] as const).map((status) => (
                  <button key={status} onClick={() => setStatusFilter(status)} className={`px-3 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${statusFilter === status ? 'bg-brand text-cream shadow-sm' : 'bg-brand/5 text-black/50 hover:bg-brand/10'}`}>{status}</button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Tickets Grid */}
        <div className="grid grid-cols-1 gap-3">
          {tickets && tickets.content.length > 0 ? (
            tickets.content.map((ticket) => (
              <div key={ticket.id} className="bg-cream border border-brand/20 rounded-xl p-4 shadow-sm hover:shadow-md transition-all group">
                <div className="flex flex-col lg:flex-row justify-between gap-3">
                  <div className="flex-1 space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-brand uppercase tracking-tighter bg-brand/10 px-2.5 py-1 rounded-lg">#{ticket.ticketNumber}</span>
                          <span className="text-[10px] font-black text-black/50 uppercase tracking-widest">{ticket.type}</span>
                        </div>
                        <h3 className="text-lg font-black text-black uppercase leading-tight group-hover:text-brand transition-colors">{ticket.title}</h3>
                      </div>
                      <StatusBadge status={ticket.status} />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-brand/5 p-3 rounded-xl border border-brand/10">
                      <div className="flex flex-col gap-1"><span className="text-[10px] font-black text-black/50 uppercase tracking-widest flex items-center gap-1.5"><MapPin size={11} /> Asset</span><span className="text-xs font-black text-black">{ticket.generator.name}</span></div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-black/50 uppercase tracking-widest flex items-center gap-1.5"><Star size={11} /> Priority</span>
                        <div className="flex gap-0.5">{[...Array(5)].map((_, i) => (<Star key={i} size={12} className={`${i < ticket.weight ? 'fill-brand text-brand' : 'text-brand/20'}`} />))}</div>
                      </div>
                      <div className="flex flex-col gap-1"><span className="text-[10px] font-black text-black/50 uppercase tracking-widest flex items-center gap-1.5"><Calendar size={11} /> Scheduled</span><span className="text-xs font-black text-black">{formatDate(ticket.scheduledDate)}</span></div>
                      <div className="flex flex-col gap-1"><span className="text-[10px] font-black text-black/50 uppercase tracking-widest flex items-center gap-1.5"><Clock size={11} /> Time</span><span className="text-xs font-black text-black">{ticket.scheduledTime}</span></div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black text-black/50 uppercase tracking-widest mr-1">Personnel:</span>
                      {ticketAssignments[ticket.id]?.map((employee) => (
                        <div key={employee.id} className="flex items-center gap-2 bg-cream border border-brand/20 px-2.5 py-1 rounded-lg shadow-sm">
                           <div className="w-5 h-5 bg-brand/10 rounded-full flex items-center justify-center text-brand"><UserIcon size={11} /></div>
                           <span className="text-[11px] font-bold text-black/70">{employee.fullName}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-row lg:flex-col justify-end gap-2 border-t lg:border-t-0 lg:border-l border-brand/10 pt-3 lg:pt-0 lg:pl-4">
                    <button onClick={() => router.push(`/admin/tickets/${ticket.id}`)} className="flex-1 lg:flex-none px-4 py-2 bg-brand text-cream rounded-xl font-black uppercase text-[10px] hover:shadow-md transition-all flex items-center justify-center gap-2">View Details <ChevronRight size={14} /></button>
                    {ticket.status !== 'CANCEL' && ticket.status !== 'COMPLETED' && (
                      <>
                        <button onClick={() => handleEdit(ticket)} className="px-4 py-2 bg-cream border border-brand/30 text-black rounded-xl font-black uppercase text-[10px] hover:bg-brand/10 transition-all">Edit</button>
                        <button onClick={() => setCancelingId(ticket.id)} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-black uppercase text-[10px] hover:bg-red-100 transition-all">Cancel</button>
                      </>
                    )}
                    <button
                      onClick={() => setDeletingId(ticket.id)}
                      aria-label={`Permanently delete ticket ${ticket.ticketNumber}`}
                      className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl font-black uppercase text-[10px] hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-1.5"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-brand/5 border-2 border-dashed border-brand/20 rounded-2xl py-20 text-center">
               <ClipboardList size={48} className="mx-auto text-brand/30 mb-4" />
               <p className="text-sm font-black text-black/50 uppercase tracking-[0.3em]">No Dispatches Logged for this period</p>
            </div>
          )}
        </div>

        {tickets && <Pagination currentPage={currentPage} totalPages={tickets.totalPages} onPageChange={loadTickets} />}
      </div>

      {/* --- MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-cream rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-brand/20">
            <div className="p-5 border-b border-brand/10 flex justify-between items-center bg-brand/5">
              <h3 className="text-xl font-black text-black uppercase tracking-tighter">{editMode ? 'Modify Dispatch' : 'New Dispatch'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-cream rounded-xl transition-colors border border-brand/20"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch flex-1 min-h-0">
                {/* LEFT COLUMN - other dispatch details */}
                <div className="space-y-5">
                  <div className="relative space-y-2">
                    <label className="text-xs font-black text-black/60 uppercase tracking-widest">1. Primary Asset (Generator) *</label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" size={18} />
                      <input
                        type="text"
                        placeholder={selectedGenerator ? `Selected: ${selectedGenerator.name}` : "Search Asset Name..."}
                        value={showGeneratorDropdown ? modalGeneratorSearch : (selectedGenerator?.name || "")}
                        onFocus={() => { setShowGeneratorDropdown(true); setModalGeneratorSearch(""); }}
                        onChange={(e) => setModalGeneratorSearch(e.target.value)}
                        className="w-full bg-brand/5 border-none rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-black focus:ring-2 focus:ring-brand/30"
                      />
                    </div>
                    {showGeneratorDropdown && modalGeneratorSearch.length >= 3 && (
                      <div className="absolute z-[110] w-full mt-2 bg-cream border border-brand/20 rounded-xl shadow-xl max-h-56 overflow-y-auto p-2">
                        {modalGenerators.map((gen) => (
                          <button
                            type="button"
                            key={gen.id}
                            onClick={() => { setSelectedGenerator(gen); setFormData({ ...formData, generatorId: gen.id }); setShowGeneratorDropdown(false); }}
                            className="w-full text-left p-3 hover:bg-brand/10 rounded-xl border-b border-brand/10 last:border-0"
                          >
                            <div className="font-black text-sm text-black uppercase">{gen.name}</div>
                            <div className="text-[10px] font-bold text-black/50 uppercase tracking-wider">{gen.locationName}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-black/60 uppercase tracking-widest">
                      2. Type {!selectedGenerator && <span className="normal-case font-bold text-black/40">(select asset first)</span>}
                    </label>
                    <select
                      required
                      disabled={!selectedGenerator}
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as JobCardType })}
                      className="w-full bg-brand/5 border-none rounded-xl p-3 text-sm font-bold text-black focus:ring-2 focus:ring-brand/30 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {Object.values(JobCardType).map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-black/60 uppercase tracking-widest">Job Title (Auto-Generated)</label>
                    <input
                      readOnly
                      disabled
                      value={formData.title}
                      placeholder="Select asset & type above to generate"
                      className="w-full bg-brand/10 border-none rounded-xl p-3 text-sm font-bold text-black/70 cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-black/60 uppercase tracking-widest">Job Description</label>
                    <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-brand/5 border-none rounded-xl p-3 text-sm font-bold text-black focus:ring-2 focus:ring-brand/30" rows={3} />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2"><label className="text-xs font-black text-black/60 uppercase tracking-widest">Priority</label><input type="number" min="1" max="5" required value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })} className="w-full bg-brand/5 border-none rounded-xl p-3 text-sm font-bold text-black" /></div>
                    <div className="space-y-2"><label className="text-xs font-black text-black/60 uppercase tracking-widest">Date</label><input type="date" required value={formData.scheduledDate} onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })} className="w-full bg-brand/5 border-none rounded-xl p-3 text-sm font-bold text-black" /></div>
                    <div className="space-y-2"><label className="text-xs font-black text-black/60 uppercase tracking-widest">Time</label><input type="time" required value={formData.scheduledTime.substring(0, 5)} onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value + ':00' })} className="w-full bg-brand/5 border-none rounded-xl p-3 text-sm font-bold text-black" /></div>
                  </div>
                </div>

                {/* RIGHT COLUMN - Personnel Assignment */}
                <div className="flex flex-col bg-brand/5 rounded-xl border border-brand/10 p-4 space-y-3">
                  <label className="text-xs font-black text-black/60 uppercase tracking-widest flex justify-between items-center">
                    <span>Personnel Assignment (Max 5)</span>
                    <span className={`px-2 py-0.5 rounded ${formData.employeeIds.length === 0 ? 'bg-red-50 text-red-500' : 'bg-brand/10 text-brand'}`}>{formData.employeeIds.length}/5 Selected</span>
                  </label>
                  <input type="text" value={modalEmployeeSearch} onChange={(e) => setModalEmployeeSearch(e.target.value)} placeholder="Type name to find team members..." className="w-full bg-cream border-none rounded-xl p-3 text-sm font-bold text-black focus:ring-2 focus:ring-brand/30" />

                  {/* Selected employees stay pinned here regardless of what's
                      currently typed in the search box above - otherwise
                      picking someone via one search then typing a new search
                      term made them disappear from view even though they
                      were still selected (the count just kept climbing). */}
                  {formData.employeeIds.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.employeeIds.map((empId) => {
                        const emp = employees.find(e => e.id === empId) || modalEmployees.find(e => e.id === empId);
                        return (
                          <span key={empId} className="flex items-center gap-1.5 bg-cream border-2 border-brand rounded-full pl-1 pr-2 py-1">
                            <Avatar userId={empId} hasProfilePicture={emp?.hasProfilePicture} fullName={emp?.fullName} size={20} className="!rounded-full" />
                            <span className="text-[10px] font-black uppercase text-black truncate max-w-[7rem]">{emp?.fullName || `#${empId}`}</span>
                            <button type="button" onClick={() => toggleEmployee(empId)} aria-label="Remove" className="text-black/40 hover:text-black">
                              <X size={12} />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex-1 min-h-[18rem] md:min-h-0 space-y-2.5 overflow-y-auto p-1">
                    {(modalEmployeeSearch.length >= 3 ? modalEmployees : (editMode ? modalEmployees : [])).map((emp) => (
                      <button
                        type="button"
                        key={emp.id}
                        onClick={() => toggleEmployee(emp.id)}
                        aria-pressed={formData.employeeIds.includes(emp.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border-2 text-left ${formData.employeeIds.includes(emp.id) ? 'bg-cream border-brand shadow-sm' : 'bg-cream/50 border-transparent hover:bg-cream'}`}
                      >
                        <div className="relative flex-shrink-0">
                          <Avatar
                            userId={emp.id}
                            hasProfilePicture={emp.hasProfilePicture}
                            fullName={emp.fullName}
                            size={36}
                            className="!rounded-full"
                          />
                          {formData.employeeIds.includes(emp.id) && (
                            <span className="absolute -bottom-1 -right-1 bg-brand text-cream rounded-full p-0.5 border-2 border-cream">
                              <CheckCircle2 size={12} />
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-black uppercase text-black truncate">{emp.fullName}</span>
                          <span className="text-[10px] font-bold text-black/50 truncate">{emp.username}</span>
                        </div>
                      </button>
                    ))}
                    {(modalEmployeeSearch.length >= 3 ? modalEmployees : (editMode ? modalEmployees : [])).length === 0 && (
                      <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest text-center py-6">Type at least 3 letters to find team members</p>
                    )}
                  </div>
                </div>
              </div>

               <div className="flex gap-4 pt-6">
                 <button type="button" onClick={() => setShowModal(false)} className="flex-1 p-3.5 bg-cream border border-brand/30 text-black rounded-xl font-black uppercase text-sm hover:bg-brand/10 transition-colors">Dismiss</button>
                 <button type="submit" className="flex-1 p-3.5 bg-brand text-cream rounded-xl font-black uppercase text-sm hover:shadow-lg transition-all">
                   {editMode ? 'Update Dispatch' : 'Confirm Dispatch'}
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={cancelingId !== null}
        title="Cancel Ticket"
        message="Are you sure you want to cancel this ticket?"
        confirmLabel="Cancel Ticket"
        onConfirm={confirmCancel}
        onCancel={() => setCancelingId(null)}
      />

      <ConfirmDialog
        open={deletingId !== null}
        title="Delete Ticket Permanently"
        message="This will permanently delete this ticket and all of its job cards, logs, and history. This action cannot be undone."
        confirmLabel="Delete Permanently"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </AdminLayout>
  );
}
