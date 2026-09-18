import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../config/constants.js";
import { getSessionUser, requireUser } from "../middleware/authenticate.js";
import * as journeyService from "../services/journeyService.js";
import * as socialService from "../services/socialService.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { decodeCursor, encodeCursor } from "../utils/cursor.js";
import { ok } from "../utils/response.js";

export const list = asyncHandler(async (req, res) => {
  const viewer = await getSessionUser(req);

  // `?saved=me` is the only supported value — a viewer can only ever ask
  // for their own saves, never anyone else's.
  let savedBy;
  if (req.query.saved === "me") {
    if (!viewer) throw new AppError("unauthorized", "You must be signed in");
    savedBy = viewer.id;
  }

  const { items, nextCursor } = await journeyService.listJourneys({
    viewerId: viewer?.id ?? null,
    cursor: decodeCursor(req.query.cursor ?? null),
    limit: Math.min(Number(req.query.limit ?? DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE),
    scope: req.query.scope === "following" ? "following" : "all",
    authorHandle: req.query.author || undefined,
    destinationSlug: req.query.destination || undefined,
    savedBy,
    q: req.query.q || undefined,
  });

  ok(res, { items, nextCursor: nextCursor ? encodeCursor(nextCursor) : null });
});

export const create = asyncHandler(async (req, res) => {
  const user = await requireUser(req);
  const id = await journeyService.createJourney(user.id, req.body);
  ok(res, { id }, 201);
});

export const listMine = asyncHandler(async (req, res) => {
  const user = await requireUser(req);
  ok(res, { items: await journeyService.listMyJourneys(user.id) });
});

export const getForEdit = asyncHandler(async (req, res) => {
  const user = await requireUser(req);
  ok(res, await journeyService.getJourneyForEdit(req.params.id, user.id));
});

export const getById = asyncHandler(async (req, res) => {
  const viewer = await getSessionUser(req);
  ok(res, await journeyService.getJourneyPage(req.params.id, viewer?.id ?? null));
});

export const update = asyncHandler(async (req, res) => {
  const user = await requireUser(req);
  await journeyService.updateJourney(req.params.id, user.id, req.body);
  ok(res, { id: req.params.id });
});

export const remove = asyncHandler(async (req, res) => {
  const user = await requireUser(req);
  await journeyService.deleteJourney(req.params.id, user.id);
  ok(res, { ok: true });
});

export const like = asyncHandler(async (req, res) => {
  const user = await requireUser(req);
  ok(res, await socialService.toggleLike(user.id, req.params.id));
});

export const save = asyncHandler(async (req, res) => {
  const user = await requireUser(req);
  ok(res, await socialService.toggleSave(user.id, req.params.id));
});

export const listComments = asyncHandler(async (req, res) => {
  ok(res, { items: await socialService.listComments(req.params.id) });
});

export const addComment = asyncHandler(async (req, res) => {
  const user = await requireUser(req);
  const comment = await socialService.addComment(user.id, req.params.id, req.body.body);

  // The author is whoever is signed in, so the new comment is returned
  // already joined rather than making the client re-fetch the thread.
  ok(
    res,
    {
      ...comment,
      authorHandle: user.handle,
      authorName: user.displayName,
      authorAvatar: user.avatarUrl,
      authorId: user.id,
    },
    201
  );
});
