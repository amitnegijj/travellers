import { AppError, handler, ok, parseBody } from "@/lib/api";
import { getSessionUser, requireUser } from "@/lib/auth";
import { userPlaceCreateSchema } from "@/lib/validation";
import { createUserPlace, listUserPlaces } from "@/server/user-places";

type Ctx = { params: Promise<{ handle: string }> };

export const GET = handler(async (_req: Request, ctx: Ctx) => {
  const { handle } = await ctx.params;
  const viewer = await getSessionUser();
  const { items, isOwner } = await listUserPlaces(handle, viewer?.id ?? null);
  return ok({ items, isOwner });
});

export const POST = handler(async (req: Request, ctx: Ctx) => {
  const { handle } = await ctx.params;
  const user = await requireUser();

  if (user.handle.toLowerCase() !== handle.toLowerCase()) {
    throw new AppError("forbidden", "You can only pin places on your own map");
  }

  const input = await parseBody(req, userPlaceCreateSchema);
  const place = await createUserPlace(user.id, input);
  return ok(place, 201);
});
