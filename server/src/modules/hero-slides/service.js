// Logika bisnis hero-slides — maksimal 5 slide aktif
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error.js";
import { paginate, paginationMeta } from "../../utils/paginate.js";

const MAX_ACTIVE = 5;

// Daftar slide (admin): urutan tampil
export async function listSlides(query) {
  const { page, limit, skip, where } = paginate(query, { searchFields: ["title"], defaultLimit: 50 });
  const [rows, total] = await prisma.$transaction([
    prisma.heroSlide.findMany({ where, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], skip, take: limit }),
    prisma.heroSlide.count({ where }),
  ]);
  return { data: rows, meta: paginationMeta(total, page, limit) };
}

// Daftar slide aktif (publik) — urut tampil, maks 5
export async function listActiveSlides() {
  return prisma.heroSlide.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    take: MAX_ACTIVE,
    select: { id: true, title: true, subtitle: true, image: true, ctaLabel: true, ctaUrl: true },
  });
}

export async function getSlide(id) {
  const slide = await prisma.heroSlide.findUnique({ where: { id } });
  if (!slide) throw new ApiError(404, "Slide tidak ditemukan");
  return slide;
}

// Batasi jumlah slide aktif saat create/update
async function assertActiveQuota(willBeActive, excludeId = null) {
  if (!willBeActive) return;
  const activeCount = await prisma.heroSlide.count({ where: { isActive: true, ...(excludeId ? { id: { not: excludeId } } : {}) } });
  if (activeCount >= MAX_ACTIVE) throw new ApiError(400, `Maksimal ${MAX_ACTIVE} slide aktif — nonaktifkan salah satu terlebih dahulu`);
}

export async function createSlide({ ...payload }) {
  await assertActiveQuota(payload.isActive === true);
  if (payload.sortOrder === undefined) {
    const last = await prisma.heroSlide.aggregate({ _max: { sortOrder: true } });
    payload.sortOrder = (last._max.sortOrder ?? -1) + 1;
  }
  return prisma.heroSlide.create({ data: payload });
}

export async function updateSlide(id, { ...payload }) {
  const current = await getSlide(id);
  const willBeActive = payload.isActive ?? current.isActive;
  if (willBeActive && !current.isActive) await assertActiveQuota(true, id);

  const data = { ...payload };

  return prisma.heroSlide.update({ where: { id }, data });
}

export async function deleteSlide(id) {
  await getSlide(id);
  await prisma.heroSlide.delete({ where: { id } });
  return { message: "Slide berhasil dihapus" };
}
