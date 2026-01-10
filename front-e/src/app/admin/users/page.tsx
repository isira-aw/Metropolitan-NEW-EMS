'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { userService } from '@/lib/services/admin.service';
import { authService } from '@/lib/services/auth.service';
import { User, UserRequest, PageResponse, UserRole } from '@/types';
import AdminLayout from '@/components/layouts/AdminLayout';
import Card from '@/components/ui/Card';
import Pagination from '@/components/ui/Pagination';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/lib/utils/format';

export default function AdminUsers() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<PageResponse<User> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserRequest>({
    username: '',
    password: '',
    fullName: '',
    role: UserRole.EMPLOYEE,
    phone: '',
    email: '',
    active: true,
  });

  useEffect(() => {
    loadUsers(0);
  }, []);

  const loadUsers = async (page: number, query = '') => {
    try {
      const data = query
        ? await userService.search(query, { page, size: 10 })
        : await userService.getAll({ page, size: 10 });

      setUsers(data);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers(0, searchQuery);
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      fullName: '',
      role: UserRole.EMPLOYEE,
      phone: '',
      email: '',
      active: true,
    });
    setShowModal(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '', // Don't show password
      fullName: user.fullName,
      role: user.role,
      phone: user.phone || '',
      email: user.email || '',
      active: user.active,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await userService.update(editingUser.id, formData);
        alert('User updated successfully!');
      } else {
        await userService.create(formData);
        alert('User created successfully!');
      }
      setShowModal(false);
      loadUsers(currentPage, searchQuery);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error saving user');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await userService.delete(id);
      alert('User deleted successfully!');
      loadUsers(currentPage, searchQuery);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error deleting user');
    }
  };

  const toggleActive = async (id: number, active: boolean) => {
    try {
      if (active) {
        await userService.deactivate(id);
      } else {
        await userService.activate(id);
      }
      loadUsers(currentPage, searchQuery);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error updating user status');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">User Management</h2>
          <button onClick={handleCreate} className="btn-primary">+ Create User</button>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field flex-1"
            />
            <button type="submit" className="btn-primary">Search</button>
            <button type="button" onClick={() => { setSearchQuery(''); loadUsers(0); }} className="btn-secondary">
              Clear
            </button>
          </form>
        </Card>

        {/* Users Table */}
        <Card>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users && users.content.length > 0 ? (
                  users.content.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td className="font-semibold">{u.username}</td>
                      <td>{u.fullName}</td>
                      <td>
                        <span className={`px-2 py-1 rounded text-xs ${u.role === 'ADMIN' ? 'bg-red-200 text-red-800' : 'bg-blue-200 text-blue-800'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>{u.email || '-'}</td>
                      <td>{u.phone || '-'}</td>
                      <td>
                        <button
                          onClick={() => toggleActive(u.id, u.active)}
                          className={`px-2 py-1 rounded text-xs ${u.active ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}
                        >
                          {u.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td>{formatDate(u.createdAt)}</td>
                      <td className="space-x-2">
                        <button onClick={() => handleEdit(u)} className="text-blue-600 hover:underline text-sm">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:underline text-sm">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center text-gray-500">No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {users && <Pagination currentPage={currentPage} totalPages={users.totalPages} onPageChange={(p) => loadUsers(p, searchQuery)} />}
        </Card>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">{editingUser ? 'Edit User' : 'Create User'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="input-field"
                    disabled={!!editingUser}
                  />
                </div>

                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Password *</label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="input-field"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="input-field"
                  >
                    <option value="EMPLOYEE">EMPLOYEE</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium">Active</label>
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
    </AdminLayout>
  );
}
