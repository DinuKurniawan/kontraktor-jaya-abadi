// Controller services
import asyncHandler from "../../utils/async-handler.js";
import { sendSuccess } from "../../utils/response.js";
import * as serviceService from "./service.js";

// GET /api/admin/services?page=&limit=&search=
export const list = asyncHandler(async (req, res) => {
  const { data, meta } = await serviceService.listServices(req.query);
  sendSuccess(res, { data, meta });
});

// PATCH /api/admin/services/reorder — simpan urutan baru (sebelum /:id agar tak tertelan)
export const reorder = asyncHandler(async (req, res) => {
  const result = await serviceService.reorderServices(req.body.ids);
  sendSuccess(res, { data: result });
});

// GET /api/admin/services/:id
export const detail = asyncHandler(async (req, res) => {
  const service = await serviceService.getService(req.params.id);
  sendSuccess(res, { data: service });
});

// POST /api/admin/services
export const create = asyncHandler(async (req, res) => {
  const service = await serviceService.createService(req.body);
  sendSuccess(res, { data: service, status: 201 });
});

// PUT /api/admin/services/:id
export const update = asyncHandler(async (req, res) => {
  const service = await serviceService.updateService(req.params.id, req.body);
  sendSuccess(res, { data: service });
});

// DELETE /api/admin/services/:id
export const remove = asyncHandler(async (req, res) => {
  const result = await serviceService.deleteService(req.params.id);
  sendSuccess(res, { data: result });
});
