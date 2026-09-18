import { Router } from "express";
import * as mediaController from "../controllers/mediaController.js";
import { uploadSingleImage } from "../middleware/upload.js";

const router = Router();

router.post("/", uploadSingleImage, mediaController.upload);

export default router;
