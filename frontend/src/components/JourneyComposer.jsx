import { EXPENSE_CATEGORIES, journeyCreateSchema } from "../validation/schemas.js";
import {
  Check, GripVertical, ImagePlus, Loader2, MapPin, Plus, Route as RouteIcon,
  Send, Trash2, Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { MediaUploader } from "./MediaUploader.jsx";
import { Badge, Button, Card, Field, Input, Photo, Select, Textarea } from "./ui/index.js";
import { cn, formatMoney, minorToRupees, rupeesToMinor } from "../utils/index.js";

const uid = () => Math.random().toString(36).slice(2);

const STEPS = [
  { key: "basics", label: "Basic Info", icon: MapPin },
  { key: "route", label: "Route & Stops", icon: RouteIcon },
  { key: "details", label: "Add Details", icon: Wallet },
  { key: "publish", label: "Publish", icon: Send },
];

export function JourneyComposer({
  destinations, presetDestinationSlug, journeyId = null, initial = null,
}) {
  const navigate = useNavigate();
  const preset = destinations.find((d) => d.slug === presetDestinationSlug);

  const isEdit = !!journeyId;
  const alreadyPublished = initial?.status === "published";

  const [step, setStep] = useState(0);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [originName, setOriginName] = useState(initial?.originName ?? "");
  const [destinationId, setDestinationId] = useState(initial?.destinationId ?? preset?.id ?? "");
  const [distanceKm, setDistanceKm] = useState(
    initial?.distanceM != null ? String(initial.distanceM / 1000) : ""
  );
  const [durationHours, setDurationHours] = useState(
    initial?.durationMin != null ? String(initial.durationMin / 60) : ""
  );
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [travelStyle, setTravelStyle] = useState(initial?.travelStyle ?? "");
  const [difficulty, setDifficulty] = useState(initial?.difficulty ?? "");
  const [vehicle, setVehicle] = useState(initial?.vehicle ?? "");

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
    (initial?.expenses ?? []).map((e) => ({
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
  const [media, setMedia] = useState(initial?.media ?? []);

  const [pending, setPending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const destination = destinations.find((d) => d.id === destinationId);

  const totalMinor = expenses.reduce(
    (sum, e) => sum + (Number(e.rupees) > 0 ? rupeesToMinor(Number(e.rupees)) : 0), 0
  );

  const completeness = useMemo(() => {
    const checks = [
      !!title.trim(), !!summary.trim(), !!originName.trim(), !!destinationId,
      !!distanceKm, !!durationHours, !!startDate,
      stops.length > 0, expenses.length > 0, tips.length > 0,
      media.length > 0, !!travelStyle,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [title, summary, originName, destinationId, distanceKm, durationHours, startDate,
      stops.length, expenses.length, tips.length, media.length, travelStyle]);

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
      expenses: expenses.filter((e) => Number(e.rupees) > 0).map((e) => ({
        category: e.category,
        label: e.label.trim() || null,
        amountMinor: rupeesToMinor(Number(e.rupees)),
        spentOn: e.spentOn || null,
      })),
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
      setError("Check the highlighted fields.");
      if (errors.title) setStep(0);
      return;
    }

    setPending(true);
    try {
      const result = journeyId
        ? await api.patch(`/api/v1/journeys/${journeyId}`, parsed.data)
        : await api.post("/api/v1/journeys", parsed.data);

      // Editing always lands back on the journey. A fresh draft goes to the
      // author's own list — the only place an unpublished journey is reachable.
      navigate(publish || alreadyPublished ? `/journeys/${result.id}` : "/journeys/mine");
    } catch (err) {
      if (err.status === 401) {
        navigate("/login");
        return;
      }
      setError(err.message ?? "Could not save your journey");
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (!journeyId) return;
    if (!window.confirm("Delete this journey for good? This cannot be undone.")) return;

    setError(null);
    setDeleting(true);
    try {
      await api.delete(`/api/v1/journeys/${journeyId}`);
      navigate("/journeys/mine");
    } catch (err) {
      setError(err.message ?? "Could not delete this journey");
    } finally {
      setDeleting(false);
    }
  }

  const canAdvance = step === 0 ? title.trim().length >= 3 : true;

  return (
    <div className="space-y-5">
      {/* ---------------------------------------------------------- stepper */}
      <div className="rail -mx-4 px-4 lg:mx-0 lg:px-0">
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <button
              key={s.key}
              onClick={() => setStep(i)}
              aria-current={active ? "step" : undefined}
              className="flex min-w-[92px] flex-col items-center gap-1.5"
            >
              <span
                className={cn(
                  "grid h-10 w-10 place-items-center rounded-full border-2 transition-all",
                  active && "border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-text)] shadow-md",
                  done && "border-[var(--create)] bg-[var(--create)] text-white",
                  !active && !done && "border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text-faint)]"
                )}
              >
                {done ? <Check size={17} strokeWidth={3} /> : <s.icon size={17} />}
              </span>
              <span
                className={cn(
                  "text-[11px] font-bold",
                  active ? "text-[var(--brand)]" : "text-[var(--text-faint)]"
                )}
              >
                {s.label}
              </span>
            </button>
          );
        })}
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-[var(--radius)] border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-4 py-3 text-sm font-semibold text-[var(--danger)]"
        >
          {error}
        </div>
      ) : null}

      {/* ------------------------------------------------------ step 1 ---- */}
      {step === 0 ? (
        <Card className="overflow-hidden">
          <div className="relative aspect-[21/9] bg-[var(--bg-subtle)]">
            {media[0] ? (
              <Photo src={media[0].url} className="h-full w-full" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[var(--text-faint)]">
                <ImagePlus size={26} />
                <span className="text-xs font-semibold">Add a cover photo</span>
              </div>
            )}
            <div className="scrim-soft absolute inset-0" />
          </div>

          <div className="space-y-4 p-5">
            <MediaUploader media={media} onChange={setMedia} />

            <Field label="Trip title" htmlFor="title" error={fieldErrors.title}>
              <Input
                id="title" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Gurgaon → Devprayag"
                aria-invalid={!!fieldErrors.title} required
              />
            </Field>

            <Field label="Short description" htmlFor="summary" hint="What a stranger would actually want to know.">
              <Textarea
                id="summary" value={summary} onChange={(e) => setSummary(e.target.value)}
                rows={4} placeholder="My amazing 2 days road trip to Devprayag with friends."
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Starting from" htmlFor="origin">
                <Input id="origin" value={originName} onChange={(e) => setOriginName(e.target.value)} placeholder="Gurgaon" />
              </Field>
              <Field label="Destination" htmlFor="destination">
                <Select id="destination" value={destinationId} onChange={(e) => setDestinationId(e.target.value)}>
                  <option value="">Select a destination</option>
                  {destinations.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}{d.region ? ` · ${d.region}` : ""}</option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Start date" htmlFor="startDate">
                <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </Field>
              <Field label="End date" htmlFor="endDate">
                <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </Field>
            </div>

            <Field label="Travel type" htmlFor="style">
              <div className="flex flex-wrap gap-2">
                {["road-trip", "budget", "adventure", "slow", "weekend", "family", "solo"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setTravelStyle(travelStyle === s ? "" : s)}
                    aria-pressed={travelStyle === s}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-bold transition-all",
                      travelStyle === s
                        ? "border-transparent bg-[var(--brand)] text-[var(--brand-text)]"
                        : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:border-[var(--brand)]"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </Card>
      ) : null}

      {/* ------------------------------------------------------ step 2 ---- */}
      {step === 1 ? (
        <Card className="space-y-5 p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Distance (km)" htmlFor="distance">
              <Input id="distance" type="number" min={0} value={distanceKm}
                     onChange={(e) => setDistanceKm(e.target.value)} placeholder="320" />
            </Field>
            <Field label="Driving time (hrs)" htmlFor="duration">
              <Input id="duration" type="number" min={0} step="0.5" value={durationHours}
                     onChange={(e) => setDurationHours(e.target.value)} placeholder="7.5" />
            </Field>
            <Field label="Vehicle" htmlFor="vehicle">
              <Input id="vehicle" value={vehicle} onChange={(e) => setVehicle(e.target.value)}
                     placeholder="Royal Enfield Himalayan" />
            </Field>
          </div>

          <Field label="Difficulty" htmlFor="difficulty">
            <div className="flex flex-wrap gap-2">
              {["easy", "moderate", "hard"].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(difficulty === d ? "" : d)}
                  aria-pressed={difficulty === d}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-bold capitalize transition-all",
                    difficulty === d
                      ? "border-transparent bg-[var(--brand)] text-[var(--brand-text)]"
                      : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:border-[var(--brand)]"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </Field>

          <div className="border-t border-[var(--border)] pt-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-extrabold text-[var(--text)]">Stops along the way</h2>
              <Button
                type="button" variant="secondary" size="sm"
                onClick={() => setStops((s) => [...s, { key: uid(), name: "", note: "", destinationId: "", arrivedOn: "" }])}
              >
                <Plus size={14} /> Add stop
              </Button>
            </div>

            {stops.length === 0 ? (
              <p className="text-sm text-[var(--text-faint)]">
                Stops are what make a route reusable by someone else.
              </p>
            ) : (
              <ol className="space-y-3">
                {stops.map((stop, i) => (
                  <li key={stop.key} className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-3.5">
                    <div className="mb-3 flex items-center gap-2">
                      <GripVertical size={14} className="text-[var(--text-faint)]" />
                      <Badge tone="brand">Stop {i + 1}</Badge>
                      <button
                        type="button"
                        onClick={() => setStops((s) => s.filter((x) => x.key !== stop.key))}
                        aria-label={`Remove stop ${i + 1}`}
                        className="ml-auto text-[var(--text-faint)] hover:text-[var(--danger)]"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        value={stop.name}
                        onChange={(e) => setStops((s) => s.map((x) => x.key === stop.key ? { ...x, name: e.target.value } : x))}
                        placeholder="Stop name (e.g. Haridwar)"
                        aria-label={`Stop ${i + 1} name`}
                      />
                      <Select
                        value={stop.destinationId}
                        onChange={(e) => setStops((s) => s.map((x) => x.key === stop.key ? { ...x, destinationId: e.target.value } : x))}
                        aria-label={`Stop ${i + 1} location`}
                      >
                        <option value="">Pin to a destination (optional)</option>
                        {destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </Select>
                    </div>

                    <Textarea
                      value={stop.note}
                      onChange={(e) => setStops((s) => s.map((x) => x.key === stop.key ? { ...x, note: e.target.value } : x))}
                      rows={2} className="mt-3"
                      placeholder="What happened here? Fuel, food, traffic, timing…"
                      aria-label={`Stop ${i + 1} note`}
                    />
                  </li>
                ))}
              </ol>
            )}
          </div>
        </Card>
      ) : null}

      {/* ------------------------------------------------------ step 3 ---- */}
      {step === 2 ? (
        <div className="space-y-4">
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-[var(--text)]">What it cost</h2>
                {totalMinor > 0 ? (
                  <p className="text-sm font-extrabold text-[var(--create)]">
                    Total {formatMoney(totalMinor)}
                  </p>
                ) : null}
              </div>
              <Button
                type="button" variant="secondary" size="sm"
                onClick={() => setExpenses((e) => [...e, { key: uid(), category: "fuel", label: "", rupees: "", spentOn: "" }])}
              >
                <Plus size={14} /> Add
              </Button>
            </div>

            {expenses.length === 0 ? (
              <p className="text-sm text-[var(--text-faint)]">
                Costs are the single most useful thing you can add. Even rough numbers help.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {expenses.map((exp, i) => (
                  <li key={exp.key} className="grid gap-2 sm:grid-cols-[136px_1fr_120px_auto]">
                    <Select
                      value={exp.category}
                      onChange={(e) => setExpenses((s) => s.map((x) => x.key === exp.key ? { ...x, category: e.target.value } : x))}
                      aria-label={`Expense ${i + 1} category`}
                    >
                      {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </Select>
                    <Input
                      value={exp.label}
                      onChange={(e) => setExpenses((s) => s.map((x) => x.key === exp.key ? { ...x, label: e.target.value } : x))}
                      placeholder="Petrol, full tank" aria-label={`Expense ${i + 1} label`}
                    />
                    <Input
                      type="number" min={0} value={exp.rupees}
                      onChange={(e) => setExpenses((s) => s.map((x) => x.key === exp.key ? { ...x, rupees: e.target.value } : x))}
                      placeholder="₹ 1450" aria-label={`Expense ${i + 1} amount in rupees`}
                    />
                    <button
                      type="button"
                      onClick={() => setExpenses((s) => s.filter((x) => x.key !== exp.key))}
                      aria-label={`Remove expense ${i + 1}`}
                      className="grid h-11 w-11 place-items-center rounded-[var(--radius)] text-[var(--text-faint)] hover:bg-[var(--surface-hover)] hover:text-[var(--danger)]"
                    >
                      <Trash2 size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-extrabold text-[var(--text)]">Tips &amp; warnings</h2>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" size="sm"
                        onClick={() => setTips((t) => [...t, { key: uid(), kind: "tip", body: "" }])}>
                  <Plus size={14} /> Tip
                </Button>
                <Button type="button" variant="secondary" size="sm"
                        onClick={() => setTips((t) => [...t, { key: uid(), kind: "warning", body: "" }])}>
                  <Plus size={14} /> Warning
                </Button>
              </div>
            </div>

            {tips.length === 0 ? (
              <p className="text-sm text-[var(--text-faint)]">
                What would you tell someone doing this route next week?
              </p>
            ) : (
              <ul className="space-y-2.5">
                {tips.map((tip, i) => (
                  <li key={tip.key} className="flex gap-2">
                    <Select
                      value={tip.kind}
                      onChange={(e) => setTips((s) => s.map((x) => x.key === tip.key ? { ...x, kind: e.target.value } : x))}
                      className="w-32 shrink-0" aria-label={`Item ${i + 1} kind`}
                    >
                      <option value="tip">Tip</option>
                      <option value="warning">Warning</option>
                    </Select>
                    <Textarea
                      value={tip.body}
                      onChange={(e) => setTips((s) => s.map((x) => x.key === tip.key ? { ...x, body: e.target.value } : x))}
                      rows={2}
                      placeholder="Fill up at Haridwar — pumps past Devprayag are unreliable."
                      aria-label={`Item ${i + 1} text`}
                    />
                    <button
                      type="button"
                      onClick={() => setTips((s) => s.filter((x) => x.key !== tip.key))}
                      aria-label={`Remove item ${i + 1}`}
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius)] text-[var(--text-faint)] hover:bg-[var(--surface-hover)] hover:text-[var(--danger)]"
                    >
                      <Trash2 size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      ) : null}

      {/* ------------------------------------------------------ step 4 ---- */}
      {step === 3 ? (
        <Card className="space-y-5 p-5">
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-sm font-bold text-[var(--text)]">Journey completeness</span>
              <span className="text-lg font-extrabold tabular-nums text-[var(--brand)]">
                {completeness}%
              </span>
            </div>
            <div
              className="h-2.5 overflow-hidden rounded-full bg-[var(--bg-subtle)]"
              role="progressbar" aria-valuenow={completeness} aria-valuemin={0} aria-valuemax={100}
              aria-label="Journey completeness"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--brand)] to-[var(--create)] transition-all duration-300"
                style={{ width: `${completeness}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-[var(--text-faint)]">
              You can publish at any point and fill in the rest later. More detail makes it more
              useful to other travellers.
            </p>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <h3 className="mb-3 text-sm font-extrabold text-[var(--text)]">Summary</h3>
            <dl className="grid grid-cols-2 gap-y-2.5 text-sm sm:grid-cols-4">
              {[
                ["Title", title || "—"],
                ["Route", originName && destination ? `${originName} → ${destination.name}` : "—"],
                ["Distance", distanceKm ? `${distanceKm} km` : "—"],
                ["Total cost", totalMinor > 0 ? formatMoney(totalMinor) : "—"],
                ["Stops", String(stops.filter((s) => s.name.trim()).length)],
                ["Expenses", String(expenses.filter((e) => Number(e.rupees) > 0).length)],
                ["Tips", String(tips.filter((t) => t.body.trim()).length)],
                ["Photos", String(media.length)],
              ].map(([k, v]) => (
                <div key={k} className="min-w-0">
                  <dt className="text-[11px] font-semibold text-[var(--text-faint)]">{k}</dt>
                  <dd className="truncate font-bold text-[var(--text)]">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Card>
      ) : null}

      {/* ------------------------------------------------------ nav bar ---- */}
      <div className="flex flex-wrap items-center gap-3 pb-4">
        {step > 0 ? (
          <Button type="button" variant="secondary" size="lg" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        ) : null}

        {isEdit ? (
          <Button type="button" variant="ghost" size="lg" disabled={deleting} onClick={remove}>
            <Trash2 size={15} />
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        ) : null}

        <div className="ml-auto flex flex-wrap items-center gap-3">
          {alreadyPublished ? null : (
            <Button type="button" variant="ghost" size="lg" disabled={pending} onClick={() => submit(false)}>
              Save draft
            </Button>
          )}

          {step < STEPS.length - 1 ? (
            <Button type="button" size="lg" disabled={!canAdvance} onClick={() => setStep(step + 1)}>
              Next: {STEPS[step + 1].label}
            </Button>
          ) : (
            <Button type="button" variant="create" size="lg" disabled={pending} onClick={() => submit(true)}>
              {pending ? <Loader2 size={16} className="animate-spin" /> : null}
              {pending
                ? alreadyPublished ? "Saving…" : "Publishing…"
                : alreadyPublished ? "Save changes" : "Publish journey"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
