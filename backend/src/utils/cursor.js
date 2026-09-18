// Keyset pagination cursors. Opaque to the client, which only ever echoes
// back what it was given.

export function encodeCursor(c) {
  return Buffer.from(JSON.stringify(c)).toString("base64url");
}

/** A malformed cursor decodes to null — start from the beginning, don't throw. */
export function decodeCursor(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (typeof parsed?.ts === "string" && typeof parsed?.id === "string") return parsed;
    return null;
  } catch {
    return null;
  }
}
