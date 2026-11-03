// Validasi kategori layanan.
import { z } from "zod";

export const createSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100, "Nama maksimal 100 karakter"),
  sortOrder: z.coerce.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
});

export const updateSchema = createSchema.partial();

export const listQuerySchema = z.object({
  search: z.string().optional(),
});

export const reorderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "Daftar kategori tidak boleh kosong"),
});
