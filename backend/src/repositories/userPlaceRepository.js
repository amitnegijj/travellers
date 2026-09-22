// Personal map pins.
//
// The visibility filter is applied here, in SQL, rather than by the caller —
// a private pin must never be selected for anyone but its owner, so filtering
// it out later in JavaScript would already be too late.
import { query, queryOne } from "../config/database.js";

const SELECT = `
  up.id, up.name, up.note, up.photo_url as "photoUrl", up.visibility,
  up.visited_on as "visitedOn",
  st_x(up.location::geometry) as lng, st_y(up.location::geometry) as lat,
  d.slug as "destinationSlug", d.name as "destinationName",
  up.created_at as "createdAt"
`;

const RETURNING = `
  id, name, note, photo_url as "photoUrl", visibility,
  visited_on as "visitedOn",
  st_x(location::geometry) as lng, st_y(location::geometry) as lat,
  null::text as "destinationSlug", null::text as "destinationName",
  created_at as "createdAt"
`;

export async function listForOwner(ownerId, includePrivate) {
  return query(
    `select ${SELECT}
       from user_places up
       left join destinations d on d.id = up.destination_id
      where up.profile_id = $1
        and ($2::boolean or up.visibility = 'public')
      order by up.visited_on desc nulls last, up.created_at desc`,
    [ownerId, includePrivate]
  );
}

export async function insert(profileId, input) {
  return queryOne(
    `insert into user_places
       (profile_id, name, note, location, photo_url, visibility, visited_on, destination_id)
     values ($1,$2,$3,$4,$5,$6,$7,$8)
     returning ${RETURNING}`,
    [
      profileId,
      input.name.trim(),
      input.note?.trim() || null,
      `SRID=4326;POINT(${input.lng} ${input.lat})`,
      input.photoUrl || null,
      input.visibility,
      input.visitedOn || null,
      input.destinationId || null,
    ]
  );
}

export async function findOwnerId(placeId) {
  return queryOne("select profile_id from user_places where id = $1", [placeId]);
}

export async function update(placeId, patch) {
  return queryOne(
    `update user_places set
       name       = coalesce($2, name),
       note       = coalesce($3, note),
       visibility = coalesce($4::place_visibility, visibility),
       visited_on = coalesce($5::date, visited_on)
     where id = $1
     returning ${RETURNING}`,
    [
      placeId,
      patch.name?.trim() ?? null,
      patch.note?.trim() ?? null,
      patch.visibility ?? null,
      patch.visitedOn || null,
    ]
  );
}

export async function remove(placeId) {
  await query("delete from user_places where id = $1", [placeId]);
}

/**
 * Destinations the traveller actually reached on published journeys. Shown
 * alongside their own pins so the map isn't empty on day one.
 */
export async function listJourneyPlaces(handle) {
  return query(
    `select d.id, d.name, d.slug,
            st_x(d.centroid::geometry) as lng, st_y(d.centroid::geometry) as lat,
            count(*)::int as "journeyCount"
       from journeys j
       join profiles p on p.id = j.author_id and p.handle = $1
       join destinations d on d.id = j.destination_id
      where j.status = 'published'
      group by d.id, d.name, d.slug, d.centroid`,
    [handle]
  );
}
