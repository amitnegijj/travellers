import { cn } from "../../utils/index.js";

/* ------------------------------------------------------------ Empty/Error */

export function EmptyState({ icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[var(--radius-lg)]",
        "border border-dashed border-[var(--border-strong)] bg-[var(--surface)]/60",
        "px-6 py-16 text-center",
        className
      )}
    >
      {icon ? (
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-[var(--brand-soft)] text-[var(--brand)]">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-bold text-[var(--text)]">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-[var(--text-muted)]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", description, action }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-6 py-14 text-center"
    >
      <h3 className="text-base font-bold text-[var(--danger)]">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm text-[var(--text-muted)]">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
