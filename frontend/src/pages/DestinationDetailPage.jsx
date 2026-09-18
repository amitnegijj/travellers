import {
  CalendarDays, IndianRupee, MapPin, Mountain, Route, Star, Users,
} from "lucide-react";
import { lazy, Suspense } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { JourneyCard } from "../components/JourneyCard.jsx";
import { NotFoundBlock } from "../components/NotFound.jsx";
import {
  Badge, Card, EmptyState, LinkButton, Photo, SectionHeader, Skeleton, Stat, StatStrip,
} from "../components/ui/index.js";
import { useApi } from "../hooks/useApi.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { formatMoney } from "../utils/index.js";

const MapCanvas = lazy(() => import("../components/MapCanvas.jsx").then((m) => ({ default: m.MapCanvas })));

export function DestinationDetailPage() {
  const { slug } = useParams();

  const destReq = useApi((signal) => api.get(`/api/v1/destinations/${slug}`, signal), [slug]);
  const journeysReq = useApi(
    (signal) => api.get(`/api/v1/journeys?destination=${encodeURIComponent(slug)}&limit=9`, signal),
    [slug]
  );

  const destination = destReq.data;
  useDocumentTitle(destination?.name ?? "Destination");

  if (destReq.error) {
    return <NotFoundBlock title="This page doesn't exist" description="That destination isn't here." />;
  }

  if (destReq.loading || !destination) {
    return (
      <div className="space-y-8">
        <Skeleton className="aspect-[21/9] w-full rounded-[var(--radius-xl)]" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  const places = destination.places;
  const journeys = journeysReq.data?.items ?? [];

  // "What does this actually cost?" — computed from real logged journeys.
  const costs = journeys.map((j) => Number(j.totalExpenseMinor)).filter((n) => n > 0).sort((a, b) => a - b);
  const budget = costs.length
    ? costs[0] === costs[costs.length - 1]
      ? formatMoney(costs[0])
      : `${formatMoney(costs[0])}–${formatMoney(costs[costs.length - 1])}`
    : "—";

  const avgDays = journeys.length
    ? Math.round(
        journeys.reduce((s, j) => {
          if (!j.startDate) return s + 1;
          const end = j.endDate ?? j.startDate;
          return s + Math.max(1, Math.round(
            (new Date(end).getTime() - new Date(j.startDate).getTime()) / 86_400_000
          ) + 1);
        }, 0) / journeys.length
      )
    : null;

  return (
    <article className="space-y-8">
      {/* --------------------------------------------------------------- hero */}
      <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)]">
        <div className="relative aspect-[16/10] sm:aspect-[21/9]">
          <Photo src={destination.coverUrl} priority className="h-full w-full" />
          <div className="scrim absolute inset-0" />

          <div className="absolute left-4 top-4 flex flex-wrap gap-1.5 sm:left-6 sm:top-6">
            <Badge tone="glass">
              <MapPin size={11} /> {destination.region}
            </Badge>
            {destination.elevationM ? (
              <Badge tone="glass">
                <Mountain size={11} /> {destination.elevationM} m
              </Badge>
            ) : null}
          </div>

          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-lg sm:text-5xl">
              {destination.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm font-semibold text-white/90">
              <span className="flex items-center gap-1">
                <Star size={14} className="fill-[var(--star)] text-[var(--star)]" />
                {destination.journeyCount > 0 ? `${destination.journeyCount} journeys` : "New"}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={14} /> {destination.placeCount} places
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------- intelligence bar */}
      <StatStrip>
        <Stat label="Journeys" value={destination.journeyCount} icon={<Route size={11} />} />
        <Stat label="Avg. Budget" value={budget} icon={<IndianRupee size={11} />} accent />
        <Stat label="Typical Trip" value={avgDays ? `${avgDays}d` : "—"} icon={<CalendarDays size={11} />} />
        <Stat
          label="Best Season"
          value={destination.bestSeason?.length ? destination.bestSeason.slice(0, 2).join("–") : "—"}
        />
      </StatStrip>

      {destination.description ? (
        <section>
          <h2 className="mb-2 text-lg font-extrabold text-[var(--text)]">About</h2>
          <p className="text-[15px] leading-relaxed text-[var(--text-muted)]">
            {destination.description}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {destination.bestSeason?.map((s) => (
              <Badge key={s} tone="create">{s}</Badge>
            ))}
          </div>
        </section>
      ) : null}

      {/* --------------------------------------------------- top experiences */}
      {places.length > 0 ? (
        <section>
          <SectionHeader title="Top experiences" hint={`${places.length} places travellers logged here`} />
          <div className="rail -mx-4 px-4 lg:mx-0 lg:px-0">
            {places.map((p) => (
              <div
                key={p.id}
                className="group w-[152px] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]"
              >
                <div className="relative aspect-square overflow-hidden bg-[var(--bg-subtle)]">
                  <Photo
                    src={p.photoUrl}
                    className="h-full w-full transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="scrim-soft absolute inset-0" />
                  {p.categoryName ? (
                    <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                      {p.categoryName}
                    </span>
                  ) : null}
                </div>
                <div className="p-2.5">
                  <p className="truncate text-[13px] font-extrabold text-[var(--text)]">{p.name}</p>
                  {p.priceMinor && Number(p.priceMinor) > 0 ? (
                    <p className="mt-0.5 text-[11px] font-bold text-[var(--create)]">
                      ~{formatMoney(p.priceMinor, p.currency)}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-[11px] text-[var(--text-faint)]">Free</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ---------------------------------------------------------- the map */}
      <section>
        <SectionHeader title="Where it is" />
        <Suspense fallback={<Skeleton className="h-[320px] w-full rounded-[var(--radius-xl)]" />}>
          <MapCanvas
            height={320}
            center={[Number(destination.lng), Number(destination.lat)]}
            zoom={10}
            markers={[
              {
                id: destination.id,
                lng: Number(destination.lng),
                lat: Number(destination.lat),
                label: destination.name,
                sublabel: destination.region ?? undefined,
                tone: "brand",
              },
              ...places.map((p) => ({
                id: p.id, lng: Number(p.lng), lat: Number(p.lat),
                label: p.name, sublabel: p.categoryName ?? undefined,
                tone: "create",
              })),
            ]}
          />
        </Suspense>
      </section>

      {/* ---------------------------------------------------- place details */}
      {places.length > 0 ? (
        <section>
          <SectionHeader title={`Places in ${destination.name}`} />
          <div className="grid gap-3 sm:grid-cols-2">
            {places.map((p) => (
              <Card key={p.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-extrabold text-[var(--text)]">{p.name}</p>
                  {p.categoryName ? <Badge tone="brand">{p.categoryName}</Badge> : null}
                </div>
                {p.description ? (
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                    {p.description}
                  </p>
                ) : null}
                {p.priceMinor && Number(p.priceMinor) > 0 ? (
                  <p className="mt-2.5 text-sm font-extrabold text-[var(--create)]">
                    ~{formatMoney(p.priceMinor, p.currency)}
                  </p>
                ) : null}
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {/* -------------------------------------------------- popular journeys */}
      <section>
        <SectionHeader
          title={`Journeys through ${destination.name}`}
          hint="Real routes, with what they actually cost"
        />
        {journeysReq.loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="aspect-[4/3] w-full" />)}
          </div>
        ) : journeys.length === 0 ? (
          <EmptyState
            icon={<Route size={26} />}
            title="No journeys logged here yet"
            description="Be the first to document this route — the stops, the costs, and what the roads were like."
            action={
              <LinkButton to={`/journeys/new?destination=${destination.slug}`} variant="create">
                Log a journey
              </LinkButton>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {journeys.map((j) => (
              <JourneyCard key={j.id} journey={j} />
            ))}
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-xl)] border border-[var(--border)] bg-gradient-to-br from-[var(--brand-soft)] to-[var(--ai-soft)] p-6">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-lg font-extrabold text-[var(--text)]">
            <Users size={18} className="text-[var(--brand)]" />
            Been to {destination.name}?
          </h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Log your route and help the next traveller plan properly.
          </p>
        </div>
        <LinkButton to={`/journeys/new?destination=${destination.slug}`} variant="create" size="lg">
          Share your journey
        </LinkButton>
      </div>
    </article>
  );
}
