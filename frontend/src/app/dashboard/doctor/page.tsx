'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/utils/api';
import {
  Activity,
  Users,
  Clock,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Clipboard,
  Shield,
  FileText,
  CreditCard,
  LogOut,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
  Calendar,
  Loader,
  Heart,
  PlusCircle,
  User,
  Settings,
  TrendingUp,
  Search,
  X,
  ArrowRightLeft,
  Edit,
  Printer,
  DollarSign,
  Info
} from 'lucide-react';

function TimelineEncounterCard({ enc }: { enc: any }) {
  const prescription = enc.prescription || enc.prescriptions?.[0];
  const hasVitals = enc.vitals && typeof enc.vitals === 'object' && Object.values(enc.vitals).some(v => v !== null && v !== undefined && v !== '');

  // Parse testsRequired safely
  let testsList: string[] = [];
  if (Array.isArray(enc.testsRequired)) {
    testsList = enc.testsRequired;
  } else if (typeof enc.testsRequired === 'string' && enc.testsRequired.trim()) {
    testsList = enc.testsRequired.split(',').map((t: string) => t.trim()).filter(Boolean);
  }

  return (
    <div className="bg-slate-50/75 border border-slate-200/80 rounded-xl p-3.5 space-y-3 text-xs shadow-sm hover:shadow-md transition-shadow">
      {/* Date and Provider */}
      <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold border-b border-slate-200/50 pb-1.5">
        <div className="flex items-center space-x-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{new Date(enc.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
        </div>
        {enc.doctor?.user && (
          <span className="text-indigo-600 bg-indigo-50/50 px-1.5 py-0.5 rounded-md text-[9px] font-bold">
            Dr. {enc.doctor.user.firstName} {enc.doctor.user.lastName.substring(0, 1)}.
          </span>
        )}
      </div>

      {/* Diagnosis */}
      <div>
        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Diagnosis</span>
        <div className="font-bold text-slate-800 text-[13px] leading-tight">
          {enc.diagnosis || 'General Consultation'}
        </div>
      </div>

      {/* Chief Complaint */}
      {enc.complaint && (
        <div>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Chief Complaint</span>
          <p className="text-slate-800 text-[11px] leading-relaxed bg-white border border-slate-100 p-2 rounded-lg">
            {enc.complaint}
          </p>
        </div>
      )}

      {/* Vitals */}
      {hasVitals && (
        <div>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Vitals / Measurements</span>
          <div className="grid grid-cols-2 gap-1.5">
            {enc.vitals.bp && (
              <div className="bg-white border border-slate-100 px-2 py-1 rounded flex justify-between items-center text-[10px]">
                <span className="text-slate-500 font-medium">BP</span>
                <span className="font-semibold text-slate-800">{enc.vitals.bp} <span className="text-[8px] text-slate-400">mmHg</span></span>
              </div>
            )}
            {enc.vitals.pulse && (
              <div className="bg-white border border-slate-100 px-2 py-1 rounded flex justify-between items-center text-[10px]">
                <span className="text-slate-500 font-medium">Pulse</span>
                <span className="font-semibold text-slate-800">{enc.vitals.pulse} <span className="text-[8px] text-slate-400">bpm</span></span>
              </div>
            )}
            {enc.vitals.temp && (
              <div className="bg-white border border-slate-100 px-2 py-1 rounded flex justify-between items-center text-[10px]">
                <span className="text-slate-500 font-medium">Temp</span>
                <span className="font-semibold text-slate-800">{enc.vitals.temp} <span className="text-[8px] text-slate-400">°F</span></span>
              </div>
            )}
            {enc.vitals.weight && (
              <div className="bg-white border border-slate-100 px-2 py-1 rounded flex justify-between items-center text-[10px]">
                <span className="text-slate-500 font-medium">Wt</span>
                <span className="font-semibold text-slate-800">{enc.vitals.weight} <span className="text-[8px] text-slate-400">kg</span></span>
              </div>
            )}
            {enc.vitals.height && (
              <div className="bg-white border border-slate-100 px-2 py-1 rounded flex justify-between items-center text-[10px]">
                <span className="text-slate-500 font-medium">Ht</span>
                <span className="font-semibold text-slate-800">{enc.vitals.height} <span className="text-[8px] text-slate-400">cm</span></span>
              </div>
            )}
            {enc.vitals.sugar && (
              <div className="bg-white border border-slate-100 px-2 py-1 rounded flex justify-between items-center text-[10px]">
                <span className="text-slate-500 font-medium">Sugar</span>
                <span className="font-semibold text-slate-800">{enc.vitals.sugar} <span className="text-[8px] text-slate-400">mg/dL</span></span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Clinical Notes / Remarks */}
      {enc.clinicalNotes && (
        <div>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Clinical Remarks</span>
          <p className="text-slate-700 text-[11px] leading-relaxed bg-white border border-slate-100 p-2 rounded-lg whitespace-pre-line italic">
            {enc.clinicalNotes}
          </p>
        </div>
      )}

      {/* Recommended Lab Tests */}
      {testsList.length > 0 && (
        <div>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Recommended Lab Tests</span>
          <div className="flex flex-wrap gap-1">
            {testsList.map((test: string, index: number) => (
              <span key={index} className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                {test}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Prescription (Rx) */}
      {prescription && prescription.items && prescription.items.length > 0 && (
        <div>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Prescription (Rx)</span>
          <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-2">
            {prescription.items.map((it: any, i: number) => {
              const medName = it.medicine?.name || it.medicineName;
              const strength = it.medicine?.strength || it.strength;
              const dosageForm = it.medicine?.dosageForm || it.dosageForm;
              const genericName = it.medicine?.genericName || it.genericName;
              
              return (
                <div key={i} className="border-b border-slate-100 last:border-b-0 pb-1.5 last:pb-0 text-[10px] space-y-0.5">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-800">
                      {medName} {strength && <span className="font-normal text-slate-500 text-[9px]">({strength})</span>}
                    </span>
                    <span className="text-indigo-600 font-bold text-[10px]">
                      {it.dosage}
                    </span>
                  </div>
                  {genericName && (
                    <div className="text-[9px] text-slate-400 italic">
                      {genericName}
                    </div>
                  )}
                  <div className="flex justify-between items-center text-[9px] text-slate-500 pt-0.5">
                    <span>{it.instructions}</span>
                    <span className="font-medium text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded-full text-[8px]">{it.durationDays} days</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Follow-up date */}
      {enc.followUpDate && (
        <div className="flex items-center space-x-1 text-[9px] text-slate-500 bg-indigo-50 border border-indigo-100 p-2 rounded-lg justify-center font-medium">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>Follow-up: <strong className="text-indigo-700">{new Date(enc.followUpDate).toLocaleDateString()}</strong></span>
        </div>
      )}
    </div>
  );
}

export default function DoctorDashboard() {
  const { user, clinic, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  // Navigation tab state: 'queue' | 'patients' | 'billing' | 'medicines' | 'settings' | 'analytics'
  const [activeTab, setActiveTab] = useState<'queue' | 'patients' | 'billing' | 'medicines' | 'settings' | 'analytics'>('queue');

  // ==========================================
  // TAB 1: QUEUE & CONSULTATION STATES
  // ==========================================
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [patientTimeline, setPatientTimeline] = useState<any | null>(null);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // Encounter form state
  const [complaint, setComplaint] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [testsRequired, setTestsRequired] = useState('');
  const [vitals, setVitals] = useState({
    bp: '',
    pulse: '',
    temp: '',
    weight: '',
    height: '',
    sugar: '',
  });

  // Prescription builder state
  const [prescriptionItems, setPrescriptionItems] = useState<any[]>([]);
  const [medQuery, setMedQuery] = useState('');
  const [medResults, setMedResults] = useState<any[]>([]);
  const [selectedMed, setSelectedMed] = useState<any | null>(null);
  const [dosage, setDosage] = useState('1-0-1');
  const [instructions, setInstructions] = useState('After food');
  const [durationDays, setDurationDays] = useState(5);

  const [savingEncounter, setSavingEncounter] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // ==========================================
  // TAB 2: PATIENTS REGISTER / MERGE STATES
  // ==========================================
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<any[]>([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [selectedPatientForTimeline, setSelectedPatientForTimeline] = useState<any | null>(null);
  const [patientHistoryTimeline, setPatientHistoryTimeline] = useState<any | null>(null);
  const [loadingHistoryTimeline, setLoadingHistoryTimeline] = useState(false);

  // New Patient Form State
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
  const [registeringPatient, setRegisteringPatient] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [duplicatePatient, setDuplicatePatient] = useState<any | null>(null);

  // Edit Patient Form State
  const [editingPatient, setEditingPatient] = useState<any | null>(null);

  // Merge duplicates state
  const [mergeSourceId, setMergeSourceId] = useState('');
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [merging, setMerging] = useState(false);
  const [mergeError, setMergeError] = useState('');
  const [mergeSuccess, setMergeSuccess] = useState(false);

  // Modal Visibility States
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);

  // ==========================================
  // TAB 3: BILLING & RECEIPTS STATES
  // ==========================================
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

  // ==========================================
  // TAB 4: MEDICINE CATALOG STATES
  // ==========================================
  const [medicines, setMedicines] = useState<any[]>([]);
  const [searchMedQuery, setSearchMedQuery] = useState('');
  const [medModalOpen, setMedModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<any | null>(null);
  const [medForm, setMedForm] = useState({
    name: '',
    genericName: '',
    dosageForm: 'TABLET',
    strength: '',
    defaultSchedule: '1-0-1',
  });
  const [submittingMed, setSubmittingMed] = useState(false);

  // ==========================================
  // TAB 5: CLINIC & DOCTOR PROFILE SETTINGS
  // ==========================================
  const [clinicDetail, setClinicDetail] = useState<any>(null);
  const [clinicForm, setClinicForm] = useState({
    name: '',
    address: '',
    phone: '',
    whatsapp: '',
    timings: '',
    facilities: '',
  });
  const [submittingClinic, setSubmittingClinic] = useState(false);

  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [doctorForm, setDoctorForm] = useState({
    specialty: '',
    licenseNo: '',
    fees: 200,
    durationMin: 15,
  });
  const [submittingDoctorProfile, setSubmittingDoctorProfile] = useState(false);

  // ==========================================
  // TAB 6: PRACTICE ANALYTICS & AUDIT LOGS
  // ==========================================
  const [stats, setStats] = useState<any>({
    visitsCount: 0,
    todayRevenue: 0,
    paymentSplit: { CASH: 0, UPI: 0, CARD: 0 },
    pendingDues: 0,
  });
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [searchAuditQuery, setSearchAuditQuery] = useState('');

  // Quick Check-In / Booking States
  const [bookingPatient, setBookingPatient] = useState<any | null>(null);
  const [bookingType, setBookingType] = useState<'SLOT' | 'WALK_IN'>('WALK_IN');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState('');
  const [bookingIsFollowUp, setBookingIsFollowUp] = useState(false);
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingSlots, setBookingSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  // Consultation Queue UI Customization States
  const [showQueueSidebar, setShowQueueSidebar] = useState(true);
  const [showHistorySidebar, setShowHistorySidebar] = useState(true);
  const [consultationTab, setConsultationTab] = useState<'charting' | 'prescription' | 'outcome'>('charting');

  // ==========================================
  // AUTH GUARD CHECK
  // ==========================================
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/portal-login');
      } else if (user.role !== 'DOCTOR' && user.role !== 'OWNER' && user.role !== 'STAFF') {
        router.push('/login');
      }
    }
  }, [user, authLoading]);

  // ==========================================
  // DATA LOADING CONTROLLER
  // ==========================================
  useEffect(() => {
    if (!authLoading && user) {
      loadSettingsData().catch(err => console.error('Failed to prefetch settings:', err));
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (!authLoading && user) {
      if (activeTab === 'queue') {
        loadQueue();
      } else if (activeTab === 'billing') {
        loadInvoices();
      } else if (activeTab === 'medicines') {
        loadMedicines();
      } else if (activeTab === 'settings') {
        loadSettingsData();
      } else if (activeTab === 'analytics') {
        loadAnalyticsData();
      }
    }
  }, [activeTab, authLoading, user]);

  // ==========================================
  // TAB 1: QUEUE ACTIONS
  // ==========================================
  const loadQueue = async () => {
    if (!user?.profileId) return;
    setLoadingQueue(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const data = await apiFetch(`/appointment?doctorId=${user.profileId}&date=${todayStr}`);
      setAppointments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQueue(false);
    }
  };

  const fetchBookingSlots = async () => {
    if (!user?.profileId || !bookingDate || bookingType !== 'SLOT' || !bookingPatient) {
      setBookingSlots([]);
      return;
    }
    setLoadingSlots(true);
    setBookingTime('');
    try {
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${BASE_URL}/public/doctor/${user.profileId}/slots?date=${bookingDate}`);
      if (!res.ok) throw new Error('Failed to fetch slots');
      const data = await res.json();
      setBookingSlots(data);
    } catch (err) {
      console.error('Error fetching booking slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    fetchBookingSlots();
  }, [bookingDate, bookingType, bookingPatient]);

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingPatient || !user?.profileId) return;
    setBookingInProgress(true);
    try {
      const payload: any = {
        patientId: bookingPatient.id,
        doctorId: user.profileId,
        type: bookingType,
        isFollowUp: bookingIsFollowUp,
        notes: bookingNotes,
      };

      if (bookingType === 'SLOT') {
        if (!bookingTime) {
          throw new Error('Please select a booking time');
        }
        payload.startTime = new Date(`${bookingDate}T${bookingTime}`).toISOString();
      } else {
        payload.startTime = new Date(`${bookingDate}T00:00:00`).toISOString();
      }

      await apiFetch('/appointment', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setBookingPatient(null);
      setBookingTime('');
      setBookingNotes('');
      setBookingIsFollowUp(false);
      
      loadQueue();

      const todayStr = new Date().toISOString().split('T')[0];
      if (bookingDate === todayStr) {
        setActiveTab('queue');
      }
      alert('Patient checked in successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to book appointment');
    } finally {
      setBookingInProgress(false);
    }
  };

  const openConsultation = async (app: any) => {
    setSelectedApp(app);
    setSuccessMsg('');
    setErrorMsg('');
    setConsultationTab('charting');

    // Reset encounter fields
    setComplaint('');
    setDiagnosis('');
    setClinicalNotes('');
    setFollowUpDate('');
    setTestsRequired('');
    setVitals({
      bp: '',
      pulse: '',
      temp: '',
      weight: '',
      height: '',
      sugar: '',
    });
    setPrescriptionItems([]);

    // Set default follow up date (7 days from now)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    setFollowUpDate(nextWeek.toISOString().split('T')[0]);

    // Load patient historical timeline
    setLoadingTimeline(true);
    try {
      const data = await apiFetch(`/patient/${app.patient.id}/timeline`);
      setPatientTimeline(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTimeline(false);
    }

    // Set appointment status to IN_CONSULTATION if currently CHECKED_IN or BOOKED
    if (app.status === 'CHECKED_IN' || app.status === 'BOOKED') {
      try {
        await apiFetch(`/appointment/${app.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'IN_CONSULTATION' }),
        });
        loadQueue();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Medicine catalog search for prescription autocomplete
  const handleMedSearch = async (val: string) => {
    setMedQuery(val);
    if (!val.trim()) {
      setMedResults([]);
      return;
    }
    try {
      const results = await apiFetch(`/encounter/medicine/search?q=${encodeURIComponent(val.trim())}`);
      setMedResults(results);
    } catch (err) {
      console.error(err);
    }
  };

  const addPrescriptionItem = () => {
    if (!medQuery.trim()) return;
    if (!selectedMed) {
      alert('Please search and select a medicine from the catalog. If it is a new medicine, please add it under the Medicine Catalog tab first.');
      return;
    }
    const item = {
      medicineId: selectedMed.id,
      medicineName: selectedMed.name,
      genericName: selectedMed.genericName || '',
      dosageForm: selectedMed.dosageForm || 'TABLET',
      strength: selectedMed.strength || '',
      dosage,
      instructions,
      durationDays,
    };
    setPrescriptionItems([...prescriptionItems, item]);
    // Reset builder inputs
    setMedQuery('');
    setSelectedMed(null);
    setMedResults([]);
    setDosage('1-0-1');
    setInstructions('After food');
    setDurationDays(5);
  };

  const removePrescriptionItem = (index: number) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index));
  };

  const handleSaveEncounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    setSavingEncounter(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        appointmentId: selectedApp.id,
        patientId: selectedApp.patient.id,
        complaint: complaint.trim(),
        diagnosis: diagnosis.trim(),
        clinicalNotes: clinicalNotes.trim(),
        followUpDate: followUpDate ? new Date(followUpDate).toISOString() : undefined,
        testsRequired: testsRequired.trim()
          ? testsRequired.split(',').map(s => s.trim()).filter(Boolean)
          : undefined,
        vitals: Object.values(vitals).some(v => v !== '') ? vitals : undefined,
        prescriptionItems: prescriptionItems.length > 0 
          ? prescriptionItems.map(item => ({
              medicineId: item.medicineId,
              dosage: item.dosage,
              instructions: item.instructions,
              durationDays: item.durationDays,
            }))
          : undefined,
      };

      await apiFetch('/encounter', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSuccessMsg('Encounter saved and visit marked complete!');
      setSelectedApp(null);
      setPatientTimeline(null);
      loadQueue();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save clinical encounter');
    } finally {
      setSavingEncounter(false);
    }
  };

  // ==========================================
  // TAB 2: PATIENTS ACTIONS
  // ==========================================
  const handlePatientSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!patientSearchQuery.trim()) return;
    setSearchingPatients(true);
    try {
      const results = await apiFetch(`/patient/search?q=${encodeURIComponent(patientSearchQuery.trim())}`);
      setPatientSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingPatients(false);
    }
  };

  const viewPatientTimeline = async (patientId: string) => {
    setLoadingHistoryTimeline(true);
    try {
      const timeline = await apiFetch(`/patient/${patientId}/timeline`);
      setPatientHistoryTimeline(timeline);
      const matched = patientSearchResults.find((p) => p.id === patientId) || timeline;
      setSelectedPatientForTimeline(matched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistoryTimeline(false);
    }
  };

  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess(false);
    setDuplicatePatient(null);
    setRegisteringPatient(true);
    try {
      const payload = {
        ...newPatient,
        allergies: newPatient.allergies.split(',').map(s => s.trim()).filter(Boolean),
        chronicConditions: newPatient.chronicConditions.split(',').map(s => s.trim()).filter(Boolean),
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
      // refresh search results with new patient
      setPatientSearchResults([res, ...patientSearchResults]);
      viewPatientTimeline(res.id);
      setBookingPatient(res);
      setRegisterModalOpen(false);
    } catch (err: any) {
      setRegisterError(err.message || 'Failed to register patient');
      if (err.data && err.data.isDuplicate && err.data.existingPatient) {
        setDuplicatePatient(err.data.existingPatient);
      }
    } finally {
      setRegisteringPatient(false);
    }
  };

  const handleEditPatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;
    try {
      const payload = {
        firstName: editingPatient.firstName,
        lastName: editingPatient.lastName,
        phone: editingPatient.phone,
        dob: editingPatient.dob,
        gender: editingPatient.gender,
        address: editingPatient.address,
        allergies: typeof editingPatient.allergies === 'string'
          ? editingPatient.allergies.split(',').map((s: string) => s.trim()).filter(Boolean)
          : editingPatient.allergies,
        chronicConditions: typeof editingPatient.chronicConditions === 'string'
          ? editingPatient.chronicConditions.split(',').map((s: string) => s.trim()).filter(Boolean)
          : editingPatient.chronicConditions,
      };

      const res = await apiFetch(`/patient/${editingPatient.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setEditingPatient(null);
      // update list and timeline
      setPatientSearchResults(patientSearchResults.map(p => p.id === res.id ? res : p));
      viewPatientTimeline(res.id);
    } catch (err: any) {
      alert(err.message || 'Failed to update patient');
    }
  };

  const handleMergePatientsSubmit = async (e: React.FormEvent) => {
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
      setPatientSearchResults([]);
      setSelectedPatientForTimeline(null);
      setPatientHistoryTimeline(null);
    } catch (err: any) {
      setMergeError(err.message || 'Failed to merge patient profiles');
    } finally {
      setMerging(false);
    }
  };

  // ==========================================
  // TAB 3: BILLING ACTIONS
  // ==========================================
  const loadInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const data = await apiFetch('/billing/invoice');
      setInvoices(data);
      // Prefetch clinic settings and doctor profile for printable invoices
      loadSettingsData().catch(err => console.error(err));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInvoices(false);
    }
  };

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

  const handleCreateInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoicePatient) return;
    try {
      await apiFetch('/billing/invoice', {
        method: 'POST',
        body: JSON.stringify({
          patientId: invoicePatient.id,
          discount: parseFloat(invoiceDiscount) || 0,
          tax: parseFloat(invoiceTax) || 0,
          items: invoiceItems.map(item => ({
            description: item.description,
            quantity: Number(item.quantity) || 1,
            amount: Number(item.amount) || 0,
          })),
        }),
      });
      setShowCreateInvoiceForm(false);
      setInvoicePatient(null);
      setInvoicePatientSearch('');
      setInvoiceItems([{ description: 'Consultation Fee', quantity: 1, amount: Number(doctorProfile?.fees) || 250 }]);
      setInvoiceDiscount('0');
      setInvoiceTax('0');
      loadInvoices();
    } catch (err: any) {
      alert(err.message || 'Failed to generate invoice');
    }
  };

  const handleCollectPaymentSubmit = async (e: React.FormEvent) => {
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
      alert(err.message || 'Failed to log transaction');
    }
  };

  const openInvoiceDetails = async (inv: any) => {
    try {
      const details = await apiFetch(`/billing/invoice/${inv.id}`);
      setSelectedInvoice(details);
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewInvoiceFromAnalytics = async (inv: any) => {
    setActiveTab('billing');
    await openInvoiceDetails(inv);
  };

  // ==========================================
  // TAB 4: MEDICINE MASTER ACTIONS
  // ==========================================
  const loadMedicines = async () => {
    try {
      const data = await apiFetch('/medicine');
      setMedicines(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMedicineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingMed(true);
    try {
      if (editingMed) {
        await apiFetch(`/medicine/${editingMed.id}`, {
          method: 'PATCH',
          body: JSON.stringify(medForm),
        });
      } else {
        await apiFetch('/medicine', {
          method: 'POST',
          body: JSON.stringify(medForm),
        });
      }
      setMedModalOpen(false);
      setEditingMed(null);
      setMedForm({ name: '', genericName: '', dosageForm: 'TABLET', strength: '', defaultSchedule: '1-0-1' });
      loadMedicines();
    } catch (err: any) {
      alert(err.message || 'Failed to save medicine');
    } finally {
      setSubmittingMed(false);
    }
  };

  const handleDeleteMedicine = async (id: string) => {
    if (!confirm('Are you sure you want to remove this medicine from catalog?')) return;
    try {
      await apiFetch(`/medicine/${id}`, { method: 'DELETE' });
      loadMedicines();
    } catch (err: any) {
      alert(err.message || 'Failed to delete medicine');
    }
  };

  // ==========================================
  // TAB 5: PROFILE & SETTINGS ACTIONS
  // ==========================================
  const loadSettingsData = async () => {
    try {
      const clinicData = await apiFetch('/auth/clinic');
      setClinicDetail(clinicData);
      setClinicForm({
        name: clinicData.name || '',
        address: clinicData.address || '',
        phone: clinicData.phone || '',
        whatsapp: clinicData.settings?.whatsapp || '',
        timings: clinicForm.timings || clinicData.settings?.timings || 'Mon - Sat: 9:00 AM - 5:00 PM',
        facilities: clinicForm.facilities || (Array.isArray(clinicData.settings?.facilities)
          ? clinicData.settings.facilities.join(', ')
          : 'General Consultation, Pharmacy, Vitals Checkup'),
      });

      const docs = await apiFetch('/doctor');
      const myDoc = docs.find((d: any) => d.userId === user?.id) || docs[0];
      if (myDoc) {
        setDoctorProfile(myDoc);
        setDoctorForm({
          specialty: myDoc.specialty || '',
          licenseNo: myDoc.licenseNo || '',
          fees: Number(myDoc.fees) || 200,
          durationMin: myDoc.durationMin || 15,
        });
        setInvoiceItems([{ description: 'Consultation Fee', quantity: 1, amount: Number(myDoc.fees) || 250 }]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClinicUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingClinic(true);
    try {
      const payload = {
        name: clinicForm.name.trim(),
        address: clinicForm.address.trim(),
        phone: clinicForm.phone.trim(),
        settings: {
          whatsapp: clinicForm.whatsapp.trim(),
          timings: clinicForm.timings.trim(),
          facilities: clinicForm.facilities.split(',').map(s => s.trim()).filter(Boolean),
        }
      };
      await apiFetch('/admin/clinic', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      alert('Clinic details updated successfully.');
      loadSettingsData();
    } catch (err: any) {
      alert(err.message || 'Failed to update clinic');
    } finally {
      setSubmittingClinic(false);
    }
  };

  const handleDoctorProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingDoctorProfile(true);
    try {
      await apiFetch('/doctor/profile', {
        method: 'PATCH',
        body: JSON.stringify(doctorForm),
      });
      alert('Doctor profile settings updated successfully.');
      loadSettingsData();
    } catch (err: any) {
      alert(err.message || 'Failed to update doctor profile');
    } finally {
      setSubmittingDoctorProfile(false);
    }
  };

  // ==========================================
  // TAB 6: ANALYTICS ACTIONS
  // ==========================================
  const loadAnalyticsData = async () => {
    setLoadingAnalytics(true);
    try {
      const [statsData, auditData] = await Promise.all([
        apiFetch('/admin/stats'),
        apiFetch('/admin/audit-logs'),
      ]);
      setStats(statsData);
      setAuditLogs(auditData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Filter audit logs
  const filteredAuditLogs = auditLogs.filter(log => {
    if (!searchAuditQuery.trim()) return true;
    const query = searchAuditQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(query) ||
      log.entityName.toLowerCase().includes(query) ||
      (log.user?.firstName && log.user.firstName.toLowerCase().includes(query)) ||
      (log.user?.lastName && log.user.lastName.toLowerCase().includes(query))
    );
  });

  const filteredMeds = medicines.filter(med => {
    if (!searchMedQuery.trim()) return true;
    const query = searchMedQuery.toLowerCase();
    return med.name.toLowerCase().includes(query) || (med.genericName && med.genericName.toLowerCase().includes(query));
  });

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-teal-400">
        <Loader className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800">
      {/* -------------------- SIDEBAR -------------------- */}
      <aside className="w-full md:w-64 bg-slate-950 text-slate-100 flex flex-col shrink-0 border-r border-slate-900 z-20">
        <div className="p-5 border-b border-slate-900 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/10">
              <Activity className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-white block">Solo Clinic OS</span>
              <span className="text-[9px] text-teal-400 font-bold uppercase tracking-wider block">
                {clinicDetail?.name || clinic?.name || 'Medical Portal'}
              </span>
            </div>
          </div>
        </div>

        {/* Doctor Info */}
        <div className="p-4 mx-3 my-4 bg-slate-900/50 border border-slate-900 rounded-xl text-xs flex items-center space-x-3">
          <div className="w-9 h-9 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold rounded-lg flex items-center justify-center text-sm uppercase">
            Dr
          </div>
          <div>
            <p className="font-bold text-white">Dr. {user.firstName} {user.lastName}</p>
            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">
              Practice Admin
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
          {[
            { id: 'queue', label: 'Consultations Queue', icon: Activity },
            { id: 'patients', label: 'Patient Database', icon: Users },
            { id: 'billing', label: 'Invoices & Billing', icon: CreditCard },
            { id: 'medicines', label: 'Medicine Catalog', icon: FileText },
            { id: 'settings', label: 'Clinic Settings', icon: Settings },
            { id: 'analytics', label: 'Practice Analytics', icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSelectedApp(null);
                  setPatientTimeline(null);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all transform ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/10 translate-x-1'
                    : 'text-slate-500 hover:bg-slate-900/40 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-teal-350' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-900">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 py-2 bg-slate-900 hover:bg-red-950/20 hover:text-red-400 hover:border-red-900/30 border border-slate-800 rounded-lg text-xs font-bold text-slate-400 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Desk</span>
          </button>
        </div>
      </aside>

      {/* -------------------- MAIN WORKSPACE -------------------- */}
      <div className="flex-1 flex flex-col min-w-0 text-slate-800">
        <header className="h-16 bg-white border-b border-slate-200/85 px-6 flex items-center justify-between shrink-0 shadow-sm print:hidden">
          <h2 className="font-extrabold text-slate-800 text-sm tracking-wider uppercase">
            {activeTab === 'queue' && "Today's Clinical Queue"}
            {activeTab === 'patients' && 'Patient Records & Registration'}
            {activeTab === 'billing' && 'Billing Ledger & Invoices'}
            {activeTab === 'medicines' && 'Medicine Master Catalog'}
            {activeTab === 'settings' && 'Clinic Configuration Console'}
            {activeTab === 'analytics' && 'Practice Overview & Audit Logs'}
          </h2>
          <div className="flex items-center space-x-3 text-xs">
            {activeTab === 'queue' && (
              <div className="flex items-center space-x-2 border-r border-slate-200 pr-3">
                <button
                  onClick={() => setShowQueueSidebar(!showQueueSidebar)}
                  className={`p-1.5 rounded-lg border transition-all flex items-center justify-center space-x-1 font-bold ${
                    showQueueSidebar
                      ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                      : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                  }`}
                  title="Toggle Queue Sidebar (Left)"
                >
                  {showQueueSidebar ? <ChevronsLeft className="w-4 h-4" /> : <ChevronsRight className="w-4 h-4" />}
                  <span className="text-[10px] uppercase tracking-wider">Queue</span>
                </button>

                {selectedApp && (
                  <button
                    onClick={() => setShowHistorySidebar(!showHistorySidebar)}
                    className={`p-1.5 rounded-lg border transition-all flex items-center justify-center space-x-1 font-bold ${
                      showHistorySidebar
                        ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                        : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                    }`}
                    title="Toggle History Sidebar (Right)"
                  >
                    <span className="text-[10px] uppercase tracking-wider">History</span>
                    {showHistorySidebar ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
                  </button>
                )}
              </div>
            )}
            <span className="bg-teal-50 border border-teal-200 text-teal-700 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider flex items-center">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-ping"></span>
              Live Practice Mode
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto min-w-0">
          {/* ==========================================
              TAB 1: QUEUE & CONSULTATION SCREEN
              ========================================== */}
          {activeTab === 'queue' && (
            <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
              {/* Queue List Column */}
              {showQueueSidebar && (
                <div className="w-full lg:w-76 shrink-0 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Queue Order</span>
                    <button onClick={loadQueue} className="text-[10px] text-indigo-600 hover:underline font-bold uppercase tracking-wider">
                      Refresh
                    </button>
                  </div>
                  <div className="flex-1 divide-y divide-slate-100">
                    {loadingQueue ? (
                      <div className="p-8 flex justify-center"><Loader className="w-6 h-6 animate-spin text-indigo-500" /></div>
                    ) : appointments.length > 0 ? (
                      appointments.map((app) => (
                        <div
                          key={app.id}
                          onClick={() => openConsultation(app)}
                          className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors border-l-4 ${
                            selectedApp?.id === app.id ? 'bg-slate-50/60 border-indigo-600' : 'border-transparent'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="text-xs font-bold text-slate-800">
                              {app.patient.firstName} {app.patient.lastName}
                            </h4>
                            <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              app.status === 'CHECKED_IN' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                              app.status === 'IN_CONSULTATION' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' :
                              app.status === 'COMPLETED' ? 'bg-slate-100 text-slate-500 border border-slate-300' :
                              'bg-slate-50 text-slate-600 border border-slate-200'
                            }`}>
                              {app.status}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-slate-1000 mt-2">
                            <span className="flex items-center">
                              <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                              {app.type === 'SLOT' ? (
                                new Date(app.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              ) : (
                                `Walk-in #${app.queueNumber}`
                              )}
                            </span>
                            {app.isFollowUp && (
                              <span className="text-[8px] bg-indigo-50 text-indigo-600 px-1 rounded font-bold uppercase">
                                Follow-up
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 text-xs italic p-6 text-center">No patients checked-in today.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Consultation Area */}
              <div className="flex-1 flex flex-col lg:flex-row gap-6 min-w-0">
                {selectedApp ? (
                  <>
                    <form onSubmit={handleSaveEncounter} className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col text-slate-800">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-4 shrink-0">
                        <div className="flex items-center space-x-3">
                          <Clipboard className="w-5 h-5 text-indigo-600" />
                          <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Consultation Pad</h3>
                        </div>
                        <span className="text-xs text-slate-500">
                          File: <span className="font-bold text-slate-800">{selectedApp.patient.firstName} {selectedApp.patient.lastName}</span>
                        </span>
                      </div>

                      {/* Tab Header Controls */}
                      <div className="flex border-b border-slate-200 shrink-0">
                        <button
                          type="button"
                          onClick={() => setConsultationTab('charting')}
                          className={`flex-1 py-3 px-4 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center space-x-2 ${
                            consultationTab === 'charting'
                              ? 'border-indigo-500 text-indigo-600'
                              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <Activity className="w-4 h-4" />
                          <span>1. Clinical Charting</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConsultationTab('prescription')}
                          className={`flex-1 py-3 px-4 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center space-x-2 ${
                            consultationTab === 'prescription'
                              ? 'border-indigo-500 text-indigo-600'
                              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <FileText className="w-4 h-4" />
                          <span>2. Prescription (Rx)</span>
                          {prescriptionItems.length > 0 && (
                            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                              {prescriptionItems.length}
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConsultationTab('outcome')}
                          className={`flex-1 py-3 px-4 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center space-x-2 ${
                            consultationTab === 'outcome'
                              ? 'border-indigo-500 text-indigo-600'
                              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>3. Diagnosis & Plan</span>
                        </button>
                      </div>

                      {/* Tab Contents */}
                      <div className="flex-1 space-y-6">
                        
                        {/* TAB 1: CLINICAL CHARTING */}
                        {consultationTab === 'charting' && (
                          <div className="space-y-6">
                            {/* Observations Vitals */}
                            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-3">
                              <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider block flex items-center">
                                <Heart className="w-3.5 h-3.5 mr-1.5 text-indigo-600 animate-pulse" /> Vitals & Measurements
                              </span>
                              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                                {['bp', 'pulse', 'temp', 'weight', 'height', 'sugar'].map((vital) => (
                                  <div key={vital} className="space-y-1">
                                    <label className="text-[9px] text-slate-500 font-bold uppercase block">{vital}</label>
                                    <input
                                      type="text"
                                      value={(vitals as any)[vital]}
                                      onChange={(e) => setVitals({ ...vitals, [vital]: e.target.value })}
                                      placeholder={vital === 'bp' ? '120/80' : vital === 'temp' ? '98.6' : '—'}
                                      className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:outline-none rounded px-2.5 py-1.5 text-xs text-slate-800"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Chief Complaint */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Chief Complaint</label>
                              <textarea
                                rows={4}
                                value={complaint}
                                onChange={(e) => setComplaint(e.target.value)}
                                placeholder="Symptoms, duration, trigger conditions..."
                                className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-lg px-3 py-2 text-xs text-slate-800"
                              />
                            </div>

                            {/* Clinical Notes */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Clinical Notes / Examination Remarks</label>
                              <textarea
                                rows={4}
                                value={clinicalNotes}
                                onChange={(e) => setClinicalNotes(e.target.value)}
                                placeholder="Detailed inspection findings, history reviews, physical assessment remarks..."
                                className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-lg px-3 py-2 text-xs text-slate-800"
                              />
                            </div>

                            <div className="flex justify-end pt-4 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => setConsultationTab('prescription')}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-all shadow-sm"
                              >
                                <span>Go to Prescription</span>
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* TAB 2: PRESCRIPTION (Rx) */}
                        {consultationTab === 'prescription' && (
                          <div className="space-y-6">
                            <div className="border border-slate-200/80 rounded-2xl p-4 space-y-4">
                              <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider block flex items-center">
                                <FileText className="w-3.5 h-3.5 mr-1.5 text-indigo-600" /> Prescription Builder
                              </span>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end bg-slate-50/50 p-3 border border-slate-100 rounded-xl">
                                <div className="space-y-1.5 sm:col-span-2 relative">
                                  <label className="text-[9px] text-slate-500 font-bold uppercase block">Medicine Name</label>
                                  <input
                                    type="text"
                                    value={medQuery}
                                    onChange={(e) => handleMedSearch(e.target.value)}
                                    placeholder="Type medicine name..."
                                    className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:outline-none rounded px-3 py-1.5 text-xs text-slate-800"
                                  />
                                  {medResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded shadow-lg z-30 max-h-40 overflow-y-auto mt-1 divide-y divide-slate-100">
                                      {medResults.map((med) => (
                                        <div
                                          key={med.id}
                                          onClick={() => {
                                            setSelectedMed(med);
                                            setMedQuery(med.name);
                                            setMedResults([]);
                                          }}
                                          className="p-2 hover:bg-slate-100 text-xs cursor-pointer text-slate-800 flex justify-between"
                                        >
                                          <span className="font-bold">{med.name}</span>
                                          <span className="text-[10px] text-slate-400">{med.genericName} - {med.strength}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[9px] text-slate-500 font-bold uppercase block">Dosage</label>
                                  <input
                                    type="text"
                                    value={dosage}
                                    onChange={(e) => setDosage(e.target.value)}
                                    placeholder="e.g. 1-0-1"
                                    className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:outline-none rounded px-3 py-1.5 text-xs text-slate-800"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[9px] text-slate-500 font-bold uppercase block">Instructions</label>
                                  <input
                                    type="text"
                                    value={instructions}
                                    onChange={(e) => setInstructions(e.target.value)}
                                    placeholder="e.g. After food"
                                    className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:outline-none rounded px-3 py-1.5 text-xs text-slate-800"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[9px] text-slate-500 font-bold uppercase block">Duration (Days)</label>
                                  <input
                                    type="number"
                                    value={durationDays}
                                    onChange={(e) => setDurationDays(Number(e.target.value))}
                                    placeholder="5"
                                    className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:outline-none rounded px-3 py-1.5 text-xs text-slate-800"
                                  />
                                </div>
                                <div className="sm:col-span-4 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={addPrescriptionItem}
                                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold text-xs flex items-center space-x-1.5"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add to Prescription</span>
                                  </button>
                                </div>
                              </div>

                              {/* Prescription Items List */}
                              {prescriptionItems.length > 0 && (
                                <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                                  <table className="w-full text-left border-collapse">
                                    <thead>
                                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 font-bold uppercase">
                                        <th className="p-3">Medicine</th>
                                        <th className="p-3">Form/Strength</th>
                                        <th className="p-3">Dosage</th>
                                        <th className="p-3">Instructions</th>
                                        <th className="p-3 text-center">Days</th>
                                        <th className="p-3 text-right">Remove</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-800">
                                      {prescriptionItems.map((item, index) => (
                                        <tr key={index}>
                                          <td className="p-3 font-semibold text-slate-800">{item.medicineName}</td>
                                          <td className="p-3 text-slate-500">{item.dosageForm} {item.strength}</td>
                                          <td className="p-3 font-semibold">{item.dosage}</td>
                                          <td className="p-3">{item.instructions}</td>
                                          <td className="p-3 text-center font-bold">{item.durationDays}</td>
                                          <td className="p-3 text-right">
                                            <button type="button" onClick={() => removePrescriptionItem(index)} className="text-red-500 hover:text-red-700">
                                              <Trash2 className="w-4 h-4 inline" />
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>

                            <div className="flex justify-between pt-4 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => setConsultationTab('charting')}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-all"
                              >
                                <ChevronLeft className="w-4 h-4" />
                                <span>Back to Charting</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setConsultationTab('outcome')}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-all shadow-sm"
                              >
                                <span>Go to Diagnosis & Plan</span>
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* TAB 3: DIAGNOSIS & ASSESSMENT */}
                        {consultationTab === 'outcome' && (
                          <div className="space-y-6">
                            {/* Diagnosis */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Diagnosis & Assessment</label>
                              <textarea
                                rows={4}
                                value={diagnosis}
                                onChange={(e) => setDiagnosis(e.target.value)}
                                placeholder="Primary diagnostic finding..."
                                className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-lg px-3 py-2 text-xs text-slate-800"
                              />
                            </div>

                            {/* Follow-up & Tests */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Follow-up Date</label>
                                <input
                                  type="date"
                                  value={followUpDate}
                                  onChange={(e) => setFollowUpDate(e.target.value)}
                                  className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-lg px-3 py-2 text-xs text-slate-800"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Recommended Lab Tests</label>
                                <input
                                  type="text"
                                  value={testsRequired}
                                  onChange={(e) => setTestsRequired(e.target.value)}
                                  placeholder="e.g. CBC, Lipid Profile, Thyroid Panel"
                                  className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-lg px-3 py-2 text-xs text-slate-800"
                                />
                              </div>
                            </div>

                            {/* Error & Success Messages */}
                            {errorMsg && <p className="text-red-600 text-xs font-semibold">{errorMsg}</p>}
                            {successMsg && <p className="text-emerald-600 text-xs font-bold">{successMsg}</p>}

                            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => setConsultationTab('prescription')}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-all"
                              >
                                <ChevronLeft className="w-4 h-4" />
                                <span>Back to Prescription</span>
                              </button>

                              <button
                                type="submit"
                                disabled={savingEncounter}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center space-x-2 shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {savingEncounter && <Loader className="h-4 w-4 animate-spin" />}
                                <span>Sign & Complete Consultation</span>
                              </button>
                            </div>
                          </div>
                        )}

                      </div>
                    </form>

                    {/* Historical Timeline sidebar */}
                    {showHistorySidebar && (
                      <aside className="w-full lg:w-76 shrink-0 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
                        <h4 className="text-[10px] text-slate-500 font-black uppercase tracking-wider border-b border-slate-100 pb-2">
                          Patient History Timeline
                        </h4>
                        {loadingTimeline ? (
                          <div className="flex justify-center py-10"><Loader className="w-5 h-5 animate-spin text-slate-400" /></div>
                        ) : patientTimeline?.encounters?.length > 0 ? (
                          <div className="relative border-l border-slate-200 pl-4 space-y-6 ml-2 mr-0.5">
                            {patientTimeline.encounters.map((enc: any) => (
                              <div key={enc.id} className="relative">
                                <span className="absolute -left-[23px] top-4 w-3.5 h-3.5 rounded-full border-2 border-indigo-500 bg-white shadow-sm z-10"></span>
                                <TimelineEncounterCard enc={enc} />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-400 text-xs italic text-center">No past visits recorded.</p>
                        )}
                      </aside>
                    )}
                  </>
                ) : (
                  <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-16 shadow-sm text-center flex flex-col items-center justify-center space-y-3">
                    <Clipboard className="w-12 h-12 text-slate-300" />
                    <h3 className="font-bold text-slate-800 text-base">Workspace Idle</h3>
                    <p className="text-slate-500 text-xs max-w-md">
                      Select a checked-in patient from the today queue sidebar to begin consultation and chart details.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 2: PATIENT DATABASE & MANAGEMENT
              ========================================== */}
          {activeTab === 'patients' && (
            <div className="space-y-6 min-h-0">
              {/* Patient Search & Action Header */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 gap-3">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center">
                    <Search className="w-4 h-4 mr-2 text-indigo-600" /> Search Patient Records
                  </h3>
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        setRegisterError('');
                        setRegisterSuccess(false);
                        setRegisterModalOpen(true);
                      }}
                      className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-sm hover:shadow-md"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Register Patient</span>
                    </button>
                    <button
                      onClick={() => {
                        setMergeError('');
                        setMergeSuccess(false);
                        setMergeModalOpen(true);
                      }}
                      className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-sm"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
                      <span>Merge Profiles</span>
                    </button>
                  </div>
                </div>

                <form onSubmit={handlePatientSearch} className="flex space-x-3">
                  <input
                    type="text"
                    value={patientSearchQuery}
                    onChange={(e) => setPatientSearchQuery(e.target.value)}
                    placeholder="Search by First Name, Last Name, or Mobile Number..."
                    required
                    className="flex-1 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none rounded-lg px-3.5 py-2 text-xs text-slate-800 placeholder-slate-500 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={searchingPatients}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs flex items-center space-x-1.5 transition-all shadow-sm shadow-indigo-500/10"
                  >
                    {searchingPatients ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    <span>Search</span>
                  </button>
                </form>

                {/* Search Results */}
                {patientSearchResults.length > 0 && (
                  <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 font-bold uppercase">
                          <th className="p-3">Patient Name</th>
                          <th className="p-3">Phone</th>
                          <th className="p-3">DOB / Age</th>
                          <th className="p-3">Gender</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {patientSearchResults.map((pat) => (
                          <tr key={pat.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-semibold">{pat.firstName} {pat.lastName}</td>
                            <td className="p-3">{pat.phone}</td>
                            <td className="p-3">
                              {new Date(pat.dob).toLocaleDateString()} (
                              {new Date().getFullYear() - new Date(pat.dob).getFullYear()}y)
                            </td>
                            <td className="p-3">{pat.gender}</td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => setBookingPatient(pat)}
                                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 font-bold rounded transition-all duration-150 shadow-sm"
                                >
                                  <Clock className="w-3 h-3 text-emerald-500" />
                                  <span>Check-In</span>
                                </button>
                                
                                <button
                                  onClick={() => viewPatientTimeline(pat.id)}
                                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 font-bold rounded transition-all duration-150 shadow-sm"
                                >
                                  <FileText className="w-3 h-3 text-indigo-500" />
                                  <span>Open File</span>
                                </button>
                                
                                <button
                                  onClick={() => setEditingPatient(pat)}
                                  className="inline-flex items-center space-x-1 px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded transition-all duration-150"
                                  title="Edit Patient Details"
                                >
                                  <Edit className="w-3 h-3 text-slate-500" />
                                  <span>Edit</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Opened Patient Detail Timeline (Full Width, Below Search) */}
              {selectedPatientForTimeline && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base flex items-center space-x-2.5">
                        <span className="text-[17px] text-slate-800">{selectedPatientForTimeline.firstName} {selectedPatientForTimeline.lastName}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                          ID: {selectedPatientForTimeline.id}
                        </span>
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Patient File Folder</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setBookingPatient(selectedPatientForTimeline)}
                        className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-all shadow-sm"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>Check-In Patient</span>
                      </button>
                      <button
                        onClick={() => setEditingPatient(selectedPatientForTimeline)}
                        className="py-1.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center justify-center space-x-1 transition-all"
                        title="Edit Patient Details"
                      >
                        <Edit className="w-4 h-4 text-slate-500" />
                        <span>Edit File</span>
                      </button>
                      <button
                        onClick={() => setSelectedPatientForTimeline(null)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                        title="Close Patient File"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Patient Info Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-50/50 p-4 border border-slate-100 rounded-xl">
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-400 block font-bold uppercase">Phone Number</span>
                      <strong className="text-slate-800 text-[13px]">{selectedPatientForTimeline.phone}</strong>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-400 block font-bold uppercase">Date of Birth</span>
                      <strong className="text-slate-800 text-[13px]">{new Date(selectedPatientForTimeline.dob).toLocaleDateString()}</strong>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-400 block font-bold uppercase">Allergies</span>
                      <strong className="text-slate-800 text-[12px] block truncate" title={Array.isArray(selectedPatientForTimeline.allergies) ? selectedPatientForTimeline.allergies.join(', ') : ''}>
                        {Array.isArray(selectedPatientForTimeline.allergies) && selectedPatientForTimeline.allergies.length > 0
                          ? selectedPatientForTimeline.allergies.join(', ')
                          : 'None recorded'}
                      </strong>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-400 block font-bold uppercase">Chronic Conditions</span>
                      <strong className="text-slate-800 text-[12px] block truncate" title={Array.isArray(selectedPatientForTimeline.chronicConditions) ? selectedPatientForTimeline.chronicConditions.join(', ') : ''}>
                        {Array.isArray(selectedPatientForTimeline.chronicConditions) && selectedPatientForTimeline.chronicConditions.length > 0
                          ? selectedPatientForTimeline.chronicConditions.join(', ')
                          : 'None recorded'}
                      </strong>
                    </div>
                  </div>

                  {/* Clinical History logs */}
                  <div className="space-y-3 pt-2">
                    <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Clinical Visit Logs</span>
                    {loadingHistoryTimeline ? (
                      <div className="flex justify-center py-8"><Loader className="w-8 h-8 animate-spin text-slate-400" /></div>
                    ) : patientHistoryTimeline?.encounters?.length > 0 ? (
                      <div className="relative border-l border-slate-200 pl-4 space-y-6 ml-2 mr-0.5">
                        {patientHistoryTimeline.encounters.map((enc: any) => (
                          <div key={enc.id} className="relative">
                            <span className="absolute -left-[23px] top-4 w-3.5 h-3.5 rounded-full border-2 border-indigo-500 bg-white shadow-sm z-10"></span>
                            <TimelineEncounterCard enc={enc} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-xs italic">No clinical history recorded.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==========================================
              TAB 3: BILLING & RECEIPTS
              ========================================== */}
          {activeTab === 'billing' && (
            <div className="flex flex-col lg:flex-row gap-6 min-h-0">
              {/* Left Column: Create Invoice Form */}
              <div className="flex-1 space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center">
                      <CreditCard className="w-4 h-4 mr-2 text-indigo-600" /> Generate Billing Invoice
                    </h3>
                    {!showCreateInvoiceForm && (
                      <button
                        onClick={() => setShowCreateInvoiceForm(true)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold text-xs"
                      >
                        New Invoice
                      </button>
                    )}
                  </div>

                  {showCreateInvoiceForm ? (
                    <form onSubmit={handleCreateInvoiceSubmit} className="space-y-4 text-xs">
                      {/* Patient selector */}
                      <div className="space-y-1.5 relative">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Target Patient *</label>
                        <input
                          type="text"
                          required
                          value={invoicePatient ? `${invoicePatient.firstName} ${invoicePatient.lastName} (${invoicePatient.phone})` : invoicePatientSearch}
                          disabled={!!invoicePatient}
                          onChange={(e) => searchBillingPatient(e.target.value)}
                          placeholder="Search patient name or mobile..."
                          className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-800"
                        />
                        {invoicePatient && (
                          <button
                            type="button"
                            onClick={() => {
                              setInvoicePatient(null);
                              setInvoicePatientSearch('');
                              setInvoicePatientResults([]);
                            }}
                            className="absolute right-3 top-7 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        {!invoicePatient && invoicePatientResults.length > 0 && (
                          <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded shadow-lg z-30 max-h-40 overflow-y-auto mt-1 divide-y divide-slate-100">
                            {invoicePatientResults.map((pat) => (
                              <div
                                key={pat.id}
                                onClick={() => {
                                  setInvoicePatient(pat);
                                  setInvoicePatientResults([]);
                                }}
                                className="p-2 hover:bg-slate-50 text-xs cursor-pointer text-slate-800 flex justify-between"
                              >
                                <span className="font-semibold">{pat.firstName} {pat.lastName}</span>
                                <span className="text-[10px] text-slate-400">{pat.phone}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Items */}
                      <div className="space-y-3">
                        <span className="text-[10px] text-slate-1000 font-bold uppercase tracking-wider block">Line Items</span>
                        <div className="space-y-2">
                          {invoiceItems.map((item, index) => (
                            <div key={index} className="flex gap-2 items-center">
                              <input
                                type="text"
                                required
                                value={item.description}
                                onChange={(e) => {
                                  const updated = [...invoiceItems];
                                  updated[index].description = e.target.value;
                                  setInvoiceItems(updated);
                                }}
                                placeholder="Service, Consultation, Lab Test..."
                                className="flex-1 bg-slate-50 border border-slate-200 focus:outline-none rounded px-2.5 py-1.5 text-xs"
                              />
                              <input
                                type="number"
                                required
                                value={item.quantity}
                                onChange={(e) => {
                                  const updated = [...invoiceItems];
                                  updated[index].quantity = Number(e.target.value);
                                  setInvoiceItems(updated);
                                }}
                                placeholder="Qty"
                                className="w-14 bg-slate-50 border border-slate-200 focus:outline-none rounded px-2 py-1.5 text-xs text-center"
                              />
                              <input
                                type="number"
                                required
                                value={item.amount}
                                onChange={(e) => {
                                  const updated = [...invoiceItems];
                                  updated[index].amount = Number(e.target.value);
                                  setInvoiceItems(updated);
                                }}
                                placeholder="Fee"
                                className="w-20 bg-slate-50 border border-slate-200 focus:outline-none rounded px-2 py-1.5 text-xs text-right"
                              />
                              <button
                                type="button"
                                disabled={invoiceItems.length === 1}
                                onClick={() => setInvoiceItems(invoiceItems.filter((_, i) => i !== index))}
                                className="text-red-500 hover:text-red-700 disabled:opacity-30"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setInvoiceItems([...invoiceItems, { description: '', quantity: 1, amount: 0 }])}
                          className="text-xs text-indigo-600 font-bold flex items-center space-x-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Line Item</span>
                        </button>
                      </div>

                      {/* discount and tax */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-bold uppercase">Discount Amount (₹)</label>
                          <input
                            type="number"
                            value={invoiceDiscount}
                            onChange={(e) => setInvoiceDiscount(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:outline-none rounded px-3 py-1.5 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-bold uppercase">Tax Amount (₹)</label>
                          <input
                            type="number"
                            value={invoiceTax}
                            onChange={(e) => setInvoiceTax(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:outline-none rounded px-3 py-1.5 text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-3">
                        <button
                          type="button"
                          onClick={() => setShowCreateInvoiceForm(false)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-sm shadow-indigo-500/10"
                        >
                          Generate Invoice
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="py-6 text-center text-slate-400">
                      Click the "New Invoice" button to start composing a medical bill.
                    </div>
                  )}
                </div>

                {/* Invoice Ledger Table */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">Billing Ledger History</span>
                  <div className="overflow-y-auto max-h-[500px]">
                    {loadingInvoices ? (
                      <div className="flex justify-center p-8"><Loader className="w-5 h-5 animate-spin text-slate-400" /></div>
                    ) : invoices.length > 0 ? (
                      <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-bold uppercase">
                              <th className="p-3">Bill No</th>
                              <th className="p-3">Patient</th>
                              <th className="p-3 text-right">Total</th>
                              <th className="p-3 text-right">Paid</th>
                              <th className="p-3 text-center">Status</th>
                              <th className="p-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-800">
                            {invoices.map((inv) => (
                              <tr key={inv.id} className="hover:bg-slate-50/50">
                                <td className="p-3 font-semibold">{inv.invoiceNumber}</td>
                                <td className="p-3">
                                  {inv.patient ? `${inv.patient.firstName} ${inv.patient.lastName}` : 'Guest Patient'}
                                </td>
                                <td className="p-3 text-right font-semibold">₹{parseFloat(inv.total).toFixed(2)}</td>
                                <td className="p-3 text-right text-emerald-700">₹{parseFloat(inv.amountPaid).toFixed(2)}</td>
                                <td className="p-3 text-center">
                                  <span className={`px-2 py-0.5 rounded-[4px] font-black text-[9px] uppercase tracking-wide ${
                                    inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' :
                                    inv.status === 'PARTIALLY_PAID' ? 'bg-amber-50 text-amber-600' :
                                    'bg-rose-50 text-rose-600'
                                  }`}>
                                    {inv.status}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <button
                                    onClick={() => openInvoiceDetails(inv)}
                                    className="text-indigo-600 hover:underline font-bold"
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-slate-400 text-xs italic p-4 text-center">No invoices generated yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Selected Invoice Detail & Receipt Printing */}
              <div className="w-full lg:w-96 shrink-0">
                {selectedInvoice ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 overflow-y-auto max-h-[calc(100vh-200px)]">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm uppercase">Invoice details</h4>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5 tracking-wider">
                          BILL NO: {selectedInvoice.invoiceNumber}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wide ${
                        selectedInvoice.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' :
                        selectedInvoice.status === 'PARTIALLY_PAID' ? 'bg-amber-50 text-amber-600' :
                        'bg-red-50 text-red-600'
                      }`}>
                        {selectedInvoice.status}
                      </span>
                    </div>

                    <div className="text-xs space-y-1 text-slate-800">
                      <div>Patient: <strong className="text-slate-900 font-bold">{selectedInvoice.patient?.firstName} {selectedInvoice.patient?.lastName}</strong></div>
                      <div>Contact: <strong>{selectedInvoice.patient?.phone}</strong></div>
                      <div>Date: <strong>{new Date(selectedInvoice.createdAt).toLocaleDateString()}</strong></div>
                    </div>

                    {/* Bill Items */}
                    <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 font-bold uppercase">
                            <th className="p-2.5">Item</th>
                            <th className="p-2.5 text-center">Qty</th>
                            <th className="p-2.5 text-right">Amt</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
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

                    {/* Breakdown calculations */}
                    <div className="text-xs text-slate-700 space-y-1 pt-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="font-semibold text-slate-900">₹{parseFloat(selectedInvoice.subtotal).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-700">
                        <span>Discount:</span>
                        <span>-₹{parseFloat(selectedInvoice.discount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>+₹{parseFloat(selectedInvoice.tax).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-extrabold text-slate-900 border-t border-slate-200 pt-1.5 text-sm">
                        <span>Total:</span>
                        <span>₹{parseFloat(selectedInvoice.total).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Collect Payment Box */}
                    {selectedInvoice.status !== 'PAID' && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                        <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider block flex items-center">
                          <DollarSign className="w-3.5 h-3.5 mr-1" /> Log Payment Transaction
                        </span>
                        <form onSubmit={handleCollectPaymentSubmit} className="space-y-2">
                          <div className="space-y-1">
                            <label className="text-[8px] text-slate-500 font-bold uppercase block">Amount Collected (₹)</label>
                            <input
                              type="number"
                              required
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(e.target.value)}
                              placeholder="₹0.00"
                              className="w-full bg-white border border-slate-200 focus:outline-none rounded px-2.5 py-1 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] text-slate-500 font-bold uppercase block">Method</label>
                            <select
                              value={paymentMethod}
                              onChange={(e) => setPaymentMethod(e.target.value as any)}
                              className="w-full bg-white border border-slate-200 focus:outline-none rounded px-2 py-1 text-xs"
                            >
                              <option value="CASH">Cash</option>
                              <option value="UPI">UPI / QR Code</option>
                              <option value="CARD">Card Swipe</option>
                            </select>
                          </div>
                          <button
                            type="submit"
                            className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-xs"
                          >
                            Log Payment Received
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Print & Action Buttons */}
                    <div className="flex gap-3 pt-2 print:hidden">
                      <button
                        onClick={() => window.print()}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg py-2 text-xs flex items-center justify-center space-x-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Invoice</span>
                      </button>
                      <button
                        onClick={() => setSelectedInvoice(null)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg px-4 py-2 text-xs"
                      >
                        Close
                      </button>
                    </div>

                    {/* CSS styles to hide everything except the print area during printing */}
                    <style dangerouslySetInnerHTML={{__html: `
                      @media print {
                        body * {
                          visibility: hidden !important;
                        }
                        #invoice-print-area, #invoice-print-area * {
                          visibility: visible !important;
                        }
                        #invoice-print-area {
                          position: absolute !important;
                          left: 0 !important;
                          top: 0 !important;
                          width: 100% !important;
                          padding: 1.5cm !important;
                          margin: 0 !important;
                          border: none !important;
                          box-shadow: none !important;
                          background: white !important;
                        }
                      }
                    `}} />

                    {/* Real-world printable invoice markup */}
                    <div id="invoice-print-area" className="hidden print:block bg-white text-slate-955 font-sans text-[11px] leading-relaxed">
                      {/* Header block */}
                      <div className="flex justify-between items-start border-b border-slate-800 pb-3 mb-4">
                        <div>
                          <h1 className="text-lg font-black uppercase text-slate-950 tracking-tight">{clinicForm?.name || (clinic as any)?.name || 'Clinic'}</h1>
                          <p className="text-[10px] text-slate-500 font-semibold mt-0.5 max-w-xs">{clinicForm?.address || (clinic as any)?.address}</p>
                          <p className="text-[10px] text-slate-500 font-semibold">Phone: {clinicForm?.phone || (clinic as any)?.phone}</p>
                        </div>
                        <div className="text-right">
                          <h2 className="text-md font-bold uppercase text-slate-800 tracking-wider">Invoice / Receipt</h2>
                          <div className="text-[10px] text-slate-500 font-semibold space-y-0.5 mt-1.5">
                            <div>Bill No: <span className="font-bold text-slate-900">{selectedInvoice.invoiceNumber}</span></div>
                            <div>Date: <span className="font-bold text-slate-900">{new Date(selectedInvoice.createdAt).toLocaleDateString()}</span></div>
                            <div>Status: <span className={`font-extrabold uppercase ${selectedInvoice.status === 'PAID' ? 'text-emerald-700' : 'text-amber-700'}`}>{selectedInvoice.status}</span></div>
                          </div>
                        </div>
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-2 gap-4 mb-4 text-[10.5px]">
                        <div className="bg-slate-50 p-3 border border-slate-200/60 rounded-lg space-y-1">
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Patient Details</span>
                          <div className="font-bold text-slate-950">{selectedInvoice.patient?.firstName} {selectedInvoice.patient?.lastName}</div>
                          {selectedInvoice.patient?.phone && <div>Phone: <span className="font-medium text-slate-800">{selectedInvoice.patient.phone}</span></div>}
                          {selectedInvoice.patient?.address && <div className="text-[9.5px]">Address: <span className="font-medium text-slate-800">{selectedInvoice.patient.address}</span></div>}
                          {(selectedInvoice.patient?.dob || selectedInvoice.patient?.gender) && (
                            <div className="text-[9.5px]">
                              {selectedInvoice.patient?.gender && <span>Gender: <span className="font-medium text-slate-800 uppercase mr-2.5">{selectedInvoice.patient.gender}</span></span>}
                              {selectedInvoice.patient?.dob && <span>Age: <span className="font-medium text-slate-800">{new Date().getFullYear() - new Date(selectedInvoice.patient.dob).getFullYear()} Yrs</span></span>}
                            </div>
                          )}
                        </div>
                        <div className="bg-slate-50 p-3 border border-slate-200/60 rounded-lg space-y-1">
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Provider Details</span>
                          <div className="font-bold text-slate-950">Dr. {user?.firstName} {user?.lastName}</div>
                          {doctorProfile?.specialty && <div>Specialty: <span className="font-medium text-slate-800">{doctorProfile.specialty}</span></div>}
                          {doctorProfile?.licenseNo && <div>License No: <span className="font-medium text-slate-800">{doctorProfile.licenseNo}</span></div>}
                          <div>Designation: <span className="font-medium text-slate-800">Consultant Physician</span></div>
                        </div>
                      </div>

                      {/* Items table */}
                      <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
                        <table className="w-full text-left text-[10px] border-collapse">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-200 text-[8.5px] text-slate-500 font-bold uppercase tracking-wider">
                              <th className="p-2 text-center w-8">#</th>
                              <th className="p-2">Description</th>
                              <th className="p-2 text-center w-12">Qty</th>
                              <th className="p-2 text-right w-24">Price</th>
                              <th className="p-2 text-right w-24">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 text-slate-800">
                            {selectedInvoice.items && (typeof selectedInvoice.items === 'string'
                              ? JSON.parse(selectedInvoice.items)
                              : selectedInvoice.items
                            ).map((item: any, i: number) => (
                              <tr key={i}>
                                <td className="p-2 text-center text-slate-400">{i + 1}</td>
                                <td className="p-2 font-semibold text-slate-900">{item.description}</td>
                                <td className="p-2 text-center">{item.quantity}</td>
                                <td className="p-2 text-right">₹{parseFloat(item.amount).toFixed(2)}</td>
                                <td className="p-2 text-right font-bold text-slate-950">₹{(item.quantity * parseFloat(item.amount)).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Footer calculation blocks */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Payments log */}
                        <div>
                          {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Payment Transactions</span>
                              <div className="border border-slate-200 rounded overflow-hidden">
                                <table className="w-full text-[9px] text-left border-collapse">
                                  <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-[7.5px] text-slate-400 font-bold uppercase">
                                      <th className="p-1 px-2">Date</th>
                                      <th className="p-1 px-2">Method</th>
                                      <th className="p-1 px-2 text-right">Amount</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 text-slate-600">
                                    {selectedInvoice.payments.map((p: any, idx: number) => (
                                      <tr key={idx}>
                                        <td className="p-1 px-2">{new Date(p.createdAt).toLocaleDateString()}</td>
                                        <td className="p-1 px-2 font-bold uppercase text-[7.5px]">{p.method}</td>
                                        <td className="p-1 px-2 text-right font-semibold text-slate-800">₹{parseFloat(p.amount).toFixed(2)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Breakdown calculations */}
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1 text-[10px] w-64 ml-auto">
                          <div className="flex justify-between items-center text-slate-500">
                            <span>Subtotal:</span>
                            <span className="font-semibold text-slate-900">₹{parseFloat(selectedInvoice.subtotal).toFixed(2)}</span>
                          </div>
                          {parseFloat(selectedInvoice.discount) > 0 && (
                            <div className="flex justify-between items-center text-emerald-700 font-semibold">
                              <span>Discount:</span>
                              <span>-₹{parseFloat(selectedInvoice.discount).toFixed(2)}</span>
                            </div>
                          )}
                          {parseFloat(selectedInvoice.tax) > 0 && (
                            <div className="flex justify-between items-center text-slate-500">
                              <span>Tax / GST:</span>
                              <span className="font-semibold text-slate-900">+₹{parseFloat(selectedInvoice.tax).toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center text-slate-955 border-t border-slate-350 pt-1 text-[11px] font-black">
                            <span>Total Bill:</span>
                            <span className="text-[12px] font-black text-slate-950">₹{parseFloat(selectedInvoice.total).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center border-t border-dashed border-slate-200 pt-1 text-slate-500">
                            <span>Total Paid:</span>
                            <span className="font-bold text-slate-800">
                              ₹{selectedInvoice.payments 
                                ? selectedInvoice.payments.reduce((acc: number, p: any) => acc + parseFloat(p.amount), 0).toFixed(2)
                                : (selectedInvoice.status === 'PAID' ? parseFloat(selectedInvoice.total).toFixed(2) : '0.00')}
                            </span>
                          </div>
                          <div className="flex justify-between items-center border-t border-slate-350 pt-1 text-slate-950 font-black">
                            <span>Balance Due:</span>
                            <span className={`font-black ${parseFloat(selectedInvoice.total) - (selectedInvoice.payments ? selectedInvoice.payments.reduce((acc: number, p: any) => acc + parseFloat(p.amount), 0) : (selectedInvoice.status === 'PAID' ? parseFloat(selectedInvoice.total) : 0)) > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                              ₹{(parseFloat(selectedInvoice.total) - (selectedInvoice.payments ? selectedInvoice.payments.reduce((acc: number, p: any) => acc + parseFloat(p.amount), 0) : (selectedInvoice.status === 'PAID' ? parseFloat(selectedInvoice.total) : 0))).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Signatures */}
                      <div className="grid grid-cols-2 gap-8 mt-12 pt-4 border-t border-slate-200">
                        <div className="flex flex-col justify-end">
                          <div className="border-t border-slate-300 w-36 text-center pt-1 text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                            Patient Signature / Date
                          </div>
                        </div>
                        <div className="flex flex-col justify-end items-end text-right">
                          <div className="text-center">
                            <div className="font-extrabold text-slate-900 text-[10px] uppercase">Dr. {user?.firstName} {user?.lastName}</div>
                            <div className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">{doctorProfile?.specialty || 'Consultant Physician'}</div>
                            <div className="border-t border-slate-300 w-36 mx-auto mt-2 pt-1 text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                              Authorized Signature
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer note */}
                      <div className="text-center text-[8px] text-slate-400 font-bold mt-12 uppercase tracking-wider">
                        Thank you for your visit. Wish you good health!
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl p-16 shadow-sm text-center flex flex-col items-center justify-center space-y-3">
                    <Printer className="w-12 h-12 text-slate-300" />
                    <h3 className="font-bold text-slate-800 text-base">Select Record</h3>
                    <p className="text-slate-500 text-xs">
                      Click "View" next to any invoice to view the breakdown calculations, collect payments, and print clinical receipts.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 4: MEDICINE CATALOG MASTER
              ========================================== */}
          {activeTab === 'medicines' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Clinic Medicine Master Catalog</span>
                <button
                  onClick={() => {
                    setEditingMed(null);
                    setMedForm({ name: '', genericName: '', dosageForm: 'TABLET', strength: '', defaultSchedule: '1-0-1' });
                    setMedModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Medicine</span>
                </button>
              </div>

              {/* Search Master */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchMedQuery}
                  onChange={(e) => setSearchMedQuery(e.target.value)}
                  placeholder="Filter medicines by name or generic name..."
                  className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800"
                />
              </div>

              {/* Catalog Table */}
              <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-bold uppercase">
                      <th className="p-3">Medicine Name</th>
                      <th className="p-3">Generic / Active Ingredient</th>
                      <th className="p-3">Form</th>
                      <th className="p-3">Strength</th>
                      <th className="p-3">Default Schedule</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {filteredMeds.length > 0 ? (
                      filteredMeds.map((med) => (
                        <tr key={med.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-800">{med.name}</td>
                          <td className="p-3 text-slate-500 italic">{med.genericName || '—'}</td>
                          <td className="p-3">{med.dosageForm}</td>
                          <td className="p-3">{med.strength}</td>
                          <td className="p-3 font-bold">{med.defaultSchedule || '—'}</td>
                          <td className="p-3 text-right space-x-3">
                            <button
                              onClick={() => {
                                setEditingMed(med);
                                setMedForm({
                                  name: med.name,
                                  genericName: med.genericName || '',
                                  dosageForm: med.dosageForm,
                                  strength: med.strength,
                                  defaultSchedule: med.defaultSchedule || '1-0-1',
                                });
                                setMedModalOpen(true);
                              }}
                              className="text-indigo-600 hover:underline font-semibold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteMedicine(med.id)}
                              className="text-red-500 hover:text-red-700 font-semibold"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400 italic">No medicines match search filter.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 5: CLINIC & PROFILE SETTINGS
              ========================================== */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
              {/* Clinic configuration */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider block border-b border-slate-100 pb-2 flex items-center">
                  <Settings className="w-4 h-4 mr-2 text-indigo-600" /> Edit Clinic Public Profile
                </span>
                <form onSubmit={handleClinicUpdate} className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Clinic Branding Name</label>
                    <input
                      type="text"
                      required
                      value={clinicForm.name}
                      onChange={(e) => setClinicForm({ ...clinicForm, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 focus:outline-none rounded-lg px-3.5 py-2 text-slate-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Timings / Working Days</label>
                    <input
                      type="text"
                      required
                      value={clinicForm.timings}
                      onChange={(e) => setClinicForm({ ...clinicForm, timings: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 focus:outline-none rounded-lg px-3.5 py-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Contact Phone</label>
                      <input
                        type="text"
                        required
                        value={clinicForm.phone}
                        onChange={(e) => setClinicForm({ ...clinicForm, phone: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 focus:outline-none rounded-lg px-3.5 py-2"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">WhatsApp Number</label>
                      <input
                        type="text"
                        value={clinicForm.whatsapp}
                        onChange={(e) => setClinicForm({ ...clinicForm, whatsapp: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 focus:outline-none rounded-lg px-3.5 py-2"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Address (Physical Location)</label>
                    <input
                      type="text"
                      required
                      value={clinicForm.address}
                      onChange={(e) => setClinicForm({ ...clinicForm, address: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 focus:outline-none rounded-lg px-3.5 py-2"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Available Services & Facilities (comma-separated)</label>
                    <input
                      type="text"
                      value={clinicForm.facilities}
                      onChange={(e) => setClinicForm({ ...clinicForm, facilities: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 focus:outline-none rounded-lg px-3.5 py-2"
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={submittingClinic}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-sm shadow-indigo-500/10 disabled:opacity-50"
                    >
                      {submittingClinic && <Loader className="w-4 h-4 animate-spin mr-1.5 inline" />}
                      <span>Save Clinic Profile</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Doctor availability timings & fees */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider block border-b border-slate-100 pb-2 flex items-center">
                  <User className="w-4 h-4 mr-2 text-indigo-600" /> Edit Doctor Schedule & Public Info
                </span>
                <form onSubmit={handleDoctorProfileUpdate} className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Medical Specialty Description</label>
                    <input
                      type="text"
                      required
                      value={doctorForm.specialty}
                      onChange={(e) => setDoctorForm({ ...doctorForm, specialty: e.target.value })}
                      placeholder="e.g. Cardiology & General Physician"
                      className="w-full bg-slate-50 border border-slate-200 focus:outline-none rounded-lg px-3.5 py-2"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Medical License No</label>
                    <input
                      type="text"
                      required
                      value={doctorForm.licenseNo}
                      onChange={(e) => setDoctorForm({ ...doctorForm, licenseNo: e.target.value })}
                      placeholder="e.g. MCI-12345"
                      className="w-full bg-slate-50 border border-slate-200 focus:outline-none rounded-lg px-3.5 py-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Consultation Fee (INR)</label>
                      <input
                        type="number"
                        required
                        value={doctorForm.fees}
                        onChange={(e) => setDoctorForm({ ...doctorForm, fees: Number(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-200 focus:outline-none rounded-lg px-3.5 py-2"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Appointment Slot Duration (Mins)</label>
                      <input
                        type="number"
                        required
                        value={doctorForm.durationMin}
                        onChange={(e) => setDoctorForm({ ...doctorForm, durationMin: Number(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-200 focus:outline-none rounded-lg px-3.5 py-2"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={submittingDoctorProfile}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-sm shadow-indigo-500/10 disabled:opacity-50"
                    >
                      {submittingDoctorProfile && <Loader className="w-4 h-4 animate-spin mr-1.5 inline" />}
                      <span>Save Doctor Details</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 6: PRACTICE ANALYTICS & AUDIT LOGS
              ========================================== */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {loadingAnalytics ? (
                <div className="flex justify-center py-20">
                  <div className="flex flex-col items-center space-y-3">
                    <Loader className="w-10 h-10 animate-spin text-indigo-600" />
                    <span className="text-xs text-slate-500 font-semibold">Loading practice intelligence...</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Top Row: KPI Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {/* Patients Count */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Today's Total Patients</span>
                        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><User className="w-4 h-4" /></div>
                      </div>
                      <div>
                        <h3 className="font-black text-2xl text-slate-900 leading-none">{stats.visitsCount || 0}</h3>
                        <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Scheduled & walk-ins registered today</p>
                      </div>
                    </div>

                    {/* Revenue Card */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Today's Revenue Collected</span>
                        <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign className="w-4 h-4" /></div>
                      </div>
                      <div>
                        <h3 className="font-black text-2xl text-emerald-600 leading-none">₹{parseFloat(stats.todayRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                        <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Total payments logged in ledger today</p>
                      </div>
                    </div>

                    {/* Outstanding Dues */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Total Pending Dues</span>
                        <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg"><Clock className="w-4 h-4" /></div>
                      </div>
                      <div>
                        <h3 className="font-black text-2xl text-rose-600 leading-none">₹{parseFloat(stats.pendingDues || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                        <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Outstanding unpaid ledger balances</p>
                      </div>
                    </div>

                    {/* UPI/Cash Splits */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Payment split</span>
                        <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg"><ArrowRightLeft className="w-4 h-4" /></div>
                      </div>
                      <div className="text-[10.5px] font-semibold text-slate-700 space-y-1 mt-0.5">
                        <div className="flex justify-between items-center">
                          <span className="flex items-center"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5" /> UPI:</span>
                          <span className="font-bold text-slate-900">₹{parseFloat(stats.paymentSplit?.UPI || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="flex items-center"><span className="w-1.5 h-1.5 bg-sky-500 rounded-full mr-1.5" /> CASH:</span>
                          <span className="font-bold text-slate-900">₹{parseFloat(stats.paymentSplit?.CASH || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        {stats.paymentSplit?.CARD > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="flex items-center"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1.5" /> CARD:</span>
                            <span className="font-bold text-slate-900">₹{parseFloat(stats.paymentSplit?.CARD || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle Row: Trend Visualizations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Revenue Trend Chart */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Collections Trend</h4>
                          <p className="text-[10px] text-slate-400">Total daily revenue split (Last 7 Days)</p>
                        </div>
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Weekly Trend</span>
                      </div>
                      
                      {/* Bar chart rendering */}
                      <div className="flex items-end justify-between h-44 pt-4 border-b border-slate-100 pb-2">
                        {stats.weeklyRevenue && stats.weeklyRevenue.length > 0 ? (
                          (() => {
                            const maxVal = Math.max(...stats.weeklyRevenue.map((d: any) => d.value), 1);
                            return stats.weeklyRevenue.map((day: any, idx: number) => {
                              const heightPercent = `${Math.max((day.value / maxVal) * 100, 3)}%`;
                              return (
                                <div key={idx} className="flex flex-col items-center group flex-1">
                                  <div className="relative w-full flex justify-center items-end h-32 px-1">
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap z-30">
                                      ₹{parseFloat(day.value).toFixed(2)}
                                    </div>
                                    {/* Bar */}
                                    <div 
                                      style={{ height: heightPercent }}
                                      className={`w-full max-w-[20px] rounded-t-md transition-all duration-300 shadow-sm ${
                                        day.value === 0 
                                          ? 'bg-slate-100 border border-dashed border-slate-200' 
                                          : 'bg-gradient-to-t from-indigo-600 to-indigo-400 group-hover:from-teal-500 group-hover:to-teal-400'
                                      }`}
                                    />
                                  </div>
                                  <span className="text-[9px] text-slate-400 font-bold uppercase mt-2">{day.label}</span>
                                </div>
                              );
                            });
                          })()
                        ) : (
                          <div className="w-full flex items-center justify-center text-slate-400 italic text-[11px] py-10">No data available</div>
                        )}
                      </div>
                    </div>

                    {/* Patient Visits Trend Chart */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Patient Volume Trend</h4>
                          <p className="text-[10px] text-slate-400">Total daily consultations completed (Last 7 Days)</p>
                        </div>
                        <span className="text-[10px] bg-teal-50 text-teal-700 font-bold px-2 py-0.5 rounded-full">Weekly Trend</span>
                      </div>
                      
                      {/* Bar chart rendering */}
                      <div className="flex items-end justify-between h-44 pt-4 border-b border-slate-100 pb-2">
                        {stats.weeklyVisits && stats.weeklyVisits.length > 0 ? (
                          (() => {
                            const maxVal = Math.max(...stats.weeklyVisits.map((d: any) => d.value), 1);
                            return stats.weeklyVisits.map((day: any, idx: number) => {
                              const heightPercent = `${Math.max((day.value / maxVal) * 100, 3)}%`;
                              return (
                                <div key={idx} className="flex flex-col items-center group flex-1">
                                  <div className="relative w-full flex justify-center items-end h-32 px-1">
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap z-30">
                                      {day.value} Patients
                                    </div>
                                    {/* Bar */}
                                    <div 
                                      style={{ height: heightPercent }}
                                      className={`w-full max-w-[20px] rounded-t-md transition-all duration-300 shadow-sm ${
                                        day.value === 0 
                                          ? 'bg-slate-100 border border-dashed border-slate-200' 
                                          : 'bg-gradient-to-t from-teal-600 to-teal-400 group-hover:from-indigo-500 group-hover:to-indigo-400'
                                      }`}
                                    />
                                  </div>
                                  <span className="text-[9px] text-slate-400 font-bold uppercase mt-2">{day.label}</span>
                                </div>
                              );
                            });
                          })()
                        ) : (
                          <div className="w-full flex items-center justify-center text-slate-400 italic text-[11px] py-10">No data available</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: Clinical & Financial Action Columns */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Column 1: Top Prescribed Medicines */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block border-b border-slate-100 pb-2">Top Prescribed Medicines</span>
                      <div className="divide-y divide-slate-100 text-xs flex-1">
                        {stats.topMedicines && stats.topMedicines.length > 0 ? (
                          stats.topMedicines.map((med: any, idx: number) => (
                            <div key={idx} className="py-2.5 flex justify-between items-center first:pt-0 last:pb-0">
                              <div className="flex items-center space-x-2.5">
                                <span className="font-bold text-slate-400 text-[10px]">#{idx + 1}</span>
                                <span className="font-semibold text-slate-800">{med.name}</span>
                              </div>
                              <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full text-[9px]">
                                {med.count} Rx
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-slate-400 italic text-[11px] py-4 text-center">No prescription data logged yet.</p>
                        )}
                      </div>
                    </div>

                    {/* Column 2: Top Diagnoses */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block border-b border-slate-100 pb-2">Primary Diagnosis Reasons</span>
                      <div className="divide-y divide-slate-100 text-xs flex-1">
                        {stats.topDiagnoses && stats.topDiagnoses.length > 0 ? (
                          stats.topDiagnoses.map((diag: any, idx: number) => (
                            <div key={idx} className="py-2.5 flex justify-between items-center first:pt-0 last:pb-0">
                              <div className="flex items-center space-x-2.5">
                                <span className="font-bold text-slate-400 text-[10px]">#{idx + 1}</span>
                                <span className="font-semibold text-slate-800 truncate max-w-[140px]">{diag.name}</span>
                              </div>
                              <span className="bg-teal-50 text-teal-700 font-bold px-2 py-0.5 rounded-full text-[9px]">
                                {diag.count} Cases
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-slate-400 italic text-[11px] py-4 text-center">No diagnosis records logged yet.</p>
                        )}
                      </div>
                    </div>

                    {/* Column 3: Actionable Outstanding Dues Ledger */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block border-b border-slate-100 pb-2">Actionable Outstanding Bills</span>
                      <div className="divide-y divide-slate-100 text-xs flex-1">
                        {stats.topPendingInvoices && stats.topPendingInvoices.length > 0 ? (
                          stats.topPendingInvoices.map((inv: any) => (
                            <div key={inv.id} className="py-2.5 flex flex-col space-y-1.5 first:pt-0 last:pb-0">
                              <div className="flex justify-between items-start">
                                <div className="space-y-0.5">
                                  <span className="font-bold text-slate-900">{inv.patientName}</span>
                                  <span className="text-[9px] text-slate-400 block font-medium">Inv: {inv.invoiceNumber} | Phone: {inv.patientPhone}</span>
                                </div>
                                <div className="text-right">
                                  <span className="font-bold text-rose-600 text-xs block">₹{parseFloat(inv.dues).toFixed(2)}</span>
                                  <span className="text-[8.5px] text-slate-400 block font-semibold">Total: ₹{parseFloat(inv.total).toFixed(2)}</span>
                                </div>
                              </div>
                              <div className="flex justify-end pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleViewInvoiceFromAnalytics(inv)}
                                  className="text-[9.5px] font-bold text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 border border-indigo-100 rounded px-2.5 py-0.5 transition-colors"
                                >
                                  Manage Payment &rarr;
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-slate-400 italic text-[11px] py-4 text-center">No pending dues. Great job!</p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ==========================================
          GLOBAL MODALS (MEDICINE MODAL & EDIT PATIENT)
          ========================================== */}
      {/* 1. Add/Edit Medicine Dialog */}
      {medModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase">
                {editingMed ? 'Edit Medicine Details' : 'Add Medicine to Catalog'}
              </h3>
              <button onClick={() => setMedModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleMedicineSubmit} className="p-6 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Medicine Brand Name *</label>
                <input
                  type="text"
                  required
                  value={medForm.name}
                  onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
                  placeholder="e.g. Paracetamol"
                  className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500 rounded-lg px-3.5 py-2 text-slate-800"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Generic Ingredient Name</label>
                <input
                  type="text"
                  value={medForm.genericName}
                  onChange={(e) => setMedForm({ ...medForm, genericName: e.target.value })}
                  placeholder="e.g. Acetaminophen"
                  className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500 rounded-lg px-3.5 py-2 text-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Form *</label>
                  <select
                    value={medForm.dosageForm}
                    onChange={(e) => setMedForm({ ...medForm, dosageForm: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-800"
                  >
                    <option value="TABLET">Tablet</option>
                    <option value="CAPSULE">Capsule</option>
                    <option value="SYRUP">Syrup</option>
                    <option value="INJECTION">Injection</option>
                    <option value="CREAM">Cream / Ointment</option>
                    <option value="DROPS">Drops</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Strength *</label>
                  <input
                    type="text"
                    required
                    value={medForm.strength}
                    onChange={(e) => setMedForm({ ...medForm, strength: e.target.value })}
                    placeholder="e.g. 500mg, 10ml"
                    className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500 rounded-lg px-3.5 py-2 text-slate-800"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Default Schedule instructions</label>
                <input
                  type="text"
                  value={medForm.defaultSchedule}
                  onChange={(e) => setMedForm({ ...medForm, defaultSchedule: e.target.value })}
                  placeholder="e.g. 1-0-1"
                  className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500 rounded-lg px-3.5 py-2 text-slate-800"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setMedModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingMed}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-sm disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {submittingMed && <Loader className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Medicine</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Patient Details Modal */}
      {editingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase">
                Edit Patient Profile
              </h3>
              <button onClick={() => setEditingPatient(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditPatientSubmit} className="p-6 space-y-4 text-xs overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">First Name *</label>
                  <input
                    type="text"
                    required
                    value={editingPatient.firstName}
                    onChange={(e) => setEditingPatient({ ...editingPatient, firstName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:outline-none rounded-lg px-3 py-2"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={editingPatient.lastName}
                    onChange={(e) => setEditingPatient({ ...editingPatient, lastName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:outline-none rounded-lg px-3 py-2"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Phone *</label>
                  <input
                    type="text"
                    required
                    value={editingPatient.phone}
                    onChange={(e) => setEditingPatient({ ...editingPatient, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:outline-none rounded-lg px-3 py-2"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={editingPatient.dob ? new Date(editingPatient.dob).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditingPatient({ ...editingPatient, dob: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:outline-none rounded-lg px-3 py-2"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Gender *</label>
                  <select
                    value={editingPatient.gender}
                    onChange={(e) => setEditingPatient({ ...editingPatient, gender: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:outline-none rounded-lg px-3 py-2"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Address</label>
                  <input
                    type="text"
                    value={editingPatient.address || ''}
                    onChange={(e) => setEditingPatient({ ...editingPatient, address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:outline-none rounded-lg px-3 py-2"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Allergies (comma-separated)</label>
                  <input
                    type="text"
                    value={Array.isArray(editingPatient.allergies) ? editingPatient.allergies.join(', ') : editingPatient.allergies || ''}
                    onChange={(e) => setEditingPatient({ ...editingPatient, allergies: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:outline-none rounded-lg px-3 py-2"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Chronic Conditions (comma-separated)</label>
                  <input
                    type="text"
                    value={Array.isArray(editingPatient.chronicConditions) ? editingPatient.chronicConditions.join(', ') : editingPatient.chronicConditions || ''}
                    onChange={(e) => setEditingPatient({ ...editingPatient, chronicConditions: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:outline-none rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingPatient(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Save Patient Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Quick Check-In / Booking Modal */}
      {bookingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase flex items-center">
                <PlusCircle className="w-5 h-5 mr-2 text-emerald-600" />
                Quick Check-In / Booking
              </h3>
              <button
                onClick={() => setBookingPatient(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleConfirmBooking} className="p-6 space-y-4 text-xs overflow-y-auto text-slate-800">
              {/* Patient Banner Info */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800 text-xs">
                    {bookingPatient.firstName} {bookingPatient.lastName}
                  </p>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                    Phone: {bookingPatient.phone} | DOB: {new Date(bookingPatient.dob).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full uppercase border border-emerald-200">
                  Ready
                </span>
              </div>

              {/* Booking Type Selector */}
              <div className="space-y-1">
                <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Visit Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setBookingType('WALK_IN');
                      setBookingTime('');
                    }}
                    className={`py-2 px-3 rounded-lg border font-bold text-center transition-all ${
                      bookingType === 'WALK_IN'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    Walk-In / Immediate Queue
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingType('SLOT')}
                    className={`py-2 px-3 rounded-lg border font-bold text-center transition-all ${
                      bookingType === 'SLOT'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    Scheduled Appointment
                  </button>
                </div>
              </div>

              {/* Booking Date */}
              <div className="space-y-1">
                <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Date</label>
                <input
                  type="date"
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-800"
                />
              </div>

              {/* Time Slots (Visible if Scheduled SLOT) */}
              {bookingType === 'SLOT' && (
                <div className="space-y-2">
                  <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px] block">
                    Available Time Slots
                  </label>
                  {loadingSlots ? (
                    <div className="flex items-center space-x-2 py-4 justify-center text-slate-500">
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Loading slots...</span>
                    </div>
                  ) : bookingSlots.length === 0 ? (
                    <p className="text-slate-500 italic py-2">No slots available for the selected date.</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1 border border-slate-100 rounded-lg">
                      {bookingSlots.map((slot) => {
                        const isSelected = bookingTime === slot.time;
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => setBookingTime(slot.time)}
                            className={`py-1.5 px-2 rounded-md text-[11px] font-semibold text-center border transition-all ${
                              !slot.available
                                ? 'bg-slate-100 border-slate-100 text-slate-400 line-through cursor-not-allowed'
                                : isSelected
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm font-bold'
                                : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            {slot.time}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Follow Up Checkbox */}
              <div className="flex items-center space-x-2 py-1">
                <input
                  type="checkbox"
                  id="bookingIsFollowUp"
                  checked={bookingIsFollowUp}
                  onChange={(e) => setBookingIsFollowUp(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="bookingIsFollowUp" className="text-slate-700 font-bold select-none cursor-pointer">
                  Is this a follow-up consultation?
                </label>
              </div>

              {/* Booking Notes / Chief Complaint */}
              <div className="space-y-1">
                <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Chief Complaint / Notes</label>
                <textarea
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="e.g. Patient complains of cough and fever for 3 days..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-800"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setBookingPatient(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingInProgress || (bookingType === 'SLOT' && !bookingTime)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-sm flex items-center space-x-1.5 transition-all disabled:opacity-50"
                >
                  {bookingInProgress && <Loader className="w-4 h-4 animate-spin" />}
                  <span>Confirm Check-In</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Register Patient Modal */}
      {registerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase flex items-center">
                <PlusCircle className="w-4 h-4 mr-2 text-indigo-600" /> Register New Patient
              </h3>
              <button onClick={() => setRegisterModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleRegisterPatient} className="p-6 space-y-4 text-xs overflow-y-auto">
              {registerError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                  <p className="text-red-700 text-xs font-semibold leading-relaxed">
                    {registerError}
                  </p>
                  {duplicatePatient && (
                    <div className="flex justify-start">
                      <button
                        type="button"
                        onClick={() => {
                          setRegisterModalOpen(false);
                          viewPatientTimeline(duplicatePatient.id);
                          setBookingPatient(duplicatePatient);
                          setDuplicatePatient(null);
                        }}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm shadow-indigo-600/10"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Open Profile & Check-In</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newPatient.firstName}
                    onChange={(e) => setNewPatient({ ...newPatient, firstName: e.target.value })}
                    placeholder="Rajesh"
                    className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-800 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={newPatient.lastName}
                    onChange={(e) => setNewPatient({ ...newPatient, lastName: e.target.value })}
                    placeholder="Kumar"
                    className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-800 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={newPatient.phone}
                    onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-800 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={newPatient.dob}
                    onChange={(e) => setNewPatient({ ...newPatient, dob: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-800 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Gender *</label>
                  <select
                    value={newPatient.gender}
                    onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-800 font-medium"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Address</label>
                  <input
                    type="text"
                    value={newPatient.address}
                    onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                    placeholder="102 Residencies, Bangalore"
                    className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-800 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Allergies (comma-separated)</label>
                  <input
                    type="text"
                    value={newPatient.allergies}
                    onChange={(e) => setNewPatient({ ...newPatient, allergies: e.target.value })}
                    placeholder="Penicillin, Pollen"
                    className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-800 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Chronic Conditions (comma-separated)</label>
                  <input
                    type="text"
                    value={newPatient.chronicConditions}
                    onChange={(e) => setNewPatient({ ...newPatient, chronicConditions: e.target.value })}
                    placeholder="Hypertension, Diabetes"
                    className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-800 font-medium"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRegisterModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registeringPatient}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg flex items-center space-x-1.5 shadow-sm shadow-indigo-500/10 disabled:opacity-50"
                >
                  {registeringPatient && <Loader className="w-4 h-4 animate-spin" />}
                  <span>Register Patient</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Merge Duplicate Patients Modal */}
      {mergeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase flex items-center">
                <ArrowRightLeft className="w-4 h-4 mr-2 text-indigo-600" /> Merge Duplicate Profiles
              </h3>
              <button onClick={() => setMergeModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleMergePatientsSubmit} className="p-6 space-y-4 text-xs">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Consolidate billing invoices, clinical encounter history, and prescriptions from a duplicate record into a survivor record. **The duplicate profile will be deleted permanently.**
              </p>
              
              {mergeError && <p className="text-red-600 text-xs font-bold">{mergeError}</p>}
              {mergeSuccess && <p className="text-emerald-600 text-xs font-bold">Profiles successfully consolidated!</p>}

              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Source Patient Profile ID (Duplicate to Delete)</label>
                <input
                  type="text"
                  required
                  value={mergeSourceId}
                  onChange={(e) => setMergeSourceId(e.target.value)}
                  placeholder="Paste duplicate ID string..."
                  className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500 rounded-lg px-3.5 py-2 text-slate-800 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Target Patient Profile ID (Survivor to Retain)</label>
                <input
                  type="text"
                  required
                  value={mergeTargetId}
                  onChange={(e) => setMergeTargetId(e.target.value)}
                  placeholder="Paste survivor ID string..."
                  className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500 rounded-lg px-3.5 py-2 text-slate-800 font-medium"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMergeModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={merging}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center space-x-1.5 shadow-sm shadow-indigo-500/10 disabled:opacity-50"
                >
                  {merging && <Loader className="w-4 h-4 animate-spin" />}
                  <span>Execute Consolidation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
