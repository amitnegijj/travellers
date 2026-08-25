import Link from "next/link";
import * as React from "react";
import { cn, initials } from "@/lib/utils";

/* ------------------------------------------------------------------ Button */

type ButtonVariant = "primary" | "create" | "secondary" | "ghost" | "danger" | "outline" | "glass";
type ButtonSize = "xs" | "sm" | "md" | "lg" | "icon";

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap " +
  "transition-all active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]";

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
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

const BUTTON_SIZE: Record<ButtonSize, string> = {
  xs: "h-7 px-2.5 text-xs rounded-full",
  sm: "h-9 px-3.5 text-sm rounded-full",
  md: "h-10 px-5 text-sm rounded-full",
  lg: "h-12 px-7 text-[15px] rounded-full",
  icon: "h-10 w-10 rounded-full",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md") {
  return cn(BUTTON_BASE, BUTTON_VARIANT[variant], BUTTON_SIZE[size]);
}

export function Button({
  variant = "primary", size = "md", className, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant; size?: ButtonSize;
}) {
  return <button className={cn(buttonClass(variant, size), className)} {...props} />;
}

export function LinkButton({
  variant = "primary", size = "md", className, ...props
}: React.ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link className={cn(buttonClass(variant, size), className)} {...props} />;
}

/* ------------------------------------------------------------------- Input */

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
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
  }
);

export const Textarea = React.forwardRef<
  HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
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

export const Select = React.forwardRef<
  HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, ...props }, ref) {
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

export function Field({
  label, htmlFor, hint, error, children, className,
}: {
  label: string; htmlFor?: string; hint?: string; error?: string | null;
  children: React.ReactNode; className?: string;
}) {
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

/* -------------------------------------------------------------------- Card */

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
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

/* ------------------------------------------------------------------ Avatar */

export function Avatar({
  name, src, size = 40, ring = false, className,
}: {
  name: string; src?: string | null; size?: number; ring?: boolean; className?: string;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        "bg-gradient-to-br from-[var(--brand)] to-[var(--ai)] font-bold text-white select-none",
        ring && "ring-2 ring-[var(--brand)] ring-offset-2 ring-offset-[var(--surface)]",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      role="img"
      aria-label={name}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        initials(name)
      )}
    </span>
  );
}

/** Overlapping avatar row — "Friends' recent trips". */
export function AvatarStack({
  people, size = 30, max = 5,
}: {
  people: { name: string; src?: string | null }[]; size?: number; max?: number;
}) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((p, i) => (
        <span
          key={i}
          className="rounded-full ring-2 ring-[var(--surface)]"
          style={{ marginLeft: i === 0 ? 0 : -size * 0.32, zIndex: shown.length - i }}
        >
          <Avatar name={p.name} src={p.src} size={size} />
        </span>
      ))}
      {extra > 0 ? (
        <span
          className="grid place-items-center rounded-full bg-[var(--surface-2)] text-[10px] font-bold text-[var(--text-muted)] ring-2 ring-[var(--surface)]"
          style={{ width: size, height: size, marginLeft: -size * 0.32 }}
        >
          +{extra}
        </span>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------- Badge */

type Tone = "neutral" | "brand" | "create" | "ai" | "warning" | "danger" | "glass" | "star";

export function Badge({
  tone = "neutral", className, ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  const tones: Record<Tone, string> = {
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

/* --------------------------------------------------------------- Stat tile */

export function Stat({
  label, value, icon, accent,
}: {
  label: string; value: React.ReactNode; icon?: React.ReactNode; accent?: boolean;
}) {
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
export function StatStrip({ children, className }: { children: React.ReactNode; className?: string }) {
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

/* ---------------------------------------------------------------- Skeleton */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-[var(--radius)]", className)} />;
}

/* ------------------------------------------------------------ Empty/Error */

export function EmptyState({
  icon, title, description, action, className,
}: {
  icon?: React.ReactNode; title: string; description?: string;
  action?: React.ReactNode; className?: string;
}) {
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

export function ErrorState({
  title = "Something went wrong", description, action,
}: {
  title?: string; description?: string; action?: React.ReactNode;
}) {
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

/* ----------------------------------------------------------------- Layout */

export function PageHeader({
  title, description, action,
}: {
  title: string; description?: string; action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-[var(--text)] sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 text-sm text-[var(--text-muted)]">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function SectionHeader({
  title, href, hint,
}: {
  title: string; href?: string; hint?: string;
}) {
  return (
    <div className="mb-3.5 flex items-baseline justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-lg font-extrabold tracking-tight text-[var(--text)]">{title}</h2>
        {hint ? <p className="text-xs text-[var(--text-faint)]">{hint}</p> : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="shrink-0 text-sm font-semibold text-[var(--brand)] hover:underline"
        >
          See all
        </Link>
      ) : null}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn("border-t border-[var(--border)]", className)} />;
}

/** Photo with a gradient scrim and a graceful fallback when the src fails. */
export function Photo({
  src, alt = "", className, priority,
}: {
  src?: string | null; alt?: string; className?: string; priority?: boolean;
}) {
  if (!src) {
    return (
      <div
        className={cn(
          "bg-gradient-to-br from-[var(--brand)]/25 via-[var(--ai)]/20 to-[var(--create)]/25",
          className
        )}
        aria-hidden
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      className={cn("object-cover", className)}
    />
  );
}
