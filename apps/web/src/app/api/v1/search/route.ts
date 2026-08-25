import { handler, ok } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { searchAll } from "@/server/places";
import { listJourneys } from "@/server/journeys";

export const GET = handler(async (req: Request) => {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  const viewer = await getSessionUser();

  const [entities, journeys] = await Promise.all([
    searchAll(q),
    q.trim()
      ? listJourneys({ viewerId: viewer?.id ?? null, q, limit: 8 })
      : Promise.resolve({ items: [], nextCursor: null }),
  ]);

  return ok({ ...entities, journeys: journeys.items });
});
