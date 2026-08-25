# Travelora — Social Travel Intelligence Platform

Phase 1. A social travel platform where journeys carry their real route, real costs,
and real road conditions — not just a photo and a caption.

Dark-first mobile surface, sidebar + right rail on desktop, photo-driven feed.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 ·
PostgreSQL 16 + PostGIS 3.4 · MapLibre GL · Zod

---

## Run it locally

Requires **Node 18+** and **Docker Desktop running**.

```bash
npm run setup     # installs deps, starts Postgres+PostGIS, migrates, seeds
npm run dev       # http://localhost:3000
```

That's it. `setup` is idempotent — safe to re-run.

**Demo login:** `arjun@example.com` / `password123` (also `priya@example.com`, `dev@example.com`)

### Ports

| Service | Port | Note |
|---|---|---|
| Web app | 3000 | |
| PostgreSQL | **5544** | 5432 and 5433 are taken by a native Postgres install on this machine |

---

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the app |
| `npm run build` | Production build |
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
apps/web/src/
  app/(app)/       pages — React Server Components by default
  app/(auth)/      login / signup
  app/api/v1/      the backend — mobile-compatible Route Handlers
  server/          use-cases — THE ONLY place writes happen
  components/      design system + feature components
  lib/             db pool, auth, validation, api envelope, utils
db/
  migrations/      forward-only SQL, applied in a transaction
  seed.mjs         Delhi NCR → Uttarakhand corridor
```

**Key rules**

- `app/` never touches the database directly — it goes through `server/`.
  That seam is what lets a domain be extracted later.
- **Mutations are Route Handlers, not Server Actions.** React Native cannot call
  Server Actions, so anything mobile will need is already an HTTP endpoint.
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
| pnpm + Turborepo | npm workspaces | pnpm not installed; fewer moving parts on Windows |

---

## Known limits (Phase 1, local-only)

- **Media is written to `public/uploads/`.** Fine for local dev; needs object
  storage + signed URLs before any deploy. The `media` table already stores a
  plain URL, so this is a one-file change.
- **Map tiles are CARTO raster basemaps** (OpenStreetMap data), no API key
  needed, light and dark variants that follow the theme. Set
  `NEXT_PUBLIC_MAP_STYLE_URL` to a vector style (MapTiler, Protomaps) to override.
- **MapLibre's worker is served from `public/maplibre/`.** The worker its bundle
  spawns does not start under Turbopack, which silently breaks every GeoJSON
  source (route lines vanish while raster tiles and markers still render).
  `npm run sync:map-worker` copies it from `node_modules`; `postinstall` runs it.
- **Seed photos are remote Unsplash URLs**, so the seeded feed needs internet to
  look right. Cards fall back to a gradient when an image fails. User uploads are
  local and work offline.
- **No rate limiting yet.** Planned for Phase 2 as a Postgres-backed counter.
- **`AUTH_SECRET` in `.env.local` is a dev placeholder.** Rotate before deploying.
- **Distances and durations are user-entered**, not computed by a routing API.
  The `route_cache` strategy is designed but not built.
- No RLS — authorization is enforced in the use-case layer. Reinstate RLS as the
  security floor if you ever let clients talk to Postgres directly.

---

## Not in Phase 1 (by design)

Trips, AI planner, Remix, Passport, communities, notifications, messaging,
travel updates, moderation queue, 3D globe, mobile app.
