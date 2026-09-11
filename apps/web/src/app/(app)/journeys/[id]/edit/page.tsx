import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { JourneyComposer } from "@/app/(app)/journeys/new/journey-composer";
import { PageHeader } from "@/components/ui";
import { AppError } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { toDateInput } from "@/lib/utils";
import { getJourneyForEdit } from "@/server/journeys";
import { listDestinations } from "@/server/places";

export const metadata: Metadata = { title: "Edit journey" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditJourneyPage({ params }: Props) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  let journey;
  try {
    journey = await getJourneyForEdit(id, user.id);
  } catch (err) {
    // Someone else's journey is indistinguishable from a missing one here —
    // an edit URL should never confirm that a private draft exists.
    if (err instanceof AppError && (err.code === "not_found" || err.code === "forbidden")) {
      notFound();
    }
    throw err;
  }

  const destinations = await listDestinations({ limit: 200 });
  const isDraft = journey.status !== "published";

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
        destinations={destinations.map((d) => ({
          id: d.id, slug: d.slug, name: d.name, region: d.region,
          lng: Number(d.lng), lat: Number(d.lat),
        }))}
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
