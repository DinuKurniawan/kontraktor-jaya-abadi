// Controller categories
import asyncHandler from "../../utils/async-handler.js";
import { sendSuccess } from "../../utils/response.js";
import * as categoryService from "./service.js";

// ===== Admin =====

// GET /api/admin/categories?page=&limit=&search=&type=
export const list = asyncHandler(async (req, res) => {
  const { data, meta } = await categoryService.listCategories(req.query);
  sendSuccess(res, { data, meta });
});

// GET /api/admin/categories/:id
export const detail = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategory(req.params.id);
  sendSuccess(res, { data: category });
});

// POST /api/admin/categories
export const create = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  sendSuccess(res, { data: category, status: 201 });
});

// PUT /api/admin/categories/:id
export const update = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  sendSuccess(res, { data: category });
});

// DELETE /api/admin/categories/:id
export const remove = asyncHandler(async (req, res) => {
  const result = await categoryService.deleteCategory(req.params.id);
  sendSuccess(res, { data: result });
});

// ===== Publik =====

// GET /api/public/categories?type=PROJECT
export const publicList = asyncHandler(async (req, res) => {
  const categories = await categoryService.listPublicCategories(req.query.type);
  sendSuccess(res, { data: categories });
});
