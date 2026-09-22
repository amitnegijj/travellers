/** The only two shapes this API ever sends. */

const STATUS = {
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  validation: 422,
  conflict: 409,
  rate_limited: 429,
  internal: 500,
};

export const ok = (res, data, status = 200) => res.status(status).json(data);

export function fail(res, code, message, details) {
  res.status(STATUS[code] ?? 500).json({ error: { code, message, details } });
}

export { STATUS };
