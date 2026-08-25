import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

// ------------------------------------------------------------------- money
// Stored and transported as integer minor units. Formatted only at the edge.

export function formatMoney(minor: number | string | null | undefined, currency = "INR") {
  const value = Number(minor ?? 0) / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export const rupeesToMinor = (rupees: number) => Math.round(rupees * 100);
export const minorToRupees = (minor: number) => minor / 100;

// ---------------------------------------------------------------- distance

export function formatDistance(metres: number | null | undefined) {
  if (metres == null) return null;
  return metres >= 1000 ? `${Math.round(metres / 1000)} km` : `${metres} m`;
}

export function formatDuration(minutes: number | null | undefined) {
  if (minutes == null) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function formatDateRange(start?: string | null, end?: string | null) {
  if (!start) return null;
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  if (!end || end === start) return fmt(start);
  return `${new Date(start).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${fmt(end)}`;
}

export function relativeTime(iso: string | Date) {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function dayCount(start?: string | null, end?: string | null) {
  if (!start) return null;
  if (!end) return 1;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(ms / 86_400_000) + 1);
}

export const initials = (name: string) =>
  name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
