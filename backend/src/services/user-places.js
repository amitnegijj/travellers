// A traveller's personal map: places they've been or discovered.
// Privacy rule, enforced here and nowhere else: a private pin is returned only
// to its owner. Every read takes an explicit viewerId.
import { AppError } from "../lib/http.js";
import { query, queryOne } from "../lib/db.js";

const SELECT = `
  up.id, up.name, up.note, up.photo_url as "photoUrl", up.visibility,
  up.visited_on as "visitedOn",
  st_x(up.location::geometry) as lng, st_y(up.location::geometry) as lat,
  d.slug as "destinationSlug", d.name as "destinationName",
  up.created_at as "createdAt"
`;

/** Pins for one traveller. Private ones only when the viewer is the owner. */
export async function listUserPlaces(handle, viewerId) {
  const owner = await queryOne("select id from profiles where handle = $1", [handle]);
  if (!owner) throw new AppError("not_found", "No such profile");

  const isOwner = viewerId != null && viewerId === owner.id;

  const items = await query(
    `select ${SELECT}
       from user_places up
       left join destinations d on d.id = up.destination_id
      where up.profile_id = $1
        and ($2::boolean or up.visibility = 'public')
      order by up.visited_on desc nulls last, up.created_at desc`,
    [owner.id, isOwner]
  );

  return { items, isOwner, ownerId: owner.id };
}

export async function createUserPlace(profileId, input) {
  return queryOne(
    `insert into user_places
       (profile_id, name, note, location, photo_url, visibility, visited_on, destination_id)
     values ($1,$2,$3,$4,$5,$6,$7,$8)
     returning id, name, note, photo_url as "photoUrl", visibility,
               visited_on as "visitedOn",
               st_x(location::geometry) as lng, st_y(location::geometry) as lat,
               null::text as "destinationSlug", null::text as "destinationName",
               created_at as "createdAt"`,
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

async function assertOwner(placeId, requesterId) {
  const row = await queryOne("select profile_id from user_places where id = $1", [placeId]);
  if (!row) throw new AppError("not_found", "No such place");
  if (row.profile_id !== requesterId) {
    throw new AppError("forbidden", "That pin belongs to someone else");
  }
}

export async function updateUserPlace(placeId, requesterId, patch) {
  await assertOwner(placeId, requesterId);

  return queryOne(
    `update user_places set
       name       = coalesce($2, name),
       note       = coalesce($3, note),
       visibility = coalesce($4::place_visibility, visibility),
       visited_on = coalesce($5::date, visited_on)
     where id = $1
     returning id, name, note, photo_url as "photoUrl", visibility,
               visited_on as "visitedOn",
               st_x(location::geometry) as lng, st_y(location::geometry) as lat,
               null::text as "destinationSlug", null::text as "destinationName",
               created_at as "createdAt"`,
    [
      placeId,
      patch.name?.trim() ?? null,
      patch.note?.trim() ?? null,
      patch.visibility ?? null,
      patch.visitedOn || null,
    ]
  );
}

export async function deleteUserPlace(placeId, requesterId) {
  await assertOwner(placeId, requesterId);
  await query("delete from user_places where id = $1", [placeId]);
}

/**
 * Places implied by the traveller's published journeys — destinations they
 * reached. Shown alongside their own pins so the map isn't empty on day one.
 */
export async function journeyPlaces(handle) {
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
