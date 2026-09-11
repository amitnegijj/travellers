import { Plus } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui";
import type { SessionUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { cn } from "@/lib/utils";

// The stories rail, but the "story" is a real published journey — tapping a
// ring drops you into that traveller's trail. A live ring means they posted in
// the last week; older ones go grey, exactly like a seen story.

type Storyteller = {
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  journeyId: string;
  coverUrl: string | null;
  destinationName: string | null;
  publishedAt: string;
  live: boolean;
};

export async function StoriesRail({ user }: { user: SessionUser | null }) {
  // One row per traveller — their most recent published journey.
  const people = await query<Storyteller>(
    `select distinct on (p.id)
            p.handle, p.display_name as "displayName", p.avatar_url as "avatarUrl",
            j.id as "journeyId", j.cover_url as "coverUrl",
            j.destination_name as "destinationName", j.published_at as "publishedAt",
            (j.published_at > now() - interval '7 days') as live
       from journeys j
       join profiles p on p.id = j.author_id
      where j.status = 'published' and j.visibility = 'public'
      order by p.id, j.published_at desc
      limit 24`
  );

  if (people.length === 0 && !user) return null;

  const sorted = [...people].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return (
    <div className="rail -mx-4 px-4 lg:mx-0 lg:px-0" role="list">
      {/* Your own ring always leads, and it is the create button. */}
      <Link
        href={user ? "/journeys/new" : "/signup"}
        role="listitem"
        className="group flex w-[76px] flex-col items-center gap-1.5"
      >
        <span className="relative">
          <span className="grid h-[68px] w-[68px] place-items-center rounded-full border-2 border-dashed border-[var(--border-strong)] transition-transform group-hover:scale-105">
            {user ? (
              <Avatar name={user.displayName} src={user.avatarUrl} size={58} />
            ) : (
              <Plus size={22} className="text-[var(--text-faint)]" />
            )}
          </span>
          <span className="absolute -bottom-0.5 -right-0.5 grid h-6 w-6 place-items-center rounded-full border-2 border-[var(--bg)] bg-[var(--create)] text-white">
            <Plus size={13} strokeWidth={3} />
          </span>
        </span>
        <span className="truncate text-[11px] font-bold text-[var(--text-muted)]">
          {user ? "Your trail" : "Join"}
        </span>
      </Link>

      {sorted.map((s) => {
        const live = s.live;
        return (
          <Link
            key={s.handle}
            href={`/journeys/${s.journeyId}`}
            role="listitem"
            className="group flex w-[76px] flex-col items-center gap-1.5"
          >
            <span
              className="story-ring transition-transform group-hover:scale-105"
              data-seen={live ? "false" : "true"}
            >
              <span className="block rounded-full border-2 border-[var(--bg)]">
                <Avatar name={s.displayName} src={s.avatarUrl} size={60} />
              </span>
            </span>
            <span
              className={cn(
                "w-full truncate text-center text-[11px] font-bold",
                live ? "text-[var(--text)]" : "text-[var(--text-faint)]"
              )}
            >
              {s.displayName.split(" ")[0]}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export function StoriesRailSkeleton() {
  return (
    <div className="rail -mx-4 px-4 lg:mx-0 lg:px-0" aria-hidden>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex w-[76px] flex-col items-center gap-1.5">
          <div className="skeleton h-[66px] w-[66px] rounded-full" />
          <div className="skeleton h-2.5 w-12 rounded-full" />
        </div>
      ))}
    </div>
  );
}
