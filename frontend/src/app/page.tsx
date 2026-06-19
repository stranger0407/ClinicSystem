'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Award,
  Check,
  User,
  ChevronRight,
  Lock,
  Key,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Loader,
  Star,
  BookOpen,
  HelpCircle,
  Sparkles,
  MessageSquare,
  DollarSign,
  ArrowRightLeft
} from 'lucide-react';

export default function PublicClinicLanding() {
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // State definitions
  const [clinic, setClinic] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Booking Modal States
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1); // 1: Select Doc & Date, 2: Info & Submit, 3: Confirmation
  
  // Booking Form State
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingType, setBookingType] = useState<'SLOT' | 'WALK_IN'>('SLOT');
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [notes, setNotes] = useState('');

  // Patient Info Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('MALE');
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState('');

  // Slots State
  const [slots, setSlots] = useState<any[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [bookingSuccessData, setBookingSuccessData] = useState<any | null>(null);
  const [bookingError, setBookingError] = useState('');

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Load clinic & doctors
  const loadPublicData = async () => {
    setLoading(true);
    try {
      const clinicRes = await fetch(`${BASE_URL}/public/clinic`);
      if (!clinicRes.ok) throw new Error('Failed to load clinic details');
      const clinicData = await clinicRes.json();
      setClinic(clinicData);

      const doctorsRes = await fetch(`${BASE_URL}/public/doctors`);
      if (!doctorsRes.ok) throw new Error('Failed to load doctors list');
      const doctorsData = await doctorsRes.json();
      setDoctors(doctorsData);

      if (doctorsData.length > 0) {
        setSelectedDoctorId(doctorsData[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to connect to clinic service');
      // Fallbacks for offline seed rendering
      setClinic({
        name: 'Apollo Family Clinic',
        address: '102, Residency Road, Bangalore, Karnataka',
        phone: '080-45678901',
        settings: {
          whatsapp: '9876543210',
          timings: 'Mon - Sat: 9:00 AM - 5:00 PM (Sunday closed)',
          facilities: ['General Medicine', 'Paediatric Checkups', 'Cardiology Consultations', 'Pharmacy Store', 'Diagnostics']
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPublicData();
  }, []);

  // Fetch slots when doctor or date changes
  const fetchAvailableSlots = async () => {
    if (!selectedDoctorId || !bookingDate) {
      setSlots([]);
      return;
    }
    setSlotsLoading(true);
    setSelectedSlot(null);
    try {
      const res = await fetch(`${BASE_URL}/public/doctor/${selectedDoctorId}/slots?date=${bookingDate}`);
      if (!res.ok) throw new Error('Failed to fetch slots');
      const data = await res.json();
      setSlots(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableSlots();
  }, [selectedDoctorId, bookingDate]);

  // Prevent background body scrolling when modal is open
  useEffect(() => {
    if (bookingModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [bookingModalOpen]);

  const handleOpenBooking = (doctorId?: string, packageName?: string) => {
    if (doctorId) {
      setSelectedDoctorId(doctorId);
    } else if (doctors.length > 0) {
      setSelectedDoctorId(doctors[0].id);
    }
    setBookingModalOpen(true);
    setBookingStep(1);
    setBookingError('');
    setBookingSuccessData(null);
    if (packageName) {
      setNotes(`Interested in checkup package: ${packageName}`);
    }
  };

  const handleCloseBooking = () => {
    setBookingModalOpen(false);
    setBookingStep(1);
    setSelectedSlot(null);
    setNotes('');
    setFirstName('');
    setLastName('');
    setPhone('');
    setEmail('');
    setDob('');
    setGender('MALE');
    setCreateAccount(false);
    setPassword('');
    setBookingSuccessData(null);
  };

  const handleNextStep = () => {
    if (slots.length === 0) {
      setBookingError('Doctor is not available on this date. Booking is disabled.');
      return;
    }
    if (bookingType === 'SLOT' && !selectedSlot) {
      setBookingError('Please choose a preferred time slot to continue');
      return;
    }
    setBookingError('');
    setBookingStep(2);
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingInProgress(true);
    setBookingError('');

    if (slots.length === 0) {
      setBookingError('Doctor is not available on this date. Booking is disabled.');
      setBookingInProgress(false);
      return;
    }

    if (!firstName || !lastName || !phone || !dob || !gender) {
      setBookingError('Please fill out all required personal fields.');
      setBookingInProgress(false);
      return;
    }

    try {
      const payload = {
        doctorId: selectedDoctorId,
        type: bookingType,
        startTime: bookingType === 'SLOT' ? selectedSlot.startTime : undefined,
        notes,
        firstName,
        lastName,
        phone,
        email: email || undefined,
        dob,
        gender,
        createAccount,
        password: createAccount ? password : undefined,
      };

      const res = await fetch(`${BASE_URL}/public/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Booking encountered an error.');
      }

      const data = await res.json();
      setBookingSuccessData(data);
      setBookingStep(3);
    } catch (err: any) {
      setBookingError(err.message || 'Failed to complete booking. Please try again.');
    } finally {
      setBookingInProgress(false);
    }
  };

  // Helper selectors
  const activeDoctor = doctors.find(d => d.id === selectedDoctorId);

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

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col selection:bg-teal-500 selection:text-slate-900 font-sans font-medium">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/10">
            <Activity className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight block leading-none">
              {clinic?.name || 'Apollo Clinic'}
            </span>
            <span className="text-[9px] text-teal-400 font-bold tracking-widest uppercase block mt-0.5">
              Care & Comfort
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-6">
          <a href="#services" className="text-xs font-bold text-slate-400 hover:text-teal-400 transition-colors uppercase tracking-wider">Services</a>
          <a href="#why-choose-us" className="text-xs font-bold text-slate-400 hover:text-teal-400 transition-colors uppercase tracking-wider">Why Us</a>
          <a href="#packages" className="text-xs font-bold text-slate-400 hover:text-teal-400 transition-colors uppercase tracking-wider">Checkups</a>
          <a href="#doctor" className="text-xs font-bold text-slate-400 hover:text-teal-400 transition-colors uppercase tracking-wider">Our Doctor</a>
          <a href="#reviews" className="text-xs font-bold text-slate-400 hover:text-teal-400 transition-colors uppercase tracking-wider">Reviews</a>
          <a href="#faqs" className="text-xs font-bold text-slate-400 hover:text-teal-400 transition-colors uppercase tracking-wider">FAQs</a>
        </nav>

        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Access Portal
          </Link>
          <button
            onClick={() => handleOpenBooking()}
            className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-teal-955/20 active:scale-95 cursor-pointer"
          >
            Book Appointment
          </button>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center space-x-2 bg-teal-500/10 border border-teal-500/25 rounded-full px-4 py-1.5 text-teal-400 text-xs font-bold shadow-md shadow-teal-950/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>★ 4.9/5 Rating (5,000+ Happy Patients)</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            Exceptional Care. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-emerald-400">
              For Your Whole Family.
            </span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl leading-relaxed font-normal">
            Welcome to {clinic?.name || 'Apollo Family Clinic'}. We offer highly experienced consultations, advanced cardiology care, and comprehensive lab diagnostics. Sync your prescriptions and check queue times via our smart Patient Portal.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 max-w-lg mx-auto lg:mx-0">
            <div className="flex items-center space-x-2 bg-slate-900/50 border border-slate-850 rounded-xl p-3">
              <Check className="w-4 h-4 text-teal-400" />
              <span className="text-[11px] text-slate-300 font-semibold">In-house Pharmacy</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-900/50 border border-slate-850 rounded-xl p-3">
              <Check className="w-4 h-4 text-teal-400" />
              <span className="text-[11px] text-slate-300 font-semibold">Live Queue Sync</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-900/50 border border-slate-850 rounded-xl p-3">
              <Check className="w-4 h-4 text-teal-400" />
              <span className="text-[11px] text-slate-300 font-semibold">Digital Reports</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
            <button
              onClick={() => handleOpenBooking()}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-teal-500/10 flex items-center justify-center space-x-2 group active:scale-[0.98] cursor-pointer"
            >
              <span>Schedule Appointment</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <Link
              href="/register-patient"
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-850 text-slate-200 font-bold rounded-xl transition-all text-center text-sm shadow-inner active:scale-[0.98]"
            >
              Claim Patient Portal
            </Link>
          </div>
        </div>

        {/* Clinic Overview Dashboard Mock Card (Right side) */}
        <div className="flex-1 w-full max-w-md">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl relative group overflow-hidden">
            <div className="absolute -top-3 -right-3 w-20 h-20 bg-teal-500/10 rounded-full blur-2xl animate-pulse"></div>
            
            <div className="flex items-between justify-between mb-6 border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-teal-400" />
                <h3 className="font-extrabold text-sm text-white">Accredited Health Center</h3>
              </div>
              <span className="text-[9px] bg-teal-500/10 border border-teal-500/20 text-teal-400 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                NABH Standards
              </span>
            </div>

            <div className="space-y-4">
              {/* Timing */}
              <div className="bg-slate-950/60 border border-slate-850/60 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider block">OPD Hours</span>
                  <span className="text-xs text-white font-bold">{clinic?.settings?.timings || 'Mon - Sat: 9:00 AM - 5:00 PM'}</span>
                </div>
                <Clock className="w-4.5 h-4.5 text-teal-400 shrink-0" />
              </div>

              {/* Quick stats grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950/60 border border-slate-850/60 rounded-xl p-3 text-center">
                  <span className="text-lg font-black text-teal-400 block">15+</span>
                  <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider block">Years Exp</span>
                </div>
                <div className="bg-slate-950/60 border border-slate-850/60 rounded-xl p-3 text-center">
                  <span className="text-lg font-black text-indigo-400 block">10k+</span>
                  <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider block">Patients</span>
                </div>
                <div className="bg-slate-950/60 border border-slate-850/60 rounded-xl p-3 text-center">
                  <span className="text-lg font-black text-emerald-400 block">99.2%</span>
                  <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider block">Rating</span>
                </div>
              </div>

              {/* Service tags list */}
              <div className="space-y-2 pt-2">
                <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider block pl-1">In-House Facilities</span>
                <div className="flex flex-wrap gap-2">
                  {['General Medicine', 'Cardiology Desk', 'Diagnostics Lab', 'Pharmacy Store', 'Immunizations'].map((item, idx) => (
                    <span key={idx} className="bg-slate-950 text-slate-400 text-[10px] font-bold px-3 py-1 rounded-lg border border-slate-850 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                      <span>{item}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clinic Specialties & Services */}
      <section id="services" className="py-20 bg-slate-950/40 border-t border-slate-900 px-6 relative">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs text-teal-400 font-bold uppercase tracking-widest">Our Expertise</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">Specialized Clinical Care</h2>
            <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
              Apollo Clinic offers dedicated primary care, internal medicine, and expert cardiovascular profiling for all age groups.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-850 rounded-2xl p-6 space-y-4 hover:border-slate-800 transition-all group">
              <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-white">Cardiology Consultations</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-normal">
                Electrocardiography (ECG), blood pressure mapping, lipids profiling, chronic disease preventative screening, and cardiac risk checks.
              </p>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-850 rounded-2xl p-6 space-y-4 hover:border-slate-800 transition-all group">
              <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                <User className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-white">General Medicine & OPD</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-normal">
                Comprehensive primary care, seasonal infections, respiratory ailments, diabetes management, and geriatric physical consultations.
              </p>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-850 rounded-2xl p-6 space-y-4 hover:border-slate-800 transition-all group">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-white">Diagnostics & Vitals</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-normal">
                On-site blood sugar checks, blood pressure monitoring, oxygen saturation readings, and immediate cloud portal prescription reports sync.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section id="why-choose-us" className="py-20 bg-slate-950 border-t border-slate-900 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs text-teal-400 font-bold uppercase tracking-widest">Clinic Highlights</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">Why Patients Trust Apollo Clinic</h2>
            <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
              We leverage modern equipment, seasoned practitioners, and integrated portal software to maximize patient comfort.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900/30 border border-slate-850 hover:border-slate-800 rounded-2xl p-5 space-y-3.5 transition-all">
              <div className="w-9 h-9 bg-teal-500/10 rounded-lg flex items-center justify-center text-teal-400">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-white">Experienced Physicians</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Consult with certified specialists boasting prestigious backgrounds (such as AIIMS residency training) and extensive clinical practice.
              </p>
            </div>

            <div className="bg-slate-900/30 border border-slate-850 hover:border-slate-800 rounded-2xl p-5 space-y-3.5 transition-all">
              <div className="w-9 h-9 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400">
                <Activity className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-white">On-site Lab & Pharmacy</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Avoid extra travels. Complete your blood work, diagnostics, and pick up your prescribed medicines directly from our clinic billing counter.
              </p>
            </div>

            <div className="bg-slate-900/30 border border-slate-850 hover:border-slate-800 rounded-2xl p-5 space-y-3.5 transition-all">
              <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-white">Smart Queue Tracker</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Never wait blindly. View real-time lobby queue placement, active consultation number, and expected times directly from your phone.
              </p>
            </div>

            <div className="bg-slate-900/30 border border-slate-850 hover:border-slate-800 rounded-2xl p-5 space-y-3.5 transition-all">
              <div className="w-9 h-9 bg-rose-500/10 rounded-lg flex items-center justify-center text-rose-400">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-white">Unified Health Portal</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Sign in securely with your mobile number to view and download chronological clinical notes, prescriptions list, and invoice files.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Wellness & Diagnostics Packages */}
      <section id="packages" className="py-20 bg-slate-950/40 border-t border-slate-900 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs text-teal-400 font-bold uppercase tracking-widest">Preventive Care</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">Health Screening Packages</h2>
            <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
              Book customized screening panels directly. Prevention and early profiling ensure long-term health and wellness.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Package 1 */}
            <div className="bg-slate-900/40 border border-slate-850 hover:border-slate-800 rounded-3xl p-6 flex flex-col justify-between transition-all group relative">
              <div className="space-y-4">
                <span className="text-[9px] text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded font-black uppercase tracking-wider inline-block">
                  Essential Screen
                </span>
                <h3 className="text-lg font-black text-white">Basic Health Profile</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-normal">
                  Ideal for routine annual checkups and basic vitals evaluation.
                </p>
                <div className="pt-2 border-t border-slate-850/80">
                  <span className="text-2xl font-black text-white">₹999</span>
                  <span className="text-[10px] text-slate-500 ml-1.5">All-inclusive fee</span>
                </div>
                <ul className="space-y-2.5 pt-3 text-[11px] text-slate-350">
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>Complete Blood Count (CBC)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>Random Blood Sugar (RBS)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>Vitals (BP, SpO2, Pulse)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>General Practitioner Review</span>
                  </li>
                </ul>
              </div>
              <div className="pt-6">
                <button
                  onClick={() => handleOpenBooking(undefined, 'Basic Health Profile (₹999)')}
                  className="w-full py-2.5 bg-slate-800 hover:bg-teal-650 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1"
                >
                  <span>Book Package</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Package 2 */}
            <div className="bg-slate-900/50 border border-teal-500/20 hover:border-teal-500/40 rounded-3xl p-6 flex flex-col justify-between transition-all group relative shadow-xl shadow-teal-955/5">
              <div className="absolute top-4 right-4">
                <span className="text-[8px] bg-gradient-to-r from-teal-500 to-emerald-600 text-white px-2 py-0.5 rounded font-black uppercase tracking-wider">
                  Popular
                </span>
              </div>
              <div className="space-y-4">
                <span className="text-[9px] text-teal-450 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded font-black uppercase tracking-wider inline-block">
                  Cardiac Health
                </span>
                <h3 className="text-lg font-black text-white">Cardiovascular Wellness</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-normal">
                  Designed for cardiovascular screening, lipid checks, and hypertension management.
                </p>
                <div className="pt-2 border-t border-slate-850/80">
                  <span className="text-2xl font-black text-teal-400">₹1,999</span>
                  <span className="text-[10px] text-slate-500 ml-1.5">All-inclusive fee</span>
                </div>
                <ul className="space-y-2.5 pt-3 text-[11px] text-slate-350">
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span className="font-bold text-slate-200">12-Lead Electrocardiogram (ECG)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>Complete Lipid Profile (Cholesterol)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>Cardiology Vitals & BP Mapping</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span className="font-bold text-slate-200">Specialist Cardiology Consultation</span>
                  </li>
                </ul>
              </div>
              <div className="pt-6">
                <button
                  onClick={() => handleOpenBooking(undefined, 'Cardiovascular Wellness Package (₹1999)')}
                  className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1 shadow-md shadow-teal-950/20"
                >
                  <span>Book Package</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Package 3 */}
            <div className="bg-slate-900/40 border border-slate-850 hover:border-slate-800 rounded-3xl p-6 flex flex-col justify-between transition-all group relative">
              <div className="space-y-4">
                <span className="text-[9px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded font-black uppercase tracking-wider inline-block">
                  Metabolic Profile
                </span>
                <h3 className="text-lg font-black text-white">Comprehensive Wellness</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-normal">
                  In-depth evaluation of key metabolic, kidney, liver, and thyroid vitals.
                </p>
                <div className="pt-2 border-t border-slate-850/80">
                  <span className="text-2xl font-black text-white">₹2,999</span>
                  <span className="text-[10px] text-slate-500 ml-1.5">All-inclusive fee</span>
                </div>
                <ul className="space-y-2.5 pt-3 text-[11px] text-slate-350">
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>Complete Hemogram & Urine Analysis</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>Liver Function Tests (LFT)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>Kidney Function Tests (KFT)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span className="font-bold text-slate-200">Thyroid Profile (T3, T4, TSH)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>Physician Consultation Review</span>
                  </li>
                </ul>
              </div>
              <div className="pt-6">
                <button
                  onClick={() => handleOpenBooking(undefined, 'Comprehensive Wellness Package (₹2999)')}
                  className="w-full py-2.5 bg-slate-800 hover:bg-teal-655 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1"
                >
                  <span>Book Package</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Medical Panel & Biography Section */}
      <section id="doctor" className="py-20 bg-slate-950/60 border-t border-slate-900 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs text-teal-400 font-bold uppercase tracking-widest">Medical Panel</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">Consult Our Specialists</h2>
            <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
              Book timed consultation slots or register as a walk-in directly with our experienced medical professionals.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Doctor Card list column */}
            <div className="lg:col-span-1 flex flex-col justify-between">
              {doctors.map((doc) => (
                <div key={doc.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all rounded-3xl p-6 shadow-md flex flex-col justify-between h-full group">
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-teal-500/10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform text-teal-400">
                      <User className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg text-white">Dr. {doc.user.firstName} {doc.user.lastName}</h3>
                      <p className="text-xs text-teal-400 font-semibold">{doc.specialty}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between text-xs text-slate-400">
                      <span>License No:</span>
                      <span className="text-slate-200 font-mono font-medium">{doc.licenseNo}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Consultation Fee:</span>
                      <span className="text-teal-400 font-bold">₹{parseFloat(doc.fees).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      onClick={() => handleOpenBooking(doc.id)}
                      className="w-full py-2.5 bg-slate-800 hover:bg-teal-600 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1"
                    >
                      <span>Check Availability</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Achievements & Timeline details column */}
            <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-sm border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                {/* Profile Bio Details */}
                <div className="space-y-5 text-left">
                  <div className="space-y-2">
                    <span className="text-[10px] text-indigo-450 font-black uppercase tracking-wider block">Clinical Profile</span>
                    <h3 className="text-lg font-black text-white">Expert Clinical Leadership</h3>
                    <p className="text-slate-400 text-xs leading-relaxed font-normal">
                      Dr. Ramesh Patel brings over 15 years of dedicated experience in non-invasive cardiology and internal medicine. Having served at leading research institutes and cardiac critical centers, he now provides comprehensive primary and cardiovascular care in a personalized single-physician workspace.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] text-indigo-450 font-black uppercase tracking-wider block">Specializations & Interests</span>
                    <div className="flex flex-wrap gap-1.5">
                      {['Preventive Cardiology', 'Hypertension & Lipidology', 'Chronic Care', 'Geriatric Care'].map((interest, idx) => (
                        <span key={idx} className="bg-slate-950 border border-slate-850 text-slate-400 text-[9px] font-medium px-2.5 py-0.5 rounded">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-4 text-left">
                  <span className="text-[10px] text-indigo-450 font-black uppercase tracking-wider block">Professional Timeline</span>
                  <div className="space-y-3 border-l border-slate-800 pl-4 ml-1">
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-teal-400 border border-slate-950" />
                      <span className="text-[9px] text-teal-400 font-bold block">2018 - Present</span>
                      <span className="text-xs text-white font-bold block leading-tight">Founder & Chief Consultant</span>
                      <span className="text-[10px] text-slate-500 block font-normal">Apollo Family Clinic & Cardiac Center</span>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-slate-700 border border-slate-950" />
                      <span className="text-[9px] text-slate-500 font-bold block">2012 - 2018</span>
                      <span className="text-xs text-white font-bold block leading-tight">Senior Consultant - Cardiology</span>
                      <span className="text-[10px] text-slate-500 block font-normal">Metro Heart and Vascular Institute</span>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-slate-700 border border-slate-950" />
                      <span className="text-[9px] text-slate-500 font-bold block">2008 - 2012</span>
                      <span className="text-xs text-white font-bold block leading-tight">Residency & Clinical Fellow</span>
                      <span className="text-[10px] text-slate-500 block font-normal">All India Institute of Medical Sciences (AIIMS)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Achievements Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
                <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-3 text-center flex flex-col justify-center">
                  <span className="text-xl font-black text-teal-400 block">15+</span>
                  <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider block">Years Exp</span>
                </div>
                <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-3 text-center flex flex-col justify-center">
                  <span className="text-xl font-black text-indigo-400 block">10k+</span>
                  <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider block">Patients</span>
                </div>
                <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-3 text-center flex flex-col justify-center">
                  <span className="text-xl font-black text-emerald-400 block">15+</span>
                  <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider block">Papers</span>
                </div>
                <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-3 text-center flex flex-col justify-center">
                  <span className="text-xl font-black text-rose-400 block">99.2%</span>
                  <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider block">Rating</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Patient Testimonials Section */}
      <section id="reviews" className="py-20 bg-slate-950/40 border-t border-slate-900 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs text-teal-400 font-bold uppercase tracking-widest">Patient Stories</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Reviews & Feedback</h2>
            <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
              Read stories from patients who experienced our clinical care, scheduling transparency, and portal records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                text: "Dr. Ramesh Patel takes the time to listen. I never feel rushed, and the digital portal makes tracking my BP readings and daily prescriptions super easy.",
                name: "Rajesh K.",
                desc: "Cardiology Patient"
              },
              {
                text: "Having direct access to Dr. Ramesh Patel makes a huge difference. He is highly knowledgeable and his AIIMS background shows in his clinical accuracy.",
                name: "Sunita S.",
                desc: "Hypertension Patient"
              },
              {
                text: "The clinic's digital queue system is a lifesaver. I registered as a walk-in, tracked the queue order on my phone, and was consulted within 15 minutes.",
                name: "Amit M.",
                desc: "General Medicine Patient"
              }
            ].map((review, idx) => (
              <div key={idx} className="bg-slate-900/50 border border-slate-850 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-800 transition-colors">
                <p className="text-xs text-slate-400 leading-relaxed font-normal italic">
                  "{review.text}"
                </p>
                <div className="pt-4 mt-4 border-t border-slate-850/60 flex items-center space-x-3">
                  <div className="w-8 h-8 bg-teal-500/10 rounded-full flex items-center justify-center text-teal-400 font-extrabold text-xs">
                    {review.name[0]}
                  </div>
                  <div>
                    <span className="text-xs text-white font-bold block">{review.name}</span>
                    <span className="text-[10px] text-slate-500 block font-normal">{review.desc}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (FAQ) Section */}
      <section id="faqs" className="py-20 bg-slate-950 border-t border-slate-900 px-6">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs text-teal-400 font-bold uppercase tracking-widest">Patient Help Desk</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Frequently Asked Questions</h2>
            <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
              Find instant answers to common questions about clinic processes, schedules, and patient portal access.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Do I need to schedule an appointment in advance?",
                a: "No, we support both pre-booked slots and walk-ins. You can pre-book a slot online, or register directly at the clinic. Walk-ins are placed in today's active live queue and consulted in order."
              },
              {
                q: "How can I access my prescription history and reports?",
                a: "Once consulted, you can claim your patient portal profile by registering with your phone number. Under the Patient Dashboard, you will find chronological clinical remarks, medicines list, and receipts."
              },
              {
                q: "What is the consultation fee and accepted payment modes?",
                a: "Our standard consultation fee is ₹500.00. We accept Cash, UPI (GPay/PhonePe), and all major Credit/Debit Cards directly at the billing desk."
              },
              {
                q: "Can I cancel or reschedule my scheduled appointment?",
                a: "Yes. Simply sign in to the Patient Portal using your registered mobile number and password, navigate to the 'My Appointments' tab, and click Reschedule next to your booking."
              }
            ].map((faq, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all text-left">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-sm text-white hover:bg-slate-850/50 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronRight className={`w-4 h-4 text-teal-400 transition-transform ${openFaqIndex === idx ? 'rotate-90' : ''}`} />
                </button>
                {openFaqIndex === idx && (
                  <div className="px-6 pb-5 text-xs text-slate-400 leading-relaxed font-normal border-t border-slate-850 pt-3 animate-fadeIn duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location / Timings Footer Section */}
      <section className="py-16 bg-slate-950 border-t border-slate-900 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div className="space-y-4">
            <h4 className="font-bold text-base text-white">Clinic Address</h4>
            <div className="flex items-start justify-center md:justify-start space-x-3 text-sm text-slate-400">
              <MapPin className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
              <span>{clinic?.address || '102, Residency Road, Bangalore, Karnataka'}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-base text-white">Call / Contact Details</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-center md:justify-start space-x-3 text-sm text-slate-400">
                <Phone className="w-4.5 h-4.5 text-teal-400" />
                <span>{clinic?.phone || '080-45678901'}</span>
              </div>
              {clinic?.settings?.whatsapp && (
                <div className="flex items-center justify-center md:justify-start space-x-3 text-sm text-slate-400">
                  <MessageSquare className="w-4.5 h-4.5 text-teal-400" />
                  <span>WhatsApp: {clinic.settings.whatsapp}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-base text-white">Unified Access</h4>
            <div className="flex flex-col space-y-2 items-center md:items-start text-sm">
              <Link href="/login" className="text-teal-400 hover:text-teal-300 transition-colors">
                Patient Portal Sign In
              </Link>
              <Link href="/register-patient" className="text-teal-400 hover:text-teal-300 transition-colors">
                Patient Portal Registration
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer copyright */}
      <footer className="py-6 border-t border-slate-900 text-center text-xs text-slate-500 bg-slate-950">
        <p>© {new Date().getFullYear()} {clinic?.name || 'Apollo Clinic'}. All rights reserved.</p>
      </footer>

      {/* ==================== APPOINTMENT BOOKING MODAL ==================== */}
      {bookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto custom-scrollbar">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
            
            {/* Close button */}
            <button
              type="button"
              onClick={handleCloseBooking}
              className="absolute top-4 right-4 p-1.5 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 rounded-full text-slate-400 transition-all z-10"
            >
              <XIcon className="w-4 h-4" />
            </button>

            {/* Step-by-Step Progress Indicator */}
            <div className="flex items-center justify-between px-6 py-5 bg-slate-950/40 border-b border-slate-800/80">
              <div className="flex items-center space-x-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                  bookingStep === 1 
                    ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20' 
                    : bookingStep > 1 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {bookingStep > 1 ? '✓' : '1'}
                </span>
                <span className={`text-xs font-bold ${bookingStep === 1 ? 'text-teal-400' : 'text-slate-400'}`}>Schedule</span>
              </div>
              <div className="flex-1 h-[2px] bg-slate-800 mx-3">
                <div className={`h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300 ${
                  bookingStep === 1 ? 'w-0' : bookingStep === 2 ? 'w-1/2' : 'w-full'
                }`} />
              </div>
              <div className="flex items-center space-x-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                  bookingStep === 2 
                    ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20' 
                    : bookingStep > 2 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {bookingStep > 2 ? '✓' : '2'}
                </span>
                <span className={`text-xs font-bold ${bookingStep === 2 ? 'text-teal-400' : 'text-slate-400'}`}>Information</span>
              </div>
              <div className="flex-1 h-[2px] bg-slate-800 mx-3">
                <div className={`h-full bg-emerald-500 transition-all duration-300 ${
                  bookingStep < 3 ? 'w-0' : 'w-full'
                }`} />
              </div>
              <div className="flex items-center space-x-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                  bookingStep === 3 
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' 
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  3
                </span>
                <span className={`text-xs font-bold ${bookingStep === 3 ? 'text-emerald-400' : 'text-slate-400'}`}>Confirmed</span>
              </div>
            </div>

            {/* Modal Error Alert */}
            {bookingError && (
              <div className="m-4 mx-6 flex items-start space-x-2.5 bg-red-950/45 border border-red-800 rounded-xl p-3 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{bookingError}</span>
              </div>
            )}

            {/* Step 1: Doctor/Date/Slot Setup */}
            {bookingStep === 1 && (
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {/* Visual Doctor details card */}
                {activeDoctor && (
                  <div className="bg-slate-950/50 border border-slate-850 rounded-2xl p-4 flex items-center justify-between shadow-inner">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-500/10 to-indigo-500/10 border border-teal-500/20 rounded-xl flex items-center justify-center text-teal-400 font-bold text-base shadow-sm">
                        {activeDoctor.user.firstName[0]}{activeDoctor.user.lastName[0]}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white leading-tight">Dr. {activeDoctor.user.firstName} {activeDoctor.user.lastName}</h4>
                        <p className="text-xs text-teal-400 font-medium">{activeDoctor.specialty}</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">License: {activeDoctor.licenseNo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Fee</span>
                      <span className="text-sm font-black text-emerald-400">₹{parseFloat(activeDoctor.fees).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Doctor Selection Dropdown */}
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Select Practitioner</label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-3 py-2.5 text-xs text-white transition-all cursor-pointer hover:border-slate-750"
                  >
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>
                        Dr. {d.user.firstName} {d.user.lastName} ({d.specialty})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Horizontal Date Swiper */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Choose Appointment Date</label>
                  <div className="flex space-x-2 overflow-x-auto pb-2 pt-0.5 custom-scrollbar">
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
                              ? 'bg-teal-500 border-teal-500 text-slate-950 font-bold shadow-lg shadow-teal-500/20'
                              : 'bg-slate-950 border-slate-850 hover:border-slate-750 text-slate-300'
                          }`}
                        >
                          <span className={`text-[9px] font-bold uppercase ${isSelected ? 'text-slate-950/80' : 'text-slate-500'}`}>{dayName}</span>
                          <span className="text-sm font-black leading-tight my-0.5">{dayNum}</span>
                          <span className={`text-[8px] font-medium ${isSelected ? 'text-slate-950/80' : 'text-slate-400'}`}>{monthName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                               {/* Slots display */}
                {slotsLoading ? (
                  <div className="text-center py-6 text-slate-505 text-xs">
                    <Loader className="w-5 h-5 animate-spin mx-auto text-teal-400 mb-1" />
                    Calculating available clinic slots...
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-red-500/30 bg-red-950/20 rounded-2xl text-red-400 text-xs p-4 space-y-1">
                    <p className="font-bold">Doctor is not available on this date.</p>
                    <p className="text-[10px] text-slate-400">
                      The doctor is not working or has blocked off this date. Walk-in and slot bookings are disabled today.
                    </p>
                  </div>
                ) : (
                  <>
                    {bookingType === 'SLOT' ? (
                      <div className="space-y-3 pt-1">
                        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Available Time Slots
                        </label>
                        <div className="space-y-3">
                          {/* Morning Section */}
                          {morningSlots.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[9px] text-teal-400 font-bold uppercase tracking-wider flex items-center space-x-1">
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
                                        ? 'bg-slate-950/40 text-slate-700 border-slate-950/50 cursor-not-allowed line-through'
                                        : selectedSlot?.time === s.time
                                        ? 'bg-teal-500 border-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                                        : 'bg-slate-950 text-slate-300 border-slate-850 hover:border-slate-750'
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
                              <span className="text-[9px] text-teal-400 font-bold uppercase tracking-wider flex items-center space-x-1">
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
                                        ? 'bg-slate-950/40 text-slate-700 border-slate-950/50 cursor-not-allowed line-through'
                                        : selectedSlot?.time === s.time
                                        ? 'bg-teal-500 border-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                                        : 'bg-slate-950 text-slate-300 border-slate-850 hover:border-slate-750'
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
                              className="text-[11px] text-slate-500 hover:text-teal-400 transition-colors"
                            >
                              Prefer booking a walk-in queue ticket? Switch to Walk-in
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Walk-in Booking Active */
                      <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4.5 text-xs text-slate-400 space-y-2.5 shadow-inner">
                        <div className="flex items-center space-x-2 text-teal-400">
                          <ArrowRightLeft className="w-4 h-4 shrink-0" />
                          <span className="font-bold text-slate-200">Walk-in Queue Mode Active</span>
                        </div>
                        <div className="space-y-1 pl-5 border-l border-slate-805">
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
                            className="text-xs text-teal-400 hover:text-teal-300 font-semibold underline underline-offset-4"
                          >
                            Prefer slot scheduling? Switch to Time Slots
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Notes Input */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Symptoms / Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Short description of symptoms (e.g. fever, headache, routine checkup)"
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 transition-all resize-none hover:border-slate-750"
                  />
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-teal-950/20 transition-all"
                  >
                    <span>Patient Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Patient Registration Info */}
            {bookingStep === 2 && (
              <form onSubmit={handleBookSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">First Name *</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First Name"
                      className="w-full bg-slate-950 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-700 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last Name"
                      className="w-full bg-slate-950 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-700 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit number"
                      className="w-full bg-slate-950 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-700 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Email (Optional)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-slate-950 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-700 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Date of Birth *</label>
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      onClick={(e) => (e.target as any).showPicker?.()}
                      style={{ colorScheme: 'dark' }}
                      className="w-full bg-slate-950 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-white transition-all cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gender *</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-white cursor-pointer transition-all"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                {/* Create patient account option (premium sliding toggle) */}
                <div className="border-t border-slate-800/85 pt-4 space-y-3">
                  <div className="flex items-center justify-between bg-slate-950/40 border border-slate-850/60 rounded-2xl p-4 shadow-sm">
                    <div className="flex-1 pr-4">
                      <h5 className="text-xs font-bold text-slate-200">Create Patient Portal Account</h5>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                        Access prescription records, past clinical receipts, and reschedule your booking online anytime.
                      </p>
                    </div>
                    {/* Sliding Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => setCreateAccount(!createAccount)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        createAccount ? 'bg-teal-500' : 'bg-slate-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          createAccount ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {createAccount && (
                    <div className="space-y-1.5 animate-fadeIn duration-200">
                      <label className="block text-[10px] text-teal-400 font-bold uppercase tracking-wider">Portal Password *</label>
                      <input
                        type="password"
                        required={createAccount}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter a secure password"
                        className="w-full bg-slate-950 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-700 transition-all"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex space-x-3">
                  <button
                    type="submit"
                    disabled={bookingInProgress}
                    className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-teal-955/20 transition-all"
                  >
                    {bookingInProgress ? (
                      <>
                        <Loader className="w-3.5 h-3.5 animate-spin" />
                        <span>Reserving Appointment...</span>
                      </>
                    ) : (
                      <span>Confirm & Schedule</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingStep(1)}
                    className="px-5 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl text-xs transition-colors"
                  >
                    Back
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Success Confirmation */}
            {bookingStep === 3 && bookingSuccessData && (
              <div className="p-8 text-center space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/5">
                  <CheckCircle className="w-9 h-9" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-white">Appointment Confirmed!</h3>
                  <p className="text-slate-400 text-xs max-w-xs mx-auto leading-normal">
                    Your medical consultation has been successfully booked. A confirmation detail card is rendered below.
                  </p>
                </div>

                {/* Receipt details */}
                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 text-left text-xs space-y-3.5 max-w-sm mx-auto shadow-inner relative overflow-hidden">
                  {/* Decorative vertical badge border */}
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-teal-500 to-emerald-500" />
                  
                  <div className="flex justify-between border-b border-slate-900 pb-2.5 pl-2">
                    <span className="text-slate-500 font-medium">Doctor</span>
                    <span className="text-white font-bold">
                      Dr. {activeDoctor?.user.firstName} {activeDoctor?.user.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-2.5 pl-2">
                    <span className="text-slate-500 font-medium">Patient</span>
                    <span className="text-white font-bold">
                      {bookingSuccessData.patientProfile.firstName} {bookingSuccessData.patientProfile.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-2.5 pl-2">
                    <span className="text-slate-500 font-medium">Appointment Date</span>
                    <span className="text-white font-bold">{new Date(bookingDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                  </div>
                  <div className="flex justify-between pl-2">
                    <span className="text-slate-500 font-medium">Scheduling / Mode</span>
                    <span className="text-teal-400 font-extrabold">
                      {bookingSuccessData.appointment.type === 'SLOT' 
                        ? selectedSlot?.time 
                        : `Walk-in (Queue #${bookingSuccessData.appointment.queueNumber})`
                      }
                    </span>
                  </div>
                </div>

                {createAccount && (
                  <div className="bg-teal-500/5 border border-teal-500/10 rounded-xl p-3.5 text-[11px] text-slate-400 max-w-sm mx-auto leading-normal">
                    🔒 Portal Profile Created! Log in at the <span className="font-semibold text-teal-400">Patient Portal</span> using mobile <span className="font-semibold text-slate-200">{phone}</span> to view prescriptions.
                  </div>
                )}

                <div className="pt-4 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={handleCloseBooking}
                    className="w-full py-3 bg-slate-850 hover:bg-slate-800 text-slate-200 font-bold rounded-xl text-xs transition-all border border-slate-800"
                  >
                    Close & Finish
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Small helper icon component
function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
};
