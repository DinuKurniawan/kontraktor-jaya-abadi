// Validasi before/after
import { z } from "zod";

export const createSchema = z.object({
  title: z.string().min(2, "Judul minimal 2 karakter").max(150),
  location: z.string().max(150).optional().nullable(),
  beforeImage: z.string().min(1, "Foto sebelum wajib diisi"),
  afterImage: z.string().min(1, "Foto sesudah wajib diisi"),
  projectId: z.string().optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
});

export const updateSchema = createSchema.partial();

export const reorderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "Daftar id tidak boleh kosong"),
});
