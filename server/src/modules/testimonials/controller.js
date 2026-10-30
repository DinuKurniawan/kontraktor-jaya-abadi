// Controller testimonials
import asyncHandler from "../../utils/async-handler.js";
import { sendSuccess } from "../../utils/response.js";
import * as testimonialService from "./service.js";

export const list = asyncHandler(async (req, res) => {
  const { data, meta } = await testimonialService.listTestimonials(req.query);
  sendSuccess(res, { data, meta });
});

export const detail = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await testimonialService.getTestimonial(req.params.id) });
});

export const create = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await testimonialService.createTestimonial(req.body), status: 201 });
});

export const update = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await testimonialService.updateTestimonial(req.params.id, req.body) });
});

export const remove = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await testimonialService.deleteTestimonial(req.params.id) });
});

export const publish = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await testimonialService.togglePublish(req.params.id) });
});
