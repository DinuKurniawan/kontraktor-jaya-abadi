// Konfigurasi aplikasi Express — dipasang menuju server.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import authRoutes from "./modules/auth/route.js";
import categoriesRoutes, { publicRouter as categoriesPublicRouter } from "./modules/categories/route.js";
import heroSlidesRoutes, { publicRouter as heroSlidesPublicRouter } from "./modules/hero-slides/route.js";
import postRoutes from "./modules/posts/route.js";
import tagsRoutes from "./modules/tags/route.js";
import testimonialRoutes from "./modules/testimonials/route.js";
import teamRoutes from "./modules/team/route.js";
import messagesRoutes, { publicRouter as messagesPublicRouter } from "./modules/messages/route.js";
import settingsRoutes, { publicRouter as settingsPublicRouter } from "./modules/settings/route.js";
import partnersRoutes, { publicRouter as partnersPublicRouter } from "./modules/partners/route.js";
import certificatesRoutes, { publicRouter as certificatesPublicRouter } from "./modules/certificates/route.js";
import faqsRoutes, { publicRouter as faqsPublicRouter } from "./modules/faqs/route.js";
import featuresRoutes, { publicRouter as featuresPublicRouter } from "./modules/features/route.js";
import processStepsRoutes, { publicRouter as processStepsPublicRouter } from "./modules/process-steps/route.js";
import beforeAfterRoutes, { publicRouter as beforeAfterPublicRouter } from "./modules/before-after/route.js";
import estimatePricesRoutes, { publicRouter as estimatePricesPublicRouter } from "./modules/estimate-prices/route.js";
import subscribersRoutes, { publicRouter as subscribersPublicRouter } from "./modules/subscribers/route.js";
import milestonesRoutes, { publicRouter as milestonesPublicRouter } from "./modules/milestones/route.js";
import coreValuesRoutes, { publicRouter as coreValuesPublicRouter } from "./modules/core-values/route.js";
import galleryRoutes, { publicRouter as galleryPublicRouter } from "./modules/gallery/route.js";
import branchesRoutes, { publicRouter as branchesPublicRouter } from "./modules/branches/route.js";
import publicRoutes from "./modules/public-router.js";
import { sitemap, robots } from "./modules/seo.js";
import dashboardRoutes from "./modules/dashboard/route.js";
import projectsRoutes from "./modules/projects/route.js";
import servicesRoutes from "./modules/services/route.js";
import serviceCategoriesRoutes, { publicRouter as serviceCategoriesPublicRouter } from "./modules/service-categories/route.js";
import serviceScopesRoutes from "./modules/service-scopes/route.js";
import servicePackagesRoutes, { publicRouter as servicePackagesPublicRouter } from "./modules/service-packages/route.js";
import mediaRoutes from "./modules/media/route.js";
import userRoutes from "./modules/users/route.js";
import { errorHandler, notFound } from "./middleware/error-handler.js";
import { sendSuccess } from "./utils/response.js";
import { UPLOAD_DIR } from "./config/uploads.js";

const app = express();
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const EXTRA_ORIGINS = ["http://localhost:4173", "http://localhost:4174"]; // preview build

// Middleware dasar
app.use(helmet());
app.use(cors({ origin: (o, cb) => cb(null, !o || o === CLIENT_URL || EXTRA_ORIGINS.includes(o)), credentials: true }));
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// File statis hasil upload (multer menulis ke folder uploads/)
app.use("/uploads", (req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
}, express.static(UPLOAD_DIR));

// Rate limit dasar untuk semua route /api
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    limit: 300, // maksimal 300 request per IP per jendela waktu
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { success: false, message: "Terlalu banyak permintaan, coba lagi nanti", errors: null },
  })
);

// Router dasar /api — modul fitur akan dipasang di sini, satu per satu
const api = express.Router();
api.get("/health", (_req, res) => {
  sendSuccess(res, { data: { status: "ok", message: "Server Jaya Abadi berjalan" } });
});

// Modul fitur
api.use("/auth", authRoutes);
api.use("/users", userRoutes);
api.use("/media", mediaRoutes);
api.use("/admin/categories", categoriesRoutes);
api.use("/admin/dashboard", dashboardRoutes);
api.use("/admin/projects", projectsRoutes);
api.use("/admin/services", servicesRoutes);
api.use("/admin/service-categories", serviceCategoriesRoutes);
api.use("/admin/service-scopes", serviceScopesRoutes);
api.use("/admin/service-packages", servicePackagesRoutes);
api.use("/admin/hero-slides", heroSlidesRoutes);
api.use("/admin/posts", postRoutes);
api.use("/admin/tags", tagsRoutes);
api.use("/admin/testimonials", testimonialRoutes);
api.use("/admin/team", teamRoutes);
api.use("/admin/partners", partnersRoutes);
api.use("/admin/certificates", certificatesRoutes);
api.use("/admin/faqs", faqsRoutes);
api.use("/admin/features", featuresRoutes);
api.use("/admin/process-steps", processStepsRoutes);
api.use("/admin/before-after", beforeAfterRoutes);
api.use("/admin/estimate-prices", estimatePricesRoutes);
api.use("/public/partners", partnersPublicRouter);
api.use("/public/certificates", certificatesPublicRouter);
api.use("/public/faqs", faqsPublicRouter);
api.use("/public/features", featuresPublicRouter);
api.use("/public/process-steps", processStepsPublicRouter);
api.use("/public/before-after", beforeAfterPublicRouter);
api.use("/public/estimate-prices", estimatePricesPublicRouter);
api.use("/admin/subscribers", subscribersRoutes);
api.use("/admin/milestones", milestonesRoutes);
api.use("/admin/core-values", coreValuesRoutes);
api.use("/admin/gallery", galleryRoutes);
api.use("/public", subscribersPublicRouter); // POST /subscribe — sebelum catch-all /public
api.use("/public/milestones", milestonesPublicRouter);
api.use("/public/core-values", coreValuesPublicRouter);
api.use("/public/gallery", galleryPublicRouter);
api.use("/public/branches", branchesPublicRouter);
api.use("/admin/branches", branchesRoutes);
api.use("/public/service-packages", servicePackagesPublicRouter);
api.use("/public/service-categories", serviceCategoriesPublicRouter);
api.use("/admin/messages", messagesRoutes);
api.use("/admin/settings", settingsRoutes);
api.use("/public/messages", messagesPublicRouter);
api.use("/public/settings", settingsPublicRouter);
api.use("/public/hero-slides", heroSlidesPublicRouter);
api.use("/public", publicRoutes);

// SEO: sitemap & robots di root (sebelum handler 404 API)
app.get("/sitemap.xml", sitemap);
app.get("/robots.txt", robots);
api.use("/public/categories", categoriesPublicRouter);
app.use("/api", api);

// 404 lalu errorHandler global (semua punya format seragam)
app.use(notFound);
app.use(errorHandler);

export default app;
