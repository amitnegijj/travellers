import * as React from "react";
import { cn } from "../../utils/index.js";

/* ------------------------------------------------------------------- Input */

export const Input = React.forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)]",
        "px-3.5 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)]",
        "transition-colors hover:border-[var(--border-strong)]",
        "focus:border-[var(--brand)] focus:bg-[var(--surface)] focus:outline-none focus:ring-4 focus:ring-[var(--brand)]/15",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "aria-[invalid=true]:border-[var(--danger)]",
        className
      )}
      {...props}
    />
  );
});

export const Textarea = React.forwardRef(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)]",
        "px-3.5 py-2.5 text-sm leading-relaxed text-[var(--text)] placeholder:text-[var(--text-faint)]",
        "transition-colors hover:border-[var(--border-strong)]",
        "focus:border-[var(--brand)] focus:bg-[var(--surface)] focus:outline-none focus:ring-4 focus:ring-[var(--brand)]/15",
        "disabled:cursor-not-allowed disabled:opacity-60 resize-y min-h-20",
        className
      )}
      {...props}
    />
  );
});

export const Select = React.forwardRef(function Select({ className, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        "h-11 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)]",
        "px-3 text-sm text-[var(--text)] transition-colors hover:border-[var(--border-strong)]",
        "focus:border-[var(--brand)] focus:outline-none focus:ring-4 focus:ring-[var(--brand)]/15",
        className
      )}
      {...props}
    />
  );
});

export function Field({ label, htmlFor, hint, error, children, className }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-[var(--text)]">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-[var(--danger)]" role="alert">{error}</p>
      ) : hint ? (
        <p className="text-xs text-[var(--text-faint)]">{hint}</p>
      ) : null}
    </div>
  );
}
