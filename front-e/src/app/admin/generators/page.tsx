'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { generatorService } from '@/lib/services/admin.service';
import { authService } from '@/lib/services/auth.service';
import { Generator, GeneratorRequest, PageResponse } from '@/types';
import AdminLayout from '@/components/layouts/AdminLayout';
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
    whatsAppNumber: '',
    landlineNumber: '',
    note: '',
  });

  useEffect(() => {
    loadGenerators(0);
  }, []);

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
      whatsAppNumber: '',
      landlineNumber: '',
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
      whatsAppNumber: gen.whatsAppNumber || '',
      landlineNumber: gen.landlineNumber || '',
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
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
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
                    <label className="block text-sm font-medium mb-1">WhatsApp Number</label>
                    <input type="text" value={formData.whatsAppNumber || ''} onChange={(e) => setFormData({ ...formData, whatsAppNumber: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Landline Number</label>
                    <input type="text" value={formData.landlineNumber || ''} onChange={(e) => setFormData({ ...formData, landlineNumber: e.target.value })} className="input-field" />
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
    </AdminLayout>
  );
}
