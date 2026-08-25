import { Bookmark } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { JourneyCard } from "@/components/journey-card";
import { EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { getSessionUser } from "@/lib/auth";
import { listJourneys } from "@/server/journeys";

export const metadata: Metadata = { title: "Saved" };
export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { items } = await listJourneys({ viewerId: user.id, savedBy: user.id, limit: 30 });

  return (
    <>
      <PageHeader
        title="Saved"
        description="Routes you've bookmarked to come back to."
      />

      {items.length === 0 ? (
        <EmptyState
          icon={<Bookmark size={26} />}
          title="Nothing saved yet"
          description="Tap the bookmark on any journey and it'll show up here."
          action={<LinkButton href="/explore" variant="secondary">Explore journeys</LinkButton>}
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
