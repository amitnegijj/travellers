import { ZodError } from "zod";
import { AppError } from "../utils/AppError.js";
import { fail } from "../utils/response.js";

/**
 * Central error middleware — business errors map to clean HTTP responses,
 * and Postgres errors never leak to the client. Must be registered last:
 * Express recognises an error middleware by its arity, so a handler with
 * fewer than four parameters is treated as an ordinary one.
 */
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
