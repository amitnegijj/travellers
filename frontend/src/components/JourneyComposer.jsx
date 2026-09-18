// Logging a trip. The essentials — photos, title, where, when, cost, story —
// fit on one screen and are enough to publish. Everything else lives in
// optional sections the traveller opens only if they want to.
import { journeyCreateSchema } from "../validation/schemas.jsx";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createJourney, deleteJourney, updateJourney } from "../api/journeyApi.jsx";
import {
  ExpensesEditor, OptionalSection, PillChoice, StopsEditor, TipsEditor, uid,
} from "./ComposerSections.jsx";
import { MediaUploader } from "./MediaUploader.jsx";
import { Button, Card, Field, Input, Select, Textarea } from "./ui/index.jsx";
import { formatMoney, minorToRupees, rupeesToMinor } from "../utils/index.jsx";

// A single-figure cost is stored as one expense with this label, so it
// reopens in the quick field rather than as an itemised breakdown.
const QUICK_COST_LABEL = "Total trip cost";

const TRAVEL_STYLES = ["road-trip", "budget", "adventure", "slow", "weekend", "family", "solo"];

function isQuickCost(expenses) {
  return expenses.length === 1 && expenses[0].category === "other" && expenses[0].label === QUICK_COST_LABEL;
}

export function JourneyComposer({
  destinations, presetDestinationSlug, journeyId = null, initial = null,
}) {
  const navigate = useNavigate();
  const preset = destinations.find((d) => d.slug === presetDestinationSlug);

  const isEdit = !!journeyId;
  const alreadyPublished = initial?.status === "published";
  const initialExpenses = initial?.expenses ?? [];
  const startsQuick = isQuickCost(initialExpenses);

  /* ---------------------------------------------------------- essentials */
  const [media, setMedia] = useState(initial?.media ?? []);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [originName, setOriginName] = useState(initial?.originName ?? "");
  const [destinationId, setDestinationId] = useState(initial?.destinationId ?? preset?.id ?? "");
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [quickCost, setQuickCost] = useState(
    startsQuick ? String(minorToRupees(initialExpenses[0].amountMinor)) : ""
  );
  const [summary, setSummary] = useState(initial?.summary ?? "");

  /* ------------------------------------------------------------ optional */
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [distanceKm, setDistanceKm] = useState(
    initial?.distanceM != null ? String(initial.distanceM / 1000) : ""
  );
  const [durationHours, setDurationHours] = useState(
    initial?.durationMin != null ? String(initial.durationMin / 60) : ""
  );
  const [vehicle, setVehicle] = useState(initial?.vehicle ?? "");
  const [travelStyle, setTravelStyle] = useState(initial?.travelStyle ?? "");
  const [difficulty, setDifficulty] = useState(initial?.difficulty ?? "");

  const [stops, setStops] = useState(() =>
    (initial?.stops ?? []).map((s) => ({
      key: uid(),
      name: s.name,
      note: s.note ?? "",
      // Match the saved coordinate back to a destination so the picker reopens on it.
      destinationId:
        destinations.find(
          (d) =>
            s.lng != null && s.lat != null &&
            Math.abs(d.lng - s.lng) < 1e-6 && Math.abs(d.lat - s.lat) < 1e-6
        )?.id ?? "",
      arrivedOn: s.arrivedOn ?? "",
    }))
  );
  const [expenses, setExpenses] = useState(() =>
    startsQuick
      ? []
      : initialExpenses.map((e) => ({
          key: uid(),
          category: e.category,
          label: e.label ?? "",
          rupees: String(minorToRupees(e.amountMinor)),
          spentOn: e.spentOn ?? "",
        }))
  );
  const [tips, setTips] = useState(() =>
    (initial?.tips ?? []).map((t) => ({
      key: uid(),
      kind: t.kind === "warning" ? "warning" : "tip",
      body: t.body,
    }))
  );

  const [pending, setPending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const destination = destinations.find((d) => d.id === destinationId);
  const itemised = expenses.some((e) => Number(e.rupees) > 0);
  const itemisedMinor = expenses.reduce(
    (sum, e) => sum + (Number(e.rupees) > 0 ? rupeesToMinor(Number(e.rupees)) : 0), 0
  );

  function buildExpenses() {
    if (itemised) {
      return expenses.filter((e) => Number(e.rupees) > 0).map((e) => ({
        category: e.category,
        label: e.label.trim() || null,
        amountMinor: rupeesToMinor(Number(e.rupees)),
        spentOn: e.spentOn || null,
      }));
    }
    if (Number(quickCost) > 0) {
      return [{ category: "other", label: QUICK_COST_LABEL, amountMinor: rupeesToMinor(Number(quickCost)), spentOn: null }];
    }
    return [];
  }

  function buildPayload(publish) {
    return {
      title: title.trim(),
      summary: summary.trim() || null,
      coverUrl: media[0]?.url ?? null,
      originName: originName.trim() || null,
      destinationName: destination?.name ?? null,
      destinationId: destinationId || null,
      destination: destination ? { lng: destination.lng, lat: destination.lat } : null,
      distanceM: distanceKm ? Math.round(Number(distanceKm) * 1000) : null,
      durationMin: durationHours ? Math.round(Number(durationHours) * 60) : null,
      startDate: startDate || null,
      endDate: endDate || null,
      travelStyle: travelStyle || null,
      difficulty: difficulty || null,
      vehicle: vehicle.trim() || null,
      bestSeason: [],
      stops: stops.filter((s) => s.name.trim()).map((s) => {
        const d = destinations.find((x) => x.id === s.destinationId);
        return {
          name: s.name.trim(), note: s.note.trim() || null,
          lng: d?.lng ?? null, lat: d?.lat ?? null, arrivedOn: s.arrivedOn || null,
        };
      }),
      expenses: buildExpenses(),
      tips: tips.filter((t) => t.body.trim()).map((t) => ({ kind: t.kind, body: t.body.trim() })),
      mediaIds: media.map((m) => m.id),
      publish,
    };
  }

  async function submit(publish) {
    setError(null);
    setFieldErrors({});

    const parsed = journeyCreateSchema.safeParse(buildPayload(publish));
    if (!parsed.success) {
      const errors = {};
      for (const issue of parsed.error.issues) errors[String(issue.path[0])] = issue.message;
      setFieldErrors(errors);
      setError(errors.title ? "Give your trip a title (at least 3 characters)." : "Check the highlighted fields.");
      return;
    }

    setPending(true);
    try {
      const result = journeyId
        ? await updateJourney(journeyId, parsed.data)
        : await createJourney(parsed.data);

      // Editing always lands back on the journey. A fresh draft goes to the
      // author's own list — the only place an unpublished journey is reachable.
      navigate(publish || alreadyPublished ? `/journeys/${result.id}` : "/journeys/mine");
    } catch (err) {
      if (err.status === 401) {
        navigate("/login");
        return;
      }
      setError(err.message ?? "Could not save your trip");
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (!journeyId) return;
    if (!window.confirm("Delete this trip for good? This cannot be undone.")) return;

    setError(null);
    setDeleting(true);
    try {
      await deleteJourney(journeyId);
      navigate("/journeys/mine");
    } catch (err) {
      setError(err.message ?? "Could not delete this trip");
    } finally {
      setDeleting(false);
    }
  }

  const count = (list, pick) => list.filter(pick).length;
  const stopCount = count(stops, (s) => s.name.trim());
  const tipCount = count(tips, (t) => t.body.trim());
  const detailCount = [endDate, distanceKm, durationHours, vehicle, travelStyle, difficulty].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {error ? (
        <div
          role="alert"
          className="rounded-[var(--radius)] border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-4 py-3 text-sm font-semibold text-[var(--danger)]"
        >
          {error}
        </div>
      ) : null}

      {/* ------------------------------------------------------- essentials */}
      <Card className="space-y-4 p-5">
        <MediaUploader media={media} onChange={setMedia} />

        <Field label="Trip title" htmlFor="title" error={fieldErrors.title}>
          <Input
            id="title" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Weekend ride to Rishikesh"
            aria-invalid={!!fieldErrors.title} required autoFocus={!isEdit}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="From" htmlFor="origin">
            <Input id="origin" value={originName} onChange={(e) => setOriginName(e.target.value)} placeholder="Delhi" />
          </Field>
          <Field label="To" htmlFor="destination">
            <Select id="destination" value={destinationId} onChange={(e) => setDestinationId(e.target.value)}>
              <option value="">Pick a place</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>{d.name}{d.region ? ` · ${d.region}` : ""}</option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="When" htmlFor="startDate">
            <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field
            label="Total cost (₹)" htmlFor="quickCost"
            hint={itemised ? "Worked out from your cost breakdown below." : "Rough is fine."}
          >
            <Input
              id="quickCost" type="number" min={0} inputMode="numeric"
              value={itemised ? String(minorToRupees(itemisedMinor)) : quickCost}
              onChange={(e) => setQuickCost(e.target.value)}
              disabled={itemised}
              placeholder="5000"
            />
          </Field>
        </div>

        <Field label="How was it?" htmlFor="summary" hint="Optional — a line or two is plenty.">
          <Textarea
            id="summary" value={summary} onChange={(e) => setSummary(e.target.value)}
            rows={3} placeholder="Left early, stopped for parathas in Meerut, reached by noon."
          />
        </Field>
      </Card>

      {/* --------------------------------------------------------- optional */}
      <p className="px-1 pt-1 text-xs font-bold uppercase tracking-wider text-[var(--text-faint)]">
        Want to add more? All optional
      </p>

      <OptionalSection
        id="stops" title="Stops along the way"
        summary={stopCount ? `${stopCount} added` : null} defaultOpen={stopCount > 0}
      >
        <StopsEditor stops={stops} setStops={setStops} destinations={destinations} />
      </OptionalSection>

      <OptionalSection
        id="costs" title="Cost breakdown"
        summary={itemised ? formatMoney(itemisedMinor) : null} defaultOpen={itemised}
      >
        <ExpensesEditor expenses={expenses} setExpenses={setExpenses} totalMinor={itemisedMinor} />
      </OptionalSection>

      <OptionalSection
        id="tips" title="Tips & warnings"
        summary={tipCount ? `${tipCount} added` : null} defaultOpen={tipCount > 0}
      >
        <TipsEditor tips={tips} setTips={setTips} />
      </OptionalSection>

      <OptionalSection
        id="details" title="Trip details"
        summary={detailCount ? `${detailCount} filled` : null} defaultOpen={detailCount > 0}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Return date" htmlFor="endDate">
            <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
          <Field label="Vehicle" htmlFor="vehicle">
            <Input id="vehicle" value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="Car, bike, bus…" />
          </Field>
          <Field label="Distance (km)" htmlFor="distance">
            <Input id="distance" type="number" min={0} inputMode="numeric" value={distanceKm}
                   onChange={(e) => setDistanceKm(e.target.value)} placeholder="240" />
          </Field>
          <Field label="Travel time (hrs)" htmlFor="duration">
            <Input id="duration" type="number" min={0} step="0.5" inputMode="decimal" value={durationHours}
                   onChange={(e) => setDurationHours(e.target.value)} placeholder="6" />
          </Field>
        </div>
        <Field label="Kind of trip">
          <PillChoice options={TRAVEL_STYLES} value={travelStyle} onChange={setTravelStyle} />
        </Field>
        <Field label="Difficulty">
          <PillChoice options={["easy", "moderate", "hard"]} value={difficulty} onChange={setDifficulty} capitalize />
        </Field>
      </OptionalSection>

      {/* ---------------------------------------------------------- actions */}
      <div className="sticky bottom-20 z-10 flex flex-wrap items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]/95 p-3 shadow-[var(--shadow)] backdrop-blur lg:bottom-4">
        {isEdit ? (
          <Button type="button" variant="ghost" disabled={deleting} onClick={remove}>
            <Trash2 size={15} />
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        ) : null}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {alreadyPublished ? null : (
            <Button type="button" variant="ghost" disabled={pending} onClick={() => submit(false)}>
              Save draft
            </Button>
          )}
          <Button
            type="button" variant="create" size="lg"
            disabled={pending || title.trim().length < 3}
            onClick={() => submit(true)}
          >
            {pending ? <Loader2 size={16} className="animate-spin" /> : null}
            {pending
              ? alreadyPublished ? "Saving…" : "Posting…"
              : alreadyPublished ? "Save changes" : "Post trip"}
          </Button>
        </div>
      </div>
    </div>
  );
}
