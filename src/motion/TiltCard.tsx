import { type ReactNode, type PointerEvent as ReactPointerEvent } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

// Same spring constants herAviationEra's components/motion/TiltCard.tsx uses for its
// pointer-driven 3D tilt — a deliberately subtle amount here (±4deg) since this is a
// dense business app, not a marketing page; the point is a premium hover "weight," not a
// showy effect.
const SPRING = { stiffness: 150, damping: 18, mass: 0.4 };
const MAX_TILT_DEG = 4;

export function TiltCard({ children }: { children: ReactNode }) {
  const reducedMotion = usePrefersReducedMotion();
  const rotateXRaw = useMotionValue(0);
  const rotateYRaw = useMotionValue(0);
  const rotateX = useSpring(rotateXRaw, SPRING);
  const rotateY = useSpring(rotateYRaw, SPRING);
  // Subtle specular highlight that follows the pointer, reinforcing the tilt as a
  // physical surface rather than a flat card that happens to rotate.
  const glowX = useTransform(rotateY, [-MAX_TILT_DEG, MAX_TILT_DEG], [0, 100]);

  if (reducedMotion) return <>{children}</>;

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateYRaw.set(px * MAX_TILT_DEG * 2);
    rotateXRaw.set(-py * MAX_TILT_DEG * 2);
  };

  const handlePointerLeave = () => {
    rotateXRaw.set(0);
    rotateYRaw.set(0);
  };

  return (
    <motion.div
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{ rotateX, rotateY, transformPerspective: 1000, position: 'relative' }}
    >
      {children}
      <motion.div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          borderRadius: 'inherit',
          background: useTransform(glowX, (x) => `radial-gradient(320px circle at ${x}% 0%, rgba(255,255,255,0.10), transparent 60%)`),
        }}
      />
    </motion.div>
  );
}
