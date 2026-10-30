// Controller faq
import asyncHandler from "../../utils/async-handler.js";
import { sendSuccess } from "../../utils/response.js";
import * as s from "./service.js";

export const list = asyncHandler(async (req, res) => {
  const { data, meta } = await s.listItems(req.query);
  sendSuccess(res, { data, meta });
});

export const reorder = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await s.reorderItems(req.body.ids) });
});

export const detail = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await s.getItem(req.params.id) });
});

export const create = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await s.createItem(req.body), status: 201 });
});

export const update = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await s.updateItem(req.params.id, req.body) });
});

export const remove = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await s.deleteItem(req.params.id) });
});

// GET /api/public/faqs
export const publicList = asyncHandler(async (_req, res) => {
  sendSuccess(res, { data: await s.listPublicItems() });
});
