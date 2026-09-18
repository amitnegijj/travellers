// The optional parts of the trip composer. Each one is collapsed until the
// traveller chooses to open it, so logging a trip starts as a short form.
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { EXPENSE_CATEGORIES } from "../validation/schemas.jsx";
import { Button, Input, Select, Textarea } from "./ui/index.jsx";
import { cn, formatMoney } from "../utils/index.jsx";

export const uid = () => Math.random().toString(36).slice(2);

const removeButtonClass =
  "grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius)] text-[var(--text-faint)] " +
  "hover:bg-[var(--surface-hover)] hover:text-[var(--danger)]";

/** A collapsible card. `summary` shows what's inside while it's closed. */
export function OptionalSection({ id, title, summary, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-[var(--surface-hover)]"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--brand-soft)] text-[var(--brand)]">
          {open ? <ChevronDown size={15} /> : <Plus size={15} />}
        </span>
        <span className="flex-1 font-extrabold text-[var(--text)]">{title}</span>
        {summary ? (
          <span className="text-xs font-semibold text-[var(--text-faint)]">{summary}</span>
        ) : null}
      </button>
      {open ? (
        <div id={`${id}-panel`} className="space-y-4 border-t border-[var(--border)] p-5">
          {children}
        </div>
      ) : null}
    </section>
  );
}

/** Tap-to-select pills; tapping the selected one clears it. */
export function PillChoice({ options, value, onChange, capitalize = false }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(value === o ? "" : o)}
          aria-pressed={value === o}
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-bold transition-all",
            capitalize && "capitalize",
            value === o
              ? "border-transparent bg-[var(--brand)] text-[var(--brand-text)]"
              : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:border-[var(--brand)]"
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

const patchItem = (setList, key, patch) =>
  setList((list) => list.map((x) => (x.key === key ? { ...x, ...patch } : x)));

export function StopsEditor({ stops, setStops, destinations }) {
  return (
    <>
      {stops.length === 0 ? (
        <p className="text-sm text-[var(--text-faint)]">
          Places you stopped at on the way — they help others reuse your route.
        </p>
      ) : (
        <ol className="space-y-3">
          {stops.map((stop, i) => (
            <li key={stop.key} className="space-y-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-3">
              <div className="flex gap-2">
                <Input
                  value={stop.name}
                  onChange={(e) => patchItem(setStops, stop.key, { name: e.target.value })}
                  placeholder={`Stop ${i + 1}, e.g. Haridwar`}
                  aria-label={`Stop ${i + 1} name`}
                />
                <button
                  type="button"
                  onClick={() => setStops((s) => s.filter((x) => x.key !== stop.key))}
                  aria-label={`Remove stop ${i + 1}`}
                  className={removeButtonClass}
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <Select
                value={stop.destinationId}
                onChange={(e) => patchItem(setStops, stop.key, { destinationId: e.target.value })}
                aria-label={`Stop ${i + 1} map location`}
              >
                <option value="">Show on map (optional)</option>
                {destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
              <Textarea
                value={stop.note}
                onChange={(e) => patchItem(setStops, stop.key, { note: e.target.value })}
                rows={2}
                placeholder="Anything worth knowing here? (optional)"
                aria-label={`Stop ${i + 1} note`}
              />
            </li>
          ))}
        </ol>
      )}
      <Button
        type="button" variant="secondary" size="sm"
        onClick={() => setStops((s) => [...s, { key: uid(), name: "", note: "", destinationId: "", arrivedOn: "" }])}
      >
        <Plus size={14} /> Add a stop
      </Button>
    </>
  );
}

export function ExpensesEditor({ expenses, setExpenses, totalMinor }) {
  return (
    <>
      {expenses.length === 0 ? (
        <p className="text-sm text-[var(--text-faint)]">
          Split the cost into fuel, food, stay and so on. Leave this closed if one total is enough.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {expenses.map((exp, i) => (
            <li key={exp.key} className="grid grid-cols-[1fr_110px_auto] gap-2 sm:grid-cols-[130px_1fr_120px_auto]">
              <Select
                value={exp.category}
                onChange={(e) => patchItem(setExpenses, exp.key, { category: e.target.value })}
                aria-label={`Cost ${i + 1} category`}
                className="col-span-3 capitalize sm:col-span-1"
              >
                {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
              <Input
                value={exp.label}
                onChange={(e) => patchItem(setExpenses, exp.key, { label: e.target.value })}
                placeholder="What for (optional)"
                aria-label={`Cost ${i + 1} description`}
              />
              <Input
                type="number" min={0} inputMode="numeric" value={exp.rupees}
                onChange={(e) => patchItem(setExpenses, exp.key, { rupees: e.target.value })}
                placeholder="₹"
                aria-label={`Cost ${i + 1} amount in rupees`}
              />
              <button
                type="button"
                onClick={() => setExpenses((s) => s.filter((x) => x.key !== exp.key))}
                aria-label={`Remove cost ${i + 1}`}
                className={removeButtonClass}
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center justify-between">
        <Button
          type="button" variant="secondary" size="sm"
          onClick={() => setExpenses((e) => [...e, { key: uid(), category: "fuel", label: "", rupees: "", spentOn: "" }])}
        >
          <Plus size={14} /> Add a cost
        </Button>
        {totalMinor > 0 ? (
          <span className="text-sm font-extrabold text-[var(--create)]">Total {formatMoney(totalMinor)}</span>
        ) : null}
      </div>
    </>
  );
}

export function TipsEditor({ tips, setTips }) {
  const add = (kind) => setTips((t) => [...t, { key: uid(), kind, body: "" }]);

  return (
    <>
      {tips.length === 0 ? (
        <p className="text-sm text-[var(--text-faint)]">
          What would you tell a friend doing this trip next week?
        </p>
      ) : (
        <ul className="space-y-2.5">
          {tips.map((tip, i) => (
            <li key={tip.key} className="flex gap-2">
              <Textarea
                value={tip.body}
                onChange={(e) => patchItem(setTips, tip.key, { body: e.target.value })}
                rows={2}
                placeholder={tip.kind === "warning"
                  ? "e.g. Pumps past Devprayag are unreliable"
                  : "e.g. Leave before 5am to beat the traffic"}
                aria-label={`${tip.kind === "warning" ? "Warning" : "Tip"} ${i + 1}`}
              />
              <button
                type="button"
                onClick={() => setTips((s) => s.filter((x) => x.key !== tip.key))}
                aria-label={`Remove item ${i + 1}`}
                className={removeButtonClass}
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => add("tip")}>
          <Plus size={14} /> Tip
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => add("warning")}>
          <Plus size={14} /> Warning
        </Button>
      </div>
    </>
  );
}
