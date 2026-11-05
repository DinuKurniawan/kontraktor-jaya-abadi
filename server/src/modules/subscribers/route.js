// Subscribers — public subscribe + daftar admin (CSV diekspor dari sisi admin)
import { Router } from "express";
import { z } from "zod";
import prisma from "../../config/prisma.js";
import { requireAuth } from "../../middleware/auth.js";

const router = Router();
const publicRouter = Router();

const emailSchema = z.object({ email: z.string().email().max(150) });

/** POST /api/public/subscribe — email saja; idempoten (duplicate = sukses, anti_ENUM_bot tak bocor) */
publicRouter.post("/subscribe", async (req, res, next) => {
  try {
    const { email } = emailSchema.parse(req.body);
    await prisma.subscriber.upsert({ where: { email }, update: {}, create: { email: email.toLowerCase() } });
    // Duplicate = tetap sukses (idempoten); tanpa detail utk enum-bot
    res.json({ success: true });
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ success: false, message: "Email tidak valid" });
    next(e);
  }
});

router.use(requireAuth);
/** GET /api/admin/subscribers */
router.get("/", async (req, res, next) => {
  try {
    const rows = await prisma.subscriber.findMany({ orderBy: { createdAt: "desc" } });
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});

/** POST /api/admin/subscribers — buat manual pelanggan */
router.post("/", async (req, res, next) => {
  try {
    const { email } = emailSchema.parse(req.body);
    const subscriber = await prisma.subscriber.upsert({
      where: { email: email.toLowerCase() },
      update: {},
      create: { email: email.toLowerCase() },
    });
    res.status(201).json({ success: true, data: subscriber });
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ success: false, message: "Email tidak valid" });
    next(e);
  }
});

/** PUT /api/admin/subscribers/:id — ubah email pelanggan */
router.put("/:id", async (req, res, next) => {
  try {
    const { email } = emailSchema.parse(req.body);
    const updated = await prisma.subscriber.update({
      where: { id: req.params.id },
      data: { email: email.toLowerCase() },
    });
    res.json({ success: true, data: updated });
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ success: false, message: "Email tidak valid" });
    next(e);
  }
});

/** DELETE /api/admin/subscribers/:id — hapus pelanggan */
router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.subscriber.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Pelanggan berhasil dihapus" });
  } catch (e) { next(e); }
});

export default router;
export { publicRouter };
