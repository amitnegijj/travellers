# Setting up Travelora

Six steps, about ten minutes, most of it waiting on `npm install`. You'll end up with
a Postgres database in Docker, an API server, and the app in your browser — all on your
own machine. Nothing is deployed anywhere, and nothing needs an account, an API key, or
a credit card.

## Install these first

| Tool | Check it with |
|---|---|
| **Node.js 20 or newer** | `node -v` |
| **Docker Desktop** — must be *running*, not just installed | the whale icon in your tray |
| **Git** | `git --version` |

---

## 1. Clone the repository

```bash
git clone <repo-url>
cd travelora
```

Every command below runs from inside that folder.

## 2. Start the database

One command pulls the PostGIS image, starts the container, waits for it to accept
connections, creates every table, and fills it with demo travel data. The first run
downloads a few hundred MB.

```bash
npm run setup
```

**Docker Desktop has to be open before you run this.** If it isn't, the command fails
immediately with a daemon connection error.

## 3. Create the two config files

The real `.env` files aren't in Git, so copy them from the checked-in examples. The
defaults work as-is — you don't need to edit anything.

```powershell
# Windows
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

```bash
# macOS / Linux
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

## 4. Start the API

```bash
cd backend
npm install
npm run dev
```

You're looking for `[server] listening on http://localhost:4000`.
**Leave this terminal open.**

## 5. Start the app

A *second* terminal — the first one is still busy running the API.

```bash
cd frontend
npm install
npm run dev
```

Vite prints `➜ Local: http://localhost:5173/` when it's ready.
**Leave this terminal open too.**

## 6. Open it and sign in

Go to **http://localhost:5173** and log in:

```
arjun@example.com
password123
```

`priya@example.com` and `dev@example.com` use the same password, or sign up for your own.

You'll know it worked when the home feed shows photo cards with a cost and distance strip
across the bottom. The seeded trips all run one corridor — Delhi and Gurgaon up through
Haridwar and Rishikesh into Uttarakhand.

---

## What's now running

| Port | What | How to stop it |
|---|---|---|
| 5173 | The app — Vite dev server | `Ctrl+C` in its terminal |
| 4000 | The API — Express | `Ctrl+C` in its terminal |
| 5544 | PostgreSQL + PostGIS, in Docker | `npm run db:down` from the root |

**Why 5544 and not 5432?** The machine this was built on already had a native Postgres
install holding 5432 and 5433. The port is set consistently in `docker-compose.yml` and
both `.env.example` files — leave it alone and it works.

## Every time after this

Steps 1–3 were one-offs. From then on:

```bash
npm run db:up      # terminal 1, repo root — only if Docker restarted
cd backend  && npm run dev    # terminal 2
cd frontend && npm run dev    # terminal 3
```

The database keeps its data between restarts — it lives in a Docker volume, not in the
container — so you never have to re-seed unless you want to.

---

## If something goes wrong

**`error during connect … docker_engine: The system cannot find the file`**
Docker Desktop isn't running. Open it, wait for it to finish starting, re-run `npm run setup`.

**`Error: listen EADDRINUSE: address already in use :::4000`**
An old API server is still alive, usually from a terminal closed without `Ctrl+C`.
Windows: `netstat -ano | findstr :4000`, then `taskkill /PID <pid> /F`.
macOS/Linux: `lsof -ti:4000 | xargs kill`.

**`Port 5173 is already in use`**
Same problem, other port. Vite is deliberately set to fail here rather than quietly move
to 5174 — if it moved, the API would reject the new origin and you'd be chasing a
confusing CORS error instead of an obvious one. Kill whatever holds 5173.

**The page loads but everything says "Failed to fetch"**
The app can't reach the API. Either the backend terminal isn't running, or the two `.env`
files disagree. `VITE_API_URL` in `frontend/.env` must be `http://localhost:4000`, and
`CLIENT_ORIGIN` in `backend/.env` must be `http://localhost:5173` — exactly, including
the spelling of `localhost` (`127.0.0.1` is a different origin to a browser).

**Maps are blank, or the console mentions a worker**
MapLibre's worker files are missing. Run `npm run sync:map-worker` inside `frontend`.

**The feed is empty, no destinations**
The database has tables but no data. Run `npm run db:seed` from the repo root.

**You want to start over**
`npm run db:reset` deletes the database volume and rebuilds from nothing. This wipes any
account or trip you created.

---

## Things you can ignore

| Folder | What it actually is |
|---|---|
| `apps/web` | An older Next.js version of the same app, kept for reference. Own `npm install`, runs on port 3000. You don't need it. |
| `supabase` | A leftover config file. No code uses it — the database is plain Postgres in Docker. |
| `db` | Migration and seed scripts. The `npm run db:*` commands drive these; you never run the files directly. |
| `node_modules` | There are three, one per app. That's intentional — the apps are standalone, with no shared workspace. |

## Commands worth knowing

All from the repo root.

| Command | What it does |
|---|---|
| `npm run db:up` / `db:down` | Start / stop the database container (data is kept) |
| `npm run db:seed` | Reload demo data. **Deletes accounts and trips you made.** |
| `npm run db:reset` | Delete the database entirely and rebuild it |
| `npm run db:psql` | Open a SQL shell inside the container |
| `npm run db:migrate` | Apply new migrations after a `git pull` |

**After pulling new code:** run `npm install` in whichever app changed, and
`npm run db:migrate` from the root if the pull added anything to `db/migrations/`.
