// Logika bisnis services
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error.js";
import { slugifyUnique } from "../../utils/slugify.js";
import { paginate, paginationMeta } from "../../utils/paginate.js";

// Daftar layanan (admin): urutan tampil, paginasi + search judul
export async function listServices(query) {
  const { page, limit, skip, where } = paginate(query, { searchFields: ["title"], defaultLimit: 50 });

  const [rows, total] = await prisma.$transaction([
    prisma.service.findMany({ where, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], skip, take: limit }),
    prisma.service.count({ where }),
  ]);

  return { data: rows, meta: paginationMeta(total, page, limit) };
}

// Detail layanan
export async function getService(id) {
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) throw new ApiError(404, "Layanan tidak ditemukan");
  return service;
}

// Buat layanan — slug otomatis; urutan default = paling akhir
export async function createService({ ...payload }) {
  const slug = await slugifyUnique({ model: "service", text: payload.title });
  if (payload.sortOrder === undefined) {
    const last = await prisma.service.aggregate({ _max: { sortOrder: true } });
    payload.sortOrder = (last._max.sortOrder ?? -1) + 1;
  }
  return prisma.service.create({ data: { ...payload, slug } });
}

// Update layanan — judul baru memicu slug baru
export async function updateService(id, { ...payload }) {
  await getService(id);

  const data = { ...payload };
  if (payload.title) data.slug = await slugifyUnique({ model: "service", text: payload.title, excludeId: id });

  return prisma.service.update({ where: { id }, data });
}

// Hapus layanan
export async function deleteService(id) {
  await getService(id);
  await prisma.service.delete({ where: { id } });
  return { message: "Layanan berhasil dihapus" };
}

/*
 * Reorder: menerima urutan id hasil tombol naik/turun di UI.
 * sortOrder baru = posisi index array; id yang tidak tercantum tidak berubah.
 */
export async function reorderServices(ids) {
  await prisma.$transaction(
    ids.map((id, index) => prisma.service.update({ where: { id }, data: { sortOrder: index } }))
  );
  return { message: "Urutan layanan diperbarui" };
}
