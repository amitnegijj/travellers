import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { cn } from "../lib/utils.js";

export const THEME_KEY = "travelora-theme";
export const DEFAULT_THEME = "light";

export function applyTheme(choice) {
  const el = document.documentElement;
  if (choice === "system") el.removeAttribute("data-theme");
  else el.setAttribute("data-theme", choice);
}

/* -------------------------------------------------------------------------
   localStorage is the source of truth, so the theme is read through
   useSyncExternalStore rather than mirrored into state. A change in one tab
   reaches the others via the `storage` event.
   ------------------------------------------------------------------------- */

const listeners = new Set();

function subscribe(onChange) {
  listeners.add(onChange);
  // `storage` only fires in *other* tabs, hence the local listener set too.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {
    // Storage throws in some private-browsing modes; the default is fine.
  }
  return DEFAULT_THEME;
}

function setTheme(next) {
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    // Non-fatal: the theme still applies for this page view.
  }
  applyTheme(next);
  for (const listener of listeners) listener();
}

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeToggle({ className }) {
  const choice = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // A "system" choice has to keep tracking the OS while the page is open.
  useEffect(() => {
    if (choice !== "system") return;
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const sync = () => applyTheme("system");
    mq?.addEventListener("change", sync);
    return () => mq?.removeEventListener("change", sync);
  }, [choice]);

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-[var(--border)]",
        "bg-[var(--surface-2)] p-0.5",
        className
      )}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = choice === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={`${label} theme`}
            onClick={() => setTheme(value)}
            className={cn(
              "grid h-7 w-7 place-items-center rounded-full transition-colors",
              active
                ? "bg-[var(--surface)] text-[var(--brand)] shadow-[var(--shadow-sm)]"
                : "text-[var(--text-faint)] hover:text-[var(--text)]"
            )}
          >
            <Icon size={14} strokeWidth={2.3} />
          </button>
        );
      })}
    </div>
  );
}
