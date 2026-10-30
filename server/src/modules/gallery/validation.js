// GalleryItem — validasi
import { z } from "zod";

const category = z.enum(["KEGIATAN", "PROYEK", "KANTOR", "PENGHARGAAN"]);

export const createSchema = z.object({
  image: z.string().min(1, "Gambar wajib diunggah").max(300),
  caption: z.string().max(200).optional().nullable(),
  category,
  sortOrder: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
});

export const updateSchema = createSchema.partial();

export const reorderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "Daftar id tidak boleh kosong"),
});

export const categoryQuerySchema = z.object({
  category: category.optional(),
});

// Public list: category + pagination (limit default 12, maks 24)
export const publicListSchema = z.object({
  category: category.optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(24).optional(),
});
