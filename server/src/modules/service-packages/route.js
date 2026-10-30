/*
 * Route service-packages — default: admin (/api/admin/service-packages, wajib auth);
 * publicRouter: publik (/api/public/service-packages?serviceId=).
 */
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import validate from "../../middleware/validate.js";
import { create, detail, list, publicList, remove, reorder, update } from "./controller.js";
import { createSchema, reorderSchema, updateSchema } from "./validation.js";

const router = Router();
router.use(requireAuth);

router.get("/", list);
router.patch("/reorder", validate(reorderSchema), reorder);
router.post("/", validate(createSchema), create);
router.get("/:id", detail);
router.put("/:id", validate(updateSchema), update);
router.delete("/:id", remove);

const publicRouter = Router();
publicRouter.get("/", publicList);

export default router;
export { publicRouter };
