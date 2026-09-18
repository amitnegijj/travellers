import { Router } from "express";
import * as commentController from "../controllers/commentController.js";

const router = Router();

router.delete("/:id", commentController.remove);

export default router;
