import { Router } from "express";
import { profileUpdateSchema, userPlaceCreateSchema } from "../lib/validation.js";
import { getSessionUser, requireUser } from "../lib/auth.js";
import { queryOne } from "../lib/db.js";
import { AppError, asyncHandler, ok, parseBody } from "../lib/http.js";
import { toggleFollow } from "../services/social.js";
import { createUserPlace, journeyPlaces, listUserPlaces } from "../services/user-places.js";

const router = Router();

router.get(
  "/:handle",
  asyncHandler(async (req, res) => {
    const { handle } = req.params;
    const viewer = await getSessionUser(req);

    const profile = await queryOne(
      `select p.id, p.handle, p.display_name as "displayName", p.bio, p.location,
              p.avatar_url as "avatarUrl", p.is_private as "isPrivate", p.created_at as "createdAt",
              (select count(*) from follows f where f.following_id = p.id)::int as "followerCount",
              (select count(*) from follows f where f.follower_id  = p.id)::int as "followingCount",
              (select count(*) from journeys j
                where j.author_id = p.id and j.status = 'published')::int as "journeyCount",
              case when $2::uuid is null then false
                   else exists (select 1 from follows f
                                 where f.follower_id = $2::uuid and f.following_id = p.id)
              end as "isFollowing"
         from profiles p
        where p.handle = $1`,
      [handle, viewer?.id ?? null]
    );

    if (!profile) throw new AppError("not_found", "No such profile");
    ok(res, profile);
  })
);

router.patch(
  "/:handle",
  asyncHandler(async (req, res) => {
    const { handle } = req.params;
    const user = await requireUser(req);

    if (user.handle.toLowerCase() !== handle.toLowerCase()) {
      throw new AppError("forbidden", "You can only edit your own profile");
    }

    const input = parseBody(req, profileUpdateSchema);

    const updated = await queryOne(
      `update profiles
          set display_name = $2,
              bio          = $3,
              location     = $4,
              avatar_url   = nullif($5, ''),
              is_private   = coalesce($6, is_private)
        where id = $1
        returning id, handle, display_name as "displayName", bio, location,
                  avatar_url as "avatarUrl", is_private as "isPrivate"`,
      [user.id, input.displayName, input.bio ?? null, input.location ?? null,
       input.avatarUrl ?? null, input.isPrivate ?? null]
    );

    ok(res, updated);
  })
);

router.post(
  "/:handle/follow",
  asyncHandler(async (req, res) => {
    const user = await requireUser(req);
    ok(res, await toggleFollow(user.id, req.params.handle));
  })
);

router.get(
  "/:handle/places",
  asyncHandler(async (req, res) => {
    const { handle } = req.params;
    const viewer = await getSessionUser(req);
    const [{ items, isOwner }, reached] = await Promise.all([
      listUserPlaces(handle, viewer?.id ?? null),
      journeyPlaces(handle),
    ]);
    ok(res, { items, isOwner, reached });
  })
);

router.post(
  "/:handle/places",
  asyncHandler(async (req, res) => {
    const { handle } = req.params;
    const user = await requireUser(req);

    if (user.handle.toLowerCase() !== handle.toLowerCase()) {
      throw new AppError("forbidden", "You can only pin places on your own map");
    }

    const input = parseBody(req, userPlaceCreateSchema);
    const place = await createUserPlace(user.id, input);
    ok(res, place, 201);
  })
);

export default router;
