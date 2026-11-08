// Singleton PrismaClient — dipakai ulang antar module agar koneksi efisien
import { PrismaClient } from "@prisma/client";

// Di serverless (Vercel) setiap cold start membuat instance baru. Tanpa batas
// pool yang kecil, banyak invocation bersamaan akan menghabiskan kuota koneksi
// PostgreSQL dan memunculkan error 500 intermiten ("too many connections").
// Endpoint pooled.db.prisma.io tidak tersedia untuk database ini, jadi kita
// memakai koneksi langsung dengan connection_limit kecil + cache di globalThis.
function resolveDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) return url;
  if (!process.env.VERCEL) return url;
  if (url.includes("connection_limit")) return url;
  return `${url}${url.includes("?") ? "&" : "?"}connection_limit=1&pool_timeout=30`;
}

// Log query yang lambat (>500ms) di production agar mudah diagnose penyebab
// 500/timeout intermiten. Format ringkas: durasi + nama query + parameter.
const isProd = process.env.NODE_ENV === "production";
const isDev = process.env.NODE_ENV !== "production";
const slowQueryThreshold = 500; // ms

const prisma =
  globalThis.__prisma ||
  new PrismaClient({
    datasources: { db: { url: resolveDatabaseUrl() } },
    log: [
      { level: "warn", emit: "stdout" },
      { level: "error", emit: "stdout" },
      ...(isDev
        ? [{ level: "query", emit: "stdout" }]
        : [{ level: "query", emit: "event" }]),
    ],
  });

// Hanya pasang listener event "query" bila Prisma memancarkan event (prod).
if (isProd && typeof prisma.$on === "function") {
  prisma.$on("query", (e) => {
    if (e.duration > slowQueryThreshold) {
      console.warn(
        `[prisma:slow] ${e.duration}ms ${e.query.slice(0, 160)}`,
        e.params ? `params=${e.params.slice(0, 120)}` : ""
      );
    }
  });
}

// Cache di semua environment: mencegah instance ganda saat hot-reload (dev)
// maupun saat function di-reuse (Vercel).
globalThis.__prisma = prisma;

export default prisma;
