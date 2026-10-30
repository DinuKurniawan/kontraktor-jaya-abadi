/*
 * Route categories — satu file per modul, dua mount:
 *   - default export  → router admin  (dipasang di /api/admin/categories, wajib auth)
 *   - publicRouter    → router publik (dipasang di /api/public/categories, tanpa auth)
 */
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import validate, { validateQuery } from "../../middleware/validate.js";
import { create, detail, list, publicList, remove, update } from "./controller.js";
import { createSchema, listQuerySchema, updateSchema } from "./validation.js";

// ===== Admin (butuh login) =====
const router = Router();
router.use(requireAuth);

router.get("/", validateQuery(listQuerySchema), list);
router.get("/:id", detail);
router.post("/", validate(createSchema), create);
router.put("/:id", validate(updateSchema), update);
router.delete("/:id", remove);

// ===== Publik (tanpa login) =====
const publicRouter = Router();
publicRouter.get("/", validateQuery(listQuerySchema), publicList);

export default router;
export { publicRouter };
