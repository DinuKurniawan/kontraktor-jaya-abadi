// Route projects — dipasang di /api/admin/projects (wajib login)
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import validate, { validateQuery } from "../../middleware/validate.js";
import { bulk, create, detail, featured, list, publish, remove, update } from "./controller.js";
import { bulkSchema, createSchema, listQuerySchema, updateSchema } from "./validation.js";

const router = Router();
router.use(requireAuth);

router.get("/", validateQuery(listQuerySchema), list);
router.post("/", validate(createSchema), create);
// Aksi massal (sebelum route :id umum)
router.patch("/bulk", validate(bulkSchema), bulk);
// PATCH spesifik sebelum :id umum
router.patch("/:id/publish", publish);
router.patch("/:id/featured", featured);
router.get("/:id", detail);
router.put("/:id", validate(updateSchema), update);
router.delete("/:id", remove);

export default router;
