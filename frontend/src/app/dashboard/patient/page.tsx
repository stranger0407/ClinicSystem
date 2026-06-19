'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/utils/api';
import {
  Calendar,
  Clock,
  User,
  Activity,
  FileText,
  CreditCard,
  LogOut,
  Plus,
  CheckCircle,
  AlertTriangle,
  Loader,
  Phone,
  BookOpen,
  Heart,
  Award,
  MapPin,
  Printer,
  X,
  Layers,
  ChevronRight,
  ShieldAlert,
  ArrowRightLeft,
  ArrowRight
} from 'lucide-react';

export default function PatientDashboard() {
  const { user, clinic, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  // Tab states: 'overview', 'doctors', 'book', 'history', 'billing'
  const [activeTab, setActiveTab] = useState('overview');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patientTimeline, setPatientTimeline] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Detail modals
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Booking states
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [bookingType, setBookingType] = useState<'SLOT' | 'WALK_IN'>('SLOT');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingInProgress, setBookingInProgress] = useState(false);
  
  const [slots, setSlots] = useState<any[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);

  const getLocalDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const isMorningSlot = (timeStr: string) => {
    const lower = timeStr.toLowerCase();
    if (lower.includes('am')) return true;
    if (lower.includes('pm')) {
      if (timeStr.startsWith('12')) return false;
      return false;
    }
    const hour = parseInt(timeStr.split(':')[0], 10);
    return hour < 12;
  };

  const morningSlots = slots.filter(s => isMorningSlot(s.time));
  const afternoonSlots = slots.filter(s => !isMorningSlot(s.time));

  // Load patient data
  const loadPatientData = async () => {
    if (!user?.profileId) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/patient/${user.profileId}/timeline`);
      setPatientTimeline(data);
      setAppointments(data.appointments || []);

      const docs = await apiFetch('/doctor');
      setDoctors(docs);
      if (docs.length > 0 && !selectedDoctorId) {
        setSelectedDoctorId(docs[0].id);
      }
    } catch (err) {
      console.error('Failed to load patient portal details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      if (user.role !== 'PATIENT') {
        // Route non-patients out of the patient dashboard
        router.push('/login');
        return;
      }
      loadPatientData();
    }
  }, [user, authLoading]);

  const fetchAvailableSlots = async () => {
    if (!selectedDoctorId || !bookingDate) {
      setSlots([]);
      return;
    }
    setSlotsLoading(true);
    setSelectedSlot(null);
    try {
      const data = await apiFetch(`/public/doctor/${selectedDoctorId}/slots?date=${bookingDate}`);
      setSlots(data);
    } catch (err: any) {
      console.error('Failed to fetch doctor slots:', err);
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableSlots();
  }, [selectedDoctorId, bookingDate]);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.profileId) return;
    setBookingError('');
    setBookingSuccess(false);
    setBookingInProgress(true);

    if (slots.length === 0) {
      setBookingError('Doctor is not available on this date. Booking is disabled.');
      setBookingInProgress(false);
      return;
    }

    try {
      const payload: any = {
        patientId: user.profileId,
        doctorId: selectedDoctorId,
        type: bookingType,
        isFollowUp: false,
        notes: bookingNotes,
      };

      if (bookingType === 'SLOT') {
        if (!selectedSlot) {
          throw new Error('Please select a time slot');
        }
        payload.startTime = selectedSlot.startTime;
      } else {
        payload.startTime = new Date(`${bookingDate}T00:00:00`).toISOString();
      }

      await apiFetch('/appointment', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setBookingSuccess(true);
      setBookingNotes('');
      setBookingTime('');
      setSelectedSlot(null);
      setActiveTab('overview');
      loadPatientData();
    } catch (err: any) {
      setBookingError(err.message || 'Failed to book appointment');
    } finally {
      setBookingInProgress(false);
    }
  };

  // Calculations for dashboard indicators
  const unpaidInvoices = patientTimeline?.invoices?.filter((i: any) => i.status !== 'PAID') || [];
  const totalOutstanding = unpaidInvoices.reduce((acc: number, curr: any) => acc + parseFloat(curr.total), 0);
  const totalInvoicesCount = patientTimeline?.invoices?.length || 0;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-teal-400">
        <div className="text-center space-y-3">
          <Loader className="mx-auto w-10 h-10 animate-spin" />
          <p className="text-slate-400 text-xs">Loading patient file details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice-modal, #printable-invoice-modal * {
            visibility: visible;
          }
          #printable-invoice-modal {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
        }
      `}} />

      {/* Sidebar Controls */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col justify-between shrink-0 p-5 border-r border-slate-800 print:hidden">
        <div className="space-y-7">
          {/* Logo */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 bg-teal-500 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-base block tracking-tight">Clinic OS</span>
                <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">
                  Patient Portal
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-slate-400 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* User badge */}
          <div className="p-3.5 bg-slate-800/50 rounded-xl flex items-center space-x-3 border border-slate-700/30">
            <div className="w-8 h-8 bg-teal-500/20 text-teal-300 font-black rounded-lg flex items-center justify-center text-xs uppercase border border-teal-500/30">
              {user?.firstName[0]}
              {user?.lastName[0]}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-black truncate">{user?.firstName} {user?.lastName}</p>
              <span className="text-[8px] text-slate-500 uppercase tracking-widest font-bold block mt-0.5">
                Record #{patientTimeline?.id?.slice(0, 8).toUpperCase() || 'NEW'}
              </span>
            </div>
          </div>

          {/* Nav items */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'overview'
                  ? 'bg-teal-500 text-white shadow-md shadow-teal-500/10'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Dashboard Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('doctors')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'doctors'
                  ? 'bg-teal-500 text-white shadow-md shadow-teal-500/10'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Consult Clinic Doctors</span>
            </button>

            <button
              onClick={() => setActiveTab('book')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'book'
                  ? 'bg-teal-500 text-white shadow-md shadow-teal-500/10'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'history'
                  ? 'bg-teal-500 text-white shadow-md shadow-teal-500/10'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Medical Visit History</span>
            </button>

            <button
              onClick={() => setActiveTab('billing')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'billing'
                  ? 'bg-teal-500 text-white shadow-md shadow-teal-500/10'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Billing & Payments Ledger</span>
            </button>
          </nav>
        </div>

        {/* Footer Clinic Label */}
        <div className="border-t border-slate-800/80 pt-4 mt-8">
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Subdomain Context</p>
          <p className="text-[10px] text-teal-400 font-medium truncate mt-0.5">{clinic?.subdomain}.clinicos.com</p>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-6xl w-full mx-auto print:p-0">
        {bookingSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center space-x-3 mb-6 print:hidden">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="text-emerald-950 font-bold text-xs">Appointment Request Successful!</span>
              <p className="text-[10px] text-emerald-700">Your appointment has been registered. You can check the details inside your overview panel.</p>
            </div>
          </div>
        )}

        {/* ================== TAB 1: OVERVIEW ================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 to-teal-950 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
              <div className="absolute top-1/2 right-10 -translate-y-1/2 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <h1 className="text-2xl font-black">Welcome, {user?.firstName}!</h1>
              <p className="text-slate-300 text-xs mt-2 leading-relaxed max-w-lg">
                This is your patient portal for <strong className="text-teal-300">{clinic?.name}</strong>. Here you can inspect clinical encounters, download prescriptions, view invoices, or book appointments.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Upcoming Visits</span>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-2xl font-black text-slate-900">
                    {appointments.filter((a) => a.status === 'BOOKED' || a.status === 'CHECKED_IN').length}
                  </span>
                  <Calendar className="w-5 h-5 text-teal-600" />
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Medical Encounters</span>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-2xl font-black text-slate-900">
                    {patientTimeline?.encounters?.length || 0}
                  </span>
                  <Activity className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Pending Due Balances</span>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-2xl font-black text-red-600">
                    ₹{totalOutstanding.toFixed(2)}
                  </span>
                  <CreditCard className="w-5 h-5 text-red-500" />
                </div>
              </div>
            </div>

            {/* Dashboard Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Scheduled appointments list */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-teal-600" />
                    Appointment Schedule
                  </h3>
                  <button
                    onClick={() => setActiveTab('book')}
                    className="text-[10px] bg-teal-50/80 hover:bg-teal-100 border border-teal-200 text-teal-700 font-bold px-2.5 py-1 rounded-lg transition-colors"
                  >
                    + Book appointment
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {appointments.length > 0 ? (
                    appointments.slice(0, 5).map((app) => (
                      <div key={app.id} className="py-3.5 flex justify-between items-center text-xs">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900">Dr. {app.doctor.user.firstName} {app.doctor.user.lastName}</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5 flex items-center space-x-2">
                              <span>{app.type === 'SLOT' ? 'Time Slot' : 'Walk-in'}</span>
                              <span>•</span>
                              {app.type === 'SLOT' ? (
                                <span>{new Date(app.startTime).toLocaleDateString()} at {new Date(app.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              ) : (
                                <span>Queue #{app.queueNumber}</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                          app.status === 'COMPLETED' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' :
                          app.status === 'CHECKED_IN' || app.status === 'IN_CONSULTATION' ? 'bg-teal-50 border border-teal-200 text-teal-700' :
                          app.status === 'CANCELLED' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-slate-100 border border-slate-200 text-slate-600'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-xs italic py-6 text-center">No appointments booked yet.</p>
                  )}
                </div>
              </div>

              {/* Right Column: Allergies / Conditions & Details */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
                <div>
                  <h3 className="text-[10px] text-slate-400 font-black uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center">
                    <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                    Allergies
                  </h3>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {patientTimeline?.allergies?.length > 0 ? (
                      patientTimeline.allergies.map((a: string, i: number) => (
                        <span key={i} className="bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 rounded text-[9px] font-bold">
                          {a}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 text-xs italic">No documented allergies.</span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] text-slate-400 font-black uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center">
                    <Heart className="w-3.5 h-3.5 mr-1.5 text-red-500" />
                    Chronic Conditions
                  </h3>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {patientTimeline?.chronicConditions?.length > 0 ? (
                      patientTimeline.chronicConditions.map((c: string, i: number) => (
                        <span key={i} className="bg-indigo-50 border border-indigo-200 text-indigo-800 px-2 py-0.5 rounded text-[9px] font-bold">
                          {c}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 text-xs italic">No chronic conditions.</span>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <h3 className="text-[10px] text-slate-500 font-black uppercase block border-b border-slate-100 pb-1.5">Registered Profile Info</h3>
                  <div className="text-xs space-y-2 mt-2 text-slate-700">
                    <p><strong className="text-slate-800">Phone:</strong> {patientTimeline?.phone}</p>
                    <p><strong className="text-slate-800">Gender:</strong> {patientTimeline?.gender}</p>
                    <p><strong className="text-slate-800">Date of Birth:</strong> {patientTimeline?.dob ? new Date(patientTimeline.dob).toLocaleDateString() : 'N/A'}</p>
                    <p><strong className="text-slate-800">Address:</strong> {patientTimeline?.address || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================== TAB 2: CLINIC DOCTORS ================== */}
        {activeTab === 'doctors' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Clinic Doctors</h1>
              <p className="text-slate-500 text-xs mt-0.5">Meet our specialists and medical consultants.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {doctors.map((doc) => (
                <div key={doc.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-tr from-teal-500/10 to-teal-500/20 text-teal-700 font-bold border border-teal-500/20 rounded-xl flex items-center justify-center text-lg uppercase shrink-0">
                      {doc.user.firstName[0]}
                      {doc.user.lastName[0]}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center">
                        Dr. {doc.user.firstName} {doc.user.lastName}
                        <Award className="w-4 h-4 text-teal-600 ml-1.5" />
                      </h3>
                      <p className="text-xs text-teal-600 font-semibold">{doc.specialty}</p>
                      <p className="text-[10px] text-slate-400">License No: {doc.licenseNo}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-700 grid grid-cols-2 gap-2.5">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold uppercase">Consultation Fee</span>
                      <strong className="text-slate-800 text-sm">₹{parseFloat(doc.fees).toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block font-bold uppercase">Session Duration</span>
                      <strong className="text-slate-800">{doc.durationMin} minutes</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedDoctorId(doc.id);
                      setActiveTab('book');
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 text-xs rounded-xl transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <span>Schedule Appointment</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================== TAB 3: BOOK APPOINTMENT ================== */}
        {activeTab === 'book' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Book Appointment</h1>
              <p className="text-slate-500 text-xs mt-0.5">Select a doctor and schedule your visit.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-xl">
              {bookingError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-800 text-xs mb-4">
                  {bookingError}
                </div>
              )}

              <form onSubmit={handleBookAppointment} className="space-y-4 text-slate-900">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Choose Doctor</label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded-lg px-3 py-2 text-xs text-slate-900"
                  >
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        Dr. {doc.user.firstName} {doc.user.lastName} ({doc.specialty}) — ₹{parseFloat(doc.fees).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase block">Booking Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setBookingType('SLOT')}
                      className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                        bookingType === 'SLOT'
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Preferred Slot Time
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingType('WALK_IN')}
                      className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                        bookingType === 'WALK_IN'
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Walk-in (Queue Mode)
                    </button>
                  </div>
                </div>

                {/* Horizontal Date Swiper */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Choose Appointment Date</label>
                  <div className="flex space-x-2 overflow-x-auto pb-2 pt-0.5 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    {Array.from({ length: 7 }).map((_, idx) => {
                      const d = new Date();
                      d.setDate(d.getDate() + idx);
                      const isoStr = getLocalDateString(d);
                      const isSelected = bookingDate === isoStr;
                      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                      const dayNum = d.getDate();
                      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
                      
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setBookingDate(isoStr)}
                          className={`flex-shrink-0 w-16 py-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-teal-600 border-teal-600 text-white font-bold shadow-lg shadow-teal-500/20'
                              : 'bg-slate-50 border-slate-200 hover:border-slate-350 text-slate-700'
                          }`}
                        >
                          <span className={`text-[9px] font-bold uppercase ${isSelected ? 'text-white/80' : 'text-slate-405'}`}>{dayName}</span>
                          <span className="text-sm font-black leading-tight my-0.5">{dayNum}</span>
                          <span className={`text-[8px] font-medium ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>{monthName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                              {/* Slots display */}
                {slotsLoading ? (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    <Loader className="w-5 h-5 animate-spin mx-auto text-teal-600 mb-1" />
                    Calculating available clinic slots...
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-red-200 bg-red-50/55 rounded-2xl text-red-750 text-xs p-4 space-y-1">
                    <p className="font-bold">Doctor is not available on this date.</p>
                    <p className="text-[10px] text-red-600">
                      The doctor is not working or has blocked off this date. Walk-in and slot bookings are disabled today.
                    </p>
                  </div>
                ) : (
                  <>
                    {bookingType === 'SLOT' ? (
                      <div className="space-y-3 pt-1">
                        <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          Available Time Slots
                        </label>
                        <div className="space-y-3">
                          {/* Morning Section */}
                          {morningSlots.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[9px] text-teal-600 font-bold uppercase tracking-wider flex items-center space-x-1">
                                <span>☀️ Morning</span>
                              </span>
                              <div className="grid grid-cols-4 gap-2">
                                {morningSlots.map((s, idx) => (
                                  <button
                                    key={`morning-${idx}`}
                                    disabled={!s.available}
                                    type="button"
                                    onClick={() => setSelectedSlot(s)}
                                    className={`py-2 rounded-xl text-xs font-semibold text-center border transition-all ${
                                      !s.available
                                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                                        : selectedSlot?.time === s.time
                                        ? 'bg-teal-600 border-teal-600 text-white font-bold shadow-md shadow-teal-500/10'
                                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-350'
                                    }`}
                                  >
                                    {s.time}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Afternoon Section */}
                          {afternoonSlots.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[9px] text-teal-600 font-bold uppercase tracking-wider flex items-center space-x-1">
                                <span>🌙 Afternoon & Evening</span>
                              </span>
                              <div className="grid grid-cols-4 gap-2">
                                {afternoonSlots.map((s, idx) => (
                                  <button
                                    key={`afternoon-${idx}`}
                                    disabled={!s.available}
                                    type="button"
                                    onClick={() => setSelectedSlot(s)}
                                    className={`py-2 rounded-xl text-xs font-semibold text-center border transition-all ${
                                      !s.available
                                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                                        : selectedSlot?.time === s.time
                                        ? 'bg-teal-600 border-teal-600 text-white font-bold shadow-md shadow-teal-500/10'
                                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-350'
                                    }`}
                                  >
                                    {s.time}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="text-center pt-1">
                            <button
                              type="button"
                              onClick={() => setBookingType('WALK_IN')}
                              className="text-[11px] text-slate-500 hover:text-teal-600 transition-colors font-medium"
                            >
                              Prefer booking a walk-in queue ticket? Switch to Walk-in
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Walk-in Booking Active */
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 space-y-2.5 shadow-inner">
                        <div className="flex items-center space-x-2 text-teal-600 font-bold">
                          <ArrowRightLeft className="w-4 h-4 shrink-0" />
                          <span>Walk-in Queue Mode Active</span>
                        </div>
                        <div className="space-y-1 pl-5 border-l border-slate-200">
                          <p>• The preferred date is reserved; specific appointment times are skipped.</p>
                          <p>• Check in at the clinic front desk to confirm your arrival.</p>
                          <p>• Live queue number will be assigned automatically at the lobby.</p>
                        </div>
                        <div className="pt-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setBookingType('SLOT');
                              fetchAvailableSlots();
                            }}
                            className="text-xs text-teal-600 hover:text-teal-700 font-semibold underline underline-offset-4"
                          >
                            Prefer slot scheduling? Switch to Time Slots
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Active Symptoms / notes</label>
                  <textarea
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    placeholder="Describe symptoms briefly (e.g. fever, checkup, stomach ache...)"
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded-lg px-3 py-2 text-xs text-slate-900"
                  />
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="submit"
                    disabled={bookingInProgress}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg py-2.5 text-xs transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50"
                  >
                    {bookingInProgress ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <span>Confirm Appointment</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('overview')}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg px-5 py-2.5 text-xs transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================== TAB 4: VISIT HISTORY ================== */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Clinical visit histories</h1>
              <p className="text-slate-500 text-xs mt-0.5">Timeline of past consultations, vitals, and electronic prescriptions.</p>
            </div>

            <div className="space-y-4">
              {patientTimeline?.encounters?.length > 0 ? (
                patientTimeline.encounters.map((enc: any) => (
                  <div key={enc.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-3.5 gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-teal-600 font-black uppercase tracking-wider">Consulting Doctor</span>
                        <h3 className="text-sm font-bold text-slate-900">Dr. {enc.doctor.user.firstName} {enc.doctor.user.lastName}</h3>
                      </div>
                      <span className="bg-slate-100 border border-slate-200 text-slate-700 text-[10px] px-2.5 py-1 rounded-lg font-bold w-fit">
                        {new Date(enc.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {/* Vitals */}
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                        <h4 className="text-[9px] text-slate-500 font-black uppercase tracking-wider flex items-center">
                          <Heart className="w-3.5 h-3.5 text-red-500 mr-1.5 animate-pulse" />
                          Vitals Check
                        </h4>
                        <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-700">
                          <div>
                            <span className="text-[8px] text-slate-400 block font-bold uppercase">BP</span>
                            <span className="font-bold text-slate-800">{enc.vitals?.bp || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-400 block font-bold uppercase">Pulse</span>
                            <span className="font-bold text-slate-800">{enc.vitals?.pulse ? `${enc.vitals.pulse} bpm` : 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-400 block font-bold uppercase">Sugar</span>
                            <span className="font-bold text-slate-800">{enc.vitals?.sugar ? `${enc.vitals.sugar} mg/dL` : 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-400 block font-bold uppercase">Temp</span>
                            <span className="font-bold text-slate-800">{enc.vitals?.temp ? `${enc.vitals.temp} °F` : 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Notes / Diagnosis */}
                      <div className="md:col-span-2 space-y-3">
                        <div>
                          <span className="text-[9px] text-slate-500 font-black uppercase block tracking-wider">Symptoms / Complaints</span>
                          <p className="text-xs text-slate-800 font-medium mt-0.5">{enc.complaint}</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 font-black uppercase block tracking-wider">Diagnosis</span>
                          <p className="text-xs text-slate-900 font-bold mt-0.5">{enc.diagnosis}</p>
                        </div>
                        {enc.clinicalNotes && (
                          <div>
                            <span className="text-[9px] text-slate-500 font-black uppercase block tracking-wider">Doctor Comments & Advice</span>
                            <p className="text-xs text-slate-600 italic mt-0.5">{enc.clinicalNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Prescriptions List */}
                    {enc.prescriptions?.length > 0 && (
                      <div className="bg-teal-500/5 border border-teal-500/10 rounded-xl p-4 space-y-2">
                        <span className="text-[9px] text-teal-700 font-black uppercase tracking-wider block">Prescribed Medicines</span>
                        <div className="divide-y divide-teal-100 bg-white border border-teal-100/50 rounded-lg overflow-hidden">
                          {enc.prescriptions.flatMap((p: any) => p.items).map((item: any) => (
                            <div key={item.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                              <div>
                                <span className="font-bold text-slate-900">{item.medicine.name}</span>
                                <span className="text-slate-500 ml-1.5">({item.medicine.strength})</span>
                              </div>
                              <div className="flex items-center space-x-4 text-[10px] text-slate-600">
                                <span>Dosage: <strong className="font-bold text-slate-800">{item.dosage}</strong></span>
                                <span>Instructions: <strong className="font-bold text-slate-800">{item.instructions}</strong></span>
                                <span>Duration: <strong className="font-bold text-slate-800">{item.durationDays} days</strong></span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-xs italic py-10 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">No visits have been recorded on this profile yet.</p>
              )}
            </div>
          </div>
        )}

        {/* ================== TAB 5: BILLING & LEDGER ================== */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Billing & Payments Ledger</h1>
              <p className="text-slate-500 text-xs mt-0.5">Inspect invoices, claim payments, and retrieve physical receipts.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <th className="p-4">Invoice No.</th>
                    <th className="p-4">Issued Date</th>
                    <th className="p-4">Total Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-900">
                  {patientTimeline?.invoices?.length > 0 ? (
                    patientTimeline.invoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-900">{inv.invoiceNumber}</td>
                        <td className="p-4 text-slate-500">{new Date(inv.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 font-bold text-slate-900">₹{parseFloat(inv.total).toFixed(2)}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                            inv.status === 'PAID' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' :
                            inv.status === 'PARTIALLY_PAID' ? 'bg-amber-50 border border-amber-200 text-amber-700' :
                            'bg-red-50 border border-red-200 text-red-700'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setShowInvoiceModal(true);
                            }}
                            className="text-teal-600 hover:text-teal-800 font-bold underline transition-colors"
                          >
                            View Receipt
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 italic">No invoice history available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* DETAILED RECEIPT MODAL OVERLAY */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 print:p-0">
          <div
            id="printable-invoice-modal"
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl max-w-lg w-full space-y-6 relative"
          >
            {/* Close button - hidden during printing */}
            <button
              onClick={() => {
                setShowInvoiceModal(false);
                setSelectedInvoice(null);
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors border border-slate-150 hover:bg-slate-50 print:hidden"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Receipt Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] text-teal-600 font-black uppercase tracking-wider block">Official Receipt</span>
                <h2 className="text-base font-black text-slate-900">{clinic?.name || 'Clinic OS'}</h2>
                <p className="text-[10px] text-slate-500 mt-0.5">{(clinic as any)?.address || 'Clinic Subdomain: ' + clinic?.subdomain}</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-800 block text-sm">{selectedInvoice.invoiceNumber}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Date: {new Date(selectedInvoice.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Bill To */}
            <div className="text-xs text-slate-700 bg-slate-50 border border-slate-100 rounded-xl p-3 grid grid-cols-2 gap-2">
              <div>
                <span className="text-[9px] text-slate-400 block font-bold uppercase">Patient Name</span>
                <strong className="text-slate-900 font-bold">{patientTimeline?.firstName} {patientTimeline?.lastName}</strong>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block font-bold uppercase">Contact Number</span>
                <strong className="text-slate-900 font-bold">{patientTimeline?.phone}</strong>
              </div>
            </div>

            {/* Itemized Services Table */}
            <div className="space-y-2">
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">Bill Items</span>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[9px] text-slate-500 font-bold uppercase">
                      <th className="p-2.5">Service Description</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-900">
                    {selectedInvoice.items && (typeof selectedInvoice.items === 'string'
                      ? JSON.parse(selectedInvoice.items)
                      : selectedInvoice.items
                    ).map((item: any, i: number) => (
                      <tr key={i}>
                        <td className="p-2.5 font-medium">{item.description}</td>
                        <td className="p-2.5 text-center">{item.quantity}</td>
                        <td className="p-2.5 text-right font-bold">₹{parseFloat(item.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="flex justify-end pt-2">
              <div className="w-48 text-xs text-slate-700 space-y-1.5">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-900">₹{parseFloat(selectedInvoice.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span>-₹{parseFloat(selectedInvoice.discount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>+₹{parseFloat(selectedInvoice.tax).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-slate-900 border-t border-slate-200 pt-1.5 text-sm">
                  <span>Total Due:</span>
                  <span>₹{parseFloat(selectedInvoice.total).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payments History Ledger logs */}
            <div>
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block mb-1.5">Payments Ledger</span>
              <div className="space-y-2">
                {selectedInvoice.payments?.length > 0 ? (
                  selectedInvoice.payments.map((p: any) => (
                    <div key={p.id} className="bg-slate-50/70 border border-slate-100 rounded-lg p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Method: {p.method}</span>
                        {p.notes && <span className="text-[9px] text-slate-500 italic block mt-0.5">Notes: {p.notes}</span>}
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 block">₹{parseFloat(p.amount).toFixed(2)}</span>
                        <span className="text-[8px] text-slate-400 block">{new Date(p.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-[10px] italic">No transaction records logged.</p>
                )}
              </div>
            </div>

            {/* Action Buttons - hidden during printing */}
            <div className="flex space-x-3 pt-2 print:hidden">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl py-2.5 text-xs transition-colors flex items-center justify-center space-x-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>
              <button
                onClick={() => {
                  setShowInvoiceModal(false);
                  setSelectedInvoice(null);
                }}
                className="bg-slate-100 hover:bg-slate-205 text-slate-700 font-bold rounded-xl px-5 py-2.5 text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
