// Validasi tag artikel admin
import { z } from "zod";

export const createSchema = z.object({
  name: z.string().trim().min(2, "Nama tag minimal 2 karakter").max(80, "Nama tag maksimal 80 karakter"),
});

export const updateSchema = createSchema.partial();

export const listQuerySchema = z.object({
  search: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});
