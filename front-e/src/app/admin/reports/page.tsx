'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { reportService, userService } from '@/lib/services/admin.service';
import AdminLayout from '@/components/layouts/AdminLayout';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  DailyTimeTrackingReportDTO,
  EmployeeDailyWorkTimeReportDTO,
  LocationPoint,
  User,
} from '@/types';
import {
  Calendar,
  User as UserIcon,
  FileText,
  TrendingUp,
  Clock,
  MapPin,
  X,
  ChevronRight,
  BarChart3,
  Map,
  ExternalLink
} from 'lucide-react';

export default function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<User[]>([]);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

  // Reports data
  const [timeTrackingReport, setTimeTrackingReport] = useState<DailyTimeTrackingReportDTO[]>([]);
  const [workTimeReport, setWorkTimeReport] = useState<EmployeeDailyWorkTimeReportDTO[]>([]);

  // UI states
  const [loadingReport1, setLoadingReport1] = useState(false);
  const [loadingReport2, setLoadingReport2] = useState(false);
  const [showReport1, setShowReport1] = useState(false);
  const [showReport2, setShowReport2] = useState(false);

  useEffect(() => {
    loadEmployees();
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
    setLoading(false);
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await userService.getEmployees({ page: 0, size: 1000 });
      setEmployees(response.content);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleGenerateReport1 = async () => {
    if (!startDate || !endDate) return alert('Please select date range');
    setLoadingReport1(true);
    try {
      const employeeId = selectedEmployee ? parseInt(selectedEmployee) : undefined;
      const data = await reportService.getDailyTimeTracking(startDate, endDate, employeeId);
      setTimeTrackingReport(data);
      setShowReport1(true);
      setShowReport2(false);
    } catch (error: any) {
      alert('Error generating report: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoadingReport1(false);
    }
  };

  const handleGenerateReport2 = async () => {
    if (!startDate || !endDate) return alert('Please select date range');
    if (!selectedEmployee) return alert('Please select an employee');
    setLoadingReport2(true);
    try {
      const data = await reportService.getEmployeeDailyWorkTime(parseInt(selectedEmployee), startDate, endDate);
      setWorkTimeReport(data);
      setShowReport2(true);
      setShowReport1(false);
    } catch (error: any) {
      alert('Error generating report: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoadingReport2(false);
    }
  };

  const formatTime = (datetime?: string) => {
    if (!datetime) return 'N/A';
    return new Date(datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDateLabel = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatMinutesLocal = (minutes: number) => {
    if (!minutes || minutes === 0) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const generateMapUrl = (locationPath?: LocationPoint[]) => {
    if (!locationPath || locationPath.length === 0) return null;
    const coords = locationPath
      .map(point => `${point.latitude},${point.longitude}`)
      .join('/');
    return `https://www.google.com/maps/dir/${coords}`;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto space-y-4 pb-10">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-black text-black tracking-tighter uppercase">Analytics & Reports</h2>
          <p className="text-xs font-black text-black/50 uppercase tracking-widest italic mt-0.5">Operational Performance Insights</p>
        </div>

        {/* Filters Card */}
        <Card className="p-4 border-brand/20 shadow-sm rounded-xl bg-cream">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-black/60 uppercase tracking-widest flex items-center gap-2">
                <UserIcon size={16} className="text-brand" /> Target Personnel
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full bg-brand/5 border-none rounded-xl p-2.5 text-sm font-bold text-black focus:ring-2 focus:ring-brand/30 appearance-none"
              >
                <option value="">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-black/60 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={16} className="text-brand" /> From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-brand/5 border-none rounded-xl p-2.5 text-sm font-bold text-black focus:ring-2 focus:ring-brand/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-black/60 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={16} className="text-brand" /> To Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-brand/5 border-none rounded-xl p-2.5 text-sm font-bold text-black focus:ring-2 focus:ring-brand/30"
              />
            </div>
          </div>
        </Card>

        {/* Report Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleGenerateReport1}
            disabled={loadingReport1}
            className="group text-left p-5 bg-cream border-2 border-brand/20 rounded-xl shadow-sm hover:shadow-md hover:border-brand transition-all relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="p-3 bg-brand/10 rounded-xl group-hover:bg-brand/20 transition-colors">
                <Clock className="text-brand" size={28} />
              </div>
              <ChevronRight className="text-brand/20 group-hover:text-brand group-hover:translate-x-2 transition-all" />
            </div>
            <h3 className="text-lg font-black text-black uppercase tracking-tight mb-1.5">Daily Time Tracking</h3>
            <p className="text-sm font-bold text-black/50 leading-relaxed uppercase">Log of start/end times, location, and productivity metrics.</p>
            {loadingReport1 && <div className="absolute inset-0 bg-cream/70 backdrop-blur-sm flex items-center justify-center font-black uppercase text-xs text-black">Processing...</div>}
          </button>

          <button
            onClick={handleGenerateReport2}
            disabled={loadingReport2 || !selectedEmployee}
            className={`group text-left p-5 bg-cream border-2 rounded-xl shadow-sm transition-all relative overflow-hidden ${!selectedEmployee ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md hover:border-brand border-brand/20'}`}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="p-3 bg-brand/10 rounded-xl group-hover:bg-brand/20 transition-colors">
                <TrendingUp className="text-brand" size={28} />
              </div>
              <ChevronRight className="text-brand/20 group-hover:text-brand group-hover:translate-x-2 transition-all" />
            </div>
            <h3 className="text-lg font-black text-black uppercase tracking-tight mb-1.5">Performance & OT Report</h3>
            <p className="text-sm font-bold text-black/50 leading-relaxed uppercase">Overtime calculation and weight points for individual employees.</p>
            {!selectedEmployee && <div className="mt-3 text-[10px] font-black text-red-500 uppercase italic">Select an employee to unlock</div>}
            {loadingReport2 && <div className="absolute inset-0 bg-cream/70 backdrop-blur-sm flex items-center justify-center font-black uppercase text-xs text-black">Processing...</div>}
          </button>
        </div>

        {/* Results Section */}
        {(showReport1 || showReport2) && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="p-0 border-brand/20 shadow-sm rounded-xl bg-cream overflow-hidden">
              <div className="p-4 border-b border-brand/10 flex justify-between items-center bg-brand/5">
                <div className="flex items-center gap-3">
                   <div className="p-2.5 bg-cream rounded-xl shadow-sm border border-brand/10"><FileText size={22} className="text-brand" /></div>
                   <div>
                     <h3 className="text-lg font-black text-black uppercase tracking-tighter">Generated Data</h3>
                     <p className="text-[10px] font-black text-black/50 uppercase tracking-[0.2em]">{formatDateLabel(startDate)} — {formatDateLabel(endDate)}</p>
                   </div>
                </div>
                <button onClick={() => { setShowReport1(false); setShowReport2(false); }} className="p-2 hover:bg-cream rounded-xl transition-colors border border-brand/20 text-black/50 hover:text-red-500"><X size={20} /></button>
              </div>

              {/* Report 1 Table */}
              {showReport1 && (
                <div className="p-4">
                  {timeTrackingReport.length === 0 ? (
                    <div className="py-16 text-center"><BarChart3 size={40} className="mx-auto text-brand/20 mb-3" /><p className="font-black text-black/40 uppercase">No data for this range</p></div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-brand text-cream">
                            {['Employee', 'Date', 'Shift', 'Location', 'Working', 'Idle', 'Travel', 'Total', 'Location Map'].map((h) => (
                              <th key={h} className="px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand/10">
                          {timeTrackingReport.map((row, i) => {
                            const mapUrl = generateMapUrl(row.locationPath);
                            return (
                              <tr key={i} className="hover:bg-brand/10 transition-colors">
                                <td className="px-3 py-2.5 text-xs font-black text-black uppercase">{row.employeeName}</td>
                                <td className="px-3 py-2.5 text-xs font-bold text-black/70">{formatDateLabel(row.date)}</td>
                                <td className="px-3 py-2.5">
                                  <div className="text-[10px] font-black text-brand uppercase">{formatTime(row.startTime)}</div>
                                  <div className="text-[10px] font-black text-black/30 uppercase">{formatTime(row.endTime)}</div>
                                </td>
                                <td className="px-3 py-2.5 text-xs font-bold text-black/70 flex items-center gap-1"><MapPin size={14} className="text-black/30" /> {row.location || '—'}</td>
                                <td className="px-3 py-2.5 text-xs font-black text-black">{formatMinutesLocal(row.dailyWorkingMinutes)}</td>
                                <td className="px-3 py-2.5 text-xs font-black text-black/60">{formatMinutesLocal(row.idleMinutes)}</td>
                                <td className="px-3 py-2.5 text-xs font-black text-black/60">{formatMinutesLocal(row.travelMinutes)}</td>
                                <td className="px-3 py-2.5 text-xs font-black text-black">{formatMinutesLocal(row.totalMinutes)}</td>
                                <td className="px-3 py-2.5">
                                  {mapUrl ? (
                                    <a
                                      href={mapUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand text-cream rounded-xl text-[10px] font-black uppercase hover:shadow-md transition-colors"
                                    >
                                      <Map size={12} />
                                      View Path
                                      <ExternalLink size={10} />
                                    </a>
                                  ) : (
                                    <span className="text-[10px] font-bold text-black/30 uppercase">No data</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Report 2 Content */}
              {showReport2 && (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Total Days', val: workTimeReport.length },
                      { label: 'Active Duty', val: formatMinutesLocal(workTimeReport.reduce((sum, r) => sum + r.workingMinutes, 0)) },
                      { label: 'Total OT', val: formatMinutesLocal(workTimeReport.reduce((sum, r) => sum + r.totalOtMinutes, 0)) },
                      { label: 'Weight Score', val: workTimeReport.reduce((sum, r) => sum + r.totalWeightEarned, 0) }
                    ].map((s, i) => (
                      <div key={i} className="bg-brand/5 p-3 rounded-xl border border-brand/10">
                        <p className="text-[10px] font-black text-black/50 uppercase tracking-widest mb-1">{s.label}</p>
                        <p className="text-xl font-black text-black">{s.val}</p>
                      </div>
                    ))}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-brand text-cream">
                          {['Date', 'Time In', 'Time Out', 'Morning OT', 'Evening OT', 'Work Hours', 'Weight'].map((h) => (
                            <th key={h} className="px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand/10">
                        {workTimeReport.map((row, i) => (
                          <tr key={i} className="hover:bg-brand/10 transition-colors">
                            <td className="px-3 py-2.5 text-xs font-black text-black uppercase">{formatDateLabel(row.date)}</td>
                            <td className="px-3 py-2.5 text-xs font-bold text-black/70">{formatTime(row.startTime)}</td>
                            <td className="px-3 py-2.5 text-xs font-bold text-black/70">{formatTime(row.endTime)}</td>
                            <td className="px-3 py-2.5 text-xs font-black text-black/70">{formatMinutesLocal(row.morningOtMinutes)}</td>
                            <td className="px-3 py-2.5 text-xs font-black text-black/70">{formatMinutesLocal(row.eveningOtMinutes)}</td>
                            <td className="px-3 py-2.5 text-xs font-black text-brand">{formatMinutesLocal(row.workingMinutes)}</td>
                            <td className="px-3 py-2.5"><span className="bg-brand/10 text-brand px-2.5 py-1 rounded-lg text-[10px] font-black uppercase">+{row.totalWeightEarned} pts</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
