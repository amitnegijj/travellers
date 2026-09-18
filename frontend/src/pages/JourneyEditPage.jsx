import { useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { JourneyComposer } from "../components/journey-composer.jsx";
import { NotFoundBlock } from "../components/not-found.jsx";
import { PageHeader, Skeleton } from "../components/ui.jsx";
import { useApi } from "../hooks/useApi.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { toDateInput } from "../lib/utils.js";

export function JourneyEditPage() {
  const { id } = useParams();

  const journeyReq = useApi((signal) => api.get(`/api/v1/journeys/${id}/edit`, signal), [id]);
  const destinationsReq = useApi(
    (signal) => api.get("/api/v1/destinations?limit=200", signal),
    []
  );

  const journey = journeyReq.data;
  const isDraft = journey?.status !== "published";
  useDocumentTitle("Edit journey");

  if (journeyReq.error) {
    // Someone else's journey is indistinguishable from a missing one here —
    // an edit URL should never confirm that a private draft exists.
    return (
      <NotFoundBlock
        title="This page doesn't exist"
        description="That journey isn't yours to edit, or it doesn't exist."
      />
    );
  }

  if (journeyReq.loading || destinationsReq.loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const destinations = (destinationsReq.data?.items ?? []).map((d) => ({
    id: d.id, slug: d.slug, name: d.name, region: d.region,
    lng: Number(d.lng), lat: Number(d.lat),
  }));

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={isDraft ? "Finish your draft" : "Edit journey"}
        description={
          isDraft
            ? "Nobody can see this yet. Publish when it is ready."
            : "Changes go live as soon as you save."
        }
      />
      <JourneyComposer
        journeyId={id}
        presetDestinationSlug={null}
        destinations={destinations}
        initial={{
          title: journey.title,
          summary: journey.summary,
          originName: journey.originName,
          destinationId: journey.destinationId,
          distanceM: journey.distanceM,
          durationMin: journey.durationMin,
          startDate: toDateInput(journey.startDate),
          endDate: toDateInput(journey.endDate),
          travelStyle: journey.travelStyle,
          difficulty: journey.difficulty,
          vehicle: journey.vehicle,
          status: journey.status,
          stops: journey.stops.map((s) => ({
            name: s.name,
            note: s.note,
            arrivedOn: toDateInput(s.arrivedOn),
            lng: s.lng == null ? null : Number(s.lng),
            lat: s.lat == null ? null : Number(s.lat),
          })),
          expenses: journey.expenses.map((e) => ({
            category: e.category,
            label: e.label,
            amountMinor: Number(e.amountMinor),
            spentOn: toDateInput(e.spentOn),
          })),
          tips: journey.tips.map((t) => ({ kind: t.kind, body: t.body })),
          media: journey.media.map((m) => ({ id: m.id, url: m.url })),
        }}
      />
    </div>
  );
}
