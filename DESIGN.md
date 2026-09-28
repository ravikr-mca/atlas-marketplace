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

## Components built on top of MUI

- `MuiButton` — border radius tightened to the token scale, label case left as-is (no
  uppercase — matches modern MUI/Greenstone tone).
- `MuiAppBar` — flattened (no shadow) with a hairline border, white surface, so the nav
  reads as part of the page rather than floating chrome.
- Data-dense views (fund-vehicle pipeline, investor lists) use **MUI X Data Grid**, not a
  hand-rolled table — sorting/filtering/virtualization for free, matches the JD's explicit
  MUI X Data Grid Pro experience ask.
