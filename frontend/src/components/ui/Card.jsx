import { cn } from "../../utils/index.js";

/* -------------------------------------------------------------------- Card */

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]",
        "shadow-[var(--shadow-sm)]",
        className
      )}
      {...props}
    />
  );
}
