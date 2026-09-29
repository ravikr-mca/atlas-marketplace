import { color } from '../theme/tokens';

/**
 * Three ascending bars: reads as both an "A" (Atlas) and a bar chart (marketplace,
 * capital raises) — ties the wordmark to the domain instead of being an arbitrary glyph.
 * The tallest bar carries the sky accent, echoing the same green/sky split used
 * everywhere else in the app (platform/GP actions vs. LP actions).
 */
export function AtlasLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect x="4" y="18" width="6" height="10" rx="1.5" fill={color.forest[500]} />
      <rect x="13" y="11" width="6" height="17" rx="1.5" fill={color.forest[700]} />
      <rect x="22" y="4" width="6" height="24" rx="1.5" fill={color.sky[600]} />
    </svg>
  );
}
