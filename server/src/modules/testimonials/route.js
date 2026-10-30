// Route testimonials — dipasang di /api/admin/testimonials (wajib login)
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import validate from "../../middleware/validate.js";
import { create, detail, list, publish, remove, update } from "./controller.js";
import { createSchema, updateSchema } from "./validation.js";

const router = Router();
router.use(requireAuth);

router.get("/", list);
router.post("/", validate(createSchema), create);
router.patch("/:id/publish", publish);
router.get("/:id", detail);
router.put("/:id", validate(updateSchema), update);
router.delete("/:id", remove);

export default router;
