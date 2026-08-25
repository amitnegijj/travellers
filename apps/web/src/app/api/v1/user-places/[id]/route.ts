import { handler, ok, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { userPlaceUpdateSchema } from "@/lib/validation";
import { deleteUserPlace, updateUserPlace } from "@/server/user-places";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handler(async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  const patch = await parseBody(req, userPlaceUpdateSchema);
  return ok(await updateUserPlace(id, user.id, patch));
});

export const DELETE = handler(async (_req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  await deleteUserPlace(id, user.id);
  return ok({ ok: true });
});
