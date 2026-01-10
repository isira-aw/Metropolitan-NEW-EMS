'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services/auth.service';
import { Menu, X, User } from 'lucide-react';

export default function AdminNav({
  currentPage,
  user,
}: {
  currentPage: string;
  user: any;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard' },
    { name: 'Users', path: '/admin/users' },
    { name: 'Generators', path: '/admin/generators' },
    { name: 'Tickets', path: '/admin/tickets' },
    { name: 'Approvals', path: '/admin/approvals' },
    { name: 'Reports', path: '/admin/reports' },
    { name: 'Logs', path: '/admin/logs' },
  ];

  return (
    <nav className="bg-corporate-blue text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top Bar */}
        <div className="flex justify-between items-center h-16">
          <h1 className="text-lg md:text-2xl font-bold">
            EMS Admin Portal
          </h1>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => router.push(item.path)}
                className={`transition-colors ${
                  item.name === currentPage
                    ? 'font-bold text-white'
                    : 'hover:text-[#A0BFE0]'
                }`}
              >
                {item.name}
              </button>
            ))}

            <div className="border-l border-soft-blue pl-6 flex items-center gap-4">
              <span className="text-sm flex items-center gap-2">
                <User size={18} />
                {user?.fullName}
              </span>
              <button
                onClick={() => authService.logout()}
                className="bg-white text-corporate-blue px-3 py-1 rounded-md text-sm hover:bg-[#E8F0FB]"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {open && (
          <div className="md:hidden pb-4 space-y-3">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  router.push(item.path);
                  setOpen(false);
                }}
                className={`block w-full text-left px-2 py-2 rounded-md ${
                  item.name === currentPage
                    ? 'bg-[#0F3A7A] font-bold'
                    : 'hover:bg-soft-blue'
                }`}
              >
                {item.name}
              </button>
            ))}

            <div className="border-t border-soft-blue pt-3 mt-3 space-y-2">
              <p className="text-sm px-2 flex items-center gap-2">
                <User size={18} />
                {user?.fullName}
              </p>
              <button
                onClick={() => authService.logout()}
                className="w-full bg-white text-corporate-blue py-2 rounded-md text-sm hover:bg-[#E8F0FB]"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
