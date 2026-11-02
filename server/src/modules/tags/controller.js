// Controller CRUD tag artikel
import asyncHandler from "../../utils/async-handler.js";
import { sendSuccess } from "../../utils/response.js";
import * as tagService from "./service.js";

export const list = asyncHandler(async (req, res) => {
  const { data, meta } = await tagService.listTags(req.query);
  sendSuccess(res, { data, meta });
});

export const create = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await tagService.createTag(req.body), status: 201 });
});

export const update = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await tagService.updateTag(req.params.id, req.body) });
});

export const remove = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await tagService.deleteTag(req.params.id) });
});
