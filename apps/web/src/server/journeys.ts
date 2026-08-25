// Journey use-cases. The ONLY place journeys are written.
// RSC pages and /api/v1 route handlers both call through here.
import { AppError, type Cursor } from "@/lib/api";
import { query, queryOne, transaction } from "@/lib/db";
import type { JourneyCreateInput } from "@/lib/validation";

export type JourneyCard = {
  id: string;
  title: string;
  summary: string | null;
  coverUrl: string | null;
  originName: string | null;
  destinationName: string | null;
  destinationSlug: string | null;
  distanceM: number | null;
  durationMin: number | null;
  startDate: string | null;
  endDate: string | null;
  travelStyle: string | null;
  difficulty: string | null;
  totalExpenseMinor: string;
  currency: string;
  publishedAt: string;
  authorHandle: string;
  authorName: string;
  authorAvatar: string | null;
  likeCount: number;
  saveCount: number;
  commentCount: number;
  viewCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
};

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

export type FeedOptions = {
  viewerId?: string | null;
  cursor?: Cursor | null;
  limit?: number;
  /** 'all' = everything public, 'following' = only people the viewer follows */
  scope?: "all" | "following";
  authorHandle?: string;
  destinationSlug?: string;
  savedBy?: string;
  q?: string;
};

export async function listJourneys(opts: FeedOptions = {}) {
  const {
    viewerId = null, cursor = null, limit = 12,
    scope = "all", authorHandle, destinationSlug, savedBy, q,
  } = opts;

  const params: unknown[] = [viewerId];
  const where: string[] = ["j.status = 'published'", "j.visibility = 'public'"];

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
  if (q && q.trim()) {
    params.push(q.trim());
    const i = params.length;
    where.push(`(j.search_tsv @@ plainto_tsquery('simple', $${i})
                 or j.title ilike '%' || $${i} || '%'
                 or j.destination_name ilike '%' || $${i} || '%')`);
  }

  params.push(limit + 1);

  const rows = await query<JourneyCard>(
    `select ${CARD_SELECT} ${CARD_FROM}
      where ${where.join(" and ")}
      order by j.published_at desc, j.id desc
      limit $${params.length}`,
    params
  );

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];

  return {
    items,
    nextCursor: hasMore && last ? { ts: new Date(last.publishedAt).toISOString(), id: last.id } : null,
  };
}

export async function getJourney(id: string, viewerId: string | null) {
  const journey = await queryOne<
    JourneyCard & {
      authorId: string;
      authorBio: string | null;
      vehicle: string | null;
      bestSeason: string[];
      status: string;
      route: { type: string; coordinates: [number, number][] } | null;
      originPoint: { coordinates: [number, number] } | null;
      destinationPoint: { coordinates: [number, number] } | null;
    }
  >(
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

  if (!journey) throw new AppError("not_found", "No such journey");
  if (journey.status !== "published" && journey.authorId !== viewerId) {
    throw new AppError("not_found", "No such journey");
  }

  const [stops, expenses, tips, media] = await Promise.all([
    query(
      `select id, position, name, note, arrived_on as "arrivedOn",
              st_asgeojson(location)::json as location
         from journey_stops where journey_id = $1 order by position`,
      [id]
    ),
    query(
      `select id, category, label, amount_minor as "amountMinor", currency,
              spent_on as "spentOn"
         from journey_expenses where journey_id = $1 order by spent_on nulls last, created_at`,
      [id]
    ),
    query(`select id, kind, body from journey_tips where journey_id = $1 order by created_at`, [id]),
    query(
      `select m.id, m.url, m.width, m.height
         from journey_media jm join media m on m.id = jm.media_id
        where jm.journey_id = $1 order by jm.position`,
      [id]
    ),
  ]);

  return { ...journey, stops, expenses, tips, media };
}

export async function incrementView(id: string) {
  await query("update journey_stats set view_count = view_count + 1 where journey_id = $1", [id]);
}

/** Rough authoring-progress score. Drives the "how complete is this?" nudges. */
function completenessOf(input: Partial<JourneyCreateInput>) {
  const checks = [
    !!input.title,
    !!input.summary,
    !!input.originName,
    !!input.destinationName,
    input.distanceM != null,
    input.durationMin != null,
    !!input.startDate,
    (input.stops?.length ?? 0) > 0,
    (input.expenses?.length ?? 0) > 0,
    (input.tips?.length ?? 0) > 0,
    (input.mediaIds?.length ?? 0) > 0,
    !!input.travelStyle,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

const pointOf = (c?: { lng: number; lat: number } | null) =>
  c ? `SRID=4326;POINT(${c.lng} ${c.lat})` : null;

export async function createJourney(authorId: string, input: JourneyCreateInput) {
  return transaction(async (q) => {
    // A straight origin -> stops -> destination line is a good enough simplified
    // route until real GPS tracks arrive with the mobile app.
    const path: [number, number][] = [];
    if (input.origin) path.push([input.origin.lng, input.origin.lat]);
    for (const s of input.stops) if (s.lng != null && s.lat != null) path.push([s.lng, s.lat]);
    if (input.destination) path.push([input.destination.lng, input.destination.lat]);
    const route =
      path.length >= 2
        ? `SRID=4326;LINESTRING(${path.map(([lng, lat]) => `${lng} ${lat}`).join(", ")})`
        : null;

    const [journey] = (await q(
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
        completenessOf(input),
      ]
    )) as { id: string }[];

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

export async function updateJourney(
  journeyId: string,
  authorId: string,
  input: Partial<JourneyCreateInput>
) {
  const existing = await queryOne<{ author_id: string; status: string }>(
    "select author_id, status from journeys where id = $1",
    [journeyId]
  );
  if (!existing) throw new AppError("not_found", "No such journey");
  if (existing.author_id !== authorId) {
    throw new AppError("forbidden", "You can only edit your own journeys");
  }

  return transaction(async (q) => {
    await q(
      `update journeys set
         title            = coalesce($2, title),
         summary          = coalesce($3, summary),
         cover_url        = coalesce($4, cover_url),
         origin_name      = coalesce($5, origin_name),
         destination_name = coalesce($6, destination_name),
         distance_m       = coalesce($7, distance_m),
         duration_min     = coalesce($8, duration_min),
         start_date       = coalesce($9, start_date),
         end_date         = coalesce($10, end_date),
         travel_style     = coalesce($11, travel_style),
         difficulty       = coalesce($12, difficulty),
         vehicle          = coalesce($13, vehicle),
         status           = case when $14::boolean then 'published'::journey_status else status end,
         published_at     = case when $14::boolean and published_at is null then now() else published_at end,
         completeness     = $15
       where id = $1`,
      [
        journeyId, input.title ?? null, input.summary ?? null, input.coverUrl ?? null,
        input.originName ?? null, input.destinationName ?? null,
        input.distanceM ?? null, input.durationMin ?? null,
        input.startDate || null, input.endDate || null,
        input.travelStyle ?? null, input.difficulty ?? null, input.vehicle ?? null,
        input.publish ?? false, completenessOf(input),
      ]
    );

    // Children are replace-on-write; the published snapshot preserves history.
    if (input.stops || input.expenses || input.tips || input.mediaIds) {
      await q("delete from journey_stops where journey_id = $1", [journeyId]);
      await q("delete from journey_expenses where journey_id = $1", [journeyId]);
      await q("delete from journey_tips where journey_id = $1", [journeyId]);
      await q("delete from journey_media where journey_id = $1", [journeyId]);
      await writeChildren(q, journeyId, input);
    }

    if (input.publish) {
      const [{ next }] = (await q(
        `select coalesce(max(version), 0) + 1 as next
           from journey_versions where journey_id = $1`,
        [journeyId]
      )) as { next: number }[];
      await q(
        "insert into journey_versions (journey_id, version, snapshot) values ($1,$2,$3)",
        [journeyId, next, JSON.stringify({ title: input.title, summary: input.summary })]
      );
    }

    return journeyId;
  });
}

async function writeChildren(
  q: (text: string, params?: unknown[]) => Promise<unknown[]>,
  journeyId: string,
  input: Partial<JourneyCreateInput>
) {
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
      [journeyId, input.mediaIds![0]]
    );
  }
}

export async function deleteJourney(journeyId: string, authorId: string) {
  const existing = await queryOne<{ author_id: string }>(
    "select author_id from journeys where id = $1",
    [journeyId]
  );
  if (!existing) throw new AppError("not_found", "No such journey");
  if (existing.author_id !== authorId) throw new AppError("forbidden", "Not your journey");
  await query("delete from journeys where id = $1", [journeyId]);
}
