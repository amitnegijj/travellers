import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { AppError } from "./api";
import { queryOne } from "./db";

const COOKIE = "travel_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const DEV_SECRET = "dev_only_secret_change_me_in_production_0123456789abcdef";

let cached: Uint8Array | null = null;

/**
 * Session tokens are signed with this, so a known value means anyone can forge
 * a cookie for any account. The dev fallback keeps local setup to zero config,
 * but it ships in the repo — so in production a real AUTH_SECRET is mandatory
 * and we refuse to sign or verify anything without one, rather than fail open.
 *
 * Resolved on first use, not at import: `next build` runs with NODE_ENV=production
 * but has no business needing a runtime secret, and throwing at module scope
 * would break the build instead of the misconfigured deploy.
 */
function authSecret() {
  if (cached) return cached;

  const fromEnv = process.env.AUTH_SECRET;

  if (process.env.NODE_ENV === "production") {
    if (!fromEnv || fromEnv === DEV_SECRET) {
      throw new Error(
        "AUTH_SECRET must be set to a private value in production. " +
          "Generate one with: openssl rand -hex 32"
      );
    }
    if (fromEnv.length < 32) {
      throw new Error("AUTH_SECRET must be at least 32 characters.");
    }
  }

  cached = new TextEncoder().encode(fromEnv || DEV_SECRET);
  return cached;
}

export type SessionUser = {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
};

export const hashPassword = (plain: string) => bcrypt.hash(plain, 10);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(authSecret());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/** Returns the signed-in profile, or null. Safe to call from RSC and routes. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, authSecret());
    const userId = payload.sub;
    if (!userId) return null;

    return await queryOne<SessionUser>(
      `select id, handle, display_name as "displayName", avatar_url as "avatarUrl"
         from profiles where id = $1`,
      [userId]
    );
  } catch {
    return null;
  }
}

/** Same, but throws 401 instead of returning null. For mutating routes. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AppError("unauthorized", "You must be signed in");
  return user;
}
