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
import { formatDate } from '@/lib/utils/format';
import { 
  Plus, Search, Calendar, User as UserIcon, 
  Settings2, Filter, X, Clock, Star, 
  MapPin, ClipboardList, ChevronRight, CheckCircle2
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

  // Filters
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
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

  // --- Event Handlers ---

  const handleCancel = async (ticketId: number) => {
    if (!confirm("Are you sure you want to cancel this ticket?")) return;
    try {
      await ticketService.updateStatus(ticketId, JobStatus.CANCEL);
      loadTickets(currentPage);
    } catch (error) {
      alert("Failed to cancel ticket");
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
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Ticket Management</h2>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic mt-1">Operations & Dispatch Control</p>
          </div>
          <button onClick={handleCreate} className="flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-sm hover:bg-corporate-blue transition-all shadow-xl hover:-translate-y-1">
            <Plus size={20} /> Create New Ticket
          </button>
        </div>

        {/* Filters */}
        <Card className="p-8 border-slate-100 shadow-2xl rounded-[2.5rem] bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={16} className="text-corporate-blue" /> Schedule Date
              </label>
              <input type="date" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setCurrentPage(0); }} className="bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-bold text-slate-700 w-full focus:ring-2 focus:ring-corporate-blue" />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Search size={16} className="text-corporate-blue" /> Asset Search
              </label>
              <input type="text" value={generatorSearchTerm} onChange={(e) => { setGeneratorSearchTerm(e.target.value); setCurrentPage(0); }} placeholder="Generator name..." className="bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-bold text-slate-700 w-full focus:ring-2 focus:ring-corporate-blue shadow-inner" />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <UserIcon size={16} className="text-corporate-blue" /> Team Filter
              </label>
              <select value={employeeFilter} onChange={(e) => { setEmployeeFilter(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value)); setCurrentPage(0); }} className="bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-bold text-slate-700 w-full focus:ring-2 focus:ring-corporate-blue appearance-none">
                <option value="ALL">All Personnel</option>
                {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
              </select>
            </div>

            <div className="space-y-3">
               <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Settings2 size={16} className="text-corporate-blue" /> Quick Status
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {['ALL', 'PENDING', 'STARTED', 'COMPLETED'].map((status) => (
                  <button key={status} onClick={() => setStatusFilter(status as any)} className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${statusFilter === status ? 'bg-corporate-blue text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>{status}</button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Tickets Grid */}
        <div className="grid grid-cols-1 gap-6">
          {tickets && tickets.content.length > 0 ? (
            tickets.content.map((ticket) => (
              <div key={ticket.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-md hover:shadow-2xl transition-all group">
                <div className="flex flex-col lg:flex-row justify-between gap-8">
                  <div className="flex-1 space-y-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-corporate-blue uppercase tracking-tighter bg-corporate-blue/10 px-3 py-1 rounded-lg">#{ticket.ticketNumber}</span>
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{ticket.type}</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase leading-tight group-hover:text-corporate-blue transition-colors">{ticket.title}</h3>
                      </div>
                      <div className="scale-110"><StatusBadge status={ticket.status} /></div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-slate-50/80 p-6 rounded-[2rem] border border-slate-100">
                      <div className="flex flex-col gap-1"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><MapPin size={12} /> Asset</span><span className="text-sm font-black text-slate-800">{ticket.generator.name}</span></div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Star size={12} /> Priority</span>
                        <div className="flex gap-1">{[...Array(5)].map((_, i) => (<Star key={i} size={14} className={`${i < ticket.weight ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />))}</div>
                      </div>
                      <div className="flex flex-col gap-1"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Calendar size={12} /> Scheduled</span><span className="text-sm font-black text-slate-800">{formatDate(ticket.scheduledDate)}</span></div>
                      <div className="flex flex-col gap-1"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock size={12} /> Time</span><span className="text-sm font-black text-slate-800">{ticket.scheduledTime}</span></div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">Personnel:</span>
                      {ticketAssignments[ticket.id]?.map((employee) => (
                        <div key={employee.id} className="flex items-center gap-3 bg-white border border-slate-100 px-4 py-2 rounded-xl shadow-sm">
                           <div className="w-6 h-6 bg-corporate-blue/10 rounded-full flex items-center justify-center text-corporate-blue"><UserIcon size={12} /></div>
                           <span className="text-xs font-bold text-slate-700">{employee.fullName}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-row lg:flex-col justify-end gap-3 border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8">
                    <button onClick={() => router.push(`/admin/tickets/${ticket.id}`)} className="flex-1 lg:flex-none px-6 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs hover:bg-corporate-blue transition-all flex items-center justify-center gap-3">View Details <ChevronRight size={18} /></button>
                    {ticket.status !== 'CANCEL' && ticket.status !== 'COMPLETED' && (
                      <>
                        <button onClick={() => handleEdit(ticket)} className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs hover:bg-slate-200 transition-all">Edit</button>
                        <button onClick={() => handleCancel(ticket.id)} className="px-6 py-4 bg-red-50 text-red-600 rounded-2xl font-black uppercase text-xs hover:bg-red-100 transition-all">Cancel</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-slate-50 border-4 border-dashed border-slate-200 rounded-[3rem] py-32 text-center">
               <ClipboardList size={60} className="mx-auto text-slate-200 mb-6" />
               <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">No Dispatches Logged for this period</p>
            </div>
          )}
        </div>

        {tickets && <Pagination currentPage={currentPage} totalPages={tickets.totalPages} onPageChange={loadTickets} />}
      </div>

      {/* --- MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{editMode ? 'Modify Dispatch' : 'New Dispatch'}</h3>
              <button onClick={() => setShowModal(false)} className="p-3 hover:bg-white rounded-2xl transition-colors shadow-sm"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 overflow-y-auto space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-3">
                   <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Job Title *</label>
                   <input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-corporate-blue" />
                 </div>
                 <div className="space-y-3">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Type</label>
                    <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as JobCardType })} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-corporate-blue">
                      {Object.values(JobCardType).map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                 </div>
               </div>

               <div className="space-y-3">
                 <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Job Description</label>
                 <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-corporate-blue" rows={3} />
               </div>

               <div className="relative space-y-3">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Primary Asset (Generator) *</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder={selectedGenerator ? `Selected: ${selectedGenerator.name}` : "Search Asset Name..."}
                      value={showGeneratorDropdown ? modalGeneratorSearch : (selectedGenerator?.name || "")}
                      onFocus={() => { setShowGeneratorDropdown(true); setModalGeneratorSearch(""); }}
                      onChange={(e) => setModalGeneratorSearch(e.target.value)}
                      className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-6 py-4 text-sm font-bold focus:ring-2 focus:ring-corporate-blue"
                    />
                  </div>
                  {showGeneratorDropdown && modalGeneratorSearch.length >= 3 && (
                    <div className="absolute z-[110] w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-56 overflow-y-auto p-3">
                      {modalGenerators.map((gen) => (
                        <div key={gen.id} onClick={() => { setSelectedGenerator(gen); setFormData({ ...formData, generatorId: gen.id }); setShowGeneratorDropdown(false); }} className="p-4 hover:bg-corporate-blue/5 rounded-2xl cursor-pointer border-b border-slate-50 last:border-0">
                          <div className="font-black text-sm text-slate-900 uppercase">{gen.name}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{gen.locationName}</div>
                        </div>
                      ))}
                    </div>
                  )}
               </div>

               <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-3"><label className="text-xs font-black text-slate-500 uppercase tracking-widest">Priority</label><input type="number" min="1" max="5" required value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold" /></div>
                  <div className="space-y-3"><label className="text-xs font-black text-slate-500 uppercase tracking-widest">Date</label><input type="date" required value={formData.scheduledDate} onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold" /></div>
                  <div className="space-y-3"><label className="text-xs font-black text-slate-500 uppercase tracking-widest">Time</label><input type="time" required value={formData.scheduledTime.substring(0, 5)} onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value + ':00' })} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold" /></div>
               </div>

               <div className="space-y-4">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex justify-between">
                    <span>Personnel Assignment (Max 5)</span>
                    <span className={`px-2 py-0.5 rounded ${formData.employeeIds.length === 0 ? 'bg-red-50 text-red-500' : 'bg-corporate-blue/10 text-corporate-blue'}`}>{formData.employeeIds.length}/5 Selected</span>
                  </label>
                  <input type="text" value={modalEmployeeSearch} onChange={(e) => setModalEmployeeSearch(e.target.value)} placeholder="Type name to find team members..." className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-corporate-blue" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2 bg-slate-50 rounded-[2rem] border border-slate-100">
                    {(modalEmployeeSearch.length >= 3 ? modalEmployees : (editMode ? modalEmployees : [])).map((emp) => (
                      <div 
                        key={emp.id} 
                        onClick={() => toggleEmployee(emp.id)}
                        className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border-2 ${formData.employeeIds.includes(emp.id) ? 'bg-white border-corporate-blue shadow-lg' : 'bg-white/50 border-transparent hover:bg-white'}`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.employeeIds.includes(emp.id) ? 'bg-corporate-blue text-white' : 'bg-slate-200 text-slate-400'}`}>
                          {formData.employeeIds.includes(emp.id) ? <CheckCircle2 size={20} /> : <UserIcon size={18} />}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black uppercase text-slate-900">{emp.fullName}</span>
                          <span className="text-[10px] font-bold text-slate-400">{emp.username}</span>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>

               <div className="flex gap-6 pt-6">
                 <button type="button" onClick={() => setShowModal(false)} className="flex-1 p-5 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-sm hover:bg-slate-200 transition-colors">Dismiss</button>
                 <button type="submit" className="flex-1 p-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-sm hover:bg-corporate-blue shadow-xl transition-all hover:-translate-y-1">
                   {editMode ? 'Update Dispatch' : 'Confirm Dispatch'}
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}