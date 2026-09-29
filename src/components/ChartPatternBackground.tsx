import { Box } from '@mui/material';
import { color } from '../theme/tokens';
import barChartImage from '../assets/bar-chart-background.png';

/**
 * Full-page, low-opacity line-chart/bar-chart texture. Fixed behind all content (mounted
 * once in AppShell) so it reads as the page's background, not a per-section decoration.
 * Purely decorative: aria-hidden, opacity capped low so it never competes with text
 * contrast. Image is the user's own generated asset (src/assets/bar-chart-background.png)
 * — already pale/fading toward its top edge, anchored to the bottom of the viewport here
 * so its densest part sits low on the page, out of the way of headings.
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
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${barChartImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'bottom center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.5,
        }}
      />
      {/* Safety fade at the very top/bottom edges so headings and footer content always
          sit on clean space, regardless of how the source image is cropped at odd
          viewport sizes. */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, ${color.neutral[50]} 0%, transparent 22%, transparent 85%, ${color.neutral[50]} 100%)`,
        }}
      />
    </Box>
  );
}
