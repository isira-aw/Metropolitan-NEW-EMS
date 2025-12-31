'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';

export default function AdminDashboard() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalGenerators: 0,
    totalTickets: 0,
  });

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    setFullName(localStorage.getItem('fullName') || '');
    loadStats();
  }, [router]);

  const loadStats = async () => {
    try {
      const [users, generators, tickets] = await Promise.all([
        apiClient.get('/admin/users?size=1'),
        apiClient.get('/admin/generators?size=1'),
        apiClient.get('/admin/tickets?size=1'),
      ]);

      setStats({
        totalUsers: users.data.totalElements || 0,
        totalGenerators: generators.data.totalElements || 0,
        totalTickets: tickets.data.totalElements || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">EMS Admin</h1>
          <div className="flex items-center gap-4">
            <span>Welcome, {fullName}</span>
            <button onClick={handleLogout} className="btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-6">
        <h2 className="text-3xl font-bold mb-6">Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card bg-blue-50">
            <h3 className="text-xl font-semibold mb-2">Total Users</h3>
            <p className="text-4xl font-bold text-blue-600">{stats.totalUsers}</p>
          </div>
          <div className="card bg-green-50">
            <h3 className="text-xl font-semibold mb-2">Total Generators</h3>
            <p className="text-4xl font-bold text-green-600">{stats.totalGenerators}</p>
          </div>
          <div className="card bg-purple-50">
            <h3 className="text-xl font-semibold mb-2">Total Tickets</h3>
            <p className="text-4xl font-bold text-purple-600">{stats.totalTickets}</p>
          </div>
        </div>

        <div className="card">
          <h3 className="text-2xl font-bold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => router.push('/admin/users')}
              className="btn-primary text-left p-4"
            >
              👥 Manage Users
            </button>
            <button
              onClick={() => router.push('/admin/generators')}
              className="btn-primary text-left p-4"
            >
              ⚡ Manage Generators
            </button>
            <button
              onClick={() => router.push('/admin/tickets')}
              className="btn-primary text-left p-4"
            >
              🎟️ Manage Tickets
            </button>
            <button
              onClick={() => router.push('/admin/reports')}
              className="btn-primary text-left p-4"
            >
              📊 View Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
