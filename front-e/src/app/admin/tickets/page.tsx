'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ticketService, generatorService, userService } from '@/lib/services/admin.service';
import { authService } from '@/lib/services/auth.service';
import { MainTicket, MainTicketRequest, PageResponse, Generator, User, JobCardType, JobStatus, TicketAssignment } from '@/types';
import AdminNav from '@/components/layouts/AdminNav';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import Pagination from '@/components/ui/Pagination';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/lib/utils/format';

export default function AdminTickets() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<PageResponse<MainTicket> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'ALL'>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingTicketId, setEditingTicketId] = useState<number | null>(null);

  // Date filter state - always set to current date
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [generators, setGenerators] = useState<Generator[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);

  // New filters for Generator (search by name) and Employee
  const [generatorSearchTerm, setGeneratorSearchTerm] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState<number | 'ALL'>('ALL');

  // Store ticket assignments (employee names for each ticket)
  const [ticketAssignments, setTicketAssignments] = useState<Record<number, User[]>>({});

  // Modal search states
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
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const role = authService.getRole();
    if (role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    setUser(authService.getStoredUser());
    loadTickets(0);
    loadGenerators();
    loadEmployees();
  }, [router, statusFilter, selectedDate, generatorSearchTerm, employeeFilter]);

  const loadTickets = async (page: number) => {
    try {
      let data: PageResponse<MainTicket>;

      // Always get tickets by date (current date)
      const allTickets = await ticketService.getByDateRange(selectedDate, selectedDate, { page, size: 10 });

      // Apply status filter if not 'ALL'
      if (statusFilter !== 'ALL') {
        const filteredContent = allTickets.content.filter(ticket => ticket.status === statusFilter);
        data = {
          ...allTickets,
          content: filteredContent,
          totalElements: filteredContent.length,
          totalPages: Math.ceil(filteredContent.length / 10),
        };
      } else {
        data = allTickets;
      }

      // Apply generator filter (search by name)
      if (generatorSearchTerm.trim() !== '') {
        const searchLower = generatorSearchTerm.toLowerCase();
        data.content = data.content.filter(ticket =>
          ticket.generator.name.toLowerCase().includes(searchLower)
        );
        data.totalElements = data.content.length;
        data.totalPages = Math.ceil(data.content.length / 10);
      }

      // Load employee assignments for each ticket and apply employee filter
      const assignments: Record<number, User[]> = {};
      const filteredTickets: MainTicket[] = [];

      for (const ticket of data.content) {
        try {
          const ticketAssignments = await ticketService.getAssignments(ticket.id);
          const assignedEmployees = ticketAssignments.map((a: TicketAssignment) => a.employee);
          assignments[ticket.id] = assignedEmployees;

          // Apply employee filter
          if (employeeFilter !== 'ALL') {
            if (assignedEmployees.some(emp => emp.id === employeeFilter)) {
              filteredTickets.push(ticket);
            }
          } else {
            filteredTickets.push(ticket);
          }
        } catch (error) {
          console.error(`Error loading assignments for ticket ${ticket.id}:`, error);
          assignments[ticket.id] = [];
          if (employeeFilter === 'ALL') {
            filteredTickets.push(ticket);
          }
        }
      }

      setTicketAssignments(assignments);

      // Update data with filtered tickets if employee filter is active
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

  const handleTodayFilter = () => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    setCurrentPage(0);
  };

  const loadGenerators = async () => {
    try {
      const data = await generatorService.getAll({ page: 0, size: 100 });
      setGenerators(data.content);
    } catch (error) {
      console.error('Error loading generators:', error);
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

  // Search generators for modal (triggered after 3 characters)
  const searchModalGenerators = async (searchTerm: string) => {
    if (searchTerm.length < 3) {
      setModalGenerators([]);
      return;
    }
    try {
      const data = await generatorService.searchByName(searchTerm, { page: 0, size: 20 });
      setModalGenerators(data.content);
    } catch (error) {
      console.error('Error searching generators:', error);
      setModalGenerators([]);
    }
  };

  // Search employees for modal (triggered after 3 characters)
  const searchModalEmployees = async (searchTerm: string) => {
    if (searchTerm.length < 3) {
      setModalEmployees([]);
      return;
    }
    try {
      const data = await userService.search(searchTerm, { page: 0, size: 20 });
      // Filter only employees
      const employeesOnly = data.content.filter(user => user.role === 'EMPLOYEE' && user.active);
      setModalEmployees(employeesOnly);
    } catch (error) {
      console.error('Error searching employees:', error);
      setModalEmployees([]);
    }
  };

  // Effect to trigger generator search
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      searchModalGenerators(modalGeneratorSearch);
    }, 300);
    return () => clearTimeout(delaySearch);
  }, [modalGeneratorSearch]);

  // Effect to trigger employee search
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      searchModalEmployees(modalEmployeeSearch);
    }, 300);
    return () => clearTimeout(delaySearch);
  }, [modalEmployeeSearch]);

  const handleCreate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setEditMode(false);
    setEditingTicketId(null);
    setFormData({
      generatorId: 0,
      title: '',
      description: '',
      type: JobCardType.SERVICE,
      weight: 3,
      scheduledDate: tomorrow.toISOString().split('T')[0],
      scheduledTime: '09:00:00',
      employeeIds: [],
    });
    setSelectedGenerator(null);
    setModalGeneratorSearch('');
    setModalEmployeeSearch('');
    setModalGenerators([]);
    setModalEmployees([]);
    setShowGeneratorDropdown(false);
    setShowModal(true);
  };

  const handleEdit = async (ticket: MainTicket) => {
    try {
      // Load current assignments
      const assignments = await ticketService.getAssignments(ticket.id);
      const employeeIds = assignments.map((a: TicketAssignment) => a.employee.id);

      setEditMode(true);
      setEditingTicketId(ticket.id);
      setFormData({
        generatorId: ticket.generator.id,
        title: ticket.title,
        description: ticket.description || '',
        type: ticket.type,
        weight: ticket.weight,
        scheduledDate: ticket.scheduledDate,
        scheduledTime: ticket.scheduledTime,
        employeeIds: employeeIds,
      });
      setSelectedGenerator(ticket.generator);
      setModalGeneratorSearch('');
      setModalEmployeeSearch('');
      setModalGenerators([]);
      setModalEmployees([]);
      setShowGeneratorDropdown(false);
      setShowModal(true);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error loading ticket details');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGenerator && formData.generatorId === 0) {
      alert('Please select a generator!');
      return;
    }
    if (formData.employeeIds.length === 0) {
      alert('Please assign at least one employee!');
      return;
    }
    if (formData.employeeIds.length > 5) {
      alert('Maximum 5 employees can be assigned!');
      return;
    }
    try {
      if (editMode && editingTicketId) {
        await ticketService.update(editingTicketId, formData);
        alert('Ticket updated successfully!');
      } else {
        await ticketService.create(formData);
        alert('Ticket created successfully!');
      }
      setShowModal(false);
      setEditMode(false);
      setEditingTicketId(null);
      loadTickets(currentPage);
    } catch (error: any) {
      alert(error.response?.data?.message || `Error ${editMode ? 'updating' : 'creating'} ticket`);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this ticket?')) return;
    try {
      await ticketService.cancel(id);
      alert('Ticket cancelled!');
      loadTickets(currentPage);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error cancelling ticket');
    }
  };

  const toggleEmployee = (empId: number) => {
    setFormData((prev) => ({
      ...prev,
      employeeIds: prev.employeeIds.includes(empId)
        ? prev.employeeIds.filter((id) => id !== empId)
        : [...prev.employeeIds, empId],
    }));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNav currentPage="Tickets" user={user} />

      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Ticket Management</h2>
          <button onClick={handleCreate} className="btn-primary">+ Create Ticket</button>
        </div>

        {/* Filter Controls */}
        <Card className="mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold mb-1">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setCurrentPage(0);
                }}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Search Generator by Name</label>
              <input
                type="text"
                value={generatorSearchTerm}
                onChange={(e) => {
                  setGeneratorSearchTerm(e.target.value);
                  setCurrentPage(0);
                }}
                placeholder="Enter generator name..."
                className="input p-1"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Employee</label>
              <select
                value={employeeFilter}
                onChange={(e) => {
                  setEmployeeFilter(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value));
                  setCurrentPage(0);
                }}
                className="input"
              >
                <option value="ALL">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleTodayFilter}
                className="btn-primary"
              >
                📅 Today
              </button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <span className="text-blue-600">📌 Date: {selectedDate}</span>
            {generatorSearchTerm.trim() !== '' && (
              <span className="text-blue-600">
                🔧 Generator Search: "{generatorSearchTerm}"
              </span>
            )}
            {employeeFilter !== 'ALL' && (
              <span className="text-blue-600">
                👤 Employee: {employees.find(e => e.id === employeeFilter)?.fullName}
              </span>
            )}
          </div>
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

        {/* Tickets List */}
        <div className="space-y-4">
          {tickets && tickets.content.length > 0 ? (
            tickets.content.map((ticket) => (
              <Card key={ticket.id}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-bold">{ticket.title}</h3>
                    <p className="text-sm text-gray-600">Ticket: {ticket.ticketNumber}</p>
                  </div>
                  <StatusBadge status={ticket.status} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-600">Type</p>
                    <p className="font-semibold">{ticket.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Weight</p>
                    <p className="font-semibold">{'⭐'.repeat(ticket.weight)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Generator</p>
                    <p className="font-semibold">{ticket.generator.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Scheduled</p>
                    <p className="font-semibold">{formatDate(ticket.scheduledDate)} at {ticket.scheduledTime}</p>
                  </div>
                </div>

                {/* Employee Names */}
                {ticketAssignments[ticket.id] && ticketAssignments[ticket.id].length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-600 mb-1">Assigned Employees</p>
                    <div className="flex flex-wrap gap-2">
                      {ticketAssignments[ticket.id].map((employee) => (
                        <span key={employee.id} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {employee.fullName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {ticket.description && <p className="text-sm text-gray-600 mb-3">{ticket.description}</p>}

                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => router.push(`/admin/tickets/${ticket.id}`)} className="btn-primary text-sm">
                    View Details
                  </button>
                  {ticket.status !== 'CANCEL' && ticket.status !== 'COMPLETED' && (
                    <>
                      <button onClick={() => handleEdit(ticket)} className="btn-secondary text-sm">
                        Edit
                      </button>
                      <button onClick={() => handleCancel(ticket.id)} className="btn-danger text-sm">
                        Cancel Ticket
                      </button>
                    </>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <p className="text-center text-gray-500 py-8">
                No tickets found for {selectedDate}
              </p>
            </Card>
          )}
        </div>

        {tickets && <Pagination currentPage={currentPage} totalPages={tickets.totalPages} onPageChange={loadTickets} />}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl my-8">
            <h3 className="text-xl font-bold mb-4">{editMode ? 'Edit Ticket' : 'Create Ticket'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="input-field" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field" rows={3} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-sm font-medium mb-1">Generator *</label>
                    <input
                      type="text"
                      required={!selectedGenerator}
                      value={selectedGenerator ? `${selectedGenerator.name} - ${selectedGenerator.locationName}` : modalGeneratorSearch}
                      onChange={(e) => {
                        if (selectedGenerator) {
                          setSelectedGenerator(null);
                          setFormData({ ...formData, generatorId: 0 });
                        }
                        setModalGeneratorSearch(e.target.value);
                        setShowGeneratorDropdown(true);
                      }}
                      onFocus={() => setShowGeneratorDropdown(true)}
                      placeholder="Search Generator by Name"
                      className="input-field"
                    />
                    {showGeneratorDropdown && modalGeneratorSearch.length >= 3 && modalGenerators.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-48 overflow-y-auto">
                        {modalGenerators.map((gen) => (
                          <div
                            key={gen.id}
                            onClick={() => {
                              setSelectedGenerator(gen);
                              setFormData({ ...formData, generatorId: gen.id });
                              setModalGeneratorSearch('');
                              setShowGeneratorDropdown(false);
                            }}
                            className="p-2 hover:bg-blue-50 cursor-pointer"
                          >
                            <div className="font-medium">{gen.name}</div>
                            <div className="text-sm text-gray-600">{gen.locationName}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {modalGeneratorSearch.length > 0 && modalGeneratorSearch.length < 3 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Type {3 - modalGeneratorSearch.length} more character{3 - modalGeneratorSearch.length === 1 ? '' : 's'} to search
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Type *</label>
                    <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as JobCardType })} className="input-field">
                      {Object.values(JobCardType).map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Weight (1-5) *</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      required
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Scheduled Date *</label>
                    <input type="date" required value={formData.scheduledDate} onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })} className="input-field" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Scheduled Time *</label>
                    <input type="time" required value={formData.scheduledTime.substring(0, 5)} onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value + ':00' })} className="input-field" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Assign Employees * (Select 1-5 employees)
                  </label>
                  <input
                    type="text"
                    value={modalEmployeeSearch}
                    onChange={(e) => setModalEmployeeSearch(e.target.value)}
                    placeholder="Type at least 3 characters to search employees..."
                    className="input-field mb-2"
                  />
                  {modalEmployeeSearch.length > 0 && modalEmployeeSearch.length < 3 && (
                    <div className="text-xs text-gray-500 mb-2">
                      Type {3 - modalEmployeeSearch.length} more character{3 - modalEmployeeSearch.length === 1 ? '' : 's'} to search
                    </div>
                  )}
                  <div className="border rounded p-3 max-h-48 overflow-y-auto">
                    {modalEmployeeSearch.length >= 3 ? (
                      modalEmployees.length > 0 ? (
                        modalEmployees.map((emp) => (
                          <label key={emp.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.employeeIds.includes(emp.id)}
                              onChange={() => toggleEmployee(emp.id)}
                            />
                            <span>{emp.fullName} ({emp.username})</span>
                          </label>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No employees found</p>
                      )
                    ) : (
                      <p className="text-gray-500 text-sm text-center">Search for employees to assign</p>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Selected: {formData.employeeIds.length} / 5
                  </p>
                  {formData.employeeIds.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium mb-1">Selected Employees:</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.employeeIds.map((empId) => {
                          const emp = modalEmployees.find(e => e.id === empId) || employees.find(e => e.id === empId);
                          return emp ? (
                            <span key={empId} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                              {emp.fullName}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button type="submit" className="btn-primary flex-1">
                  {editMode ? 'Update Ticket' : 'Create Ticket'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
