"use client";

import { Bookmark, Heart, UserCheck, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui";

/** Optimistic toggle shared by like and save. Reverts on failure. */
function useToggle(endpoint: string, initialActive: boolean, initialCount: number) {
  const router = useRouter();
  const [active, setActive] = useState(initialActive);
  const [count, setCount] = useState(initialCount);
  const [pending, start] = useTransition();

  const toggle = () => {
    const prevActive = active;
    const prevCount = count;

    setActive(!prevActive);
    setCount(prevCount + (prevActive ? -1 : 1));

    start(async () => {
      const res = await fetch(endpoint, { method: "POST" });
      if (res.status === 401) {
        setActive(prevActive);
        setCount(prevCount);
        router.push("/login");
        return;
      }
      if (!res.ok) {
        setActive(prevActive);
        setCount(prevCount);
        return;
      }
      const data = await res.json();
      setActive(data.active);
      setCount(data.count);
    });
  };

  return { active, count, pending, toggle };
}

const sizes = {
  sm: "h-8 gap-1 px-2 text-xs",
  md: "h-9 gap-1.5 px-3 text-sm",
};

export function LikeButton({
  journeyId, initialActive, initialCount, size = "md",
}: {
  journeyId: string;
  initialActive: boolean;
  initialCount: number;
  size?: "sm" | "md";
}) {
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
}: {
  journeyId: string;
  initialActive: boolean;
  initialCount: number;
  size?: "sm" | "md";
  showLabel?: boolean;
  iconOnly?: boolean;
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

export function FollowButton({
  handle, initialFollowing, initialCount, isSelf,
}: {
  handle: string;
  initialFollowing: boolean;
  initialCount: number;
  isSelf: boolean;
}) {
  const router = useRouter();
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
      const res = await fetch(`/api/v1/profiles/${handle}/follow`, { method: "POST" });
      if (res.status === 401) {
        setFollowing(prev);
        setCount(prevCount);
        router.push("/login");
        return;
      }
      if (!res.ok) {
        setFollowing(prev);
        setCount(prevCount);
        return;
      }
      const data = await res.json();
      setFollowing(data.following);
      setCount(data.followerCount);
      router.refresh();
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
