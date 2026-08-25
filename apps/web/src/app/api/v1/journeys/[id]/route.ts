import { handler, ok, parseBody } from "@/lib/api";
import { getSessionUser, requireUser } from "@/lib/auth";
import { journeyUpdateSchema } from "@/lib/validation";
import { deleteJourney, getJourney, updateJourney } from "@/server/journeys";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler(async (_req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const viewer = await getSessionUser();
  return ok(await getJourney(id, viewer?.id ?? null));
});

export const PATCH = handler(async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  const input = await parseBody(req, journeyUpdateSchema);
  await updateJourney(id, user.id, input);
  return ok({ id });
});

export const DELETE = handler(async (_req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  await deleteJourney(id, user.id);
  return ok({ ok: true });
});
