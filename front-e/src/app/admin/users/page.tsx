'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { userService } from '@/lib/services/admin.service';
import { authService } from '@/lib/services/auth.service';
import { User, UserRequest, PageResponse, UserRole } from '@/types';
import AdminNav from '@/components/layouts/AdminNav';
import Card from '@/components/ui/Card';
import Pagination from '@/components/ui/Pagination';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/lib/utils/format';

import {
  Users,
  Plus,
  Search,
  X,
  Edit,
  Trash2,
  Shield,
  User as UserIcon,
  CheckCircle,
  XCircle,
  Calendar
} from 'lucide-react';

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
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const role = authService.getRole();
    if (role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    setUser(authService.getStoredUser());
    loadUsers(0);
  }, [router]);

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
      password: '',
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
      active ? await userService.deactivate(id) : await userService.activate(id);
      loadUsers(currentPage, searchQuery);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error updating user status');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNav currentPage="Users" user={user} />

      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-600" />
            User Management
          </h2>

          <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create User
          </button>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
              />
            </div>

            <button type="submit" className="btn-primary flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search
            </button>

            <button
              type="button"
              onClick={() => { setSearchQuery(''); loadUsers(0); }}
              className="btn-secondary flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          </form>
        </Card>

        {/* Table */}
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
                {users?.content.length ? users.content.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td className="font-semibold">{u.username}</td>
                    <td>{u.fullName}</td>

                    <td>
                      <span className={`px-2 py-1 rounded text-xs flex items-center gap-1 w-fit
                        ${u.role === 'ADMIN'
                          ? 'bg-red-200 text-red-800'
                          : 'bg-blue-200 text-blue-800'}`}
                      >
                        {u.role === 'ADMIN' ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                        {u.role}
                      </span>
                    </td>

                    <td>{u.email || '-'}</td>
                    <td>{u.phone || '-'}</td>

                    <td>
                      <button
                        onClick={() => toggleActive(u.id, u.active)}
                        className={`px-2 py-1 rounded text-xs flex items-center gap-1
                          ${u.active
                            ? 'bg-green-200 text-green-800'
                            : 'bg-gray-200 text-gray-800'}`}
                      >
                        {u.active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {u.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    <td className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {formatDate(u.createdAt)}
                    </td>

                    <td className="space-x-3">
                      <button onClick={() => handleEdit(u)} className="text-blue-600 hover:underline text-sm inline-flex items-center gap-1">
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:underline text-sm inline-flex items-center gap-1">
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={9} className="text-center text-gray-500">No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {users && (
            <Pagination
              currentPage={currentPage}
              totalPages={users.totalPages}
              onPageChange={(p) => loadUsers(p, searchQuery)}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
