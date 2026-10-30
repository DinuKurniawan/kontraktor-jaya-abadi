// Slug unik per model
import prisma from "../config/prisma.js";

// Konversi teks bebas menjadi slug yang ramah URL
export function slugify(text = "") {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Slug unik per model: jika bentrok, otomatis tambah suffix -2, -3, dst.
// `model` = nama model di Prisma (harus punya field unik "slug").
export async function slugifyUnique({ model, text, excludeId = null, field = "slug" }) {
  const dbModel = prisma[model];
  if (!dbModel) throw new Error(`Model "${model}" tidak ditemukan di Prisma Client`);

  const base = slugify(text) || "item";
  let slug = base;

  for (let i = 1; i < 100; i += 1) {
    const where = { [field]: slug };
    // Saat update, abaikan record yang sedang diedit
    if (excludeId) where.id = { not: excludeId };

    const exists = await dbModel.findFirst({ where });
    if (!exists) break;

    slug = `${base}-${i + 1}`;
  }

  return slug;
}
