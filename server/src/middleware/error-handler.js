import ApiError from "../utils/api-error.js";

const isProd = process.env.NODE_ENV === "production";

// 404 untuk semua route yang tidak terdaftar
export function notFound(req, _res, next) {
  next(new ApiError(404, `Route ${req.method} ${req.originalUrl} tidak ditemukan`));
}

// errorHandler global — format respons seragam: { success, message, errors }
export function errorHandler(err, _req, res, _next) {
  let statusCode = err?.statusCode || 500;
  let message = err?.message || "Terjadi kesalahan pada server";

  // ZodError (validasi) → 400
  if (err?.name === "ZodError") {
    statusCode = 400;
    message = "Validasi gagal";
  }
  // Prisma: pelanggaran unique constraint → 409
  else if (err?.code === "P2002") {
    statusCode = 409;
    message = "Data sudah ada — gunakan nilai lain";
  }
  // Prisma: pelanggaran unique constraint → 409
  else if (err?.code === "P2002") {
    statusCode = 409;
    message = "Data sudah ada — gunakan nilai lain";
  }
  // Prisma: record tidak ditemukan / ID tidak valid → 404
  else if (err?.code === "P2025" || err?.code === "P2023") {
    statusCode = 404;
    message = "Data tidak ditemukan";
  }

  const errors =
    err?.name === "ZodError"
      ? err.issues.map((issue) => ({ field: issue.path.join(".") || "(root)", message: issue.message }))
      : (err?.errors ?? null);

  if (statusCode >= 500) {
    console.error("[error]", isProd ? message : err);
    if (isProd) message = "Terjadi kesalahan pada server";
  }

  res.status(statusCode).json({ success: false, message, errors });
}
