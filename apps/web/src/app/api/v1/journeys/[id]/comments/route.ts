import { handler, ok, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { commentSchema } from "@/lib/validation";
import { addComment, listComments } from "@/server/social";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler(async (_req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  return ok({ items: await listComments(id) });
});

export const POST = handler(async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  const { body } = await parseBody(req, commentSchema);
  const comment = await addComment(user.id, id, body);
  return ok(
    {
      ...comment,
      authorHandle: user.handle,
      authorName: user.displayName,
      authorAvatar: user.avatarUrl,
      authorId: user.id,
    },
    201
  );
});
