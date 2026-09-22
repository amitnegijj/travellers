import { Router } from "express";
import * as trailController from "../controllers/trailController.js";

const router = Router();

router.get("/", trailController.list);

export default router;
