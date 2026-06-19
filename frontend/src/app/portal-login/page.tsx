'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Shield, Key, AlertCircle, Loader, Lock } from 'lucide-react';

export default function PortalLoginPage() {
  const { login } = useAuth();
  const router = useRouter();
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

      const payload: any = { password };
      if (identifier.includes('@')) {
        payload.email = identifier.trim();
      } else {
        payload.phone = identifier.trim();
      }

      // 1. Resolve Clinic ID from default configuration
      const resolveRes = await fetch(`${BASE_URL}/auth/clinic/resolve`);
      if (!resolveRes.ok) {
        throw new Error('Clinic configuration not found. Please verify the system is seeded.');
      }
      const clinicData = await resolveRes.json();
      const resolvedClinicId = clinicData.id;
      const resolvedClinicName = clinicData.name;
      const resolvedSubdomain = clinicData.subdomain;

      // 2. Perform the Login request with the resolved clinicId
      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!loginRes.ok) {
        const errorData = await loginRes.json().catch(() => ({}));
        throw new Error(errorData.message || 'Invalid credentials');
      }

      const loginData = await loginRes.json();

      // Ensure patient roles cannot access the personnel portal
      if (loginData.user.role === 'PATIENT') {
        throw new Error('Patients must use the patient portal login page.');
      }

      // 3. Save to AuthContext
      login(
        loginData.accessToken,
        loginData.user,
        resolvedClinicId,
        resolvedClinicName,
        resolvedSubdomain
      );
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-955 via-slate-900 to-indigo-950 p-4 relative overflow-hidden">
      {/* Decorative Neon Blur Spheres */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-905 bg-opacity-40 backdrop-blur-2xl border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-teal-300 tracking-tight">
            Personnel Portal
          </h1>
          <p className="text-slate-405 text-xs mt-1.5 uppercase font-semibold tracking-widest text-center">
            Staff, Doctor & Owner Login Only
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/25 rounded-lg p-3 flex items-start space-x-2 mb-6">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <span className="text-red-350 text-xs">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Identifier Input */}
          <div className="space-y-1.5">
            <label className="text-slate-300 text-[10px] font-bold uppercase tracking-wider flex items-center">
              <Shield className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
              Username / Email / Phone
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. staff@clinic.com"
              required
              className="w-full bg-slate-950/90 border border-slate-800 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 focus:outline-none rounded-lg px-3 py-2.5 text-white placeholder-slate-600 text-xs transition-all"
            />
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-slate-300 text-[10px] font-bold uppercase tracking-wider flex items-center">
              <Key className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
              Secret Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-slate-955/90 border border-slate-800 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 focus:outline-none rounded-lg px-3 py-2.5 text-white placeholder-slate-600 text-xs transition-all"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-bold rounded-lg transition-all transform hover:scale-[1.01] shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center justify-center space-x-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Authenticating Portal...</span>
              </>
            ) : (
              <span>Authorize Access</span>
            )}
          </button>
        </form>

        <div className="mt-8 border-t border-slate-900 pt-6 text-center">
          <p className="text-slate-500 text-[10px] uppercase tracking-wider">
            Protected Medical System. Authorized Personnel Only.
          </p>
        </div>
      </div>
    </div>
  );
}
