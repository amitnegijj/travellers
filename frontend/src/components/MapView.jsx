// A drop-in map. MapCanvas is the renderer and MapExplorer is the full-page
// browsing UI with filters; this sits between them — the map you reach for
// when a page just wants "show these places" without owning the fetch, the
// three loading states, or the marker shape.
//
// Two modes, decided by whether `markers` is passed:
//   <MapView />                          fetches /api/v1/map itself
//   <MapView destination="rishikesh" />  fetches, then narrows to one place
//   <MapView markers={mine} />           fully controlled, no request at all
import { MapPinned } from "lucide-react";
import { lazy, Suspense, useMemo } from "react";
import { api } from "../api/client.js";
import { useApi } from "../hooks/useApi.js";
import { EmptyState, ErrorState, SectionHeader, Skeleton } from "./ui/index.js";
import { cn } from "../utils/index.js";

const MapCanvas = lazy(() => import("./MapCanvas.jsx").then((m) => ({ default: m.MapCanvas })));

/** A marker is only plottable if both coordinates survived the trip as numbers. */
const isPlottable = (m) => Number.isFinite(m.lng) && Number.isFinite(m.lat);

function destinationMarker(d) {
  const counts = [
    d.journeyCount ? `${d.journeyCount} journeys` : null,
    d.placeCount ? `${d.placeCount} places` : null,
  ].filter(Boolean);

  return {
    id: `d-${d.id}`,
    lng: Number(d.lng),
    lat: Number(d.lat),
    label: d.name,
    sublabel: [d.region, ...counts].filter(Boolean).join(" · ") || undefined,
    href: d.slug ? `/destinations/${d.slug}` : undefined,
    tone: "brand",
  };
}

function placeMarker(p) {
  return {
    id: `p-${p.id}`,
    lng: Number(p.lng),
    lat: Number(p.lat),
    label: p.name,
    sublabel: p.categorySlug ?? p.destinationName ?? undefined,
    tone: "create",
  };
}

/** Skeleton only takes a className, so a dynamic pixel height rides on a wrapper. */
function MapSkeleton({ height }) {
  return (
    <div style={{ height }}>
      <Skeleton className="h-full w-full rounded-[var(--radius-xl)]" />
    </div>
  );
}

export function MapView({
  markers: controlledMarkers,
  destination,
  route,
  title,
  hint,
  height = 420,
  center,
  zoom,
  className,
  emptyTitle = "Nothing to plot yet",
  emptyDescription = "Places appear here once they've been logged.",
}) {
  // A controlled MapView never touches the network. `useApi` still has to be
  // called — hooks can't be conditional — so it's handed a resolved no-op.
  const controlled = Array.isArray(controlledMarkers);
  const { data, loading, error } = useApi(
    (signal) => (controlled ? Promise.resolve(null) : api.get("/api/v1/map", signal)),
    [controlled]
  );

  const markers = useMemo(() => {
    if (controlled) return controlledMarkers.filter(isPlottable);
    if (!data) return [];

    const destinations = data.destinations ?? [];
    const places = data.places ?? [];

    // `destination` narrows to one destination and the places inside it. The
    // slug is the stable identifier here — ids are uuids the caller rarely has.
    const match = destination
      ? destinations.find((d) => d.slug === destination)
      : null;

    if (destination) {
      if (!match) return [];
      return [
        destinationMarker(match),
        ...places.filter((p) => p.destinationSlug === destination).map(placeMarker),
      ].filter(isPlottable);
    }

    return [...destinations.map(destinationMarker), ...places.map(placeMarker)].filter(isPlottable);
  }, [controlled, controlledMarkers, data, destination]);

  const header = title ? (
    <SectionHeader title={title} hint={hint ?? (markers.length ? `${markers.length} plotted` : undefined)} />
  ) : null;

  if (!controlled && loading) {
    return (
      <div className={className}>
        {header}
        <MapSkeleton height={height} />
      </div>
    );
  }

  if (!controlled && error) {
    return (
      <div className={className}>
        {header}
        <ErrorState
          title="The map couldn't load"
          description="The places API didn't respond. Reload to try again."
        />
      </div>
    );
  }

  if (markers.length === 0 && !route) {
    return (
      <div className={className}>
        {header}
        <EmptyState icon={<MapPinned size={26} />} title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className={className}>
      {header}
      <Suspense fallback={<MapSkeleton height={height} />}>
        <MapCanvas
          markers={markers}
          route={route}
          height={height}
          center={center}
          zoom={zoom}
          className={cn("rounded-[var(--radius-xl)] border border-[var(--border)]")}
        />
      </Suspense>
    </div>
  );
}
