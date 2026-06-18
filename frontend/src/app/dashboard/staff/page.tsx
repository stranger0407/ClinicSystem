'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/utils/api';
import {
  Users,
  Search,
  UserPlus,
  ArrowRightLeft,
  Calendar,
  CreditCard,
  LogOut,
  Activity,
  AlertTriangle,
  CheckCircle,
  FileText,
  User,
  Info,
  Clock,
  Phone,
  ChevronRight,
  TrendingUp,
  Loader
} from 'lucide-react';

export default function StaffDashboard() {
  const { user, clinic, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  // Tab state: 'patients', 'appointments', 'billing', 'merge'
  const [activeTab, setActiveTab] = useState('patients');

  // Search & Register State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientTimeline, setPatientTimeline] = useState<any | null>(null);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // New Patient Form
  const [newPatient, setNewPatient] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dob: '',
    gender: 'MALE',
    address: '',
    allergies: '',
    chronicConditions: '',
  });
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<any | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Merge State
  const [mergeSourceId, setMergeSourceId] = useState('');
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [merging, setMerging] = useState(false);
  const [mergeError, setMergeError] = useState('');
  const [mergeSuccess, setMergeSuccess] = useState(false);

  // Redirect if not authenticated or unauthorized role
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'STAFF' && user.role !== 'OWNER') {
        // Redirect doctors/patients to their own dashboard
        router.push(`/dashboard/${user.role.toLowerCase()}`);
      }
    }
  }, [user, authLoading]);

  // Search Trigger
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const results = await apiFetch(`/patient/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchResults(results);
    } catch (err: any) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  // View timeline
  const viewTimeline = async (patientId: string) => {
    setSelectedPatientId(patientId);
    setLoadingTimeline(true);
    try {
      const data = await apiFetch(`/patient/${patientId}/timeline`);
      setPatientTimeline(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingTimeline(false);
    }
  };

  // Register Patient
  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    setRegisterSuccess(false);
    setRegistering(true);

    try {
      const payload = {
        ...newPatient,
        allergies: newPatient.allergies.split(',').map((a) => a.trim()).filter(Boolean),
        chronicConditions: newPatient.chronicConditions.split(',').map((c) => c.trim()).filter(Boolean),
      };

      const res = await apiFetch('/patient', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setRegisterSuccess(true);
      setNewPatient({
        firstName: '',
        lastName: '',
        phone: '',
        dob: '',
        gender: 'MALE',
        address: '',
        allergies: '',
        chronicConditions: '',
      });
      // Refresh search results
      setSearchQuery(payload.firstName);
      const refreshResults = await apiFetch(`/patient/search?q=${encodeURIComponent(payload.firstName)}`);
      setSearchResults(refreshResults);
    } catch (err: any) {
      // Handle custom duplicate body exception from backend
      try {
        const errObj = JSON.parse(err.message);
        if (errObj && errObj.isDuplicate) {
          setRegisterError(errObj);
        } else {
          setRegisterError({ message: err.message });
        }
      } catch {
        setRegisterError({ message: err.message });
      }
    } finally {
      setRegistering(false);
    }
  };

  // Execute Merge
  const handleMerge = async (e: React.FormEvent) => {
    e.preventDefault();
    setMergeError('');
    setMergeSuccess(false);
    setMerging(true);

    try {
      await apiFetch('/patient/merge', {
        method: 'POST',
        body: JSON.stringify({
          sourcePatientId: mergeSourceId.trim(),
          targetPatientId: mergeTargetId.trim(),
        }),
      });

      setMergeSuccess(true);
      setMergeSourceId('');
      setMergeTargetId('');
      setSelectedPatientId(null);
      setSearchResults([]);
      setSearchQuery('');
    } catch (err: any) {
      setMergeError(err.message || 'Failed to merge patient records');
    } finally {
      setMerging(false);
    }
  };

  if (authLoading || !user || (user.role !== 'STAFF' && user.role !== 'OWNER')) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-teal-400">
        <Loader className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col justify-between shrink-0 p-5 border-r border-slate-800">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 bg-teal-500 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base block tracking-tight">Clinic OS</span>
              <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">
                {clinic?.name || 'Default Clinic'}
              </span>
            </div>
          </div>

          {/* User badge */}
          <div className="p-3 bg-slate-800/50 rounded-xl flex items-center space-x-3 border border-slate-700/30">
            <div className="w-8 h-8 bg-teal-500/20 border border-teal-500/30 text-teal-300 font-bold rounded-lg flex items-center justify-center text-sm uppercase">
              {user.firstName[0]}
              {user.lastName[0]}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate">{user.firstName} {user.lastName}</p>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold block">
                {user.role}
              </span>
            </div>
          </div>

          {/* Nav items */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('patients')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'patients'
                  ? 'bg-teal-500 text-white shadow-md shadow-teal-500/10'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Patients master</span>
            </button>

            <button
              onClick={() => setActiveTab('appointments')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'appointments'
                  ? 'bg-teal-500 text-white shadow-md shadow-teal-500/10'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Appointments & Queue</span>
            </button>

            <button
              onClick={() => setActiveTab('billing')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'billing'
                  ? 'bg-teal-500 text-white shadow-md shadow-teal-500/10'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Ledger & Billing</span>
            </button>

            <button
              onClick={() => setActiveTab('merge')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'merge'
                  ? 'bg-teal-500 text-white shadow-md shadow-teal-500/10'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Merge duplicates</span>
            </button>
          </nav>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-400 hover:bg-red-500/15 hover:text-red-400 transition-colors mt-8"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-6xl">
        {/* TAB 1: Patients Master */}
        {activeTab === 'patients' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Patient master database</h1>
                <p className="text-slate-500 text-xs mt-0.5">Register, search, and manage patient files and history.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Search and results list */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center">
                    <Search className="w-4 h-4 mr-2 text-teal-600" />
                    Universal patient search
                  </h3>
                  <form onSubmit={handleSearch} className="flex space-x-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by first/last name or phone number..."
                      className="flex-1 bg-slate-50 border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none rounded-lg px-3 py-2 text-xs transition-all placeholder-slate-400"
                    />
                    <button
                      type="submit"
                      disabled={searching}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg px-4 py-2 flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                    >
                      {searching ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <span>Search</span>}
                    </button>
                  </form>
                </div>

                {/* Search Results list */}
                {searchResults.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-100 px-4 py-3">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        Search results ({searchResults.length})
                      </span>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                      {searchResults.map((pat) => (
                        <div
                          key={pat.id}
                          onClick={() => viewTimeline(pat.id)}
                          className={`p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors ${
                            selectedPatientId === pat.id ? 'bg-teal-50/50 hover:bg-teal-50/70 border-l-4 border-teal-500' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 font-bold uppercase">
                              {pat.firstName[0]}
                              {pat.lastName[0]}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-800">
                                {pat.firstName} {pat.lastName}
                              </h4>
                              <p className="text-[10px] text-slate-500 flex items-center space-x-2 mt-0.5">
                                <span className="flex items-center">
                                  <Phone className="w-3 h-3 mr-1" />
                                  {pat.phone}
                                </span>
                                <span>•</span>
                                <span>DOB: {new Date(pat.dob).toLocaleDateString()}</span>
                                <span>•</span>
                                <span className="uppercase">{pat.gender}</span>
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected Patient Timeline View */}
                {selectedPatientId && (
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
                    {loadingTimeline ? (
                      <div className="flex items-center justify-center py-12 text-teal-500">
                        <Loader className="w-8 h-8 animate-spin" />
                      </div>
                    ) : patientTimeline ? (
                      <div className="space-y-6">
                        {/* Header details */}
                        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-teal-500/10 text-teal-700 rounded-xl flex items-center justify-center font-bold text-lg uppercase">
                              {patientTimeline.firstName[0]}
                              {patientTimeline.lastName[0]}
                            </div>
                            <div>
                              <h2 className="text-lg font-black text-slate-900">
                                {patientTimeline.firstName} {patientTimeline.lastName}
                              </h2>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Phone: <span className="font-semibold">{patientTimeline.phone}</span> | DOB:{' '}
                                <span className="font-semibold">
                                  {new Date(patientTimeline.dob).toLocaleDateString()}
                                </span>{' '}
                                | Gender: <span className="font-semibold uppercase">{patientTimeline.gender}</span>
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setMergeTargetId(patientTimeline.id);
                              setActiveTab('merge');
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg px-2.5 py-1.5 flex items-center space-x-1 transition-colors"
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                            <span>Set as merge target</span>
                          </button>
                        </div>

                        {/* Medical Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-amber-50/40 border border-amber-200/50 rounded-xl p-4">
                            <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center">
                              <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                              Allergies
                            </h4>
                            {patientTimeline.allergies?.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {patientTimeline.allergies.map((a: string, i: number) => (
                                  <span key={i} className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-semibold">
                                    {a}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-slate-400 text-xs italic">No allergies recorded</p>
                            )}
                          </div>

                          <div className="bg-indigo-50/40 border border-indigo-200/50 rounded-xl p-4">
                            <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2 flex items-center">
                              <Info className="w-3.5 h-3.5 mr-1.5" />
                              Chronic conditions
                            </h4>
                            {patientTimeline.chronicConditions?.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {patientTimeline.chronicConditions.map((c: string, i: number) => (
                                  <span key={i} className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-[10px] font-semibold">
                                    {c}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-slate-400 text-xs italic">No chronic conditions recorded</p>
                            )}
                          </div>
                        </div>

                        {/* Clinical History Timeline */}
                        <div className="space-y-4">
                          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-teal-600" />
                            Clinical Encounters ({patientTimeline.encounters?.length || 0})
                          </h3>

                          {patientTimeline.encounters?.length > 0 ? (
                            <div className="relative border-l-2 border-slate-150 pl-4 ml-2 space-y-6">
                              {patientTimeline.encounters.map((enc: any) => (
                                <div key={enc.id} className="relative space-y-2">
                                  {/* Timeline marker */}
                                  <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 bg-teal-500 rounded-full border border-white"></div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-slate-500 font-bold">
                                      {new Date(enc.createdAt).toLocaleString()}
                                    </span>
                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
                                      Dr. {enc.doctor.user.firstName} {enc.doctor.user.lastName}
                                    </span>
                                  </div>
                                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2 text-xs">
                                    <p>
                                      <strong className="text-slate-700">Complaint:</strong> {enc.complaint}
                                    </p>
                                    <p>
                                      <strong className="text-slate-700">Diagnosis:</strong> {enc.diagnosis}
                                    </p>
                                    {enc.vitals && (
                                      <p className="text-[10px] text-slate-500 bg-white border border-slate-100 rounded px-2 py-1 flex flex-wrap gap-3 mt-1.5">
                                        <span>BP: {enc.vitals.bp || '--'}</span>
                                        <span>Pulse: {enc.vitals.pulse || '--'} bpm</span>
                                        <span>Temp: {enc.vitals.temp || '--'} °F</span>
                                        <span>Weight: {enc.vitals.weight || '--'} kg</span>
                                      </p>
                                    )}

                                    {/* Prescriptions */}
                                    {enc.prescriptions?.length > 0 && (
                                      <div className="mt-3 border-t border-slate-200/50 pt-2.5 space-y-1">
                                        <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider block">
                                          Prescribed medicines:
                                        </span>
                                        <div className="divide-y divide-slate-100 bg-white border border-slate-100 rounded-lg overflow-hidden">
                                          {enc.prescriptions.flatMap((p: any) => p.items).map((item: any) => (
                                            <div key={item.id} className="p-2 flex items-center justify-between text-[11px]">
                                              <div>
                                                <span className="font-bold text-slate-800">{item.medicine.name}</span>
                                                <span className="text-slate-400 ml-1.5">
                                                  ({item.medicine.strength}) - {item.dosage}
                                                </span>
                                              </div>
                                              <span className="text-slate-500 font-medium">{item.durationDays} days</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-slate-400 text-xs italic py-2">No past visits recorded</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-400 text-xs italic">Failed to load timeline details</p>
                    )}
                  </div>
                )}
              </div>

              {/* Onboard new patient form */}
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center">
                    <UserPlus className="w-4.5 h-4.5 mr-2 text-teal-600" />
                    Onboard new patient
                  </h3>

                  {registerSuccess && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 flex items-start space-x-2 mb-4">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-emerald-800 text-xs font-medium">Patient successfully registered!</span>
                    </div>
                  )}

                  {registerError && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 space-y-2.5 mb-4">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <span className="text-red-800 text-xs font-semibold">
                          {registerError.isDuplicate ? 'Duplicate patient record found' : registerError.message}
                        </span>
                      </div>
                      {registerError.isDuplicate && (
                        <div className="bg-white/60 border border-red-200 rounded p-2 text-[10px] space-y-1.5 text-slate-700">
                          <p>
                            <strong>Name:</strong> {registerError.existingPatient.firstName}{' '}
                            {registerError.existingPatient.lastName}
                          </p>
                          <p>
                            <strong>DOB:</strong> {new Date(registerError.existingPatient.dob).toLocaleDateString()}
                          </p>
                          <div className="flex space-x-2 pt-1 border-t border-red-100">
                            <button
                              type="button"
                              onClick={() => {
                                setMergeSourceId(registerError.existingPatient.id);
                                setActiveTab('merge');
                              }}
                              className="text-teal-600 hover:text-teal-700 font-bold uppercase tracking-wider"
                            >
                              Resolve / Merge
                            </button>
                            <span>|</span>
                            <button
                              type="button"
                              onClick={() => viewTimeline(registerError.existingPatient.id)}
                              className="text-slate-600 hover:text-slate-800 font-bold uppercase tracking-wider"
                            >
                              View profile
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <form onSubmit={handleRegisterPatient} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">First name</label>
                        <input
                          type="text"
                          value={newPatient.firstName}
                          required
                          onChange={(e) => setNewPatient({ ...newPatient, firstName: e.target.value })}
                          placeholder="Rajesh"
                          className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Last name</label>
                        <input
                          type="text"
                          value={newPatient.lastName}
                          required
                          onChange={(e) => setNewPatient({ ...newPatient, lastName: e.target.value })}
                          placeholder="Kumar"
                          className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Phone number</label>
                      <input
                        type="text"
                        value={newPatient.phone}
                        required
                        onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                        placeholder="9876543210"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Date of Birth</label>
                        <input
                          type="date"
                          value={newPatient.dob}
                          required
                          onChange={(e) => setNewPatient({ ...newPatient, dob: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Gender</label>
                        <select
                          value={newPatient.gender}
                          onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded-lg px-2 py-1.5 text-xs text-slate-700"
                        >
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Allergies (comma separated)</label>
                      <input
                        type="text"
                        value={newPatient.allergies}
                        onChange={(e) => setNewPatient({ ...newPatient, allergies: e.target.value })}
                        placeholder="e.g. Penicillin, Peanuts"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Chronic conditions (comma separated)</label>
                      <input
                        type="text"
                        value={newPatient.chronicConditions}
                        onChange={(e) => setNewPatient({ ...newPatient, chronicConditions: e.target.value })}
                        placeholder="e.g. Asthma, Diabetes"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Address</label>
                      <textarea
                        value={newPatient.address}
                        onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                        placeholder="Residential address details..."
                        rows={2}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={registering}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg py-2 text-xs transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50"
                    >
                      {registering ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <span>Onboard patient</span>}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Merge Center */}
        {activeTab === 'merge' && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
                <ArrowRightLeft className="w-6 h-6 mr-2 text-teal-600" />
                Duplicate resolution center
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Merge duplicate patient records, mapping all invoices, prescriptions, encounters, and documents under a single survivor record.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
              {mergeSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-emerald-800 text-xs font-bold">Merge completed successfully!</h4>
                    <p className="text-emerald-700 text-[10px] mt-0.5">
                      All relational data has been unified under the survivor patient record. The duplicate profile has been soft-deleted and archived.
                    </p>
                  </div>
                </div>
              )}

              {mergeError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <span className="text-red-800 text-xs font-semibold">{mergeError}</span>
                </div>
              )}

              <form onSubmit={handleMerge} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    Source Patient ID (Duplicate record to archive)
                  </label>
                  <input
                    type="text"
                    value={mergeSourceId}
                    required
                    onChange={(e) => setMergeSourceId(e.target.value)}
                    placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded-lg px-3 py-2 text-xs"
                  />
                  <span className="text-[9px] text-slate-400">
                    All visits, prescribing details, vitals, and billing ledger on this profile will be moved.
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    Target Patient ID (Survivor record to retain)
                  </label>
                  <input
                    type="text"
                    value={mergeTargetId}
                    required
                    onChange={(e) => setMergeTargetId(e.target.value)}
                    placeholder="e.g. 627192a0-481b-4cd4-b718-446655440111"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded-lg px-3 py-2 text-xs"
                  />
                  <span className="text-[9px] text-slate-400">
                    This profile will survive the merge. Check details carefully.
                  </span>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-amber-800 space-y-1">
                    <p className="font-bold">Important Notice:</p>
                    <p>
                      This operation is irreversible. Staging links will be permanently updated. The duplicate profile will be marked as merged and soft-deleted. A secure audit log will be created tracking this operator's ID.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={merging}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg py-2.5 text-xs transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50"
                >
                  {merging ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <span>Resolve & execute merge</span>}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Placeholder for Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Appointments & Live Queue</h1>
              <p className="text-slate-500 text-xs mt-0.5">Manage doctor availability, book appointments, and oversee walk-in queue numbers.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-sm font-bold text-slate-700">Appointments module ready to initialize</h3>
              <p className="text-slate-400 text-xs max-w-sm mx-auto mt-1">
                Phase 3 (Patient Master & Search) is fully functional. We will initialize the Slot booking and Walk-in Queue algorithms in Phase 4.
              </p>
            </div>
          </div>
        )}

        {/* Placeholder for Billing Tab */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Ledger & Invoices</h1>
              <p className="text-slate-500 text-xs mt-0.5">Collect fees, invoice consultation charges, check payment splits, and print receipts.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
              <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-sm font-bold text-slate-700">Billing module ready to initialize</h3>
              <p className="text-slate-400 text-xs max-w-sm mx-auto mt-1">
                The billing ledger operations and printable invoicing layouts will be constructed in Phase 6.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
