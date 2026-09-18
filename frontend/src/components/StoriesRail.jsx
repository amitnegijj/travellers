import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api/client.jsx";
import { useApi } from "../hooks/useApi.jsx";
import { Avatar } from "./ui/index.jsx";
import { cn } from "../utils/index.jsx";

// The stories rail, but the "story" is a real published journey — tapping a
// ring drops you into that traveller's trail. A live ring means they posted in
// the last week; older ones go grey, exactly like a seen story.
export function StoriesRail({ user }) {
  const { data, loading } = useApi((signal) => api.get("/api/v1/home/stories", signal), []);

  if (loading) return <StoriesRailSkeleton />;

  const people = data?.items ?? [];
  if (people.length === 0 && !user) return null;

  const sorted = [...people].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return (
    <div className="rail -mx-4 px-4 lg:mx-0 lg:px-0" role="list">
      {/* Your own ring always leads, and it is the create button. */}
      <Link
        to={user ? "/journeys/new" : "/signup"}
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
            to={`/journeys/${s.journeyId}`}
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
