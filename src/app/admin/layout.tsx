'use client';

import { SessionProvider } from 'next-auth/react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-[#020204]">
        {children}
      </div>
    </SessionProvider>
  );
}
