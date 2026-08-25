import { handler, ok } from "@/lib/api";
import { getDestination } from "@/server/places";

export const GET = handler(async (_req: Request, ctx: { params: Promise<{ slug: string }> }) => {
  const { slug } = await ctx.params;
  return ok(await getDestination(slug));
});
