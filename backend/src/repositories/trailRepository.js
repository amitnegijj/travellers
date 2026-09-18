// The immersive feed's extra reads.
//
// A trail card needs its stops, its photos and its spend breakdown up front,
// so these are batched across the whole page by id rather than fetched per
// journey — four queries for a screen instead of four per card.
import { query } from "../config/database.js";

export async function findTrailDetails(journeyIds) {
  const [stops, photos, categories, tips] = await Promise.all([
    query(
      `select journey_id as "journeyId", id, position, name, note,
              arrived_on as "arrivedOn",
              st_x(location::geometry) as lng, st_y(location::geometry) as lat
         from journey_stops
        where journey_id = any($1::uuid[])
        order by journey_id, position`,
      [journeyIds]
    ),
    query(
      `select jm.journey_id as "journeyId", m.url
         from journey_media jm join media m on m.id = jm.media_id
        where jm.journey_id = any($1::uuid[])
        order by jm.journey_id, jm.position`,
      [journeyIds]
    ),
    // Biggest spend category per journey — the headline stat on the card.
    query(
      `select distinct on (journey_id)
              journey_id as "journeyId", category
         from journey_expenses
        where journey_id = any($1::uuid[])
        group by journey_id, category
        order by journey_id, sum(amount_minor) desc`,
      [journeyIds]
    ),
    query(
      `select journey_id as "journeyId", count(*)::int as count
         from journey_tips where journey_id = any($1::uuid[])
        group by journey_id`,
      [journeyIds]
    ),
  ]);

  return { stops, photos, categories, tips };
}
