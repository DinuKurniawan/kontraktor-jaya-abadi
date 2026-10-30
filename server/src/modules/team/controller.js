// Controller team members
import asyncHandler from "../../utils/async-handler.js";
import { sendSuccess } from "../../utils/response.js";
import * as teamService from "./service.js";

export const list = asyncHandler(async (req, res) => {
  const { data, meta } = await teamService.listMembers(req.query);
  sendSuccess(res, { data, meta });
});

// PATCH /reorder — simpan urutan baru (sebelum /:id)
export const reorder = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await teamService.reorderMembers(req.body.ids) });
});

export const detail = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await teamService.getMember(req.params.id) });
});

export const create = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await teamService.createMember(req.body), status: 201 });
});

export const update = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await teamService.updateMember(req.params.id, req.body) });
});

export const remove = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await teamService.deleteMember(req.params.id) });
});
