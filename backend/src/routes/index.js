// Every endpoint this API exposes, in one place. Mounted by app.js under
// a single version prefix, so moving to /api/v2 is a one-line change there.
import { Router } from "express";
import authRoutes from "./authRoutes.js";
import commentRoutes from "./commentRoutes.js";
import destinationRoutes from "./destinationRoutes.js";
import homeRoutes from "./homeRoutes.js";
import journeyRoutes from "./journeyRoutes.js";
import mapRoutes from "./mapRoutes.js";
import mediaRoutes from "./mediaRoutes.js";
import profileRoutes from "./profileRoutes.js";
import searchRoutes from "./searchRoutes.js";
import trailRoutes from "./trailRoutes.js";
import userPlaceRoutes from "./userPlaceRoutes.js";

const router = Router();

router.get("/health", (req, res) => res.json({ ok: true }));

router.use("/auth", authRoutes);
router.use("/journeys", journeyRoutes);
router.use("/trails", trailRoutes);
router.use("/destinations", destinationRoutes);
router.use("/profiles", profileRoutes);
router.use("/comments", commentRoutes);
router.use("/user-places", userPlaceRoutes);
router.use("/search", searchRoutes);
router.use("/map", mapRoutes);
router.use("/media", mediaRoutes);
router.use("/home", homeRoutes);

export default router;
