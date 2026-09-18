import * as destinationService from "../services/destinationService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/response.js";

const DEFAULT_RADIUS_M = 150_000;

export const list = asyncHandler(async (req, res) => {
  const { lng, lat } = req.query;

  // Nearby search is the PostGIS path; everything else is FTS + trigram.
  if (lng && lat) {
    const radius = Number(req.query.radius ?? DEFAULT_RADIUS_M);
    const items = await destinationService.nearbyDestinations(Number(lng), Number(lat), radius);
    return ok(res, { items });
  }

  const items = await destinationService.listDestinations({
    q: req.query.q || undefined,
    limit: Number(req.query.limit ?? 60),
  });
  ok(res, { items });
});

export const getBySlug = asyncHandler(async (req, res) => {
  ok(res, await destinationService.getDestination(req.params.slug));
});
