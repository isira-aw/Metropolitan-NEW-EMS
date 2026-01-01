'use client';

import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services/auth.service';

export default function AdminNav({ currentPage, user }: { currentPage: string; user: any }) {
  const router = useRouter();

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard' },
    { name: 'Users', path: '/admin/users' },
    { name: 'Generators', path: '/admin/generators' },
    { name: 'Tickets', path: '/admin/tickets' },
    { name: 'Approvals', path: '/admin/approvals' },
    { name: 'Reports', path: '/admin/reports' },
  ];

  return (
    <nav className="bg-blue-600 text-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">EMS Admin Portal</h1>
        <div className="flex items-center gap-6">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => router.push(item.path)}
              className={item.name === currentPage ? 'font-bold' : 'hover:text-blue-200'}
            >
              {item.name}
            </button>
          ))}
          <div className="border-l border-blue-400 pl-6 flex items-center gap-4">
            <span className="text-sm">👤 {user?.fullName}</span>
            <button onClick={() => authService.logout()} className="btn-secondary text-sm">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
