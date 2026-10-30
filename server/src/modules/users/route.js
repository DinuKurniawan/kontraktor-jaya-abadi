// Route users: /api/users — seluruh endpoint butuh SUPER_ADMIN
import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import validate from "../../middleware/validate.js";
import { create, list, remove, toggle, update } from "./controller.js";
import { createSchema, updateSchema } from "./validation.js";

const router = Router();

router.use(requireAuth, requireRole("SUPER_ADMIN"));

router.get("/", list);
router.post("/", validate(createSchema), create);
router.put("/:id", validate(updateSchema), update);
router.patch("/:id/toggle-status", toggle);
router.delete("/:id", remove);

export default router;
