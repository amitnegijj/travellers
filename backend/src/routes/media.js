import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Router } from "express";
import multer from "multer";
import { requireUser } from "../lib/auth.js";
import { queryOne } from "../lib/db.js";
import { AppError, asyncHandler, ok } from "../lib/http.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MAX_BYTES = 6 * 1024 * 1024; // client downscales first; this is the backstop
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

// Local disk in dev. Swapping this for signed URLs to object storage is a
// change to this one file — the media table already stores a plain URL.
const UPLOAD_DIR = path.join(__dirname, "..", "..", "public", "uploads");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_BYTES } });

const router = Router();

router.post(
  "/",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const user = await requireUser(req);

    const file = req.file;
    if (!file) throw new AppError("validation", "No file provided");

    if (!ALLOWED.has(file.mimetype)) {
      throw new AppError("validation", "Only JPEG, PNG, WebP or AVIF images are allowed");
    }
    if (file.size > MAX_BYTES) {
      throw new AppError("validation", "Image is too large — max 6 MB after downscaling");
    }

    const width = Number(req.body?.width ?? 0) || null;
    const height = Number(req.body?.height ?? 0) || null;

    const ext = file.mimetype.split("/")[1].replace("jpeg", "jpg");
    const filename = `${randomUUID()}.${ext}`;

    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, filename), file.buffer);

    const url = `/uploads/${filename}`;
    const media = await queryOne(
      `insert into media (owner_id, url, mime, width, height, bytes)
       values ($1,$2,$3,$4,$5,$6)
       returning id, url, width, height`,
      [user.id, url, file.mimetype, width, height, file.size]
    );

    ok(res, media, 201);
  })
);

export default router;
