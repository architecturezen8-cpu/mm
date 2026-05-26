'use client';

import HomeTab from '@/components/tabs/HomeTab';
import { MatchInfo, PageName } from '@/lib/types';

interface HomePageProps {
  matchInfo: MatchInfo;
  onPageChange: (page: PageName) => void;
}

export default function HomePage({ matchInfo, onPageChange }: HomePageProps) {
  return <HomeTab matchInfo={matchInfo} onPageChange={onPageChange} />;
}
