import { useEffect } from "react";

/** Stands in for the per-route `export const metadata` / `generateMetadata`
 *  Next.js used to read at render time — there's no server render here to do
 *  it for us, so each page sets its own tab title after it mounts (or after
 *  its data arrives, for titles that depend on the fetched resource). */
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Travelora` : "Travelora — Travel. Share. Inspire.";
  }, [title]);
}
