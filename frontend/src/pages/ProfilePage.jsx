import { MapPin, Route, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { JourneyCard } from "../components/journey-card.jsx";
import { NotFoundBlock } from "../components/not-found.jsx";
import { FollowButton } from "../components/social-buttons.jsx";
import {
  Avatar, Badge, Card, EmptyState, LinkButton, Photo, SectionHeader, Skeleton, Stat, StatStrip,
} from "../components/ui.jsx";
import { TravelMap } from "../components/travel-map.jsx";
import { useSession } from "../context/session.jsx";
import { useApi } from "../hooks/useApi.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { formatMoney } from "../lib/utils.js";

/** Travel DNA — the share of a traveller's journeys in each style. Real data. */
const DNA_STYLES = [
  { key: "adventure", label: "Adventure", color: "#22c55e" },
  { key: "road-trip", label: "Road trips", color: "#3b82f6" },
  { key: "budget", label: "Budget", color: "#eab308" },
  { key: "slow", label: "Slow travel", color: "#8b5cf6" },
  { key: "weekend", label: "Weekend", color: "#ec4899" },
];

export function ProfilePage() {
  const { handle } = useParams();
  const { user: viewer } = useSession();
  const [followOverride, setFollowOverride] = useState(null);

  useDocumentTitle(`@${handle}`);

  const profileReq = useApi((signal) => api.get(`/api/v1/profiles/${handle}`, signal), [handle]);
  const journeysReq = useApi(
    (signal) => api.get(`/api/v1/journeys?author=${encodeURIComponent(handle)}&limit=12`, signal),
    [handle]
  );
  const placesReq = useApi((signal) => api.get(`/api/v1/profiles/${handle}/places`, signal), [handle]);

  const profile = profileReq.data
    ? { ...profileReq.data, ...followOverride }
    : null;
  const journeys = journeysReq.data?.items ?? [];

  const isSelf = viewer?.handle.toLowerCase() === handle.toLowerCase();

  const totalDistance = useMemo(
    () => journeys.reduce((s, j) => s + (j.distanceM ?? 0), 0),
    [journeys]
  );
  const totalSpent = useMemo(
    () => journeys.reduce((s, j) => s + Number(j.totalExpenseMinor), 0),
    [journeys]
  );
  const destinationsCount = useMemo(
    () => new Set(journeys.map((j) => j.destinationSlug).filter(Boolean)).size,
    [journeys]
  );

  const dna = useMemo(
    () =>
      DNA_STYLES.map((s) => ({
        ...s,
        pct: journeys.length
          ? Math.round((journeys.filter((j) => j.travelStyle === s.key).length / journeys.length) * 100)
          : 0,
      })).filter((s) => s.pct > 0),
    [journeys]
  );

  const cover = journeys[0]?.coverUrl ?? null;

  if (profileReq.error) {
    return <NotFoundBlock title="This page doesn't exist" description="No traveller goes by that handle." />;
  }

  if (profileReq.loading || !profile) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-48 w-full rounded-[var(--radius-lg)]" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ------------------------------------------------------ cover header */}
      <Card className="overflow-hidden">
        <div className="relative h-36 sm:h-48">
          <Photo src={cover} className="h-full w-full" />
          <div className="scrim absolute inset-0" />
        </div>

        <div className="px-5 pb-5">
          <div className="-mt-12 flex flex-wrap items-end gap-4">
            <span className="rounded-full ring-4 ring-[var(--surface)]">
              <Avatar name={profile.displayName} src={profile.avatarUrl} size={92} />
            </span>

            <div className="min-w-0 flex-1 pb-1">
              <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text)]">
                {profile.displayName}
              </h1>
              <p className="text-sm text-[var(--text-faint)]">@{profile.handle}</p>
            </div>

            <div className="pb-1">
              {isSelf ? (
                <LinkButton to="/settings" variant="secondary">Edit profile</LinkButton>
              ) : (
                <FollowButton
                  handle={profile.handle}
                  initialFollowing={profile.isFollowing}
                  initialCount={profile.followerCount}
                  isSelf={isSelf}
                  onChange={(data) =>
                    setFollowOverride({ isFollowing: data.following, followerCount: data.followerCount })
                  }
                />
              )}
            </div>
          </div>

          {profile.bio ? (
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--text-muted)]">
              {profile.bio}
            </p>
          ) : null}

          {profile.location ? (
            <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-[var(--text-faint)]">
              <MapPin size={12} /> {profile.location}
            </p>
          ) : null}
        </div>
      </Card>

      <StatStrip>
        <Stat label="Journeys" value={profile.journeyCount} />
        <Stat label="Destinations" value={destinationsCount} />
        <Stat label="Followers" value={profile.followerCount} accent />
        <Stat label="Following" value={profile.followingCount} />
      </StatStrip>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* --------------------------------------------------- travel DNA */}
        {dna.length > 0 ? (
          <Card className="p-5">
            <h2 className="mb-4 text-base font-extrabold text-[var(--text)]">Travel DNA</h2>
            <ul className="space-y-3">
              {dna.map((s) => (
                <li key={s.key}>
                  <div className="mb-1 flex items-baseline justify-between text-xs">
                    <span className="font-bold text-[var(--text)]">{s.label}</span>
                    <span className="tabular-nums font-bold text-[var(--text-muted)]">{s.pct}%</span>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full bg-[var(--bg-subtle)]"
                    role="img"
                    aria-label={`${s.label}: ${s.pct}%`}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${s.pct}%`, background: s.color }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {/* ------------------------------------------------------- totals */}
        <Card className="p-5">
          <h2 className="mb-4 text-base font-extrabold text-[var(--text)]">Logged so far</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-[var(--radius)] bg-[var(--surface-2)] p-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--brand-soft)] text-[var(--brand)]">
                <Route size={18} />
              </span>
              <div>
                <p className="text-lg font-extrabold tabular-nums text-[var(--text)]">
                  {totalDistance > 0 ? `${Math.round(totalDistance / 1000)} km` : "—"}
                </p>
                <p className="text-[11px] text-[var(--text-faint)]">Distance documented</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-[var(--radius)] bg-[var(--surface-2)] p-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--create-soft)] text-[var(--create)]">
                <Wallet size={18} />
              </span>
              <div>
                <p className="text-lg font-extrabold tabular-nums text-[var(--text)]">
                  {totalSpent > 0 ? formatMoney(totalSpent) : "—"}
                </p>
                <p className="text-[11px] text-[var(--text-faint)]">Travel spending shared</p>
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-[var(--text-faint)]">
            Travel Passport and badges arrive in Phase 2.
          </p>
        </Card>
      </div>

      {placesReq.loading ? (
        <Skeleton className="h-[440px] w-full rounded-[var(--radius-xl)]" />
      ) : (
        <TravelMap
          handle={profile.handle}
          displayName={profile.displayName}
          initialPlaces={placesReq.data?.items ?? []}
          journeyPlaces={placesReq.data?.reached ?? []}
          isOwner={placesReq.data?.isOwner ?? false}
        />
      )}

      <section>
        <SectionHeader title={isSelf ? "Your journeys" : `Journeys by ${profile.displayName}`} />
        {journeysReq.loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="aspect-[4/3] w-full" />)}
          </div>
        ) : journeys.length === 0 ? (
          <EmptyState
            icon={<Route size={26} />}
            title={isSelf ? "You haven't published a journey yet" : "No journeys yet"}
            description={
              isSelf
                ? "Log your last trip — the route, the stops, and what it actually cost."
                : "This traveller hasn't published anything public yet."
            }
            action={
              isSelf ? (
                <LinkButton to="/journeys/new" variant="create">Log a journey</LinkButton>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {journeys.map((j) => (
              <JourneyCard key={j.id} journey={j} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
