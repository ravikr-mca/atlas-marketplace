import { useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

/**
 * Count-up for financial figures — committed amount, IRR%, subscription % — the one
 * motion addition that's literally "stock/chart" flavored rather than decorative, ported
 * conceptually from herAviationEra's components/motion/AnimatedCounter.tsx. Animates from
 * whatever it last showed to the new `value`, so a live allocation update ticks visibly
 * instead of just snapping.
 */
export function AnimatedNumber({
  value,
  format = (n) => Math.round(n).toLocaleString(),
  duration = 1.1,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const [display, setDisplay] = useState(() => format(reducedMotion ? value : 0));
  const prevValue = useRef(reducedMotion ? value : 0);

  useEffect(() => {
    if (reducedMotion) {
      setDisplay(format(value));
      prevValue.current = value;
      return;
    }
    const controls = animate(prevValue.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(format(latest)),
    });
    prevValue.current = value;
    return () => controls.stop();
  }, [value, reducedMotion, duration]);

  return <span>{display}</span>;
}
