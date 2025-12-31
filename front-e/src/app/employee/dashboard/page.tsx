'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';

export default function EmployeeDashboard() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [dayStatus, setDayStatus] = useState<any>(null);
  const [jobCards, setJobCards] = useState<any[]>([]);

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'EMPLOYEE') {
      router.push('/login');
      return;
    }

    setFullName(localStorage.getItem('fullName') || '');
    loadDayStatus();
    loadJobCards();
  }, [router]);

  const loadDayStatus = async () => {
    try {
      const response = await apiClient.get('/employee/day/status');
      setDayStatus(response.data);
    } catch (error) {
      console.error('Error loading day status:', error);
    }
  };

  const loadJobCards = async () => {
    try {
      const response = await apiClient.get('/employee/job-cards?size=5');
      setJobCards(response.data.content || []);
    } catch (error) {
      console.error('Error loading job cards:', error);
    }
  };

  const handleStartDay = async () => {
    try {
      await apiClient.post('/employee/day/start');
      loadDayStatus();
      alert('Day started successfully!');
    } catch (error) {
      alert('Error starting day. Maybe already started?');
    }
  };

  const handleEndDay = async () => {
    try {
      await apiClient.post('/employee/day/end');
      loadDayStatus();
      alert('Day ended successfully!');
    } catch (error) {
      alert('Error ending day.');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
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

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-green-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">EMS Employee</h1>
          <div className="flex items-center gap-4">
            <span>Welcome, {fullName}</span>
            <button onClick={handleLogout} className="btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-6">
        <h2 className="text-3xl font-bold mb-6">My Dashboard</h2>

        <div className="card mb-6">
          <h3 className="text-xl font-bold mb-4">Day Status</h3>
          {dayStatus ? (
            <div>
              <p className="mb-2">
                <strong>Started:</strong> {new Date(dayStatus.dayStartTime).toLocaleString()}
              </p>
              {dayStatus.dayEndTime && (
                <p className="mb-2">
                  <strong>Ended:</strong> {new Date(dayStatus.dayEndTime).toLocaleString()}
                </p>
              )}
              <p className="mb-2">
                <strong>Morning OT:</strong> {dayStatus.morningOtMinutes || 0} minutes
              </p>
              <p className="mb-4">
                <strong>Evening OT:</strong> {dayStatus.eveningOtMinutes || 0} minutes
              </p>
              {!dayStatus.dayEndTime && (
                <button onClick={handleEndDay} className="btn-danger">
                  End Day
                </button>
              )}
            </div>
          ) : (
            <div>
              <p className="mb-4 text-gray-600">Day not started yet</p>
              <button onClick={handleStartDay} className="btn-primary">
                Start Day
              </button>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-xl font-bold mb-4">My Job Cards</h3>
          {jobCards.length > 0 ? (
            <div className="space-y-3">
              {jobCards.map((card) => (
                <div
                  key={card.id}
                  className={`p-4 rounded ${getStatusColor(card.status)} cursor-pointer hover:opacity-80`}
                  onClick={() => router.push(`/employee/job-cards/${card.id}`)}
                >
                  <p className="font-semibold">Ticket: {card.mainTicket.ticketNumber}</p>
                  <p className="text-sm">{card.mainTicket.title}</p>
                  <p className="text-sm">
                    <strong>Status:</strong> {card.status}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No job cards assigned yet</p>
          )}
          <button
            onClick={() => router.push('/employee/job-cards')}
            className="btn-primary mt-4"
          >
            View All Job Cards
          </button>
        </div>
      </div>
    </div>
  );
}
