'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { jobCardService } from '@/lib/services/employee.service';
import { MiniJobCard, JobStatusLog, JobStatus } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { formatDateTime, formatMinutes } from '@/lib/utils/format';
import { Star, CheckCircle, Clock, MapPin, AlertTriangle, ChevronLeft, Camera, Shield, Info, ExternalLink, Check } from 'lucide-react';
import EmployeeLayout from '@/components/layouts/EmployeeLayout';

const STEPS: { key: JobStatus; label: string }[] = [
  { key: 'PENDING' as JobStatus, label: 'Pending' },
  { key: 'TRAVELING' as JobStatus, label: 'Traveling' },
  { key: 'STARTED' as JobStatus, label: 'Started' },
  { key: 'ON_HOLD' as JobStatus, label: 'On Hold' },
  { key: 'COMPLETED' as JobStatus, label: 'Completed' },
];

/** Horizontal linear progress stepper showing where the job stands. */
function JobProgressStepper({ status }: { status: JobStatus }) {
  if (status === 'CANCEL') {
    return (
      <div className="bg-cream border-2 border-brand/30 rounded-2xl p-4 flex items-center justify-center">
        <StatusBadge status={status} />
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="bg-cream border-2 border-brand/20 rounded-2xl p-5">
      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const isDone = i < currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center border-2 shrink-0 ${
                    isDone || isCurrent ? 'bg-brand border-brand' : 'bg-cream border-brand/30'
                  }`}
                >
                  {isDone ? (
                    <Check size={14} className="text-cream" />
                  ) : (
                    <span className={`text-[11px] font-black ${isCurrent ? 'text-cream' : 'text-brand/60'}`}>{i + 1}</span>
                  )}
                </div>
                <span
                  className={`text-[9px] font-black uppercase tracking-tight text-center ${
                    isCurrent ? 'text-brand' : isDone ? 'text-black/70' : 'text-black/30'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mb-4 ${i < currentIndex ? 'bg-brand' : 'bg-brand/20'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function JobCardDetail() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);

  const [loading, setLoading] = useState(true);
  const [jobCard, setJobCard] = useState<MiniJobCard | null>(null);
  const [logs, setLogs] = useState<JobStatusLog[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [confirmingStatus, setConfirmingStatus] = useState<JobStatus | null>(null);

  useEffect(() => {
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

  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            reject(new Error('Location permission denied. Please enable location access for this app.'));
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            reject(new Error('Could not determine your location. Please check your GPS signal and try again.'));
          } else {
            reject(new Error('Getting your location timed out. Please try again.'));
          }
        },
        { enableHighAccuracy: true, timeout: 20000 }
      );
    });
  };

  const updateStatus = async (newStatus: JobStatus) => {
    setGettingLocation(true);
    try {
      const loc = await getCurrentLocation();
      await jobCardService.updateStatus(id, {
        newStatus,
        latitude: loc.latitude,
        longitude: loc.longitude,
      });
      loadJobCard();
      loadLogs();
    } catch (error: any) {
      alert(error.message || 'Status update failed');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      await jobCardService.uploadImage(id, selectedFile);
      setSelectedFile(null);
      loadJobCard();
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><LoadingSpinner /></div>;
  if (!jobCard) return <div className="p-10 text-center font-black text-black">JOB NOT FOUND</div>;

  const canUpdateStatus = (status: JobStatus) => {
    const current = jobCard.status;
    if (current === 'PENDING') return ['TRAVELING', 'CANCEL'].includes(status);
    if (current === 'TRAVELING') return ['STARTED', 'CANCEL'].includes(status);
    if (current === 'STARTED') return ['COMPLETED', 'ON_HOLD', 'CANCEL'].includes(status);
    if (current === 'ON_HOLD') return ['STARTED'].includes(status);
    return false;
  };

  return (
    <EmployeeLayout>
      <div className="max-w-[400px] md:max-w-3xl mx-auto px-4 py-4 space-y-5 overflow-x-hidden">

        {/* Top Action Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/employee/job-cards')}
            className="flex items-center gap-1 text-xs font-black text-black/60 uppercase tracking-widest hover:text-brand transition-colors min-h-[44px]"
          >
            <ChevronLeft size={16} /> Back
          </button>
          <StatusBadge status={jobCard.status} />
        </div>

        {/* Progress Stepper */}
        <JobProgressStepper status={jobCard.status} />

        {/* Header Card */}
        <div className="bg-cream border-2 border-brand/20 rounded-[1.5rem] p-6">
          <p className="text-[10px] font-black text-brand uppercase tracking-widest mb-1">
            Ticket #{jobCard.mainTicket.ticketNumber}
          </p>
          <h1 className="text-xl font-black text-black leading-tight mb-4">
            {jobCard.mainTicket.title}
          </h1>

          <div className="grid grid-cols-2 gap-4 py-4 border-y border-brand/10">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-black/40 uppercase">Work Complexity</p>
              <div className="flex gap-0.5">
                {[...Array(jobCard.mainTicket.weight)].map((_, i) => (
                  <Star key={i} size={14} className="text-brand fill-brand" />
                ))}
              </div>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[9px] font-black text-black/40 uppercase">Allocated Time</p>
              <div className="flex items-center justify-end gap-1.5 font-black text-black">
                <Clock size={14} className="text-brand" />
                <span className="text-xs">{formatMinutes(jobCard.workMinutes)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <div className="flex gap-3">
              <div className="mt-1"><Info size={16} className="text-brand" /></div>
              <div>
                <p className="text-[10px] font-black text-black/40 uppercase">Description</p>
                <p className="text-sm font-medium text-black/80 leading-relaxed">
                  {jobCard.mainTicket.description || 'No detailed description provided.'}
                </p>
              </div>
            </div>

            <div className="bg-brand/5 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] font-black text-black/40 uppercase">Equipment</p>
                <p className="text-sm font-bold text-black">{jobCard.mainTicket.generator.name}</p>
                <p className="text-[11px] text-black/50">{jobCard.mainTicket.generator.model}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-black/40 uppercase">Location</p>
                <p className="text-sm font-bold text-black">{jobCard.mainTicket.generator.locationName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Update Control Center */}
        {jobCard.status !== 'COMPLETED' && jobCard.status !== 'CANCEL' && (
          <div className="bg-brand rounded-[1.5rem] p-6 text-cream">
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-cream/20 p-2 rounded-lg">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest">Update Status</h3>
                <p className="text-[10px] opacity-80">Updates require GPS verification</p>
              </div>
            </div>

            {gettingLocation && (
              <div className="mb-4 bg-cream/10 border border-cream/30 rounded-xl p-3 flex items-center gap-3">
                <MapPin size={16} />
                <span className="text-xs font-bold uppercase tracking-tighter">Acquiring location...</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(['TRAVELING', 'STARTED', 'ON_HOLD', 'COMPLETED', 'CANCEL'] as JobStatus[]).map((status) =>
                canUpdateStatus(status) && (
                  <button
                    key={status}
                    onClick={() => setConfirmingStatus(status)}
                    disabled={gettingLocation}
                    className="py-4 min-h-[52px] rounded-xl text-sm font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 bg-cream text-black border-2 border-cream hover:opacity-90 disabled:opacity-30"
                  >
                    {status.replace('_', ' ')}
                  </button>
                )
              )}
            </div>

            <p className="mt-5 text-[9px] opacity-80 text-center font-bold uppercase tracking-tighter flex items-center justify-center gap-2">
              <AlertTriangle size={12} /> Your GPS location is logged with each update
            </p>
          </div>
        )}

        {/* Image Upload Area */}
        <div className="bg-cream border-2 border-brand/20 rounded-[1.5rem] p-6">
          <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2 text-black">
            <Camera size={18} className="text-brand" /> Job Photo Evidence
          </h3>

          {jobCard.imageUrl && (
            <div className="mb-6 rounded-2xl overflow-hidden border-4 border-brand/10">
              <img src={jobCard.imageUrl} alt="Review" className="w-full object-cover max-h-[300px]" />
            </div>
          )}

          <div className="space-y-4">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-brand/30 rounded-2xl cursor-pointer hover:bg-brand/5 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Camera size={24} className="text-brand/60 mb-2" />
                <p className="text-xs font-bold text-black/60 uppercase tracking-tighter text-center px-4">
                  {selectedFile ? selectedFile.name : 'Tap to Take Photo or Upload'}
                </p>
              </div>
              <input type="file" accept="image/*" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} className="hidden" />
            </label>

            {selectedFile && (
              <button
                onClick={handleImageUpload}
                disabled={uploading}
                className="w-full min-h-[52px] bg-brand text-cream border-2 border-brand py-4 rounded-xl text-sm font-black uppercase tracking-widest hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Submit Photo'}
              </button>
            )}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-cream border-2 border-brand/20 rounded-[1.5rem] p-6">
          <h3 className="text-sm font-black uppercase tracking-widest mb-6 text-black">Activity Timeline</h3>

          <div className="space-y-6">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="relative pl-6 border-l-2 border-brand/20 last:border-0">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 bg-cream border-2 border-brand rounded-full"></div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-black uppercase tracking-tight">{log.newStatus}</p>
                      <span className="text-[9px] font-bold text-black/40">{formatDateTime(log.loggedAt)}</span>
                    </div>

                    {log.latitude && (
                      <a
                        href={`https://www.google.com/maps?q=${log.latitude},${log.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[10px] font-bold text-brand hover:underline"
                      >
                        <MapPin size={10} /> Verified Location <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <p className="text-[10px] font-black text-black/30 uppercase">Waiting for first update</p>
              </div>
            )}
          </div>
        </div>

        {/* Verification Badge */}
        <div className="p-6 rounded-[1.5rem] border-2 border-brand/20 bg-cream flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-brand text-cream">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-black/40 uppercase">Verification</p>
            <p className="text-sm font-black uppercase text-black">
              {jobCard.approved ? 'Admin Approved' : 'Awaiting Review'}
            </p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmingStatus !== null}
        title="Confirm Status Change"
        message={
          confirmingStatus
            ? `Are you sure you want to change the status to "${confirmingStatus.replace('_', ' ')}"? This will be logged with your GPS location.`
            : ''
        }
        confirmLabel="Yes, Update"
        cancelLabel="Cancel"
        danger={confirmingStatus === 'CANCEL'}
        onConfirm={() => {
          const status = confirmingStatus;
          setConfirmingStatus(null);
          if (status) updateStatus(status);
        }}
        onCancel={() => setConfirmingStatus(null)}
      />
    </EmployeeLayout>
  );
}
