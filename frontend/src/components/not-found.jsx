import { Compass } from "lucide-react";
import { EmptyState, LinkButton } from "./ui.jsx";

/**
 * Shared by the catch-all route (app/(app)/not-found.tsx's old job) and any
 * page whose resource 404s (journey/destination/profile) — those used to call
 * Next's notFound() to render the exact same block from inside a page.
 */
export function NotFoundBlock({
  title = "This page doesn't exist",
  description = "The route you followed leads nowhere. Happens on the road too.",
}) {
  return (
    <div className="py-12">
      <EmptyState
        icon={<Compass size={32} />}
        title={title}
        description={description}
        action={<LinkButton to="/">Back to the feed</LinkButton>}
      />
    </div>
  );
}
