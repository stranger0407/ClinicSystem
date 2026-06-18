'use client';

import React from 'react';
import Link from 'next/link';
import { Activity, Shield, CheckCircle, Users, FileText, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/40 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/10">
            <Activity className="w-5.5 h-5.5 text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-200 to-emerald-400">
            Clinic OS
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white text-sm font-bold rounded-lg transition-all"
          >
            Onboard Clinic
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16 max-w-4xl mx-auto relative">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
          The Digital Operating System for{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-emerald-400">
            Solo Doctors & Clinics
          </span>
        </h1>
        <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mb-8 leading-relaxed">
          Manage appointments, write secure prescriptions, coordinate billing, and maintain complete patient history—scaffolded for high-frequency Indian clinic environments.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 w-full max-w-sm sm:max-w-md">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold rounded-xl transition-all flex items-center justify-center space-x-2 group"
          >
            <span>Register Your Clinic</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-white font-bold rounded-xl transition-all text-center"
          >
            Access Portal
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left w-full mt-8">
          <div className="p-6 bg-slate-950/40 border border-slate-800/80 rounded-xl">
            <div className="w-10 h-10 bg-teal-500/10 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-5 h-5 text-teal-400" />
            </div>
            <h3 className="font-bold text-white text-base mb-2">Secure Multi-Tenancy</h3>
            <p className="text-slate-400 text-sm">
              Strict database isolation keeps clinical data protected and segregated per clinic.
            </p>
          </div>

          <div className="p-6 bg-slate-950/40 border border-slate-800/80 rounded-xl">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="font-bold text-white text-base mb-2">Walk-ins & Slots</h3>
            <p className="text-slate-400 text-sm">
              Supports scheduled online slots alongside direct walk-in queue numbers.
            </p>
          </div>

          <div className="p-6 bg-slate-950/40 border border-slate-800/80 rounded-xl">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="font-bold text-white text-base mb-2">Unified Timeline</h3>
            <p className="text-slate-400 text-sm">
              One-click patient health charts consolidate history, vitals, and billing ledger.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-slate-500 text-xs">
        <p>© {new Date().getFullYear()} Clinic OS. Built for modern digital healthcare.</p>
      </footer>
    </div>
  );
}
