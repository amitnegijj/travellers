// Trails — the immersive feed.
//
// Vertical scroll-snap moves to the next journey (the Reels/Stories gesture
// everyone already knows). The new part is horizontal: swiping across a card
// scrubs the journey's REAL route, stop by stop. The photo, the stop note and
// the money-spent meter all advance together, so a swipe replays the trip
// rather than jumping to the next photo.
//
// Nothing here invents data. Stops, photos and spend come from the journey.
import {
  Bookmark, ChevronLeft, ChevronRight, Clock, Gauge, Heart, MapPin,
  MessageCircle, Route, Share2, Wallet,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, isUnauthorized } from "../api/client.js";
import { Avatar, Photo } from "./ui/index.js";
import { cn, formatDistance, formatDuration, formatMoney, relativeTime } from "../utils/index.js";

export function TrailFeed({ trails }) {
  const [activeId, setActiveId] = useState(trails[0]?.id ?? null);
  const trackRef = useRef(null);

  // Only the card filling the viewport animates — otherwise a long feed runs
  // twenty Ken Burns loops at once and the fans spin up.
  useEffect(() => {
    const root = trackRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > 0.6) {
            setActiveId(e.target.dataset.trailId ?? null);
          }
        }
      },
      { root, threshold: [0.6] }
    );
    root.querySelectorAll("[data-trail-id]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [trails]);

  return (
    <div ref={trackRef} className="trail-track h-full w-full bg-black">
      {trails.map((t, i) => (
        <TrailCard key={t.id} trail={t} active={t.id === activeId} first={i === 0} />
      ))}
      <TrailEnd />
    </div>
  );
}

// ---------------------------------------------------------------- one trail

function TrailCard({ trail, active, first }) {
  const navigate = useNavigate();

  // Frame 0 is "the whole trip"; frames 1..n are the stops. That gives the
  // card a resting state that reads like a normal post before anyone swipes.
  const frames = trail.stops.length;
  const [i, setI] = useState(0);
  const [burst, setBurst] = useState(0);

  const stop = i > 0 ? trail.stops[i - 1] : null;
  const progress = frames === 0 ? 1 : i / frames;
  const spentMinor = stop?.spentSoFarMinor ?? Number(trail.totalExpenseMinor ?? 0);
  const photo = stop?.photoUrl ?? trail.photos[0] ?? trail.coverUrl;

  const go = useCallback(
    (delta) => setI((v) => Math.min(frames, Math.max(0, v + delta))),
    [frames]
  );

  // ---- gestures: horizontal drag scrubs, vertical is left to the pager
  const drag = useRef(null);

  const onPointerDown = (e) => {
    drag.current = { x: e.clientX, y: e.clientY, locked: null };
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (d.locked === null && Math.abs(dx) + Math.abs(dy) > 12) {
      d.locked = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }
    if (d.locked === "x" && Math.abs(dx) > 56) {
      go(dx < 0 ? 1 : -1);
      drag.current = { x: e.clientX, y: e.clientY, locked: "x" };
    }
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  // ---- double tap to like, with the burst
  const lastTap = useRef(0);
  const [liked, setLiked] = useState(trail.likedByMe);
  const [likeCount, setLikeCount] = useState(trail.likeCount);

  const toggleLike = useCallback(async () => {
    const prev = { liked, likeCount };
    setLiked(!liked);
    setLikeCount(likeCount + (liked ? -1 : 1));

    try {
      const data = await api.post(`/api/v1/journeys/${trail.id}/like`);
      setLiked(data.active);
      setLikeCount(data.count);
    } catch (err) {
      setLiked(prev.liked);
      setLikeCount(prev.likeCount);
      if (isUnauthorized(err)) navigate("/login");
    }
  }, [liked, likeCount, trail.id, navigate]);

  const onSurfaceTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setBurst((b) => b + 1);
      if (!liked) void toggleLike();
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  };

  // ---- keyboard: arrows scrub the route, same as the swipe
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => {
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, go]);

  return (
    <section
      data-trail-id={trail.id}
      aria-label={trail.title}
      className="trail-card relative h-full w-full touch-pan-y overflow-hidden"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* ------------------------------------------------------------ photo */}
      <div className="absolute inset-0" onClick={onSurfaceTap}>
        <Photo
          key={photo ?? "none"}
          src={photo}
          alt=""
          priority={first}
          className={cn("trail-in h-full w-full", active && "kenburns")}
        />
        <div className="trail-scrim absolute inset-0" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/70 to-transparent" />
      </div>

      {burst > 0 ? (
        <Heart
          key={burst}
          size={128}
          fill="white"
          className="heart-burst pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-2xl"
          aria-hidden
        />
      ) : null}

      {/* --------------------------------------------- route segment progress */}
      {frames > 0 ? (
        <div className="absolute inset-x-0 top-0 z-20 flex gap-1 px-3 pt-3" aria-hidden>
          {Array.from({ length: frames + 1 }).map((_, seg) => (
            <span key={seg} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
              <span
                className={cn(
                  "block h-full rounded-full bg-white transition-all duration-500",
                  seg <= i ? "w-full" : "w-0"
                )}
              />
            </span>
          ))}
        </div>
      ) : null}

      {/* ------------------------------------------------- scrub hit targets */}
      {frames > 0 ? (
        <>
          <button
            onClick={() => go(-1)}
            disabled={i === 0}
            aria-label="Previous stop on this route"
            className="group absolute inset-y-0 left-0 z-10 w-[20%] disabled:pointer-events-none"
          >
            <ChevronLeft
              size={30}
              className="ml-2 text-transparent transition-colors group-hover:text-white/70"
            />
          </button>
          <button
            onClick={() => go(1)}
            disabled={i === frames}
            aria-label="Next stop on this route"
            className="group absolute inset-y-0 right-0 z-10 w-[20%] disabled:pointer-events-none"
          >
            <ChevronRight
              size={30}
              className="ml-auto mr-2 text-transparent transition-colors group-hover:text-white/70"
            />
          </button>
        </>
      ) : null}

      {/* ------------------------------------------------------- action rail */}
      <div className="absolute bottom-28 right-3 z-20 flex flex-col items-center gap-4 sm:bottom-32 sm:right-5">
        <Link
          to={`/profile/${trail.authorHandle}`}
          className="mb-1"
          aria-label={`${trail.authorName}'s profile`}
        >
          <span className="story-ring block">
            <Avatar name={trail.authorName} src={trail.authorAvatar} size={46} />
          </span>
        </Link>

        <RailButton
          label={liked ? "Unlike" : "Like"}
          count={likeCount}
          active={liked}
          onClick={toggleLike}
          activeClass="text-rose-500"
          icon={<Heart size={26} fill={liked ? "currentColor" : "none"} />}
        />
        <RailButton
          label="Comments"
          count={trail.commentCount}
          href={`/journeys/${trail.id}#comments`}
          icon={<MessageCircle size={26} />}
        />
        <SaveRail trail={trail} />
        <RailButton label="Open trip" href={`/journeys/${trail.id}`} icon={<Share2 size={24} />} />
      </div>

      {/* ----------------------------------------------------------- caption */}
      <div className="absolute inset-x-0 bottom-0 z-20 p-4 pb-24 pr-20 sm:p-6 sm:pb-28 sm:pr-28">
        <div className="mx-auto w-full max-w-2xl">
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <Link
              to={`/profile/${trail.authorHandle}`}
              className="text-[13px] font-extrabold text-white hover:underline"
            >
              @{trail.authorHandle}
            </Link>
            <span className="text-[11px] text-white/50">{relativeTime(trail.publishedAt)}</span>
            {trail.destinationName ? (
              <span className="glass inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white">
                <MapPin size={11} /> {trail.destinationName}
              </span>
            ) : null}
          </div>

          {stop ? (
            <div key={stop.id} className="trail-in">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">
                Stop {stop.position + 1} of {frames}
                {stop.arrivedOn
                  ? ` · ${new Date(stop.arrivedOn).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}`
                  : ""}
              </p>
              <h2 className="mt-1 text-[26px] font-extrabold leading-tight tracking-tight text-white drop-shadow sm:text-3xl">
                {stop.name}
              </h2>
              {stop.note ? (
                <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-white/80">
                  {stop.note}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="trail-in">
              <Link to={`/journeys/${trail.id}`}>
                <h2 className="text-[26px] font-extrabold leading-tight tracking-tight text-white drop-shadow sm:text-[32px]">
                  {trail.title}
                </h2>
              </Link>
              {trail.originName && trail.destinationName ? (
                <p className="mt-1 flex items-center gap-1.5 text-[13px] font-semibold text-white/75">
                  {trail.originName}
                  <Route size={13} className="text-white/45" />
                  {trail.destinationName}
                </p>
              ) : null}
              {trail.summary ? (
                <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-white/75">
                  {trail.summary}
                </p>
              ) : null}
            </div>
          )}

          {/* ------------------------------------------------ the scrub meter */}
          <div className="glass-strong mt-4 rounded-2xl p-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
                  {stop ? "Spent by this stop" : "Whole trip"}
                </p>
                <p className="text-[22px] font-extrabold leading-none tracking-tight tabular-nums text-white">
                  {formatMoney(spentMinor, trail.currency)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <MicroStat icon={<Gauge size={12} />} value={formatDistance(trail.distanceM)} />
                <MicroStat icon={<Clock size={12} />} value={formatDuration(trail.durationMin)} />
                {trail.topCategory ? (
                  <MicroStat icon={<Wallet size={12} />} value={trail.topCategory} />
                ) : null}
              </div>
            </div>

            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/15">
              <div
                className="meter-fill h-full rounded-full transition-[width] duration-500"
                style={{ width: `${Math.max(progress * 100, 4)}%` }}
              />
            </div>

            <p className="mt-2 text-[11px] font-medium text-white/45">
              {frames === 0
                ? "No stops logged on this route yet"
                : i === 0
                  ? "Swipe across the photo to walk the route →"
                  : `${frames - i} ${frames - i === 1 ? "stop" : "stops"} to go`}
            </p>
          </div>

          <Link
            to={`/journeys/${trail.id}`}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-extrabold text-black transition-transform hover:scale-[1.03]"
          >
            Open the full trip
            <ChevronRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ pieces

function MicroStat({ icon, value }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold capitalize text-white/70">
      {icon}
      {value}
    </span>
  );
}

function RailButton({ icon, label, count, active, onClick, href, activeClass }) {
  const body = (
    <>
      <span
        className={cn(
          "glass grid h-11 w-11 place-items-center rounded-full text-white transition-transform",
          "hover:scale-110 active:scale-95",
          active && activeClass,
          active && "pop"
        )}
      >
        {icon}
      </span>
      {count != null ? (
        <span className="text-[11px] font-extrabold tabular-nums text-white drop-shadow">
          {count}
        </span>
      ) : null}
    </>
  );

  const className = "flex flex-col items-center gap-1";

  return href ? (
    <Link to={href} aria-label={label} className={className}>
      {body}
    </Link>
  ) : (
    <button onClick={onClick} aria-label={label} aria-pressed={active} className={className}>
      {body}
    </button>
  );
}

function SaveRail({ trail }) {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(trail.savedByMe);
  const [count, setCount] = useState(trail.saveCount);

  const toggle = async () => {
    const prev = { saved, count };
    setSaved(!saved);
    setCount(count + (saved ? -1 : 1));

    try {
      const data = await api.post(`/api/v1/journeys/${trail.id}/save`);
      setSaved(data.active);
      setCount(data.count);
    } catch (err) {
      setSaved(prev.saved);
      setCount(prev.count);
      if (isUnauthorized(err)) navigate("/login");
    }
  };

  return (
    <RailButton
      label={saved ? "Remove from saved" : "Save this trip"}
      count={count}
      active={saved}
      onClick={toggle}
      activeClass="text-amber-400"
      icon={<Bookmark size={25} fill={saved ? "currentColor" : "none"} />}
    />
  );
}

function TrailEnd() {
  return (
    <section className="trail-card grid h-full w-full place-items-center bg-gradient-to-br from-[#0b1220] via-black to-[#1a0b20] px-6 text-center">
      <div>
        <Route size={40} className="mx-auto text-white/40" />
        <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-white">
          That&apos;s every trail for now
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-white/55">
          Log your own route — where you went, what it actually cost, and what
          you&apos;d do differently.
        </p>
        <Link
          to="/journeys/new"
          className="mt-5 inline-flex rounded-full bg-white px-6 py-2.5 text-sm font-extrabold text-black"
        >
          Log a journey
        </Link>
      </div>
    </section>
  );
}
