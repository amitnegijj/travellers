import { requireUser } from "../middleware/authenticate.js";
import * as socialService from "../services/socialService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/response.js";

export const remove = asyncHandler(async (req, res) => {
  const user = await requireUser(req);
  await socialService.deleteComment(req.params.id, user.id);
  ok(res, { ok: true });
});
