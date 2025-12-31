'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';

export default function AdminReportsPage() {
  const router = useRouter();
  const [reportType, setReportType] = useState('time-tracking');
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    loadEmployees();

    // Set default dates
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, [router]);

  const loadEmployees = async () => {
    try {
      const response = await apiClient.get('/admin/employees?size=100');
      setEmployees(response.data.content || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const generateReport = async () => {
    if (!startDate || !endDate) {
      alert('Please select date range');
      return;
    }

    setLoading(true);
    setReportData(null);

    try {
      let url = '';
      const params = new URLSearchParams({
        startDate,
        endDate,
      });

      if (selectedEmployee && reportType !== 'ot-by-generator') {
        params.append('employeeId', selectedEmployee);
      }

      if (reportType === 'time-tracking') {
        url = `/admin/reports/time-tracking?${params}`;
      } else if (reportType === 'ot') {
        url = `/admin/reports/ot?${params}`;
      } else if (reportType === 'ot-by-generator') {
        url = `/admin/reports/ot-by-generator?${params}`;
      }

      const response = await apiClient.get(url);
      setReportData(response.data);
    } catch (error: any) {
      alert('Error generating report: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const renderTimeTrackingReport = () => {
    if (!reportData || reportData.length === 0) {
      return <p>No data found for the selected period.</p>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left">Employee</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Start Time</th>
              <th className="p-3 text-left">End Time</th>
              <th className="p-3 text-right">Work (min)</th>
              <th className="p-3 text-right">Idle (min)</th>
              <th className="p-3 text-right">Travel (min)</th>
              <th className="p-3 text-right">Total (min)</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((row: any, index: number) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="p-3">{row.employeeName}</td>
                <td className="p-3">{row.date}</td>
                <td className="p-3">
                  {row.dayStartTime ? new Date(row.dayStartTime).toLocaleTimeString() : '-'}
                </td>
                <td className="p-3">
                  {row.dayEndTime ? new Date(row.dayEndTime).toLocaleTimeString() : '-'}
                </td>
                <td className="p-3 text-right">{row.workMinutes}</td>
                <td className="p-3 text-right">{row.idleMinutes}</td>
                <td className="p-3 text-right">{row.travelMinutes}</td>
                <td className="p-3 text-right font-semibold">{row.totalMinutes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderOTReport = () => {
    if (!reportData || reportData.length === 0) {
      return <p>No data found for the selected period.</p>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left">Employee</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-right">Morning OT (min)</th>
              <th className="p-3 text-right">Evening OT (min)</th>
              <th className="p-3 text-right">Total OT (min)</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((row: any, index: number) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="p-3">{row.employeeName}</td>
                <td className="p-3">{row.date}</td>
                <td className="p-3 text-right">{row.morningOtMinutes}</td>
                <td className="p-3 text-right">{row.eveningOtMinutes}</td>
                <td className="p-3 text-right font-semibold">{row.totalOtMinutes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderOTByGeneratorReport = () => {
    if (!reportData || !reportData.generatorWiseOT) {
      return <p>No data found for the selected period.</p>;
    }

    const generators = Object.keys(reportData.generatorWiseOT);

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left">Generator</th>
              <th className="p-3 text-right">Morning OT (min)</th>
              <th className="p-3 text-right">Evening OT (min)</th>
              <th className="p-3 text-right">Total OT (min)</th>
            </tr>
          </thead>
          <tbody>
            {generators.map((gen, index) => {
              const data = reportData.generatorWiseOT[gen];
              return (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-3">{gen}</td>
                  <td className="p-3 text-right">{data.morningOT}</td>
                  <td className="p-3 text-right">{data.eveningOT}</td>
                  <td className="p-3 text-right font-semibold">{data.totalOT}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Reports</h1>
          <button onClick={() => router.push('/admin/dashboard')} className="btn-secondary">
            Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="container mx-auto p-6">
        <h2 className="text-3xl font-bold mb-6">Generate Reports</h2>

        <div className="card mb-6">
          <h3 className="text-xl font-bold mb-4">Report Parameters</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Report Type *</label>
              <select
                className="input-field"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="time-tracking">Time Tracking Report</option>
                <option value="ot">OT Report</option>
                <option value="ot-by-generator">OT by Generator</option>
              </select>
            </div>

            {reportType !== 'ot-by-generator' && (
              <div>
                <label className="block text-gray-700 mb-2">Employee (Optional)</label>
                <select
                  className="input-field"
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                >
                  <option value="">All Employees</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-gray-700 mb-2">Start Date *</label>
              <input
                type="date"
                className="input-field"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">End Date *</label>
              <input
                type="date"
                className="input-field"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <button onClick={generateReport} className="btn-primary mt-4" disabled={loading}>
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>

        {reportData && (
          <div className="card">
            <h3 className="text-xl font-bold mb-4">
              {reportType === 'time-tracking' && 'Time Tracking Report'}
              {reportType === 'ot' && 'OT Report'}
              {reportType === 'ot-by-generator' && 'OT Report by Generator'}
            </h3>

            {reportType === 'time-tracking' && renderTimeTrackingReport()}
            {reportType === 'ot' && renderOTReport()}
            {reportType === 'ot-by-generator' && renderOTByGeneratorReport()}
          </div>
        )}
      </div>
    </div>
  );
}
