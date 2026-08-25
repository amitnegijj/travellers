import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

export type ErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation"
  | "conflict"
  | "rate_limited"
  | "internal";

const STATUS: Record<ErrorCode, number> = {
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  validation: 422,
  conflict: 409,
  rate_limited: 429,
  internal: 500,
};

export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly details?: unknown
  ) {
    super(message);
  }
}

export const ok = <T>(data: T, status = 200) => NextResponse.json(data, { status });

export function fail(code: ErrorCode, message: string, details?: unknown) {
  return NextResponse.json({ error: { code, message, details } }, { status: STATUS[code] });
}

/**
 * Wraps a route handler so business errors map to clean HTTP and Postgres
 * errors never leak to the client.
 */
export function handler<A extends unknown[]>(
  fn: (...args: A) => Promise<NextResponse>
): (...args: A) => Promise<NextResponse> {
  return async (...args: A) => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof AppError) return fail(err.code, err.message, err.details);
      if (err instanceof ZodError) {
        return fail("validation", "Invalid input", err.issues);
      }
      // Unique violation — the only Postgres code worth translating here.
      if (typeof err === "object" && err && "code" in err && err.code === "23505") {
        return fail("conflict", "That already exists");
      }
      console.error("[api]", err);
      return fail("internal", "Something went wrong");
    }
  };
}

export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new AppError("validation", "Body must be valid JSON");
  }
  return schema.parse(raw);
}

// ---------------------------------------------------------------- pagination

export type Cursor = { ts: string; id: string };

export function encodeCursor(c: Cursor): string {
  return Buffer.from(JSON.stringify(c)).toString("base64url");
}

export function decodeCursor(raw: string | null): Cursor | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (typeof parsed?.ts === "string" && typeof parsed?.id === "string") return parsed;
    return null;
  } catch {
    return null;
  }
}
