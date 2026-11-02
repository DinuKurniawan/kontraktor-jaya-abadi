// Controller cabang publik.
import asyncHandler from "../../utils/async-handler.js";
import { sendSuccess } from "../../utils/response.js";
import * as adminBranchService from "./admin-service.js";
import * as branchService from "./service.js";

export const publicList = asyncHandler(async (_req, res) => {
  sendSuccess(res, { data: await branchService.listPublicBranches() });
});

export const list = asyncHandler(async (req, res) => {
  const { data, meta } = await adminBranchService.listBranches(req.query);
  sendSuccess(res, { data, meta });
});

export const detail = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await adminBranchService.getBranch(req.params.id) });
});

export const create = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await adminBranchService.createBranch(req.body), status: 201 });
});

export const update = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await adminBranchService.updateBranch(req.params.id, req.body) });
});

export const remove = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await adminBranchService.deleteBranch(req.params.id) });
});
