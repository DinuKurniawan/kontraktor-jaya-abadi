// Route kategori layanan admin dan publik.
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import validate, { validateQuery } from "../../middleware/validate.js";
import { create, detail, list, publicList, remove, reorder, update } from "./controller.js";
import { createSchema, listQuerySchema, reorderSchema, updateSchema } from "./validation.js";

const router = Router();
router.use(requireAuth);
router.get("/", validateQuery(listQuerySchema), list);
router.patch("/reorder", validate(reorderSchema), reorder);
router.get("/:id", detail);
router.post("/", validate(createSchema), create);
router.put("/:id", validate(updateSchema), update);
router.delete("/:id", remove);

const publicRouter = Router();
publicRouter.get("/", publicList);

export default router;
export { publicRouter };
