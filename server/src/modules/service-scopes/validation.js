import { z } from "zod";

export const createSchema = z.object({
  serviceId: z.string().min(1, "Layanan wajib dipilih"),
  title: z.string().min(2).max(120),
  description: z.string().min(2).max(1000),
  icon: z.string().max(50).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateSchema = createSchema.partial();

export const listQuerySchema = z.object({
  serviceId: z.string().optional(),
});

export const reorderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "Daftar id tidak boleh kosong"),
});
