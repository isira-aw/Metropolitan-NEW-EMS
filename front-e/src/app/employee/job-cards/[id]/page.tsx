'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { jobCardService } from '@/lib/services/employee.service';
import { authService } from '@/lib/services/auth.service';
import { MiniJobCard, JobStatusLog, JobStatus } from '@/types';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDateTime, formatMinutes } from '@/lib/utils/format';

export default function JobCardDetail() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);
  
  const [loading, setLoading] = useState(true);
  const [jobCard, setJobCard] = useState<MiniJobCard | null>(null);
  const [logs, setLogs] = useState<JobStatusLog[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const role = authService.getRole();
    if (role !== 'EMPLOYEE') {
      router.push('/login');
      return;
    }

    setUser(authService.getStoredUser());
    loadJobCard();
    loadLogs();
  }, [id]);

  const loadJobCard = async () => {
    try {
      const data = await jobCardService.getById(id);
      setJobCard(data);
    } catch (error) {
      console.error('Error loading job card:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const data = await jobCardService.getLogs(id);
      setLogs(data);
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const updateStatus = async (newStatus: JobStatus) => {
    try {
      await jobCardService.updateStatus(id, { newStatus });
      loadJobCard();
      loadLogs();
      alert(`Status updated to ${newStatus}`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error updating status');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!jobCard) return <div className="p-6">Job card not found</div>;

  const canUpdateStatus = (status: JobStatus) => {
    const currentStatus = jobCard.status;
    if (currentStatus === 'PENDING') return ['TRAVELING', 'STARTED'].includes(status);
    if (currentStatus === 'TRAVELING') return ['STARTED', 'ON_HOLD'].includes(status);
    if (currentStatus === 'STARTED') return ['COMPLETED', 'ON_HOLD'].includes(status);
    if (currentStatus === 'ON_HOLD') return ['STARTED'].includes(status);
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-green-600 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">EMS Employee Portal</h1>
          <div className="flex items-center gap-6">
            <button onClick={() => router.push('/employee/dashboard')} className="hover:text-green-200">Dashboard</button>
            <button onClick={() => router.push('/employee/attendance')} className="hover:text-green-200">Attendance</button>
            <button onClick={() => router.push('/employee/job-cards')} className="hover:text-green-200">Job Cards</button>
            <div className="border-l border-green-400 pl-6 flex items-center gap-4">
              <span className="text-sm">👤 {user?.fullName}</span>
              <button onClick={() => authService.logout()} className="btn-secondary text-sm">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-6">
        <button onClick={() => router.push('/employee/job-cards')} className="btn-secondary mb-6">← Back to Job Cards</button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Job Card Details */}
          <div className="lg:col-span-2">
            <Card>
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{jobCard.mainTicket.title}</h2>
                <StatusBadge status={jobCard.status} />
              </div>

              <div className="space-y-3 mb-6">
                <p><strong>Ticket Number:</strong> {jobCard.mainTicket.ticketNumber}</p>
                <p><strong>Type:</strong> {jobCard.mainTicket.type}</p>
                <p><strong>Weight:</strong> {'⭐'.repeat(jobCard.mainTicket.weight)}</p>
                <p><strong>Description:</strong> {jobCard.mainTicket.description || 'N/A'}</p>
                <p><strong>Generator:</strong> {jobCard.mainTicket.generator.name} ({jobCard.mainTicket.generator.model})</p>
                <p><strong>Location:</strong> {jobCard.mainTicket.generator.locationName}</p>
                <p><strong>Work Time:</strong> {formatMinutes(jobCard.workMinutes)}</p>
                <p><strong>Approved:</strong> {jobCard.approved ? '✅ Yes' : '❌ No'}</p>
              </div>

              {/* Status Update Buttons */}
              {jobCard.status !== 'COMPLETED' && jobCard.status !== 'CANCEL' && (
                <div>
                  <h3 className="font-semibold mb-3">Update Status:</h3>
                  <div className="flex gap-2 flex-wrap">
                    {(['TRAVELING', 'STARTED', 'ON_HOLD', 'COMPLETED'] as JobStatus[]).map((status) => (
                      canUpdateStatus(status) && (
                        <button
                          key={status}
                          onClick={() => updateStatus(status)}
                          className="btn-primary"
                        >
                          {status}
                        </button>
                      )
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Activity Logs */}
          <div>
            <Card title="Activity Logs">
              <div className="space-y-3">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <div key={log.id} className="border-l-4 border-blue-500 pl-3 py-2">
                      <p className="font-semibold">{log.newStatus}</p>
                      <p className="text-sm text-gray-600">{formatDateTime(log.loggedAt)}</p>
                      {log.prevStatus && <p className="text-xs text-gray-500">From: {log.prevStatus}</p>}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No activity logs</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
