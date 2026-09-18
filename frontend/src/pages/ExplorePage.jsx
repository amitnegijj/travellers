import { MapPin, Mountain, Search as SearchIcon, Star } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client.js";
import { CategoryRail } from "../components/CategoryRail.jsx";
import { JourneyCard, JourneyCardSkeleton } from "../components/JourneyCard.jsx";
import {
  Avatar, Badge, Card, EmptyState, Input, PageHeader, Photo, SectionHeader, Skeleton,
} from "../components/ui/index.js";
import { useApi } from "../hooks/useApi.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

export function ExplorePage() {
  useDocumentTitle("Explore");
  const [searchParams, setSearchParams] = useSearchParams();
  const term = (searchParams.get("q") ?? "").trim();
  const [draft, setDraft] = useState(term);

  function onSubmit(e) {
    e.preventDefault();
    const q = draft.trim();
    setSearchParams(q ? { q } : {});
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Explore"
        description="Destinations, routes, places and the people who logged them."
      />

      <form onSubmit={onSubmit} role="search">
        <div className="relative max-w-xl">
          <SearchIcon
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-faint)]"
          />
          <Input
            name="q"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Try “Devprayag”, “Kanatal” or “budget”"
            aria-label="Search"
            className="h-13 rounded-full pl-12 text-base"
          />
        </div>
      </form>

      {!term ? <CategoryRail /> : null}

      {term ? <SearchResults term={term} /> : <BrowseAll />}
    </div>
  );
}

function SearchResults({ term }) {
  const { data, loading } = useApi(
    (signal) => api.get(`/api/v1/search?q=${encodeURIComponent(term)}`, signal),
    [term]
  );

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <JourneyCardSkeleton key={i} />)}
      </div>
    );
  }

  const destinations = data?.destinations ?? [];
  const places = data?.places ?? [];
  const profiles = data?.profiles ?? [];
  const journeys = data?.journeys ?? [];

  const total = destinations.length + places.length + profiles.length + journeys.length;

  if (total === 0) {
    return (
      <EmptyState
        icon={<SearchIcon size={26} />}
        title={`Nothing matched “${term}”`}
        description="Try a shorter search, or browse all destinations below."
      />
    );
  }

  return (
    <div className="space-y-9">
      {destinations.length > 0 ? (
        <section>
          <SectionHeader title="Destinations" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {destinations.map((d) => (
              <DestinationTile key={d.slug} d={d} />
            ))}
          </div>
        </section>
      ) : null}

      {journeys.length > 0 ? (
        <section>
          <SectionHeader title="Journeys" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {journeys.map((j) => (
              <JourneyCard key={j.id} journey={j} />
            ))}
          </div>
        </section>
      ) : null}

      {places.length > 0 ? (
        <section>
          <SectionHeader title="Places" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {places.map((p) => (
              <Card key={p.id} className="p-4">
                <p className="font-extrabold text-[var(--text)]">{p.name}</p>
                {p.destinationName ? (
                  <Link
                    to={`/destinations/${p.destinationSlug}`}
                    className="text-xs font-semibold text-[var(--brand)] hover:underline"
                  >
                    {p.destinationName}
                  </Link>
                ) : null}
                {p.description ? (
                  <p className="mt-2 line-clamp-2 text-sm text-[var(--text-muted)]">
                    {p.description}
                  </p>
                ) : null}
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {profiles.length > 0 ? (
        <section>
          <SectionHeader title="Travellers" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {profiles.map((p) => (
              <Link key={p.id} to={`/profile/${p.handle}`}>
                <Card className="flex items-center gap-3 p-4 transition-colors hover:bg-[var(--surface-hover)]">
                  <Avatar name={p.displayName} src={p.avatarUrl} size={44} />
                  <div className="min-w-0">
                    <p className="truncate font-extrabold text-[var(--text)]">{p.displayName}</p>
                    <p className="truncate text-xs text-[var(--text-faint)]">@{p.handle}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function BrowseAll() {
  const { data, loading } = useApi((signal) => api.get("/api/v1/destinations?limit=60", signal), []);

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-[16/10] w-full" />)}
      </div>
    );
  }

  const destinations = data?.items ?? [];
  const featured = destinations.slice(0, 4);
  const rest = destinations.slice(4);

  return (
    <div className="space-y-9">
      <section>
        <SectionHeader title="Most documented" hint="Where travellers are actually going" />
        <div className="grid gap-4 sm:grid-cols-2">
          {featured.map((d) => (
            <Link
              key={d.slug}
              to={`/destinations/${d.slug}`}
              className="group relative block overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)]"
            >
              <div className="relative aspect-[16/9]">
                <Photo
                  src={d.coverUrl}
                  className="h-full w-full transition-transform duration-500 group-hover:scale-105"
                />
                <div className="scrim absolute inset-0" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h3 className="text-xl font-extrabold text-white drop-shadow">{d.name}</h3>
                  <p className="mt-0.5 flex items-center gap-2 text-xs font-semibold text-white/85">
                    <span className="flex items-center gap-1">
                      <MapPin size={11} /> {d.region}
                    </span>
                    {d.journeyCount > 0 ? (
                      <span className="flex items-center gap-1">
                        <Star size={11} className="fill-[var(--star)] text-[var(--star)]" />
                        {d.journeyCount} journeys
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title={`All destinations (${destinations.length})`} />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rest.map((d) => (
            <DestinationTile key={d.slug} d={d} />
          ))}
        </div>
      </section>
    </div>
  );
}

function DestinationTile({ d }) {
  return (
    <Link to={`/destinations/${d.slug}`} className="group block">
      <Card className="h-full overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow)]">
        <div className="relative aspect-[16/10] overflow-hidden bg-[var(--bg-subtle)]">
          <Photo
            src={d.coverUrl}
            className="h-full w-full transition-transform duration-500 group-hover:scale-105"
          />
          <div className="scrim-soft absolute inset-0" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
            <div className="min-w-0">
              <p className="truncate text-base font-extrabold text-white drop-shadow">{d.name}</p>
              <p className="truncate text-[11px] font-medium text-white/75">{d.region}</p>
            </div>
            {d.elevationM ? (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                <Mountain size={10} /> {d.elevationM}m
              </span>
            ) : null}
          </div>
        </div>

        <div className="p-3">
          {d.description ? (
            <p className="line-clamp-2 text-[13px] leading-relaxed text-[var(--text-muted)]">
              {d.description}
            </p>
          ) : null}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {d.journeyCount > 0 ? (
              <Badge tone="brand">{d.journeyCount} journeys</Badge>
            ) : (
              <Badge tone="neutral">New</Badge>
            )}
            {d.placeCount > 0 ? <Badge tone="neutral">{d.placeCount} places</Badge> : null}
          </div>
        </div>
      </Card>
    </Link>
  );
}
