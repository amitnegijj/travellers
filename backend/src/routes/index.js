// Every endpoint this API exposes, in one place. Mounted by app.js under
// a single version prefix, so moving to /api/v2 is a one-line change there.
import { Router } from "express";
import { query } from "../config/database.js";
import { env } from "../config/env.js";
import authRoutes from "./authRoutes.js";
import commentRoutes from "./commentRoutes.js";
import destinationRoutes from "./destinationRoutes.js";
import homeRoutes from "./homeRoutes.js";
import journeyRoutes from "./journeyRoutes.js";
import mapRoutes from "./mapRoutes.js";
import mediaRoutes from "./mediaRoutes.js";
import profileRoutes from "./profileRoutes.js";
import searchRoutes from "./searchRoutes.js";
import trailRoutes from "./trailRoutes.js";
import userPlaceRoutes from "./userPlaceRoutes.js";

const router = Router();

router.get("/health", (req, res) => res.json({ ok: true }));

/**
 * Deployment self-check. Names which settings are present (never their values)
 * and reports the database driver's own error, so a misconfigured deploy can
 * be diagnosed from the outside instead of from the host's log viewer.
 */
router.get("/health/config", async (req, res) => {
  const url = (() => {
    try {
      const u = new URL(env.databaseUrl);
      return { host: u.hostname, port: u.port || "5432", user: u.username, database: u.pathname.slice(1) };
    } catch {
      return { error: "DATABASE_URL is not a valid connection string" };
    }
  })();

  let database = "ok";
  try {
    await query("select 1");
  } catch (err) {
    database = err.message;
  }

  res.json({
    database,
    target: url,
    set: {
      DATABASE_URL: Boolean(process.env.DATABASE_URL),
      AUTH_SECRET: Boolean(env.authSecret),
      CLIENT_ORIGIN: process.env.CLIENT_ORIGIN ?? null,
      SUPABASE_URL: Boolean(env.supabaseUrl),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(env.supabaseServiceKey),
    },
  });
});

router.use("/auth", authRoutes);
router.use("/journeys", journeyRoutes);
router.use("/trails", trailRoutes);
router.use("/destinations", destinationRoutes);
router.use("/profiles", profileRoutes);
router.use("/comments", commentRoutes);
router.use("/user-places", userPlaceRoutes);
router.use("/search", searchRoutes);
router.use("/map", mapRoutes);
router.use("/media", mediaRoutes);
router.use("/home", homeRoutes);

export default router;
