// Logika bisnis messages
import crypto from "node:crypto";
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error.js";
import { paginate, paginationMeta } from "../../utils/paginate.js";
import { emitChange } from "../../lib/events.js";
import { ALLOWED_TYPES } from "./upload.js";
import { publicStorageUrl, storage } from "../../config/supabase.js";

const BUDGET_RANGE_TO_PRISMA = {
  KURANG_100JT: "KURANG_100JT",
  "100_500JT": "RANGE_100_500JT",
  "500JT_1M": "RANGE_500JT_1M",
  "1M_5M": "RANGE_1M_5M",
  LEBIH_5M: "LEBIH_5M",
  BELUM_TAHU: "BELUM_TAHU",
};
const BUDGET_RANGE_FROM_PRISMA = Object.fromEntries(Object.entries(BUDGET_RANGE_TO_PRISMA).map(([key, value]) => [value, key]));

async function generateTicketCode() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
    const ticketCode = `JA-${date}-${suffix}`;
    const exists = await prisma.message.findUnique({ where: { ticketCode }, select: { id: true } });
    if (!exists) return ticketCode;
  }
  throw new ApiError(500, "Tidak dapat membuat kode tiket, coba lagi");
}

// Hitung pesan belum dibaca (untuk badge sidebar)
export async function unreadCount() {
  return prisma.message.count({ where: { isRead: false } });
}

function buildWhere(query = {}) {
  const { where } = paginate(query, { searchFields: ["name", "subject", "email", "ticketCode"] });
  if (query.unread === "true") where.isRead = false;
  if (query.status) where.status = query.status;
  if (query.serviceId) where.serviceId = query.serviceId;
  if (query.budgetRange) where.budgetRange = BUDGET_RANGE_TO_PRISMA[query.budgetRange];
  if (query.dateFrom || query.dateTo) {
    where.createdAt = {};
    if (query.dateFrom) where.createdAt.gte = new Date(`${query.dateFrom}T00:00:00.000`);
    if (query.dateTo) {
      const end = new Date(`${query.dateTo}T00:00:00.000`);
      end.setDate(end.getDate() + 1);
      where.createdAt.lt = end;
    }
  }
  return where;
}

function normalizeMessage(message) {
  if (!message) return message;
  return { ...message, budgetRange: BUDGET_RANGE_FROM_PRISMA[message.budgetRange] ?? message.budgetRange };
}

// Daftar pesan (admin): paginasi + filter status, layanan, anggaran, tanggal, dan pencarian.
export async function listMessages(query) {
  const { page, limit, skip } = paginate(query, { searchFields: ["name", "subject", "email", "ticketCode"] });
  const where = buildWhere(query);

  const [rows, total] = await prisma.$transaction([
    prisma.message.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit, select: { id: true, name: true, email: true, phone: true, subject: true, body: true, ticketCode: true, status: true, budgetRange: true, projectLocation: true, service: { select: { id: true, title: true } }, isRead: true, createdAt: true } }),
    prisma.message.count({ where }),
  ]);

  return { data: rows.map(normalizeMessage), meta: paginationMeta(total, page, limit) };
}

export async function exportMessages(query) {
  const rows = await prisma.message.findMany({
    where: buildWhere(query),
    orderBy: { createdAt: "desc" },
    select: { ticketCode: true, name: true, email: true, phone: true, subject: true, status: true, budgetRange: true, projectLocation: true, projectArea: true, preferredContact: true, preferredTime: true, attachments: true, source: true, isRead: true, createdAt: true, service: { select: { title: true } } },
  });
  return rows.map(normalizeMessage);
}

// Detail pesan — efek samping: otomatis tandai sudah dibaca
export async function getMessage(id) {
  const message = await prisma.message.findUnique({ where: { id }, include: { service: { select: { id: true, title: true } } } });
  if (!message) throw new ApiError(404, "Pesan tidak ditemukan");

  if (!message.isRead) {
    await prisma.message.update({ where: { id }, data: { isRead: true } });
    message.isRead = true;
    // GET detail tidak melewati broadcaster; pancarkan perubahan read secara eksplisit.
    emitChange("messages", "patch", { id, isRead: true });
  }
  return normalizeMessage(message);
}

// Tandai dibaca / belum dibaca
export async function setRead(id, isRead) {
  const message = await prisma.message.findUnique({ where: { id }, select: { id: true } });
  if (!message) throw new ApiError(404, "Pesan tidak ditemukan");
  const updated = await prisma.message.update({ where: { id }, data: { isRead } });
  // Endpoint PATCH juga dipancarkan middleware; detail ini menjaga pemanggilan service internal tetap realtime.
  return updated;
}

export async function updateAdminFields(id, payload) {
  await getMessage(id);
  return normalizeMessage(await prisma.message.update({ where: { id }, data: payload, include: { service: { select: { id: true, title: true } } } }));
}

export async function deleteMessage(id) {
  const message = await prisma.message.findUnique({ where: { id }, select: { id: true } });
  if (!message) throw new ApiError(404, "Pesan tidak ditemukan");
  await prisma.message.delete({ where: { id } });
  return { message: "Pesan berhasil dihapus" };
}

export async function saveAttachments(files) {
  if (!files || files.length === 0) return [];
  const bucket = storage();
  const urls = [];
  const uploaded = [];

  try {
    for (const file of files) {
      const ext = ALLOWED_TYPES[file.mimetype] || ".bin";
      const objectPath = `messages/${crypto.randomUUID()}${ext}`;
      const { error } = await bucket.upload(objectPath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: "31536000",
        upsert: false,
      });
      if (error) throw new ApiError(502, `Gagal mengunggah lampiran: ${error.message}`);
      uploaded.push(objectPath);
      urls.push(publicStorageUrl(objectPath));
    }
    return urls;
  } catch (error) {
    if (uploaded.length) {
      try { await bucket.remove(uploaded); } catch { /* best effort cleanup */ }
    }
    throw error;
  }
}

// Pesan masuk dari form kontak publik (email/subject opsional dari CTA singkat)
export async function createMessage({
  name,
  email = "",
  phone,
  subject = "Pesan Situs",
  body,
  serviceId,
  budgetRange,
  projectLocation,
  projectArea,
  startEstimate,
  preferredContact = "WHATSAPP",
  preferredTime = "BEBAS",
  attachments = [],
  source = "website",
}) {
  if (serviceId) {
    const service = await prisma.service.findUnique({ where: { id: serviceId }, select: { id: true } });
    if (!service) throw new ApiError(400, "Layanan tidak ditemukan");
  }

  const message = await prisma.message.create({
    data: {
      name,
      email,
      phone,
      subject,
      body,
      serviceId: serviceId || undefined,
      budgetRange: budgetRange ? BUDGET_RANGE_TO_PRISMA[budgetRange] : undefined,
      projectLocation: projectLocation || undefined,
      projectArea: projectArea ?? undefined,
      startEstimate: startEstimate || undefined,
      preferredContact,
      preferredTime,
      attachments,
      ticketCode: await generateTicketCode(),
      source: source || "website",
    },
  });
  return message;
}
