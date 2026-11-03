// Controller media
import asyncHandler from "../../utils/async-handler.js";
import { sendSuccess } from "../../utils/response.js";
import * as mediaService from "./service.js";

// POST /api/media/upload (multipart field "files")
export const upload = asyncHandler(async (req, res) => {
  const media = await mediaService.saveFiles(req.files);
  sendSuccess(res, { data: media, status: 201 });
});

// GET /api/media?page=&limit=&search=
export const list = asyncHandler(async (req, res) => {
  const { data, meta } = await mediaService.listMedia(req.query);
  sendSuccess(res, { data, meta });
});

// DELETE /api/media/:id
export const remove = asyncHandler(async (req, res) => {
  const result = await mediaService.deleteMedia(req.params.id);
  sendSuccess(res, { data: result });
});

// GET /api/media/:id/usage
export const usage = asyncHandler(async (req, res) => {
  const data = await mediaService.getMediaUsageById(req.params.id);
  sendSuccess(res, { data });
});

// POST /api/media/bulk-delete
export const bulkRemove = asyncHandler(async (req, res) => {
  const data = await mediaService.bulkDeleteMedia(req.body.ids);
  sendSuccess(res, { data });
});

// GET /api/media/broken
export const listBroken = asyncHandler(async (_req, res) => {
  const data = await mediaService.listBrokenMedia();
  sendSuccess(res, { data });
});

// POST /api/media/cleanup-broken
export const cleanupBroken = asyncHandler(async (req, res) => {
  const data = await mediaService.cleanupBrokenMedia(req.body.dryRun);
  sendSuccess(res, { data });
});
