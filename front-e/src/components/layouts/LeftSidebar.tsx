'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authService } from '@/lib/services/auth.service';
import {
  LayoutDashboard,
  Users,
  Zap,
  Ticket,
  CheckCircle2,
  FileText,
  ScrollText,
  ClipboardList,
  UserCheck,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  User as UserIcon,
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: number;
}

interface LeftSidebarProps {
  role: 'ADMIN' | 'EMPLOYEE';
  user: any;
  pendingJobsCount?: number;
}

export default function LeftSidebar({ role, user, pendingJobsCount }: LeftSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const adminNavItems: NavItem[] = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Generators', path: '/admin/generators', icon: Zap },
    { name: 'Tickets', path: '/admin/tickets', icon: Ticket },
    { name: 'Approvals', path: '/admin/approvals', icon: CheckCircle2 },
    { name: 'Reports', path: '/admin/reports', icon: FileText },
    { name: 'Logs', path: '/admin/logs', icon: ScrollText },
  ];

  const employeeNavItems: NavItem[] = [
    { name: 'Dashboard', path: '/employee/dashboard', icon: LayoutDashboard },
    { name: 'Job Cards', path: '/employee/job-cards', icon: ClipboardList, badge: pendingJobsCount },
    { name: 'Attendance', path: '/employee/attendance', icon: UserCheck },
  ];

  const navItems = role === 'ADMIN' ? adminNavItems : employeeNavItems;

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileOpen]);

  const handleLogout = () => {
    authService.logout();
  };

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-corporate-blue text-white rounded-lg shadow-lg hover:bg-soft-blue transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-gradient-to-b from-corporate-blue to-[#0F3A7A] text-white z-50 shadow-2xl
          transition-all duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}
          w-72
        `}
      >
        {/* Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/10">
          <div className={`flex items-center gap-3 ${isCollapsed ? 'lg:hidden' : ''}`}>
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Zap size={24} className="text-corporate-blue" />
            </div>
            <div>
              <h1 className="text-lg font-bold">EMS Portal</h1>
              <p className="text-xs text-white/70">{role === 'ADMIN' ? 'Admin' : 'Employee'}</p>
            </div>
          </div>

          {/* Collapse Button - Desktop Only */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:block p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft
              size={20}
              className={`transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Close Button - Mobile Only */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Info */}
        <div className={`px-6 py-4 border-b border-white/10 ${isCollapsed ? 'lg:hidden' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <UserIcon size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{user?.fullName || 'User'}</p>
              <p className="text-xs text-white/70 truncate">{user?.email || ''}</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-6 px-3">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <li key={item.path}>
                  <button
                    onClick={() => router.push(item.path)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                      ${active
                        ? 'bg-white text-corporate-blue shadow-lg font-semibold'
                        : 'text-white/90 hover:bg-white/10 hover:text-white'
                      }
                      ${isCollapsed ? 'lg:justify-center lg:px-0' : ''}
                    `}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <div className="relative">
                      <Icon size={22} className={active ? 'text-corporate-blue' : ''} />
                      {item.badge && item.badge > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </div>
                    <span className={`flex-1 ${isCollapsed ? 'lg:hidden' : ''}`}>
                      {item.name}
                    </span>
                    {item.badge && item.badge > 0 && !isCollapsed && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-lg
              bg-white/10 hover:bg-red-500 text-white transition-all
              ${isCollapsed ? 'lg:justify-center lg:px-0' : ''}
            `}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut size={22} />
            <span className={`font-semibold ${isCollapsed ? 'lg:hidden' : ''}`}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
