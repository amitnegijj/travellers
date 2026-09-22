// The immersive feed. Each journey becomes one full-screen "trail" the viewer
// scrubs horizontally, stop by stop, so a card needs its stops, its photos and
// its spend breakdown up front.
import * as trailRepository from "../repositories/trailRepository.js";
import { listJourneys } from "./journeyService.js";

const DEFAULT_TRAIL_LIMIT = 8;

function groupBy(rows, key, pick) {
  const map = new Map();
  for (const row of rows) {
    const list = map.get(row[key]) ?? [];
    list.push(pick(row));
    map.set(row[key], list);
  }
  return map;
}

export async function listTrails(opts = {}) {
  const { items, nextCursor } = await listJourneys({
    ...opts,
    limit: opts.limit ?? DEFAULT_TRAIL_LIMIT,
  });
  if (items.length === 0) return { items: [], nextCursor };

  const ids = items.map((j) => j.id);
  const { stops, photos, categories, tips } = await trailRepository.findTrailDetails(ids);

  const photosBy = groupBy(photos, "journeyId", (p) => p.url);
  const stopsBy = groupBy(stops, "journeyId", (s) => ({ ...s, photoUrl: null, spentSoFarMinor: 0 }));
  const categoryBy = new Map(categories.map((c) => [c.journeyId, c.category]));
  const tipsBy = new Map(tips.map((t) => [t.journeyId, t.count]));

  return {
    nextCursor,
    items: items.map((j) => {
      const gallery = photosBy.get(j.id) ?? [];
      const raw = stopsBy.get(j.id) ?? [];
      const total = Number(j.totalExpenseMinor ?? 0);

      // Spend is recorded per journey, not per stop. Distributing it evenly
      // along the route is honest enough for a scrub meter and reads as a
      // trip "burning" money as it moves — the real per-stop split arrives
      // when the composer asks for it.
      const withStop = raw.map((s, i) => ({
        ...s,
        photoUrl: gallery[i % Math.max(gallery.length, 1)] ?? j.coverUrl,
        spentSoFarMinor: raw.length ? Math.round((total * (i + 1)) / raw.length) : total,
      }));

      return {
        ...j,
        stops: withStop,
        photos: gallery.length ? gallery : j.coverUrl ? [j.coverUrl] : [],
        topCategory: categoryBy.get(j.id) ?? null,
        tipCount: tipsBy.get(j.id) ?? 0,
      };
    }),
  };
}
