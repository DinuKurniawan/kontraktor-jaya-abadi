// Route cabang publik: GET /api/public/branches.
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import validate, { validateQuery } from "../../middleware/validate.js";
import { create, detail, list, publicList, remove, update } from "./controller.js";
import { createSchema, listQuerySchema, updateSchema } from "./validation.js";

const router = Router();
router.use(requireAuth);
router.get("/", validateQuery(listQuerySchema), list);
router.post("/", validate(createSchema), create);
router.get("/:id", detail);
router.put("/:id", validate(updateSchema), update);
router.delete("/:id", remove);

const publicRouter = Router();
publicRouter.get("/", publicList);

export default router;
export { publicRouter };
