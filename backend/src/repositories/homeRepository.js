// The home screen's side panels.
//
// These were async server components in the Next.js version, each querying
// the database while it rendered. A browser can't do that, so each panel is
// now its own endpoint — same queries, same shapes, just over HTTP.
import { query } from "../config/database.js";

export async function findTopDestinations(limit) {
  return query(
    `select d.slug, d.name, d.region, d.cover_url as "coverUrl",
            (select count(*) from journeys j
              where j.destination_id = d.id and j.status='published')::int as "journeyCount"
       from destinations d
      order by "journeyCount" desc, d.name
      limit $1`,
    [limit]
  );
}

export async function findTopTravellers(limit) {
  return query(
    `select p.handle, p.display_name as "displayName", p.avatar_url as "avatarUrl",
            (select count(*) from journeys j
              where j.author_id = p.id and j.status='published')::int as "journeyCount"
       from profiles p
      order by "journeyCount" desc
      limit $1`,
    [limit]
  );
}

export async function findCheapestJourneys(limit) {
  return query(
    `select j.id, j.title, j.total_expense_minor as "totalExpenseMinor",
            j.currency, j.cover_url as "coverUrl"
       from journeys j
      where j.status='published' and j.total_expense_minor > 0
      order by j.total_expense_minor asc
      limit $1`,
    [limit]
  );
}

/** One row per traveller — their most recent published journey. */
export async function findStories(limit) {
  return query(
    `select distinct on (p.id)
            p.handle, p.display_name as "displayName", p.avatar_url as "avatarUrl",
            j.id as "journeyId", j.cover_url as "coverUrl",
            j.destination_name as "destinationName", j.published_at as "publishedAt",
            (j.published_at > now() - interval '7 days') as live
       from journeys j
       join profiles p on p.id = j.author_id
      where j.status = 'published' and j.visibility = 'public'
      order by p.id, j.published_at desc
      limit $1`,
    [limit]
  );
}

export async function findCommunityStrip(limit) {
  return query(
    `select p.handle, p.display_name as "displayName", p.avatar_url as "avatarUrl", p.location,
            (select count(*) from journeys j
              where j.author_id = p.id and j.status='published')::int as "journeyCount"
       from profiles p order by "journeyCount" desc limit $1`,
    [limit]
  );
}
