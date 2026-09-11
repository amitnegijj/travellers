import {
  AlertTriangle, CalendarDays, Car, Clock, Eye, IndianRupee, Lightbulb,
  MapPin, PenLine, Route, Star,
} from "lucide-react";
import type { Metadata } from "next";
import dynamicImport from "next/dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommentSection } from "@/components/comments";
import { CATEGORY_LABEL, ExpenseDonut } from "@/components/expense-donut";
import { JourneyGallery } from "@/components/journey-gallery";
import { FollowButton, LikeButton, SaveButton } from "@/components/social-buttons";
import { Tabs } from "@/components/tabs";
import {
  Avatar, Badge, Card, EmptyState, LinkButton, Photo, Skeleton, Stat, StatStrip,
} from "@/components/ui";
import { AppError } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import {
  dayCount, formatDateRange, formatDistance, formatDuration, formatMoney,
} from "@/lib/utils";
import { getJourney, incrementView } from "@/server/journeys";
import { listComments } from "@/server/social";

export const dynamic = "force-dynamic";

const MapCanvas = dynamicImport(
  () => import("@/components/map/map-canvas").then((m) => m.MapCanvas),
  { loading: () => <Skeleton className="h-[380px] w-full rounded-[var(--radius-xl)]" /> }
);

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const j = await getJourney(id, null);
    return { title: j.title, description: j.summary ?? undefined };
  } catch {
    return { title: "Journey" };
  }
}

export default async function JourneyPage({ params }: Props) {
  const { id } = await params;
  const user = await getSessionUser();

  let journey;
  try {
    journey = await getJourney(id, user?.id ?? null);
  } catch (err) {
    if (err instanceof AppError && err.code === "not_found") notFound();
    throw err;
  }

  const [comments, authorFollow] = await Promise.all([
    listComments(id),
    queryOne<{ isFollowing: boolean; followerCount: number }>(
      `select case when $2::uuid is null then false
                   else exists (select 1 from follows f
                                 where f.follower_id = $2::uuid and f.following_id = p.id)
              end as "isFollowing",
              (select count(*) from follows f where f.following_id = p.id)::int as "followerCount"
         from profiles p where p.handle = $1`,
      [journey.authorHandle, user?.id ?? null]
    ),
    incrementView(id),
  ]);

  const stops = journey.stops as {
    id: string; position: number; name: string; note: string | null;
    arrivedOn: string | null; location: { coordinates: [number, number] } | null;
  }[];
  const expenses = journey.expenses as {
    id: string; category: string; label: string | null;
    amountMinor: string; currency: string; spentOn: string | null;
  }[];
  const tips = journey.tips as { id: string; kind: string; body: string }[];
  const media = journey.media as { id: string; url: string }[];

  const days = dayCount(journey.startDate, journey.endDate);
  const total = Number(journey.totalExpenseMinor);
  const routeCoords = journey.route?.coordinates ?? [];

  const byCategory = Object.entries(
    expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + Number(e.amountMinor);
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]) as [string, number][];

  const galleryPhotos = media.length
    ? media
    : journey.coverUrl
      ? [{ id: "cover", url: journey.coverUrl }]
      : [];

  const mapBlock = (
    <MapCanvas
      height={380}
      route={routeCoords.length >= 2 ? { coordinates: routeCoords } : null}
      markers={stops
        .filter((s) => s.location)
        .map((s) => ({
          id: s.id,
          lng: s.location!.coordinates[0],
          lat: s.location!.coordinates[1],
          label: s.name,
          sublabel: s.note ?? undefined,
          tone: "brand" as const,
        }))}
    />
  );

  return (
    <article className="mx-auto max-w-3xl">
      {/* ------------------------------------------------------------- hero */}
      {galleryPhotos.length > 0 ? (
        <JourneyGallery photos={galleryPhotos} title={journey.title} />
      ) : null}

      <header className="mt-5">
        {journey.originName && journey.destinationName ? (
          <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-[var(--brand)]">
            <MapPin size={15} />
            {journey.originName} → {journey.destinationName}
          </p>
        ) : null}

        <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-[var(--text)] sm:text-[32px]">
          {journey.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            href={`/profile/${journey.authorHandle}`}
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <Avatar name={journey.authorName} src={journey.authorAvatar} size={42} />
            <span>
              <span className="block text-sm font-bold text-[var(--text)]">
                {journey.authorName}
              </span>
              <span className="block text-xs text-[var(--text-faint)]">
                {formatDateRange(journey.startDate, journey.endDate) ?? `@${journey.authorHandle}`}
              </span>
            </span>
          </Link>

          {user?.handle === journey.authorHandle ? (
            <div className="ml-auto flex items-center gap-2">
              {journey.status !== "published" ? <Badge tone="warning">Draft</Badge> : null}
              <LinkButton href={`/journeys/${journey.id}/edit`} variant="secondary" size="sm">
                <PenLine size={14} /> Edit
              </LinkButton>
            </div>
          ) : (
            <div className="ml-auto">
              <FollowButton
                handle={journey.authorHandle}
                initialFollowing={authorFollow?.isFollowing ?? false}
                initialCount={authorFollow?.followerCount ?? 0}
                isSelf={false}
              />
            </div>
          )}
        </div>
      </header>

      {/* --------------------------------------------------------- stat bar */}
      <StatStrip className="my-6">
        <Stat label="Distance" value={formatDistance(journey.distanceM) ?? "—"} icon={<Route size={11} />} />
        <Stat label="Total Time" value={formatDuration(journey.durationMin) ?? "—"} icon={<Clock size={11} />} />
        <Stat
          label="Total Cost"
          value={total > 0 ? formatMoney(total, journey.currency) : "—"}
          icon={<IndianRupee size={11} />}
          accent
        />
        <Stat label="Days" value={days ?? "—"} icon={<CalendarDays size={11} />} />
      </StatStrip>

      {/* ------------------------------------------------------ engagement */}
      <div className="mb-2 flex items-center gap-1 border-y border-[var(--border)] py-2">
        <LikeButton
          journeyId={journey.id}
          initialActive={journey.likedByMe}
          initialCount={journey.likeCount}
        />
        <Link
          href="#comments"
          className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)]"
        >
          💬 <span className="tabular-nums">{journey.commentCount}</span>
        </Link>
        <span className="inline-flex h-9 items-center gap-1.5 px-3 text-sm font-semibold text-[var(--text-faint)]">
          <Eye size={16} /> <span className="tabular-nums">{journey.viewCount}</span>
        </span>
        <div className="ml-auto">
          <SaveButton
            journeyId={journey.id}
            initialActive={journey.savedByMe}
            initialCount={journey.saveCount}
            showLabel
          />
        </div>
      </div>

      {/* ------------------------------------------------------------ tabs */}
      <Tabs
        items={[
          {
            key: "overview",
            label: "Overview",
            content: (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {journey.travelStyle ? <Badge tone="brand">{journey.travelStyle}</Badge> : null}
                  {journey.difficulty ? <Badge tone="warning">{journey.difficulty}</Badge> : null}
                  {journey.vehicle ? (
                    <Badge tone="neutral"><Car size={11} /> {journey.vehicle}</Badge>
                  ) : null}
                  {journey.bestSeason?.length ? (
                    <Badge tone="create">Best: {journey.bestSeason.join(", ")}</Badge>
                  ) : null}
                </div>

                {journey.summary ? (
                  <div>
                    <h2 className="mb-2 text-base font-extrabold text-[var(--text)]">
                      About this trip
                    </h2>
                    <p className="whitespace-pre-line text-[15px] leading-relaxed text-[var(--text-muted)]">
                      {journey.summary}
                    </p>
                  </div>
                ) : null}

                {media.length > 1 ? (
                  <div>
                    <h2 className="mb-3 text-base font-extrabold text-[var(--text)]">
                      Photos ({media.length})
                    </h2>
                    <div className="grid grid-cols-3 gap-2">
                      {media.map((m) => (
                        <div
                          key={m.id}
                          className="aspect-square overflow-hidden rounded-[var(--radius)] border border-[var(--border)]"
                        >
                          <Photo src={m.url} className="h-full w-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ),
          },
          {
            key: "itinerary",
            label: "Itinerary",
            content:
              stops.length === 0 ? (
                <EmptyState title="No stops logged" description="This traveller didn't break the route into stops." />
              ) : (
                <ol className="space-y-0">
                  {stops.map((stop, i) => (
                    <li key={stop.id} className="relative flex gap-4 pb-7 last:pb-0">
                      <div className="flex flex-col items-center">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--ai)] text-sm font-extrabold text-white shadow-sm">
                          {i + 1}
                        </span>
                        {i < stops.length - 1 ? (
                          <span className="mt-1 w-[2px] flex-1 bg-[var(--border)]" aria-hidden />
                        ) : null}
                      </div>

                      <Card className="min-w-0 flex-1 p-4">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h3 className="font-extrabold text-[var(--text)]">{stop.name}</h3>
                          {stop.arrivedOn ? (
                            <Badge tone="neutral">
                              {new Date(stop.arrivedOn).toLocaleDateString("en-IN", {
                                day: "numeric", month: "short",
                              })}
                            </Badge>
                          ) : null}
                        </div>
                        {stop.note ? (
                          <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
                            {stop.note}
                          </p>
                        ) : null}
                      </Card>
                    </li>
                  ))}
                </ol>
              ),
          },
          { key: "map", label: "Map", content: mapBlock },
          {
            key: "expenses",
            label: "Expenses",
            content:
              expenses.length === 0 ? (
                <EmptyState title="No costs logged" description="Costs are the most useful thing a journey can carry — this one has none yet." />
              ) : (
                <div className="space-y-5">
                  <Card className="p-6">
                    <ExpenseDonut byCategory={byCategory} total={total} currency={journey.currency} />
                  </Card>

                  <Card className="overflow-hidden">
                    <ul className="divide-y divide-[var(--border)]">
                      {expenses.map((e) => (
                        <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3">
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-[var(--text)]">
                              {e.label ?? CATEGORY_LABEL[e.category] ?? e.category}
                            </span>
                            <span className="text-xs text-[var(--text-faint)]">
                              {CATEGORY_LABEL[e.category] ?? e.category}
                              {e.spentOn
                                ? ` · ${new Date(e.spentOn).toLocaleDateString("en-IN", {
                                    day: "numeric", month: "short",
                                  })}`
                                : ""}
                            </span>
                          </span>
                          <span className="shrink-0 text-sm font-extrabold tabular-nums text-[var(--text)]">
                            {formatMoney(e.amountMinor, e.currency)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center justify-between bg-[var(--surface-2)] px-4 py-3.5">
                      <span className="text-sm font-extrabold text-[var(--text)]">Total</span>
                      <span className="text-lg font-extrabold tabular-nums text-[var(--create)]">
                        {formatMoney(total, journey.currency)}
                      </span>
                    </div>
                  </Card>
                </div>
              ),
          },
          {
            key: "tips",
            label: "Tips",
            content:
              tips.length === 0 ? (
                <EmptyState title="No tips yet" description="Nothing flagged for the next traveller on this route." />
              ) : (
                <div className="space-y-3">
                  {tips.map((t) => (
                    <div
                      key={t.id}
                      className={`flex gap-3 rounded-[var(--radius-lg)] border p-4 ${
                        t.kind === "warning"
                          ? "border-[var(--warning)]/30 bg-[var(--warning-soft)]"
                          : "border-[var(--border)] bg-[var(--surface)]"
                      }`}
                    >
                      <span
                        className={`mt-0.5 shrink-0 ${
                          t.kind === "warning" ? "text-[var(--warning)]" : "text-[var(--create)]"
                        }`}
                      >
                        {t.kind === "warning" ? <AlertTriangle size={17} /> : <Lightbulb size={17} />}
                      </span>
                      <p className="text-sm leading-relaxed text-[var(--text)]">{t.body}</p>
                    </div>
                  ))}
                  <p className="flex items-start gap-1.5 pt-1 text-xs text-[var(--text-faint)]">
                    <Star size={12} className="mt-0.5 shrink-0" />
                    Community-reported by {journey.authorName}. Conditions change — verify before you travel.
                  </p>
                </div>
              ),
          },
        ]}
      />

      <div className="mt-10 border-t border-[var(--border)] pt-8">
        <CommentSection
          journeyId={journey.id}
          initialComments={comments as never[]}
          currentUser={user}
        />
      </div>
    </article>
  );
}
