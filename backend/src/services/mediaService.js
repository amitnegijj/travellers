// Image uploads.
//
// Files land on local disk in dev. Swapping that for signed URLs to object
// storage is a change to this one file — the media table already stores a
// plain URL, and nothing downstream knows where the bytes actually are.
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { UPLOAD_ALLOWED_MIME, UPLOAD_MAX_BYTES } from "../config/constants.js";
import * as mediaRepository from "../repositories/mediaRepository.js";
import { AppError } from "../utils/AppError.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, "..", "..", "public", "uploads");

export async function storeImage({ ownerId, file, width, height }) {
  if (!file) throw new AppError("validation", "No file provided");

  if (!UPLOAD_ALLOWED_MIME.has(file.mimetype)) {
    throw new AppError("validation", "Only JPEG, PNG, WebP or AVIF images are allowed");
  }
  if (file.size > UPLOAD_MAX_BYTES) {
    throw new AppError("validation", "Image is too large — max 6 MB after downscaling");
  }

  const ext = file.mimetype.split("/")[1].replace("jpeg", "jpg");
  const filename = `${randomUUID()}.${ext}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), file.buffer);

  return mediaRepository.insert({
    ownerId,
    url: `/uploads/${filename}`,
    mime: file.mimetype,
    width,
    height,
    bytes: file.size,
  });
}
