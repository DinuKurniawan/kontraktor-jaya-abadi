// Logika bisnis team members
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error.js";
import { paginate, paginationMeta } from "../../utils/paginate.js";

export async function listMembers(query) {
  const { page, limit, skip, where } = paginate(query, { searchFields: ["name", "position"] });
  const [rows, total] = await prisma.$transaction([
    prisma.teamMember.findMany({ where, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], skip, take: limit }),
    prisma.teamMember.count({ where }),
  ]);
  return { data: rows, meta: paginationMeta(total, page, limit) };
}

export async function getMember(id) {
  const member = await prisma.teamMember.findUnique({ where: { id } });
  if (!member) throw new ApiError(404, "Anggota tim tidak ditemukan");
  return member;
}

export async function createMember(payload) {
  if (payload.sortOrder === undefined) {
    const last = await prisma.teamMember.aggregate({ _max: { sortOrder: true } });
    payload.sortOrder = (last._max.sortOrder ?? -1) + 1;
  }
  return prisma.teamMember.create({ data: payload });
}

export async function updateMember(id, payload) {
  await getMember(id);
  return prisma.teamMember.update({ where: { id }, data: payload });
}

export async function deleteMember(id) {
  await getMember(id);
  await prisma.teamMember.delete({ where: { id } });
  return { message: "Anggota tim berhasil dihapus" };
}

// Reorder seperti layanan: sortOrder = posisi index array
export async function reorderMembers(ids) {
  await prisma.$transaction(
    ids.map((id, index) => prisma.teamMember.update({ where: { id }, data: { sortOrder: index } }))
  );
  return { message: "Urutan tim diperbarui" };
}
