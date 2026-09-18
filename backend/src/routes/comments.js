import { Router } from "express";
import { requireUser } from "../lib/auth.js";
import { asyncHandler, ok } from "../lib/http.js";
import { deleteComment } from "../services/social.js";

const router = Router();

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = await requireUser(req);
    await deleteComment(req.params.id, user.id);
    ok(res, { ok: true });
  })
);

export default router;
