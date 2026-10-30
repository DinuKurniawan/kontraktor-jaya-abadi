// CoreValue — logika bisnis
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error.js";
import { paginate, paginationMeta } from "../../utils/paginate.js";

const MODEL = () => prisma.coreValue;

export async function listItems(query) {
  const { page, limit, skip, where } = paginate(query, { searchFields: ["title"] });
  const [rows, total] = await prisma.$transaction([
    MODEL().findMany({ where, orderBy: [{ sortOrder: "asc" }, { id: "asc" }], skip, take: limit }),
    MODEL().count({ where }),
  ]);
  return { data: rows, meta: paginationMeta(total, page, limit) };
}

export async function listPublicItems() {
  return MODEL().findMany({ where: { isPublished: true }, orderBy: { sortOrder: "asc" } });
}

export async function getItem(id) {
  const row = await MODEL().findUnique({ where: { id } });
  if (!row) throw new ApiError(404, "Nilai perusahaan tidak ditemukan");
  return row;
}

export async function createItem(payload) {
  if (payload.sortOrder === undefined) {
    const last = await MODEL().aggregate({ _max: { sortOrder: true } });
    payload.sortOrder = (last._max.sortOrder ?? -1) + 1;
  }
  return MODEL().create({ data: payload });
}

export async function updateItem(id, payload) {
  await getItem(id);
  return MODEL().update({ where: { id }, data: payload });
}

export async function deleteItem(id) {
  await getItem(id);
  await MODEL().delete({ where: { id } });
  return { message: "Nilai perusahaan berhasil dihapus" };
}

export async function reorderItems(ids) {
  await prisma.$transaction(ids.map((id, index) => MODEL().update({ where: { id }, data: { sortOrder: index } })));
  return { message: "Urutan nilai perusahaan diperbarui" };
}
