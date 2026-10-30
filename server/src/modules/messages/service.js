// Logika bisnis messages
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error.js";
import { paginate, paginationMeta } from "../../utils/paginate.js";

// Hitung pesan belum dibaca (untuk badge sidebar)
export async function unreadCount() {
  return prisma.message.count({ where: { isRead: false } });
}

// Daftar pesan (admin): paginasi + filter belum dibaca
export async function listMessages(query) {
  const { page, limit, skip, where } = paginate(query, { searchFields: ["name", "subject", "email"] });
  if (query.unread === "true") where.isRead = false;

  const [rows, total] = await prisma.$transaction([
    prisma.message.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit, select: { id: true, name: true, email: true, phone: true, subject: true, isRead: true, createdAt: true } }),
    prisma.message.count({ where }),
  ]);

  return { data: rows, meta: paginationMeta(total, page, limit) };
}

// Detail pesan — efek samping: otomatis tandai sudah dibaca
export async function getMessage(id) {
  const message = await prisma.message.findUnique({ where: { id } });
  if (!message) throw new ApiError(404, "Pesan tidak ditemukan");

  if (!message.isRead) {
    await prisma.message.update({ where: { id }, data: { isRead: true } });
    message.isRead = true;
  }
  return message;
}

// Tandai dibaca / belum dibaca
export async function setRead(id, isRead) {
  const message = await prisma.message.findUnique({ where: { id }, select: { id: true } });
  if (!message) throw new ApiError(404, "Pesan tidak ditemukan");
  return prisma.message.update({ where: { id }, data: { isRead } });
}

export async function deleteMessage(id) {
  const message = await prisma.message.findUnique({ where: { id }, select: { id: true } });
  if (!message) throw new ApiError(404, "Pesan tidak ditemukan");
  await prisma.message.delete({ where: { id } });
  return { message: "Pesan berhasil dihapus" };
}

// Pesan masuk dari form kontak publik (email/subject opsional dari CTA singkat)
export async function createMessage({ name, email = "", phone, subject = "Pesan Situs", body }) {
  return prisma.message.create({ data: { name, email, phone, subject, body } });
}
