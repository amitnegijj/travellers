// Values that are policy rather than configuration — they don't vary by
// environment, but several layers need to agree on them.

/** Session cookie name and lifetime. */
export const SESSION_COOKIE = "travel_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

/** bcrypt work factor. */
export const PASSWORD_SALT_ROUNDS = 10;

/**
 * Uploads. The client downscales before sending (typically to ~400 KB); this
 * is the backstop. Kept under Vercel's 4.5 MB request-body limit.
 */
export const UPLOAD_MAX_BYTES = 4 * 1024 * 1024;
export const UPLOAD_ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

/** Feed pagination. */
export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 50;
