// Validasi body untuk hero-slides
import { z } from "zod";

export const createSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter").max(100),
  subtitle: z.string().max(200).optional().nullable(),
  image: z.string().min(1, "Gambar slide wajib diunggah"),
  ctaLabel: z.string().max(50).optional().nullable(),
  ctaUrl: z.string().max(300).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const updateSchema = createSchema.partial();
