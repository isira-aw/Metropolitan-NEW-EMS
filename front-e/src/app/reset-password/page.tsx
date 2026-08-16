'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { KeyRound, Lock, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. No token provided.');
      setValidating(false);
      return;
    }

    // Validate token on mount
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      await api.get(`/password-reset/validate-token?token=${token}`);
      setTokenValid(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid or expired reset link.');
      setTokenValid(false);
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await api.post('/password-reset/reset-password', {
        token,
        newPassword,
      });

      setMessage(response.data.message);
      setNewPassword('');
      setConfirmPassword('');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="animate-spin text-corporate-blue" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-slate-900" />

      <div className="relative w-full max-w-[440px] px-6">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-[2rem] flex items-center justify-center border border-white/20 mb-4">
            <KeyRound size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase">
            Reset <span className="text-corporate-blue">Password</span>
          </h1>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-8 md:p-10 border border-slate-100">
          {!tokenValid ? (
            <div className="text-center py-2">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                <AlertCircle size={32} />
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-2">Invalid Link</h2>
              <p className="text-sm font-bold text-slate-500 mb-8">{error}</p>
              <Link
                href="/forgot-password"
                className="block w-full bg-slate-900 hover:bg-corporate-blue text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl transition-all"
              >
                Request New Reset Link
              </Link>
            </div>
          ) : message ? (
            <div className="text-center py-2">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-2">Password Reset</h2>
              <p className="text-sm font-bold text-slate-500 mb-2">{message}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Redirecting to login...
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-xl font-black text-slate-900">Set New Password</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mt-1">
                  Minimum 6 characters
                </p>
              </div>

              {error && (
                <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100 text-red-600">
                  <AlertCircle size={18} />
                  <p className="text-xs font-black uppercase tracking-tight">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-corporate-blue transition-all outline-none"
                      placeholder="Enter new password"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-corporate-blue transition-all outline-none"
                      placeholder="Confirm new password"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 hover:bg-corporate-blue text-white font-black uppercase tracking-[0.15em] py-5 rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>Resetting...</span>
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            </>
          )}

          <div className="mt-8 pt-6 border-t border-slate-50 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors"
            >
              <ArrowLeft size={14} />
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
          <Loader2 className="animate-spin text-corporate-blue" size={32} />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
