import { cn } from "../../utils/index.js";

/* ---------------------------------------------------------------- Skeleton */

export function Skeleton({ className }) {
  return <div className={cn("skeleton rounded-[var(--radius)]", className)} />;
}
