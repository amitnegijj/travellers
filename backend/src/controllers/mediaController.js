import { requireUser } from "../middleware/authenticate.js";
import * as mediaService from "../services/mediaService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/response.js";

export const upload = asyncHandler(async (req, res) => {
  const user = await requireUser(req);

  const media = await mediaService.storeImage({
    ownerId: user.id,
    file: req.file,
    width: Number(req.body?.width ?? 0) || null,
    height: Number(req.body?.height ?? 0) || null,
  });

  ok(res, media, 201);
});
