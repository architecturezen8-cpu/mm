'use client';

interface InningsToggleProps {
  activeInnings: 1 | 2;
  onChange: (innings: 1 | 2) => void;
  label1?: string;
  label2?: string;
}

export default function InningsToggle({ activeInnings, onChange, label1 = '1st Innings', label2 = '2nd Innings' }: InningsToggleProps) {
  return (
    <div className="flex rounded-md overflow-hidden border border-lux-border">
      <button
        onClick={() => onChange(1)}
        className={`px-3 sm:px-4 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-semibold uppercase tracking-[1px] sm:tracking-[2px] transition-all duration-200 ${
          activeInnings === 1
            ? 'bg-gold-ghost text-gold border-r border-gold-dim/20'
            : 'bg-lux-surface text-text-muted hover:text-text-secondary'
        }`}
      >
        {label1}
      </button>
      <button
        onClick={() => onChange(2)}
        className={`px-3 sm:px-4 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-semibold uppercase tracking-[1px] sm:tracking-[2px] transition-all duration-200 ${
          activeInnings === 2
            ? 'bg-gold-ghost text-gold'
            : 'bg-lux-surface text-text-muted hover:text-text-secondary'
        }`}
      >
        {label2}
      </button>
    </div>
  );
}
