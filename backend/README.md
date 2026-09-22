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

Strictly layered. A request flows **route → controller → service → repository
→ db**, and back up. No layer skips another.

- `src/routes/` — endpoint definitions only. One file per resource, all
  mounted under `/api/v1` by `routes/index.js`. A route names a path, attaches
  validation, and points at a controller — nothing else.
- `src/controllers/` — request and response handling: read params, call a
  service, send the result. No business logic, and never a database call.
- `src/services/` — the business rules. Who may edit what, how a route line is
  derived, how complete a draft is. No SQL, and no `req`/`res`.
- `src/repositories/` — every SQL statement in the application. Nothing
  outside this folder imports `config/database.js`. Grouped per aggregate, so
  `journeyRepository.js` owns the journey row *and* its stops, expenses, tips
  and media links, since they're written in one transaction.
- `src/middleware/` — `authenticate.js` (session cookie → `req.user`),
  `validate.js` (Zod), `upload.js` (multer), `errorHandler.js`, `notFound.js`.
- `src/validators/` — the Zod request schemas, one module per resource.
  Duplicated in `frontend/src/validation/` — the two apps install
  independently, so there is no shared package linking them. Change a rule in
  one and change it in the other.
- `src/config/` — `env.js` (the only place `process.env` is read),
  `database.js` (the pg pool), `constants.js` (cookie name, session TTL,
  upload limits, page sizes).
- `src/utils/` — `AppError`, `asyncHandler`, `response` (ok/fail), `cursor`,
  `password` (bcrypt), `token` (jose).
- `src/app.js` builds the Express app; `src/server.js` starts it.

### Error handling

Services throw `AppError`, `asyncHandler` forwards it, and `errorHandler`
translates it to `{ error: { code, message, details } }`. Controllers contain
no `try`/`catch`. A Zod failure becomes 422, a Postgres unique violation
becomes 409, and anything unrecognised is logged server-side and returned as a
flat 500 — database error text never reaches a client.

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
