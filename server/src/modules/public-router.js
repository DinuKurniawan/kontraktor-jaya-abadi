/*
 * Router publik tunggal — dipasang di /api/public (tanpa login)
 *   GET /services            daftar layanan terbit
 *   GET /services/:slug      detail layanan
 *   GET /projects            proyek terbit (paginasi, filter, search)
 *   GET /projects/:slug      detail proyek + terkait
 *   GET /posts               artikel terbit (paginasi, filter, search)
 *   GET /posts/featured      artikel unggulan
 *   GET /posts/popular       artikel terpopuler
 *   GET /posts/:slug         detail artikel + terkait
 *   GET /tags                tag artikel terbit
 *   GET /testimonials        testimoni terbit
 *   GET /team                tim terbit
 */
import { Router } from "express";
import asyncHandler from "../utils/async-handler.js";
import ApiError from "../utils/api-error.js";
import { sendSuccess } from "../utils/response.js";
import { listPublishedServices, getPublishedService } from "./services/public.js";
import { listPublishedProjects, getPublishedProject, getPublicProjectStats, getPublicProjectMap } from "./projects/public.js";
import { listPublishedPosts, listFeaturedPosts, listPopularPosts, listPublicTags, getPublishedPost } from "./posts/public.js";
import { listPublishedTestimonials, listPublishedTeam, listPublishedFaqs } from "./misc/public.js";

const router = Router();

const plain = (handler) => asyncHandler(async (req, res) => sendSuccess(res, { data: await handler(req) }));

const paged = (fn) => asyncHandler(async (req, res) => {
  const result = await fn(req);
  const { data, meta, ...extra } = result;
  sendSuccess(res, { data, meta, ...extra });
});

router.get("/services", plain(() => listPublishedServices()));
router.get("/services/:slug", plain((req) =>
  getPublishedService(req.params.slug).then((s) => {
    if (!s) throw new ApiError(404, "Layanan tidak ditemukan");
    return s;
  })
));

router.get("/projects/stats", plain(() => getPublicProjectStats()));
router.get("/projects/map", plain((req) => getPublicProjectMap(req.query)));
router.get("/projects", paged((req) => listPublishedProjects(req.query)));
router.get("/projects/:slug", plain((req) =>
  getPublishedProject(req.params.slug).then((p) => {
    if (!p) throw new ApiError(404, "Proyek tidak ditemukan");
    return p;
  })
));

// Route statis harus didefinisikan sebelum /posts/:slug.
router.get("/posts/featured", plain((req) => listFeaturedPosts(req.query)));
router.get("/posts/popular", plain((req) => listPopularPosts(req.query)));
router.get("/posts", paged((req) => listPublishedPosts(req.query)));
router.get("/posts/:slug", plain((req) =>
  getPublishedPost(req.params.slug).then((p) => {
    if (!p) throw new ApiError(404, "Artikel tidak ditemukan");
    return p;
  })
));
router.get("/tags", plain(() => listPublicTags()));

router.get("/testimonials", plain((req) => listPublishedTestimonials(req.query.limit, req.query.serviceId)));
router.get("/faqs", plain((req) => listPublishedFaqs(req.query.serviceId)));
router.get("/team", plain(() => listPublishedTeam()));

export default router;
