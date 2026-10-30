// Route team members — dipasang di /api/admin/team (wajib login)
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import validate from "../../middleware/validate.js";
import { create, detail, list, remove, reorder, update } from "./controller.js";
import { createSchema, reorderSchema, updateSchema } from "./validation.js";

const router = Router();
router.use(requireAuth);

router.get("/", list);
// Reorder sebelum /:id
router.patch("/reorder", validate(reorderSchema), reorder);
router.post("/", validate(createSchema), create);
router.get("/:id", detail);
router.put("/:id", validate(updateSchema), update);
router.delete("/:id", remove);

export default router;
