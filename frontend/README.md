# client

The Travelora front end — a Vite + React 19 single-page app (plain `.jsx`, no
TypeScript). Talks to `backend`'s Express API over `fetch`; there is no
server rendering here.

## Develop

This app is standalone — its own `package.json`, `node_modules` and lockfile,
installed and run from this folder. Nothing at the repo root builds or starts
it.

```bash
cd frontend
npm install
cp .env.example .env # points VITE_API_URL at the local API
npm run dev
```

Runs on http://localhost:5173. The API is expected on http://localhost:4000
(`backend`) — start that first, in its own terminal.

## Layout

- `src/pages/` — one component per route (`HomePage`, `JourneyDetailPage`, …)
- `src/components/` — feature components, flat and PascalCase
  (`JourneyCard.jsx`, `TrailFeed.jsx`, `MapCanvas.jsx`, …)
- `src/components/ui/` — the design-system primitives (`Button`, `Card`,
  `Badge`, …). Import them from `components/ui`, not from the files directly.
- `src/layouts/` — `AppLayout` (the shell + rail) and `AuthLayout` (the
  login/signup split screen), matching the old `(app)` and `(auth)` route groups
- `src/context/SessionContext.jsx` — who's signed in; fetched once from
  `GET /api/v1/auth/me` on boot, since there's no server render to read the
  cookie for us
- `src/api/` — `client.js` is the fetch wrapper; one module per resource
  (`journeyApi.js`, `profileApi.js`, …) sits on top of it. **Components never
  call `fetch` and never build a URL** — paths live in `constants/endpoints.js`.
- `src/constants/` — API endpoints, client route paths, shared category lists
- `src/utils/` — `cn`, money formatting, distance/duration, date helpers
- `src/validation/schemas.js` — the Zod form schemas, duplicated in
  `backend/src/validators/` since the two apps install independently and share
  no package. Change a rule in one and change it in the other.
- `src/hooks/useApi.js` — small fetch-on-mount hook standing in for what
  Server Components used to do for free

## What changed from the Next.js version

This app used to be `apps/web`, a Next.js App Router app where pages were
Server Components that queried Postgres directly. Splitting the backend out
into a separate Express API means every one of those pages now fetches over
HTTP instead — see `backend/src/repositories/homeRepository.js` for the small aggregate
endpoints that replaced a few async server components (`home-rail.tsx`,
`stories-rail.tsx`, and two inline components in the old home page) that had
no HTTP endpoint to call before.

`apps/web` is left in the repo, untouched, as a reference — it still runs on
its own (`cd apps/web && npm install && npm run dev`) if you want to compare
behaviour.
