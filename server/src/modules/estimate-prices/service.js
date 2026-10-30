// Harga estimasi — logika bisnis (tanpa sortOrder: urut harga min)
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error.js";
import { paginate, paginationMeta } from "../../utils/paginate.js";

const MODEL = () => prisma.estimatePrice;
const ORDER = [{ pricePerM2Min: "asc" }];

export async function listItems(query) {
  const { page, limit, skip, where } = paginate(query, { searchFields: ["label"] });
  const [rows, total] = await prisma.$transaction([
    MODEL().findMany({ where, orderBy: ORDER, skip, take: limit }),
    MODEL().count({ where }),
  ]);
  return { data: rows, meta: paginationMeta(total, page, limit) };
}

export async function listPublicItems() {
  return MODEL().findMany({ where: { isPublished: true }, orderBy: ORDER });
}

export async function getItem(id) {
  const row = await MODEL().findUnique({ where: { id } });
  if (!row) throw new ApiError(404, "Harga estimasi tidak ditemukan");
  return row;
}

export async function createItem(payload) {
  return MODEL().create({ data: payload });
}

export async function updateItem(id, payload) {
  await getItem(id);
  return MODEL().update({ where: { id }, data: payload });
}

export async function deleteItem(id) {
  await getItem(id);
  await MODEL().delete({ where: { id } });
  return { message: "Harga estimasi berhasil dihapus" };
}
