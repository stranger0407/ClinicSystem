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
  Loader,
  Plus
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

  // Appointments tab state
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  // Booking Form State
  const [bookingPatientSearch, setBookingPatientSearch] = useState('');
  const [bookingPatientResults, setBookingPatientResults] = useState<any[]>([]);
  const [bookingPatient, setBookingPatient] = useState<any | null>(null);
  const [bookingType, setBookingType] = useState<'SLOT' | 'WALK_IN'>('SLOT');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingIsFollowUp, setBookingIsFollowUp] = useState(false);
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingInProgress, setBookingInProgress] = useState(false);

  // Load doctors list
  const loadDoctors = async () => {
    try {
      const docs = await apiFetch('/doctor');
      setDoctors(docs);
      if (docs.length > 0 && !selectedDoctorId) {
        setSelectedDoctorId(docs[0].id);
      }
    } catch (err) {
      console.error('Failed to load doctors:', err);
    }
  };

  // Load appointments list
  const loadAppointments = async () => {
    if (!selectedDoctorId) return;
    setLoadingAppointments(true);
    try {
      const appts = await apiFetch(`/appointment?doctorId=${selectedDoctorId}&date=${selectedDate}`);
      setAppointments(appts);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoadingAppointments(false);
    }
  };

  // Trigger loading doctors
  useEffect(() => {
    if (activeTab === 'appointments') {
      loadDoctors();
    }
  }, [activeTab]);

  // Trigger loading appointments
  useEffect(() => {
    if (activeTab === 'appointments' && selectedDoctorId) {
      loadAppointments();
    }
  }, [activeTab, selectedDoctorId, selectedDate]);

  // Search patient during booking
  const searchBookingPatient = async (q: string) => {
    setBookingPatientSearch(q);
    if (!q.trim()) {
      setBookingPatientResults([]);
      return;
    }
    try {
      const results = await apiFetch(`/patient/search?q=${encodeURIComponent(q.trim())}`);
      setBookingPatientResults(results);
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Booking
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingPatient) {
      setBookingError('Please select a patient first.');
      return;
    }
    setBookingError('');
    setBookingSuccess(false);
    setBookingInProgress(true);

    try {
      const payload: any = {
        patientId: bookingPatient.id,
        doctorId: selectedDoctorId,
        type: bookingType,
        isFollowUp: bookingIsFollowUp,
        notes: bookingNotes,
      };

      if (bookingType === 'SLOT') {
        if (!bookingTime) {
          throw new Error('Please select a booking time');
        }
        payload.startTime = new Date(`${selectedDate}T${bookingTime}`).toISOString();
      }

      await apiFetch('/appointment', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setBookingSuccess(true);
      setBookingNotes('');
      setBookingTime('');
      setBookingPatient(null);
      setBookingPatientSearch('');
      setBookingPatientResults([]);
      loadAppointments();
    } catch (err: any) {
      setBookingError(err.message || 'Failed to book appointment');
    } finally {
      setBookingInProgress(false);
    }
  };

  // Change Appointment Status
  const handleUpdateStatus = async (appId: string, status: string) => {
    try {
      await apiFetch(`/appointment/${appId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      loadAppointments();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  // Billing & Ledger States
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD'>('CASH');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [showCreateInvoiceForm, setShowCreateInvoiceForm] = useState(false);

  // New Invoice Form State
  const [invoicePatientSearch, setInvoicePatientSearch] = useState('');
  const [invoicePatientResults, setInvoicePatientResults] = useState<any[]>([]);
  const [invoicePatient, setInvoicePatient] = useState<any | null>(null);
  const [invoiceDiscount, setInvoiceDiscount] = useState('0');
  const [invoiceTax, setInvoiceTax] = useState('0');
  const [invoiceItems, setInvoiceItems] = useState<any[]>([{ description: 'Consultation Fee', quantity: 1, amount: 250 }]);

  // Load Invoices
  const loadInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const data = await apiFetch('/billing/invoice');
      setInvoices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  // Trigger loading invoices when tab changes
  useEffect(() => {
    if (activeTab === 'billing') {
      loadInvoices();
    }
  }, [activeTab]);

  // Autocomplete patient search in billing
  const searchBillingPatient = async (q: string) => {
    setInvoicePatientSearch(q);
    if (!q.trim()) {
      setInvoicePatientResults([]);
      return;
    }
    try {
      const results = await apiFetch(`/patient/search?q=${encodeURIComponent(q.trim())}`);
      setInvoicePatientResults(results);
    } catch (err) {
      console.error(err);
    }
  };

  // Add Item to Invoice Draft
  const addInvoiceItem = () => {
    setInvoiceItems([...invoiceItems, { description: '', quantity: 1, amount: 0 }]);
  };

  // Remove Item from Invoice Draft
  const removeInvoiceItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  // Update Item in Invoice Draft
  const updateInvoiceItem = (index: number, key: string, val: any) => {
    const updated = [...invoiceItems];
    updated[index][key] = val;
    setInvoiceItems(updated);
  };

  // Create Invoice request
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoicePatient) {
      alert('Please select a patient first.');
      return;
    }
    try {
      await apiFetch('/billing/invoice', {
        method: 'POST',
        body: JSON.stringify({
          patientId: invoicePatient.id,
          discount: parseFloat(invoiceDiscount) || 0,
          tax: parseFloat(invoiceTax) || 0,
          items: invoiceItems.map((it) => ({
            description: it.description,
            quantity: parseInt(it.quantity) || 1,
            amount: parseFloat(it.amount) || 0,
          })),
        }),
      });

      setShowCreateInvoiceForm(false);
      setInvoicePatient(null);
      setInvoicePatientSearch('');
      setInvoiceItems([{ description: 'Consultation Fee', quantity: 1, amount: 250 }]);
      setInvoiceDiscount('0');
      setInvoiceTax('0');
      loadInvoices();
    } catch (err: any) {
      alert(err.message || 'Failed to generate invoice');
    }
  };

  // Record Payment collection
  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    try {
      await apiFetch('/billing/payment', {
        method: 'POST',
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          amount: parseFloat(paymentAmount) || 0,
          method: paymentMethod,
          notes: paymentNotes,
        }),
      });

      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentNotes('');
      
      // Reload details of active invoice
      const updatedDetails = await apiFetch(`/billing/invoice/${selectedInvoice.id}`);
      setSelectedInvoice(updatedDetails);
      loadInvoices();
    } catch (err: any) {
      alert(err.message || 'Failed to log payment transaction');
    }
  };

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
          {/* Logo & Logout */}
          <div className="flex items-center justify-between">
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
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-slate-400 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
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
                      className="flex-1 bg-slate-50 border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none rounded-lg px-3 py-2 text-xs transition-all placeholder-slate-400 text-slate-900"
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
                          className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
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
                          className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
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
                        className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
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
                          className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Gender</label>
                        <select
                          value={newPatient.gender}
                          onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded-lg px-2 py-1.5 text-xs text-slate-900"
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
                        className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Chronic conditions (comma separated)</label>
                      <input
                        type="text"
                        value={newPatient.chronicConditions}
                        onChange={(e) => setNewPatient({ ...newPatient, chronicConditions: e.target.value })}
                        placeholder="e.g. Asthma, Diabetes"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Address</label>
                      <textarea
                        value={newPatient.address}
                        onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                        placeholder="Residential address details..."
                        rows={2}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
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
                    className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded-lg px-3 py-2 text-xs text-slate-900"
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
                    className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded-lg px-3 py-2 text-xs text-slate-900"
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

        {/* TAB 2: Appointments & Live Queue */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Appointments & Live Queue</h1>
                <p className="text-slate-500 text-xs mt-0.5">Manage schedules, book consultations, and check-in walk-in queues.</p>
              </div>

              {/* Filter controls */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Doctor</span>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="bg-white border border-slate-200 focus:border-teal-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  >
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        Dr. {doc.user.firstName} {doc.user.lastName} ({doc.specialty})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Date</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-white border border-slate-200 focus:border-teal-500 focus:outline-none rounded-lg px-2.5 py-1 text-xs text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form panel: Book Appointment */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 h-fit">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center">
                  <Calendar className="w-4.5 h-4.5 mr-2 text-teal-600" />
                  Book appointment
                </h3>

                {bookingSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-emerald-800 text-xs font-semibold">Appointment booked successfully!</span>
                  </div>
                )}

                {bookingError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span className="text-red-800 text-xs font-semibold">{bookingError}</span>
                  </div>
                )}

                <form onSubmit={handleBookAppointment} className="space-y-4">
                  {/* Select Patient Autocomplete */}
                  <div className="space-y-1 relative">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Patient Search</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={bookingPatient ? `${bookingPatient.firstName} ${bookingPatient.lastName} (${bookingPatient.phone})` : bookingPatientSearch}
                        disabled={!!bookingPatient}
                        onChange={(e) => searchBookingPatient(e.target.value)}
                        placeholder="Search patient by name or phone..."
                        className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs disabled:bg-slate-100 disabled:text-slate-600 text-slate-900"
                      />
                      {bookingPatient && (
                        <button
                          type="button"
                          onClick={() => {
                            setBookingPatient(null);
                            setBookingPatientSearch('');
                          }}
                          className="absolute right-2.5 top-1.5 text-[10px] text-red-500 font-bold uppercase hover:underline"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {/* Autocomplete dropdown */}
                    {!bookingPatient && bookingPatientResults.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto z-20 divide-y divide-slate-100">
                        {bookingPatientResults.map((pat) => (
                          <div
                            key={pat.id}
                            onClick={() => {
                              setBookingPatient(pat);
                              setBookingPatientResults([]);
                            }}
                            className="p-2 text-xs hover:bg-slate-50 cursor-pointer flex justify-between"
                          >
                            <span className="font-bold">{pat.firstName} {pat.lastName}</span>
                            <span className="text-slate-400">{pat.phone}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Booking type */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase block">Booking style</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setBookingType('SLOT')}
                        className={`py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                          bookingType === 'SLOT'
                            ? 'bg-teal-600 text-white border-teal-600 shadow'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Time slot
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingType('WALK_IN')}
                        className={`py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                          bookingType === 'WALK_IN'
                            ? 'bg-teal-600 text-white border-teal-600 shadow'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Walk-in queue
                      </button>
                    </div>
                  </div>

                  {/* Slot selection (Time picker) */}
                  {bookingType === 'SLOT' && (
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Time slot (24H format)</label>
                      <input
                        type="time"
                        value={bookingTime}
                        required={bookingType === 'SLOT'}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isFollowUp"
                      checked={bookingIsFollowUp}
                      onChange={(e) => setBookingIsFollowUp(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
                    />
                    <label htmlFor="isFollowUp" className="text-xs text-slate-600 font-medium">
                      Mark as follow-up visit
                    </label>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Notes / Symptoms</label>
                    <textarea
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      placeholder="e.g. Cough and cold, review reports..."
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={bookingInProgress}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg py-2 text-xs transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50"
                  >
                    {bookingInProgress ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <span>Confirm booking</span>}
                  </button>
                </form>
              </div>

              {/* Queue display panel */}
              <div className="lg:col-span-2 space-y-6">
                {loadingAppointments ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm text-teal-500">
                    <Loader className="w-8 h-8 animate-spin mx-auto" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Time-slot Appointments list */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center justify-between">
                        <span>Scheduled slots</span>
                        <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded font-bold">
                          {appointments.filter((a) => a.type === 'SLOT').length}
                        </span>
                      </h3>

                      <div className="space-y-2 max-h-[400px] overflow-y-auto divide-y divide-slate-50">
                        {appointments.filter((a) => a.type === 'SLOT').length > 0 ? (
                          appointments.filter((a) => a.type === 'SLOT').map((app) => (
                            <div key={app.id} className="pt-2 pb-2.5 flex justify-between items-start text-xs">
                              <div>
                                <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded mr-1.5">
                                  {new Date(app.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="font-bold text-slate-800">
                                  {app.patient.firstName} {app.patient.lastName}
                                </span>
                                {app.isFollowUp && (
                                  <span className="ml-1.5 text-[9px] bg-indigo-50 text-indigo-700 px-1 py-0.5 rounded font-bold uppercase tracking-wider">
                                    Follow-up
                                  </span>
                                )}
                                <p className="text-[10px] text-slate-400 mt-1">Status: <span className="font-semibold">{app.status}</span></p>
                              </div>

                              <select
                                value={app.status}
                                onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded text-[10px] px-1.5 py-1 text-slate-900 focus:outline-none"
                              >
                                <option value="BOOKED">Booked</option>
                                <option value="CHECKED_IN">Checked-In</option>
                                <option value="IN_CONSULTATION">In-Consultation</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED">Cancelled</option>
                                <option value="NO_SHOW">No-Show</option>
                              </select>
                            </div>
                          ))
                        ) : (
                          <p className="text-slate-400 text-xs italic py-4 text-center">No slots booked for this date</p>
                        )}
                      </div>
                    </div>

                    {/* Walk-in Queue list */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center justify-between">
                        <span>Walk-in Queue</span>
                        <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded font-bold">
                          {appointments.filter((a) => a.type === 'WALK_IN').length}
                        </span>
                      </h3>

                      <div className="space-y-2 max-h-[400px] overflow-y-auto divide-y divide-slate-50">
                        {appointments.filter((a) => a.type === 'WALK_IN').length > 0 ? (
                          appointments.filter((a) => a.type === 'WALK_IN').map((app) => (
                            <div key={app.id} className="pt-2 pb-2.5 flex justify-between items-start text-xs">
                              <div>
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mr-1.5">
                                  #{app.queueNumber}
                                </span>
                                <span className="font-bold text-slate-800">
                                  {app.patient.firstName} {app.patient.lastName}
                                </span>
                                {app.isFollowUp && (
                                  <span className="ml-1.5 text-[9px] bg-indigo-50 text-indigo-700 px-1 py-0.5 rounded font-bold uppercase tracking-wider">
                                    Follow-up
                                  </span>
                                )}
                                <p className="text-[10px] text-slate-400 mt-1">Status: <span className="font-semibold">{app.status}</span></p>
                              </div>

                              <select
                                value={app.status}
                                onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded text-[10px] px-1.5 py-1 text-slate-900 focus:outline-none"
                              >
                                <option value="BOOKED">Booked</option>
                                <option value="CHECKED_IN">Checked-In</option>
                                <option value="IN_CONSULTATION">In-Consultation</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED">Cancelled</option>
                                <option value="NO_SHOW">No-Show</option>
                              </select>
                            </div>
                          ))
                        ) : (
                          <p className="text-slate-400 text-xs italic py-4 text-center">No walk-in queue for today</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Ledger & Invoices */}
        {activeTab === 'billing' && (
          <div className="space-y-6 print:p-0 print:bg-white print:border-none print:shadow-none">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4 print:hidden">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Ledger & Invoices</h1>
                <p className="text-slate-500 text-xs mt-0.5">Generate receipts, record splits, and view payments logs.</p>
              </div>
              <button
                onClick={() => setShowCreateInvoiceForm(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center space-x-1.5 transition-colors shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Generate Invoice</span>
              </button>
            </div>

            {/* Invoicing Draft slide-out form */}
            {showCreateInvoiceForm && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 print:hidden">
                <h3 className="text-sm font-bold text-slate-900 flex items-center">
                  <CreditCard className="w-4.5 h-4.5 mr-2 text-teal-600" />
                  Create custom billing invoice
                </h3>

                <form onSubmit={handleCreateInvoice} className="space-y-4">
                  {/* Select Patient Autocomplete */}
                  <div className="space-y-1 relative max-w-md">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Patient</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={invoicePatient ? `${invoicePatient.firstName} ${invoicePatient.lastName} (${invoicePatient.phone})` : invoicePatientSearch}
                        disabled={!!invoicePatient}
                        onChange={(e) => searchBillingPatient(e.target.value)}
                        placeholder="Search patient..."
                        className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs disabled:bg-slate-100 disabled:text-slate-600 text-slate-900"
                      />
                      {invoicePatient && (
                        <button
                          type="button"
                          onClick={() => {
                            setInvoicePatient(null);
                            setInvoicePatientSearch('');
                          }}
                          className="absolute right-2.5 top-1.5 text-[10px] text-red-500 font-bold uppercase hover:underline"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {!invoicePatient && invoicePatientResults.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto z-20 divide-y divide-slate-100">
                        {invoicePatientResults.map((pat) => (
                          <div
                            key={pat.id}
                            onClick={() => {
                              setInvoicePatient(pat);
                              setInvoicePatientResults([]);
                            }}
                            className="p-2 text-xs hover:bg-slate-50 cursor-pointer flex justify-between"
                          >
                            <span className="font-bold">{pat.firstName} {pat.lastName}</span>
                            <span className="text-slate-400">{pat.phone}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Itemized Lists */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 font-bold uppercase block">Invoice items</label>
                    <div className="space-y-2">
                      {invoiceItems.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center">
                          <input
                            type="text"
                            value={item.description}
                            placeholder="Description (e.g. Blood Test, Pharmacy sale)"
                            required
                            onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                            className="col-span-6 bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded px-2.5 py-1 text-xs text-slate-900"
                          />
                          <input
                            type="number"
                            value={item.quantity}
                            min={1}
                            required
                            onChange={(e) => updateInvoiceItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="col-span-2 bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded px-2.5 py-1 text-xs text-slate-900"
                          />
                          <input
                            type="number"
                            value={item.amount}
                            min={0}
                            required
                            placeholder="Price"
                            onChange={(e) => updateInvoiceItem(index, 'amount', parseFloat(e.target.value) || 0)}
                            className="col-span-3 bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded px-2.5 py-1 text-xs text-slate-900"
                          />
                          <button
                            type="button"
                            onClick={() => removeInvoiceItem(index)}
                            disabled={invoiceItems.length === 1}
                            className="col-span-1 text-red-500 hover:text-red-700 text-xs font-bold text-center disabled:opacity-30"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addInvoiceItem}
                      className="text-[10px] text-teal-600 hover:underline font-bold uppercase tracking-wider mt-1.5 block"
                    >
                      + Add extra item
                    </button>
                  </div>

                  {/* Calculations */}
                  <div className="grid grid-cols-2 gap-4 max-w-sm border-t border-slate-100 pt-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Discount (₹)</label>
                      <input
                        type="number"
                        value={invoiceDiscount}
                        onChange={(e) => setInvoiceDiscount(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded px-2 py-1 text-xs text-slate-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Tax (₹)</label>
                      <input
                        type="number"
                        value={invoiceTax}
                        onChange={(e) => setInvoiceTax(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded px-2 py-1 text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-2.5 pt-2">
                    <button
                      type="submit"
                      className="bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg px-4 py-2 text-xs transition-colors"
                    >
                      Generate invoice
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateInvoiceForm(false)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg px-4 py-2 text-xs transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Split layout: Invoice ledger lists & printable invoice detail */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Ledger list */}
              <div className="lg:col-span-2 space-y-4 print:hidden">
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-slate-50 border-b border-slate-100 px-4 py-3">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      Invoice Ledger logs
                    </span>
                  </div>

                  {loadingInvoices ? (
                    <div className="p-12 text-center text-teal-500">
                      <Loader className="w-8 h-8 animate-spin mx-auto" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-500 font-bold uppercase">
                            <th className="p-3">Invoice #</th>
                            <th className="p-3">Patient</th>
                            <th className="p-3">Total Amount</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {invoices.length > 0 ? (
                            invoices.map((inv) => (
                              <tr
                                key={inv.id}
                                className={`hover:bg-slate-50/50 cursor-pointer ${
                                  selectedInvoice?.id === inv.id ? 'bg-teal-50/40 hover:bg-teal-50/50' : ''
                                }`}
                                onClick={async () => {
                                  const details = await apiFetch(`/billing/invoice/${inv.id}`);
                                  setSelectedInvoice(details);
                                }}
                              >
                                <td className="p-3 font-bold text-slate-800">{inv.invoiceNumber}</td>
                                <td className="p-3 text-slate-705">
                                  {inv.patient.firstName} {inv.patient.lastName}
                                </td>
                                <td className="p-3 font-semibold text-slate-900">₹{parseFloat(inv.total).toFixed(2)}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                    inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                  }`}>
                                    {inv.status}
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <ChevronRight className="w-4 h-4 mx-auto text-slate-400" />
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                                No invoice ledger records found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Printable Invoice/Receipt Viewer panel */}
              {selectedInvoice && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6 print:fixed print:inset-0 print:z-50 print:bg-white print:border-none print:p-0 print:shadow-none">
                  {/* Action row (hide when printing) */}
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3 print:hidden">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Receipt details
                    </h3>
                    <div className="flex space-x-1.5">
                      <button
                        onClick={() => window.print()}
                        className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded px-2.5 py-1.5 transition-colors"
                      >
                        Print Receipt
                      </button>
                      {selectedInvoice.status !== 'PAID' && (
                        <button
                          onClick={() => {
                            setPaymentAmount((parseFloat(selectedInvoice.total) - selectedInvoice.payments.reduce((acc: number, p: any) => acc + parseFloat(p.amount), 0)).toString());
                            setShowPaymentModal(true);
                          }}
                          className="bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold rounded px-2.5 py-1.5 transition-colors"
                        >
                          Collect Payment
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Print invoice wrapper */}
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight block">
                          {clinic?.name || 'Clinic OS'}
                        </h2>
                        <p className="text-[10px] text-slate-400 mt-0.5">Receipt / Settlement Invoice</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-bold text-slate-800 block">
                          {selectedInvoice.invoiceNumber}
                        </span>
                        <span className="text-[9px] text-slate-400 block">
                          Date: {new Date(selectedInvoice.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Patient summary */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-650 grid grid-cols-2 gap-2 print:bg-slate-50">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block uppercase mb-0.5">Billed Patient</span>
                        <p className="font-bold text-slate-800">
                          {selectedInvoice.patient.firstName} {selectedInvoice.patient.lastName}
                        </p>
                        <p>Phone: {selectedInvoice.patient.phone}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase mb-0.5">Payment status</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider inline-block mt-0.5 ${
                          selectedInvoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {selectedInvoice.status}
                        </span>
                      </div>
                    </div>

                    {/* Items table */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse text-[10px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[9px] text-slate-500 font-bold uppercase">
                            <th className="p-2.5">Service item</th>
                            <th className="p-2.5 text-center">Qty</th>
                            <th className="p-2.5 text-right">Price</th>
                            <th className="p-2.5 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedInvoice.items && Array.isArray(selectedInvoice.items) && selectedInvoice.items.map((item: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-50/20">
                              <td className="p-2.5 font-bold text-slate-800">{item.description}</td>
                              <td className="p-2.5 text-center text-slate-600">{item.quantity}</td>
                              <td className="p-2.5 text-right text-slate-600">₹{parseFloat(item.amount).toFixed(2)}</td>
                              <td className="p-2.5 text-right font-semibold text-slate-800">
                                ₹{(item.quantity * item.amount).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Calculations */}
                    <div className="border-t border-slate-150 pt-3 flex flex-col items-end space-y-1.5 text-xs">
                      <div className="flex justify-between w-48 text-[11px] text-slate-500">
                        <span>Subtotal:</span>
                        <span>₹{parseFloat(selectedInvoice.subtotal).toFixed(2)}</span>
                      </div>
                      {parseFloat(selectedInvoice.discount) > 0 && (
                        <div className="flex justify-between w-48 text-[11px] text-slate-500">
                          <span>Discount applied:</span>
                          <span>-₹{parseFloat(selectedInvoice.discount).toFixed(2)}</span>
                        </div>
                      )}
                      {parseFloat(selectedInvoice.tax) > 0 && (
                        <div className="flex justify-between w-48 text-[11px] text-slate-500">
                          <span>Tax / Add-ons:</span>
                          <span>+₹{parseFloat(selectedInvoice.tax).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between w-48 font-black text-slate-900 border-t border-slate-200 pt-1.5 text-xs">
                        <span>Total Due:</span>
                        <span>₹{parseFloat(selectedInvoice.total).toFixed(2)}</span>
                      </div>

                      {/* Total Paid / Balance */}
                      <div className="flex justify-between w-48 text-[10px] font-bold text-emerald-600">
                        <span>Total Paid:</span>
                        <span>
                          ₹
                          {selectedInvoice.payments
                            .reduce((acc: number, p: any) => acc + parseFloat(p.amount), 0)
                            .toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between w-48 text-[10px] font-bold text-red-500">
                        <span>Balance Due:</span>
                        <span>
                          ₹
                          {(
                            parseFloat(selectedInvoice.total) -
                            selectedInvoice.payments.reduce((acc: number, p: any) => acc + parseFloat(p.amount), 0)
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Payments ledger log list */}
                    {selectedInvoice.payments?.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block border-b border-slate-100 pb-1">
                          Transaction logs:
                        </span>
                        <div className="divide-y divide-slate-100 text-[10px]">
                          {selectedInvoice.payments.map((p: any) => (
                            <div key={p.id} className="py-1.5 flex justify-between text-slate-600">
                              <span>
                                Payment logged via <strong className="uppercase">{p.method}</strong>{' '}
                                {p.notes && `(${p.notes})`}
                              </span>
                              <span className="font-bold text-slate-800">
                                ₹{parseFloat(p.amount).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Collect Payment Modal overlay */}
            {showPaymentModal && selectedInvoice && (
              <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl max-w-sm w-full space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center">
                    <CreditCard className="w-4.5 h-4.5 mr-2 text-teal-600" />
                    Record payment collection
                  </h3>

                  <form onSubmit={handleCollectPayment} className="space-y-4">
                    <div className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-1">
                      <p>
                        Invoice total: <strong className="text-slate-800">₹{parseFloat(selectedInvoice.total).toFixed(2)}</strong>
                      </p>
                      <p>
                        Collected so far:{' '}
                        <strong className="text-slate-800">
                          ₹
                          {selectedInvoice.payments
                            .reduce((acc: number, p: any) => acc + parseFloat(p.amount), 0)
                            .toFixed(2)}
                        </strong>
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase block">Collection amount (₹)</label>
                      <input
                        type="number"
                        value={paymentAmount}
                        max={(parseFloat(selectedInvoice.total) - selectedInvoice.payments.reduce((acc: number, p: any) => acc + parseFloat(p.amount), 0)).toString()}
                        required
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded px-2.5 py-1.5 text-xs text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase block">Payment method</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded px-2 py-1.5 text-xs text-slate-900"
                      >
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI / GPay</option>
                        <option value="CARD">Debit / Credit Card</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase block">Transaction notes</label>
                      <input
                        type="text"
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        placeholder="e.g. Transaction ID, split details..."
                        className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded px-2.5 py-1.5 text-xs text-slate-900"
                      />
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <button
                        type="submit"
                        className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg py-2 text-xs transition-colors"
                      >
                        Record payment
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPaymentModal(false)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg px-4 py-2 text-xs transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
