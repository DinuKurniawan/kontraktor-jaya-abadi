import { z } from "zod";

// features: array of string (Json di Prisma)
export const createSchema = z.object({
  serviceId: z.string().min(1, "Layanan wajib dipilih"),
  name: z.string().min(2).max(120),
  description: z.string().min(2).max(1000),
  priceFrom: z.number().int().min(0),
  priceUnit: z.string().max(50).optional(),
  features: z.array(z.string().min(1).max(200)).min(1, "Minimal 1 fitur"),
  isPopular: z.boolean().optional(),
  ctaLabel: z.string().max(50).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
});

export const updateSchema = createSchema.partial();

export const reorderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "Daftar id tidak boleh kosong"),
});
