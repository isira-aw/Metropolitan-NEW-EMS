'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { userService } from '@/lib/services/admin.service';
import { User, UserRequest, PageResponse, UserRole } from '@/types';
import AdminLayout from '@/components/layouts/AdminLayout';
import Pagination from '@/components/ui/Pagination';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils/format';
import {
  Plus, Search, Pencil, ShieldCheck, Mail, Phone, X,
  User as UserIcon, CheckCircle2, AlertCircle, Contact2, Fingerprint, Eye, EyeOff
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
    username: '', password: '', fullName: '', role: UserRole.EMPLOYEE, phone: '', email: '', active: true,
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => { loadUsers(0); }, []);

  const loadUsers = async (page: number, query = '') => {
    try {
      const data = query ? await userService.search(query, { page, size: 10 }) : await userService.getAll({ page, size: 10 });
      setUsers(data);
      setCurrentPage(page);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({ username: '', password: '', fullName: '', role: UserRole.EMPLOYEE, phone: '', email: '', active: true });
    setShowPassword(false);
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
      active: user.active
    });
    setShowPassword(false);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Omit password entirely when left blank so the backend keeps the
        // existing one - only send it if the admin actually typed a new one.
        const { password, ...rest } = formData;
        const payload = password ? { ...rest, password } : rest;
        await userService.update(editingUser.id, payload);
      } else {
        await userService.create(formData);
      }
      setShowModal(false);
      loadUsers(currentPage, searchQuery);
    } catch (error: any) { alert(error.response?.data?.message || 'Error saving user'); }
  };

  const toggleActive = async (id: number, active: boolean) => {
    try {
      active ? await userService.deactivate(id) : await userService.activate(id);
      loadUsers(currentPage, searchQuery);
    } catch (error: any) { alert('Error updating status'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto space-y-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-black tracking-tighter uppercase">Personnel <span className="text-brand">Registry</span></h2>
            <p className="text-[10px] font-black text-black/50 uppercase tracking-widest mt-0.5 italic">Manage System Access Controls</p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center justify-center gap-2 bg-brand hover:shadow-lg text-cream px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-sm"
          >
            <Plus size={18} /> Register Personnel
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-cream p-3 rounded-xl border border-brand/20 shadow-sm flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" size={18} />
            <input
              type="text"
              placeholder="Filter by name, username or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brand/5 border-none rounded-xl py-3 pl-12 pr-4 text-sm font-bold text-black focus:ring-2 focus:ring-brand/30 transition-all outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => loadUsers(0, searchQuery)} className="bg-brand text-cream px-6 rounded-xl font-black uppercase tracking-widest text-[10px]">Search</button>
            <button onClick={() => { setSearchQuery(''); loadUsers(0); }} className="bg-cream text-black border border-brand/30 px-5 rounded-xl font-black uppercase tracking-widest text-[10px]">Reset</button>
          </div>
        </div>

        {/* Registry Table */}
        <div className="bg-cream rounded-xl border border-brand/20 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand text-cream">
                  <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em]">Employee Profile</th>
                  <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em]">Designation</th>
                  <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em]">Contact Channels</th>
                  <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em]">Status</th>
                  <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand/10">
                {users?.content.map((u) => (
                  <tr key={u.id} className="hover:bg-brand/10 transition-colors group">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand font-black text-xs group-hover:bg-brand group-hover:text-cream transition-all flex-shrink-0">
                          {u.fullName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-xs font-black text-black uppercase tracking-tight">{u.fullName}</p>
                          <p className="text-[10px] font-bold text-black/50 italic">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                        u.role === 'ADMIN' ? 'bg-brand text-cream' : 'bg-brand/10 text-brand border border-brand/20'
                      }`}>
                        {u.role === 'ADMIN' ? <ShieldCheck size={12} /> : <UserIcon size={12} />}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-black/60">
                          <Mail size={12} className="text-black/30" /> {u.email || '--'}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-black/60">
                          <Phone size={12} className="text-black/30" /> {u.phone || '--'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => toggleActive(u.id, u.active)}
                        className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.15em] transition-all border ${
                          u.active ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        {u.active ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(u)} aria-label={`Edit ${u.fullName}`} className="p-2 text-black/50 hover:text-brand hover:bg-brand/10 rounded-lg transition-all">
                          <Pencil size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users && users.content.length === 0 && (
              <EmptyState
                icon={<UserIcon size={40} />}
                message="No personnel match this search."
              />
            )}
          </div>
          <div className="border-t border-brand/10">
            {users && <Pagination currentPage={currentPage} totalPages={users.totalPages} onPageChange={(p) => loadUsers(p, searchQuery)} />}
          </div>
        </div>
      </div>

      {/* Registry Modal - FULL EDITING SUPPORT */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-cream w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-brand/20 animate-in fade-in zoom-in duration-200">
            <div className="bg-brand px-6 py-4 flex justify-between items-center text-cream">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cream/10 rounded-xl">
                  {editingUser ? <Pencil size={20} /> : <Plus size={20} />}
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-widest">{editingUser ? 'Update Profile' : 'New Personnel'}</h3>
                  <p className="text-[10px] font-bold text-cream/70 uppercase tracking-[0.2em] italic">System Registry Entry</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="bg-cream/10 p-2 rounded-xl hover:bg-cream/20 transition-all"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} autoComplete="off" className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {/* Profile Identity Section */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-brand uppercase tracking-widest flex items-center gap-2">
                  <Fingerprint size={14} /> Identity & Credentials
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-black/50 uppercase tracking-widest mb-1 block ml-1">Full Legal Name</label>
                    <input required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full bg-brand/5 rounded-xl py-2.5 px-4 text-sm font-bold text-black border-none outline-none focus:ring-2 focus:ring-brand/30" placeholder="e.g. John Doe" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-black/50 uppercase tracking-widest mb-1 block ml-1">System Username</label>
                    <input disabled={!!editingUser} required autoComplete="off" name="new-personnel-username" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="w-full bg-brand/5 rounded-xl py-2.5 px-4 text-sm font-bold text-black border-none outline-none disabled:opacity-50" placeholder="j.doe" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-black/50 uppercase tracking-widest mb-1 block ml-1">Access Level</label>
                    <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})} className="w-full bg-brand/5 rounded-xl py-2.5 px-4 text-sm font-bold text-black border-none outline-none appearance-none cursor-pointer">
                      <option value="EMPLOYEE">EMPLOYEE</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-black/50 uppercase tracking-widest mb-1 block ml-1">
                      System Password {editingUser && <span className="text-black/30">(leave blank to keep current)</span>}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required={!editingUser}
                        minLength={6}
                        autoComplete="new-password"
                        name="new-personnel-password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder={editingUser ? 'Leave blank to keep current password' : undefined}
                        className="w-full bg-brand/5 rounded-xl py-2.5 pl-4 pr-11 text-sm font-bold text-black border-none outline-none focus:ring-2 focus:ring-brand/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-black/30 hover:text-black/60 transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Channels Section - NEW & EDITABLE */}
              <div className="space-y-3 pt-1">
                <p className="text-[10px] font-black text-brand uppercase tracking-widest flex items-center gap-2">
                  <Contact2 size={14} /> Communication Channels
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-[10px] font-black text-black/50 uppercase tracking-widest mb-1 block ml-1">Corporate Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30" size={14} />
                      <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-brand/5 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold text-black border-none outline-none focus:ring-2 focus:ring-brand/30" placeholder="email@company.com" />
                    </div>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-[10px] font-black text-black/50 uppercase tracking-widest mb-1 block ml-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30" size={14} />
                      <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-brand/5 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold text-black border-none outline-none focus:ring-2 focus:ring-brand/30" placeholder="+94 ..." />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-brand/5 rounded-xl border border-brand/10 mt-1">
                <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-5 h-5 rounded-lg text-brand focus:ring-brand border-brand/30 transition-all"
                  />
                  <div>
                    <p className="text-xs font-black text-black uppercase tracking-tight">Access Authorization</p>
                    <p className="text-[9px] font-bold text-black/50 uppercase">Status: {formData.active ? 'Authenticated' : 'Locked'}</p>
                  </div>
              </div>

              <button type="submit" className="w-full bg-brand text-cream font-black uppercase tracking-[0.2em] py-3.5 rounded-xl shadow-sm hover:shadow-lg transition-all active:scale-95 mt-2">
                Commit to System Registry
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
