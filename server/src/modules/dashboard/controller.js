// Controller dashboard
import asyncHandler from "../../utils/async-handler.js";
import { sendSuccess } from "../../utils/response.js";
import * as dashboardService from "./service.js";

// GET /api/admin/dashboard — statistik ringkas untuk halaman admin
export const stats = asyncHandler(async (_req, res) => {
  const data = await dashboardService.getDashboardData();
  sendSuccess(res, { data });
});
