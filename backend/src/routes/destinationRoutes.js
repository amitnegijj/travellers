import { Router } from "express";
import * as destinationController from "../controllers/destinationController.js";

const router = Router();

router.get("/", destinationController.list);
router.get("/:slug", destinationController.getBySlug);

export default router;
