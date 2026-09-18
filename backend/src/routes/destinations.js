import { Router } from "express";
import { asyncHandler, ok } from "../lib/http.js";
import { getDestination, listDestinations, nearbyDestinations } from "../services/places.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { lng, lat } = req.query;

    // Nearby search is the PostGIS path; everything else is FTS + trigram.
    if (lng && lat) {
      const radius = Number(req.query.radius ?? 150_000);
      return ok(res, { items: await nearbyDestinations(Number(lng), Number(lat), radius) });
    }

    ok(res, { items: await listDestinations({ q: req.query.q || undefined, limit: Number(req.query.limit ?? 60) }) });
  })
);

router.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    ok(res, await getDestination(req.params.slug));
  })
);

export default router;
