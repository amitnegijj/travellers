import { Bookmark, Heart, UserCheck, UserPlus } from "lucide-react";
import { useState, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { api, isUnauthorized } from "../api/client.jsx";
import { buttonClass } from "./ui/index.jsx";
import { cn } from "../utils/index.jsx";

/** Optimistic toggle shared by like and save. Reverts on failure. */
function useToggle(endpoint, initialActive, initialCount) {
  const navigate = useNavigate();
  const [active, setActive] = useState(initialActive);
  const [count, setCount] = useState(initialCount);
  const [pending, start] = useTransition();

  const toggle = () => {
    const prevActive = active;
    const prevCount = count;

    setActive(!prevActive);
    setCount(prevCount + (prevActive ? -1 : 1));

    start(async () => {
      try {
        const data = await api.post(endpoint);
        setActive(data.active);
        setCount(data.count);
      } catch (err) {
        setActive(prevActive);
        setCount(prevCount);
        if (isUnauthorized(err)) navigate("/login");
      }
    });
  };

  return { active, count, pending, toggle };
}

const sizes = {
  sm: "h-8 gap-1 px-2 text-xs",
  md: "h-9 gap-1.5 px-3 text-sm",
};

export function LikeButton({ journeyId, initialActive, initialCount, size = "md" }) {
  const { active, count, pending, toggle } = useToggle(
    `/api/v1/journeys/${journeyId}/like`,
    initialActive,
    initialCount
  );

  return (
    <button
      onClick={toggle}
      disabled={pending}
      aria-pressed={active}
      aria-label={active ? "Unlike this journey" : "Like this journey"}
      className={cn(
        "inline-flex items-center rounded-[var(--radius)] font-medium transition-colors",
        "hover:bg-[var(--surface-hover)] disabled:opacity-60",
        sizes[size],
        active ? "text-[var(--danger)]" : "text-[var(--text-muted)]"
      )}
    >
      <Heart size={size === "sm" ? 14 : 16} fill={active ? "currentColor" : "none"} />
      <span className="tabular-nums">{count}</span>
    </button>
  );
}

export function SaveButton({
  journeyId, initialActive, initialCount, size = "md", showLabel = false, iconOnly = false,
}) {
  const { active, count, pending, toggle } = useToggle(
    `/api/v1/journeys/${journeyId}/save`,
    initialActive,
    initialCount
  );

  return (
    <button
      onClick={toggle}
      disabled={pending}
      aria-pressed={active}
      aria-label={active ? "Remove from saved" : "Save this journey"}
      className={cn(
        "inline-flex items-center rounded-[var(--radius)] font-medium transition-colors",
        "hover:bg-[var(--surface-hover)] disabled:opacity-60",
        sizes[size],
        active ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
      )}
    >
      <Bookmark size={size === "sm" ? 14 : 16} fill={active ? "currentColor" : "none"} />
      {showLabel ? (
        <span>{active ? "Saved" : "Save"}</span>
      ) : iconOnly ? null : (
        <span className="tabular-nums">{count}</span>
      )}
    </button>
  );
}

export function FollowButton({ handle, initialFollowing, initialCount, isSelf, onChange }) {
  const navigate = useNavigate();
  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(initialCount);
  const [pending, start] = useTransition();

  if (isSelf) return null;

  const toggle = () => {
    const prev = following;
    const prevCount = count;
    setFollowing(!prev);
    setCount(prevCount + (prev ? -1 : 1));

    start(async () => {
      try {
        const data = await api.post(`/api/v1/profiles/${handle}/follow`);
        setFollowing(data.following);
        setCount(data.followerCount);
        // Lets a parent that fetched its own copy of this count (the profile
        // page's stat strip) stay in sync — this used to be router.refresh().
        onChange?.(data);
      } catch (err) {
        setFollowing(prev);
        setCount(prevCount);
        if (isUnauthorized(err)) navigate("/login");
      }
    });
  };

  return (
    <button
      onClick={toggle}
      disabled={pending}
      aria-pressed={following}
      className={cn(buttonClass(following ? "secondary" : "primary", "md"), "min-w-28")}
    >
      {following ? <UserCheck size={16} /> : <UserPlus size={16} />}
      {following ? "Following" : "Follow"}
    </button>
  );
}
