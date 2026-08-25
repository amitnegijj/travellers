import { handler, ok } from "@/lib/api";
import { listDestinations, nearbyDestinations } from "@/server/places";

export const GET = handler(async (req: Request) => {
  const url = new URL(req.url);
  const lng = url.searchParams.get("lng");
  const lat = url.searchParams.get("lat");

  // Nearby search is the PostGIS path; everything else is FTS + trigram.
  if (lng && lat) {
    const radius = Number(url.searchParams.get("radius") ?? 150_000);
    return ok({ items: await nearbyDestinations(Number(lng), Number(lat), radius) });
  }

  return ok({ items: await listDestinations({ q: url.searchParams.get("q") ?? undefined }) });
});
