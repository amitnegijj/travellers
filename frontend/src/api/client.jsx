// The one place that talks HTTP to the Express API. Everything else calls
// `api.get/post/patch/delete` and gets back parsed JSON or a thrown ApiError —
// mirroring the shape `lib/api.ts`'s `handler()` used to guarantee server-side.
//
// In production the API is served from the same domain as the app (Vercel
// routes /api/* to it), so the default there is "" � a same-origin request.
export const API_URL =
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "http://localhost:4000" : "");

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request(path, { method = "GET", body, headers, signal } = {}) {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: "include", // send/receive the session cookie cross-origin
    headers: {
      ...(body !== undefined && !isForm ? { "content-type": "application/json" } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    signal,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const err = data?.error;
    throw new ApiError(
      res.status,
      err?.code ?? "internal",
      err?.message ?? "Something went wrong",
      err?.details
    );
  }
  return data;
}

export const api = {
  get: (path, signal) => request(path, { signal }),
  post: (path, body) => request(path, { method: "POST", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  delete: (path) => request(path, { method: "DELETE" }),
};

/** True when `err` is an ApiError for "you must be signed in". */
export const isUnauthorized = (err) => err instanceof ApiError && err.status === 401;

/**
 * Uploaded photos come back as a path relative to the API's own static
 * server (`/uploads/...`), not the SPA's origin — the two are different
 * origins in dev and can be different hosts in production. Anything already
 * absolute (an external https:// URL) passes through untouched.
 */
export function mediaUrl(url) {
  if (!url) return url;
  return url.startsWith("/") ? `${API_URL}${url}` : url;
}
