'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Activity, Shield, Key, Globe, AlertCircle, Loader } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [subdomain, setSubdomain] = useState('');
  const [identifier, setIdentifier] = useState(''); // Email or Phone
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      // 1. Resolve Clinic ID from Subdomain
      // We check via header first or query. Let's send a query to login endpoint
      // We will make a direct fetch to bypass the normal apiFetch since we don't have clinicId in localStorage yet
      const payload: any = { password };
      if (identifier.includes('@')) {
        payload.email = identifier.trim();
      } else {
        payload.phone = identifier.trim();
      }

      const response = await fetch(`${BASE_URL}/auth/login?clinicId=`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-clinic-id': '', // Will be resolved by subdomain
        },
        // To resolve the subdomain in the middleware, we pass it in the host or we can add a custom header
        // Since we are on localhost, we pass the subdomain in a custom header the middleware can read,
        // or we resolve it by first fetching the clinic by subdomain
        body: JSON.stringify({ ...payload, subdomain }),
      });

      // Wait, let's implement a clean resolver. First, let's query the database to get the clinic by subdomain!
      // Let's call a dedicated public endpoint on our backend to get the clinic by subdomain, OR pass x-clinic-id
      // Let's check how the middleware resolves subdomain:
      // const parts = host.split('.'); if parts.length > 1 -> clinic subdomain.
      // But in localhost, we can also pass subdomain as a query parameter or header!
      // In our TenantMiddleware, we checked:
      // 1) req.headers['x-clinic-id']
      // 2) req.query.clinicId
      // 3) subdomain from host
      // Let's first make a quick GET request to a public clinic resolver endpoint, or we can just pass the subdomain.
      // Wait, let's create a small public endpoint or simply query our database.
      // To make it extremely robust, let's do:
      // GET /auth/clinic-resolve?subdomain=apollo
      const resolveRes = await fetch(`${BASE_URL}/auth/clinic/resolve?subdomain=${subdomain.trim().toLowerCase()}`);
      if (!resolveRes.ok) {
        throw new Error('Clinic subdomain not found. Please check and try again.');
      }
      const clinicData = await resolveRes.json();
      const resolvedClinicId = clinicData.id;
      const resolvedClinicName = clinicData.name;

      // 2. Perform the Login request with the resolved clinicId
      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-clinic-id': resolvedClinicId,
        },
        body: JSON.stringify(payload),
      });

      if (!loginRes.ok) {
        const errorData = await loginRes.json().catch(() => ({}));
        throw new Error(errorData.message || 'Invalid credentials');
      }

      const loginData = await loginRes.json();

      // 3. Save to AuthContext
      login(
        loginData.accessToken,
        loginData.user,
        resolvedClinicId,
        resolvedClinicName,
        subdomain.trim().toLowerCase()
      );
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-900 via-slate-800 to-teal-950 p-4 relative overflow-hidden">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20 mb-4 animate-pulse">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-emerald-400">
            Clinic OS
          </h1>
          <p className="text-slate-400 text-sm mt-1">Unified Healthcare Management Portal</p>
        </div>

        {error && (
          <div className="bg-red-500/15 border border-red-500/30 rounded-lg p-3 flex items-start space-x-2 mb-6">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <span className="text-red-300 text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Subdomain Input */}
          <div className="space-y-1.5">
            <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider flex items-center">
              <Globe className="w-3.5 h-3.5 mr-1.5 text-teal-400" />
              Clinic Subdomain
            </label>
            <div className="relative">
              <input
                type="text"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                placeholder="e.g. apollo"
                required
                className="w-full bg-slate-950/80 border border-slate-700/50 focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500 focus:outline-none rounded-lg px-3 py-2.5 text-white placeholder-slate-500 text-sm transition-all"
              />
              <span className="absolute right-3 top-2.5 text-slate-500 text-sm font-medium">
                .clinicos.com
              </span>
            </div>
          </div>

          {/* Identifier Input */}
          <div className="space-y-1.5">
            <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider flex items-center">
              <Shield className="w-3.5 h-3.5 mr-1.5 text-teal-400" />
              Email or Phone Number
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="doctor@clinic.com or 9876543210"
              required
              className="w-full bg-slate-950/80 border border-slate-700/50 focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500 focus:outline-none rounded-lg px-3 py-2.5 text-white placeholder-slate-500 text-sm transition-all"
            />
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider flex items-center">
              <Key className="w-3.5 h-3.5 mr-1.5 text-teal-400" />
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-slate-950/80 border border-slate-700/50 focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500 focus:outline-none rounded-lg px-3 py-2.5 text-white placeholder-slate-500 text-sm transition-all"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold rounded-lg transition-all transform hover:scale-[1.01] shadow-lg shadow-teal-500/20 active:scale-95 flex items-center justify-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="mt-8 border-t border-slate-800/80 pt-6 text-center">
          <p className="text-slate-400 text-xs">
            Want to start your own clinic?{' '}
            <Link
              href="/register"
              className="text-teal-400 hover:text-teal-300 font-semibold transition-colors underline underline-offset-4"
            >
              Register your Clinic
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
