'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authService } from '@/lib/services/auth.service';
import { StoredUser } from '@/types';
import { LucideIcon } from 'lucide-react'; // Import the built-in type
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
  icon: LucideIcon; // Use Lucide's official type instead of custom ComponentType
  badge?: number;
}

interface LeftSidebarProps {
  role: 'ADMIN' | 'EMPLOYEE';
  user: StoredUser | null;
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

  useEffect(() => { setIsMobileOpen(false); }, [pathname]);

  const handleLogout = () => authService.logout();
  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Mobile Menu Button */}
      {!isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-brand text-cream rounded-2xl shadow-xl"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-brand text-cream z-50 transition-all duration-300 ease-in-out border-r border-cream/10
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} w-64 flex flex-col
        `}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-4">
          <div className={`flex items-center gap-2 min-w-0 ${isCollapsed ? 'lg:hidden' : ''}`}>
            <img
              src="/MetropolitanLOGO.png"
              alt="Metropolitan"
              className="w-9 h-9 rounded-lg object-contain bg-cream/10 flex-shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-sm font-black tracking-tight uppercase truncate">EMS Portal</h1>
              <p className="text-[10px] font-bold text-cream/60 uppercase tracking-widest">{role}</p>
            </div>
          </div>
          {isCollapsed && (
            <img
              src="/MetropolitanLOGO.png"
              alt="Metropolitan"
              className="hidden lg:block w-9 h-9 rounded-lg object-contain bg-cream/10 mx-auto"
            />
          )}

          <button
            onClick={() => (isMobileOpen ? setIsMobileOpen(false) : setIsCollapsed(!isCollapsed))}
            className={`p-2 hover:bg-cream/10 rounded-xl text-cream/70 hover:text-cream transition-colors ${isCollapsed ? 'lg:hidden' : ''}`}
          >
            {isMobileOpen ? <X size={20} /> : <ChevronLeft size={20} className={isCollapsed ? 'rotate-180' : ''} />}
          </button>
        </div>
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="hidden lg:flex items-center justify-center p-2 mx-auto -mt-2 mb-2 hover:bg-cream/10 rounded-xl text-cream/70 hover:text-cream transition-colors"
          >
            <ChevronLeft size={16} className="rotate-180" />
          </button>
        )}

        {/* User Quick Profile */}
        <div className={`px-3 mb-4 ${isCollapsed ? 'lg:px-3' : ''}`}>
          <div className={`bg-cream/10 border border-cream/10 rounded-2xl p-3 flex items-center gap-3 ${isCollapsed ? 'lg:justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-cream/15 border border-cream/20 flex items-center justify-center text-cream flex-shrink-0">
              <UserIcon size={18} />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="text-xs font-black truncate">{user?.fullName || 'Operator'}</p>
                <p className="text-[10px] font-bold text-cream/60 truncate uppercase tracking-tighter">System Verified</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`
                  w-full group flex items-center gap-3 px-3 py-3 rounded-xl transition-all relative
                  ${active
                    ? 'bg-cream text-brand shadow-md'
                    : 'text-cream/70 hover:bg-cream/10 hover:text-cream'}
                  ${isCollapsed ? 'lg:justify-center lg:px-0' : ''}
                `}
              >
                <div className="relative">
                  <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-2 -right-2 bg-cream text-brand text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-brand">
                      {item.badge}
                    </span>
                  )}
                </div>

                {!isCollapsed && (
                  <span className="text-xs font-black uppercase tracking-widest">{item.name}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 mt-auto">
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-3 px-3 py-3 rounded-xl text-cream/60 hover:bg-cream/10 hover:text-cream transition-all
              ${isCollapsed ? 'lg:justify-center lg:px-0' : ''}
            `}
          >
            <LogOut size={20} />
            {!isCollapsed && <span className="text-xs font-black uppercase tracking-widest">Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}