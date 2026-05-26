'use client';

import { useDndContext, DragEndEvent } from '@dnd-kit/core';

export function DragHandle({ id }: { id: string }) {
  return (
    <div className="cursor-grab active:cursor-grabbing text-[#4A4945] hover:text-[#8A8780] transition-colors p-1">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
        <circle cx="3" cy="2" r="1.2" />
        <circle cx="9" cy="2" r="1.2" />
        <circle cx="3" cy="6" r="1.2" />
        <circle cx="9" cy="6" r="1.2" />
        <circle cx="3" cy="10" r="1.2" />
        <circle cx="9" cy="10" r="1.2" />
      </svg>
    </div>
  );
}
