// Cabang — CRUD admin dan aturan satu kantor utama.
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error.js";
import { paginate, paginationMeta } from "../../utils/paginate.js";

const ordered = [{ isMain: "desc" }, { sortOrder: "asc" }, { name: "asc" }];

export async function listBranches(query = {}) {
  const { page, limit, skip, where } = paginate(query, { defaultLimit: 12, searchFields: ["name", "city"] });
  const [data, total] = await prisma.$transaction([
    prisma.branch.findMany({ where, orderBy: ordered, skip, take: limit }),
    prisma.branch.count({ where }),
  ]);
  return { data, meta: paginationMeta(total, page, limit) };
}

export async function getBranch(id) {
  const branch = await prisma.branch.findUnique({ where: { id } });
  if (!branch) throw new ApiError(404, "Cabang tidak ditemukan");
  return branch;
}

async function clearMainExcept(tx, id) {
  await tx.branch.updateMany({ where: { isMain: true, ...(id ? { id: { not: id } } : {}) }, data: { isMain: false } });
}

export async function createBranch(payload) {
  return prisma.$transaction(async (tx) => {
    if (payload.isMain) await clearMainExcept(tx);
    return tx.branch.create({ data: { ...payload, isMain: payload.isMain ?? false, isPublished: payload.isPublished ?? true } });
  });
}

export async function updateBranch(id, payload) {
  await getBranch(id);
  return prisma.$transaction(async (tx) => {
    if (payload.isMain) await clearMainExcept(tx, id);
    return tx.branch.update({ where: { id }, data: payload });
  });
}

export async function deleteBranch(id) {
  const branch = await getBranch(id);
  await prisma.branch.delete({ where: { id } });
  return { message: `Cabang ${branch.name} berhasil dihapus` };
}
