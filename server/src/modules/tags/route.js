// Route tag artikel admin — dipasang di /api/admin/tags
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import validate, { validateQuery } from "../../middleware/validate.js";
import { create, list, remove, update } from "./controller.js";
import { createSchema, listQuerySchema, updateSchema } from "./validation.js";

const router = Router();
router.use(requireAuth);
router.get("/", validateQuery(listQuerySchema), list);
router.post("/", validate(createSchema), create);
router.put("/:id", validate(updateSchema), update);
router.delete("/:id", remove);

export default router;
