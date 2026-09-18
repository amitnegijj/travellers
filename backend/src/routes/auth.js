import { Router } from "express";
import { loginSchema, signupSchema } from "../lib/validation.js";
import { createSession, destroySession, getSessionUser, hashPassword, verifyPassword } from "../lib/auth.js";
import { queryOne, transaction } from "../lib/db.js";
import { AppError, asyncHandler, ok, parseBody } from "../lib/http.js";

const router = Router();

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = parseBody(req, loginSchema);

    const user = await queryOne("select id, password_hash from users where email = $1", [email]);

    // Same message either way — don't leak which emails exist.
    const invalid = new AppError("unauthorized", "Email or password is incorrect");
    if (!user) throw invalid;
    if (!(await verifyPassword(password, user.password_hash))) throw invalid;

    await createSession(res, user.id);

    const profile = await queryOne(
      `select id, handle, display_name as "displayName" from profiles where id = $1`,
      [user.id]
    );
    ok(res, profile);
  })
);

router.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const input = parseBody(req, signupSchema);

    const existingEmail = await queryOne("select 1 from users where email = $1", [input.email]);
    if (existingEmail) throw new AppError("conflict", "That email is already registered");

    const existingHandle = await queryOne("select 1 from profiles where handle = $1", [input.handle]);
    if (existingHandle) throw new AppError("conflict", "That handle is taken");

    const passwordHash = await hashPassword(input.password);

    const userId = await transaction(async (q) => {
      const [user] = await q("insert into users (email, password_hash) values ($1,$2) returning id", [
        input.email,
        passwordHash,
      ]);

      await q("insert into profiles (id, handle, display_name) values ($1,$2,$3)", [
        user.id,
        input.handle,
        input.displayName,
      ]);

      return user.id;
    });

    await createSession(res, userId);
    ok(res, { id: userId, handle: input.handle }, 201);
  })
);

router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    destroySession(res);
    ok(res, { ok: true });
  })
);

// New: the SPA has no server-rendered layout to read the session cookie for
// it, so the app boots by asking the API who (if anyone) is signed in.
router.get(
  "/me",
  asyncHandler(async (req, res) => {
    ok(res, await getSessionUser(req));
  })
);

export default router;
