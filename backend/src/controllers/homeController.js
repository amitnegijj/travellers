import * as homeService from "../services/homeService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/response.js";

export const getRail = asyncHandler(async (req, res) => ok(res, await homeService.getRail()));
export const getStories = asyncHandler(async (req, res) => ok(res, await homeService.getStories()));
export const getDestinationsStrip = asyncHandler(async (req, res) =>
  ok(res, await homeService.getDestinationsStrip())
);
export const getCommunityStrip = asyncHandler(async (req, res) =>
  ok(res, await homeService.getCommunityStrip())
);
