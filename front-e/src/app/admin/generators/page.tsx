'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';

export default function AdminGeneratorsPage() {
  const router = useRouter();
  const [generators, setGenerators] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    model: '',
    name: '',
    capacity: '',
    locationName: '',
    ownerEmail: '',
    latitude: '',
    longitude: '',
    note: '',
  });

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    loadGenerators();
  }, [router]);

  const loadGenerators = async () => {
    try {
      const response = await apiClient.get('/admin/generators?size=50');
      setGenerators(response.data.content || []);
    } catch (error) {
      console.error('Error loading generators:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      };
      await apiClient.post('/admin/generators', payload);
      alert('Generator created successfully!');
      setShowCreateForm(false);
      setFormData({
        model: '',
        name: '',
        capacity: '',
        locationName: '',
        ownerEmail: '',
        latitude: '',
        longitude: '',
        note: '',
      });
      loadGenerators();
    } catch (error: any) {
      alert('Error creating generator: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Generator Management</h1>
          <button onClick={() => router.push('/admin/dashboard')} className="btn-secondary">
            Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Generators</h2>
          <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn-primary">
            {showCreateForm ? 'Cancel' : '+ Add Generator'}
          </button>
        </div>

        {showCreateForm && (
          <div className="card mb-6">
            <h3 className="text-xl font-bold mb-4">Add New Generator</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">Model *</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Capacity</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., 5000 KVA"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Location Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.locationName}
                    onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Owner Email</label>
                  <input
                    type="email"
                    className="input-field"
                    value={formData.ownerEmail}
                    onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    className="input-field"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    className="input-field"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-700 mb-2">Note</label>
                  <textarea
                    className="input-field"
                    rows={3}
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary mt-4" disabled={loading}>
                {loading ? 'Adding...' : 'Add Generator'}
              </button>
            </form>
          </div>
        )}

        <div className="card">
          <h3 className="text-xl font-bold mb-4">All Generators</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {generators.map((gen) => (
              <div key={gen.id} className="border rounded p-4 bg-white hover:shadow-lg">
                <h4 className="font-bold text-lg">{gen.name}</h4>
                <p className="text-sm text-gray-600">Model: {gen.model}</p>
                {gen.capacity && <p className="text-sm text-gray-600">Capacity: {gen.capacity}</p>}
                <p className="text-sm text-gray-600 mt-2">📍 {gen.locationName}</p>
                {gen.ownerEmail && <p className="text-sm text-gray-600">✉️ {gen.ownerEmail}</p>}
                {gen.note && <p className="text-sm text-gray-500 mt-2 italic">{gen.note}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
