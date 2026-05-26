'use client';

import { useAdminStore } from '@/lib/admin-store';

interface PublishStatusProps {
  status: 'published' | 'draft' | 'saving';
}

export default function PublishStatus({ status }: PublishStatusProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-sm border ${
      status === 'published'
        ? 'bg-green-500/10 text-green-400 border-green-500/30'
        : status === 'draft'
        ? 'bg-[#FFC300]/10 text-[#FFC300] border-[#FFC300]/30'
        : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        status === 'published' ? 'bg-green-400' : status === 'draft' ? 'bg-[#FFC300]' : 'bg-blue-400 animate-pulse'
      }`} />
      {status === 'saving' ? 'Saving...' : status === 'published' ? 'Published' : 'Draft'}
    </span>
  );
}
