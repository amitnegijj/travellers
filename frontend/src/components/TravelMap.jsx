import { userPlaceCreateSchema } from "../validation/schemas.js";
import {
  Eye, EyeOff, Globe, Loader2, Lock, MapPin, Plus, Trash2, X,
} from "lucide-react";
import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { api } from "../api/client.js";
import { MediaUploader } from "./MediaUploader.jsx";
import {
  Badge, Button, Card, Field, Input, Photo, SectionHeader, Skeleton, Textarea,
} from "./ui/index.js";
import { cn } from "../utils/index.js";

const MapCanvas = lazy(() => import("./MapCanvas.jsx").then((m) => ({ default: m.MapCanvas })));
const MapFallback = () => <Skeleton className="h-[440px] w-full rounded-[var(--radius-xl)]" />;

export function TravelMap({ handle, displayName, initialPlaces, journeyPlaces, isOwner }) {
  const [places, setPlaces] = useState(initialPlaces);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(null);

  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [visitedOn, setVisitedOn] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [media, setMedia] = useState([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const publicCount = places.filter((p) => p.visibility === "public").length;
  const privateCount = places.length - publicCount;

  const onMapClick = useCallback(
    (coord) => {
      if (!adding) return;
      setDraft(coord);
    },
    [adding]
  );

  const markers = useMemo(() => {
    const out = journeyPlaces.map((d) => ({
      id: `j-${d.id}`,
      lng: Number(d.lng),
      lat: Number(d.lat),
      label: d.name,
      sublabel: `${d.journeyCount} journey${d.journeyCount === 1 ? "" : "s"} logged`,
      href: `/destinations/${d.slug}`,
      tone: "muted",
    }));

    for (const p of places) {
      out.push({
        id: p.id,
        lng: Number(p.lng),
        lat: Number(p.lat),
        label: p.name,
        sublabel: p.visibility === "private" ? "Private pin" : p.note ?? undefined,
        tone: p.visibility === "private" ? "create" : "brand",
      });
    }

    if (draft) {
      out.push({ id: "draft", lng: draft.lng, lat: draft.lat, label: "New pin", tone: "create" });
    }
    return out;
  }, [places, journeyPlaces, draft]);

  function resetForm() {
    setName(""); setNote(""); setVisitedOn(""); setVisibility("private");
    setMedia([]); setDraft(null); setError(null);
  }

  async function save() {
    setError(null);
    if (!draft) {
      setError("Click the map to drop a pin first.");
      return;
    }

    const parsed = userPlaceCreateSchema.safeParse({
      name: name.trim(),
      note: note.trim() || null,
      lng: draft.lng,
      lat: draft.lat,
      photoUrl: media[0]?.url ?? null,
      visibility,
      visitedOn: visitedOn || null,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form");
      return;
    }

    setPending(true);
    try {
      const created = await api.post(`/api/v1/profiles/${handle}/places`, parsed.data);
      setPlaces((prev) => [created, ...prev]);
      resetForm();
      setAdding(false);
    } catch (err) {
      setError(err.message ?? "Could not save that pin");
    } finally {
      setPending(false);
    }
  }

  async function toggleVisibility(place) {
    const next = place.visibility === "public" ? "private" : "public";
    const previous = places;
    setPlaces((prev) => prev.map((p) => (p.id === place.id ? { ...p, visibility: next } : p)));

    try {
      await api.patch(`/api/v1/user-places/${place.id}`, { visibility: next });
    } catch {
      setPlaces(previous);
    }
  }

  async function remove(place) {
    const previous = places;
    setPlaces((prev) => prev.filter((p) => p.id !== place.id));
    try {
      await api.delete(`/api/v1/user-places/${place.id}`);
    } catch {
      setPlaces(previous);
    }
  }

  return (
    <section>
      <SectionHeader
        title={isOwner ? "Your travel map" : `${displayName}'s travel map`}
        hint={
          isOwner
            ? `${places.length} pin${places.length === 1 ? "" : "s"} · ${publicCount} public, ${privateCount} private`
            : `${places.length} public pin${places.length === 1 ? "" : "s"}`
        }
      />

      {isOwner ? (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Button
            variant={adding ? "secondary" : "create"}
            size="sm"
            onClick={() => { setAdding((v) => !v); setDraft(null); setError(null); }}
          >
            {adding ? <X size={15} /> : <Plus size={15} />}
            {adding ? "Cancel" : "Pin a place"}
          </Button>
          {adding ? (
            <span className="text-xs font-semibold text-[var(--brand)]">
              Click anywhere on the map to drop your pin
            </span>
          ) : null}
        </div>
      ) : null}

      <Suspense fallback={<MapFallback />}>
        <MapCanvas
          markers={markers}
          height={440}
          onMapClick={isOwner && adding ? onMapClick : undefined}
        />
      </Suspense>

      {/* legend */}
      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-semibold text-[var(--text-muted)]">
        <span className="flex items-center gap-1.5">
          <Dot color="var(--brand)" /> Public pins
        </span>
        {isOwner ? (
          <span className="flex items-center gap-1.5">
            <Dot color="var(--create)" /> Private (only you)
          </span>
        ) : null}
        <span className="flex items-center gap-1.5">
          <Dot color="var(--text-faint)" /> Reached via journeys
        </span>
      </div>

      {/* ------------------------------------------------------- add form */}
      {isOwner && adding ? (
        <Card className="mt-4 space-y-4 p-5">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-[var(--brand)]" />
            <h3 className="font-extrabold text-[var(--text)]">New pin</h3>
            {draft ? (
              <Badge tone="brand">
                {draft.lat.toFixed(4)}, {draft.lng.toFixed(4)}
              </Badge>
            ) : (
              <Badge tone="warning">No location yet</Badge>
            )}
          </div>

          {error ? (
            <p role="alert" className="text-sm font-semibold text-[var(--danger)]">{error}</p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Place name" htmlFor="pin-name">
              <Input
                id="pin-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="That dhaba past Byasi"
              />
            </Field>
            <Field label="When were you there?" htmlFor="pin-date">
              <Input
                id="pin-date"
                type="date"
                value={visitedOn}
                onChange={(e) => setVisitedOn(e.target.value)}
              />
            </Field>
          </div>

          <Field label="What should people know?" htmlFor="pin-note">
            <Textarea
              id="pin-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Best parathas on the route. Parking behind the building."
            />
          </Field>

          <Field label="Photo" htmlFor="pin-photo">
            <MediaUploader media={media} onChange={setMedia} />
          </Field>

          {/* --------------------------------------------- privacy control */}
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-[var(--text)]">
              Who can see this pin?
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <VisibilityOption
                selected={visibility === "private"}
                onSelect={() => setVisibility("private")}
                icon={<Lock size={16} />}
                title="Private"
                description="Only you. Nobody else sees this pin or its location."
              />
              <VisibilityOption
                selected={visibility === "public"}
                onSelect={() => setVisibility("public")}
                icon={<Globe size={16} />}
                title="Public"
                description="Shown on your profile map to anyone who visits."
              />
            </div>
          </fieldset>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => { resetForm(); setAdding(false); }}>
              Cancel
            </Button>
            <Button variant="create" onClick={save} disabled={pending || !draft}>
              {pending ? <Loader2 size={15} className="animate-spin" /> : null}
              {pending ? "Saving…" : "Save pin"}
            </Button>
          </div>
        </Card>
      ) : null}

      {/* ---------------------------------------------------- pin list */}
      {places.length > 0 ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {places.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              {p.photoUrl ? (
                <div className="relative aspect-[16/10] bg-[var(--bg-subtle)]">
                  <Photo src={p.photoUrl} className="h-full w-full" />
                  <div className="absolute right-2 top-2">
                    <Badge tone={p.visibility === "private" ? "warning" : "brand"}>
                      {p.visibility === "private" ? <Lock size={10} /> : <Globe size={10} />}
                      {p.visibility}
                    </Badge>
                  </div>
                </div>
              ) : null}

              <div className="p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-extrabold text-[var(--text)]">{p.name}</p>
                  {!p.photoUrl ? (
                    <Badge tone={p.visibility === "private" ? "warning" : "brand"}>
                      {p.visibility === "private" ? <Lock size={10} /> : <Globe size={10} />}
                      {p.visibility}
                    </Badge>
                  ) : null}
                </div>

                {p.visitedOn ? (
                  <p className="mt-0.5 text-[11px] text-[var(--text-faint)]">
                    {new Date(p.visitedOn).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </p>
                ) : null}

                {p.note ? (
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{p.note}</p>
                ) : null}

                {isOwner ? (
                  <div className="mt-3 flex items-center gap-2 border-t border-[var(--border)] pt-3">
                    <button
                      onClick={() => toggleVisibility(p)}
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
                    >
                      {p.visibility === "public" ? <EyeOff size={13} /> : <Eye size={13} />}
                      Make {p.visibility === "public" ? "private" : "public"}
                    </button>
                    <button
                      onClick={() => remove(p)}
                      aria-label={`Delete ${p.name}`}
                      className="ml-auto text-[var(--text-faint)] transition-colors hover:text-[var(--danger)]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] p-6 text-center text-sm text-[var(--text-muted)]">
          {isOwner
            ? "No pins yet. Hit “Pin a place” and click the map to add the first one."
            : `${displayName} hasn't shared any pins publicly.`}
        </p>
      )}
    </section>
  );
}

function Dot({ color }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full border-2 border-white shadow"
      style={{ background: color }}
      aria-hidden
    />
  );
}

function VisibilityOption({ selected, onSelect, icon, title, description }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex items-start gap-2.5 rounded-[var(--radius)] border p-3 text-left transition-all",
        selected
          ? "border-[var(--brand)] bg-[var(--brand-soft)]"
          : "border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--border-strong)]"
      )}
    >
      <span className={cn("mt-0.5", selected ? "text-[var(--brand)]" : "text-[var(--text-faint)]")}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-[var(--text)]">{title}</span>
        <span className="block text-[11px] leading-snug text-[var(--text-muted)]">
          {description}
        </span>
      </span>
    </button>
  );
}
