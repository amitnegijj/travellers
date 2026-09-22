import { Router } from "express";
import * as authController from "../controllers/authController.js";
import { validateBody } from "../middleware/validate.js";
import { loginSchema, signupSchema } from "../validators/authValidators.js";

const router = Router();

router.post("/login", validateBody(loginSchema), authController.login);
router.post("/signup", validateBody(signupSchema), authController.signup);
router.post("/logout", authController.logout);
router.get("/me", authController.me);

export default router;
