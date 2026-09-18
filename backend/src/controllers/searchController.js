import { getSessionUser } from "../middleware/authenticate.js";
import * as searchService from "../services/searchService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/response.js";

export const search = asyncHandler(async (req, res) => {
  const viewer = await getSessionUser(req);
  ok(res, await searchService.searchEverything(req.query.q, viewer?.id ?? null));
});
