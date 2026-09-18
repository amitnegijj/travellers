import { Router } from "express";
import { getSessionUser } from "../lib/auth.js";
import { asyncHandler, ok } from "../lib/http.js";
import { listTrails } from "../services/journeys.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const user = await getSessionUser(req);
    const { items, nextCursor } = await listTrails({
      viewerId: user?.id ?? null,
      scope: req.query.scope === "following" ? "following" : "all",
      limit: Math.min(Number(req.query.limit ?? 8), 30),
    });
    ok(res, { items, nextCursor });
  })
);

export default router;
