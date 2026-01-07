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
import { User, Star, CheckCircle, X, MapPin, AlertTriangle } from 'lucide-react';

export default function JobCardDetail() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);

  const [loading, setLoading] = useState(true);
  const [jobCard, setJobCard] = useState<MiniJobCard | null>(null);
  const [logs, setLogs] = useState<JobStatusLog[]>([]);
  const [user, setUser] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [gettingLocation, setGettingLocation] = useState(false);

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

  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          let errorMessage = 'Unable to retrieve your location. ';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Please enable location permissions in your device settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage += 'The request to get your location timed out.';
              break;
            default:
              errorMessage += 'An unknown error occurred.';
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const updateStatus = async (newStatus: JobStatus) => {
    setGettingLocation(true);
    try {
      // Get current location first
      const location = await getCurrentLocation();

      // Update status with location
      await jobCardService.updateStatus(id, {
        newStatus,
        latitude: location.latitude,
        longitude: location.longitude,
      });

      loadJobCard();
      loadLogs();
      alert(`Status updated to ${newStatus}`);
    } catch (error: any) {
      // Show location errors (from browser geolocation API)
      if (error.message?.includes('location')) {
        alert(error.message);
      }
      // Backend errors are handled by global error handler in apiClient
      console.error('Error updating status:', error);
    } finally {
      setGettingLocation(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFile) {
      alert('Please select an image first');
      return;
    }

    setUploading(true);
    try {
      await jobCardService.uploadImage(id, selectedFile);
      alert('Image uploaded successfully');
      setSelectedFile(null);
      loadJobCard(); // Reload to get the updated imageUrl
    } catch (error: any) {
      // Error is already handled by global error handler in apiClient
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!jobCard) return <div className="p-6">Job card not found</div>;

  const canUpdateStatus = (status: JobStatus) => {
    const currentStatus = jobCard.status;
    if (currentStatus === 'PENDING') return ['TRAVELING', 'CANCEL'].includes(status);
    if (currentStatus === 'TRAVELING') return ['STARTED', 'CANCEL'].includes(status);
    if (currentStatus === 'STARTED') return ['COMPLETED', 'ON_HOLD', 'CANCEL'].includes(status);
    if (currentStatus === 'ON_HOLD') return ['STARTED'].includes(status);
    return false;
  };

  return (
    <div className="min-h-screen bg-light-bg">
      {/* Navigation */}
      <nav className="bg-corporate-blue text-white shadow-lg">
        <div className="container mx-auto px-4 py-3">
          {/* Mobile Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-lg sm:text-2xl font-bold">EMS Employee</h1>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-[#0F3A7A] rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6">
              <button onClick={() => router.push('/employee/dashboard')} className="hover:text-[#A0BFE0] transition-colors">Dashboard</button>
              <button className="font-bold">
                Job Cards
                {pendingCount > 0 && (
                  <span className="bg-red-500 px-2 py-1 rounded-full text-xs ml-2 animate-pulse">{pendingCount}</span>
                )}
              </button>
              <button onClick={() => router.push('/employee/attendance')} className="hover:text-[#A0BFE0] transition-colors">Attendance</button>

              <div className="border-l border-soft-blue pl-6 flex items-center gap-4">
                <span className="text-sm flex items-center gap-2">
                  <User size={18} />
                  {user?.fullName}
                </span>
                <button onClick={() => authService.logout()} className="px-3 py-1.5 bg-white text-corporate-blue rounded-lg hover:bg-[#E8F0FB] text-sm font-medium transition-colors">
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-4 pb-4 space-y-2 border-t border-soft-blue pt-4">
              <button
                onClick={() => { router.push('/employee/dashboard'); setMobileMenuOpen(false); }}
                className="block w-full text-left px-4 py-3 hover:bg-soft-blue rounded-lg transition-colors"
              >
                Dashboard
              </button>
              <button className="block w-full text-left px-4 py-3 font-bold bg-[#0F3A7A] rounded-lg">
                Job Cards
                {pendingCount > 0 && (
                  <span className="bg-red-500 px-2 py-1 rounded-full text-xs ml-2">{pendingCount}</span>
                )}
              </button>
              <button
                onClick={() => { router.push('/employee/attendance'); setMobileMenuOpen(false); }}
                className="block w-full text-left px-4 py-3 hover:bg-soft-blue rounded-lg transition-colors"
              >
                Attendance
              </button>

              <div className="border-t border-soft-blue pt-3 mt-3 px-4">
                <p className="text-sm mb-3 flex items-center gap-2">
                  <User size={18} />
                  {user?.fullName}
                </p>
                <button
                  onClick={() => authService.logout()}
                  className="w-full px-4 py-2 bg-white text-corporate-blue rounded-lg hover:bg-[#E8F0FB] font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="container mx-auto p-4 md:p-6">
        <button onClick={() => router.push('/employee/job-cards')} className="btn-secondary mb-6">← Back to Job Cards</button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Job Card Details */}
          <div className="lg:col-span-2">
            <Card>
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
                <h2 className="text-2xl font-bold text-pure-black">{jobCard.mainTicket.title}</h2>
                <StatusBadge status={jobCard.status} />
              </div>

              <div className="space-y-3 mb-6 text-pure-black">
                <p><strong>Ticket Number:</strong> {jobCard.mainTicket.ticketNumber}</p>
                <p><strong>Type:</strong> {jobCard.mainTicket.type}</p>
                <p className="flex items-center gap-2">
                  <strong>Weight:</strong>
                  <span className="flex items-center gap-1">
                    {Array.from({ length: jobCard.mainTicket.weight }).map((_, i) => (
                      <Star key={i} size={16} className="text-yellow-500 fill-yellow-500" />
                    ))}
                  </span>
                </p>
                <p><strong>Description:</strong> {jobCard.mainTicket.description || 'N/A'}</p>
                <p><strong>Generator:</strong> {jobCard.mainTicket.generator.name} ({jobCard.mainTicket.generator.model})</p>
                <p><strong>Location:</strong> {jobCard.mainTicket.generator.locationName}</p>
                <p><strong>Work Time:</strong> {formatMinutes(jobCard.workMinutes)}</p>
                <p className="flex items-center gap-2">
                  <strong>Approved:</strong>
                  {jobCard.approved ? (
                    <span className="flex items-center gap-1 text-corporate-blue">
                      <CheckCircle size={16} />
                      Yes
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-soft-blue">
                      <X size={16} />
                      No
                    </span>
                  )}
                </p>
              </div>

              {/* Status Update Buttons */}
              {jobCard.status !== 'COMPLETED' && jobCard.status !== 'CANCEL' && (
                <div>
                  <h3 className="font-semibold mb-3 text-pure-black">Update Status:</h3>
                  {gettingLocation && (
                    <div className="mb-3 p-3 bg-[#E8F0FB] border border-corporate-blue rounded-lg">
                      <p className="text-sm text-corporate-blue flex items-center gap-2">
                        <MapPin size={16} className="animate-pulse" />
                        Getting your current location...
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    {(['TRAVELING', 'STARTED', 'ON_HOLD', 'COMPLETED', 'CANCEL'] as JobStatus[]).map(
                      (status) =>
                        canUpdateStatus(status) && (
                          <button
                            key={status}
                            onClick={() => updateStatus(status)}
                            disabled={gettingLocation}
                            className={
                              status === 'CANCEL'
                                ? 'bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                                : 'btn-primary disabled:opacity-50 disabled:cursor-not-allowed'
                            }
                          >
                            {status}
                          </button>
                        )
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-2">
                    <AlertTriangle size={14} />
                    Location services must be enabled. Your location will be recorded with each status update.
                  </p>
                </div>
              )}


              {/* Image Upload Section */}
              <div className="mt-6 border-t pt-6">
                <h3 className="font-semibold mb-3 text-pure-black">Job Review Image</h3>

                {/* Display existing image if available */}
                {jobCard.imageUrl && (
                  <div className="mb-4">
                    <img
                      src={jobCard.imageUrl}
                      alt="Job card review"
                      className="max-w-full h-auto rounded-lg shadow-md border border-slate-200"
                      style={{ maxHeight: '400px' }}
                    />
                  </div>
                )}

                {/* Upload new image */}
                <div className="space-y-3">
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-slate-600
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-[#E8F0FB] file:text-corporate-blue
                        hover:file:bg-soft-blue hover:file:text-white transition-colors"
                    />
                  </div>

                  {selectedFile && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <span className="text-sm text-slate-600">
                        Selected: {selectedFile.name}
                      </span>
                      <button
                        onClick={handleImageUpload}
                        disabled={uploading}
                        className="btn-primary"
                      >
                        {uploading ? 'Uploading...' : jobCard.imageUrl ? 'Replace Image' : 'Upload Image'}
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-500 mt-2">
                  Upload one image for admin review. Maximum file size: 10MB
                </p>
              </div>
            </Card>
          </div>

          {/* Activity Logs */}
          <div>
            <Card title="Activity Logs">
              <div className="space-y-3">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <div key={log.id} className="border-l-4 border-corporate-blue pl-3 py-2 bg-[#F4F6F8] rounded-r-lg">
                      <p className="font-semibold text-pure-black">{log.newStatus}</p>
                      <p className="text-sm text-slate-600">{formatDateTime(log.loggedAt)}</p>
                      {log.prevStatus && <p className="text-xs text-slate-500">From: {log.prevStatus}</p>}
                      {log.latitude && log.longitude && (
                        <div className="mt-2 text-xs text-slate-600">
                          <p className="flex items-center gap-1">
                            <MapPin size={14} className="text-corporate-blue" />
                            Location: {log.latitude.toFixed(6)}, {log.longitude.toFixed(6)}
                          </p>
                          <a
                            href={`https://www.google.com/maps?q=${log.latitude},${log.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-corporate-blue hover:text-soft-blue hover:underline inline-flex items-center gap-1 mt-1 transition-colors"
                          >
                            View on Map →
                          </a>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">No activity logs</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
