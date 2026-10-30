// Route projects — dipasang di /api/admin/projects (wajib login)
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import validate, { validateQuery } from "../../middleware/validate.js";
import { create, detail, featured, list, publish, remove, update } from "./controller.js";
import { createSchema, listQuerySchema, updateSchema } from "./validation.js";

const router = Router();
router.use(requireAuth);

router.get("/", validateQuery(listQuerySchema), list);
router.post("/", validate(createSchema), create);
// PATCH spesifik sebelum :id umum
router.patch("/:id/publish", publish);
router.patch("/:id/featured", featured);
router.get("/:id", detail);
router.put("/:id", validate(updateSchema), update);
router.delete("/:id", remove);

export default router;
