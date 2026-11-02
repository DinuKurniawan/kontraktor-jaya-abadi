// Logika bisnis projects
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error.js";
import { slugifyUnique } from "../../utils/slugify.js";
import { paginate, paginationMeta } from "../../utils/paginate.js";

// Relasi standar untuk detail
const INCLUDE = {
  category: { select: { id: true, name: true, slug: true } },
  images: { orderBy: { sortOrder: "asc" } },
};

// Daftar proyek (admin): paginasi + search judul/klien + filter status/kategori
export async function listProjects(query) {
  const { page, limit, skip, where } = paginate(query, { searchFields: ["title", "clientName"] });
  if (query.status) where.status = query.status;
  if (query.categoryId) where.categoryId = query.categoryId;

  const [rows, total] = await prisma.$transaction([
    prisma.project.findMany({ where, include: { category: { select: { name: true } } }, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.project.count({ where }),
  ]);

  return { data: rows, meta: paginationMeta(total, page, limit) };
}

// Detail proyek + galeri
export async function getProject(id) {
  const project = await prisma.project.findUnique({ where: { id }, include: INCLUDE });
  if (!project) throw new ApiError(404, "Proyek tidak ditemukan");
  return project;
}

// Susun data galeri untuk nested write (urutan = urutan array)
function imagesData(images = []) {
  return {
    deleteMany: {},
    create: images.map((img, i) => ({ url: img.url, caption: img.caption ?? null, sortOrder: i })),
  };
}

// Buat proyek — slug otomatis dari judul
export async function createProject({ images, ...payload }) {
  const slug = await slugifyUnique({ model: "project", text: payload.title });
  const data = { ...payload, slug };
  if (images) {
    data.images = { create: images.map((img, i) => ({ url: img.url, caption: img.caption ?? null, sortOrder: i })) };
  }
  return prisma.project.create({ data, include: INCLUDE });
}

// Update proyek — judul baru memicu slug baru; galeri diganti penuh
export async function updateProject(id, { images, ...payload }) {
  await getProject(id);

  const data = { ...payload };
  if (payload.title) data.slug = await slugifyUnique({ model: "project", text: payload.title, excludeId: id });
  if (images) data.images = imagesData(images);

  return prisma.project.update({ where: { id }, data, include: INCLUDE });
}

// Hapus proyek (galeri ikut terhapus via onDelete: Cascade)
export async function deleteProject(id) {
  await getProject(id);
  await prisma.project.delete({ where: { id } });
  return { message: "Proyek berhasil dihapus" };
}

// Toggle publish / featured — pola sama, beda field
async function toggleFlag(id, field) {
  const project = await getProject(id);
  return prisma.project.update({ where: { id }, data: { [field]: !project[field] }, include: INCLUDE });
}

export const togglePublish = (id) => toggleFlag(id, "isPublished");
export const toggleFeatured = (id) => toggleFlag(id, "isFeatured");

// Aksi massal: publish / unpublish / delete banyak
export async function bulkAction({ action, ids }) {
  if (!Array.isArray(ids) || ids.length === 0) throw new ApiError(400, "Pilih minimal satu proyek");
  if (action === "delete") {
    const res = await prisma.project.deleteMany({ where: { id: { in: ids } } });
    return { message: `${res.count} proyek dihapus`, count: res.count };
  }
  if (action === "publish" || action === "unpublish") {
    const res = await prisma.project.updateMany({ where: { id: { in: ids } }, data: { isPublished: action === "publish" } });
    return { message: `${res.count} proyek di${action === "publish" ? "publikasikan" : "tarik (draft)"}`, count: res.count };
  }
  throw new ApiError(400, "Aksi tidak dikenal");
}
