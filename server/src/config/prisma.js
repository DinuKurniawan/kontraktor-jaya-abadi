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

const prisma =
  globalThis.__prisma ||
  new PrismaClient({ datasources: { db: { url: resolveDatabaseUrl() } }, log: ["warn", "error"] });

// Cache di semua environment: mencegah instance ganda saat hot-reload (dev)
// maupun saat function di-reuse (Vercel).
globalThis.__prisma = prisma;

export default prisma;
