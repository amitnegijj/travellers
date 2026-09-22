import path from "node:path";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import routes from "./routes/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Cookies are same-site but cross-origin in dev (5173 vs 4000), so the
 * allowlist must name an explicit origin — never "*".
 *
 * "localhost" and "127.0.0.1" are the same machine but different origins as
 * far as the browser is concerned, so whichever one CLIENT_ORIGIN doesn't
 * name is silently rejected — the fetch fails with no useful error at all,
 * just "Failed to fetch". Accepting both aliases of the configured host
 * sidesteps that without loosening anything for a real deploy, where
 * CLIENT_ORIGIN is a real domain with no such alias to confuse it with.
 */
function allowedOrigins() {
  const origins = new Set([env.clientOrigin]);
  try {
    const url = new URL(env.clientOrigin);
    if (url.hostname === "localhost") origins.add(`${url.protocol}//127.0.0.1:${url.port}`);
    if (url.hostname === "127.0.0.1") origins.add(`${url.protocol}//localhost:${url.port}`);
  } catch {
    // Malformed CLIENT_ORIGIN — fall through with just the one value; cors()
    // below will then reject everything, which is at least loud about why.
  }
  return origins;
}

export function createApp() {
  const app = express();
  const origins = allowedOrigins();

  app.use(
    cors({
      origin(origin, callback) {
        // No Origin header (curl, server-to-server, same-origin) — allow.
        if (!origin || origins.has(origin)) return callback(null, true);
        callback(new Error(`Origin ${origin} is not allowed`));
      },
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(express.json());

  // Uploaded photos — served from disk exactly like Next's /public did.
  app.use("/uploads", express.static(path.join(__dirname, "..", "public", "uploads")));

  app.use("/api/v1", routes);

  app.use(notFound);

  // Must be registered last — Express recognises an error middleware by arity.
  app.use(errorHandler);

  return app;
}
