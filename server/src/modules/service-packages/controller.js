// Controller service-packages
import asyncHandler from "../../utils/async-handler.js";
import { sendSuccess } from "../../utils/response.js";
import * as s from "./service.js";

export const list = asyncHandler(async (req, res) => {
  const { data, meta } = await s.listPackages(req.query);
  sendSuccess(res, { data, meta });
});

export const detail = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await s.getPackage(req.params.id) });
});

export const create = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await s.createPackage(req.body), status: 201 });
});

export const update = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await s.updatePackage(req.params.id, req.body) });
});

export const remove = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await s.deletePackage(req.params.id) });
});

export const reorder = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await s.reorderPackages(req.body.ids) });
});

// GET /api/public/service-packages?serviceId=
export const publicList = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await s.listPublicPackages(req.query.serviceId) });
});
