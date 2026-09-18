import { formatMoney } from "../utils/index.js";

// Inline SVG donut — no charting dependency, theme-aware.
const SLICE_COLORS = {
  fuel: "#ef4444",
  food: "#3b82f6",
  stay: "#22c55e",
  tolls: "#f59e0b",
  tickets: "#8b5cf6",
  activities: "#ec4899",
  transport: "#06b6d4",
  other: "#94a3b8",
};

export const CATEGORY_LABEL = {
  fuel: "Fuel", food: "Food", stay: "Stay", tolls: "Tolls",
  tickets: "Tickets", activities: "Activities", transport: "Transport", other: "Other",
};

export function ExpenseDonut({ byCategory, total, currency = "INR", size = 210 }) {
  const stroke = size * 0.16;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const slices = byCategory.map(([category, amount]) => {
    const fraction = total > 0 ? amount / total : 0;
    const slice = {
      category,
      amount,
      pct: Math.round(fraction * 1000) / 10,
      color: SLICE_COLORS[category] ?? SLICE_COLORS.other,
      dash: fraction * circumference,
      offset,
    };
    offset += fraction * circumference;
    return slice;
  });

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-center sm:gap-8">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={`Expense breakdown totalling ${formatMoney(total, currency)}`}
          className="-rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--bg-subtle)"
            strokeWidth={stroke}
          />
          {slices.map((s) => (
            <circle
              key={s.category}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${s.dash} ${circumference - s.dash}`}
              strokeDashoffset={-s.offset}
              strokeLinecap="butt"
            />
          ))}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] font-semibold text-[var(--text-faint)]">Total</span>
          <span className="text-2xl font-extrabold tabular-nums text-[var(--text)]">
            {formatMoney(total, currency)}
          </span>
        </div>
      </div>

      <ul className="w-full max-w-xs space-y-2">
        {slices.map((s) => (
          <li key={s.category} className="flex items-center gap-2.5 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: s.color }}
              aria-hidden
            />
            <span className="font-semibold text-[var(--text)]">
              {CATEGORY_LABEL[s.category] ?? s.category}
            </span>
            <span className="ml-auto tabular-nums font-bold text-[var(--text)]">
              {formatMoney(s.amount, currency)}
            </span>
            <span className="w-11 shrink-0 text-right text-xs tabular-nums text-[var(--text-faint)]">
              {s.pct}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
