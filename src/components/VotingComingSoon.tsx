'use client';

interface VotingComingSoonProps {
  variant?: 'voting' | 'predictions';
}

export default function VotingComingSoon({ variant = 'voting' }: VotingComingSoonProps) {
  const title = variant === 'predictions' ? 'Predictions Await Match Day' : 'Voting Await Match Day';
  const subtitle = variant === 'predictions'
    ? 'Prediction polls are currently closed by the admin. Final voting cards will appear here when enabled.'
    : 'Voting is currently closed by the admin. Polls will appear here when voting is enabled.';

  return (
    <div className="relative overflow-hidden border border-gold/20 bg-[#08080c] p-5 sm:p-6">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 flex items-center justify-center border border-gold/25 bg-gold/10 text-gold shrink-0">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2L4 7v6c0 5.25 3.4 10.15 8 11.2C16.6 23.15 20 18.25 20 13V7l-8-5z" />
            <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gold uppercase tracking-[2px]">{title}</p>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">{subtitle}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="px-2.5 py-1 border border-lux-border text-[8px] uppercase tracking-[1.5px] text-text-secondary">No live polling load</span>
            <span className="px-2.5 py-1 border border-gold/20 text-[8px] uppercase tracking-[1.5px] text-gold/70">Admin controlled</span>
          </div>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
    </div>
  );
}
