import { MapPin, Route, Wallet } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JourneyCard } from "@/components/journey-card";
import { FollowButton } from "@/components/social-buttons";
import {
  Avatar, Badge, Card, EmptyState, LinkButton, Photo, SectionHeader, Stat, StatStrip,
} from "@/components/ui";
import { TravelMap, type UserPlace } from "@/components/travel-map";
import { getSessionUser } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { formatMoney } from "@/lib/utils";
import { listJourneys } from "@/server/journeys";
import { journeyPlaces, listUserPlaces } from "@/server/user-places";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ handle: string }> };

type Profile = {
  id: string; handle: string; displayName: string; bio: string | null;
  location: string | null; avatarUrl: string | null;
  followerCount: number; followingCount: number; journeyCount: number;
  isFollowing: boolean;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  return { title: `@${handle}` };
}

/** Travel DNA — the share of a traveller's journeys in each style. Real data. */
const DNA_STYLES = [
  { key: "adventure", label: "Adventure", color: "#22c55e" },
  { key: "road-trip", label: "Road trips", color: "#3b82f6" },
  { key: "budget", label: "Budget", color: "#eab308" },
  { key: "slow", label: "Slow travel", color: "#8b5cf6" },
  { key: "weekend", label: "Weekend", color: "#ec4899" },
];

export default async function ProfilePage({ params }: Props) {
  const { handle } = await params;
  const viewer = await getSessionUser();

  const profile = await queryOne<Profile>(
    `select p.id, p.handle, p.display_name as "displayName", p.bio, p.location,
            p.avatar_url as "avatarUrl",
            (select count(*) from follows f where f.following_id = p.id)::int as "followerCount",
            (select count(*) from follows f where f.follower_id  = p.id)::int as "followingCount",
            (select count(*) from journeys j
              where j.author_id = p.id and j.status = 'published')::int as "journeyCount",
            case when $2::uuid is null then false
                 else exists (select 1 from follows f
                               where f.follower_id = $2::uuid and f.following_id = p.id)
            end as "isFollowing"
       from profiles p where p.handle = $1`,
    [handle, viewer?.id ?? null]
  );

  if (!profile) notFound();

  const [{ items: journeys }, pins, reached] = await Promise.all([
    listJourneys({ viewerId: viewer?.id ?? null, authorHandle: handle, limit: 12 }),
    listUserPlaces(handle, viewer?.id ?? null),
    journeyPlaces(handle),
  ]);

  const isSelf = viewer?.handle.toLowerCase() === handle.toLowerCase();

  const totalDistance = journeys.reduce((s, j) => s + (j.distanceM ?? 0), 0);
  const totalSpent = journeys.reduce((s, j) => s + Number(j.totalExpenseMinor), 0);
  const destinations = new Set(journeys.map((j) => j.destinationSlug).filter(Boolean)).size;

  const dna = DNA_STYLES.map((s) => ({
    ...s,
    pct: journeys.length
      ? Math.round((journeys.filter((j) => j.travelStyle === s.key).length / journeys.length) * 100)
      : 0,
  })).filter((s) => s.pct > 0);

  const cover = journeys[0]?.coverUrl ?? null;

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
                <LinkButton href="/settings" variant="secondary">Edit profile</LinkButton>
              ) : (
                <FollowButton
                  handle={profile.handle}
                  initialFollowing={profile.isFollowing}
                  initialCount={profile.followerCount}
                  isSelf={isSelf}
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
        <Stat label="Destinations" value={destinations} />
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

      <TravelMap
        handle={profile.handle}
        displayName={profile.displayName}
        initialPlaces={pins.items as UserPlace[]}
        journeyPlaces={reached}
        isOwner={pins.isOwner}
      />

      <section>
        <SectionHeader title={isSelf ? "Your journeys" : `Journeys by ${profile.displayName}`} />
        {journeys.length === 0 ? (
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
                <LinkButton href="/journeys/new" variant="create">Log a journey</LinkButton>
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
