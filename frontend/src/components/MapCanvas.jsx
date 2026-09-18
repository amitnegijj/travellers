// Product code never imports maplibre directly — it goes through this component.
// Swapping the renderer or tile provider is a change to this file only.
import {
  LngLatBounds, Map as MapLibreMap, Marker, NavigationControl, Popup, setWorkerUrl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../utils/index.jsx";

/**
 * CARTO raster basemaps: real street-level detail, no API key, light + dark
 * variants. MapLibre's own demo style carries only country outlines, which
 * renders as an empty block at city zoom.
 *
 * Set VITE_MAP_STYLE_URL to a vector style (MapTiler, Protomaps) to override;
 * that path is preferred for production.
 */
const OVERRIDE_STYLE = import.meta.env.VITE_MAP_STYLE_URL;

/**
 * MapLibre parses GeoJSON in a web worker. Pointing at a copy of the worker
 * served from /public sidesteps any bundler quirks around spawning it from a
 * chunked module URL. Kept in sync by `npm run sync:map-worker` (see
 * package.json's postinstall).
 */
let workerConfigured = false;
function ensureWorker() {
  if (workerConfigured) return;
  workerConfigured = true;
  try {
    setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
  } catch {
    // Older builds resolve their own worker; leave the default in place.
  }
}

const ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · © <a href="https://carto.com/attributions">CARTO</a>';

const tileUrls = (variant) =>
  ["a", "b", "c", "d"].map((s) => `https://${s}.basemaps.cartocdn.com/${variant}/{z}/{x}/{y}.png`);

function rasterStyle(dark) {
  return {
    version: 8,
    sources: {
      basemap: {
        type: "raster",
        tiles: tileUrls(dark ? "dark_all" : "light_all"),
        tileSize: 256,
        maxzoom: 20,
        attribution: ATTRIBUTION,
      },
    },
    layers: [
      {
        id: "background",
        type: "background",
        paint: { "background-color": dark ? "#0b1017" : "#eef1f5" },
      },
      { id: "basemap", type: "raster", source: "basemap" },
    ],
  };
}

function isDarkMode() {
  if (typeof document === "undefined") return false;
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark") return true;
  if (attr === "light") return false;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

export function MapCanvas({
  markers = [],
  route,
  center = [78.3, 30.1],
  zoom = 6,
  fitToContent = true,
  className,
  height = 420,
  onMapClick,
  // Off only for very small/decorative embeds (e.g. the 3D map-room wall
  // panel) — MapLibre's zoom buttons and attribution are sized for a real
  // utility map and overwhelm anything much smaller than that.
  controls = true,
}) {
  const container = useRef(null);
  const map = useRef(null);
  const pendingRemoval = useRef(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  // Bumped whenever the basemap style is replaced, so layer effects re-run.
  const [styleEpoch, setStyleEpoch] = useState(0);

  const buildStyle = useCallback(
    () => (OVERRIDE_STYLE ? OVERRIDE_STYLE : rasterStyle(isDarkMode())),
    []
  );

  /* -------------------------------------------------------------- mount --- */
  useEffect(() => {
    // A remount cancels any deferred teardown (see cleanup below).
    if (pendingRemoval.current) {
      clearTimeout(pendingRemoval.current);
      pendingRemoval.current = null;
    }
    if (!container.current || map.current) return;

    ensureWorker();

    let instance;
    try {
      instance = new MapLibreMap({
        container: container.current,
        style: buildStyle(),
        center,
        zoom,
        attributionControl: controls ? { compact: true } : false,
      });
    } catch {
      setFailed(true);
      return;
    }

    map.current = instance;
    if (import.meta.env.DEV) {
      window.__map = instance;
    }
    if (controls) instance.addControl(new NavigationControl({ showCompass: false }), "top-right");
    instance.on("load", () => setReady(true));

    // A single 404 tile must not blank the whole map — only a hard style
    // failure counts as a failure.
    instance.on("error", (e) => {
      const msg = String(e?.error?.message ?? "");
      if (msg.toLowerCase().includes("style")) setFailed(true);
    });

    return () => {
      // Defer teardown by a tick. React StrictMode (dev only) unmounts and
      // immediately remounts; calling remove() synchronously tears down
      // MapLibre's shared worker pool, after which GeoJSON parsing silently
      // never completes on the recreated map. A real unmount has no remount
      // to cancel this, so the map is still disposed.
      pendingRemoval.current = setTimeout(() => {
        instance.remove();
        if (map.current === instance) map.current = null;
        pendingRemoval.current = null;
      }, 0);
    };
    // Mount once; markers/route have their own effects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------------------------------ click to place --- */
  // Kept in a ref-free effect so the handler always sees the latest callback.
  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready) return;

    const canvas = instance.getCanvas();
    canvas.style.cursor = onMapClick ? "crosshair" : "";

    if (!onMapClick) return;
    const handle = (e) => onMapClick({ lng: +e.lngLat.lng.toFixed(6), lat: +e.lngLat.lat.toFixed(6) });

    instance.on("click", handle);
    return () => {
      instance.off("click", handle);
      canvas.style.cursor = "";
    };
  }, [onMapClick, ready]);

  /* -------------------------------------------- follow the viewer's theme --- */
  useEffect(() => {
    if (OVERRIDE_STYLE) return;

    const apply = () => {
      const instance = map.current;
      if (!instance) return;
      instance.setStyle(rasterStyle(isDarkMode()));
      instance.once("styledata", () => setStyleEpoch((n) => n + 1));
    };

    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    mq?.addEventListener("change", apply);

    const observer = new MutationObserver(apply);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      mq?.removeEventListener("change", apply);
      observer.disconnect();
    };
  }, []);

  /* ------------------------------------------------------------ markers --- */
  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready) return;

    const created = markers.map((m) => {
      const el = document.createElement(m.href ? "a" : "div");
      if (m.href && el instanceof HTMLAnchorElement) el.href = m.href;
      el.setAttribute("aria-label", m.label);
      el.className = "block cursor-pointer";
      const fill =
        m.tone === "create" ? "var(--create)"
          : m.tone === "muted" ? "var(--text-faint)"
            : "var(--brand)";
      el.style.cssText = `
        width:15px;height:15px;border-radius:9999px;
        background:${fill};
        border:3px solid #fff;
        box-shadow:0 1px 5px rgb(0 0 0 / .45);`;

      return new Marker({ element: el })
        .setLngLat([m.lng, m.lat])
        .setPopup(
          new Popup({ offset: 15, closeButton: false }).setHTML(
            `<strong style="font-size:13px">${escapeHtml(m.label)}</strong>${m.sublabel
              ? `<br><span style="font-size:11px;opacity:.7">${escapeHtml(m.sublabel)}</span>`
              : ""
            }`
          )
        )
        .addTo(instance);
    });

    return () => created.forEach((m) => m.remove());
  }, [markers, ready]);

  /* ---------------------------------------------------------- route line --- */
  // Idempotent: a style swap wipes custom layers, and adding a source before
  // the style has settled silently yields an EMPTY source. So re-apply on every
  // styledata event and use setData when the source already exists.
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    const id = "journey-route";

    if (!ready) return;

    const apply = () => {
      // NOTE: do NOT gate on isStyleLoaded() — with a raster basemap it stays
      // false while tiles stream, which blocks the layer forever. The `load`
      // event (which gates `ready`) already guarantees it's safe to add layers.
      const coords = route?.coordinates;
      if (!coords?.length) {
        if (instance.getLayer(`${id}-line`)) instance.removeLayer(`${id}-line`);
        if (instance.getLayer(`${id}-casing`)) instance.removeLayer(`${id}-casing`);
        if (instance.getSource(id)) instance.removeSource(id);
        return;
      }

      const data = {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: coords },
      };

      const source = instance.getSource(id);
      if (source && "setData" in source) {
        source.setData(data);
      } else {
        instance.addSource(id, { type: "geojson", data });
      }

      if (!instance.getLayer(`${id}-casing`)) {
        instance.addLayer({
          id: `${id}-casing`,
          type: "line",
          source: id,
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#ffffff", "line-width": 8, "line-opacity": 0.95 },
        });
      }
      if (!instance.getLayer(`${id}-line`)) {
        instance.addLayer({
          id: `${id}-line`,
          type: "line",
          source: id,
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#2563eb", "line-width": 4 },
        });
      }
    };

    apply();
    // A theme swap replaces the style and wipes custom layers; style.load fires
    // once the replacement is ready.
    instance.on("style.load", apply);
    return () => {
      instance.off("style.load", apply);
    };
  }, [route, ready, styleEpoch]);

  /* --------------------------------------------------------- fit bounds --- */
  // Runs after the container has its final size — fitting against an unsettled
  // canvas produces a zoom that's far too wide.
  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready || !fitToContent) return;

    const points = [
      ...markers.map((m) => [m.lng, m.lat]),
      ...(route?.coordinates ?? []),
    ];
    if (points.length < 2) return;

    const bounds = points.reduce(
      (acc, p) => acc.extend(p),
      new LngLatBounds(points[0], points[0])
    );

    const fit = () => {
      instance.resize();
      instance.fitBounds(bounds, { padding: 48, maxZoom: 13, duration: 0 });
    };

    fit();
    // Re-fit once the layout settles (tab panels and lazy-loaded chunks mount
    // at a size that isn't final).
    const raf = requestAnimationFrame(fit);
    const observer = new ResizeObserver(fit);
    if (container.current) observer.observe(container.current);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [markers, route, ready, fitToContent]);

  if (failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--bg-subtle)] p-6 text-center",
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
        "relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)]",
        className
      )}
      style={{ height }}
    >
      <div ref={container} className="h-full w-full" />
      {!ready ? <div className="skeleton absolute inset-0" aria-hidden /> : null}
    </div>
  );
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );
}
