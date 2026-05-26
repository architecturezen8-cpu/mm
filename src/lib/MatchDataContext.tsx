'use client';

import { createContext, useContext, ReactNode } from 'react';
import { MatchInfo, InningsData, LiveState, CommunityData, MomentumPoint } from './types';
import { EMPTY_MATCH_INFO } from './constants';
import { useMatchLiveData, DataSource } from '@/hooks/useMatchLiveData';

interface MatchDataContextType {
  matchInfo: MatchInfo;
  innings1: InningsData;
  innings2: InningsData;
  liveState: LiveState;
  community: CommunityData;
  momentum: MomentumPoint[];
  castVote: (team: string) => void;
  isLoading: boolean;
  dataSource: DataSource;
  lastUpdated: Date | null;
  pollCount: number;
}

const MatchDataContext = createContext<MatchDataContextType | null>(null);

export function MatchDataProvider({ children }: { children: ReactNode }) {
  const matchId = process.env.NEXT_PUBLIC_MATCH_ID || 'match_001';

  const {
    liveState,
    matchInfo,
    innings1,
    innings2,
    community,
    momentum,
    castVote,
    isLoading,
    dataSource,
    lastUpdated,
    pollCount,
  } = useMatchLiveData(matchId);

  return (
    <MatchDataContext.Provider
      value={{
        matchInfo: matchInfo || EMPTY_MATCH_INFO,
        innings1: innings1,
        innings2: innings2,
        liveState: liveState,
        community: community,
        momentum: momentum,
        castVote,
        isLoading,
        dataSource,
        lastUpdated,
        pollCount,
      }}
    >
      {children}
    </MatchDataContext.Provider>
  );
}

export function useMatchData() {
  const context = useContext(MatchDataContext);
  if (!context) {
    throw new Error('useMatchData must be used within a MatchDataProvider');
  }
  return context;
}
