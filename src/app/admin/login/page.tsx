'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const customRes = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (customRes.ok) {
        const data = await customRes.json();
        if (data.success) {
          router.push('/admin/dashboard');
          return;
        }
      }

      setError('Invalid email or password. Access denied.');
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020204] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image src="/logo.svg" alt="Logo" width={80} height={80} className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#FFC300]">Admin Panel</h1>
          <p className="text-[#4A4945] text-sm mt-1">Battle of the Golds — Thomians&apos; Media</p>
        </div>

        {/* Card */}
        <div className="bg-[#08080c] border border-[#1a1a22] rounded-sm p-8 shadow-2xl">
          <h2 className="text-[#F0EDE6] font-semibold text-lg mb-6">Sign in to continue</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-3 mb-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Email/Password Login */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-[#8A8780] text-sm mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@thomiansmedia.com"
                className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-4 py-3 text-[#F0EDE6] placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300] transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-[#8A8780] text-sm mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-4 py-3 text-[#F0EDE6] placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300] transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FFC300] text-[#020204] font-semibold py-3 rounded-sm hover:bg-[#FFD54F] transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-[#4A4945] text-xs mt-6">
          Restricted access · Thomians&apos; Media Admin
        </p>
      </div>
    </div>
  );
}
