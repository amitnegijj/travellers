import { Router } from "express";
import { asyncHandler, ok } from "../lib/http.js";
import { mapFeatures } from "../services/places.js";

const router = Router();

router.get("/", asyncHandler(async (req, res) => ok(res, await mapFeatures())));

export default router;
