# Travelora — Social Travel Intelligence Platform

Phase 1. A social travel platform where journeys carry their real route, real costs,
and real road conditions — not just a photo and a caption.

Dark-first mobile surface, sidebar + right rail on desktop, photo-driven feed.

**Stack:** React 19 (Vite SPA, plain `.jsx`) · Node.js + Express (plain `.js`) ·
PostgreSQL 16 + PostGIS 3.4 · MapLibre GL · Zod

A React front end (`frontend`) talking over HTTP to a separate Express API
(`backend`) — split out from an earlier Next.js App Router version. That
version is kept at `apps/web` for reference; see [Architecture](#architecture).

---

## Run it locally
for the travleers app

Requires **Node 18+** and **Docker Desktop running**.

`frontend`, `backend` and `apps/web` are fully standalone — each has its
own `package.json`, its own `node_modules`, and its own lockfile. Nothing at
the repo root installs or runs them; there's no workspace tool linking them
together. Install and run each one from inside its own folder.

```bash
npm run setup                        # root only: starts Postgres+PostGIS, migrates, seeds
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

cd backend && npm install && npm run dev   # API on http://localhost:4000
cd frontend && npm install && npm run dev   # app on http://localhost:5173, in another terminal
```

`setup` is idempotent — safe to re-run. It only installs the root's own
(small) dependency set, used by the `db:*` scripts below — it does **not**
install `frontend` or `backend`'s dependencies.

**Demo login:** `arjun@example.com` / `password123` (also `priya@example.com`, `dev@example.com`)

### Ports

| Service | Port | Note |
|---|---|---|
| Client (Vite) | 5173 | the app |
| API (Express) | 4000 | `frontend`'s `VITE_API_URL` must match |
| PostgreSQL | **5544** | 5432 and 5433 are taken by a native Postgres install on this machine |
| Web app (legacy) | 3000 | `cd apps/web && npm install && npm run dev` — the earlier Next.js version, kept for reference |

---

## Commands

Run these from inside the relevant app folder (`frontend`, `backend`, `apps/web`):

| Command | What it does |
|---|---|
| `npm run dev` | Start that app's dev server |
| `npm run build` | Production build (`frontend` and `apps/web` only) |
| `npm start` | Run the production build (`backend` and `apps/web`) |

From the repo root:

| Command | What it does |
|---|---|
| `npm run db:up` / `db:down` | Start / stop the database container |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed` | Reset and reseed content (destroys journeys/users) |
| `npm run db:reset` | Nuke the volume and rebuild from scratch |
| `npm run db:psql` | Open a psql shell |

---

## What Phase 1 ships

| Feature | Status |
|---|---|
| Email/password auth, JWT httpOnly cookie session | ✅ |
| User profiles, editing, avatars, privacy flag | ✅ |
| App shell — desktop nav + mobile tab bar | ✅ |
| Design system — tokens, primitives, light/dark | ✅ |
| Destinations (16 seeded) with cost intelligence strip | ✅ |
| Places (20 seeded) with categories | ✅ |
| Map — MapLibre, pins, route lines, provider-abstracted | ✅ |
| Journeys — feed, cursor pagination, search | ✅ |
| Journey creation — progressive completion composer | ✅ |
| Journey detail — route, stops, expense breakdown, tips | ✅ |
| Media upload — client-side downscale before upload | ✅ |
| Expenses — integer minor units, trigger-maintained totals | ✅ |
| Follow / Like / Comment / Save — optimistic, trigger counters | ✅ |
| Personal travel map — pin places, upload photo, per-pin privacy | ✅ |

### Personal travel map

Every profile carries a map of that traveller's places. Owners click the map to
drop a pin, add a name, note, date and photo, and choose **public** or
**private** per pin — private pins are visible only to the owner and never leave
the server for anyone else. Pins default to private. Destinations reached via
published journeys are shown too (grey), so the map isn't empty on day one.

Enforcement lives in `server/user-places.ts`: every read takes an explicit
`viewerId` and private rows are filtered in SQL, not in the UI.

### Design

Built to match the supplied Travelora mockups: dark-first mobile with a bottom
tab bar, desktop sidebar + right rail, stories-style category rail, photo-dominant
journey cards with overlaid stats, tabbed journey detail (Overview / Itinerary /
Map / Expenses / Tips), SVG donut expense breakdown, numbered stop timeline,
4-step create wizard, and a Travel DNA panel on profiles.

Palette: blue `--brand` for primary actions, green `--create` for create CTAs,
violet `--ai`. Light and dark are both fully defined; the viewer's system setting
decides, and `data-theme` overrides it.

**Phase 2 features from the mockups are NOT built** — AI Trip Planner, Remix,
Travel Passport, Communities, Messages, Notifications, Nearby Travellers and
Travel Updates appear in the sidebar under "Coming in Phase 2" and are inert.
Nothing fakes a working backend.

Every screen has loading, empty, and error states. Every interactive element has
focus states. `prefers-reduced-motion` is honoured.

---

## Architecture

```
frontend/src/          Vite + React 19 SPA (plain .jsx)
  pages/               one component per route
  components/          feature components; components/ui/ holds the primitives
  layouts/             AppLayout (shell + rail), AuthLayout (login/signup)
  context/             SessionContext — who's signed in, fetched once on boot
  hooks/               useApi, useDocumentTitle
  api/                 client.js plus one module per resource — the only
                       place a URL is built or a request is made
  constants/           endpoints, client routes, category lists
  utils/               cn, money, distance/duration, dates
  validation/          Zod schemas — kept in sync by hand with the backend copy
backend/src/           Express API (plain .js), strictly layered
  routes/              endpoint definitions only, wired to controllers
  controllers/         request/response handling — no business logic
  services/            business rules — no SQL, no req/res
  repositories/        every SQL statement; nothing else touches the database
  middleware/          auth, validation, uploads, error handling, 404
  validators/          Zod request schemas, one module per resource
  config/              env loading, the pg pool, policy constants
  utils/               AppError, asyncHandler, response, cursor, password, token
db/
  migrations/          forward-only SQL, applied in a transaction
  seed.mjs             Delhi NCR → Uttarakhand corridor
apps/web/              the original Next.js App Router version — untouched,
                       fully standalone (own package.json/node_modules),
                       kept as a fallback / reference
```

`apps/web` was the original shape of this app: Next.js Server Components
reading straight from Postgres while rendering, with `/api/v1/*` Route
Handlers for mutations. `frontend` + `backend` is the same product
split into a plain React front end and a plain Node/Express API — every page
that used to query the database directly now fetches from an endpoint
instead (see `backend/README.md` for exactly which routes are new versus
ported 1:1).

**Key rules**

- The backend flows strictly route → controller → service → repository → db,
  and back up. No layer skips another: a controller never queries the
  database, and a service never sees `req` or `res`.
- Only `repositories/` writes SQL. That seam is what let the backend be
  extracted into its own app in the first place, and it's what would let the
  storage change without touching a business rule.
- Components never call `fetch`. Everything goes through `src/api/`.
- **Money is always integer minor units + a currency code.** Never a float.
- **Routes are stored simplified.** Full-fidelity GPS tracks belong in object
  storage, not in a feed query.
- **Publishing snapshots to `journey_versions`.** Editing a published journey
  never destroys what was published.

### Deliberate deviations from the Phase 0 plan

| Plan said | Built | Why |
|---|---|---|
| Supabase (auth, DB, storage) | Postgres in Docker + custom JWT auth + local disk | Requested |
| Counters in the use-case layer | Postgres triggers | Atomic and far less code at this scale |
| pnpm + Turborepo | Standalone app folders, no workspace tool | pnpm not installed; each app installs and runs fully independently |
| Next.js App Router (Server Components) | React SPA (Vite) + Express API | Requested — see `apps/web/` for the original |

---

## Known limits (Phase 1, local-only)

- **Media is written to `backend/public/uploads/`**, served from the API
  origin. Fine for local dev; needs object storage + signed URLs before any
  deploy. The `media` table already stores a plain URL, so this is a
  one-file change (`backend/src/routes/media.js`).
- **Map tiles are CARTO raster basemaps** (OpenStreetMap data), no API key
  needed, light and dark variants that follow the theme. Set
  `VITE_MAP_STYLE_URL` (in `frontend/.env`) to a vector style (MapTiler,
  Protomaps) to override.
- **MapLibre's worker is served from each app's own `public/maplibre/`.**
  `npm run sync:map-worker` copies it from that app's own `node_modules` via
  `require.resolve`; `postinstall` runs it automatically on every install.
- **Seed photos are remote Unsplash URLs**, so the seeded feed needs internet to
  look right. Cards fall back to a gradient when an image fails. User uploads are
  local and work offline.
- **No rate limiting yet.** Planned for Phase 2 as a Postgres-backed counter.
- **`AUTH_SECRET` in `backend/.env` is a dev placeholder.** Rotate before deploying.
- **Distances and durations are user-entered**, not computed by a routing API.
  The `route_cache` strategy is designed but not built.
- No RLS — authorization is enforced in the use-case layer. Reinstate RLS as the
  security floor if you ever let clients talk to Postgres directly.

---

## Not in Phase 1 (by design)

Trips, AI planner, Remix, Passport, communities, notifications, messaging,
travel updates, moderation queue, 3D globe, mobile app.

