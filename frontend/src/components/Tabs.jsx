import { useId, useState } from "react";
import { cn } from "../utils/index.js";

/** Underlined tab bar — Overview / Itinerary / Map / Expenses / Tips. */
export function Tabs({ items, className }) {
  const [active, setActive] = useState(items[0]?.key);
  const baseId = useId();

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label="Journey sections"
        className="rail sticky top-16 z-30 -mx-4 border-b border-[var(--border)] bg-[var(--bg)]/95 px-4 backdrop-blur-xl lg:mx-0 lg:px-0"
      >
        {items.map((item) => {
          const selected = item.key === active;
          return (
            <button
              key={item.key}
              role="tab"
              id={`${baseId}-tab-${item.key}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.key}`}
              onClick={() => setActive(item.key)}
              className={cn(
                "relative shrink-0 px-4 py-3 text-sm font-bold transition-colors",
                selected
                  ? "text-[var(--brand)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              )}
            >
              {item.label}
              {selected ? (
                <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-t-full bg-[var(--brand)]" />
              ) : null}
            </button>
          );
        })}
      </div>

      {items.map((item) =>
        item.key === active ? (
          <div
            key={item.key}
            role="tabpanel"
            id={`${baseId}-panel-${item.key}`}
            aria-labelledby={`${baseId}-tab-${item.key}`}
            tabIndex={0}
            className="pt-6 focus-visible:outline-none"
          >
            {item.content}
          </div>
        ) : null
      )}
    </div>
  );
}
