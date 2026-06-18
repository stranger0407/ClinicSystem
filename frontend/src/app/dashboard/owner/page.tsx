'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/utils/api';
import {
  TrendingUp,
  Users,
  Activity,
  FileText,
  PlusCircle,
  LogOut,
  Search,
  Trash2,
  Edit,
  Plus,
  X,
  ChevronRight,
  Loader,
  Filter,
  Database,
  Calendar,
  Building,
  AlertCircle,
  CheckCircle,
  User,
  Info
} from 'lucide-react';

interface Medicine {
  id: string;
  name: string;
  genericName?: string;
  dosageForm: string;
  strength: string;
  defaultSchedule?: string;
}

interface AuditLog {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'MERGE';
  entityName: string;
  entityId: string;
  details: any;
  ipAddress?: string;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    role: string;
  };
}

export default function OwnerDashboard() {
  const { user, clinic, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'medicines' | 'audit'>('overview');

  // Dashboard Stats State
  const [stats, setStats] = useState<any>({
    visitsCount: 0,
    todayRevenue: 0,
    paymentSplit: { CASH: 0, UPI: 0, CARD: 0 },
    pendingDues: 0,
    doctorsCount: 0,
    staffCount: 0,
  });

  // Medicines State
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [searchMedQuery, setSearchMedQuery] = useState('');
  const [medModalOpen, setMedModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medicine | null>(null);
  const [medForm, setMedForm] = useState({
    name: '',
    genericName: '',
    dosageForm: 'TABLET',
    strength: '',
    defaultSchedule: '1-0-1',
  });

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchAuditQuery, setSearchAuditQuery] = useState('');
  const [selectedAuditAction, setSelectedAuditAction] = useState('');
  const [selectedAuditEntity, setSelectedAuditEntity] = useState('');
  const [viewingAuditLog, setViewingAuditLog] = useState<AuditLog | null>(null);

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [submittingMed, setSubmittingMed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Protect route & check role
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'OWNER') {
        router.push(`/dashboard/${user.role.toLowerCase()}`);
      }
    }
  }, [user, authLoading]);

  // Load all dashboard data
  const loadDashboardData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [statsData, auditData, medsData] = await Promise.all([
        apiFetch('/admin/stats'),
        apiFetch('/admin/audit-logs'),
        apiFetch('/medicine')
      ]);

      setStats(statsData);
      setAuditLogs(auditData);
      setMedicines(medsData);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && user.role === 'OWNER') {
      loadDashboardData();
    }
  }, [user, authLoading]);

  // Handle Medicine Create/Update Modal Open
  const openMedModal = (med: Medicine | null = null) => {
    if (med) {
      setEditingMed(med);
      setMedForm({
        name: med.name,
        genericName: med.genericName || '',
        dosageForm: med.dosageForm,
        strength: med.strength,
        defaultSchedule: med.defaultSchedule || '',
      });
    } else {
      setEditingMed(null);
      setMedForm({
        name: '',
        genericName: '',
        dosageForm: 'TABLET',
        strength: '',
        defaultSchedule: '1-0-1',
      });
    }
    setMedModalOpen(true);
  };

  // Submit Medicine form
  const handleMedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medForm.name || !medForm.strength) {
      setErrorMsg('Name and Strength are required fields.');
      return;
    }

    setSubmittingMed(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        name: medForm.name,
        genericName: medForm.genericName || undefined,
        dosageForm: medForm.dosageForm,
        strength: medForm.strength,
        defaultSchedule: medForm.defaultSchedule || undefined,
      };

      if (editingMed) {
        await apiFetch(`/medicine/${editingMed.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setSuccessMsg('Medicine catalog item updated successfully.');
      } else {
        await apiFetch('/medicine', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setSuccessMsg('New medicine added to catalog.');
      }

      setMedModalOpen(false);
      // Reload medicine list and audit log
      const [medsData, auditData] = await Promise.all([
        apiFetch('/medicine'),
        apiFetch('/admin/audit-logs')
      ]);
      setMedicines(medsData);
      setAuditLogs(auditData);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save medicine item.');
    } finally {
      setSubmittingMed(false);
    }
  };

  // Delete Medicine
  const handleDeleteMed = async (id: string) => {
    if (!confirm('Are you sure you want to remove this medicine from the clinic catalog?')) {
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    try {
      await apiFetch(`/medicine/${id}`, {
        method: 'DELETE',
      });
      setSuccessMsg('Medicine removed from catalog.');

      // Reload
      const [medsData, auditData] = await Promise.all([
        apiFetch('/medicine'),
        apiFetch('/admin/audit-logs')
      ]);
      setMedicines(medsData);
      setAuditLogs(auditData);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete medicine item.');
    }
  };

  // Filter medicines based on search query
  const filteredMedicines = medicines.filter(
    (med) =>
      med.name.toLowerCase().includes(searchMedQuery.toLowerCase()) ||
      (med.genericName && med.genericName.toLowerCase().includes(searchMedQuery.toLowerCase()))
  );

  // Filter audit logs based on search query, action, and entity
  const filteredAuditLogs = auditLogs.filter((log) => {
    const query = searchAuditQuery.toLowerCase();
    const matchesQuery =
      log.entityId.toLowerCase().includes(query) ||
      (log.user && `${log.user.firstName} ${log.user.lastName}`.toLowerCase().includes(query)) ||
      JSON.stringify(log.details).toLowerCase().includes(query);

    const matchesAction = !selectedAuditAction || log.action === selectedAuditAction;
    const matchesEntity = !selectedAuditEntity || log.entityName === selectedAuditEntity;

    return matchesQuery && matchesAction && matchesEntity;
  });

  // Unique actions and entities in audit log for filter options
  const uniqueEntities = Array.from(new Set(auditLogs.map((log) => log.entityName)));

  // Calculate payment percentages for visual indicators
  const totalCollected = stats.todayRevenue || 0;
  const cashPercent = totalCollected > 0 ? Math.round((stats.paymentSplit.CASH / totalCollected) * 100) : 0;
  const upiPercent = totalCollected > 0 ? Math.round((stats.paymentSplit.UPI / totalCollected) * 100) : 0;
  const cardPercent = totalCollected > 0 ? Math.round((stats.paymentSplit.CARD / totalCollected) * 100) : 0;

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-slate-100">
        <div className="text-center">
          <Loader className="mx-auto h-12 w-12 animate-spin text-indigo-500" />
          <p className="mt-4 text-lg font-medium text-slate-300">Authenticating clinic session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Banner */}
      <header className="border-b border-slate-800 bg-slate-900 px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3">
          <Building className="h-8 w-8 text-indigo-500" />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">{clinic?.name || 'Clinic Management'}</h1>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Owner Console & Analytics</p>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-950 p-2 rounded-full border border-indigo-800">
              <User className="h-5 w-5 text-indigo-400" />
            </div>
            <div className="text-left hidden md:block">
              <p className="text-sm font-semibold text-slate-200">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-slate-400">Owner Role</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center space-x-2 text-slate-400 hover:text-red-400 transition-colors font-medium border border-slate-700 hover:border-red-900 px-3 py-1.5 rounded-lg bg-slate-800"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline text-sm">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Left Sidebar Controls */}
        <aside className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-900 p-4 space-y-2 flex lg:flex-col shrink-0 overflow-x-auto lg:overflow-x-visible">
          <div className="hidden lg:block text-slate-500 text-xs font-bold uppercase tracking-wider px-3 mb-4">
            Navigation Menu
          </div>
          <nav className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-1 w-full">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 transition-all font-medium whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="h-5 w-5" />
              <span>Overview & Revenue</span>
            </button>
            <button
              onClick={() => setActiveTab('medicines')}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 transition-all font-medium whitespace-nowrap ${
                activeTab === 'medicines'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Database className="h-5 w-5" />
              <span>Medicine Master</span>
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 transition-all font-medium whitespace-nowrap ${
                activeTab === 'audit'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span>System Audit Logs</span>
            </button>
          </nav>
        </aside>

        {/* Right Dashboard Window */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Notifications / Alerts */}
          {errorMsg && (
            <div className="mb-6 flex items-start space-x-3 bg-red-950/50 border border-red-800 p-4 rounded-xl text-red-300">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-6 flex items-start space-x-3 bg-emerald-950/50 border border-emerald-800 p-4 rounded-xl text-emerald-300">
              <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <Loader className="mx-auto h-10 w-10 animate-spin text-indigo-500" />
                <p className="mt-3 text-slate-400 text-sm font-medium">Retrieving real-time details...</p>
              </div>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW & ANALYTICS */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Dashboard Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Today Revenue Card */}
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 relative overflow-hidden group shadow-md hover:border-slate-700 transition-all">
                      <div className="absolute top-0 right-0 p-4 opacity-15">
                        <TrendingUp className="h-16 w-16 text-emerald-500" />
                      </div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Revenue Collections</p>
                      <h3 className="text-3xl font-extrabold text-white mt-2">₹ {stats.todayRevenue.toFixed(2)}</h3>
                      <div className="mt-4 flex items-center space-x-2 text-xs">
                        <span className="text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-900 px-2 py-0.5 rounded-full">Active today</span>
                      </div>
                    </div>

                    {/* Today Visits Card */}
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 relative overflow-hidden group shadow-md hover:border-slate-700 transition-all">
                      <div className="absolute top-0 right-0 p-4 opacity-15">
                        <Activity className="h-16 w-16 text-indigo-500" />
                      </div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Encounters / Visits</p>
                      <h3 className="text-3xl font-extrabold text-white mt-2">{stats.visitsCount}</h3>
                      <div className="mt-4 flex items-center space-x-2 text-xs">
                        <span className="text-indigo-400 font-bold bg-indigo-950/60 border border-indigo-900 px-2 py-0.5 rounded-full">Completed consults</span>
                      </div>
                    </div>

                    {/* Pending Dues Card */}
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 relative overflow-hidden group shadow-md hover:border-slate-700 transition-all">
                      <div className="absolute top-0 right-0 p-4 opacity-15">
                        <AlertCircle className="h-16 w-16 text-amber-500" />
                      </div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Outstanding Invoiced Dues</p>
                      <h3 className="text-3xl font-extrabold text-white mt-2">₹ {stats.pendingDues.toFixed(2)}</h3>
                      <div className="mt-4 flex items-center space-x-2 text-xs">
                        <span className={`font-bold px-2 py-0.5 rounded-full ${stats.pendingDues > 0 ? 'text-amber-400 bg-amber-950/60 border border-amber-900' : 'text-slate-400 bg-slate-850'}`}>
                          {stats.pendingDues > 0 ? 'Requires follow-up' : 'All clear'}
                        </span>
                      </div>
                    </div>

                    {/* Staff & Doctors Counts */}
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 relative overflow-hidden group shadow-md hover:border-slate-700 transition-all">
                      <div className="absolute top-0 right-0 p-4 opacity-15">
                        <Users className="h-16 w-16 text-blue-500" />
                      </div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Registered Personnel</p>
                      <h3 className="text-3xl font-extrabold text-white mt-2">
                        {stats.doctorsCount + stats.staffCount}
                      </h3>
                      <div className="mt-4 flex items-center space-x-3 text-xs text-slate-400">
                        <span className="bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded-full">
                          Doctors: <strong className="text-indigo-400 font-bold">{stats.doctorsCount}</strong>
                        </span>
                        <span className="bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded-full">
                          Staff: <strong className="text-blue-400 font-bold">{stats.staffCount}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Split Collection breakdown & Clinic details */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Collection channels split card */}
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-md lg:col-span-2">
                      <h3 className="text-base font-bold text-slate-200 border-b border-slate-800 pb-3 mb-5">
                        Collection Channels Break-Down
                      </h3>
                      {totalCollected === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                          <Info className="h-8 w-8 mb-2" />
                          <p className="text-sm">No transactions registered today.</p>
                        </div>
                      ) : (
                        <div className="space-y-6 py-2">
                          {/* UPI */}
                          <div>
                            <div className="flex justify-between text-sm font-medium mb-2">
                              <span className="text-slate-300">UPI Payments</span>
                              <span className="text-slate-100 font-bold">₹ {stats.paymentSplit.UPI.toFixed(2)} ({upiPercent}%)</span>
                            </div>
                            <div className="w-full bg-slate-800 h-3.5 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${upiPercent}%` }} />
                            </div>
                          </div>

                          {/* CASH */}
                          <div>
                            <div className="flex justify-between text-sm font-medium mb-2">
                              <span className="text-slate-300">Cash Collections</span>
                              <span className="text-slate-100 font-bold">₹ {stats.paymentSplit.CASH.toFixed(2)} ({cashPercent}%)</span>
                            </div>
                            <div className="w-full bg-slate-800 h-3.5 rounded-full overflow-hidden">
                              <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${cashPercent}%` }} />
                            </div>
                          </div>

                          {/* CARD */}
                          <div>
                            <div className="flex justify-between text-sm font-medium mb-2">
                              <span className="text-slate-300">Card Transactions</span>
                              <span className="text-slate-100 font-bold">₹ {stats.paymentSplit.CARD.toFixed(2)} ({cardPercent}%)</span>
                            </div>
                            <div className="w-full bg-slate-800 h-3.5 rounded-full overflow-hidden">
                              <div className="bg-cyan-500 h-full rounded-full transition-all duration-500" style={{ width: `${cardPercent}%` }} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Clinic Summary metadata card */}
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-md">
                      <h3 className="text-base font-bold text-slate-200 border-b border-slate-800 pb-3 mb-5">
                        Clinic Tenant Context
                      </h3>
                      <div className="space-y-4 text-sm">
                        <div className="flex justify-between pb-2 border-b border-slate-800/50">
                          <span className="text-slate-400">Clinic Subdomain</span>
                          <span className="text-indigo-400 font-mono font-medium">{clinic?.subdomain}</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-slate-800/50">
                          <span className="text-slate-400">Clinic ID</span>
                          <span className="text-slate-300 font-mono text-xs select-all bg-slate-850 px-2 py-0.5 rounded border border-slate-800">
                            {clinic?.id}
                          </span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-slate-800/50">
                          <span className="text-slate-400">Database Engine</span>
                          <span className="text-slate-300 font-semibold">PostgreSQL (Prisma)</span>
                        </div>
                        <div className="pt-2 text-center text-xs text-slate-500 italic">
                          Multi-tenant isolation active for {clinic?.name}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MEDICINE MASTER CATALOG */}
              {activeTab === 'medicines' && (
                <div className="space-y-6">
                  {/* Controls Toolbar */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search medicines by name or generic name..."
                        value={searchMedQuery}
                        onChange={(e) => setSearchMedQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                    <button
                      onClick={() => openMedModal(null)}
                      className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 transition-all font-semibold text-sm text-white px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-900/30 shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add New Medicine</span>
                    </button>
                  </div>

                  {/* Medicines Catalog Table */}
                  <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-md">
                    {filteredMedicines.length === 0 ? (
                      <div className="p-12 text-center text-slate-500">
                        <Database className="mx-auto h-12 w-12 text-slate-600 mb-3" />
                        <p className="text-sm font-semibold">No medicines match your search criteria.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                          <thead>
                            <tr className="bg-slate-850 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              <th className="px-6 py-4">Medicine Name</th>
                              <th className="px-6 py-4">Generic Composition</th>
                              <th className="px-6 py-4">Dosage Form</th>
                              <th className="px-6 py-4">Strength</th>
                              <th className="px-6 py-4">Default Intake Schedule</th>
                              <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 text-sm text-slate-200">
                            {filteredMedicines.map((med) => (
                              <tr key={med.id} className="hover:bg-slate-850 transition-colors">
                                <td className="px-6 py-4 font-bold text-white">{med.name}</td>
                                <td className="px-6 py-4 font-medium text-slate-400 italic">
                                  {med.genericName || 'N/A'}
                                </td>
                                <td className="px-6 py-4">
                                  <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-xs font-bold text-slate-300">
                                    {med.dosageForm}
                                  </span>
                                </td>
                                <td className="px-6 py-4 font-semibold text-slate-300">{med.strength}</td>
                                <td className="px-6 py-4 text-slate-400">{med.defaultSchedule || 'N/A'}</td>
                                <td className="px-6 py-4 text-right space-x-3">
                                  <button
                                    onClick={() => openMedModal(med)}
                                    className="text-slate-400 hover:text-indigo-400 transition-colors"
                                    title="Edit Medicine"
                                  >
                                    <Edit className="h-4.5 w-4.5 inline-block" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMed(med.id)}
                                    className="text-slate-400 hover:text-red-400 transition-colors"
                                    title="Delete Medicine"
                                  >
                                    <Trash2 className="h-4.5 w-4.5 inline-block" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: SYSTEM AUDIT LOGS */}
              {activeTab === 'audit' && (
                <div className="space-y-6">
                  {/* Filter Toolbar */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search audit trail (User name, Entity ID, logs details)..."
                        value={searchAuditQuery}
                        onChange={(e) => setSearchAuditQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                    {/* Action Filter */}
                    <div className="flex items-center space-x-2 shrink-0 w-full md:w-auto">
                      <Filter className="h-4 w-4 text-slate-400 hidden md:block" />
                      <select
                        value={selectedAuditAction}
                        onChange={(e) => setSelectedAuditAction(e.target.value)}
                        className="w-full md:w-auto px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">All Actions</option>
                        <option value="CREATE">CREATE</option>
                        <option value="UPDATE">UPDATE</option>
                        <option value="DELETE">DELETE</option>
                        <option value="MERGE">MERGE</option>
                      </select>
                    </div>
                    {/* Entity Filter */}
                    <div className="w-full md:w-auto">
                      <select
                        value={selectedAuditEntity}
                        onChange={(e) => setSelectedAuditEntity(e.target.value)}
                        className="w-full md:w-auto px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">All Entities</option>
                        {uniqueEntities.map((ent) => (
                          <option key={ent} value={ent}>
                            {ent}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Audit logs timeline */}
                  <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-md">
                    {filteredAuditLogs.length === 0 ? (
                      <div className="p-12 text-center text-slate-500">
                        <FileText className="mx-auto h-12 w-12 text-slate-600 mb-3" />
                        <p className="text-sm font-semibold">No audit logs matching your filters.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                          <thead>
                            <tr className="bg-slate-850 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              <th className="px-6 py-4">Timestamp</th>
                              <th className="px-6 py-4">User</th>
                              <th className="px-6 py-4">Action</th>
                              <th className="px-6 py-4">Entity</th>
                              <th className="px-6 py-4">Entity ID</th>
                              <th className="px-6 py-4">IP Address</th>
                              <th className="px-6 py-4 text-right">Details</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 text-sm text-slate-200">
                            {filteredAuditLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-slate-850 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-slate-400 text-xs">
                                  {new Date(log.createdAt).toLocaleString('en-IN')}
                                </td>
                                <td className="px-6 py-4">
                                  {log.user ? (
                                    <div>
                                      <p className="font-semibold text-white">
                                        {log.user.firstName} {log.user.lastName}
                                      </p>
                                      <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                                        {log.user.role}
                                      </p>
                                    </div>
                                  ) : (
                                    <span className="text-slate-500 italic">System Auto</span>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs font-bold ${
                                      log.action === 'CREATE'
                                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                                        : log.action === 'UPDATE'
                                        ? 'bg-blue-950 text-blue-400 border border-blue-900'
                                        : log.action === 'DELETE'
                                        ? 'bg-red-950 text-red-400 border border-red-900'
                                        : 'bg-purple-950 text-purple-400 border border-purple-900'
                                    }`}
                                  >
                                    {log.action}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-slate-300 font-medium">{log.entityName}</td>
                                <td className="px-6 py-4 font-mono text-xs text-slate-400 select-all">
                                  {log.entityId}
                                </td>
                                <td className="px-6 py-4 text-slate-500 font-mono text-xs">{log.ipAddress || 'Local'}</td>
                                <td className="px-6 py-4 text-right">
                                  <button
                                    onClick={() => setViewingAuditLog(log)}
                                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                                  >
                                    Inspect Values
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* MEDICINE ADD/EDIT MODAL */}
      {medModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
              <h3 className="font-bold text-white text-base">
                {editingMed ? 'Edit Medicine Details' : 'Add New Medicine to Catalog'}
              </h3>
              <button
                onClick={() => setMedModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleMedSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Medicine Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={medForm.name}
                    onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
                    placeholder="e.g. Paracetamol"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Generic Composition / Chemical Name
                  </label>
                  <input
                    type="text"
                    value={medForm.genericName}
                    onChange={(e) => setMedForm({ ...medForm, genericName: e.target.value })}
                    placeholder="e.g. Acetaminophen"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Dosage Form
                  </label>
                  <select
                    value={medForm.dosageForm}
                    onChange={(e) => setMedForm({ ...medForm, dosageForm: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="TABLET">TABLET</option>
                    <option value="SYRUP">SYRUP</option>
                    <option value="CAPSULE">CAPSULE</option>
                    <option value="INJECTION">INJECTION</option>
                    <option value="OINTMENT">OINTMENT</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Strength / Packing *
                  </label>
                  <input
                    type="text"
                    required
                    value={medForm.strength}
                    onChange={(e) => setMedForm({ ...medForm, strength: e.target.value })}
                    placeholder="e.g. 500mg or 100ml"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Default Intake Schedule
                  </label>
                  <input
                    type="text"
                    value={medForm.defaultSchedule}
                    onChange={(e) => setMedForm({ ...medForm, defaultSchedule: e.target.value })}
                    placeholder="e.g. 1-0-1 or 1-1-1 or As needed"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setMedModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 transition-colors rounded-lg text-sm font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingMed}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors rounded-lg text-sm font-semibold text-white flex items-center space-x-2"
                >
                  {submittingMed && <Loader className="h-4 w-4 animate-spin" />}
                  <span>{editingMed ? 'Update Item' : 'Add Medicine'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AUDIT LOG VALUE INSPECTION MODAL */}
      {viewingAuditLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
              <div>
                <h3 className="font-bold text-white text-base">Audit Trail Log Details</h3>
                <p className="text-xs text-slate-400 mt-0.5">ID: {viewingAuditLog.id}</p>
              </div>
              <button
                onClick={() => setViewingAuditLog(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-sm bg-slate-950 p-4 rounded-lg border border-slate-850">
                <div>
                  <span className="text-slate-450 block text-xs uppercase font-bold">Action Mode</span>
                  <span className="text-white font-semibold">{viewingAuditLog.action}</span>
                </div>
                <div>
                  <span className="text-slate-450 block text-xs uppercase font-bold">Target Entity</span>
                  <span className="text-white font-semibold">{viewingAuditLog.entityName}</span>
                </div>
                <div>
                  <span className="text-slate-450 block text-xs uppercase font-bold">Operator Name</span>
                  <span className="text-white font-semibold">
                    {viewingAuditLog.user
                      ? `${viewingAuditLog.user.firstName} ${viewingAuditLog.user.lastName} (${viewingAuditLog.user.role})`
                      : 'System Auto'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-450 block text-xs uppercase font-bold">Timestamp</span>
                  <span className="text-white font-semibold">
                    {new Date(viewingAuditLog.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-xs uppercase font-bold mb-2">Change Payload (JSON Details)</span>
                <pre className="bg-slate-950 p-4 rounded-lg border border-slate-850 text-xs font-mono text-indigo-300 overflow-x-auto whitespace-pre-wrap max-h-72">
                  {JSON.stringify(viewingAuditLog.details, null, 2)}
                </pre>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-850 flex justify-end">
              <button
                onClick={() => setViewingAuditLog(null)}
                className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 transition-colors rounded-lg text-sm font-semibold text-white"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
