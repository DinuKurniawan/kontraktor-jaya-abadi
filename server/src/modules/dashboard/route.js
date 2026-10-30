// Route dashboard — dipasang di /api/admin/dashboard (wajib login)
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { stats } from "./controller.js";

const router = Router();
router.use(requireAuth);

router.get("/", stats);

export default router;
