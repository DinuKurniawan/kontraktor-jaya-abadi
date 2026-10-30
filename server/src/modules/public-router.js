/*
 * Router publik tunggal — dipasang di /api/public (tanpa login)
 *   GET /services            daftar layanan terbit
 *   GET /services/:slug      detail layanan
 *   GET /projects            proyek terbit (paginasi, filter, search)
 *   GET /projects/:slug      detail proyek + terkait
 *   GET /posts               artikel terbit (paginasi, filter, search)
 *   GET /posts/:slug         detail artikel + terkait
 *   GET /testimonials        testimoni terbit
 *   GET /team                tim terbit
 */
import { Router } from "express";
import asyncHandler from "../utils/async-handler.js";
import ApiError from "../utils/api-error.js";
import { sendSuccess } from "../utils/response.js";
import { listPublishedServices, getPublishedService } from "./services/public.js";
import { listPublishedProjects, getPublishedProject } from "./projects/public.js";
import { listPublishedPosts, getPublishedPost } from "./posts/public.js";
import { listPublishedTestimonials, listPublishedTeam, listPublishedFaqs } from "./misc/public.js";

const router = Router();

const plain = (handler) => asyncHandler(async (req, res) => sendSuccess(res, { data: await handler(req) }));

const paged = (fn) => asyncHandler(async (req, res) => {
  const { data, meta } = await fn(req);
  sendSuccess(res, { data, meta });
});

router.get("/services", plain(() => listPublishedServices()));
router.get("/services/:slug", plain((req) =>
  getPublishedService(req.params.slug).then((s) => {
    if (!s) throw new ApiError(404, "Layanan tidak ditemukan");
    return s;
  })
));

router.get("/projects", paged((req) => listPublishedProjects(req.query)));
router.get("/projects/:slug", plain((req) =>
  getPublishedProject(req.params.slug).then((p) => {
    if (!p) throw new ApiError(404, "Proyek tidak ditemukan");
    return p;
  })
));

router.get("/posts", paged((req) => listPublishedPosts(req.query)));
router.get("/posts/:slug", plain((req) =>
  getPublishedPost(req.params.slug).then((p) => {
    if (!p) throw new ApiError(404, "Artikel tidak ditemukan");
    return p;
  })
));

router.get("/testimonials", plain((req) => listPublishedTestimonials(req.query.limit, req.query.serviceId)));
router.get("/faqs", plain((req) => listPublishedFaqs(req.query.serviceId)));
router.get("/team", plain(() => listPublishedTeam()));

export default router;
