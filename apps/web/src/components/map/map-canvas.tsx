"use client";

// Product code never imports maplibre directly — it goes through this component.
// Swapping the renderer or tile provider is a change to this file only.
import {
  LngLatBounds, Map as MapLibreMap, Marker, NavigationControl, Popup,
  type LngLatBoundsLike,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type MapMarker = {
  id: string;
  lng: number;
  lat: number;
  label: string;
  sublabel?: string;
  href?: string;
  tone?: "brand" | "create";
};

export type MapRoute = { coordinates: [number, number][] };

const STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "https://demotiles.maplibre.org/style.json";

export function MapCanvas({
  markers = [],
  route,
  center = [78.3, 30.1],
  zoom = 6,
  fitToContent = true,
  className,
  height = 420,
}: {
  markers?: MapMarker[];
  route?: MapRoute | null;
  center?: [number, number];
  zoom?: number;
  fitToContent?: boolean;
  className?: string;
  height?: number | string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<InstanceType<typeof MapLibreMap> | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!container.current || map.current) return;

    let instance: InstanceType<typeof MapLibreMap>;
    try {
      instance = new MapLibreMap({
        container: container.current,
        style: STYLE_URL,
        center,
        zoom,
        attributionControl: { compact: true },
      });
    } catch {
      setFailed(true);
      return;
    }

    map.current = instance;
    instance.addControl(new NavigationControl({ showCompass: false }), "top-right");
    instance.on("load", () => setReady(true));
    instance.on("error", () => setFailed(true));

    return () => {
      instance.remove();
      map.current = null;
    };
    // Mount once; markers/route are handled in their own effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Markers
  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready) return;

    const created = markers.map((m) => {
      const el = document.createElement(m.href ? "a" : "div");
      if (m.href && el instanceof HTMLAnchorElement) el.href = m.href;
      el.setAttribute("aria-label", m.label);
      el.className = "block cursor-pointer";
      el.style.cssText = `
        width:14px;height:14px;border-radius:9999px;
        background:${m.tone === "create" ? "var(--create)" : "var(--brand)"};
        border:2.5px solid var(--surface);
        box-shadow:0 1px 4px rgb(0 0 0 / .35);`;

      const marker = new Marker({ element: el })
        .setLngLat([m.lng, m.lat])
        .setPopup(
          new Popup({ offset: 14, closeButton: false }).setHTML(
            `<strong style="font-size:13px">${escapeHtml(m.label)}</strong>${
              m.sublabel ? `<br><span style="font-size:11px;opacity:.7">${escapeHtml(m.sublabel)}</span>` : ""
            }`
          )
        )
        .addTo(instance);
      return marker;
    });

    return () => created.forEach((m) => m.remove());
  }, [markers, ready]);

  // Route line
  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready) return;
    const id = "journey-route";

    if (instance.getLayer(`${id}-line`)) instance.removeLayer(`${id}-line`);
    if (instance.getLayer(`${id}-casing`)) instance.removeLayer(`${id}-casing`);
    if (instance.getSource(id)) instance.removeSource(id);

    if (!route?.coordinates?.length) return;

    instance.addSource(id, {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: route.coordinates },
      },
    });
    instance.addLayer({
      id: `${id}-casing`,
      type: "line",
      source: id,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#ffffff", "line-width": 6, "line-opacity": 0.9 },
    });
    instance.addLayer({
      id: `${id}-line`,
      type: "line",
      source: id,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#2563eb", "line-width": 3 },
    });
  }, [route, ready]);

  // Fit viewport to whatever we're showing
  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready || !fitToContent) return;

    const points: [number, number][] = [
      ...markers.map((m) => [m.lng, m.lat] as [number, number]),
      ...(route?.coordinates ?? []),
    ];
    if (points.length < 2) return;

    const bounds = points.reduce(
      (acc, p) => acc.extend(p),
      new LngLatBounds(points[0], points[0])
    ) as unknown as LngLatBoundsLike;

    instance.fitBounds(bounds, { padding: 56, maxZoom: 11, duration: 0 });
  }, [markers, route, ready, fitToContent]);

  if (failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-subtle)] p-6 text-center",
          className
        )}
        style={{ height }}
      >
        <p className="text-sm text-[var(--text-muted)]">
          The map could not load. The route details below still work.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]",
        className
      )}
      style={{ height }}
    >
      <div ref={container} className="h-full w-full" />
      {!ready ? <div className="skeleton absolute inset-0" aria-hidden /> : null}
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
  );
}
