import { api } from "../api/client.js";
import { MapExplorer } from "../components/map/map-explorer.jsx";
import { PageHeader, Skeleton } from "../components/ui.jsx";
import { useApi } from "../hooks/useApi.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

export function MapPage() {
  useDocumentTitle("Map");
  const { data, loading } = useApi((signal) => api.get("/api/v1/map", signal), []);

  return (
    <>
      <PageHeader
        title="Map"
        description="Every destination and place, plotted. Filter by what you're looking for."
      />
      {loading ? (
        <Skeleton className="h-[600px] w-full rounded-[var(--radius-xl)]" />
      ) : (
        <MapExplorer destinations={data?.destinations ?? []} places={data?.places ?? []} />
      )}
    </>
  );
}
