// Controller kategori layanan.
import asyncHandler from "../../utils/async-handler.js";
import { sendSuccess } from "../../utils/response.js";
import * as service from "./service.js";

export const list = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await service.listServiceCategories(req.query) });
});

export const detail = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await service.getServiceCategory(req.params.id) });
});

export const create = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await service.createServiceCategory(req.body), status: 201 });
});

export const update = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await service.updateServiceCategory(req.params.id, req.body) });
});

export const remove = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await service.deleteServiceCategory(req.params.id) });
});

export const reorder = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await service.reorderServiceCategories(req.body.ids) });
});

export const publicList = asyncHandler(async (_req, res) => {
  sendSuccess(res, { data: await service.listPublicServiceCategories() });
});
