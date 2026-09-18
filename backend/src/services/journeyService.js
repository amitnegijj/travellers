// Journey use-cases. Owns the rules — who may edit what, how a route is
// derived, how complete a draft is — and delegates every read and write to
// the repository.
import { DEFAULT_PAGE_SIZE } from "../config/constants.js";
import * as journeyRepository from "../repositories/journeyRepository.js";
import * as profileRepository from "../repositories/profileRepository.js";
import * as socialRepository from "../repositories/socialRepository.js";
import { AppError } from "../utils/AppError.js";

/** Rough authoring-progress score. Drives the "how complete is this?" nudges. */
export function completenessOf(input) {
  const checks = [
    !!input.title,
    !!input.summary,
    !!input.originName,
    !!input.destinationName,
    input.distanceM != null,
    input.durationMin != null,
    !!input.startDate,
    (input.stops?.length ?? 0) > 0,
    (input.expenses?.length ?? 0) > 0,
    (input.tips?.length ?? 0) > 0,
    (input.mediaIds?.length ?? 0) > 0,
    !!input.travelStyle,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

/**
 * A straight origin -> stops -> destination line is a good enough simplified
 * route until real GPS tracks arrive with the mobile app.
 */
function routeLineOf(input) {
  const path = [];
  if (input.origin) path.push([input.origin.lng, input.origin.lat]);
  for (const s of input.stops ?? []) {
    if (s.lng != null && s.lat != null) path.push([s.lng, s.lat]);
  }
  if (input.destination) path.push([input.destination.lng, input.destination.lat]);

  return path.length >= 2
    ? `SRID=4326;LINESTRING(${path.map(([lng, lat]) => `${lng} ${lat}`).join(", ")})`
    : null;
}

export async function listJourneys(opts = {}) {
  const limit = opts.limit ?? DEFAULT_PAGE_SIZE;
  const rows = await journeyRepository.findFeedRows({ ...opts, limit });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];

  return {
    items,
    nextCursor:
      hasMore && last ? { ts: new Date(last.publishedAt).toISOString(), id: last.id } : null,
  };
}

export async function getJourney(id, viewerId) {
  const journey = await journeyRepository.findById(id, viewerId);

  // A draft is visible only to its author, and "not yours" is reported as
  // "doesn't exist" so the API never confirms a private journey's existence.
  if (!journey) throw new AppError("not_found", "No such journey");
  if (journey.status !== "published" && journey.authorId !== viewerId) {
    throw new AppError("not_found", "No such journey");
  }

  const children = await journeyRepository.findChildren(id);
  return { ...journey, ...children };
}

/** The full detail payload: the journey, its comments and the author's follow state. */
export async function getJourneyPage(id, viewerId) {
  const journey = await getJourney(id, viewerId);

  const [comments, authorFollow] = await Promise.all([
    socialRepository.listComments(id),
    profileRepository.findFollowSummary(journey.authorHandle, viewerId),
    journeyRepository.incrementViewCount(id),
  ]);

  return { ...journey, comments, authorFollow };
}

export async function createJourney(authorId, input) {
  return journeyRepository.createWithChildren({
    authorId,
    input,
    route: routeLineOf(input),
    completeness: completenessOf(input),
  });
}

export async function updateJourney(journeyId, authorId, input) {
  const existing = await journeyRepository.findSnapshotForUpdate(journeyId);
  if (!existing) throw new AppError("not_found", "No such journey");
  if (existing.authorId !== authorId) {
    throw new AppError("forbidden", "You can only edit your own journeys");
  }

  // Completeness is a whole-journey score, so grade the merged result rather
  // than the patch alone — otherwise a one-field edit reports near-zero.
  const merged = {
    title: input.title ?? existing.title,
    summary: "summary" in input ? input.summary : existing.summary,
    originName: "originName" in input ? input.originName : existing.originName,
    destinationName:
      "destinationName" in input ? input.destinationName : existing.destinationName,
    distanceM: "distanceM" in input ? input.distanceM : existing.distanceM,
    durationMin: "durationMin" in input ? input.durationMin : existing.durationMin,
    startDate: "startDate" in input ? input.startDate : existing.startDate,
    travelStyle: "travelStyle" in input ? input.travelStyle : existing.travelStyle,
    stops: input.stops ?? new Array(existing.stopCount),
    expenses: input.expenses ?? new Array(existing.expenseCount),
    tips: input.tips ?? new Array(existing.tipCount),
    mediaIds: input.mediaIds ?? new Array(existing.mediaCount),
  };

  return journeyRepository.updateWithChildren({
    journeyId,
    input,
    completeness: completenessOf(merged),
    snapshot: { title: merged.title, summary: merged.summary },
  });
}

export async function deleteJourney(journeyId, authorId) {
  const existing = await journeyRepository.findAuthorId(journeyId);
  if (!existing) throw new AppError("not_found", "No such journey");
  if (existing.author_id !== authorId) throw new AppError("forbidden", "Not your journey");

  await journeyRepository.deleteById(journeyId);
}

/**
 * Drafts are invisible to every feed, so without this an author could never
 * reach something they saved as a draft.
 */
export async function listMyJourneys(authorId) {
  return journeyRepository.listByAuthor(authorId);
}

/** The journey reshaped into exactly what the composer form needs to rehydrate. */
export async function getJourneyForEdit(journeyId, authorId) {
  const journey = await journeyRepository.findForEdit(journeyId);
  if (!journey) throw new AppError("not_found", "No such journey");
  if (journey.authorId !== authorId) {
    throw new AppError("forbidden", "You can only edit your own journeys");
  }

  const children = await journeyRepository.findChildrenForEdit(journeyId);
  return { ...journey, ...children };
}
