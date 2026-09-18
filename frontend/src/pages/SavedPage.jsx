import { Bookmark } from "lucide-react";
import { api } from "../api/client.js";
import { JourneyCard, JourneyCardSkeleton } from "../components/journey-card.jsx";
import { EmptyState, LinkButton, PageHeader } from "../components/ui.jsx";
import { useSession } from "../context/session.jsx";
import { useApi } from "../hooks/useApi.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

export function SavedPage() {
  useDocumentTitle("Saved");
  const { user } = useSession();

  const { data, loading } = useApi(
    (signal) => api.get("/api/v1/journeys?saved=me&limit=30", signal),
    [user?.id]
  );

  const items = data?.items ?? [];

  return (
    <>
      <PageHeader
        title="Saved"
        description="Routes you've bookmarked to come back to."
      />

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <JourneyCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Bookmark size={26} />}
          title="Nothing saved yet"
          description="Tap the bookmark on any journey and it'll show up here."
          action={<LinkButton to="/explore" variant="secondary">Explore journeys</LinkButton>}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((j) => (
            <JourneyCard key={j.id} journey={j} />
          ))}
        </div>
      )}
    </>
  );
}
