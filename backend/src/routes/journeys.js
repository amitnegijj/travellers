import { Router } from "express";
import { commentSchema, journeyCreateSchema, journeyUpdateSchema } from "../lib/validation.js";
import { getSessionUser, requireUser } from "../lib/auth.js";
import { queryOne } from "../lib/db.js";
import { AppError, asyncHandler, decodeCursor, encodeCursor, ok, parseBody } from "../lib/http.js";
import {
  createJourney, deleteJourney, getJourney, getJourneyForEdit, incrementView,
  listJourneys, listMyJourneys, updateJourney,
} from "../services/journeys.js";
import { addComment, listComments, toggleLike, toggleSave } from "../services/social.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const viewer = await getSessionUser(req);

    // `?saved=me` is the only supported value — a viewer can only ever ask
    // for their own saves, never anyone else's.
    let savedBy;
    if (req.query.saved === "me") {
      if (!viewer) throw new AppError("unauthorized", "You must be signed in");
      savedBy = viewer.id;
    }

    const { items, nextCursor } = await listJourneys({
      viewerId: viewer?.id ?? null,
      cursor: decodeCursor(req.query.cursor ?? null),
      limit: Math.min(Number(req.query.limit ?? 12), 50),
      scope: req.query.scope === "following" ? "following" : "all",
      authorHandle: req.query.author || undefined,
      destinationSlug: req.query.destination || undefined,
      savedBy,
      q: req.query.q || undefined,
    });

    ok(res, { items, nextCursor: nextCursor ? encodeCursor(nextCursor) : null });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const user = await requireUser(req);
    const input = parseBody(req, journeyCreateSchema);
    const id = await createJourney(user.id, input);
    ok(res, { id }, 201);
  })
);

// Registered before "/:id" — otherwise Express would match "mine" as an id.
router.get(
  "/mine",
  asyncHandler(async (req, res) => {
    const user = await requireUser(req);
    ok(res, { items: await listMyJourneys(user.id) });
  })
);

router.get(
  "/:id/edit",
  asyncHandler(async (req, res) => {
    const user = await requireUser(req);
    ok(res, await getJourneyForEdit(req.params.id, user.id));
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await getSessionUser(req);
    const journey = await getJourney(id, user?.id ?? null);

    // Bundled in one response — this single route replaces what used to be
    // an RSC page pulling the journey, its comments and the author's follow
    // state directly, all in one server render.
    const [comments, authorFollow] = await Promise.all([
      listComments(id),
      queryOne(
        `select case when $2::uuid is null then false
                     else exists (select 1 from follows f
                                   where f.follower_id = $2::uuid and f.following_id = p.id)
                end as "isFollowing",
                (select count(*) from follows f where f.following_id = p.id)::int as "followerCount"
           from profiles p where p.handle = $1`,
        [journey.authorHandle, user?.id ?? null]
      ),
      incrementView(id),
    ]);

    ok(res, { ...journey, comments, authorFollow });
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = await requireUser(req);
    const input = parseBody(req, journeyUpdateSchema);
    await updateJourney(req.params.id, user.id, input);
    ok(res, { id: req.params.id });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = await requireUser(req);
    await deleteJourney(req.params.id, user.id);
    ok(res, { ok: true });
  })
);

router.post(
  "/:id/like",
  asyncHandler(async (req, res) => {
    const user = await requireUser(req);
    ok(res, await toggleLike(user.id, req.params.id));
  })
);

router.post(
  "/:id/save",
  asyncHandler(async (req, res) => {
    const user = await requireUser(req);
    ok(res, await toggleSave(user.id, req.params.id));
  })
);

router.get(
  "/:id/comments",
  asyncHandler(async (req, res) => {
    ok(res, { items: await listComments(req.params.id) });
  })
);

router.post(
  "/:id/comments",
  asyncHandler(async (req, res) => {
    const user = await requireUser(req);
    const { body } = parseBody(req, commentSchema);
    const comment = await addComment(user.id, req.params.id, body);
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
  })
);

export default router;
