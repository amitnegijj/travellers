// Destinations, the places inside them, and the category reference table.
// Curated/seeded in Phase 1 — there are no user-created destinations.
import { query, queryOne } from "../config/database.js";

const DEST_SELECT = `
  d.id, d.slug, d.name, d.region, d.description, d.cover_url as "coverUrl",
  d.elevation_m as "elevationM", d.best_season as "bestSeason",
  st_x(d.centroid::geometry) as lng, st_y(d.centroid::geometry) as lat,
  (select count(*) from journeys j
    where j.destination_id = d.id and j.status = 'published')::int as "journeyCount",
  (select count(*) from places pl where pl.destination_id = d.id)::int as "placeCount"
`;

export async function findAll({ search, limit = 60 } = {}) {
  const params = [];
  let where = "";

  if (search?.trim()) {
    params.push(search.trim());
    where = `where d.search_tsv @@ plainto_tsquery('simple', $1)
                or d.name ilike '%' || $1 || '%'
                or d.region ilike '%' || $1 || '%'`;
  }
  params.push(limit);

  return query(
    `select ${DEST_SELECT} from destinations d ${where}
      order by "journeyCount" desc, d.name asc limit $${params.length}`,
    params
  );
}

export async function findBySlug(slug) {
  return queryOne(`select ${DEST_SELECT} from destinations d where d.slug = $1`, [slug]);
}

export async function findPlacesByDestinationId(destinationId) {
  return query(
    `select pl.id, pl.slug, pl.name, pl.description, pl.address,
            pl.price_minor as "priceMinor", pl.currency, pl.photo_url as "photoUrl",
            c.slug as "categorySlug", c.name as "categoryName", c.icon as "categoryIcon",
            st_x(pl.location::geometry) as lng, st_y(pl.location::geometry) as lat
       from places pl
       left join place_categories c on c.id = pl.category_id
      where pl.destination_id = $1
      order by pl.name`,
    [destinationId]
  );
}

/** Nearby destinations by great-circle distance — the PostGIS payoff. */
export async function findNearby(lng, lat, radiusM) {
  return query(
    `select ${DEST_SELECT},
            st_distance(d.centroid, st_point($1,$2)::geography)::int as "distanceM"
       from destinations d
      where st_dwithin(d.centroid, st_point($1,$2)::geography, $3)
      order by "distanceM" asc limit 20`,
    [lng, lat, radiusM]
  );
}

/** Coordinate-bearing rows for the map, kept deliberately narrow. */
export async function findAllForMap() {
  return query(
    `select d.id, d.slug, d.name, d.region,
            st_x(d.centroid::geometry) as lng, st_y(d.centroid::geometry) as lat,
            (select count(*) from journeys j
              where j.destination_id = d.id and j.status='published')::int as "journeyCount"
       from destinations d`
  );
}

export async function findPlacesForMap() {
  return query(
    `select pl.id, pl.slug, pl.name, c.slug as "categorySlug",
            st_x(pl.location::geometry) as lng, st_y(pl.location::geometry) as lat
       from places pl left join place_categories c on c.id = pl.category_id`
  );
}

export async function findCategories() {
  return query(`select id, slug, name, icon from place_categories order by name`);
}

export { DEST_SELECT };
