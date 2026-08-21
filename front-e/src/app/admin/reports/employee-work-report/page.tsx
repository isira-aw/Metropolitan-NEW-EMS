'use client';

import { useState, useEffect } from 'react';
import { reportService, userService } from '@/lib/services/admin.service';
import {
  EmployeeWorkReportDTO,
  DailyWorkRecord,
  User,
  UserRole,
} from '@/types';
import AdminLayout from '@/components/layouts/AdminLayout';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate, formatDateTime, formatMinutes } from '@/lib/utils/format';
import {
  Calendar,
  Clock,
  TrendingUp,
  Award,
  Briefcase,
  MapPin,
  Star,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export default function EmployeeWorkReportPage() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    null
  );
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [report, setReport] = useState<EmployeeWorkReportDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load employees on mount
  useEffect(() => {
    loadEmployees();
    // Set default date range (current month)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await userService.getEmployees({
        page: 0,
        size: 1000,
      });
      setEmployees(response.content);
    } catch (err: any) {
      console.error('Failed to load employees:', err);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedEmployeeId || !startDate || !endDate) {
      setError('Please select an employee and date range');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await reportService.getEmployeeWorkReport(
        selectedEmployeeId,
        startDate,
        endDate
      );
      setReport(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate report');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto space-y-4 pb-10">
      <div>
        <h1 className="text-2xl font-black text-black tracking-tighter uppercase">
          Employee Work Report
        </h1>
        <p className="text-black/50 text-xs font-black uppercase tracking-widest italic mt-0.5">
          Comprehensive work report including attendance, jobs, and performance scores
        </p>
      </div>

      {/* Report Filters */}
      <Card className="p-4 border-brand/20 shadow-sm rounded-xl bg-cream">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Employee Selection */}
          <div>
            <label className="block text-xs font-black text-black/60 uppercase tracking-widest mb-1.5">
              Employee
            </label>
            <select
              value={selectedEmployeeId || ''}
              onChange={(e) =>
                setSelectedEmployeeId(
                  e.target.value ? Number(e.target.value) : null
                )
              }
              className="w-full px-3 py-2.5 bg-brand/5 border-none rounded-xl text-sm font-bold text-black focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.email})
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-black text-black/60 uppercase tracking-widest mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-brand/5 border-none rounded-xl text-sm font-bold text-black focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-black text-black/60 uppercase tracking-widest mb-1.5">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-brand/5 border-none rounded-xl text-sm font-bold text-black focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>

          {/* Generate Button */}
          <div className="flex items-end">
            <button
              onClick={handleGenerateReport}
              disabled={loading || !selectedEmployeeId}
              className="w-full px-4 py-2.5 bg-brand text-cream rounded-xl font-black uppercase text-xs tracking-widest hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-bold">
            {error}
          </div>
        )}
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {/* Report Display */}
      {!loading && report && (
        <div className="space-y-3">
          {/* Report Header */}
          <Card className="p-4 border-brand/20 shadow-sm rounded-xl bg-cream">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h2 className="text-xl font-black text-black uppercase tracking-tight">
                  {report.employeeName}
                </h2>
                <p className="text-black/60 text-sm font-bold">{report.employeeEmail}</p>
                <p className="text-xs font-bold text-black/50 mt-1">
                  Report Period: {formatDate(report.reportStartDate)} to{' '}
                  {formatDate(report.reportEndDate)}
                </p>
              </div>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-cream border border-brand/30 text-black rounded-xl font-black uppercase text-xs hover:bg-brand/10 transition-all print:hidden"
              >
                Print Report
              </button>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5 mt-3">
              <div className="bg-brand/5 border border-brand/10 p-3 rounded-xl">
                <div className="flex items-center text-brand mb-1.5">
                  <Calendar className="w-4 h-4 mr-1.5" />
                  <span className="text-xs font-black uppercase tracking-widest">Days Worked</span>
                </div>
                <p className="text-xl font-black text-black">
                  {report.summary.totalDaysWorked}
                </p>
              </div>

              <div className="bg-brand/5 border border-brand/10 p-3 rounded-xl">
                <div className="flex items-center text-brand mb-1.5">
                  <Clock className="w-4 h-4 mr-1.5" />
                  <span className="text-xs font-black uppercase tracking-widest">Total Hours</span>
                </div>
                <p className="text-xl font-black text-black">
                  {formatMinutes(report.summary.totalWorkMinutes)}
                </p>
              </div>

              <div className="bg-brand/5 border border-brand/10 p-3 rounded-xl">
                <div className="flex items-center text-brand mb-1.5">
                  <TrendingUp className="w-4 h-4 mr-1.5" />
                  <span className="text-xs font-black uppercase tracking-widest">OT Hours</span>
                </div>
                <p className="text-xl font-black text-black">
                  {formatMinutes(report.summary.totalOtMinutes)}
                </p>
              </div>

              <div className="bg-brand/5 border border-brand/10 p-3 rounded-xl">
                <div className="flex items-center text-brand mb-1.5">
                  <Briefcase className="w-4 h-4 mr-1.5" />
                  <span className="text-xs font-black uppercase tracking-widest">Jobs Done</span>
                </div>
                <p className="text-xl font-black text-black">
                  {report.summary.totalJobsCompleted}
                </p>
              </div>

              <div className="bg-brand/5 border border-brand/10 p-3 rounded-xl">
                <div className="flex items-center text-brand mb-1.5">
                  <Award className="w-4 h-4 mr-1.5" />
                  <span className="text-xs font-black uppercase tracking-widest">Avg Score</span>
                </div>
                <p className="text-xl font-black text-black">
                  {report.summary.overallAverageScore.toFixed(1)}
                </p>
              </div>

              <div className="bg-brand/5 border border-brand/10 p-3 rounded-xl">
                <div className="flex items-center text-brand mb-1.5">
                  <Star className="w-4 h-4 mr-1.5" />
                  <span className="text-xs font-black uppercase tracking-widest">Total Points</span>
                </div>
                <p className="text-xl font-black text-black">
                  {report.summary.totalWeightedScore}
                </p>
              </div>
            </div>
          </Card>

          {/* Daily Records */}
          <div className="space-y-2.5">
            <h3 className="text-base font-black text-black uppercase tracking-tight">
              Daily Work Records
            </h3>

            {report.dailyRecords.map((day: DailyWorkRecord) => (
              <Card key={day.date} className="p-3.5 border-brand/20 shadow-sm rounded-xl bg-cream">
                <div className="border-b border-brand/10 pb-2.5 mb-2.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-black text-black uppercase">
                        {formatDate(day.date)}
                      </h4>
                      <div className="flex gap-4 mt-1 text-xs font-bold text-black/60">
                        <span>
                          Check-in:{' '}
                          {day.checkInTime
                            ? new Date(day.checkInTime).toLocaleTimeString()
                            : 'N/A'}
                        </span>
                        <span>
                          Check-out:{' '}
                          {day.checkOutTime
                            ? new Date(day.checkOutTime).toLocaleTimeString()
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-black/60">
                        Work: {formatMinutes(day.totalWorkMinutes)} | OT:{' '}
                        {formatMinutes(day.totalOtMinutes)}
                      </div>
                      {day.dailyScore && (
                        <div className="text-xs font-black text-brand mt-1">
                          Daily Score: {day.dailyScore} (Avg:{' '}
                          {day.dailyAverageScore?.toFixed(1)})
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Jobs for this day */}
                {day.jobs.length > 0 ? (
                  <div className="space-y-2">
                    {day.jobs.map((job) => (
                      <div
                        key={job.miniJobCardId}
                        className="bg-brand/5 border border-brand/10 p-3 rounded-xl"
                      >
                        <div className="flex justify-between items-start mb-1.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-black">
                                {job.ticketNumber}
                              </span>
                              <StatusBadge status={job.jobStatus as any} />
                              {job.approved && (
                                <CheckCircle className="w-4 h-4 text-brand" />
                              )}
                              {job.scored && (
                                <Star className="w-4 h-4 text-brand fill-current" />
                              )}
                            </div>
                            <p className="text-xs font-bold text-black/70 mt-1">
                              {job.ticketTitle}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-black text-black">
                              {formatMinutes(job.workMinutes)} worked
                            </div>
                            {job.scored && (
                              <div className="text-xs font-bold text-brand mt-1">
                                Score: {job.weight} {'⭐'.repeat(job.weight)}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs font-bold text-black/60 mt-1.5">
                          <div className="flex items-center">
                            <MapPin className="w-3.5 h-3.5 mr-1" />
                            {job.generatorName} - {job.generatorLocation}
                          </div>
                          <div className="bg-brand/10 px-2 py-0.5 rounded text-[11px] text-black">
                            {job.jobType}
                          </div>
                          <div className="bg-brand/10 px-2 py-0.5 rounded text-[11px] text-black">
                            Weight: {job.weight}
                          </div>
                        </div>

                        {!job.scored && job.approved && (
                          <div className="mt-1.5 flex items-center text-xs font-bold text-black/60">
                            <AlertCircle className="w-3.5 h-3.5 mr-1 text-brand" />
                            Approved but not scored yet
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-black/50 text-xs font-bold">
                    No jobs completed on this day
                  </p>
                )}
              </Card>
            ))}
          </div>

          {/* Summary Footer */}
          <Card className="p-4 border-brand/20 shadow-sm rounded-xl bg-cream">
            <h3 className="text-base font-black text-black uppercase tracking-tight mb-3">
              Period Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-black/50 text-xs font-bold uppercase tracking-wide">Total Work Time:</span>
                <p className="font-black text-black">
                  {formatMinutes(report.summary.totalWorkMinutes)}
                </p>
              </div>
              <div>
                <span className="text-black/50 text-xs font-bold uppercase tracking-wide">Total OT:</span>
                <p className="font-black text-black">
                  {formatMinutes(report.summary.totalOtMinutes)}
                </p>
              </div>
              <div>
                <span className="text-black/50 text-xs font-bold uppercase tracking-wide">Jobs Completed:</span>
                <p className="font-black text-black">
                  {report.summary.totalJobsCompleted}
                </p>
              </div>
              <div>
                <span className="text-black/50 text-xs font-bold uppercase tracking-wide">Jobs Scored:</span>
                <p className="font-black text-black">
                  {report.summary.totalJobsScored}
                </p>
              </div>
              <div>
                <span className="text-black/50 text-xs font-bold uppercase tracking-wide">Pending Scores:</span>
                <p className="font-black text-black">
                  {report.summary.totalJobsPending}
                </p>
              </div>
              <div>
                <span className="text-black/50 text-xs font-bold uppercase tracking-wide">Overall Average Score:</span>
                <p className="font-black text-black">
                  {report.summary.overallAverageScore.toFixed(2)} / 10
                </p>
              </div>
              {report.summary.maxDailyScore && (
                <div>
                  <span className="text-black/50 text-xs font-bold uppercase tracking-wide">Highest Daily Score:</span>
                  <p className="font-black text-black">
                    {report.summary.maxDailyScore}
                  </p>
                </div>
              )}
              {report.summary.minDailyScore && (
                <div>
                  <span className="text-black/50 text-xs font-bold uppercase tracking-wide">Lowest Daily Score:</span>
                  <p className="font-black text-black">
                    {report.summary.minDailyScore}
                  </p>
                </div>
              )}
              {report.summary.averageDailyScore && (
                <div>
                  <span className="text-black/50 text-xs font-bold uppercase tracking-wide">Average Daily Score:</span>
                  <p className="font-black text-black">
                    {report.summary.averageDailyScore.toFixed(1)}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* No Report State */}
      {!loading && !report && !error && (
        <Card className="border-brand/20 shadow-sm rounded-xl bg-cream">
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 text-brand/20 mx-auto mb-4" />
            <h3 className="text-lg font-black text-black uppercase mb-2">
              No Report Generated
            </h3>
            <p className="text-black/50 text-sm font-bold">
              Select an employee and date range, then click &quot;Generate
              Report&quot;
            </p>
          </div>
        </Card>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
      </div>
    </AdminLayout>
  );
}
