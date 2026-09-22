import { createSession, destroySession, getSessionUser } from "../middleware/authenticate.js";
import * as authService from "../services/authService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/response.js";

export const login = asyncHandler(async (req, res) => {
  const { userId, profile } = await authService.login(req.body);
  await createSession(res, userId);
  ok(res, profile);
});

export const signup = asyncHandler(async (req, res) => {
  const { userId, handle } = await authService.signup(req.body);
  await createSession(res, userId);
  ok(res, { id: userId, handle }, 201);
});

export const logout = asyncHandler(async (req, res) => {
  destroySession(res);
  ok(res, { ok: true });
});

// The SPA has no server-rendered layout to read the session cookie for it,
// so it boots by asking the API who (if anyone) is signed in.
export const me = asyncHandler(async (req, res) => {
  ok(res, await getSessionUser(req));
});
