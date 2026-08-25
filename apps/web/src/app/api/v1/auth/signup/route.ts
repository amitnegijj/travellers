import { AppError, handler, ok, parseBody } from "@/lib/api";
import { createSession, hashPassword } from "@/lib/auth";
import { queryOne, transaction } from "@/lib/db";
import { signupSchema } from "@/lib/validation";

export const POST = handler(async (req: Request) => {
  const input = await parseBody(req, signupSchema);

  const existingEmail = await queryOne("select 1 from users where email = $1", [input.email]);
  if (existingEmail) throw new AppError("conflict", "That email is already registered");

  const existingHandle = await queryOne("select 1 from profiles where handle = $1", [input.handle]);
  if (existingHandle) throw new AppError("conflict", "That handle is taken");

  const passwordHash = await hashPassword(input.password);

  const userId = await transaction(async (q) => {
    const [user] = (await q("insert into users (email, password_hash) values ($1,$2) returning id", [
      input.email,
      passwordHash,
    ])) as { id: string }[];

    await q("insert into profiles (id, handle, display_name) values ($1,$2,$3)", [
      user.id,
      input.handle,
      input.displayName,
    ]);

    return user.id;
  });

  await createSession(userId);
  return ok({ id: userId, handle: input.handle }, 201);
});
