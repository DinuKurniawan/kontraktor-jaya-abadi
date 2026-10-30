// Validasi testimonials
import { z } from "zod";

export const createSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  position: z.string().min(2, "Jabatan minimal 2 karakter").max(100),
  company: z.string().max(100).optional().nullable(),
  content: z.string().min(10, "Isi testimoni minimal 10 karakter").max(1000),
  rating: z.number({ invalid_type_error: "Rating wajib diisi" }).int().min(1, "Rating minimal 1").max(5, "Rating maksimal 5"),
  avatar: z.string().optional().nullable(),
  isPublished: z.boolean().optional(),
});

export const updateSchema = createSchema.partial();
