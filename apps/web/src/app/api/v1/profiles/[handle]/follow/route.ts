import { handler, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { toggleFollow } from "@/server/social";

export const POST = handler(async (_req: Request, ctx: { params: Promise<{ handle: string }> }) => {
  const { handle } = await ctx.params;
  const user = await requireUser();
  return ok(await toggleFollow(user.id, handle));
});
