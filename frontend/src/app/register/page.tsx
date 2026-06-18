'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity, Globe, Shield, User, Key, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [clinicName, setClinicName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [identifier, setIdentifier] = useState(''); // Email or Phone
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic client validation
    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(subdomain)) {
      setError('Subdomain can only contain lowercase letters, numbers, and hyphens.');
      setLoading(false);
      return;
    }

    try {
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const payload: any = {
        clinicName: clinicName.trim(),
        subdomain: subdomain.trim().toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password,
      };

      if (identifier.includes('@')) {
        payload.email = identifier.trim().toLowerCase();
      } else {
        payload.phone = identifier.trim();
      }

      const response = await fetch(`${BASE_URL}/auth/clinic/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Registration failed. Please try again.');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/login`);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Onboarding failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-900 via-slate-800 to-teal-950 p-4">
        <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 text-center shadow-2xl space-y-6">
          <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <CheckCircle className="w-12 h-12 text-emerald-400 animate-bounce" />
          </div>
          <h2 className="text-2xl font-bold text-white">Clinic Onboarding Successful!</h2>
          <p className="text-slate-300 text-sm">
            Your clinic <span className="font-semibold text-teal-300">"{clinicName}"</span> has been initialized. You will be redirected to the login portal shortly.
          </p>
          <div className="text-xs text-slate-500">
            Redirecting to: <span className="underline">{subdomain}.clinicos.com</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-900 via-slate-800 to-teal-950 p-4 relative overflow-hidden">
      {/* Background Blur Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-lg bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl relative z-10 my-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20 mb-3">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Clinic OS Instance</h1>
          <p className="text-slate-400 text-xs mt-1">Deploy a tenant space for your doctors and staff</p>
        </div>

        {error && (
          <div className="bg-red-500/15 border border-red-500/30 rounded-lg p-3 flex items-start space-x-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <span className="text-red-300 text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="border-b border-slate-800 pb-3 mb-3">
            <h3 className="text-teal-400 text-xs font-bold uppercase tracking-wider mb-2">Clinic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-300 text-xs font-medium">Clinic Name</label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="e.g. Apollo Diagnostics"
                  required
                  className="w-full bg-slate-950/80 border border-slate-700/50 focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500 focus:outline-none rounded-lg px-3 py-2 text-white placeholder-slate-600 text-xs transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 text-xs font-medium flex items-center">
                  <Globe className="w-3.5 h-3.5 mr-1 text-teal-400" />
                  Subdomain
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value)}
                    placeholder="e.g. apollo"
                    required
                    className="w-full bg-slate-950/80 border border-slate-700/50 focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500 focus:outline-none rounded-lg pl-3 pr-20 py-2 text-white placeholder-slate-600 text-xs transition-all"
                  />
                  <span className="absolute right-3 top-2 text-slate-500 text-xs font-medium">
                    .clinicos.com
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-teal-400 text-xs font-bold uppercase tracking-wider mb-2">Owner Credentials</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 text-xs font-medium flex items-center">
                    <User className="w-3.5 h-3.5 mr-1 text-teal-400" />
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Rajesh"
                    required
                    className="w-full bg-slate-950/80 border border-slate-700/50 focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500 focus:outline-none rounded-lg px-3 py-2 text-white placeholder-slate-600 text-xs transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 text-xs font-medium">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Kumar"
                    required
                    className="w-full bg-slate-950/80 border border-slate-700/50 focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500 focus:outline-none rounded-lg px-3 py-2 text-white placeholder-slate-600 text-xs transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 text-xs font-medium flex items-center">
                  <Shield className="w-3.5 h-3.5 mr-1 text-teal-400" />
                  Email or Phone Number
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. rajesh@clinic.com or 9876543210"
                  required
                  className="w-full bg-slate-950/80 border border-slate-700/50 focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500 focus:outline-none rounded-lg px-3 py-2 text-white placeholder-slate-600 text-xs transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 text-xs font-medium flex items-center">
                  <Key className="w-3.5 h-3.5 mr-1 text-teal-400" />
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  className="w-full bg-slate-950/80 border border-slate-700/50 focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500 focus:outline-none rounded-lg px-3 py-2 text-white placeholder-slate-600 text-xs transition-all"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold rounded-lg transition-all transform hover:scale-[1.01] shadow-lg shadow-teal-500/20 active:scale-95 flex items-center justify-center space-x-2 text-xs mt-4 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Onboarding Clinic...</span>
              </>
            ) : (
              <span>Deploy Clinic OS</span>
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-800/80 pt-4 text-center">
          <p className="text-slate-400 text-xs">
            Already have a clinic?{' '}
            <Link href="/login" className="text-teal-400 hover:text-teal-300 font-semibold transition-colors underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
