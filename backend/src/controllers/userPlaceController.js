import { requireUser } from "../middleware/authenticate.js";
import * as userPlaceService from "../services/userPlaceService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/response.js";

export const update = asyncHandler(async (req, res) => {
  const user = await requireUser(req);
  ok(res, await userPlaceService.updateUserPlace(req.params.id, user.id, req.body));
});

export const remove = asyncHandler(async (req, res) => {
  const user = await requireUser(req);
  await userPlaceService.deleteUserPlace(req.params.id, user.id);
  ok(res, { ok: true });
});
