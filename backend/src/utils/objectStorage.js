// Where uploaded bytes live. Returns the public URL to store in `media.url`.
//
// With SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY set, files go to a public
// Supabase Storage bucket; that's required on Vercel, whose functions have no
// lasting disk. Otherwise they're written to backend/public/uploads and served
// by app.js at /uploads — the local-dev default.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../config/env.js";
import { AppError } from "./AppError.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, "..", "..", "public", "uploads");

const useSupabase = () => Boolean(env.supabaseUrl && env.supabaseServiceKey);

export async function saveObject(filename, buffer, contentType) {
  if (useSupabase()) return saveToSupabase(filename, buffer, contentType);

  if (env.isServerless) {
    throw new AppError(
      "internal",
      "Photo storage isn't configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return `/uploads/${filename}`;
}

async function saveToSupabase(filename, buffer, contentType) {
  const base = env.supabaseUrl.replace(/\/+$/, "");
  const objectPath = `${env.storageBucket}/${filename}`;

  const res = await fetch(`${base}/storage/v1/object/${objectPath}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.supabaseServiceKey}`,
      apikey: env.supabaseServiceKey,
      "content-type": contentType,
      "cache-control": "31536000",
    },
    body: buffer,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error(`[storage] upload failed (${res.status}): ${detail}`);
    throw new AppError("internal", "Could not save the photo. Please try again.");
  }
  return `${base}/storage/v1/object/public/${objectPath}`;
}
