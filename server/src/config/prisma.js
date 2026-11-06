// Singleton PrismaClient — dipakai ulang antar module agar koneksi efisien
import { PrismaClient } from "@prisma/client";

// Di serverless (Vercel), runtime WAJIB memakai endpoint pooled atau koneksi
// DB akan habis saat banyak request berebutan (500 intermiten).
function resolveDatabaseUrl() {
  const url = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;
  if (!url) return url;
  // Tambahkan parameter pool hanya untuk endpoint pooled (PgBouncer), bukan migrasi.
  if (url.includes("pooled.db.prisma.io") && !url.includes("connection_limit")) {
    return `${url}${url.includes("?") ? "&" : "?"}connection_limit=5&pool_timeout=20`;
  }
  return url;
}

// Di development, simpan instance di globalThis agar tidak dibuat ulang saat hot-reload.
// Di serverless juga disimpan agar instance yang sama dipakai ulang antar-invocation.
const env = process.env.NODE_ENV || "development";
const prisma =
  (env !== "production" && globalThis.__prisma) ||
  new PrismaClient({ datasources: { db: { url: resolveDatabaseUrl() } }, log: ["warn", "error"] });

if (env !== "production") {
  globalThis.__prisma = prisma;
}
if (process.env.VERCEL) {
  globalThis.__prisma = prisma;
}

export default prisma;
