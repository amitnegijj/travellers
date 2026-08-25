import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { AppError, handler, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { queryOne } from "@/lib/db";

export const runtime = "nodejs";

const MAX_BYTES = 6 * 1024 * 1024; // client downscales first; this is the backstop
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

// Local disk in dev. Swapping this for signed URLs to object storage is a
// change to this one file — the media table already stores a plain URL.
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export const POST = handler(async (req: Request) => {
  const user = await requireUser();

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw new AppError("validation", "No file provided");

  if (!ALLOWED.has(file.type)) {
    throw new AppError("validation", "Only JPEG, PNG, WebP or AVIF images are allowed");
  }
  if (file.size > MAX_BYTES) {
    throw new AppError("validation", "Image is too large — max 6 MB after downscaling");
  }

  const width = Number(form?.get("width") ?? 0) || null;
  const height = Number(form?.get("height") ?? 0) || null;

  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const filename = `${randomUUID()}.${ext}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), Buffer.from(await file.arrayBuffer()));

  const url = `/uploads/${filename}`;
  const media = await queryOne(
    `insert into media (owner_id, url, mime, width, height, bytes)
     values ($1,$2,$3,$4,$5,$6)
     returning id, url, width, height`,
    [user.id, url, file.type, width, height, file.size]
  );

  return ok(media, 201);
});
