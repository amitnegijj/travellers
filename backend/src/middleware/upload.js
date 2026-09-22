import multer from "multer";
import { UPLOAD_MAX_BYTES } from "../config/constants.js";

/**
 * Files are held in memory and written by the media service, so the upload
 * destination is a decision that belongs to that service rather than to
 * request parsing.
 */
export const uploadSingleImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: UPLOAD_MAX_BYTES },
}).single("file");
