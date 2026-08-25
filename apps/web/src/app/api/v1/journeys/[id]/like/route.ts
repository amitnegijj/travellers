import { handler, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { toggleLike } from "@/server/social";

export const POST = handler(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  return ok(await toggleLike(user.id, id));
});
