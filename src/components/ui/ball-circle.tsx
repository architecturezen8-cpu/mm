'use client';

import { motion } from 'framer-motion';

interface BallIndicatorProps {
  outcome: string;
  size?: 'sm' | 'lg';
  delay?: number;
  index?: number;
}

const outcomeStyles: Record<string, { bg: string; text: string; label: string }> = {
  '0': { bg: 'bg-gray-400/20', text: 'text-gray-500', label: '0' },
  '1': { bg: 'bg-blue-500/15', text: 'text-blue-400', label: '1' },
  '2': { bg: 'bg-blue-500/20', text: 'text-blue-300', label: '2' },
  '3': { bg: 'bg-blue-500/25', text: 'text-blue-200', label: '3' },
  '4': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: '4' },
  '6': { bg: 'bg-green-500/20', text: 'text-green-400', label: '6' },
  'W': { bg: 'bg-red-500/25', text: 'text-red-400', label: 'W' },
  'Wd': { bg: 'bg-gray-500/15', text: 'text-gray-400', label: 'Wd' },
  'Nb': { bg: 'bg-gray-500/15', text: 'text-gray-400', label: 'Nb' },
};

export default function BallIndicator({ outcome, size = 'lg', delay = 0, index = 0 }: BallIndicatorProps) {
  const style = outcomeStyles[outcome] || { bg: 'bg-gray-500/15', text: 'text-gray-400', label: outcome };
  const sizeClasses = size === 'sm' ? 'w-8 h-8 text-[9px]' : 'w-11 h-11 text-xs';

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 25,
        delay: delay + index * 0.05,
      }}
      className={`${sizeClasses} rounded-full ${style.bg} ${style.text} flex items-center justify-center font-bold border border-current/10`}
    >
      {style.label}
    </motion.div>
  );
}
