// Controller users — semua endpoint khusus SUPER_ADMIN (dicek di route)
import asyncHandler from "../../utils/async-handler.js";
import { sendSuccess } from "../../utils/response.js";
import * as userService from "./service.js";

// GET /api/users?page=&limit=&search=
export const list = asyncHandler(async (req, res) => {
  const { data, meta } = await userService.listUsers(req.query);
  sendSuccess(res, { data, meta });
});

// POST /api/users
export const create = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);
  sendSuccess(res, { data: user, status: 201 });
});

// PUT /api/users/:id
export const update = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  sendSuccess(res, { data: user });
});

// PATCH /api/users/:id/toggle-status
export const toggle = asyncHandler(async (req, res) => {
  const user = await userService.toggleActive(req.params.id);
  sendSuccess(res, { data: user });
});

// DELETE /api/users/:id
export const remove = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id, req.user.id);
  sendSuccess(res, { data: { message: "User berhasil dihapus" } });
});
