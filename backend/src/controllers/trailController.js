import { getSessionUser } from "../middleware/authenticate.js";
import * as trailService from "../services/trailService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/response.js";

const MAX_TRAILS = 30;

export const list = asyncHandler(async (req, res) => {
  const viewer = await getSessionUser(req);
  const { items, nextCursor } = await trailService.listTrails({
    viewerId: viewer?.id ?? null,
    scope: req.query.scope === "following" ? "following" : "all",
    limit: Math.min(Number(req.query.limit ?? 8), MAX_TRAILS),
  });
  ok(res, { items, nextCursor });
});
