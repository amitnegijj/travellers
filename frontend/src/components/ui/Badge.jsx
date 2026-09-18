import { cn } from "../../utils/index.js";

/* ------------------------------------------------------------------- Badge */

export function Badge({ tone = "neutral", className, ...props }) {
  const tones = {
    neutral: "bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)]",
    brand: "bg-[var(--brand-soft)] text-[var(--brand)] border-transparent",
    create: "bg-[var(--create-soft)] text-[var(--create)] border-transparent",
    ai: "bg-[var(--ai-soft)] text-[var(--ai)] border-transparent",
    warning: "bg-[var(--warning-soft)] text-[var(--warning)] border-transparent",
    danger: "bg-[var(--danger-soft)] text-[var(--danger)] border-transparent",
    star: "bg-[var(--star)]/15 text-[var(--star)] border-transparent",
    glass: "bg-black/45 text-white border-white/20 backdrop-blur-md",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1",
        "text-[11px] font-semibold whitespace-nowrap",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
