'use client';

import { useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  decimals?: number;
  duration?: number;
}

export default function AnimatedCounter({ value, decimals = 0, duration = 0.6 }: AnimatedCounterProps) {
  const [display, setDisplay] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current === value) return;

    const controls = animate(prevValue.current, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => {
        setDisplay(Number(v.toFixed(decimals)));
      },
    });

    prevValue.current = value;
    return () => controls.stop();
  }, [value, decimals, duration]);

  return <>{display.toFixed(decimals)}</>;
}
