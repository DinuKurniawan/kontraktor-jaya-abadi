// Setup global Vitest: guard lebih dulu, lalu tutup Prisma dan hapus upload sementara.
import fs from "node:fs/promises";
import { afterAll } from "vitest";
import { uploadDir } from "./env.js";

const { default: prisma } = await import("../../src/config/prisma.js");

afterAll(async () => {
  await prisma.$disconnect();
  if (uploadDir) await fs.rm(uploadDir, { recursive: true, force: true });
});
