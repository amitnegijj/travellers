# server

The Travelora API — a plain Node.js + Express app (`.js`, no TypeScript).
Owns the database and all business logic; `frontend` is the only consumer.

## Develop

This app is standalone — its own `package.json`, `node_modules` and lockfile,
installed and run from this folder. Nothing at the repo root builds or starts
it.

```bash
cd backend
npm install
cp .env.example .env  # DATABASE_URL, AUTH_SECRET, PORT, CLIENT_ORIGIN
npm run dev
```

Needs the same Postgres the old app used — `npm run db:up` from the repo root
(or your own `DATABASE_URL`).

Runs on http://localhost:4000. Uploaded photos are served from `/uploads` off
this same origin (`public/uploads/`, written to by `POST /api/v1/media`).

## Layout

- `src/routes/` — one Express router per resource, mounted under `/api/v1` in
  `src/app.js`. Paths match the old Next.js `app/api/v1/**/route.ts` files,
  plus a few new ones (see below).
- `src/services/` — the actual queries (`journeys.js`, `places.js`,
  `social.js`, `user-places.js`), ported straight from the old
  `apps/web/src/server/*.ts` — same SQL, same shapes, just without the types.
- `src/lib/` — `db.js` (pg pool), `auth.js` (session cookie + JWT), `http.js`
  (the `AppError` / `asyncHandler` / error-middleware plumbing that used to
  live in `lib/api.ts`), and `validation.js` (the Zod request schemas).
  `validation.js` is duplicated in `frontend/src/lib/` — the two apps
  install independently, so there is no shared package linking them. Change a
  rule in one and change it in the other.

## Routes added that didn't exist before

The old app was Server Components reading straight from Postgres while
rendering — pages that did this now need an endpoint to fetch from over HTTP:

- `GET /api/v1/auth/me` — who's signed in. Every page used to get this for
  free from the server-rendered layout.
- `GET /api/v1/trails` — the immersive feed's data (`listTrails`).
- `GET /api/v1/journeys/mine`, `GET /api/v1/journeys/:id/edit` — the
  "my trips" and composer-prefill reads, previously called as plain
  functions from inside the page.
- `GET /api/v1/home/rail`, `/home/stories`, `/home/destinations-strip`,
  `/home/community-strip` — the home page's side panels and strips, each one
  swapped for the query that used to sit inline in its component.
- `GET /api/v1/journeys/:id` now also returns `comments` and `authorFollow`,
  and `GET /api/v1/profiles/:handle/places` now also returns `reached`
  (journeys-implied places) — bundled together because that's what the
  single page that uses them needs in one round trip.

Everything else is a 1:1 port of an existing `/api/v1/*` route.
