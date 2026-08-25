import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { getSessionUser } from "@/lib/auth";
import { listDestinations } from "@/server/places";
import { JourneyComposer } from "./journey-composer";

export const metadata: Metadata = { title: "Log a journey" };
export const dynamic = "force-dynamic";

export default async function NewJourneyPage({
  searchParams,
}: {
  searchParams: Promise<{ destination?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { destination } = await searchParams;
  const destinations = await listDestinations({ limit: 200 });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Log a journey"
        description="Fill in what you remember. You can publish now and add the rest later."
      />
      <JourneyComposer
        destinations={destinations.map((d) => ({
          id: d.id, slug: d.slug, name: d.name, region: d.region,
          lng: Number(d.lng), lat: Number(d.lat),
        }))}
        presetDestinationSlug={destination ?? null}
      />
    </div>
  );
}
