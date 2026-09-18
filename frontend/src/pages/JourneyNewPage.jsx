import { useSearchParams } from "react-router-dom";
import { api } from "../api/client.jsx";
import { JourneyComposer } from "../components/JourneyComposer.jsx";
import { PageHeader, Skeleton } from "../components/ui/index.jsx";
import { useApi } from "../hooks/useApi.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.jsx";

export function JourneyNewPage() {
  useDocumentTitle("Log a journey");
  const [searchParams] = useSearchParams();
  const destinationSlug = searchParams.get("destination");

  const { data, loading } = useApi(
    (signal) => api.get("/api/v1/destinations?limit=200", signal),
    []
  );

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Log a journey"
        description="Fill in what you remember. You can publish now and add the rest later."
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
