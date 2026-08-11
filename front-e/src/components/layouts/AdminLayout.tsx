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
    <div className="flex min-h-screen bg-light-bg">
      <LeftSidebar role="ADMIN" user={user} />

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-72 transition-all duration-300">
        <div className="p-4 md:p-8 pt-20 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
