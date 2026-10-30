// Logika bisnis service-scopes (ruang lingkup per layanan)
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error.js";
import { paginate, paginationMeta } from "../../utils/paginate.js";

const MODEL = () => prisma.serviceScope;

export async function listScopes(query) {
  const { page, limit, skip, where } = paginate(query, { searchFields: ["title"], defaultLimit: 50 });
  if (query.serviceId) where.serviceId = query.serviceId;

  const [rows, total] = await prisma.$transaction([
    MODEL().findMany({ where, orderBy: [{ sortOrder: "asc" }, { id: "asc" }], skip, take: limit }),
    MODEL().count({ where }),
  ]);
  return { data: rows, meta: paginationMeta(total, page, limit) };
}

export async function getScope(id) {
  const row = await MODEL().findUnique({ where: { id } });
  if (!row) throw new ApiError(404, "Ruang lingkup tidak ditemukan");
  return row;
}

export async function createScope(payload) {
  if (payload.sortOrder === undefined) {
    const last = await MODEL().aggregate({ _max: { sortOrder: true } });
    payload.sortOrder = (last._max.sortOrder ?? -1) + 1;
  }
  return MODEL().create({ data: payload });
}

export async function updateScope(id, payload) {
  await getScope(id);
  return MODEL().update({ where: { id }, data: payload });
}

// Hapus sederhana — milik layanan, tidak memblokir apa pun
export async function deleteScope(id) {
  await getScope(id);
  await MODEL().delete({ where: { id } });
  return { message: "Ruang lingkup berhasil dihapus" };
}

export async function reorderScopes(ids) {
  await prisma.$transaction(ids.map((id, index) => MODEL().update({ where: { id }, data: { sortOrder: index } })));
  return { message: "Urutan ruang lingkup diperbarui" };
}
