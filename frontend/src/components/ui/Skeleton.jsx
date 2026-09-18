import { cn } from "../../utils/index.jsx";

/* ---------------------------------------------------------------- Skeleton */

export function Skeleton({ className }) {
  return <div className={cn("skeleton rounded-[var(--radius)]", className)} />;
}
