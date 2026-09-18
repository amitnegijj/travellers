import { Router } from "express";
import { userPlaceUpdateSchema } from "../lib/validation.js";
import { requireUser } from "../lib/auth.js";
import { asyncHandler, ok, parseBody } from "../lib/http.js";
import { deleteUserPlace, updateUserPlace } from "../services/user-places.js";

const router = Router();

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = await requireUser(req);
    const patch = parseBody(req, userPlaceUpdateSchema);
    ok(res, await updateUserPlace(req.params.id, user.id, patch));
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = await requireUser(req);
    await deleteUserPlace(req.params.id, user.id);
    ok(res, { ok: true });
  })
);

export default router;
