import { Eye, MapPin, MessageCircle, Route, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, Badge, Card, Photo } from "./ui.jsx";
import { dayCount, formatDistance, formatDuration, formatMoney, relativeTime, cn } from "../lib/utils.js";
import { LikeButton, SaveButton } from "./social-buttons.jsx";

/* ------------------------------------------------- standard feed card ---- */

export function JourneyCard({ journey }) {
  const days = dayCount(journey.startDate, journey.endDate);
  const cost = Number(journey.totalExpenseMinor);

  return (
    <Card className="group overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]">
      <Link to={`/journeys/${journey.id}`} className="relative block">
        <div className="relative aspect-[4/3] overflow-hidden bg-[var(--bg-subtle)]">
          <Photo
            src={journey.coverUrl}
            className="h-full w-full transition-transform duration-500 group-hover:scale-105"
          />
          <div className="scrim absolute inset-x-0 bottom-0 h-3/5" />

          {/* saved / difficulty chips */}
          <div className="absolute left-3 top-3 flex gap-1.5">
            {journey.travelStyle ? <Badge tone="glass">{journey.travelStyle}</Badge> : null}
            {days && days > 1 ? <Badge tone="glass">{days} days</Badge> : null}
          </div>

          {cost > 0 ? (
            <div className="absolute right-3 top-3">
              <span className="rounded-full bg-[var(--create)] px-2.5 py-1 text-[11px] font-extrabold text-white shadow-lg">
                {formatMoney(cost, journey.currency)}
              </span>
            </div>
          ) : null}

          {/* route + title over the photo */}
          <div className="absolute inset-x-0 bottom-0 p-4">
            {journey.originName && journey.destinationName ? (
              <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-white/85">
                <MapPin size={11} className="shrink-0" />
                <span className="truncate">
                  {journey.originName} → {journey.destinationName}
                </span>
              </p>
            ) : null}
            <h3 className="line-clamp-2 text-[15px] font-extrabold leading-snug text-white drop-shadow">
              {journey.title}
            </h3>
          </div>
        </div>
      </Link>

      <div className="p-3.5">
        {/* the structured layer — what makes this more than a photo post */}
        <div className="mb-3 flex items-center gap-3 text-[11px] font-semibold text-[var(--text-muted)]">
          {journey.distanceM ? (
            <span className="flex items-center gap-1">
              <Route size={12} className="text-[var(--brand)]" />
              {formatDistance(journey.distanceM)}
            </span>
          ) : null}
          {journey.durationMin ? <span>{formatDuration(journey.durationMin)}</span> : null}
          <span className="ml-auto flex items-center gap-1 text-[var(--text-faint)]">
            <Eye size={12} /> {journey.viewCount}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-[var(--border)] pt-3">
          <Link
            to={`/profile/${journey.authorHandle}`}
            className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-75"
          >
            <Avatar name={journey.authorName} src={journey.authorAvatar} size={28} />
            <span className="min-w-0">
              <span className="block truncate text-xs font-bold text-[var(--text)]">
                {journey.authorName}
              </span>
              <span className="block text-[10px] text-[var(--text-faint)]">
                {relativeTime(journey.publishedAt)}
              </span>
            </span>
          </Link>

          <div className="flex shrink-0 items-center">
            <LikeButton
              journeyId={journey.id}
              initialActive={journey.likedByMe}
              initialCount={journey.likeCount}
              size="sm"
            />
            <Link
              to={`/journeys/${journey.id}#comments`}
              className="inline-flex h-8 items-center gap-1 rounded-full px-2 text-xs font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)]"
              aria-label={`${journey.commentCount} comments`}
            >
              <MessageCircle size={14} />
              <span className="tabular-nums">{journey.commentCount}</span>
            </Link>
            <SaveButton
              journeyId={journey.id}
              initialActive={journey.savedByMe}
              initialCount={journey.saveCount}
              size="sm"
              iconOnly
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

/* --------------------------------------------- big hero / featured card -- */

export function JourneyHero({ journey }) {
  const days = dayCount(journey.startDate, journey.endDate);
  const cost = Number(journey.totalExpenseMinor);

  return (
    <Link
      to={`/journeys/${journey.id}`}
      className="group relative block overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)]"
    >
      <div className="relative aspect-[16/10] sm:aspect-[21/9]">
        <Photo
          src={journey.coverUrl}
          priority
          className="h-full w-full transition-transform duration-700 group-hover:scale-[1.04]"
        />
        <div className="scrim absolute inset-0" />

        <div className="absolute left-4 top-4 flex flex-wrap gap-1.5 sm:left-6 sm:top-6">
          <Badge tone="glass">🔥 Trending</Badge>
          {journey.destinationName ? <Badge tone="glass">{journey.destinationName}</Badge> : null}
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
          {journey.originName && journey.destinationName ? (
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-white/85 sm:text-sm">
              <MapPin size={14} />
              {journey.originName} → {journey.destinationName}
            </p>
          ) : null}

          <h2 className="max-w-2xl text-xl font-extrabold leading-tight text-white drop-shadow-lg sm:text-3xl">
            {journey.title}
          </h2>

          <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-2.5">
            {journey.distanceM ? (
              <Badge tone="glass">{formatDistance(journey.distanceM)}</Badge>
            ) : null}
            {journey.durationMin ? (
              <Badge tone="glass">{formatDuration(journey.durationMin)}</Badge>
            ) : null}
            {days && days > 1 ? <Badge tone="glass">{days} days</Badge> : null}
            {cost > 0 ? (
              <span className="rounded-full bg-[var(--create)] px-3 py-1 text-xs font-extrabold text-white">
                {formatMoney(cost, journey.currency)}
              </span>
            ) : null}
          </div>

          <div className="mt-4 flex items-center gap-2.5">
            <Avatar name={journey.authorName} src={journey.authorAvatar} size={32} />
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-white">{journey.authorName}</p>
              <p className="text-[10px] text-white/70">{relativeTime(journey.publishedAt)}</p>
            </div>
            <div className="ml-auto hidden items-center gap-3 text-xs font-semibold text-white/85 sm:flex">
              <span className="flex items-center gap-1">
                <Star size={13} className="fill-[var(--star)] text-[var(--star)]" />
                {journey.likeCount}
              </span>
              <span className="flex items-center gap-1">
                <Eye size={13} /> {journey.viewCount}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* --------------------------------------------------- compact rail card --- */

export function JourneyRailCard({ journey }) {
  const days = dayCount(journey.startDate, journey.endDate);
  const cost = Number(journey.totalExpenseMinor);

  return (
    <Link
      to={`/journeys/${journey.id}`}
      className="group block w-[212px] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--bg-subtle)]">
        <Photo
          src={journey.coverUrl}
          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
        />
        <div className="scrim-soft absolute inset-x-0 bottom-0 h-2/3" />
        <div className="absolute inset-x-0 bottom-0 p-2.5">
          <p className="line-clamp-2 text-xs font-extrabold leading-snug text-white drop-shadow">
            {journey.title}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 p-2.5 text-[11px] font-semibold">
        {days ? <span className="text-[var(--text-muted)]">{days}d</span> : null}
        {cost > 0 ? (
          <span className="text-[var(--create)]">{formatMoney(cost, journey.currency)}</span>
        ) : null}
        <span className="ml-auto flex items-center gap-0.5 text-[var(--text-faint)]">
          <Star size={11} className="fill-[var(--star)] text-[var(--star)]" />
          {journey.likeCount}
        </span>
      </div>
    </Link>
  );
}

/* ---------------------------------------------------------- skeletons ---- */

export function JourneyCardSkeleton({ className }) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="skeleton aspect-[4/3] w-full" />
      <div className="space-y-2.5 p-3.5">
        <div className="skeleton h-3 w-2/3 rounded" />
        <div className="flex items-center gap-2 border-t border-[var(--border)] pt-3">
          <div className="skeleton h-7 w-7 rounded-full" />
          <div className="skeleton h-3 w-24 rounded" />
        </div>
      </div>
    </Card>
  );
}
