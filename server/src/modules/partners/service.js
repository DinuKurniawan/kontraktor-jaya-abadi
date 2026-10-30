// Mitra — logika bisnis
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error.js";
import { paginate, paginationMeta } from "../../utils/paginate.js";

const MODEL = () => prisma.partner;

export async function listPartners(query) {
  const { page, limit, skip, where } = paginate(query, { searchFields: ["name"] });
  const [rows, total] = await prisma.$transaction([
    MODEL().findMany({ where, orderBy: [{ sortOrder: "asc" }, { id: "asc" }], skip, take: limit }),
    MODEL().count({ where }),
  ]);
  return { data: rows, meta: paginationMeta(total, page, limit) };
}

export async function listPublicPartners() {
  return MODEL().findMany({ where: { isPublished: true }, orderBy: { sortOrder: "asc" } });
}

export async function getPartner(id) {
  const row = await MODEL().findUnique({ where: { id } });
  if (!row) throw new ApiError(404, "Mitra tidak ditemukan");
  return row;
}

export async function createPartner(payload) {
  if (payload.sortOrder === undefined) {
    const last = await MODEL().aggregate({ _max: { sortOrder: true } });
    payload.sortOrder = (last._max.sortOrder ?? -1) + 1;
  }
  return MODEL().create({ data: payload });
}

export async function updatePartner(id, payload) {
  await getPartner(id);
  return MODEL().update({ where: { id }, data: payload });
}

export async function deletePartner(id) {
  await getPartner(id);
  await MODEL().delete({ where: { id } });
  return { message: "Mitra berhasil dihapus" };
}

export async function reorderPartners(ids) {
  await prisma.$transaction(ids.map((id, index) => MODEL().update({ where: { id }, data: { sortOrder: index } })));
  return { message: "Urutan mitra diperbarui" };
}
