import ApiError from "../utils/api-error.js";

const isProd = process.env.NODE_ENV === "production";

// 404 untuk semua route yang tidak terdaftar
export function notFound(req, _res, next) {
  next(new ApiError(404, `Route ${req.method} ${req.originalUrl} tidak ditemukan`));
}

// Kode error Prisma terkait koneksi/gateway → respons 503 (retryable) + log detail
const PRISMA_CONNECTION_CODES = new Set([
  "P1001", // DB tidak terjangkau
  "P1002", // DB terjangkau tapi waktu habis saat handshake
  "P1004", // operasi dibatalkan karena timeout
  "P1008", // transaksi timeout
  "P1017", // koneksi ditutup server
  "P2024", // connection pool timeout (gejala kehabisan koneksi)
  "P2034", // transaksi konflik — retryable
]);

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
  // Prisma: record tidak ditemukan / ID tidak valid → 404
  else if (err?.code === "P2025" || err?.code === "P2023") {
    statusCode = 404;
    message = "Data tidak ditemukan";
  }
  // Prisma/DB: masalah koneksi & pool timeout → 503 agar client tahu bisa dicoba ulang
  else if (PRISMA_CONNECTION_CODES.has(err?.code)) {
    statusCode = 503;
    message = "Layanan sedang sibuk — silakan coba lagi sebentar";
  }
  // Body JSON rusak → 400
  else if (err?.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Format JSON tidak valid";
  }
  // Payload terlalu besar → 413
  else if (err?.type === "entity.too.large") {
    statusCode = 413;
    message = "Ukuran data terlalu besar";
  }

  const errors =
    err?.name === "ZodError"
      ? err.issues.map((issue) => ({ field: issue.path.join(".") || "(root)", message: issue.message }))
      : (err?.errors ?? null);

  if (statusCode >= 500) {
    // Log konteks lengkap agar akar masalah mudah ditelusuri di log Vercel
    console.error(
      `[error] ${_req.method} ${_req.originalUrl} -> ${statusCode}`,
      { code: err?.code, name: err?.name, message: err?.message }
    );
    if (!isProd) console.error(err);
    if (isProd) {
      message = (PRISMA_CONNECTION_CODES.has(err?.code) || (err instanceof ApiError && err.statusCode < 505))
        ? message
        : "Terjadi kesalahan pada server";
    }
  }

  res.status(statusCode).json({ success: false, message, errors });
}
