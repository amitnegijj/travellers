// Display formatting for the trip measurements shown on cards and detail pages.

export function formatDistance(metres) {
  if (metres == null) return null;
  return metres >= 1000 ? `${Math.round(metres / 1000)} km` : `${metres} m`;
}

export function formatDuration(minutes) {
  if (minutes == null) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export const initials = (name) =>
  name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
