import { Link } from "react-router-dom";
import { cn } from "../../utils/index.jsx";

/* ------------------------------------------------------------------ Button */

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap " +
  "transition-all active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]";

const BUTTON_VARIANT = {
  primary:
    "bg-[var(--brand)] text-[var(--brand-text)] hover:bg-[var(--brand-hover)] shadow-[var(--shadow-sm)]",
  create:
    "bg-[var(--create)] text-white hover:bg-[var(--create-hover)] shadow-[var(--shadow-sm)]",
  secondary:
    "bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface-hover)]",
  outline:
    "bg-transparent text-[var(--text)] border border-[var(--border-strong)] hover:bg-[var(--surface-hover)]",
  ghost:
    "bg-transparent text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]",
  danger: "bg-[var(--danger)] text-white hover:brightness-110",
  glass:
    "bg-white/15 text-white backdrop-blur-md border border-white/25 hover:bg-white/25",
};

const BUTTON_SIZE = {
  xs: "h-7 px-2.5 text-xs rounded-full",
  sm: "h-9 px-3.5 text-sm rounded-full",
  md: "h-10 px-5 text-sm rounded-full",
  lg: "h-12 px-7 text-[15px] rounded-full",
  icon: "h-10 w-10 rounded-full",
};

export function buttonClass(variant = "primary", size = "md") {
  return cn(BUTTON_BASE, BUTTON_VARIANT[variant], BUTTON_SIZE[size]);
}

export function Button({ variant = "primary", size = "md", className, ...props }) {
  return <button className={cn(buttonClass(variant, size), className)} {...props} />;
}

/** Like <Button>, but a router <Link> — `to` instead of `href`. */
export function LinkButton({ variant = "primary", size = "md", className, ...props }) {
  return <Link className={cn(buttonClass(variant, size), className)} {...props} />;
}
