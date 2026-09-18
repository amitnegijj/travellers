import { Router } from "express";
import { getSessionUser } from "../lib/auth.js";
import { asyncHandler, ok } from "../lib/http.js";
import { listJourneys } from "../services/journeys.js";
import { searchAll } from "../services/places.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = req.query.q ?? "";
    const viewer = await getSessionUser(req);

    const [entities, journeys] = await Promise.all([
      searchAll(q),
      q.trim()
        ? listJourneys({ viewerId: viewer?.id ?? null, q, limit: 8 })
        : Promise.resolve({ items: [], nextCursor: null }),
    ]);

    ok(res, { ...entities, journeys: journeys.items });
  })
);

export default router;
