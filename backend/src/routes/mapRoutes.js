import { Router } from "express";
import * as mapController from "../controllers/mapController.js";

const router = Router();

router.get("/", mapController.getMap);

export default router;
