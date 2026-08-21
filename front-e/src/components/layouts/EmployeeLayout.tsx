'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import LeftSidebar from './LeftSidebar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface EmployeeLayoutProps {
  children: React.ReactNode;
  pendingJobsCount?: number;
}

export default function EmployeeLayout({ children, pendingJobsCount }: EmployeeLayoutProps) {
  const { user, isLoading } = useAuth('EMPLOYEE');

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex min-h-screen bg-cream">
      <LeftSidebar role="EMPLOYEE" user={user} pendingJobsCount={pendingJobsCount} />

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 transition-all duration-300">
        <div className="p-4 md:p-8 pt-20 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
