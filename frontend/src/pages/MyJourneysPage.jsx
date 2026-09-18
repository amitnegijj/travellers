import { Eye, Heart, MapPin, MessageCircle, PenLine } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api/client.jsx";
import { Badge, Card, EmptyState, LinkButton, PageHeader, Photo, Skeleton } from "../components/ui/index.jsx";
import { useSession } from "../context/SessionContext.jsx";
import { useApi } from "../hooks/useApi.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.jsx";
import { formatDateRange, formatMoney } from "../utils/index.jsx";

export function MyJourneysPage() {
  useDocumentTitle("My trips");
  const { user } = useSession();
  const { data, loading } = useApi((signal) => api.get("/api/v1/journeys/mine", signal), [user?.id]);

  const journeys = data?.items ?? [];
  const drafts = journeys.filter((j) => j.status !== "published");
  const published = journeys.filter((j) => j.status === "published");

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="My trips"
        description="Everything you have logged — published trips and drafts only you can see."
        action={
          <LinkButton to="/journeys/new" variant="create">
            Log a trip
          </LinkButton>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <>
          {journeys.length === 0 ? (
            <EmptyState
              icon={<MapPin size={22} />}
              title="No trips yet"
              description="Log your first trip — where you went, what it cost, what you would tell the next person."
              action={
                <LinkButton to="/journeys/new" variant="create" size="lg">
                  Log a trip
                </LinkButton>
              }
            />
          ) : null}

          {drafts.length > 0 ? (
            <section className="mb-8">
              <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-[var(--text-faint)]">
                Drafts · {drafts.length}
              </h2>
              <ul className="space-y-3">
                {drafts.map((j) => (
                  <li key={j.id}>
                    <JourneyRow journey={j} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {published.length > 0 ? (
            <section>
              <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-[var(--text-faint)]">
                Published · {published.length}
              </h2>
              <ul className="space-y-3">
                {published.map((j) => (
                  <li key={j.id}>
                    <JourneyRow journey={j} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

function JourneyRow({ journey }) {
  const isDraft = journey.status !== "published";
  // A draft has no public page to link to, so the whole row opens the editor.
  const href = isDraft ? `/journeys/${journey.id}/edit` : `/journeys/${journey.id}`;
  const route = [journey.originName, journey.destinationName].filter(Boolean).join(" → ");
  const dates = formatDateRange(journey.startDate, journey.endDate);
  const total = Number(journey.totalExpenseMinor ?? 0);

  return (
    <Card className="flex gap-4 p-3.5">
      <Link
        to={href}
        className="h-20 w-24 shrink-0 overflow-hidden rounded-[var(--radius)] bg-[var(--bg-subtle)]"
        aria-hidden
        tabIndex={-1}
      >
        {journey.coverUrl ? (
          <Photo src={journey.coverUrl} className="h-full w-full" />
        ) : (
          <span className="grid h-full w-full place-items-center text-[var(--text-faint)]">
            <MapPin size={18} />
          </span>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <Link to={href} className="min-w-0 flex-1">
            <h3 className="truncate font-extrabold text-[var(--text)]">{journey.title}</h3>
          </Link>
          {isDraft ? <Badge tone="warning">Draft</Badge> : null}
        </div>

        <p className="mt-0.5 truncate text-sm text-[var(--text-muted)]">
          {[route, dates, total > 0 ? formatMoney(total) : null].filter(Boolean).join(" · ") ||
            "No details yet"}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-[var(--text-faint)]">
          {isDraft ? (
            <span>{journey.completeness}% complete</span>
          ) : (
            <>
              <span className="inline-flex items-center gap-1">
                <Eye size={13} /> {journey.viewCount}
              </span>
              <span className="inline-flex items-center gap-1">
                <Heart size={13} /> {journey.likeCount}
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle size={13} /> {journey.commentCount}
              </span>
            </>
          )}

          <Link
            to={`/journeys/${journey.id}/edit`}
            className="ml-auto inline-flex items-center gap-1 text-[var(--brand)] hover:underline"
          >
            <PenLine size={13} /> {isDraft ? "Continue" : "Edit"}
          </Link>
        </div>
      </div>
    </Card>
  );
}
