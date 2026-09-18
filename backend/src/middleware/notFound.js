/** Anything that reached the end of the router stack is an unknown route. */
export function notFound(req, res) {
  res.status(404).json({ error: { code: "not_found", message: "No such route" } });
}
