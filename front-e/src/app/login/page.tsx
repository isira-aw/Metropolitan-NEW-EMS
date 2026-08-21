'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { Lock, User, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/login', {
        username,
        password,
      }, { skipGlobalError: true });

      const { accessToken, refreshToken, role, fullName } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('role', role);
      localStorage.setItem('fullName', fullName);
      localStorage.setItem('username', username);

      router.push(role === 'ADMIN' ? '/admin/dashboard' : '/employee/dashboard');
    } catch (err: any) {
      setError('The credentials you entered are incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-brand" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-cream/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-[440px] px-6">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/MetropolitanLOGO.png"
            alt="Metropolitan"
            className="h-16 object-contain mb-4"
          />
        </div>

        {/* Login Card */}
        <div className="bg-cream rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-8 md:p-10 border border-brand/20">
          <div className="mb-8">
            <h2 className="text-xl font-black text-black">Sign In</h2>
            <p className="text-xs font-bold text-black/50 uppercase tracking-tight">Enter your system credentials</p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100 text-red-600">
              <AlertCircle size={18} />
              <p className="text-xs font-black uppercase tracking-tight">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-black/50 uppercase tracking-widest mb-2 ml-1">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-brand" size={18} />
                <input
                  type="text"
                  className="w-full bg-cream border-2 border-brand/30 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-black focus:border-brand transition-all outline-none"
                  placeholder="e.g. j.doe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-black/50 uppercase tracking-widest mb-2 ml-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full bg-cream border-2 border-brand/30 rounded-2xl py-4 pl-12 pr-12 text-sm font-bold text-black focus:border-brand transition-all outline-none"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-brand/70 hover:text-brand transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end pr-1">
              <Link
                href="/forgot-password"
                className="text-[10px] font-black text-black/50 hover:text-brand uppercase tracking-widest transition-colors"
              >
                Forgot Access?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand hover:-translate-y-0.5 hover:shadow-xl text-cream font-black uppercase tracking-[0.15em] py-5 rounded-2xl shadow-lg shadow-brand/20 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Authenticating...</span>
                </>
              ) : (
                'System Login'
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center">
          <p className="text-[10px] font-black text-black/60 uppercase tracking-[0.2em]">
            © 2026 Metropolitan EMS
          </p>
        </div>
      </div>
    </div>
  );
}