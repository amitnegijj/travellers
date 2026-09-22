import * as destinationService from "../services/destinationService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/response.js";

export const getMap = asyncHandler(async (req, res) => {
  ok(res, await destinationService.mapFeatures());
});
