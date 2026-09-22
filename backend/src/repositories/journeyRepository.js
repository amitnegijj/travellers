// The journey aggregate: the journey row plus its stops, expenses, tips,
// media links and version snapshots.
//
// Those children are written in the same transaction as their parent, so they
// live in one repository rather than five — splitting them would push the
// transaction boundary across files for no benefit.
import { query, queryOne, transaction } from "../config/database.js";

const CARD_SELECT = `
  j.id, j.title, j.summary, j.cover_url as "coverUrl",
  j.origin_name as "originName", j.destination_name as "destinationName",
  d.slug as "destinationSlug",
  j.distance_m as "distanceM", j.duration_min as "durationMin",
  j.start_date as "startDate", j.end_date as "endDate",
  j.travel_style as "travelStyle", j.difficulty,
  j.total_expense_minor as "totalExpenseMinor", j.currency,
  j.published_at as "publishedAt",
  p.handle as "authorHandle", p.display_name as "authorName", p.avatar_url as "authorAvatar",
  s.like_count as "likeCount", s.save_count as "saveCount",
  s.comment_count as "commentCount", s.view_count as "viewCount",
  case when $1::uuid is null then false
       else exists (select 1 from likes l where l.journey_id = j.id and l.profile_id = $1::uuid)
  end as "likedByMe",
  case when $1::uuid is null then false
       else exists (select 1 from saves sv where sv.journey_id = j.id and sv.profile_id = $1::uuid)
  end as "savedByMe"
`;

const CARD_FROM = `
  from journeys j
  join profiles p on p.id = j.author_id
  join journey_stats s on s.journey_id = j.id
  left join destinations d on d.id = j.destination_id
`;

const pointOf = (c) => (c ? `SRID=4326;POINT(${c.lng} ${c.lat})` : null);

/* --------------------------------------------------------------- feed reads */

/**
 * One page of the public feed, plus one extra row so the caller can tell
 * whether another page exists without a second count query.
 */
export async function findFeedRows(opts = {}) {
  const {
    viewerId = null, cursor = null, limit = 12,
    scope = "all", authorHandle, destinationSlug, savedBy, q: search,
  } = opts;

  const params = [viewerId];
  const where = ["j.status = 'published'", "j.visibility = 'public'"];

  if (cursor) {
    params.push(cursor.ts, cursor.id);
    where.push(`(j.published_at, j.id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`);
  }
  if (scope === "following" && viewerId) {
    where.push(`j.author_id in (select following_id from follows where follower_id = $1::uuid)`);
  }
  if (authorHandle) {
    params.push(authorHandle);
    where.push(`p.handle = $${params.length}`);
  }
  if (destinationSlug) {
    params.push(destinationSlug);
    where.push(`d.slug = $${params.length}`);
  }
  if (savedBy) {
    params.push(savedBy);
    where.push(`exists (select 1 from saves sv
                         where sv.journey_id = j.id and sv.profile_id = $${params.length}::uuid)`);
  }
  if (search && search.trim()) {
    params.push(search.trim());
    const i = params.length;
    where.push(`(j.search_tsv @@ plainto_tsquery('simple', $${i})
                 or j.title ilike '%' || $${i} || '%'
                 or j.destination_name ilike '%' || $${i} || '%')`);
  }

  params.push(limit + 1);

  return query(
    `select ${CARD_SELECT} ${CARD_FROM}
      where ${where.join(" and ")}
      order by j.published_at desc, j.id desc
      limit $${params.length}`,
    params
  );
}

export async function findById(id, viewerId) {
  return queryOne(
    `select ${CARD_SELECT},
            j.author_id as "authorId", p.bio as "authorBio",
            j.vehicle, j.best_season as "bestSeason", j.status,
            st_asgeojson(j.route_simplified)::json  as route,
            st_asgeojson(j.origin_point)::json      as "originPoint",
            st_asgeojson(j.destination_point)::json as "destinationPoint"
       ${CARD_FROM}
      where j.id = $2`,
    [viewerId, id]
  );
}

export async function findChildren(journeyId) {
  const [stops, expenses, tips, media] = await Promise.all([
    query(
      `select id, position, name, note, arrived_on as "arrivedOn",
              st_asgeojson(location)::json as location
         from journey_stops where journey_id = $1 order by position`,
      [journeyId]
    ),
    query(
      `select id, category, label, amount_minor as "amountMinor", currency,
              spent_on as "spentOn"
         from journey_expenses where journey_id = $1 order by spent_on nulls last, created_at`,
      [journeyId]
    ),
    query(`select id, kind, body from journey_tips where journey_id = $1 order by created_at`, [
      journeyId,
    ]),
    query(
      `select m.id, m.url, m.width, m.height
         from journey_media jm join media m on m.id = jm.media_id
        where jm.journey_id = $1 order by jm.position`,
      [journeyId]
    ),
  ]);

  return { stops, expenses, tips, media };
}

export async function incrementViewCount(journeyId) {
  await query("update journey_stats set view_count = view_count + 1 where journey_id = $1", [
    journeyId,
  ]);
}

export async function existsById(journeyId) {
  return queryOne("select 1 from journeys where id = $1", [journeyId]);
}

export async function findAuthorId(journeyId) {
  return queryOne("select author_id from journeys where id = $1", [journeyId]);
}

/* -------------------------------------------------------------- child writes */

async function writeChildren(q, journeyId, input) {
  for (const [i, s] of (input.stops ?? []).entries()) {
    await q(
      `insert into journey_stops (journey_id, position, name, note, location, arrived_on)
       values ($1,$2,$3,$4,$5,$6)`,
      [journeyId, i, s.name, s.note ?? null,
       s.lng != null && s.lat != null ? `SRID=4326;POINT(${s.lng} ${s.lat})` : null,
       s.arrivedOn || null]
    );
  }
  for (const e of input.expenses ?? []) {
    await q(
      `insert into journey_expenses (journey_id, category, label, amount_minor, spent_on)
       values ($1,$2,$3,$4,$5)`,
      [journeyId, e.category, e.label ?? null, e.amountMinor, e.spentOn || null]
    );
  }
  for (const t of input.tips ?? []) {
    await q("insert into journey_tips (journey_id, kind, body) values ($1,$2,$3)", [
      journeyId, t.kind, t.body,
    ]);
  }
  for (const [i, mediaId] of (input.mediaIds ?? []).entries()) {
    await q(
      `insert into journey_media (journey_id, media_id, position) values ($1,$2,$3)
       on conflict do nothing`,
      [journeyId, mediaId, i]
    );
  }
  if ((input.mediaIds ?? []).length && !input.coverUrl) {
    await q(
      `update journeys set cover_url = (select url from media where id = $2) where id = $1`,
      [journeyId, input.mediaIds[0]]
    );
  }
}

/* -------------------------------------------------------------------- create */

export async function createWithChildren({ authorId, input, route, completeness }) {
  return transaction(async (q) => {
    const [journey] = await q(
      `insert into journeys (
         author_id, title, summary, cover_url,
         origin_name, origin_point, destination_name, destination_point, destination_id,
         route_simplified, distance_m, duration_min, start_date, end_date,
         travel_style, difficulty, vehicle, best_season,
         status, published_at, completeness)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,
               $19::journey_status,
               case when $19::journey_status = 'published' then now() else null end,
               $20)
       returning id`,
      [
        authorId, input.title, input.summary ?? null, input.coverUrl ?? null,
        input.originName ?? null, pointOf(input.origin),
        input.destinationName ?? null, pointOf(input.destination), input.destinationId ?? null,
        route, input.distanceM ?? null, input.durationMin ?? null,
        input.startDate || null, input.endDate || null,
        input.travelStyle ?? null, input.difficulty ?? null, input.vehicle ?? null,
        input.bestSeason ?? [],
        input.publish ? "published" : "draft",
        completeness,
      ]
    );

    await writeChildren(q, journey.id, input);

    if (input.publish) {
      await q(
        `insert into journey_versions (journey_id, version, snapshot)
         values ($1, 1, $2)`,
        [journey.id, JSON.stringify({ title: input.title, summary: input.summary })]
      );
    }

    return journey.id;
  });
}

/* -------------------------------------------------------------------- update */

/** Current values plus child counts — what the service needs to grade an edit. */
export async function findSnapshotForUpdate(journeyId) {
  return queryOne(
    `select j.author_id as "authorId", j.status, j.title, j.summary,
            j.origin_name as "originName", j.destination_name as "destinationName",
            j.distance_m as "distanceM", j.duration_min as "durationMin",
            j.start_date as "startDate", j.travel_style as "travelStyle",
            (select count(*) from journey_stops    x where x.journey_id = j.id)::int as "stopCount",
            (select count(*) from journey_expenses x where x.journey_id = j.id)::int as "expenseCount",
            (select count(*) from journey_tips     x where x.journey_id = j.id)::int as "tipCount",
            (select count(*) from journey_media    x where x.journey_id = j.id)::int as "mediaCount"
       from journeys j where j.id = $1`,
    [journeyId]
  );
}

// Only columns actually present in the patch are written, so an edit that
// clears a field really clears it — `coalesce` would silently keep the old
// value and make "remove my vehicle" impossible.
const PATCHABLE_COLUMNS = {
  title: "title",
  summary: "summary",
  coverUrl: "cover_url",
  originName: "origin_name",
  destinationName: "destination_name",
  destinationId: "destination_id",
  distanceM: "distance_m",
  durationMin: "duration_min",
  startDate: "start_date",
  endDate: "end_date",
  travelStyle: "travel_style",
  difficulty: "difficulty",
  vehicle: "vehicle",
  bestSeason: "best_season",
};

export async function updateWithChildren({ journeyId, input, completeness, snapshot }) {
  const sets = [];
  const params = [journeyId];

  for (const [key, column] of Object.entries(PATCHABLE_COLUMNS)) {
    if (!(key in input)) continue;
    const value = input[key];
    params.push(value === "" ? null : (value ?? null));
    sets.push(`${column} = $${params.length}`);
  }

  if ("origin" in input) {
    params.push(pointOf(input.origin));
    sets.push(`origin_point = $${params.length}`);
  }
  if ("destination" in input) {
    params.push(pointOf(input.destination));
    sets.push(`destination_point = $${params.length}`);
  }

  params.push(completeness);
  sets.push(`completeness = $${params.length}`);

  params.push(input.publish ?? false);
  const publishParam = `$${params.length}::boolean`;
  sets.push(`status = case when ${publishParam} then 'published'::journey_status else status end`);
  sets.push(
    `published_at = case when ${publishParam} and published_at is null then now() else published_at end`
  );

  return transaction(async (q) => {
    await q(`update journeys set ${sets.join(", ")} where id = $1`, params);

    // Children are replace-on-write; the published snapshot preserves history.
    if (input.stops || input.expenses || input.tips || input.mediaIds) {
      await q("delete from journey_stops where journey_id = $1", [journeyId]);
      await q("delete from journey_expenses where journey_id = $1", [journeyId]);
      await q("delete from journey_tips where journey_id = $1", [journeyId]);
      await q("delete from journey_media where journey_id = $1", [journeyId]);
      await writeChildren(q, journeyId, input);
    }

    // Re-derive the simplified route whenever the shape of the trip moved.
    if ("stops" in input || "origin" in input || "destination" in input) {
      await q(
        `update journeys j set route_simplified = sub.line
           from (
             select st_makeline(pt order by ord)::geography as line
               from (
                 select 0 as ord, origin_point::geometry as pt from journeys where id = $1
                 union all
                 select position + 1, location::geometry from journey_stops where journey_id = $1
                 union all
                 select 1000000, destination_point::geometry from journeys where id = $1
               ) pts
              where pt is not null
           ) sub
          where j.id = $1 and st_numpoints(sub.line::geometry) >= 2`,
        [journeyId]
      );
    }

    if (input.publish) {
      const [{ next }] = await q(
        `select coalesce(max(version), 0) + 1 as next
           from journey_versions where journey_id = $1`,
        [journeyId]
      );
      await q(
        "insert into journey_versions (journey_id, version, snapshot) values ($1,$2,$3)",
        [journeyId, next, JSON.stringify(snapshot)]
      );
    }

    return journeyId;
  });
}

export async function deleteById(journeyId) {
  await query("delete from journeys where id = $1", [journeyId]);
}

/* ---------------------------------------------------------- author's own view */

export async function listByAuthor(authorId) {
  return query(
    `select j.id, j.title, j.summary, j.cover_url as "coverUrl",
            j.origin_name as "originName", j.destination_name as "destinationName",
            j.start_date as "startDate", j.end_date as "endDate",
            j.status, j.completeness,
            j.total_expense_minor as "totalExpenseMinor",
            coalesce(j.updated_at, j.created_at) as "updatedAt",
            j.published_at as "publishedAt",
            coalesce(s.like_count, 0)    as "likeCount",
            coalesce(s.comment_count, 0) as "commentCount",
            coalesce(s.view_count, 0)    as "viewCount"
       from journeys j
       left join journey_stats s on s.journey_id = j.id
      where j.author_id = $1
      order by coalesce(j.updated_at, j.created_at) desc`,
    [authorId]
  );
}

export async function findForEdit(journeyId) {
  return queryOne(
    `select j.author_id as "authorId", j.title, j.summary, j.cover_url as "coverUrl",
            j.origin_name as "originName", j.destination_name as "destinationName",
            j.destination_id as "destinationId",
            j.distance_m as "distanceM", j.duration_min as "durationMin",
            j.start_date as "startDate", j.end_date as "endDate",
            j.travel_style as "travelStyle", j.difficulty, j.vehicle, j.status,
            st_x(j.origin_point::geometry) as "originLng",
            st_y(j.origin_point::geometry) as "originLat"
       from journeys j where j.id = $1`,
    [journeyId]
  );
}

/** The children reshaped for the composer form rather than for display. */
export async function findChildrenForEdit(journeyId) {
  const [stops, expenses, tips, media] = await Promise.all([
    query(
      `select name, note, arrived_on as "arrivedOn",
              st_x(location::geometry) as lng, st_y(location::geometry) as lat
         from journey_stops where journey_id = $1 order by position`,
      [journeyId]
    ),
    query(
      `select category, label, amount_minor as "amountMinor", spent_on as "spentOn"
         from journey_expenses where journey_id = $1 order by spent_on nulls last, created_at`,
      [journeyId]
    ),
    query("select kind, body from journey_tips where journey_id = $1 order by created_at", [
      journeyId,
    ]),
    query(
      `select m.id, m.url
         from journey_media jm join media m on m.id = jm.media_id
        where jm.journey_id = $1 order by jm.position`,
      [journeyId]
    ),
  ]);

  return { stops, expenses, tips, media };
}
