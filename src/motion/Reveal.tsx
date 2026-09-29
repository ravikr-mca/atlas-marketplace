import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

const OFFSETS = {
  up: { y: 16 },
  down: { y: -16 },
  left: { x: 16 },
  right: { x: -16 },
} as const;

/**
 * Fade + directional-translate on mount, ported from herAviationEra's
 * components/motion/Reveal.tsx pattern (ease-out-expo, ~0.5s). Staggering a list is just
 * incrementing `delay` per item — see FundVehicleListPage for the usage.
 */
export function Reveal({
  children,
  direction = 'up',
  delay = 0,
}: {
  children: ReactNode;
  direction?: keyof typeof OFFSETS;
  delay?: number;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const offset = OFFSETS[direction];

  if (reducedMotion) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0, ...offset }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
