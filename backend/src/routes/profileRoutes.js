import { Router } from "express";
import * as profileController from "../controllers/profileController.js";
import { validateBody } from "../middleware/validate.js";
import { profileUpdateSchema } from "../validators/profileValidators.js";
import { userPlaceCreateSchema } from "../validators/userPlaceValidators.js";

const router = Router();

router.get("/:handle", profileController.getByHandle);
router.patch("/:handle", validateBody(profileUpdateSchema), profileController.update);
router.post("/:handle/follow", profileController.follow);
router.get("/:handle/places", profileController.listPlaces);
router.post("/:handle/places", validateBody(userPlaceCreateSchema), profileController.createPlace);

export default router;
