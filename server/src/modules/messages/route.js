/*
 * Route messages — dua mount:
 *   - default export → /api/admin/messages (wajib login)
 *   - publicRouter   → /api/public/messages (form kontak, rate limit ketat)
 */
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../../middleware/auth.js";
import validate, { validateQuery } from "../../middleware/validate.js";
import { detail, list, publicCreate, remove, setRead, unreadCount } from "./controller.js";
import { listQuerySchema, publicCreateSchema } from "./validation.js";

// Rate limit ketat untuk form kontak publik: 5 pesan / jam / IP
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Terlalu banyak pesan terkirim dari perangkat ini — coba lagi nanti", errors: null },
});

// ===== Admin =====
const router = Router();
router.use(requireAuth);

router.get("/", validateQuery(listQuerySchema), list);
// Urutkan sebelum /:id
router.get("/unread-count", unreadCount);
router.get("/:id", detail);
router.patch("/:id/read", setRead);
router.delete("/:id", remove);

// ===== Publik =====
const publicRouter = Router();
publicRouter.post("/", contactLimiter, validate(publicCreateSchema), publicCreate);

export default router;
export { publicRouter };
