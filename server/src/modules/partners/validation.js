// Validasi mitra
import { z } from "zod";

export const createSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  logo: z.string().optional().nullable(),
  website: z.string().max(200).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
});

export const updateSchema = createSchema.partial();

export const reorderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "Daftar id tidak boleh kosong"),
});
