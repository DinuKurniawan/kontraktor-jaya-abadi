// Controller mitra
import asyncHandler from "../../utils/async-handler.js";
import { sendSuccess } from "../../utils/response.js";
import * as s from "./service.js";

export const list = asyncHandler(async (req, res) => {
  const { data, meta } = await s.listPartners(req.query);
  sendSuccess(res, { data, meta });
});

export const reorder = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await s.reorderPartners(req.body.ids) });
});

export const detail = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await s.getPartner(req.params.id) });
});

export const create = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await s.createPartner(req.body), status: 201 });
});

export const update = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await s.updatePartner(req.params.id, req.body) });
});

export const remove = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await s.deletePartner(req.params.id) });
});

// GET /api/public/partners
export const publicList = asyncHandler(async (_req, res) => {
  sendSuccess(res, { data: await s.listPublicPartners() });
});
