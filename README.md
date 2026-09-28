# Atlas Marketplace

A concept and coded prototype for **Atlas Marketplace** — the take-home interview task
for the Senior Frontend Engineer role at Greenstone.

**Category:** a private-markets placement marketplace. Fund managers (GPs) list fund
vehicles raising capital; investors (LPs — family offices, sovereign wealth funds,
institutions, UHNWIs) discover, diligence, submit indications of interest, get allocated,
and close. See [`proposal/concept.md`](proposal/concept.md) for the full narrative and
[`DESIGN.md`](DESIGN.md) for the design system.

## Stack

React + TypeScript + Vite, MUI (`createTheme` themed to Greenstone's real brand), MUI X
Data Grid, Recharts, Tiptap, Redux Toolkit (client/session state) + TanStack Query
(server state), React Router.

## Running locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run test     # Vitest — state-machine / allocation logic
npm run build    # typecheck + production build
```

## Project layout

- `src/theme/` — design tokens + MUI theme (see `DESIGN.md` for sourcing/contrast notes)
- `src/types/entities.ts` — core domain model (users, orgs, fund vehicles, indications…)
- `src/mock/` — mock data + a small fake API layer (server-authoritative allocation logic
  lives in `api.ts`, tested in `api.test.ts`)
- `src/features/` — routed feature areas (fund vehicles, dashboard)
- `proposal/` — source material for the written proposal, deck, and diagrams
