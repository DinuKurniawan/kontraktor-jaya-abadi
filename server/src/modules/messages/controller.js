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

// ===== Publik =====

// POST /api/public/messages — form kontak (honeypot "website" harus kosong)
export const publicCreate = asyncHandler(async (req, res) => {
  // Honeypot terisi = bot → balas sukses palsu agar bot tidak belajar
  if (req.body?.website) return sendSuccess(res, { data: { message: "Pesan terkirim" }, status: 201 });
  await messageService.createMessage(req.body);
  sendSuccess(res, { data: { message: "Pesan terkirim" }, status: 201 });
});
