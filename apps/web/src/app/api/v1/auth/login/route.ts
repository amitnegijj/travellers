import { AppError, handler, ok, parseBody } from "@/lib/api";
import { createSession, verifyPassword } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { loginSchema } from "@/lib/validation";

export const POST = handler(async (req: Request) => {
  const { email, password } = await parseBody(req, loginSchema);

  const user = await queryOne<{ id: string; password_hash: string }>(
    "select id, password_hash from users where email = $1",
    [email]
  );

  // Same message either way — don't leak which emails exist.
  const invalid = new AppError("unauthorized", "Email or password is incorrect");
  if (!user) throw invalid;
  if (!(await verifyPassword(password, user.password_hash))) throw invalid;

  await createSession(user.id);

  const profile = await queryOne(
    `select id, handle, display_name as "displayName" from profiles where id = $1`,
    [user.id]
  );
  return ok(profile);
});
