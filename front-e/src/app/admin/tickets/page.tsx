'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';

export default function AdminTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);
  const [generators, setGenerators] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [miniJobs, setMiniJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    generatorId: '',
    title: '',
    description: '',
    type: 'MAINTENANCE',
    weight: 3,
    scheduledDate: '',
    scheduledTime: '09:00',
    employeeIds: [] as number[],
  });

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    loadTickets();
    loadGenerators();
    loadEmployees();
  }, [router]);

  const loadTickets = async () => {
    try {
      const response = await apiClient.get('/admin/tickets?size=20');
      setTickets(response.data.content || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
    }
  };

  const loadGenerators = async () => {
    try {
      const response = await apiClient.get('/admin/generators?size=100');
      setGenerators(response.data.content || []);
    } catch (error) {
      console.error('Error loading generators:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await apiClient.get('/admin/employees?size=100');
      setEmployees(response.data.content || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiClient.post('/admin/tickets', formData);
      alert('Ticket created successfully!');
      setShowCreateForm(false);
      setFormData({
        generatorId: '',
        title: '',
        description: '',
        type: 'MAINTENANCE',
        weight: 3,
        scheduledDate: '',
        scheduledTime: '09:00',
        employeeIds: [],
      });
      loadTickets();
    } catch (error: any) {
      alert('Error creating ticket: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeToggle = (empId: number) => {
    if (formData.employeeIds.includes(empId)) {
      setFormData({
        ...formData,
        employeeIds: formData.employeeIds.filter((id) => id !== empId),
      });
    } else if (formData.employeeIds.length < 5) {
      setFormData({
        ...formData,
        employeeIds: [...formData.employeeIds, empId],
      });
    } else {
      alert('Maximum 5 employees allowed');
    }
  };

  const viewTicketDetails = async (ticket: any) => {
    setSelectedTicket(ticket);
    try {
      const response = await apiClient.get(`/admin/tickets/${ticket.id}/mini-jobs`);
      setMiniJobs(response.data || []);
    } catch (error) {
      console.error('Error loading mini jobs:', error);
    }
  };

  const approveMiniJob = async (miniJobId: number) => {
    try {
      await apiClient.put(`/admin/mini-jobs/${miniJobId}/approve`);
      alert('Job approved successfully!');
      if (selectedTicket) {
        viewTicketDetails(selectedTicket);
      }
    } catch (error: any) {
      alert('Error approving job: ' + (error.response?.data?.message || error.message));
    }
  };

  const assignScore = async (miniJob: any) => {
    const score = prompt('Enter score (1-10) for ' + miniJob.employee.fullName);
    if (score && !isNaN(parseInt(score))) {
      try {
        await apiClient.post(`/admin/tickets/${selectedTicket.id}/score`, {
          employeeId: miniJob.employee.id,
          score: parseInt(score),
        });
        alert('Score assigned successfully!');
      } catch (error: any) {
        alert('Error assigning score: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      PENDING: 'bg-gray-200',
      TRAVELING: 'bg-blue-200',
      STARTED: 'bg-green-200',
      ON_HOLD: 'bg-yellow-200',
      COMPLETED: 'bg-purple-200',
      CANCEL: 'bg-red-200',
    };
    return colors[status] || 'bg-gray-200';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Ticket Management</h1>
          <button onClick={() => router.push('/admin/dashboard')} className="btn-secondary">
            Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Tickets</h2>
          <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn-primary">
            {showCreateForm ? 'Cancel' : '+ Create Ticket'}
          </button>
        </div>

        {showCreateForm && (
          <div className="card mb-6">
            <h3 className="text-xl font-bold mb-4">Create New Ticket</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">Generator *</label>
                  <select
                    className="input-field"
                    value={formData.generatorId}
                    onChange={(e) => setFormData({ ...formData, generatorId: e.target.value })}
                    required
                  >
                    <option value="">Select Generator</option>
                    {generators.map((gen) => (
                      <option key={gen.id} value={gen.id}>
                        {gen.name} - {gen.model}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Type *</label>
                  <select
                    className="input-field"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                  >
                    <option value="SERVICE">Service</option>
                    <option value="REPAIR">Repair</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="VISIT">Visit</option>
                    <option value="EMERGENCY">Emergency</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-700 mb-2">Description</label>
                  <textarea
                    className="input-field"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Weight (★) *</label>
                  <select
                    className="input-field"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
                    required
                  >
                    {[1, 2, 3, 4, 5].map((w) => (
                      <option key={w} value={w}>
                        {'★'.repeat(w)} ({w})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Scheduled Date *</label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Scheduled Time *</label>
                  <input
                    type="time"
                    className="input-field"
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-700 mb-2">
                    Assign Employees (1-5) * - Selected: {formData.employeeIds.length}
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border p-2 rounded">
                    {employees.map((emp) => (
                      <label key={emp.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.employeeIds.includes(emp.id)}
                          onChange={() => handleEmployeeToggle(emp.id)}
                        />
                        <span>{emp.fullName}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-primary mt-4" disabled={loading}>
                {loading ? 'Creating...' : 'Create Ticket'}
              </button>
            </form>
          </div>
        )}

        {selectedTicket && (
          <div className="card mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">{selectedTicket.ticketNumber}</h3>
                <p className="text-gray-600">{selectedTicket.title}</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-red-600">
                ✕ Close
              </button>
            </div>

            <h4 className="font-bold mb-2">Mini Job Cards:</h4>
            <div className="space-y-2">
              {miniJobs.map((job) => (
                <div key={job.id} className={`p-3 rounded ${getStatusColor(job.status)}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{job.employee.fullName}</p>
                      <p className="text-sm">Status: {job.status}</p>
                      {job.workMinutes > 0 && (
                        <p className="text-sm">Work Time: {job.workMinutes} minutes</p>
                      )}
                      <p className="text-sm">Approved: {job.approved ? '✓ Yes' : '✗ No'}</p>
                    </div>
                    <div className="space-x-2">
                      {job.status === 'COMPLETED' && !job.approved && (
                        <button
                          onClick={() => approveMiniJob(job.id)}
                          className="btn-primary text-sm"
                        >
                          Approve
                        </button>
                      )}
                      {job.approved && (
                        <button onClick={() => assignScore(job)} className="btn-secondary text-sm">
                          Assign Score
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <h3 className="text-xl font-bold mb-4">All Tickets</h3>
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className={`p-4 rounded ${getStatusColor(ticket.status)} cursor-pointer hover:opacity-80`}
                onClick={() => viewTicketDetails(ticket)}
              >
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold">{ticket.ticketNumber}</p>
                    <p>{ticket.title}</p>
                    <p className="text-sm text-gray-600">
                      Generator: {ticket.generator.name} | Type: {ticket.type} | Weight:{' '}
                      {'★'.repeat(ticket.weight)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Scheduled: {ticket.scheduledDate} at {ticket.scheduledTime}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded text-sm font-semibold ${getStatusColor(
                        ticket.status
                      )}`}
                    >
                      {ticket.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
