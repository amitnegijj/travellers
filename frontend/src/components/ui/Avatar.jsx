import { mediaUrl } from "../../api/client.jsx";
import { cn, initials } from "../../utils/index.jsx";

/* ------------------------------------------------------------------ Avatar */

export function Avatar({ name, src, size = 40, ring = false, className }) {
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
        <img src={mediaUrl(src)} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        initials(name)
      )}
    </span>
  );
}

/** Overlapping avatar row — "Friends' recent trips". */
export function AvatarStack({ people, size = 30, max = 5 }) {
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
