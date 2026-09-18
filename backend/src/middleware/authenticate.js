import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "../config/constants.js";
import { env } from "../config/env.js";
import * as profileRepository from "../repositories/profileRepository.js";
import { AppError } from "../utils/AppError.js";
import { readSessionToken, signSessionToken } from "../utils/token.js";

const cookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax",
  secure: env.isProduction,
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS * 1000, // Express wants milliseconds
});

export async function createSession(res, userId) {
  res.cookie(SESSION_COOKIE, await signSessionToken(userId), cookieOptions());
}

export function destroySession(res) {
  res.clearCookie(SESSION_COOKIE, { ...cookieOptions(), maxAge: undefined });
}

/**
 * Resolves the signed-in profile from the cookie, or null.
 *
 * The token carries only the user id — the profile is re-read on every
 * request rather than trusted from the token, so a rename or a deleted
 * account takes effect immediately instead of at token expiry.
 */
export async function getSessionUser(req) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;

  const userId = await readSessionToken(token);
  if (!userId) return null;

  return profileRepository.findSessionProfileById(userId);
}

/** Same, but throws 401 instead of returning null. For mutating routes. */
export async function requireUser(req) {
  const user = await getSessionUser(req);
  if (!user) throw new AppError("unauthorized", "You must be signed in");
  return user;
}

/**
 * Route-level middleware form. `attachUser` is for endpoints that read
 * differently when signed in; `requireAuth` is for endpoints that refuse
 * anonymous callers outright.
 */
export async function attachUser(req, _res, next) {
  try {
    req.user = await getSessionUser(req);
    next();
  } catch (err) {
    next(err);
  }
}

export async function requireAuth(req, _res, next) {
  try {
    req.user = await requireUser(req);
    next();
  } catch (err) {
    next(err);
  }
}
