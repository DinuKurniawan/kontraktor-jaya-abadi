// Milestone — validasi
import { z } from "zod";

export const createSchema = z.object({
  year: z.number().int().min(1900).max(2100),
  title: z.string().min(2, "Judul minimal 2 karakter").max(150),
  description: z.string().min(2, "Deskripsi minimal 2 karakter").max(2000),
  image: z.string().optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
});

export const updateSchema = createSchema.partial();

export const reorderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "Daftar id tidak boleh kosong"),
});
