// Logika bisnis CRUD users — khusus SUPER_ADMIN (dicek di route)
import prisma from "../../config/prisma.js";
import bcrypt from "bcrypt";
import ApiError from "../../utils/api-error.js";
import { paginate, paginationMeta } from "../../utils/paginate.js";

const SALT_ROUNDS = 10;

// Field user yang aman — password tidak pernah dikirim ke klien
export const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

// Daftar user dengan paginasi + pencarian (nama/email)
export async function listUsers(query) {
  const { page, limit, skip, where } = paginate(query, { searchFields: ["name", "email"] });

  const [rows, total] = await prisma.$transaction([
    prisma.user.findMany({ where, select: USER_SELECT, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.user.count({ where }),
  ]);

  return { data: rows, meta: paginationMeta(total, page, limit) };
}

// Buat user baru — cek duplikat email agar pesan errornya jelas
export async function createUser({ password, ...rest }) {
  const exists = await prisma.user.findUnique({ where: { email: rest.email }, select: { id: true } });
  if (exists) throw new ApiError(409, "Email sudah terdaftar");

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  return prisma.user.create({ data: { ...rest, password: hashed }, select: USER_SELECT });
}

// Update user — hash password baru jika dikirim
export async function updateUser(id, { password, ...rest }) {
  if (rest.email) {
    const exists = await prisma.user.findUnique({ where: { email: rest.email }, select: { id: true } });
    if (exists && exists.id !== id) throw new ApiError(409, "Email sudah terdaftar");
  }

  const data = { ...rest };
  if (password) data.password = await bcrypt.hash(password, SALT_ROUNDS);

  return prisma.user.update({ where: { id }, data, select: USER_SELECT });
}

// Aktifkan / nonaktifkan user
export async function toggleActive(id) {
  const user = await prisma.user.findUnique({ where: { id }, select: { isActive: true } });
  if (!user) throw new ApiError(404, "User tidak ditemukan");

  return prisma.user.update({ where: { id }, data: { isActive: !user.isActive }, select: USER_SELECT });
}

// Hapus user — tidak boleh menghapus diri sendiri
export async function deleteUser(id, requesterId) {
  if (id === requesterId) throw new ApiError(400, "Tidak bisa menghapus akun sendiri");
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!user) throw new ApiError(404, "User tidak ditemukan");

  await prisma.user.delete({ where: { id } });
}
