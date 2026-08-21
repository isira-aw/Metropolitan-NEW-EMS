'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import LeftSidebar from './LeftSidebar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoading } = useAuth('ADMIN');

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex min-h-screen bg-cream">
      <LeftSidebar role="ADMIN" user={user} />

      {/* Main Content Area - dense padding, laptop-width layout */}
      <main className="flex-1 lg:ml-64 transition-all duration-300">
        <div className="px-4 py-4 lg:px-6 lg:py-5 max-w-[1600px]">
          {children}
        </div>
      </main>
    </div>
  );
}
