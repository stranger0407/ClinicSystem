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
  BookOpen
} from 'lucide-react';

export default function PatientDashboard() {
  const { user, clinic, logout, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patientTimeline, setPatientTimeline] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Booking state
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [bookingType, setBookingType] = useState<'SLOT' | 'WALK_IN'>('SLOT');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);

  // Load patient data
  const loadPatientData = async () => {
    if (!user?.profileId) return;
    setLoading(true);
    try {
      // Fetch details from patient timeline endpoint
      const data = await apiFetch(`/patient/${user.profileId}/timeline`);
      setPatientTimeline(data);
      setAppointments(data.appointments || []);

      // Fetch doctors list for booking dropdown
      const docs = await apiFetch('/doctor');
      setDoctors(docs);
      if (docs.length > 0) {
        setSelectedDoctorId(docs[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && user.profileId) {
      loadPatientData();
    }
  }, [user, authLoading]);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.profileId) return;
    setBookingError('');
    setBookingSuccess(false);
    setBookingInProgress(true);

    try {
      const payload: any = {
        patientId: user.profileId,
        doctorId: selectedDoctorId,
        type: bookingType,
        isFollowUp: false,
        notes: bookingNotes,
      };

      if (bookingType === 'SLOT') {
        if (!bookingTime) {
          throw new Error('Please select a booking time');
        }
        payload.startTime = new Date(`${bookingDate}T${bookingTime}`).toISOString();
      } else {
        // Walk-in requires a valid date context, we set start of day or resolve on backend
        payload.startTime = new Date(`${bookingDate}T00:00:00`).toISOString();
      }

      await apiFetch('/appointment', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setBookingSuccess(true);
      setBookingNotes('');
      setBookingTime('');
      setShowBookingForm(false);
      loadPatientData();
    } catch (err: any) {
      setBookingError(err.message || 'Failed to book appointment');
    } finally {
      setBookingInProgress(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-teal-400">
        <Loader className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 bg-teal-500 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-sm block tracking-tight">Clinic OS Patient Portal</span>
            <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">
              {clinic?.name || 'Default Clinic'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold">{user?.firstName} {user?.lastName}</p>
            <span className="text-[9px] text-teal-400 uppercase tracking-widest font-semibold block">
              Patient Record
            </span>
          </div>
          <button
            onClick={logout}
            className="p-2 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-slate-400 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main content grid */}
      <main className="flex-1 p-6 md:p-8 max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Appointments and History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Welcome Card */}
          <div className="bg-gradient-to-r from-slate-950 to-teal-950 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute top-1/2 right-10 -translate-y-1/2 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <h1 className="text-xl sm:text-2xl font-black">Hello, {user?.firstName}!</h1>
            <p className="text-slate-300 text-xs mt-1.5 leading-relaxed max-w-md">
              Welcome to your personal medical dashboard. You can review your past visit notes, active prescriptions, billing history, or schedule a new appointment.
            </p>
          </div>

          {/* Active / Upcoming Appointments */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center">
                <Calendar className="w-4.5 h-4.5 mr-2 text-teal-600" />
                Your Appointments
              </h2>
              <button
                onClick={() => setShowBookingForm(!showBookingForm)}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Book visit</span>
              </button>
            </div>

            {/* Appointment Booking Drawer Form */}
            {showBookingForm && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Book a new appointment</h3>

                {bookingError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-800 text-xs">
                    {bookingError}
                  </div>
                )}

                <form onSubmit={handleBookAppointment} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Choose Doctor</label>
                    <select
                      value={selectedDoctorId}
                      onChange={(e) => setSelectedDoctorId(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-teal-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs text-slate-700"
                    >
                      {doctors.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          Dr. {doc.user.firstName} {doc.user.lastName} ({doc.specialty})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase block">Booking type</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setBookingType('SLOT')}
                        className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          bookingType === 'SLOT' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200'
                        }`}
                      >
                        Time slot
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingType('WALK_IN')}
                        className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          bookingType === 'WALK_IN' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200'
                        }`}
                      >
                        Walk-in
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Date</label>
                    <input
                      type="date"
                      value={bookingDate}
                      required
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-teal-500 focus:outline-none rounded-lg px-2.5 py-1 text-xs text-slate-700"
                    />
                  </div>

                  {bookingType === 'SLOT' && (
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Preferred time</label>
                      <input
                        type="time"
                        value={bookingTime}
                        required={bookingType === 'SLOT'}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-teal-500 focus:outline-none rounded-lg px-2.5 py-1 text-xs text-slate-700"
                      />
                    </div>
                  )}

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Symptom notes</label>
                    <input
                      type="text"
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      placeholder="e.g. regular body checkup, fever..."
                      className="w-full bg-white border border-slate-200 focus:border-teal-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2 flex space-x-2 pt-2">
                    <button
                      type="submit"
                      disabled={bookingInProgress}
                      className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg py-2 text-xs transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50"
                    >
                      {bookingInProgress ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <span>Request booking</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBookingForm(false)}
                      className="bg-slate-200 hover:bg-slate-350 text-slate-700 font-bold rounded-lg px-4 py-2 text-xs transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* List appointments */}
            <div className="divide-y divide-slate-100">
              {appointments.length > 0 ? (
                appointments.map((app) => (
                  <div key={app.id} className="py-4 flex justify-between items-center text-xs">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                        <Calendar className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">Dr. {app.doctor.user.firstName} {app.doctor.user.lastName}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 flex items-center space-x-2">
                          <span>Style: {app.type === 'SLOT' ? 'Slot-based' : 'Walk-in'}</span>
                          <span>•</span>
                          {app.type === 'SLOT' ? (
                            <span>Time: {new Date(app.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          ) : (
                            <span>Queue Order: #{app.queueNumber}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        app.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                        app.status === 'CHECKED_IN' || app.status === 'IN_CONSULTATION' ? 'bg-teal-50 text-teal-700' :
                        app.status === 'CANCELLED' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-xs italic py-8 text-center">You have no appointment records yet.</p>
              )}
            </div>
          </div>

          {/* Past visit medical summaries */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center">
              <BookOpen className="w-4.5 h-4.5 mr-2 text-teal-600" />
              Visit histories & prescriptions
            </h2>

            {patientTimeline?.encounters?.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {patientTimeline.encounters.map((enc: any) => (
                  <div key={enc.id} className="py-4 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800">
                        Consultation - Dr. {enc.doctor.user.firstName} {enc.doctor.user.lastName}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold">
                        {new Date(enc.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 text-xs space-y-2 text-slate-700">
                      <p>
                        <strong className="text-slate-850">Chief complaint:</strong> {enc.complaint}
                      </p>
                      <p>
                        <strong className="text-slate-850">Diagnosis:</strong> {enc.diagnosis}
                      </p>
                      {enc.clinicalNotes && (
                        <p>
                          <strong className="text-slate-850">Doctor comments:</strong> {enc.clinicalNotes}
                        </p>
                      )}

                      {/* Prescriptions item list */}
                      {enc.prescriptions?.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/50 mt-2">
                          <span className="text-[10px] text-teal-600 font-bold uppercase tracking-wider block mb-1">
                            Prescribed medicines:
                          </span>
                          <div className="divide-y divide-slate-100 bg-white border border-slate-150/40 rounded-lg overflow-hidden">
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
              <p className="text-slate-400 text-xs italic py-8 text-center">No past visits recorded.</p>
            )}
          </div>
        </div>

        {/* Right 1 Col: Profile details and billing status */}
        <div className="space-y-6">
          {/* Vitals Summary Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Allergies & Conditions
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Known Allergies
                </span>
                <div className="flex flex-wrap gap-1">
                  {patientTimeline?.allergies?.length > 0 ? (
                    patientTimeline.allergies.map((a: string, i: number) => (
                      <span key={i} className="bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 rounded text-[10px] font-semibold">
                        {a}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 text-xs italic">No allergies recorded</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Chronic conditions
                </span>
                <div className="flex flex-wrap gap-1">
                  {patientTimeline?.chronicConditions?.length > 0 ? (
                    patientTimeline.chronicConditions.map((c: string, i: number) => (
                      <span key={i} className="bg-indigo-50 border border-indigo-200 text-indigo-800 px-2 py-0.5 rounded text-[10px] font-semibold">
                        {c}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 text-xs italic">No chronic conditions</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Billing Ledger summary */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center">
              <CreditCard className="w-4 h-4 mr-1.5 text-teal-600" />
              Invoices & payments
            </h3>
            <div className="divide-y divide-slate-50 max-h-60 overflow-y-auto">
              {patientTimeline?.invoices?.length > 0 ? (
                patientTimeline.invoices.map((inv: any) => (
                  <div key={inv.id} className="py-2.5 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{inv.invoiceNumber}</span>
                      <p className="text-[10px] text-slate-450">{new Date(inv.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-800 block">₹{parseFloat(inv.total).toFixed(2)}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-xs italic py-4 text-center">No invoices generated yet.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
