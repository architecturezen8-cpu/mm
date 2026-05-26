'use client';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#020204]">
      {children}
    </div>
  );
}
