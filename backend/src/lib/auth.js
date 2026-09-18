import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { AppError } from "./http.js";
import { queryOne } from "./db.js";

const COOKIE = "travel_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days, in seconds

const DEV_SECRET = "dev_only_secret_change_me_in_production_0123456789abcdef";

let cached = null;

/**
 * Session tokens are signed with this, so a known value means anyone can forge
 * a cookie for any account. The dev fallback keeps local setup to zero config,
 * but it ships in the repo — so in production a real AUTH_SECRET is mandatory
 * and we refuse to sign or verify anything without one, rather than fail open.
 *
 * Resolved on first use, not at import, so a misconfigured build fails on the
 * first request rather than crashing the whole process at startup.
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

export const hashPassword = (plain) => bcrypt.hash(plain, 10);
export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);

const cookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE * 1000, // Express wants milliseconds
});

export async function createSession(res, userId) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(authSecret());

  res.cookie(COOKIE, token, cookieOptions());
}

export function destroySession(res) {
  res.clearCookie(COOKIE, { ...cookieOptions(), maxAge: undefined });
}

/** Returns the signed-in profile, or null. Safe to call from any route. */
export async function getSessionUser(req) {
  const token = req.cookies?.[COOKIE];
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, authSecret());
    const userId = payload.sub;
    if (!userId) return null;

    return await queryOne(
      `select id, handle, display_name as "displayName", avatar_url as "avatarUrl"
         from profiles where id = $1`,
      [userId]
    );
  } catch {
    return null;
  }
}

/** Same, but throws 401 instead of returning null. For mutating routes. */
export async function requireUser(req) {
  const user = await getSessionUser(req);
  if (!user) throw new AppError("unauthorized", "You must be signed in");
  return user;
}
