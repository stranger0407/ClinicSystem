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
  User
} from 'lucide-react';

export default function DoctorDashboard() {
  const { user, clinic, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  // Queue and selected state
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

  // Route check
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'DOCTOR' && user.role !== 'OWNER') {
        router.push(`/dashboard/${user.role.toLowerCase()}`);
      }
    }
  }, [user, authLoading]);

  // Load doctor's today queue
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

  useEffect(() => {
    if (!authLoading && user?.profileId) {
      loadQueue();
    }
  }, [user, authLoading]);

  // Open consultation chart
  const openConsultation = async (app: any) => {
    setSelectedApp(app);
    setLoadingTimeline(true);
    setComplaint('');
    setDiagnosis('');
    setClinicalNotes('');
    setFollowUpDate('');
    setTestsRequired('');
    setVitals({ bp: '', pulse: '', temp: '', weight: '', height: '', sugar: '' });
    setPrescriptionItems([]);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const data = await apiFetch(`/patient/${app.patient.id}/timeline`);
      setPatientTimeline(data);
      // pre-fill notes if available
      if (app.notes) {
        setComplaint(app.notes);
      }
      // Update appointment status to IN_CONSULTATION automatically in backend
      if (app.status === 'BOOKED' || app.status === 'CHECKED_IN') {
        await apiFetch(`/appointment/${app.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'IN_CONSULTATION' }),
        });
        loadQueue();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTimeline(false);
    }
  };

  // Autocomplete medicine search
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

  // Add prescription item
  const addPrescriptionItem = () => {
    if (!selectedMed) {
      // If doctor entered a custom medicine name on the fly
      if (medQuery.trim()) {
        // We can mock a medicine ID or write it later. Let's create an item
        // In database, we need a valid medicineId.
        // For simplicity and resilience, if medicine is not in DB, we'll alert to select from list,
        // or let's allow search and select only.
        alert('Please select a medicine from the search results.');
        return;
      }
      return;
    }

    const newItem = {
      medicineId: selectedMed.id,
      name: selectedMed.name,
      strength: selectedMed.strength,
      dosage,
      instructions,
      durationDays,
    };

    setPrescriptionItems([...prescriptionItems, newItem]);
    setSelectedMed(null);
    setMedQuery('');
    setMedResults([]);
  };

  // Remove prescription item
  const removePrescriptionItem = (index: number) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index));
  };

  // Complete consultation & save encounter
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
        clinicalNotes: clinicalNotes.trim() || undefined,
        testsRequired: testsRequired.split(',').map((t) => t.trim()).filter(Boolean),
        followUpDate: followUpDate || undefined,
        vitals: Object.fromEntries(Object.entries(vitals).filter(([_, v]) => v.trim() !== '')),
        prescriptionItems: prescriptionItems.map((item) => ({
          medicineId: item.medicineId,
          dosage: item.dosage,
          instructions: item.instructions,
          durationDays: item.durationDays,
        })),
      };

      await apiFetch('/encounter', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSuccessMsg('Consultation completed and saved successfully.');
      setSelectedApp(null);
      setPatientTimeline(null);
      loadQueue();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete consultation');
    } finally {
      setSavingEncounter(false);
    }
  };

  if (authLoading || !user || (user.role !== 'DOCTOR' && user.role !== 'OWNER')) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-teal-400">
        <Loader className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar / Queue list */}
      <aside className="w-full md:w-80 bg-slate-900 text-white flex flex-col shrink-0 border-r border-slate-800">
        <div className="p-4 border-b border-slate-850 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm block">Doctor's Desk</span>
              <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider block">
                {clinic?.name || 'Clinic'}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-slate-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Doctor Identity */}
        <div className="p-4 bg-slate-850/50 border-b border-slate-850 text-xs flex items-center space-x-3">
          <div className="w-8 h-8 bg-teal-500/20 text-teal-300 font-bold rounded-lg flex items-center justify-center uppercase border border-teal-500/30">
            Dr
          </div>
          <div>
            <p className="font-bold">Dr. {user.firstName} {user.lastName}</p>
            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">
              Today's Schedule
            </p>
          </div>
        </div>

        {/* Live Queue list */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 flex items-center justify-between bg-slate-950/20">
            <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">
              Today's Patients queue
            </span>
            <button
              onClick={loadQueue}
              className="text-[9px] text-teal-400 hover:underline font-bold uppercase tracking-wider"
            >
              Refresh
            </button>
          </div>

          {loadingQueue ? (
            <div className="flex items-center justify-center py-12 text-teal-400">
              <Loader className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="divide-y divide-slate-850/40">
              {appointments.length > 0 ? (
                appointments.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => openConsultation(app)}
                    className={`p-4 cursor-pointer hover:bg-slate-850/50 transition-colors border-l-4 ${
                      selectedApp?.id === app.id
                        ? 'bg-slate-800/80 border-teal-500'
                        : app.status === 'CHECKED_IN'
                        ? 'border-emerald-500 bg-emerald-500/5'
                        : 'border-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-slate-100">
                        {app.patient.firstName} {app.patient.lastName}
                      </h4>
                      <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        app.status === 'CHECKED_IN' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        app.status === 'IN_CONSULTATION' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' :
                        app.status === 'COMPLETED' ? 'bg-slate-800 text-slate-500' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {app.status === 'BOOKED' ? 'Booked' : app.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2">
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1 text-slate-500" />
                        {app.type === 'SLOT' ? (
                          new Date(app.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        ) : (
                          `Walk-in #${app.queueNumber}`
                        )}
                      </span>
                      {app.isFollowUp && (
                        <span className="text-[8px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1 rounded font-bold uppercase">
                          Follow-up
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-xs italic p-6 text-center">No patients scheduled for today.</p>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main workspace */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-6xl">
        {selectedApp ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Consultation and Prescribing Pad (Left 2 Cols) */}
            <form onSubmit={handleSaveEncounter} className="lg:col-span-2 space-y-6">
              {/* Encounter diagnosis info */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center">
                    <Clipboard className="w-4.5 h-4.5 mr-2 text-teal-600" />
                    Consultation report
                  </h2>
                  <span className="text-xs text-slate-500 font-medium">
                    Patient ID: <span className="font-bold">{selectedApp.patient.id.slice(0, 8)}...</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Vitals inputs */}
                  <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 sm:col-span-2 space-y-3">
                    <h4 className="text-[10px] text-teal-700 font-bold uppercase tracking-wider flex items-center">
                      <Heart className="w-3.5 h-3.5 mr-1.5 text-teal-600 animate-pulse" />
                      Patient vitals & observations
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
                      <div className="space-y-0.5">
                        <label className="text-[9px] text-slate-500 font-semibold block uppercase">BP (mmHg)</label>
                        <input
                          type="text"
                          value={vitals.bp}
                          onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                          placeholder="e.g. 120/80"
                          className="w-full bg-white border border-slate-200 focus:border-teal-500 focus:outline-none rounded px-2 py-1 text-xs"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[9px] text-slate-500 font-semibold block uppercase">Pulse (bpm)</label>
                        <input
                          type="text"
                          value={vitals.pulse}
                          onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                          placeholder="72"
                          className="w-full bg-white border border-slate-200 focus:border-teal-500 focus:outline-none rounded px-2 py-1 text-xs"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[9px] text-slate-500 font-semibold block uppercase">Temp (°F)</label>
                        <input
                          type="text"
                          value={vitals.temp}
                          onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                          placeholder="98.6"
                          className="w-full bg-white border border-slate-200 focus:border-teal-500 focus:outline-none rounded px-2 py-1 text-xs"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[9px] text-slate-500 font-semibold block uppercase">Weight (kg)</label>
                        <input
                          type="text"
                          value={vitals.weight}
                          onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                          placeholder="70"
                          className="w-full bg-white border border-slate-200 focus:border-teal-500 focus:outline-none rounded px-2 py-1 text-xs"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[9px] text-slate-500 font-semibold block uppercase">Height (cm)</label>
                        <input
                          type="text"
                          value={vitals.height}
                          onChange={(e) => setVitals({ ...vitals, height: e.target.value })}
                          placeholder="170"
                          className="w-full bg-white border border-slate-200 focus:border-teal-500 focus:outline-none rounded px-2 py-1 text-xs"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[9px] text-slate-500 font-semibold block uppercase">Sugar (mg/dL)</label>
                        <input
                          type="text"
                          value={vitals.sugar}
                          onChange={(e) => setVitals({ ...vitals, sugar: e.target.value })}
                          placeholder="90"
                          className="w-full bg-white border border-slate-200 focus:border-teal-500 focus:outline-none rounded px-2 py-1 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Complaint */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Chief complaint / Symptoms</label>
                    <textarea
                      value={complaint}
                      required
                      onChange={(e) => setComplaint(e.target.value)}
                      placeholder="Specify active symptoms (e.g. high fever since 2 days, chest pain...)"
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded-lg px-3 py-2 text-xs"
                    />
                  </div>

                  {/* Diagnosis */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Diagnosis</label>
                    <input
                      type="text"
                      value={diagnosis}
                      required
                      onChange={(e) => setDiagnosis(e.target.value)}
                      placeholder="e.g. Viral Fever, Acute Bronchitis..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded-lg px-3 py-2 text-xs"
                    />
                  </div>

                  {/* Clinic notes */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Clinical notes & Doctor comments</label>
                    <textarea
                      value={clinicalNotes}
                      onChange={(e) => setClinicalNotes(e.target.value)}
                      placeholder="Details of physical examination, advice to patient..."
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded-lg px-3 py-2 text-xs"
                    />
                  </div>

                  {/* Recommended tests & follow-up */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Recommended Tests (comma separated)</label>
                    <input
                      type="text"
                      value={testsRequired}
                      onChange={(e) => setTestsRequired(e.target.value)}
                      placeholder="e.g. CBC, Chest X-Ray"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded-lg px-3 py-2 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Follow-up date</label>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:outline-none rounded-lg px-3 py-1.5 text-xs text-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* Digital Prescription Pad */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 uppercase tracking-wider flex items-center">
                  <FileText className="w-4.5 h-4.5 mr-2 text-teal-600" />
                  Prescription pad
                </h3>

                {/* Medicine Search input autocomplete */}
                <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-3">
                  <span className="text-[10px] text-teal-700 font-bold uppercase tracking-wider block">
                    Add medication
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 relative">
                    {/* Search */}
                    <div className="sm:col-span-2 space-y-1 relative">
                      <label className="text-[9px] text-slate-500 font-semibold block uppercase">Medicine Search</label>
                      <input
                        type="text"
                        value={selectedMed ? `${selectedMed.name} (${selectedMed.strength})` : medQuery}
                        disabled={!!selectedMed}
                        onChange={(e) => handleMedSearch(e.target.value)}
                        placeholder="Type medicine name (e.g. Paracetamol)..."
                        className="w-full bg-white border border-slate-200 focus:border-teal-500 focus:outline-none rounded px-2.5 py-1 text-xs disabled:bg-slate-100 disabled:text-slate-650"
                      />
                      {selectedMed && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMed(null);
                            setMedQuery('');
                          }}
                          className="absolute right-2 top-5 text-[9px] text-red-500 font-bold uppercase"
                        >
                          Clear
                        </button>
                      )}

                      {/* Dropdown results */}
                      {!selectedMed && medResults.length > 0 && (
                        <div className="absolute left-0 right-0 top-12 bg-white border border-slate-200 rounded shadow-lg max-h-36 overflow-y-auto z-20 divide-y divide-slate-100">
                          {medResults.map((med) => (
                            <div
                              key={med.id}
                              onClick={() => {
                                setSelectedMed(med);
                                setMedResults([]);
                              }}
                              className="p-2 text-xs hover:bg-slate-50 cursor-pointer flex justify-between"
                            >
                              <span className="font-bold">{med.name} - {med.strength}</span>
                              <span className="text-slate-400 text-[10px]">{med.dosageForm}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Dosage */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 font-semibold block uppercase">Dosage pattern</label>
                      <input
                        type="text"
                        value={dosage}
                        onChange={(e) => setDosage(e.target.value)}
                        placeholder="1-0-1 or 5ml"
                        className="w-full bg-white border border-slate-200 focus:border-teal-500 focus:outline-none rounded px-2 py-1 text-xs"
                      />
                    </div>

                    {/* Duration */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 font-semibold block uppercase">Duration (days)</label>
                      <input
                        type="number"
                        value={durationDays}
                        onChange={(e) => setDurationDays(parseInt(e.target.value) || 1)}
                        min={1}
                        className="w-full bg-white border border-slate-200 focus:border-teal-500 focus:outline-none rounded px-2 py-1 text-xs"
                      />
                    </div>

                    {/* Instructions */}
                    <div className="sm:col-span-3 space-y-1">
                      <label className="text-[9px] text-slate-500 font-semibold block uppercase">Instructions</label>
                      <input
                        type="text"
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder="After food, empty stomach..."
                        className="w-full bg-white border border-slate-200 focus:border-teal-500 focus:outline-none rounded px-2 py-1 text-xs"
                      />
                    </div>

                    {/* Add button */}
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={addPrescriptionItem}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold rounded px-3 py-1.5 text-xs transition-colors flex items-center justify-center space-x-1"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>Add item</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* List of currently prescribed items */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-bold uppercase">
                        <th className="p-3">Medicine</th>
                        <th className="p-3">Dosage</th>
                        <th className="p-3">Duration</th>
                        <th className="p-3">Instructions</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {prescriptionItems.length > 0 ? (
                        prescriptionItems.map((item, index) => (
                          <tr key={index} className="hover:bg-slate-50/50">
                            <td className="p-3">
                              <span className="font-bold text-slate-800">{item.name}</span>
                              <span className="text-slate-400 block text-[10px] mt-0.5">{item.strength}</span>
                            </td>
                            <td className="p-3 font-semibold text-slate-700">{item.dosage}</td>
                            <td className="p-3 text-slate-600">{item.durationDays} days</td>
                            <td className="p-3 text-slate-500 italic">{item.instructions}</td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => removePrescriptionItem(index)}
                                className="text-red-500 hover:text-red-700 p-1 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-400 italic">
                            No medicines added to the prescription pad yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  disabled={savingEncounter}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold rounded-xl py-3 text-sm transition-all transform hover:scale-[1.01] shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {savingEncounter ? <Loader className="w-4.5 h-4.5 animate-spin" /> : <span>Finalize & Complete consultation</span>}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl px-6 py-3 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>

            {/* Patient File & History timeline Sidebar (Right 1 Col) */}
            <div className="space-y-6">
              {/* Patient summary details */}
              <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-1/2 right-10 -translate-y-1/2 w-36 h-36 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>

                <h3 className="text-[10px] text-teal-400 font-bold uppercase tracking-wider mb-3 flex items-center">
                  <User className="w-3.5 h-3.5 mr-1 text-teal-400" />
                  Active patient file
                </h3>

                <div className="space-y-2.5 relative">
                  <h2 className="text-lg font-black tracking-tight leading-tight">
                    {selectedApp.patient.firstName} {selectedApp.patient.lastName}
                  </h2>
                  <div className="text-[11px] text-slate-300 space-y-1">
                    <p>Phone: <span className="font-semibold">{selectedApp.patient.phone}</span></p>
                    <p>DOB: <span className="font-semibold">{new Date(selectedApp.patient.dob).toLocaleDateString()}</span></p>
                    <p>Gender: <span className="font-semibold uppercase">{selectedApp.patient.gender}</span></p>
                  </div>
                </div>
              </div>

              {/* History Timeline */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Allergies & Conditions
                </h3>
                <div className="space-y-3.5">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Known Allergies</span>
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
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Chronic conditions</span>
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

              {/* Past Encounters list */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Visit History ({patientTimeline?.encounters?.length || 0})
                </h3>

                <div className="space-y-3 max-h-80 overflow-y-auto divide-y divide-slate-50">
                  {patientTimeline?.encounters?.length > 0 ? (
                    patientTimeline.encounters.map((enc: any) => (
                      <div key={enc.id} className="pt-2 text-xs space-y-1">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                          <span>{new Date(enc.createdAt).toLocaleDateString()}</span>
                          <span>Dr. {enc.doctor.user.firstName}</span>
                        </div>
                        <p className="font-bold text-slate-800">Diag: {enc.diagnosis}</p>
                        <p className="text-slate-500 italic mt-0.5">Note: {enc.complaint}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-xs italic py-4 text-center">No past visits recorded</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty / Default State (No patient selected) */
          <div className="h-[70vh] flex flex-col justify-center items-center text-center">
            <div className="w-16 h-16 bg-teal-500/10 border border-teal-500/20 text-teal-600 rounded-2xl flex items-center justify-center mb-4 shadow">
              <Users className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-black text-slate-800">Select a patient from today's queue</h2>
            <p className="text-slate-400 text-xs max-w-sm mt-1">
              Select a checked-in patient from the left queue list to review their file, record vitals, write diagnosis notes, and prescribe medications.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
