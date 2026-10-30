// Controller service-scopes
import asyncHandler from "../../utils/async-handler.js";
import { sendSuccess } from "../../utils/response.js";
import * as s from "./service.js";

export const list = asyncHandler(async (req, res) => {
  const { data, meta } = await s.listScopes(req.query);
  sendSuccess(res, { data, meta });
});

export const detail = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await s.getScope(req.params.id) });
});

export const create = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await s.createScope(req.body), status: 201 });
});

export const update = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await s.updateScope(req.params.id, req.body) });
});

export const remove = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await s.deleteScope(req.params.id) });
});

export const reorder = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await s.reorderScopes(req.body.ids) });
});
