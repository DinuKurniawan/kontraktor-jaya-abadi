/*
 * Route estimate-prices — default: admin (/api/admin/estimate-prices, wajib auth),
 * publicRouter: publik (/api/public/estimate-prices). Tanpa reorder (tak ada sortOrder).
 */
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import validate from "../../middleware/validate.js";
import { create, detail, list, publicList, remove, update } from "./controller.js";
import { createSchema, updateSchema } from "./validation.js";

const router = Router();
router.use(requireAuth);

router.get("/", list);
router.post("/", validate(createSchema), create);
router.get("/:id", detail);
router.put("/:id", validate(updateSchema), update);
router.delete("/:id", remove);

const publicRouter = Router();
publicRouter.get("/", publicList);

export default router;
export { publicRouter };
