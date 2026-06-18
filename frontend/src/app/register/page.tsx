'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-teal-400">
      <p className="text-xs">Redirecting to clinic homepage...</p>
    </div>
  );
}
