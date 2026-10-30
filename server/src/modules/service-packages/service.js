// Logika bisnis service-packages (paket harga per layanan)
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error.js";
import { paginate, paginationMeta } from "../../utils/paginate.js";

const MODEL = () => prisma.servicePackage;

export async function listPackages(query) {
  const { page, limit, skip, where } = paginate(query, { searchFields: ["name"], defaultLimit: 50 });
  if (query.serviceId) where.serviceId = query.serviceId;

  const [rows, total] = await prisma.$transaction([
    MODEL().findMany({ where, orderBy: [{ sortOrder: "asc" }, { id: "asc" }], skip, take: limit }),
    MODEL().count({ where }),
  ]);
  return { data: rows, meta: paginationMeta(total, page, limit) };
}

export async function getPackage(id) {
  const row = await MODEL().findUnique({ where: { id } });
  if (!row) throw new ApiError(404, "Paket layanan tidak ditemukan");
  return row;
}

export async function createPackage(payload) {
  if (payload.sortOrder === undefined) {
    const last = await MODEL().aggregate({ _max: { sortOrder: true } });
    payload.sortOrder = (last._max.sortOrder ?? -1) + 1;
  }
  return MODEL().create({ data: payload });
}

export async function updatePackage(id, payload) {
  await getPackage(id);
  return MODEL().update({ where: { id }, data: payload });
}

export async function deletePackage(id) {
  await getPackage(id);
  await MODEL().delete({ where: { id } });
  return { message: "Paket layanan berhasil dihapus" };
}

export async function reorderPackages(ids) {
  await prisma.$transaction(ids.map((id, index) => MODEL().update({ where: { id }, data: { sortOrder: index } })));
  return { message: "Urutan paket layanan diperbarui" };
}

// GET /api/public/service-packages?serviceId= — hanya terbit
export async function listPublicPackages(serviceId) {
  return MODEL().findMany({
    where: { isPublished: true, ...(serviceId ? { serviceId } : {}) },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
}
