// Controller hero-slides
import asyncHandler from "../../utils/async-handler.js";
import { sendSuccess } from "../../utils/response.js";
import * as heroService from "./service.js";

export const list = asyncHandler(async (req, res) => {
  const { data, meta } = await heroService.listSlides(req.query);
  sendSuccess(res, { data, meta });
});

export const detail = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await heroService.getSlide(req.params.id) });
});

// GET /api/public/hero-slides — slide aktif untuk beranda (tanpa login)
export const publicList = asyncHandler(async (_req, res) => {
  sendSuccess(res, { data: await heroService.listActiveSlides() });
});

export const create = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await heroService.createSlide(req.body), status: 201 });
});

export const update = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await heroService.updateSlide(req.params.id, req.body) });
});

export const remove = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await heroService.deleteSlide(req.params.id) });
});
