import { useSearchParams } from "react-router-dom";
import { api } from "../api/client.jsx";
import { JourneyComposer } from "../components/JourneyComposer.jsx";
import { PageHeader, Skeleton } from "../components/ui/index.jsx";
import { useApi } from "../hooks/useApi.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.jsx";

export function JourneyNewPage() {
  useDocumentTitle("Log a trip");
  const [searchParams] = useSearchParams();
  const destinationSlug = searchParams.get("destination");

  const { data, loading } = useApi(
    (signal) => api.get("/api/v1/destinations?limit=200", signal),
    []
  );

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Log a trip"
        description="Just a title is enough to post. Add as much or as little as you like."
      />
      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <JourneyComposer
          destinations={(data?.items ?? []).map((d) => ({
            id: d.id, slug: d.slug, name: d.name, region: d.region,
            lng: Number(d.lng), lat: Number(d.lat),
          }))}
          presetDestinationSlug={destinationSlug ?? null}
        />
      )}
    </div>
  );
}
