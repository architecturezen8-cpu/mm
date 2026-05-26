'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Redirect old /admin/dashboard/pages/[pageId] to new /admin/dashboard/[slug]
export default function OldPageEditorRedirect() {
  const params = useParams();
  const router = useRouter();
  const pageId = params.pageId as string;

  useEffect(() => {
    // Redirect to new admin edit route
    router.replace(`/admin/dashboard/${pageId}`);
  }, [pageId, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#020204]">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-[#FFC300] border-t-transparent rounded-full animate-spin" />
        <span className="text-[#8A8780] text-sm">Redirecting...</span>
      </div>
    </div>
  );
}
