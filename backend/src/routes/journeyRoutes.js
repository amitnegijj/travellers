import { Router } from "express";
import * as journeyController from "../controllers/journeyController.js";
import { validateBody } from "../middleware/validate.js";
import {
  commentSchema, journeyCreateSchema, journeyUpdateSchema,
} from "../validators/journeyValidators.js";

const router = Router();

router.get("/", journeyController.list);
router.post("/", validateBody(journeyCreateSchema), journeyController.create);

// Registered before "/:id" — otherwise Express would match "mine" as an id.
router.get("/mine", journeyController.listMine);

router.get("/:id/edit", journeyController.getForEdit);
router.get("/:id", journeyController.getById);
router.patch("/:id", validateBody(journeyUpdateSchema), journeyController.update);
router.delete("/:id", journeyController.remove);

router.post("/:id/like", journeyController.like);
router.post("/:id/save", journeyController.save);
router.get("/:id/comments", journeyController.listComments);
router.post("/:id/comments", validateBody(commentSchema), journeyController.addComment);

export default router;
