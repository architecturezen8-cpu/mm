'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRootPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        // Use custom session endpoint (reliable in Next.js 16 + Turbopack)
        const res = await fetch('/api/admin/session');
        if (res.ok) {
          const session = await res.json();
          if (session?.isAdmin || session?.user) {
            router.replace('/admin/dashboard');
            return;
          }
        }
      } catch {
        // Session check failed
      }
      // Not logged in — go to login page
      router.replace('/admin/login');
      setChecking(false);
    }
    checkSession();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#020204] flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-[#FFC300] border-t-transparent rounded-full animate-spin" />
        <span className="text-[#8A8780] text-sm">Redirecting...</span>
      </div>
    </div>
  );
}
