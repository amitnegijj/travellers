import { Compass, Route, Sparkles } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { CategoryRail } from "@/components/category-rail";
import { JourneyCard, JourneyCardSkeleton, JourneyHero, JourneyRailCard } from "@/components/journey-card";
import { Avatar, EmptyState, LinkButton, Photo, SectionHeader } from "@/components/ui";
import { getSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { listJourneys } from "@/server/journeys";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const { scope } = await searchParams;
  const user = await getSessionUser();
  const activeScope = scope === "following" && user ? "following" : "all";

  return (
    <div className="space-y-8">
      {/* ---------------------------------------------------------- greeting */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text)] sm:text-[28px]">
          {user ? (
            <>Hi, {user.displayName.split(" ")[0]} <span className="inline-block">👋</span></>
          ) : (
            <>Travel. Share. Inspire.</>
          )}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {user
            ? "Where are you thinking of going?"
            : "Real routes, real costs, real road conditions — from people who actually drove them."}
        </p>
      </div>

      <CategoryRail />

      {user ? (
        <div
          role="tablist"
          aria-label="Feed scope"
          className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-2)] p-1"
        >
          {[
            { key: "all", label: "For you", href: "/" },
            { key: "following", label: "Following", href: "/?scope=following" },
          ].map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              role="tab"
              aria-selected={activeScope === tab.key}
              className={cn(
                "rounded-full px-5 py-1.5 text-sm font-bold transition-all",
                activeScope === tab.key
                  ? "bg-[var(--brand)] text-[var(--brand-text)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      ) : null}

      <Suspense fallback={<FeedSkeleton />}>
        <Feed scope={activeScope} viewerId={user?.id ?? null} />
      </Suspense>
    </div>
  );
}

async function Feed({
  scope, viewerId,
}: {
  scope: "all" | "following"; viewerId: string | null;
}) {
  const { items } = await listJourneys({ viewerId, scope, limit: 18 });

  if (items.length === 0) {
    return scope === "following" ? (
      <EmptyState
        icon={<Compass size={26} />}
        title="Nothing from the people you follow yet"
        description="Follow a few travellers and their journeys will land right here."
        action={<LinkButton href="/explore" variant="secondary">Find travellers</LinkButton>}
      />
    ) : (
      <EmptyState
        icon={<Route size={26} />}
        title="No journeys yet"
        description="Be the first to log a route — where you went, what it cost, and what you'd do differently."
        action={<LinkButton href="/journeys/new" variant="create">Log the first journey</LinkButton>}
      />
    );
  }

  const [hero, ...rest] = items;
  const popular = [...rest].sort((a, b) => b.likeCount - a.likeCount).slice(0, 8);

  return (
    <div className="space-y-9">
      <JourneyHero journey={hero} />

      {popular.length > 0 ? (
        <section>
          <SectionHeader title="Popular journeys" href="/explore" hint="Most liked this week" />
          <div className="rail -mx-4 px-4 lg:mx-0 lg:px-0">
            {popular.map((j) => (
              <JourneyRailCard key={j.id} journey={j} />
            ))}
          </div>
        </section>
      ) : null}

      <Suspense fallback={null}>
        <DestinationStrip />
      </Suspense>

      <section>
        <SectionHeader title="Latest from the community" hint="Fresh routes, straight from the road" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rest.map((j) => (
            <JourneyCard key={j.id} journey={j} />
          ))}
        </div>
      </section>

      <CommunityStrip />
    </div>
  );
}

/** Photo tiles for the busiest destinations. */
async function DestinationStrip() {
  const destinations = await query<{
    slug: string; name: string; region: string | null;
    coverUrl: string | null; journeyCount: number;
  }>(
    `select d.slug, d.name, d.region, d.cover_url as "coverUrl",
            (select count(*) from journeys j
              where j.destination_id = d.id and j.status='published')::int as "journeyCount"
       from destinations d
      order by "journeyCount" desc, d.name
      limit 8`
  );

  if (destinations.length === 0) return null;

  return (
    <section>
      <SectionHeader title="Because you love mountains 🏔️" href="/explore" />
      <div className="rail -mx-4 px-4 lg:mx-0 lg:px-0">
        {destinations.map((d) => (
          <Link
            key={d.slug}
            href={`/destinations/${d.slug}`}
            className="group relative block h-[160px] w-[136px] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]"
          >
            <Photo
              src={d.coverUrl}
              className="h-full w-full transition-transform duration-500 group-hover:scale-110"
            />
            <div className="scrim absolute inset-0" />
            <div className="absolute inset-x-0 bottom-0 p-2.5">
              <p className="truncate text-[13px] font-extrabold text-white drop-shadow">{d.name}</p>
              <p className="truncate text-[10px] font-medium text-white/75">
                {d.journeyCount > 0 ? `${d.journeyCount} journeys` : d.region}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** Avatar row of the people posting — the "friends' recent trips" strip. */
async function CommunityStrip() {
  const people = await query<{
    handle: string; displayName: string; avatarUrl: string | null;
    location: string | null; journeyCount: number;
  }>(
    `select p.handle, p.display_name as "displayName", p.avatar_url as "avatarUrl", p.location,
            (select count(*) from journeys j
              where j.author_id = p.id and j.status='published')::int as "journeyCount"
       from profiles p order by "journeyCount" desc limit 8`
  );

  if (people.length === 0) return null;

  return (
    <section className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-gradient-to-br from-[var(--brand-soft)] to-[var(--ai-soft)] p-5">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles size={17} className="text-[var(--ai)]" />
        <h2 className="text-lg font-extrabold tracking-tight text-[var(--text)]">
          Travellers on Travelora
        </h2>
      </div>

      <div className="rail">
        {people.map((p) => (
          <Link
            key={p.handle}
            href={`/profile/${p.handle}`}
            className="flex w-[104px] flex-col items-center gap-2 rounded-[var(--radius-lg)] bg-[var(--surface)]/70 p-3 backdrop-blur transition-transform hover:-translate-y-0.5"
          >
            <Avatar name={p.displayName} src={p.avatarUrl} size={52} ring />
            <span className="w-full truncate text-center text-[11px] font-bold text-[var(--text)]">
              {p.displayName}
            </span>
            <span className="w-full truncate text-center text-[10px] text-[var(--text-faint)]">
              {p.journeyCount} trips
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-8">
      <div className="skeleton aspect-[21/9] w-full rounded-[var(--radius-xl)]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <JourneyCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
