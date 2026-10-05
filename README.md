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

## Signing in (demo)

The login page offers one-click demo personas (investors, managers, Greenstone staff via a
mock Entra ID chooser). Credentials are mock and **DEMO ONLY**: persona e-mails use the
reserved `.test` domain and share one published demo password shown on the login screen.
Try *Omar Al Farsi* (verified investor), *Faisal Al Otaibi* (accreditation pending — every
blocked action explains why), *Elena Marsh* (verified manager), and *Layla Haddad* (admin,
approves organizations). "Reset demo data" in the account menu restores the seed.

## Project layout

- `src/theme/` — design tokens + MUI theme (see `DESIGN.md` for sourcing/contrast notes)
- `src/types/entities.ts` — core domain model (users, orgs, fund vehicles, indications…)
- `src/mock/` — seed data (`seed/`), mock auth server (`auth.ts`) and a permission-checked fake API
  (`api/`); allocation logic tested in `api.test.ts`, authorization in `authz.test.ts`
- `src/auth/` — the single permissions table used by both the UI and the API
- `src/domain/` — indication state machine and fund rules
- `src/features/` — routed feature areas (fund vehicles, dashboard)
- `proposal/` — source material for the written proposal, deck, and diagrams
