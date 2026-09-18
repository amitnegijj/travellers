/** Builds a query string, dropping empty and nullish params. */
export function withQuery(path, params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null && v !== "")
  ).toString();
  return query ? `${path}?${query}` : path;
}
