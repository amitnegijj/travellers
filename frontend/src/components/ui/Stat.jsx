import { cn } from "../../utils/index.jsx";

/* --------------------------------------------------------------- Stat tile */

export function Stat({ label, value, icon, accent }) {
  return (
    <div className="min-w-0 text-center">
      <div
        className={cn(
          "text-lg font-extrabold leading-tight tabular-nums sm:text-xl",
          accent ? "text-[var(--brand)]" : "text-[var(--text)]"
        )}
      >
        {value}
      </div>
      <div className="mt-0.5 flex items-center justify-center gap-1 text-[11px] text-[var(--text-faint)]">
        {icon}
        <span className="truncate">{label}</span>
      </div>
    </div>
  );
}

/** The 4-across stat strip used on journey + destination headers. */
export function StatStrip({ children, className }) {
  return (
    <div
      className={cn(
        "grid grid-cols-4 divide-x divide-[var(--border)] rounded-[var(--radius-lg)]",
        "border border-[var(--border)] bg-[var(--surface)] py-3.5",
        className
      )}
    >
      {children}
    </div>
  );
}
