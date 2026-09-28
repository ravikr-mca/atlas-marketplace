// Source of truth for Atlas Marketplace's design tokens.
// Colors and type families are pulled live from gsequity.com (Greenstone's real site),
// not invented — see DESIGN.md for how each value was captured and the contrast checks.

export const color = {
  forest: {
    900: '#002511', // darkest overlay tone used on their hero
    700: '#014623', // Greenstone's exact "mainGreen" — primary brand color
    500: '#0B6B3A', // lightened for hover/active states (derived, not on their site)
    100: '#E4EEE7', // tint for subtle surfaces (chips, selected rows)
  },
  ink: {
    900: '#0A0A0A', // their body text color
    700: '#3A3A3A',
    500: '#6B6B6B',
  },
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAF9',
    200: '#E4E4E1',
    charcoal: '#262626', // their footer background
    onCharcoal: '#DADADA', // their footer text
  },
  semantic: {
    success: '#0B6B3A',
    warning: '#B8860B',
    danger: '#B3261E',
    info: '#0B5FA5',
  },
} as const;

export const font = {
  display: '"Gelasio", "Gelasio Fallback", Georgia, serif', // headings — matches gsequity.com H1/H2
  body: '"Geist", "Geist Fallback", -apple-system, sans-serif', // body — matches gsequity.com
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
} as const;

export const spacing = 8; // MUI's default 8px baseline, kept explicit for the token doc
