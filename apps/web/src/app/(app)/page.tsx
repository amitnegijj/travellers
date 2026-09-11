import { Compass, Route, Sparkles } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { CategoryRail } from "@/components/category-rail";
import { FeedSwitch } from "@/components/feed-switch";
import { ImmersiveMode } from "@/components/immersive-mode";
import { JourneyCard, JourneyCardSkeleton, JourneyHero, JourneyRailCard } from "@/components/journey-card";
import { StoriesRail, StoriesRailSkeleton } from "@/components/stories-rail";
import { TrailFeed } from "@/components/trail-feed";
import { Avatar, EmptyState, LinkButton, Photo, SectionHeader } from "@/components/ui";
import { getSessionUser, type SessionUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { listJourneys, listTrails } from "@/server/journeys";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; view?: string }>;
}) {
  const { scope, view } = await searchParams;
  const user = await getSessionUser();
  const activeScope = scope === "following" && user ? "following" : "all";

  // Trails is the default surface — the app opens on a feed, like every other
  // social app. Grid is one tap away and keeps the full browse experience.
  return view === "grid" ? (
    <GridHome user={user} scope={activeScope} />
  ) : (
    <TrailsHome user={user} scope={activeScope} />
  );
}

/* ========================================================================== */
/* Trails — the immersive, full-bleed feed                                    */
/* ========================================================================== */

async function TrailsHome({
  user, scope,
}: {
  user: SessionUser | null; scope: "all" | "following";
}) {
  const { items } = await listTrails({ viewerId: user?.id ?? null, scope, limit: 10 });

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <FeedSwitch view="trails" scope={scope} />
        <ScopeTabs user={user} scope={scope} view="trails" />
        {scope === "following" ? (
          <EmptyState
            icon={<Compass size={26} />}
            title="Nothing from the people you follow yet"
            description="Follow a few travellers and their trails will land right here."
            action={<LinkButton href="/explore" variant="secondary">Find travellers</LinkButton>}
          />
        ) : (
          <EmptyState
            icon={<Route size={26} />}
            title="No trails yet"
            description="Be the first to log a route — where you went, what it cost, and what you'd do differently."
            action={<LinkButton href="/journeys/new" variant="create">Log the first journey</LinkButton>}
          />
        )}
      </div>
    );
  }

  return (
    // Break out of <main>'s padding so the feed runs edge to edge on mobile,
    // and sits as a tall card between sidebar and rail on desktop.
    <div
      className="trail-scope relative -mx-4 -mt-5 -mb-28 h-[calc(100dvh-4rem)] overflow-hidden
                 bg-black lg:mx-0 lg:-mb-10 lg:rounded-[var(--radius-xl)]"
    >
      <ImmersiveMode />
      <TrailFeed trails={items} />

      {/* Floating chrome — sits over the photo, never in the way of the card. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-start justify-between gap-3 p-3 sm:p-4">
        <div className="pointer-events-auto flex flex-wrap items-center gap-2 pt-5">
          <FeedSwitch view="trails" scope={scope} floating />
          {user ? <ScopeTabs user={user} scope={scope} view="trails" floating /> : null}
        </div>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* Grid — the browse surface                                                  */
/* ========================================================================== */

async function GridHome({
  user, scope,
}: {
  user: SessionUser | null; scope: "all" | "following";
}) {
  return (
    <div className="space-y-8">
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

      <Suspense fallback={<StoriesRailSkeleton />}>
        <StoriesRail user={user} />
      </Suspense>

      <CategoryRail />

      <div className="flex flex-wrap items-center gap-2">
        <FeedSwitch view="grid" scope={scope} />
        <ScopeTabs user={user} scope={scope} view="grid" />
      </div>

      <Suspense fallback={<FeedSkeleton />}>
        <Feed scope={scope} viewerId={user?.id ?? null} />
      </Suspense>
    </div>
  );
}

function ScopeTabs({
  user, scope, view, floating = false,
}: {
  user: SessionUser | null;
  scope: "all" | "following";
  view: "trails" | "grid";
  floating?: boolean;
}) {
  if (!user) return null;

  const href = (s: "all" | "following") => {
    const params = new URLSearchParams();
    if (view === "grid") params.set("view", "grid");
    if (s === "following") params.set("scope", "following");
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  };

  return (
    <div
      role="tablist"
      aria-label="Feed scope"
      className={cn(
        "inline-flex rounded-full p-1",
        floating ? "glass-strong" : "border border-[var(--border)] bg-[var(--surface-2)]"
      )}
    >
      {([
        { key: "all" as const, label: "For you" },
        { key: "following" as const, label: "Following" },
      ]).map((tab) => {
        const on = scope === tab.key;
        return (
          <Link
            key={tab.key}
            href={href(tab.key)}
            role="tab"
            aria-selected={on}
            className={cn(
              "rounded-full px-4 py-1.5 text-[13px] font-bold transition-all",
              on
                ? floating
                  ? "bg-white text-black"
                  : "bg-[var(--brand)] text-[var(--brand-text)] shadow-sm"
                : floating
                  ? "text-white/70 hover:text-white"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
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
