import path from "node:path";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { errorHandler } from "./lib/http.js";
import authRoutes from "./routes/auth.js";
import commentsRoutes from "./routes/comments.js";
import destinationsRoutes from "./routes/destinations.js";
import homeRoutes from "./routes/home.js";
import journeysRoutes from "./routes/journeys.js";
import mapRoutes from "./routes/map.js";
import mediaRoutes from "./routes/media.js";
import profilesRoutes from "./routes/profiles.js";
import searchRoutes from "./routes/search.js";
import trailsRoutes from "./routes/trails.js";
import userPlacesRoutes from "./routes/user-places.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  // Trusts the client origin from env — cookies are same-site but cross-origin
  // in dev (5173 vs 4000), so this must be an explicit origin, not "*".
  //
  // "localhost" and "127.0.0.1" are the same machine but different origins as
  // far as the browser is concerned, so whichever one CLIENT_ORIGIN doesn't
  // name is silently rejected — the fetch fails with no useful error at all,
  // just "Failed to fetch". Accepting both aliases of the configured host
  // sidesteps that without loosening anything for a real deploy, where
  // CLIENT_ORIGIN is a real domain with no such alias to confuse it with.
  const configuredOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
  const allowedOrigins = new Set([configuredOrigin]);
  try {
    const u = new URL(configuredOrigin);
    if (u.hostname === "localhost") allowedOrigins.add(`${u.protocol}//127.0.0.1:${u.port}`);
    if (u.hostname === "127.0.0.1") allowedOrigins.add(`${u.protocol}//localhost:${u.port}`);
  } catch {
    // Malformed CLIENT_ORIGIN — fall through with just the one value; cors()
    // below will then reject everything, which is at least loud about why.
  }

  app.use(
    cors({
      origin(origin, callback) {
        // No Origin header (curl, server-to-server, same-origin) — allow.
        if (!origin || allowedOrigins.has(origin)) return callback(null, true);
        callback(new Error(`Origin ${origin} is not allowed`));
      },
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(express.json());

  // Uploaded photos — served from disk exactly like Next's /public did.
  app.use("/uploads", express.static(path.join(__dirname, "..", "public", "uploads")));

  app.get("/api/v1/health", (req, res) => res.json({ ok: true }));

  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/journeys", journeysRoutes);
  app.use("/api/v1/trails", trailsRoutes);
  app.use("/api/v1/destinations", destinationsRoutes);
  app.use("/api/v1/profiles", profilesRoutes);
  app.use("/api/v1/comments", commentsRoutes);
  app.use("/api/v1/user-places", userPlacesRoutes);
  app.use("/api/v1/search", searchRoutes);
  app.use("/api/v1/map", mapRoutes);
  app.use("/api/v1/media", mediaRoutes);
  app.use("/api/v1/home", homeRoutes);

  app.use((req, res) => {
    res.status(404).json({ error: { code: "not_found", message: "No such route" } });
  });

  // Must be registered last — Express recognises an error middleware by arity.
  app.use(errorHandler);

  return app;
}
