/*
 * Route settings — dua mount:
 *   - default export → /api/admin/settings (wajib login)
 *   - publicRouter   → /api/public/settings (profil & kontak untuk situs publik)
 */
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { list, publicList, upsert } from "./controller.js";

const router = Router();
router.use(requireAuth);

router.get("/", list);
router.put("/", upsert);

const publicRouter = Router();
publicRouter.get("/", publicList);

export default router;
export { publicRouter };
