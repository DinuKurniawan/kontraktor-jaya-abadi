/*
 * Route service-scopes — default: admin (/api/admin/service-scopes, wajib auth);
 * publicRouter tidak diperlukan (scopes diakses via detail layanan publik).
 */
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import validate, { validateQuery } from "../../middleware/validate.js";
import { create, detail, list, remove, reorder, update } from "./controller.js";
import { createSchema, listQuerySchema, reorderSchema, updateSchema } from "./validation.js";

const router = Router();
router.use(requireAuth);

router.get("/", validateQuery(listQuerySchema), list);
router.patch("/reorder", validate(reorderSchema), reorder);
router.post("/", validate(createSchema), create);
router.get("/:id", detail);
router.put("/:id", validate(updateSchema), update);
router.delete("/:id", remove);

export default router;
