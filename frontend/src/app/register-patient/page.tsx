'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity, Globe, Shield, User, Key, CheckCircle, AlertCircle, Loader, Calendar } from 'lucide-react';

export default function RegisterPatientPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('MALE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resolvedClinicName, setResolvedClinicName] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number.');
      setLoading(false);
      return;
    }

    try {
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      // 1. Resolve clinic subdomain
      const resolveRes = await fetch(`${BASE_URL}/auth/clinic/resolve`);
      if (!resolveRes.ok) {
        throw new Error('Clinic context not found. Please verify the name and try again.');
      }
      const clinicData = await resolveRes.json();
      const resolvedClinicId = clinicData.id;
      setResolvedClinicName(clinicData.name);

      // 2. Register patient user
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        password,
        role: 'PATIENT',
        dob: dob || undefined,
        gender: gender || undefined,
      };

      const response = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-clinic-id': resolvedClinicId,
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
      }, 3500);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
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
          <h2 className="text-2xl font-bold text-white">Patient Portal Registered!</h2>
          <p className="text-slate-300 text-sm">
            Your patient portal credentials have been successfully registered under <span className="font-semibold text-teal-300">"{resolvedClinicName}"</span>.
          </p>
          <p className="text-xs text-slate-400">
            If you have existing visit history under this mobile number, your records have been automatically linked. Redirecting to login portal...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-900 via-slate-800 to-teal-950 p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-lg bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl relative z-10 my-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20 mb-3 animate-pulse">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-emerald-400">
            Patient Registration & Claim
          </h1>
          <p className="text-slate-400 text-xs mt-1">Register credentials or access your existing clinical history</p>
        </div>

        {error && (
          <div className="bg-red-500/15 border border-red-500/30 rounded-lg p-3 flex items-start space-x-2 mb-4">
            <AlertCircle className="w-4.5 h-4.5 text-red-400 shrink-0 mt-0.5" />
            <span className="text-red-300 text-xs">{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4 text-slate-300">

          {/* Names */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center">
                <User className="w-3.5 h-3.5 mr-1.5 text-teal-400" />
                First Name *
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Rajesh"
                required
                className="w-full bg-slate-950/80 border border-slate-700/50 focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500 focus:outline-none rounded-lg px-3 py-2 text-white placeholder-slate-500 text-xs transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center">
                <User className="w-3.5 h-3.5 mr-1.5 text-teal-400" />
                Last Name *
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Kumar"
                required
                className="w-full bg-slate-950/80 border border-slate-700/50 focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500 focus:outline-none rounded-lg px-3 py-2 text-white placeholder-slate-500 text-xs transition-all"
              />
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center">
                <Shield className="w-3.5 h-3.5 mr-1.5 text-teal-400" />
                Mobile / Phone *
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876500001"
                required
                className="w-full bg-slate-950/80 border border-slate-700/50 focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500 focus:outline-none rounded-lg px-3 py-2 text-white placeholder-slate-500 text-xs transition-all"
              />
              <span className="text-[8px] text-slate-500 block leading-tight">Must match the number given to clinic staff to link records.</span>
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rajesh@gmail.com (Optional)"
                className="w-full bg-slate-950/80 border border-slate-700/50 focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500 focus:outline-none rounded-lg px-3 py-2 text-white placeholder-slate-500 text-xs transition-all"
              />
            </div>
          </div>

          {/* DOB & Gender */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-teal-400" />
                Date of Birth *
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
                className="w-full bg-slate-950/80 border border-slate-700/50 focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500 focus:outline-none rounded-lg px-3 py-2 text-white placeholder-slate-500 text-xs transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
                Gender *
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                required
                className="w-full bg-slate-950/80 border border-slate-700/50 focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500 focus:outline-none rounded-lg px-3 py-2 text-white text-xs transition-all"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center">
              <Key className="w-3.5 h-3.5 mr-1.5 text-teal-400" />
              Set Password *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••••••• (Min. 6 characters)"
              required
              minLength={6}
              className="w-full bg-slate-950/80 border border-slate-700/50 focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500 focus:outline-none rounded-lg px-3 py-2 text-white placeholder-slate-500 text-xs transition-all"
            />
          </div>

          {/* Register Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold rounded-lg transition-all transform hover:scale-[1.01] shadow-lg shadow-teal-500/20 active:scale-95 flex items-center justify-center space-x-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Registering Account...</span>
              </>
            ) : (
              <span>Register Patient Portal</span>
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-800/80 pt-4 text-center">
          <p className="text-slate-400 text-xs">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-teal-400 hover:text-teal-300 font-semibold transition-colors underline underline-offset-4"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
