'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StaffDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/doctor');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-teal-400">
      <p className="text-xs">Redirecting to doctor's workspace...</p>
    </div>
  );
}
