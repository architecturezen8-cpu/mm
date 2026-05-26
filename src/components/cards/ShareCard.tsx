'use client';

import Card from '@/components/ui/lux-card';
import { MessageCircle, Twitter, Facebook, Link2 } from 'lucide-react';

export default function ShareCard() {
  const buttons = [
    { icon: MessageCircle, label: 'WhatsApp' },
    { icon: Twitter, label: 'X' },
    { icon: Facebook, label: 'Facebook' },
    { icon: Link2, label: 'Copy' },
  ];

  return (
    <Card delay={0.15}>
      <div className="card-title">
        <span className="icon">◇</span>
        Share Match
      </div>
      <div className="flex gap-2 sm:gap-3 justify-center">
        {buttons.map((btn) => {
          const Icon = btn.icon;
          return (
            <button
              key={btn.label}
              className="w-10 h-10 sm:w-11 sm:h-11 bg-lux-surface border border-lux-border hover:border-gold-dim hover:bg-gold-ghost flex items-center justify-center text-text-muted hover:text-gold transition-all duration-300"
              title={btn.label}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          );
        })}
      </div>
    </Card>
  );
}
