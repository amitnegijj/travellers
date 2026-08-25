import { decodeCursor, encodeCursor, handler, ok, parseBody } from "@/lib/api";
import { getSessionUser, requireUser } from "@/lib/auth";
import { journeyCreateSchema } from "@/lib/validation";
import { createJourney, listJourneys } from "@/server/journeys";

export const GET = handler(async (req: Request) => {
  const url = new URL(req.url);
  const viewer = await getSessionUser();

  const { items, nextCursor } = await listJourneys({
    viewerId: viewer?.id ?? null,
    cursor: decodeCursor(url.searchParams.get("cursor")),
    limit: Math.min(Number(url.searchParams.get("limit") ?? 12), 50),
    scope: url.searchParams.get("scope") === "following" ? "following" : "all",
    authorHandle: url.searchParams.get("author") ?? undefined,
    destinationSlug: url.searchParams.get("destination") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
  });

  return ok({ items, nextCursor: nextCursor ? encodeCursor(nextCursor) : null });
});

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  const input = await parseBody(req, journeyCreateSchema);
  const id = await createJourney(user.id, input);
  return ok({ id }, 201);
});
