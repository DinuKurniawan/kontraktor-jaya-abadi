// Route media: /api/media — semua butuh login
import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import uploadMedia from "./upload.js";
import { bulkRemove, cleanupBroken, list, listBroken, remove, usage, upload } from "./controller.js";
import validate from "../../middleware/validate.js";
import { bulkDeleteSchema, cleanupBrokenSchema } from "./validation.js";

const router = Router();

router.use(requireAuth);

// "Tidak ada file yang diunggah" dicek di service (req.files kosong)
router.post("/upload", uploadMedia, upload);
router.get("/", list);
router.get("/broken", listBroken);
router.get("/:id/usage", usage);
router.delete("/:id", requireRole("SUPER_ADMIN", "ADMIN"), remove);
router.post("/bulk-delete", requireRole("SUPER_ADMIN", "ADMIN"), validate(bulkDeleteSchema), bulkRemove);
router.post("/cleanup-broken", requireRole("SUPER_ADMIN"), validate(cleanupBrokenSchema), cleanupBroken);

export default router;
