import { Router } from "express";
import * as userPlaceController from "../controllers/userPlaceController.js";
import { validateBody } from "../middleware/validate.js";
import { userPlaceUpdateSchema } from "../validators/userPlaceValidators.js";

const router = Router();

router.patch("/:id", validateBody(userPlaceUpdateSchema), userPlaceController.update);
router.delete("/:id", userPlaceController.remove);

export default router;
