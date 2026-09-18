import { Router } from "express";
import * as homeController from "../controllers/homeController.js";

const router = Router();

router.get("/rail", homeController.getRail);
router.get("/stories", homeController.getStories);
router.get("/destinations-strip", homeController.getDestinationsStrip);
router.get("/community-strip", homeController.getCommunityStrip);

export default router;
