import { Bookmark, Compass, Flame, MapPin, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { Avatar, Card, Photo } from "@/components/ui";
import { query } from "@/lib/db";
import { formatMoney } from "@/lib/utils";

/**
 * Right-hand rail on desktop. Everything here is a real query — no placeholders.
 */
export async function HomeRail() {
  const [topDestinations, topTravellers, cheapest] = await Promise.all([
    query<{ slug: string; name: string; region: string | null; coverUrl: string | null; journeyCount: number }>(
      `select d.slug, d.name, d.region, d.cover_url as "coverUrl",
              (select count(*) from journeys j
                where j.destination_id = d.id and j.status='published')::int as "journeyCount"
         from destinations d
        order by "journeyCount" desc, d.name
        limit 4`
    ),
    query<{ handle: string; displayName: string; avatarUrl: string | null; journeyCount: number }>(
      `select p.handle, p.display_name as "displayName", p.avatar_url as "avatarUrl",
              (select count(*) from journeys j
                where j.author_id = p.id and j.status='published')::int as "journeyCount"
         from profiles p
        order by "journeyCount" desc
        limit 4`
    ),
    query<{ id: string; title: string; totalExpenseMinor: string; currency: string; coverUrl: string | null }>(
      `select j.id, j.title, j.total_expense_minor as "totalExpenseMinor",
              j.currency, j.cover_url as "coverUrl"
         from journeys j
        where j.status='published' and j.total_expense_minor > 0
        order by j.total_expense_minor asc
        limit 3`
    ),
  ]);

  return (
    <div className="space-y-4">
      {/* ---------------------------------------------------- trending places */}
      <Card className="overflow-hidden p-4">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-extrabold text-[var(--text)]">
          <TrendingUp size={15} className="text-[var(--brand)]" />
          Trending destinations
        </h3>
        <ul className="space-y-2.5">
          {topDestinations.map((d, i) => (
            <li key={d.slug}>
              <Link
                href={`/destinations/${d.slug}`}
                className="flex items-center gap-3 rounded-[var(--radius)] p-1.5 transition-colors hover:bg-[var(--surface-hover)]"
              >
                <span className="w-4 shrink-0 text-center text-sm font-extrabold text-[var(--text-faint)]">
                  {i + 1}
                </span>
                <span className="h-11 w-11 shrink-0 overflow-hidden rounded-[var(--radius-sm)]">
                  <Photo src={d.coverUrl} className="h-full w-full" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold text-[var(--text)]">
                    {d.name}
                  </span>
                  <span className="block truncate text-[11px] text-[var(--text-faint)]">
                    {d.journeyCount} journey{d.journeyCount === 1 ? "" : "s"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/explore"
          className="mt-3 block rounded-full border border-[var(--border)] py-2 text-center text-xs font-bold text-[var(--brand)] transition-colors hover:bg-[var(--brand-soft)]"
        >
          Explore all destinations
        </Link>
      </Card>

      {/* --------------------------------------------------- budget journeys */}
      {cheapest.length > 0 ? (
        <Card className="p-4">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-extrabold text-[var(--text)]">
            <Flame size={15} className="text-[var(--create)]" />
            Best value trips
          </h3>
          <ul className="space-y-2.5">
            {cheapest.map((j) => (
              <li key={j.id}>
                <Link
                  href={`/journeys/${j.id}`}
                  className="flex items-center gap-3 rounded-[var(--radius)] p-1.5 transition-colors hover:bg-[var(--surface-hover)]"
                >
                  <span className="h-11 w-11 shrink-0 overflow-hidden rounded-[var(--radius-sm)]">
                    <Photo src={j.coverUrl} className="h-full w-full" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-[12px] font-bold leading-snug text-[var(--text)]">
                      {j.title}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-[var(--create-soft)] px-2 py-0.5 text-[11px] font-extrabold text-[var(--create)]">
                    {formatMoney(j.totalExpenseMinor, j.currency)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {/* ------------------------------------------------------- travellers */}
      <Card className="p-4">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-extrabold text-[var(--text)]">
          <Users size={15} className="text-[var(--ai)]" />
          Travellers to follow
        </h3>
        <ul className="space-y-1">
          {topTravellers.map((p) => (
            <li key={p.handle}>
              <Link
                href={`/profile/${p.handle}`}
                className="flex items-center gap-2.5 rounded-[var(--radius)] p-1.5 transition-colors hover:bg-[var(--surface-hover)]"
              >
                <Avatar name={p.displayName} src={p.avatarUrl} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold text-[var(--text)]">
                    {p.displayName}
                  </span>
                  <span className="block truncate text-[11px] text-[var(--text-faint)]">
                    @{p.handle} · {p.journeyCount} journeys
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      {/* ------------------------------------------------------- quick links */}
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-extrabold text-[var(--text)]">Quick links</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { href: "/map", label: "Open map", icon: MapPin },
            { href: "/explore", label: "Explore", icon: Compass },
            { href: "/saved", label: "Saved", icon: Bookmark },
            { href: "/journeys/new", label: "Log a trip", icon: Flame },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-start gap-1.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-3 transition-colors hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]"
            >
              <Icon size={16} className="text-[var(--brand)]" />
              <span className="text-[11px] font-bold text-[var(--text)]">{label}</span>
            </Link>
          ))}
        </div>
      </Card>

      <p className="px-2 text-[10px] leading-relaxed text-[var(--text-faint)]">
        Travelora · Phase 1. Trips, AI planner, Remix, Passport and Communities arrive in Phase 2.
      </p>
    </div>
  );
}
