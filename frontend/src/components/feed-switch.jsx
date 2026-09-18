import { LayoutGrid, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../lib/utils.js";

/**
 * Trails (immersive, one journey per screen) vs Grid (browse everything).
 * Plain links, so the choice survives a refresh and is shareable.
 */
export function FeedSwitch({ view, scope, floating = false }) {
  const href = (v) => {
    const params = new URLSearchParams();
    if (v === "grid") params.set("view", "grid");
    if (scope === "following") params.set("scope", "following");
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  };

  const options = [
    { key: "trails", label: "Trails", icon: Sparkles },
    { key: "grid", label: "Grid", icon: LayoutGrid },
  ];

  return (
    <div
      role="tablist"
      aria-label="Feed layout"
      className={cn(
        "inline-flex rounded-full p-1",
        floating
          ? "glass-strong"
          : "border border-[var(--border)] bg-[var(--surface-2)]"
      )}
    >
      {options.map(({ key, label, icon: Icon }) => {
        const on = view === key;
        return (
          <Link
            key={key}
            to={href(key)}
            role="tab"
            aria-selected={on}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-bold transition-all",
              on
                ? floating
                  ? "bg-white text-black"
                  : "bg-[var(--brand)] text-[var(--brand-text)] shadow-sm"
                : floating
                  ? "text-white/70 hover:text-white"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
            )}
          >
            <Icon size={14} strokeWidth={2.6} />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
