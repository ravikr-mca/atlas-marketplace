# Atlas Marketplace — Design System

A minimal, documented token system built for the Greenstone interview take-home. It
follows the same discipline (token table + measured contrast ratios) used in the
candidate's own prior projects, but every value here is pulled from Greenstone's actual
brand — `gsequity.com` — rather than reused from those projects, since the goal is fit
with *their* stack (React/TypeScript/MUI) and *their* visual identity, not a copy-paste
of an unrelated palette.

## How the palette was sourced

Captured live from `gsequity.com` on 28 Sept 2026 via computed styles, not eyeballed from
a screenshot:
- `mainGreen` section background → `rgb(1, 70, 35)` = `#014623` (primary brand color)
- Hero overlay → `rgba(0, 37, 17, 0.9)` = `#002511`
- Footer → `#262626` background, `#DADADA` text
- Body text → `rgb(10, 10, 10)` = `#0A0A0A` on white
- Headings font: `Gelasio` (serif) — `getComputedStyle(h1).fontFamily`
- Body font: `Geist` (sans) — `getComputedStyle(body).fontFamily`

All tokens live in [`src/theme/tokens.ts`](src/theme/tokens.ts) and are wired into MUI via
[`src/theme/index.ts`](src/theme/index.ts) (`createTheme`). Nothing is hardcoded in
components — everything reads from the theme or the token file.

## Token table

| Token | Value | Use |
|---|---|---|
| `color.forest[700]` | `#014623` | Primary — buttons, links, active nav, key numbers |
| `color.forest[900]` | `#002511` | Primary dark variant — hover/pressed states |
| `color.forest[500]` | `#0B6B3A` | Lightened primary — hover on dark surfaces |
| `color.forest[100]` | `#E4EEE7` | Tint — selected rows, subtle chips |
| `color.ink[900]` | `#0A0A0A` | Primary text |
| `color.ink[700]` | `#3A3A3A` | Secondary text |
| `color.ink[500]` | `#6B6B6B` | Tertiary / disabled text |
| `color.neutral[0]` | `#FFFFFF` | Surfaces (cards, paper) |
| `color.neutral[50]` | `#FAFAF9` | App background |
| `color.neutral[200]` | `#E4E4E1` | Borders, dividers |
| `color.neutral.charcoal` | `#262626` | Footer / dark surfaces |
| `color.neutral.onCharcoal` | `#DADADA` | Text on charcoal |
| `color.semantic.success` | `#0B6B3A` | Allocated / funded states |
| `color.semantic.warning` | `#B8860B` | Under review / partial allocation |
| `color.semantic.danger` | `#B3261E` | Declined / withdrawn / errors |
| `color.semantic.info` | `#0B5FA5` | Informational notices |
| `font.display` | Gelasio | H1–H4, hero numbers |
| `font.body` | Geist | Body copy, buttons, tables, forms |

## Contrast (measured, WCAG 2.1)

| Pair | Ratio | Result |
|---|---|---|
| `#014623` primary on `#FFFFFF` | 11.7:1 | AAA (normal + large text) |
| `#0A0A0A` text on `#FAFAF9` background | 19.0:1 | AAA |
| `#DADADA` on `#262626` (footer) | 10.8:1 | AAA |

All primary text/surface pairs clear AA (4.5:1) with margin to spare for AAA. Any new
color added to the palette should be checked against this table before use — this is the
one rule worth keeping as the prototype grows.

## Why MUI theme tokens, not Tailwind/shadcn

The candidate's other projects (`herAviationEra`, `docwing`) use Tailwind v4 + shadcn/ui.
This project deliberately uses MUI's `createTheme`/`sx` system instead, because Greenstone's
actual stack is React + TypeScript + MUI — the goal is to show fluency in *their* system,
not to port an unrelated component library. Only the token *values* and the documentation
practice carry over.

## Secondary accent: sky blue

Added on top of the Greenstone-green foundation above, not a replacement — the primary
brand fidelity to `gsequity.com` stays intact everywhere. Sourced from converting the
exact OKLCH values in the candidate's own `herAviationEra` project's `.theme-sky` register
(`app/globals.css:167-231`, `oklch(0.51 0.2 262)` etc. — marked "the default" theme in
that codebase) to sRGB hex, not guessed:

| Token | Value | Use |
|---|---|---|
| `color.sky[700]` | `#033FB2` | Dark/hover — 8.91:1 on white, safe for text |
| `color.sky[600]` | `#1C5BD6` | Accent — 5.97:1 on white/paper (safe for text); only 2.76:1 on `forest[900]`, so accents/borders/chart-lines only on dark surfaces, never text there |
| `color.sky[200]` | `#C8D2FD` | Soft lavender, decorative |
| `color.sky[100]` | `#E4EDFE` | Pale wash background — 16.8:1 with `ink[900]` text on top |

**Semantic use, not decoration:** sky blue marks LP-initiated actions (the Indication-of-
Interest submit button, its card accent), distinct from the green used for GP/platform
actions elsewhere — the color carries meaning about *who* is acting, not just variety.

## Motion system

`framer-motion` only — not `gsap`/`lenis`, which would be over-engineering for a
data-dense business app with no scroll-driven storytelling need. `src/motion/`:

- `Reveal.tsx` — fade + directional translate on mount, ported from `herAviationEra`'s
  `components/motion/Reveal.tsx` pattern (ease-out-expo). Staggered via a `delay` prop.
- `AnimatedNumber.tsx` — count-up for financial figures (committed amount, IRR%,
  subscription %) so a live allocation update ticks visibly instead of snapping — the one
  addition that's literally "stock/chart" motion rather than decorative.
- `TiltCard.tsx` — subtle pointer-driven 3D tilt (±4°) on fund-vehicle cards, using the
  same spring constants (`stiffness:150, damping:18, mass:0.4`) as `herAviationEra`'s
  `components/motion/TiltCard.tsx`.
- Route transitions: a fade/slide wrap via `AnimatePresence` in `App.tsx`.
- The active nav link in `AppShell` uses a `layoutId`-based sliding pill (framer-motion's
  shared-layout animation) rather than a static underline.

**`prefers-reduced-motion` is checked in every primitive** (`usePrefersReducedMotion.ts`)
— non-negotiable, not a nice-to-have; each component renders its final state instantly
when the OS setting is on.

## Background texture

`ChartPatternBackground.tsx` — a fixed, full-page, low-opacity (5%) bar/line-chart pattern
mounted once in `AppShell`, not per-page. Deterministic (seeded, not `Math.random()`) so
it doesn't jump between renders. Placeholder built from the app's own tokens; swappable
for a generated image (see the image-generation prompt given alongside this redesign)
without touching any other component, since it's isolated to one file.

## Logo

`AtlasLogo.tsx` — three ascending bars in increasing height, reading as both an "A"
(Atlas) and a bar chart (the marketplace domain). The tallest bar carries the sky accent,
echoing the same green/sky split used for platform vs. LP actions elsewhere, so the mark
isn't an arbitrary glyph — it's built from the same semantic system as the rest of the UI.

## Components built on top of MUI

- `MuiButton` — border radius tightened to the token scale, label case left as-is (no
  uppercase — matches modern MUI/Greenstone tone).
- `MuiAppBar` — flattened (no shadow) with a hairline border, white surface, so the nav
  reads as part of the page rather than floating chrome.
- Data-dense views (fund-vehicle pipeline, investor lists) use **MUI X Data Grid**, not a
  hand-rolled table — sorting/filtering/virtualization for free, matches the JD's explicit
  MUI X Data Grid Pro experience ask.
