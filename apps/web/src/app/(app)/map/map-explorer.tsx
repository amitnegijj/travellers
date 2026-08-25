"use client";

import { Layers, MapPin, Mountain, X } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { MapMarker } from "@/components/map/map-canvas";
import { Badge, Photo, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";

const MapCanvas = dynamic(
  () => import("@/components/map/map-canvas").then((m) => m.MapCanvas),
  { ssr: false, loading: () => <Skeleton className="h-[600px] w-full rounded-[var(--radius-xl)]" /> }
);

type Destination = {
  id: string; slug: string; name: string; region: string | null;
  coverUrl: string | null; lng: number; lat: number; journeyCount: number;
};
type Place = {
  id: string; slug: string; name: string; categorySlug: string | null;
  lng: number; lat: number;
};

const FILTERS = [
  { key: "all", label: "All", emoji: "🗺️" },
  { key: "destinations", label: "Destinations", emoji: "📍" },
  { key: "stay", label: "Stay", emoji: "🏕️" },
  { key: "adventure", label: "Adventure", emoji: "🧗" },
  { key: "temple", label: "Temples", emoji: "🛕" },
  { key: "cafe", label: "Food", emoji: "☕" },
  { key: "viewpoint", label: "Viewpoints", emoji: "🌄" },
] as const;

export function MapExplorer({
  destinations, places,
}: {
  destinations: Destination[]; places: Place[];
}) {
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Destination | null>(null);

  const markers = useMemo<MapMarker[]>(() => {
    const out: MapMarker[] = [];
    const showDest = filter === "all" || filter === "destinations";
    const placeCats =
      filter === "all" ? null : filter === "destinations" ? [] : [filter];

    if (showDest) {
      for (const d of destinations) {
        out.push({
          id: d.id, lng: Number(d.lng), lat: Number(d.lat),
          label: d.name,
          sublabel: `${d.region ?? ""}${d.journeyCount ? ` · ${d.journeyCount} journeys` : ""}`,
          href: `/destinations/${d.slug}`,
          tone: "brand",
        });
      }
    }
    for (const p of places) {
      if (placeCats && !placeCats.includes(p.categorySlug ?? "")) continue;
      out.push({
        id: p.id, lng: Number(p.lng), lat: Number(p.lat),
        label: p.name, sublabel: p.categorySlug ?? undefined, tone: "create",
      });
    }
    return out;
  }, [destinations, places, filter]);

  const topDestinations = useMemo(
    () => [...destinations].sort((a, b) => b.journeyCount - a.journeyCount),
    [destinations]
  );

  return (
    <div className="space-y-4">
      {/* filter pills, as in the mockup */}
      <div className="rail -mx-4 px-4 lg:mx-0 lg:px-0">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold transition-all",
              filter === f.key
                ? "border-transparent bg-[var(--brand)] text-[var(--brand-text)] shadow-sm"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--brand)] hover:text-[var(--text)]"
            )}
          >
            <span aria-hidden>{f.emoji}</span>
            {f.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <MapCanvas markers={markers} height={600} className="rounded-[var(--radius-xl)]" />

        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5">
          <span className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-[var(--surface)]/90 px-3 py-1.5 text-xs font-bold text-[var(--text)] shadow-lg backdrop-blur-md">
            <Layers size={13} className="text-[var(--brand)]" />
            {markers.length} pins
          </span>
        </div>

        {/* bottom sheet — mirrors the mobile mockup's place card */}
        {selected ? (
          <div className="pointer-events-auto absolute inset-x-3 bottom-3 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]/95 shadow-[var(--shadow-lg)] backdrop-blur-xl sm:max-w-sm">
            <div className="flex items-center gap-3 p-3">
              <span className="h-14 w-14 shrink-0 overflow-hidden rounded-[var(--radius)]">
                <Photo src={selected.coverUrl} className="h-full w-full" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-extrabold text-[var(--text)]">{selected.name}</p>
                <p className="truncate text-xs text-[var(--text-muted)]">{selected.region}</p>
                <Link
                  href={`/destinations/${selected.slug}`}
                  className="mt-1 inline-block text-xs font-bold text-[var(--brand)] hover:underline"
                >
                  View destination →
                </Link>
              </div>
              <button
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[var(--text-faint)] hover:bg-[var(--surface-hover)]"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-extrabold text-[var(--text)]">Destinations on the map</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {topDestinations.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelected(d)}
              className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-2.5 text-left transition-colors hover:border-[var(--brand)] hover:bg-[var(--surface-hover)]"
            >
              <span className="h-12 w-12 shrink-0 overflow-hidden rounded-[var(--radius)]">
                <Photo src={d.coverUrl} className="h-full w-full" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-extrabold text-[var(--text)]">
                  {d.name}
                </span>
                <span className="flex items-center gap-1 truncate text-[11px] text-[var(--text-faint)]">
                  <MapPin size={10} /> {d.region}
                </span>
              </span>
              {d.journeyCount > 0 ? <Badge tone="brand">{d.journeyCount}</Badge> : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
