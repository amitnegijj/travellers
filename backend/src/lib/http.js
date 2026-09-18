import { ZodError } from "zod";

const STATUS = {
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  validation: 422,
  conflict: 409,
  rate_limited: 429,
  internal: 500,
};

export class AppError extends Error {
  constructor(code, message, details) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

export const ok = (res, data, status = 200) => res.status(status).json(data);

export function fail(res, code, message, details) {
  res.status(STATUS[code] ?? 500).json({ error: { code, message, details } });
}

/**
 * Wraps an async Express handler so a rejected promise reaches the error
 * middleware instead of hanging the request.
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

/** Central error middleware — business errors map to clean HTTP responses,
 *  and Postgres errors never leak to the client. Mirrors the try/catch every
 *  Next.js route handler used to wrap itself in. */
export function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) return fail(res, err.code, err.message, err.details);
  if (err instanceof ZodError) return fail(res, "validation", "Invalid input", err.issues);
  // Malformed JSON body, thrown by express.json() itself.
  if (err.type === "entity.parse.failed") {
    return fail(res, "validation", "Body must be valid JSON");
  }
  // Unique violation — the only Postgres code worth translating here.
  if (err && typeof err === "object" && err.code === "23505") {
    return fail(res, "conflict", "That already exists");
  }
  console.error("[api]", err);
  return fail(res, "internal", "Something went wrong");
}

export function parseBody(req, schema) {
  return schema.parse(req.body);
}

// ---------------------------------------------------------------- pagination

export function encodeCursor(c) {
  return Buffer.from(JSON.stringify(c)).toString("base64url");
}

export function decodeCursor(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (typeof parsed?.ts === "string" && typeof parsed?.id === "string") return parsed;
    return null;
  } catch {
    return null;
  }
}
