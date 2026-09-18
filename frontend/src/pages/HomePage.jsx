import { Compass, Route } from "lucide-react";
import { lazy, Suspense } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client.js";
import { CategoryRail } from "../components/category-rail.jsx";
import { FeedSwitch } from "../components/feed-switch.jsx";
import { ImmersiveMode } from "../components/immersive-mode.jsx";
import {
  JourneyCard, JourneyCardSkeleton, JourneyHero, JourneyRailCard,
} from "../components/journey-card.jsx";
import { StoriesRail, StoriesRailSkeleton } from "../components/stories-rail.jsx";
import { TrailFeed } from "../components/trail-feed.jsx";
import { EmptyState, LinkButton, Photo, SectionHeader, Skeleton } from "../components/ui.jsx";
import { useSession } from "../context/session.jsx";
import { useApi } from "../hooks/useApi.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { cn } from "../lib/utils.js";

// Three.js + fiber + drei is a heavy bundle — split out of the main chunk,
// same as MapCanvas is elsewhere.
const MapRoom = lazy(() => import("../components/room/MapRoom.jsx").then((m) => ({ default: m.MapRoom })));

export function HomePage() {
  useDocumentTitle(null);
  const { user } = useSession();
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view");
  const activeScope = searchParams.get("scope") === "following" && user ? "following" : "all";

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

function TrailsHome({ user, scope }) {
  const { data, loading } = useApi(
    (signal) => api.get(`/api/v1/trails?scope=${scope}&limit=10`, signal),
    [user?.id, scope]
  );
  const items = data?.items ?? [];

  if (loading) {
    return (
      <div className="trail-scope relative -mx-4 -mt-5 -mb-28 h-[calc(100dvh-4rem)] overflow-hidden bg-black lg:mx-0 lg:-mb-10 lg:rounded-[var(--radius-xl)]">
        <div className="skeleton h-full w-full" aria-hidden />
      </div>
    );
  }

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
            action={<LinkButton to="/explore" variant="secondary">Find travellers</LinkButton>}
          />
        ) : (
          <EmptyState
            icon={<Route size={26} />}
            title="No trails yet"
            description="Be the first to log a route — where you went, what it cost, and what you'd do differently."
            action={<LinkButton to="/journeys/new" variant="create">Log the first journey</LinkButton>}
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

function GridHome({ user, scope }) {
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

      <StoriesRail user={user} />

      <CategoryRail />

      <div className="flex flex-wrap items-center gap-2">
        <FeedSwitch view="grid" scope={scope} />
        <ScopeTabs user={user} scope={scope} view="grid" />
      </div>

      <Feed scope={scope} viewerId={user?.id ?? null} />
    </div>
  );
}

function ScopeTabs({ user, scope, view, floating = false }) {
  if (!user) return null;

  const href = (s) => {
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
      {[
        { key: "all", label: "For you" },
        { key: "following", label: "Following" },
      ].map((tab) => {
        const on = scope === tab.key;
        return (
          <Link
            key={tab.key}
            to={href(tab.key)}
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

function Feed({ scope, viewerId }) {
  const { data, loading } = useApi(
    (signal) => api.get(`/api/v1/journeys?scope=${scope}&limit=18`, signal),
    [scope, viewerId]
  );

  if (loading) return <FeedSkeleton />;

  const items = data?.items ?? [];

  if (items.length === 0) {
    return scope === "following" ? (
      <EmptyState
        icon={<Compass size={26} />}
        title="Nothing from the people you follow yet"
        description="Follow a few travellers and their journeys will land right here."
        action={<LinkButton to="/explore" variant="secondary">Find travellers</LinkButton>}
      />
    ) : (
      <EmptyState
        icon={<Route size={26} />}
        title="No journeys yet"
        description="Be the first to log a route — where you went, what it cost, and what you'd do differently."
        action={<LinkButton to="/journeys/new" variant="create">Log the first journey</LinkButton>}
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

      <DestinationStrip />

      <section>
        <SectionHeader title="Latest from the community" hint="Fresh routes, straight from the road" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rest.map((j) => (
            <JourneyCard key={j.id} journey={j} />
          ))}
        </div>
      </section>

      <MapRoomSection />
    </div>
  );
}

/** Photo tiles for the busiest destinations. */
function DestinationStrip() {
  const { data, loading } = useApi(
    (signal) => api.get("/api/v1/home/destinations-strip", signal),
    []
  );
  const destinations = data?.items ?? [];

  if (loading) return <Skeleton className="h-[160px] w-full" />;
  if (destinations.length === 0) return null;

  return (
    <section>
      <SectionHeader title="Because you love mountains 🏔️" href="/explore" />
      <div className="rail -mx-4 px-4 lg:mx-0 lg:px-0">
        {destinations.map((d) => (
          <Link
            key={d.slug}
            to={`/destinations/${d.slug}`}
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

/** The 3D room — a diorama with the real destinations map on the back wall. */
function MapRoomSection() {
  return (
    <section>
      <SectionHeader
        title="Step into the map room"
        hint="Drag to look around — that's the real map on the wall"
      />
      <Suspense fallback={<Skeleton className="h-[420px] w-full rounded-[var(--radius-xl)]" />}>
        <MapRoom />
      </Suspense>
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
