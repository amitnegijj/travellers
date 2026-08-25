// Destinations & places. Curated/seeded in Phase 1 — no user-created destinations.
import { AppError } from "@/lib/api";
import { query, queryOne } from "@/lib/db";

export type DestinationCard = {
  id: string;
  slug: string;
  name: string;
  region: string | null;
  description: string | null;
  coverUrl: string | null;
  elevationM: number | null;
  bestSeason: string[];
  lng: number;
  lat: number;
  journeyCount: number;
  placeCount: number;
};

const DEST_SELECT = `
  d.id, d.slug, d.name, d.region, d.description, d.cover_url as "coverUrl",
  d.elevation_m as "elevationM", d.best_season as "bestSeason",
  st_x(d.centroid::geometry) as lng, st_y(d.centroid::geometry) as lat,
  (select count(*) from journeys j
    where j.destination_id = d.id and j.status = 'published')::int as "journeyCount",
  (select count(*) from places pl where pl.destination_id = d.id)::int as "placeCount"
`;

export async function listDestinations(opts: { q?: string; limit?: number } = {}) {
  const { q: search, limit = 60 } = opts;
  const params: unknown[] = [];
  let where = "";

  if (search?.trim()) {
    params.push(search.trim());
    where = `where d.search_tsv @@ plainto_tsquery('simple', $1)
                or d.name ilike '%' || $1 || '%'
                or d.region ilike '%' || $1 || '%'`;
  }
  params.push(limit);

  return query<DestinationCard>(
    `select ${DEST_SELECT} from destinations d ${where}
      order by "journeyCount" desc, d.name asc limit $${params.length}`,
    params
  );
}

export async function getDestination(slug: string) {
  const dest = await queryOne<DestinationCard>(
    `select ${DEST_SELECT} from destinations d where d.slug = $1`,
    [slug]
  );
  if (!dest) throw new AppError("not_found", "No such destination");

  const places = await query(
    `select pl.id, pl.slug, pl.name, pl.description, pl.address,
            pl.price_minor as "priceMinor", pl.currency, pl.photo_url as "photoUrl",
            c.slug as "categorySlug", c.name as "categoryName", c.icon as "categoryIcon",
            st_x(pl.location::geometry) as lng, st_y(pl.location::geometry) as lat
       from places pl
       left join place_categories c on c.id = pl.category_id
      where pl.destination_id = $1
      order by pl.name`,
    [dest.id]
  );

  return { ...dest, places };
}

/** Nearby destinations by great-circle distance — the PostGIS payoff. */
export async function nearbyDestinations(lng: number, lat: number, radiusM = 150_000) {
  return query(
    `select ${DEST_SELECT},
            st_distance(d.centroid, st_point($1,$2)::geography)::int as "distanceM"
       from destinations d
      where st_dwithin(d.centroid, st_point($1,$2)::geography, $3)
      order by "distanceM" asc limit 20`,
    [lng, lat, radiusM]
  );
}

/** Everything with coordinates, for the map page. */
export async function mapFeatures() {
  const [destinations, places] = await Promise.all([
    query(
      `select d.id, d.slug, d.name, d.region,
              st_x(d.centroid::geometry) as lng, st_y(d.centroid::geometry) as lat,
              (select count(*) from journeys j
                where j.destination_id = d.id and j.status='published')::int as "journeyCount"
         from destinations d`
    ),
    query(
      `select pl.id, pl.slug, pl.name, c.slug as "categorySlug",
              st_x(pl.location::geometry) as lng, st_y(pl.location::geometry) as lat
         from places pl left join place_categories c on c.id = pl.category_id`
    ),
  ]);
  return { destinations, places };
}

export async function listCategories() {
  return query(`select id, slug, name, icon from place_categories order by name`);
}

/** Cross-entity search used by the Explore page. */
export async function searchAll(q: string) {
  const term = q.trim();
  if (!term) return { destinations: [], places: [], profiles: [] };

  const [destinations, places, profiles] = await Promise.all([
    query(
      `select ${DEST_SELECT} from destinations d
        where d.search_tsv @@ plainto_tsquery('simple', $1)
           or d.name ilike '%' || $1 || '%'
        order by "journeyCount" desc limit 8`,
      [term]
    ),
    query(
      `select pl.id, pl.slug, pl.name, pl.description,
              d.slug as "destinationSlug", d.name as "destinationName"
         from places pl left join destinations d on d.id = pl.destination_id
        where pl.name ilike '%' || $1 || '%'
        order by pl.name limit 8`,
      [term]
    ),
    query(
      `select p.id, p.handle, p.display_name as "displayName",
              p.avatar_url as "avatarUrl", p.bio
         from profiles p
        where p.handle ilike '%' || $1 || '%' or p.display_name ilike '%' || $1 || '%'
        limit 8`,
      [term]
    ),
  ]);

  return { destinations, places, profiles };
}
