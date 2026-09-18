import { SignJWT, jwtVerify } from "jose";
import { DEV_AUTH_SECRET, env } from "../config/env.js";
import { SESSION_MAX_AGE_SECONDS } from "../config/constants.js";

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

  const fromEnv = env.authSecret;

  if (env.isProduction) {
    if (!fromEnv || fromEnv === DEV_AUTH_SECRET) {
      throw new Error(
        "AUTH_SECRET must be set to a private value in production. " +
          "Generate one with: openssl rand -hex 32"
      );
    }
    if (fromEnv.length < 32) {
      throw new Error("AUTH_SECRET must be at least 32 characters.");
    }
  }

  cached = new TextEncoder().encode(fromEnv || DEV_AUTH_SECRET);
  return cached;
}

/** Signs a session token for `userId`. */
export function signSessionToken(userId) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(authSecret());
}

/** Returns the user id a token carries, or null if it isn't valid. */
export async function readSessionToken(token) {
  try {
    const { payload } = await jwtVerify(token, authSecret());
    return payload.sub ?? null;
  } catch {
    return null;
  }
}
