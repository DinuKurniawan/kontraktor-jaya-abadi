// Controller settings
import asyncHandler from "../../utils/async-handler.js";
import { sendSuccess } from "../../utils/response.js";
import * as settingsService from "./service.js";

// GET /api/admin/settings — semua settings sebagai objek
export const list = asyncHandler(async (_req, res) => {
  sendSuccess(res, { data: await settingsService.getAllSettings() });
});

// PUT /api/admin/settings — upsert banyak key sekaligus
export const upsert = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await settingsService.upsertSettings(req.body) });
});

// GET /api/public/settings — tanpa informasi sensitif (filter key internal)
export const publicList = asyncHandler(async (_req, res) => {
  const all = await settingsService.getAllSettings();
  delete all.smtp_password; // ponytail: filter manual — tambahkan key sensitif lain di sini saat ada
  sendSuccess(res, { data: all });
});
