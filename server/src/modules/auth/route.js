// Route auth: /api/auth
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import validate from "../../middleware/validate.js";
import { changePassword, login, logout, me } from "./controller.js";
import { changePasswordSchema, loginSchema } from "./validation.js";

const router = Router();

router.post("/login", validate(loginSchema), login);
router.post("/logout", logout);
router.get("/me", requireAuth, me);
router.put("/change-password", requireAuth, validate(changePasswordSchema), changePassword);

export default router;
