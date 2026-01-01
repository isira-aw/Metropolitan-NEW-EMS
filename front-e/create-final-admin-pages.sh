#!/bin/bash

# Create comprehensive Admin pages for Generators, Tickets (with approvals page missing), and Reports

# ==================== ADMIN GENERATORS ====================
cat > src/app/admin/generators/page.tsx << 'EOFGEN'
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { generatorService } from '@/lib/services/admin.service';
import { authService } from '@/lib/services/auth.service';
import { Generator, GeneratorRequest, PageResponse } from '@/types';
import AdminNav from '@/components/layouts/AdminNav';
import Card from '@/components/ui/Card';
import Pagination from '@/components/ui/Pagination';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/lib/utils/format';

export default function AdminGenerators() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generators, setGenerators] = useState<PageResponse<Generator> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGen, setEditingGen] = useState<Generator | null>(null);
  const [formData, setFormData] = useState<GeneratorRequest>({
    model: '',
    name: '',
    capacity: '',
    locationName: '',
    ownerEmail: '',
    latitude: undefined,
    longitude: undefined,
    note: '',
  });
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const role = authService.getRole();
    if (role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    setUser(authService.getStoredUser());
    loadGenerators(0);
  }, [router]);

  const loadGenerators = async (page: number, query = '') => {
    try {
      const data = query
        ? await generatorService.searchByName(query, { page, size: 10 })
        : await generatorService.getAll({ page, size: 10 });

      setGenerators(data);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading generators:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadGenerators(0, searchQuery);
  };

  const handleCreate = () => {
    setEditingGen(null);
    setFormData({
      model: '',
      name: '',
      capacity: '',
      locationName: '',
      ownerEmail: '',
      latitude: undefined,
      longitude: undefined,
      note: '',
    });
    setShowModal(true);
  };

  const handleEdit = (gen: Generator) => {
    setEditingGen(gen);
    setFormData({
      model: gen.model,
      name: gen.name,
      capacity: gen.capacity || '',
      locationName: gen.locationName,
      ownerEmail: gen.ownerEmail || '',
      latitude: gen.latitude,
      longitude: gen.longitude,
      note: gen.note || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGen) {
        await generatorService.update(editingGen.id, formData);
        alert('Generator updated successfully!');
      } else {
        await generatorService.create(formData);
        alert('Generator created successfully!');
      }
      setShowModal(false);
      loadGenerators(currentPage, searchQuery);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error saving generator');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure? This will fail if there are associated tickets.')) return;
    try {
      await generatorService.delete(id);
      alert('Generator deleted successfully!');
      loadGenerators(currentPage, searchQuery);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error deleting generator');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNav currentPage="Generators" user={user} />

      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Generator Management</h2>
          <button onClick={handleCreate} className="btn-primary">+ Create Generator</button>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field flex-1"
            />
            <button type="submit" className="btn-primary">Search</button>
            <button type="button" onClick={() => { setSearchQuery(''); loadGenerators(0); }} className="btn-secondary">Clear</button>
          </form>
        </Card>

        {/* Generators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {generators && generators.content.length > 0 ? (
            generators.content.map((gen) => (
              <Card key={gen.id}>
                <h3 className="text-xl font-bold mb-2">{gen.name}</h3>
                <p className="text-sm text-gray-600 mb-2">Model: {gen.model}</p>
                <p className="text-sm text-gray-600 mb-2">Capacity: {gen.capacity || 'N/A'}</p>
                <p className="text-sm text-gray-600 mb-2">Location: {gen.locationName}</p>
                {gen.ownerEmail && <p className="text-sm text-gray-600 mb-2">Owner: {gen.ownerEmail}</p>}
                {gen.note && <p className="text-sm text-gray-500 italic mb-3">{gen.note}</p>}
                <p className="text-xs text-gray-500 mb-3">Created: {formatDate(gen.createdAt)}</p>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(gen)} className="btn-secondary flex-1 text-sm">Edit</button>
                  <button onClick={() => router.push(`/admin/generators/${gen.id}`)} className="btn-primary flex-1 text-sm">View Details</button>
                  <button onClick={() => handleDelete(gen.id)} className="btn-danger text-sm">Delete</button>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500">No generators found</div>
          )}
        </div>

        {generators && <Pagination currentPage={currentPage} totalPages={generators.totalPages} onPageChange={(p) => loadGenerators(p, searchQuery)} />}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{editingGen ? 'Edit Generator' : 'Create Generator'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Model *</label>
                  <input type="text" required value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Capacity</label>
                  <input type="text" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location Name *</label>
                  <input type="text" required value={formData.locationName} onChange={(e) => setFormData({ ...formData, locationName: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Owner Email</label>
                  <input type="email" value={formData.ownerEmail} onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })} className="input-field" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Latitude</label>
                    <input type="number" step="any" value={formData.latitude || ''} onChange={(e) => setFormData({ ...formData, latitude: e.target.value ? parseFloat(e.target.value) : undefined })} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Longitude</label>
                    <input type="number" step="any" value={formData.longitude || ''} onChange={(e) => setFormData({ ...formData, longitude: e.target.value ? parseFloat(e.target.value) : undefined })} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} className="input-field" rows={3} />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="submit" className="btn-primary flex-1">Save</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
EOFGEN

echo "✅ Admin Generators page created!"

# ==================== ADMIN APPROVALS ====================
mkdir -p src/app/admin/approvals
cat > src/app/admin/approvals/page.tsx << 'EOFAPP'
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { approvalService } from '@/lib/services/admin.service';
import { authService } from '@/lib/services/auth.service';
import { MiniJobCard, PageResponse } from '@/types';
import AdminNav from '@/components/layouts/AdminNav';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import Pagination from '@/components/ui/Pagination';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDateTime, formatMinutes } from '@/lib/utils/format';

export default function AdminApprovals() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<PageResponse<MiniJobCard> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [scoringCard, setScoringCard] = useState<MiniJobCard | null>(null);
  const [score, setScore] = useState(5);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const role = authService.getRole();
    if (role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    setUser(authService.getStoredUser());
    loadPending(0);
  }, [router]);

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

  const handleScore = (card: MiniJobCard) => {
    setScoringCard(card);
    setScore(5);
    setShowScoreModal(true);
  };

  const submitScore = async () => {
    if (!scoringCard) return;
    try {
      await approvalService.addScore({
        ticketId: scoringCard.mainTicket.id,
        employeeId: scoringCard.employee.id,
        score,
      });
      alert('Score added successfully!');
      setShowScoreModal(false);
      setScoringCard(null);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error adding score');
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNav currentPage="Approvals" user={user} />

      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Pending Approvals</h2>
          {selectedIds.length > 0 && (
            <button onClick={handleBulkApprove} className="btn-success">
              ✓ Bulk Approve ({selectedIds.length})
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
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-bold">{card.mainTicket.title}</h3>
                        <p className="text-sm text-gray-600">Ticket: {card.mainTicket.ticketNumber}</p>
                        <p className="text-sm text-gray-600">Employee: {card.employee.fullName}</p>
                        <p className="text-sm text-gray-600">Type: {card.mainTicket.type} | Weight: {'⭐'.repeat(card.mainTicket.weight)}</p>
                      </div>
                      <StatusBadge status={card.status} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-3">
                      <p>Work Time: <strong>{formatMinutes(card.workMinutes)}</strong></p>
                      {card.startTime && <p>Started: <strong>{formatDateTime(card.startTime)}</strong></p>}
                      {card.endTime && <p>Ended: <strong>{formatDateTime(card.endTime)}</strong></p>}
                      <p>Approved: <strong>{card.approved ? 'Yes' : 'No'}</strong></p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(card.id)} className="btn-success text-sm">✓ Approve</button>
                      <button onClick={() => handleReject(card.id)} className="btn-danger text-sm">✗ Reject</button>
                      <button onClick={() => handleScore(card)} className="btn-secondary text-sm">⭐ Score</button>
                      <button onClick={() => router.push(`/employee/job-cards/${card.id}`)} className="btn-secondary text-sm">View Details</button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <p className="text-center text-gray-500 py-8">No pending approvals</p>
            </Card>
          )}
        </div>

        {pending && <Pagination currentPage={currentPage} totalPages={pending.totalPages} onPageChange={loadPending} />}
      </div>

      {/* Score Modal */}
      {showScoreModal && scoringCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add Performance Score</h3>
            <p className="mb-4">
              <strong>Employee:</strong> {scoringCard.employee.fullName}
            </p>
            <p className="mb-4">
              <strong>Ticket:</strong> {scoringCard.mainTicket.ticketNumber}
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Score (1-10)</label>
              <input
                type="range"
                min="1"
                max="10"
                value={score}
                onChange={(e) => setScore(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-3xl font-bold text-blue-600 mt-2">{score} / 10</div>
            </div>
            <div className="flex gap-3">
              <button onClick={submitScore} className="btn-primary flex-1">Submit Score</button>
              <button onClick={() => setShowScoreModal(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
EOFAPP

echo "✅ Admin Approvals page created!"

# ==================== ADMIN REPORTS ====================
cat > src/app/admin/reports/page.tsx << 'EOFREP'
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { reportService } from '@/lib/services/admin.service';
import { authService } from '@/lib/services/auth.service';
import AdminNav from '@/components/layouts/AdminNav';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { downloadCSV } from '@/lib/utils/format';

export default function AdminReports() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const role = authService.getRole();
    if (role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    setUser(authService.getStoredUser());
    
    // Set default dates (last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
    
    setLoading(false);
  }, [router]);

  const handleExportTimeTracking = async () => {
    try {
      const blob = await reportService.exportTimeTracking(startDate, endDate);
      downloadCSV(blob, `time-tracking-${startDate}-to-${endDate}.csv`);
    } catch (error: any) {
      alert('Error exporting report');
    }
  };

  const handleExportOvertime = async () => {
    try {
      const blob = await reportService.exportOvertime(startDate, endDate);
      downloadCSV(blob, `overtime-${startDate}-to-${endDate}.csv`);
    } catch (error: any) {
      alert('Error exporting report');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNav currentPage="Reports" user={user} />

      <div className="container mx-auto p-6">
        <h2 className="text-3xl font-bold mb-6">Reports & Analytics</h2>

        {/* Date Range Selector */}
        <Card className="mb-6">
          <h3 className="text-lg font-bold mb-4">Select Date Range</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </Card>

        {/* Export Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-bold mb-2">⏱️ Time Tracking Report</h3>
            <p className="text-sm text-gray-600 mb-4">Export employee work time, travel time, and idle time</p>
            <button onClick={handleExportTimeTracking} className="btn-primary w-full">
              📥 Export CSV
            </button>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-bold mb-2">⏰ Overtime Report</h3>
            <p className="text-sm text-gray-600 mb-4">Export morning and evening overtime by employee</p>
            <button onClick={handleExportOvertime} className="btn-primary w-full">
              📥 Export CSV
            </button>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-bold mb-2">📊 Dashboard Statistics</h3>
            <p className="text-sm text-gray-600 mb-4">View real-time system statistics</p>
            <button onClick={() => router.push('/admin/dashboard')} className="btn-secondary w-full">
              View Dashboard
            </button>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-bold mb-2">📈 Productivity Report</h3>
            <p className="text-sm text-gray-600 mb-4">Employee productivity metrics (View backend API)</p>
            <button className="btn-secondary w-full" disabled>
              Coming Soon
            </button>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-bold mb-2">🎯 Ticket Completion</h3>
            <p className="text-sm text-gray-600 mb-4">Ticket completion statistics (View backend API)</p>
            <button className="btn-secondary w-full" disabled>
              Coming Soon
            </button>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-bold mb-2">📅 Monthly Summary</h3>
            <p className="text-sm text-gray-600 mb-4">Comprehensive monthly report (View backend API)</p>
            <button className="btn-secondary w-full" disabled>
              Coming Soon
            </button>
          </Card>
        </div>

        <Card className="mt-6">
          <h3 className="text-lg font-bold mb-3">📝 Available Report Endpoints</h3>
          <p className="text-sm text-gray-600 mb-4">All backend report endpoints are integrated via the reportService. You can extend this page to show detailed analytics.</p>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>Time Tracking Report (Integrated ✅)</li>
            <li>Overtime Report (Integrated ✅)</li>
            <li>Overtime by Generator</li>
            <li>Employee Performance Scores</li>
            <li>Ticket Completion Statistics</li>
            <li>Employee Productivity Metrics</li>
            <li>Generator Service History</li>
            <li>Daily Attendance Summary</li>
            <li>Monthly Summary Report</li>
            <li>Dashboard Statistics (Integrated ✅)</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
EOFREP

echo "✅ Admin Reports page created!"
echo "🎉 All admin pages completed!"

