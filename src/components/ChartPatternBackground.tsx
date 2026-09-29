import { Box } from '@mui/material';
import { color } from '../theme/tokens';

// A wide, denser bar/line pattern than the first pass — meant to read as "the whole page
// sits on a chart," not a small corner decoration. Deterministic (no Math.random) so it's
// stable across renders/SSR and doesn't visually jump on re-mount.
const BARS = Array.from({ length: 28 }, (_, i) => {
  const seed = Math.sin(i * 12.9898) * 43758.5453;
  const frac = seed - Math.floor(seed);
  const height = 60 + frac * 260;
  return { x: i * 58 + 20, height };
});

const LINE_POINTS = BARS.map((b, i) => `${b.x + 24},${900 - b.height - 30 + (i % 3) * 14}`).join(' ');

/**
 * Full-page, low-opacity line-chart/candlestick texture. Fixed behind all content
 * (mounted once in AppShell) so it reads as the page's background, not a per-section
 * decoration. Purely decorative: aria-hidden, opacity capped low so it never competes
 * with text contrast. Swap the <svg> for an <img> once a richer generated version exists.
 */
export function ChartPatternBackground() {
  return (
    <Box
      aria-hidden
      sx={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
        bgcolor: 'background.default',
      }}
    >
      <svg
        viewBox="0 0 1680 900"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.05 }}
      >
        {BARS.map((b, i) => (
          <rect
            key={b.x}
            x={b.x}
            y={900 - b.height - 30}
            width={30}
            height={b.height}
            rx={4}
            fill={i % 4 === 0 ? color.sky[600] : color.forest[700]}
          />
        ))}
        <polyline points={LINE_POINTS} fill="none" stroke={color.forest[900]} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {/* Fades the pattern out toward the top so page titles always sit on clean space,
          and toward the bottom edge so it never reads as a hard-edged banner. */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, ${color.neutral[50]} 0%, transparent 18%, transparent 72%, ${color.neutral[50]} 100%)`,
        }}
      />
    </Box>
  );
}
