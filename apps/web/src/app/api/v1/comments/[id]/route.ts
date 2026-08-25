import { handler, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { deleteComment } from "@/server/social";

export const DELETE = handler(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  await deleteComment(id, user.id);
  return ok({ ok: true });
});
