// Logika bisnis auth: cek kredensial + ganti password
import prisma from "../../config/prisma.js";
import bcrypt from "bcrypt";
import ApiError from "../../utils/api-error.js";
import { USER_SELECT } from "../users/service.js";

const SALT_ROUNDS = 10;

// Verifikasi email + password, dan pastikan akun aktif
export async function loginUser(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(401, "Email atau password salah");

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new ApiError(401, "Email atau password salah");

  if (!user.isActive) {
    throw new ApiError(403, "Akun telah dinonaktifkan — hubungi super admin");
  }

  const { password: _password, ...safeUser } = user;
  return safeUser;
}

// Ganti password sendiri: validasi password lama dulu
export async function changePassword(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const valid = user && (await bcrypt.compare(currentPassword, user.password));
  if (!valid) throw new ApiError(400, "Password saat ini salah");

  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
}
