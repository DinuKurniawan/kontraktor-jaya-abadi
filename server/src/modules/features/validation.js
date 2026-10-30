// Validasi keunggulan
import { z } from "zod";

export const createSchema = z.object({
  title: z.string().min(2, "Judul minimal 2 karakter").max(100),
  description: z.string().min(5, "Deskripsi minimal 5 karakter"),
  icon: z.string().max(50).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
});

export const updateSchema = createSchema.partial();

export const reorderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "Daftar id tidak boleh kosong"),
});
