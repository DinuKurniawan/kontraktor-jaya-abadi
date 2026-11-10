// Controller messages — admin + publik
import asyncHandler from "../../utils/async-handler.js";
import { sendSuccess } from "../../utils/response.js";
import * as messageService from "./service.js";

// ===== Admin =====

// PATCH /api/admin/messages/:id/read  body { isRead: boolean } — default true
export const setRead = asyncHandler(async (req, res) => {
  const isRead = req.body?.isRead !== false;
  sendSuccess(res, { data: await messageService.setRead(req.params.id, isRead) });
});

export const remove = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await messageService.deleteMessage(req.params.id) });
});

// GET /api/admin/messages
export const list = asyncHandler(async (req, res) => {
  const { data, meta } = await messageService.listMessages(req.query);
  sendSuccess(res, { data, meta });
});

// GET /api/admin/messages/:id — otomatis tandai dibaca
export const detail = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await messageService.getMessage(req.params.id) });
});

// GET /api/admin/messages/unread-count
export const unreadCount = asyncHandler(async (_req, res) => {
  sendSuccess(res, { data: { count: await messageService.unreadCount() } });
});

export const updateAdminFields = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await messageService.updateAdminFields(req.params.id, req.body) });
});

export const exportCsv = asyncHandler(async (req, res) => {
  const rows = await messageService.exportMessages(req.query);
  const columns = ["ticketCode", "name", "email", "phone", "subject", "status", "budgetRange", "service", "projectLocation", "projectArea", "preferredContact", "preferredTime", "attachments", "source", "isRead", "createdAt"];
  const escape = (value) => `"${String(value ?? "").replaceAll("\"", "\"\"")}"`;
  const lines = rows.map((row) => [row.ticketCode, row.name, row.email, row.phone, row.subject, row.status, row.budgetRange, row.service?.title, row.projectLocation, row.projectArea, row.preferredContact, row.preferredTime, Array.isArray(row.attachments) ? row.attachments.join(" | ") : row.attachments, row.source, row.isRead ? "ya" : "belum", row.createdAt?.toISOString()].map(escape).join(","));
  res.status(200).type("text/csv").set("Content-Disposition", "attachment; filename=pesan-jaya-abadi.csv").send(`\uFEFF${columns.map(escape).join(",")}\r\n${lines.join("\r\n")}`);
});

// ===== Publik =====

// POST /api/public/messages — form kontak (honeypot "website" harus kosong)
export const publicCreate = asyncHandler(async (req, res) => {
  // Honeypot terisi = bot → balas sukses palsu agar bot tidak belajar
  if (req.body?.website) return sendSuccess(res, { data: { message: "Pesan terkirim", ticketCode: null }, status: 201 });
  const message = await messageService.createMessage(req.body);
  sendSuccess(res, { data: { message: "Pesan terkirim", ticketCode: message.ticketCode }, status: 201 });
});

// POST /api/public/messages/attachments — file kontak publik, tanpa record Media admin
export const publicAttachments = asyncHandler(async (req, res) => {
  const files = req.files ?? [];
  if (!files.length) return sendSuccess(res, { data: { attachments: [] }, status: 201 });

  const attachments = await messageService.saveAttachments(files);
  sendSuccess(res, { data: { attachments }, status: 201 });
});
