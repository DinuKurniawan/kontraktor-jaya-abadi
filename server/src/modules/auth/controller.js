// Controller auth — menangani HTTP (cookie, payload) dan memanggil service
import asyncHandler from "../../utils/async-handler.js";
import { sendSuccess } from "../../utils/response.js";
import { TOKEN_COOKIE, cookieOptions, signToken } from "../../config/jwt.js";
import * as authService from "./service.js";

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const user = await authService.loginUser(req.body.email, req.body.password);
  const token = signToken(user);
  res.cookie(TOKEN_COOKIE, token, cookieOptions);
  // Token juga dikirim via meta untuk memudahkan pengetesan (REST client, dsb.)
  sendSuccess(res, { data: user, meta: { token } });
});

// POST /api/auth/logout — hapus cookie sesi
export const logout = asyncHandler(async (req, res) => {
  res.clearCookie(TOKEN_COOKIE, { path: "/" });
  sendSuccess(res, { data: { message: "Berhasil keluar" } });
});

// GET /api/auth/me — profil user yang sedang login (sudah disaring requireAuth)
export const me = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: req.user });
});

// PUT /api/auth/change-password
export const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
  sendSuccess(res, { data: { message: "Password berhasil diubah" } });
});
