'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { reportService } from '@/lib/services/admin.service';
import { authService } from '@/lib/services/auth.service';
import AdminNav from '@/components/layouts/AdminNav';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { downloadCSV } from '@/lib/utils/format';

export default function AdminReports() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const role = authService.getRole();
    if (role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    setUser(authService.getStoredUser());
    
    // Set default dates (last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
    
    setLoading(false);
  }, [router]);

  const handleExportTimeTracking = async () => {
    try {
      const blob = await reportService.exportTimeTracking(startDate, endDate);
      downloadCSV(blob, `time-tracking-${startDate}-to-${endDate}.csv`);
    } catch (error: any) {
      alert('Error exporting report');
    }
  };

  const handleExportOvertime = async () => {
    try {
      const blob = await reportService.exportOvertime(startDate, endDate);
      downloadCSV(blob, `overtime-${startDate}-to-${endDate}.csv`);
    } catch (error: any) {
      alert('Error exporting report');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNav currentPage="Reports" user={user} />

      <div className="container mx-auto p-6">
        <h2 className="text-3xl font-bold mb-6">Reports & Analytics</h2>

        {/* Date Range Selector */}
        <Card className="mb-6">
          <h3 className="text-lg font-bold mb-4">Select Date Range</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </Card>

        {/* Export Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-bold mb-2">⏱️ Time Tracking Report</h3>
            <p className="text-sm text-gray-600 mb-4">Export employee work time, travel time, and idle time</p>
            <button onClick={handleExportTimeTracking} className="btn-primary w-full">
              📥 Export CSV
            </button>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-bold mb-2">⏰ Overtime Report</h3>
            <p className="text-sm text-gray-600 mb-4">Export morning and evening overtime by employee</p>
            <button onClick={handleExportOvertime} className="btn-primary w-full">
              📥 Export CSV
            </button>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-bold mb-2">📊 Dashboard Statistics</h3>
            <p className="text-sm text-gray-600 mb-4">View real-time system statistics</p>
            <button onClick={() => router.push('/admin/dashboard')} className="btn-secondary w-full">
              View Dashboard
            </button>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-bold mb-2">📈 Productivity Report</h3>
            <p className="text-sm text-gray-600 mb-4">Employee productivity metrics (View backend API)</p>
            <button className="btn-secondary w-full" disabled>
              Coming Soon
            </button>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-bold mb-2">🎯 Ticket Completion</h3>
            <p className="text-sm text-gray-600 mb-4">Ticket completion statistics (View backend API)</p>
            <button className="btn-secondary w-full" disabled>
              Coming Soon
            </button>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-bold mb-2">📅 Monthly Summary</h3>
            <p className="text-sm text-gray-600 mb-4">Comprehensive monthly report (View backend API)</p>
            <button className="btn-secondary w-full" disabled>
              Coming Soon
            </button>
          </Card>
        </div>

        <Card className="mt-6">
          <h3 className="text-lg font-bold mb-3">📝 Available Report Endpoints</h3>
          <p className="text-sm text-gray-600 mb-4">All backend report endpoints are integrated via the reportService. You can extend this page to show detailed analytics.</p>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>Time Tracking Report (Integrated ✅)</li>
            <li>Overtime Report (Integrated ✅)</li>
            <li>Overtime by Generator</li>
            <li>Employee Performance Scores</li>
            <li>Ticket Completion Statistics</li>
            <li>Employee Productivity Metrics</li>
            <li>Generator Service History</li>
            <li>Daily Attendance Summary</li>
            <li>Monthly Summary Report</li>
            <li>Dashboard Statistics (Integrated ✅)</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
