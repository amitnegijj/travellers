import { Compass, Flame, Mountain, Route, Sparkles, Tent, Wallet, Waves } from "lucide-react";
import { Link } from "react-router-dom";

// Instagram-stories-style entry points into Explore. Each one is a real search.
const CATEGORIES = [
  { label: "Trending", q: "", icon: Flame, from: "#f97316", to: "#ef4444" },
  { label: "Mountains", q: "mountain", icon: Mountain, from: "#3b82f6", to: "#6366f1" },
  { label: "Adventure", q: "adventure", icon: Tent, from: "#22c55e", to: "#14b8a6" },
  { label: "Budget", q: "budget", icon: Wallet, from: "#eab308", to: "#f97316" },
  { label: "Road trips", q: "road-trip", icon: Route, from: "#8b5cf6", to: "#d946ef" },
  { label: "Rivers", q: "river", icon: Waves, from: "#06b6d4", to: "#3b82f6" },
  { label: "Weekend", q: "weekend", icon: Sparkles, from: "#ec4899", to: "#f43f5e" },
  { label: "All", q: "", icon: Compass, from: "#64748b", to: "#334155" },
];

export function CategoryRail() {
  return (
    <div className="rail -mx-4 px-4 lg:mx-0 lg:px-0" role="list">
      {CATEGORIES.map(({ label, q, icon: Icon, from, to }) => (
        <Link
          key={label}
          to={q ? `/explore?q=${encodeURIComponent(q)}` : "/explore"}
          role="listitem"
          className="group flex w-[74px] flex-col items-center gap-1.5"
        >
          <span
            className="grid h-16 w-16 place-items-center rounded-full p-[2.5px] transition-transform group-hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
          >
            <span className="grid h-full w-full place-items-center rounded-full bg-[var(--surface)]">
              <Icon size={22} style={{ color: from }} strokeWidth={2.3} />
            </span>
          </span>
          <span className="truncate text-[11px] font-semibold text-[var(--text-muted)]">
            {label}
          </span>
        </Link>
      ))}
    </div>
  );
}
