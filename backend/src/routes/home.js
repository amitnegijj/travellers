// Small aggregate endpoints for the home feed's side panels.
//
// In the original Next.js app these were async server components that queried
// the database directly while rendering (home-rail.tsx, stories-rail.tsx, and
// two inline components in the home page itself). A browser can't do that, so
// each one becomes its own endpoint here, called from the matching React
// component on mount — same query, same shape, just over HTTP.
import { Router } from "express";
import { query } from "../lib/db.js";
import { asyncHandler, ok } from "../lib/http.js";

const router = Router();

router.get(
  "/rail",
  asyncHandler(async (req, res) => {
    const [topDestinations, topTravellers, cheapest] = await Promise.all([
      query(
        `select d.slug, d.name, d.region, d.cover_url as "coverUrl",
                (select count(*) from journeys j
                  where j.destination_id = d.id and j.status='published')::int as "journeyCount"
           from destinations d
          order by "journeyCount" desc, d.name
          limit 4`
      ),
      query(
        `select p.handle, p.display_name as "displayName", p.avatar_url as "avatarUrl",
                (select count(*) from journeys j
                  where j.author_id = p.id and j.status='published')::int as "journeyCount"
           from profiles p
          order by "journeyCount" desc
          limit 4`
      ),
      query(
        `select j.id, j.title, j.total_expense_minor as "totalExpenseMinor",
                j.currency, j.cover_url as "coverUrl"
           from journeys j
          where j.status='published' and j.total_expense_minor > 0
          order by j.total_expense_minor asc
          limit 3`
      ),
    ]);

    ok(res, { topDestinations, topTravellers, cheapest });
  })
);

router.get(
  "/stories",
  asyncHandler(async (req, res) => {
    // One row per traveller — their most recent published journey.
    const people = await query(
      `select distinct on (p.id)
              p.handle, p.display_name as "displayName", p.avatar_url as "avatarUrl",
              j.id as "journeyId", j.cover_url as "coverUrl",
              j.destination_name as "destinationName", j.published_at as "publishedAt",
              (j.published_at > now() - interval '7 days') as live
         from journeys j
         join profiles p on p.id = j.author_id
        where j.status = 'published' and j.visibility = 'public'
        order by p.id, j.published_at desc
        limit 24`
    );
    ok(res, { items: people });
  })
);

router.get(
  "/destinations-strip",
  asyncHandler(async (req, res) => {
    const items = await query(
      `select d.slug, d.name, d.region, d.cover_url as "coverUrl",
              (select count(*) from journeys j
                where j.destination_id = d.id and j.status='published')::int as "journeyCount"
         from destinations d
        order by "journeyCount" desc, d.name
        limit 8`
    );
    ok(res, { items });
  })
);

router.get(
  "/community-strip",
  asyncHandler(async (req, res) => {
    const items = await query(
      `select p.handle, p.display_name as "displayName", p.avatar_url as "avatarUrl", p.location,
              (select count(*) from journeys j
                where j.author_id = p.id and j.status='published')::int as "journeyCount"
         from profiles p order by "journeyCount" desc limit 8`
    );
    ok(res, { items });
  })
);

export default router;
