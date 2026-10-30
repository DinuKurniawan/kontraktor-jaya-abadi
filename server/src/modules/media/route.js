// Route media: /api/media — semua butuh login
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import uploadMedia from "./upload.js";
import { list, remove, upload } from "./controller.js";

const router = Router();

router.use(requireAuth);

// "Tidak ada file yang diunggah" dicek di service (req.files kosong)
router.post("/upload", uploadMedia, upload);
router.get("/", list);
router.delete("/:id", remove);

export default router;
