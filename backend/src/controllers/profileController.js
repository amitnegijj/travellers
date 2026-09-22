import { getSessionUser, requireUser } from "../middleware/authenticate.js";
import * as profileService from "../services/profileService.js";
import * as socialService from "../services/socialService.js";
import * as userPlaceService from "../services/userPlaceService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/response.js";

export const getByHandle = asyncHandler(async (req, res) => {
  const viewer = await getSessionUser(req);
  ok(res, await profileService.getProfile(req.params.handle, viewer?.id ?? null));
});

export const update = asyncHandler(async (req, res) => {
  const user = await requireUser(req);
  ok(res, await profileService.updateProfile(user, req.params.handle, req.body));
});

export const follow = asyncHandler(async (req, res) => {
  const user = await requireUser(req);
  ok(res, await socialService.toggleFollow(user.id, req.params.handle));
});

export const listPlaces = asyncHandler(async (req, res) => {
  const viewer = await getSessionUser(req);
  ok(res, await userPlaceService.getTravelMap(req.params.handle, viewer?.id ?? null));
});

export const createPlace = asyncHandler(async (req, res) => {
  const user = await requireUser(req);
  profileService.assertOwnHandle(user, req.params.handle, "You can only pin places on your own map");

  const place = await userPlaceService.createUserPlace(user.id, req.body);
  ok(res, place, 201);
});
