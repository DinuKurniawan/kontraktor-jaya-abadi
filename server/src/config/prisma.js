// Singleton PrismaClient — dipakai ulang antar module agar koneksi efisien
import { PrismaClient } from "@prisma/client";

// Di development, simpan instance di globalThis agar tidak dibuat ulang saat hot-reload
const prisma = globalThis.__prisma || new PrismaClient({ log: ["warn", "error"] });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

export default prisma;
