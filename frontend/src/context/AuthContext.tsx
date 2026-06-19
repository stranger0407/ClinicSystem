'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email?: string;
  phone?: string;
  role: 'OWNER' | 'DOCTOR' | 'STAFF' | 'PATIENT';
  firstName: string;
  lastName: string;
  profileId?: string;
}

interface Clinic {
  id: string;
  name: string;
  subdomain: string;
}

interface AuthContextType {
  user: User | null;
  clinic: Clinic | null;
  loading: boolean;
  login: (token: string, user: User, clinicId: string, clinicName: string, subdomain: string) => void;
  logout: () => void;
  setClinicContext: (clinicId: string, clinicName: string, subdomain: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Load session from localStorage on mount
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const clinicId = localStorage.getItem('clinicId');
    const clinicName = localStorage.getItem('clinicName');
    const subdomain = localStorage.getItem('subdomain');

    if (token && savedUser && clinicId) {
      setUser(JSON.parse(savedUser));
      setClinic({
        id: clinicId,
        name: clinicName || 'Clinic',
        subdomain: subdomain || '',
      });
    }
    setLoading(false);
  }, []);

  const login = (token: string, userData: User, clinicId: string, clinicName: string, subdomain: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('clinicId', clinicId);
    localStorage.setItem('clinicName', clinicName);
    localStorage.setItem('subdomain', subdomain);

    setUser(userData);
    setClinic({
      id: clinicId,
      name: clinicName,
      subdomain,
    });

    // Role-based redirect
    if (userData.role === 'OWNER' || userData.role === 'DOCTOR' || userData.role === 'STAFF') {
      router.push('/dashboard/doctor');
    } else {
      router.push('/dashboard/patient');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('clinicId');
    localStorage.removeItem('clinicName');
    localStorage.removeItem('subdomain');
    setUser(null);
    setClinic(null);
    router.push('/login');
  };

  const setClinicContext = (clinicId: string, clinicName: string, subdomain: string) => {
    localStorage.setItem('clinicId', clinicId);
    localStorage.setItem('clinicName', clinicName);
    localStorage.setItem('subdomain', subdomain);
    setClinic({
      id: clinicId,
      name: clinicName,
      subdomain,
    });
  };

  return (
    <AuthContext.Provider value={{ user, clinic, loading, login, logout, setClinicContext }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
