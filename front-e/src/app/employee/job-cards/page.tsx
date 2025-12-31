'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';

export default function EmployeeJobCardsPage() {
  const router = useRouter();
  const [jobCards, setJobCards] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'EMPLOYEE') {
      router.push('/login');
      return;
    }
    loadJobCards();
  }, [router]);

  const loadJobCards = async () => {
    try {
      const response = await apiClient.get('/employee/job-cards?size=50');
      setJobCards(response.data.content || []);
    } catch (error) {
      console.error('Error loading job cards:', error);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!selectedJob) return;

    // Get current location
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setLoading(true);
        try {
          await apiClient.put(`/employee/job-cards/${selectedJob.id}/status`, {
            newStatus,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          alert('Status updated successfully!');
          loadJobCards();
          setSelectedJob(null);
        } catch (error: any) {
          alert('Error updating status: ' + (error.response?.data?.message || error.message));
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        alert('Please enable location services to update status');
      }
    );
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      PENDING: 'bg-gray-200',
      TRAVELING: 'bg-blue-200',
      STARTED: 'bg-green-200',
      ON_HOLD: 'bg-yellow-200',
      COMPLETED: 'bg-purple-200',
      CANCEL: 'bg-red-200',
    };
    return colors[status] || 'bg-gray-200';
  };

  const getAvailableActions = (currentStatus: string) => {
    const actions: any = {
      PENDING: ['TRAVELING', 'CANCEL'],
      TRAVELING: ['STARTED', 'ON_HOLD', 'CANCEL'],
      STARTED: ['ON_HOLD', 'COMPLETED', 'CANCEL'],
      ON_HOLD: ['STARTED', 'CANCEL'],
      COMPLETED: [],
      CANCEL: [],
    };
    return actions[currentStatus] || [];
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-green-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Job Cards</h1>
          <button onClick={() => router.push('/employee/dashboard')} className="btn-secondary">
            Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="container mx-auto p-6">
        <h2 className="text-3xl font-bold mb-6">All Job Cards</h2>

        {selectedJob && (
          <div className="card mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">{selectedJob.mainTicket.ticketNumber}</h3>
                <p className="text-gray-600">{selectedJob.mainTicket.title}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {selectedJob.mainTicket.description}
                </p>
              </div>
              <button onClick={() => setSelectedJob(null)} className="text-red-600 text-xl">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Type</p>
                <p className="font-semibold">{selectedJob.mainTicket.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Weight</p>
                <p className="font-semibold">{'★'.repeat(selectedJob.mainTicket.weight)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Generator</p>
                <p className="font-semibold">{selectedJob.mainTicket.generator.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-semibold">{selectedJob.mainTicket.generator.locationName}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">Current Status</p>
              <span className={`px-3 py-1 rounded font-semibold ${getStatusColor(selectedJob.status)}`}>
                {selectedJob.status}
              </span>
            </div>

            {selectedJob.startTime && (
              <div className="mb-4">
                <p className="text-sm text-gray-600">Start Time</p>
                <p>{new Date(selectedJob.startTime).toLocaleString()}</p>
              </div>
            )}

            {selectedJob.endTime && (
              <div className="mb-4">
                <p className="text-sm text-gray-600">End Time</p>
                <p>{new Date(selectedJob.endTime).toLocaleString()}</p>
              </div>
            )}

            {selectedJob.workMinutes > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600">Work Time</p>
                <p className="font-semibold">{selectedJob.workMinutes} minutes</p>
              </div>
            )}

            <div className="mb-4">
              <p className="text-sm text-gray-600">Approved</p>
              <p>{selectedJob.approved ? '✓ Yes' : '✗ No'}</p>
            </div>

            <h4 className="font-bold mb-2">Update Status</h4>
            <div className="flex flex-wrap gap-2">
              {getAvailableActions(selectedJob.status).map((action: string) => (
                <button
                  key={action}
                  onClick={() => updateStatus(action)}
                  className={`px-4 py-2 rounded font-semibold ${getStatusColor(action)} hover:opacity-80`}
                  disabled={loading}
                >
                  {action}
                </button>
              ))}
            </div>

            {getAvailableActions(selectedJob.status).length === 0 && (
              <p className="text-gray-600">No actions available for this status</p>
            )}
          </div>
        )}

        <div className="card">
          <h3 className="text-xl font-bold mb-4">All Job Cards</h3>
          <div className="space-y-3">
            {jobCards.length > 0 ? (
              jobCards.map((card) => (
                <div
                  key={card.id}
                  className={`p-4 rounded ${getStatusColor(card.status)} cursor-pointer hover:opacity-80`}
                  onClick={() => setSelectedJob(card)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{card.mainTicket.ticketNumber}</p>
                      <p className="text-sm">{card.mainTicket.title}</p>
                      <p className="text-sm text-gray-600">
                        Generator: {card.mainTicket.generator.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Scheduled: {card.mainTicket.scheduledDate} at {card.mainTicket.scheduledTime}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 rounded text-sm font-semibold bg-white">
                        {card.status}
                      </span>
                      {card.approved && <p className="text-sm mt-1">✓ Approved</p>}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-600">No job cards assigned yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
