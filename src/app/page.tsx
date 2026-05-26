'use client';

import ClientLayout from '@/components/ClientLayout';
import { useMatchData } from '@/lib/MatchDataContext';
import HomeTab from '@/components/tabs/HomeTab';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import FanPageView from '@/components/fancard/FanPageView';
import type { School, BgColor } from '@/components/fancard/types';

/* ── Home Page Content ── */
function HomeContent() {
  const { matchInfo, liveState, innings1, innings2 } = useMatchData();
  const searchParams = useSearchParams();
  const fanName = searchParams.get('fan');

  // If fan query param exists, show fan page instead
  if (fanName) {
    const fanSchool = searchParams.get('school');
    const fanBatch = searchParams.get('batch');
    const fanBg = searchParams.get('bg');
    const validSchools: School[] = ['stc', 'gsc'];
    const validBgs: BgColor[] = ['golden', 'blue', 'red'];

    return (
      <FanPageView
        name={fanName}
        school={validSchools.includes(fanSchool as School) ? (fanSchool as School) : 'stc'}
        batch={fanBatch || ''}
        bgColor={validBgs.includes(fanBg as BgColor) ? (fanBg as BgColor) : 'golden'}
      />
    );
  }

  return <HomeTab matchInfo={matchInfo} liveState={liveState} innings1={innings1} innings2={innings2} />;
}

/* ── Page wrapper ── */
export default function HomePage() {
  return (
    <ClientLayout>
      <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-gold border-t-transparent animate-spin" /></div>}>
        <HomeContent />
      </Suspense>
    </ClientLayout>
  );
}
