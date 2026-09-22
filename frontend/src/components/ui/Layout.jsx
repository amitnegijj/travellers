import { Link } from "react-router-dom";
import { mediaUrl } from "../../api/client.jsx";
import { cn } from "../../utils/index.jsx";

/* ----------------------------------------------------------------- Layout */

export function PageHeader({ title, description, action }) {
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

export function SectionHeader({ title, href, hint }) {
  return (
    <div className="mb-3.5 flex items-baseline justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-lg font-extrabold tracking-tight text-[var(--text)]">{title}</h2>
        {hint ? <p className="text-xs text-[var(--text-faint)]">{hint}</p> : null}
      </div>
      {href ? (
        <Link
          to={href}
          className="shrink-0 text-sm font-semibold text-[var(--brand)] hover:underline"
        >
          See all
        </Link>
      ) : null}
    </div>
  );
}

export function Divider({ className }) {
  return <hr className={cn("border-t border-[var(--border)]", className)} />;
}

/** Photo with a gradient scrim and a graceful fallback when the src fails. */
export function Photo({ src, alt = "", className, priority }) {
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
    <img
      src={mediaUrl(src)}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      className={cn("object-cover", className)}
    />
  );
}
