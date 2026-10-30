// Validasi body & query untuk categories
import { z } from "zod";

export const createSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100, "Nama maksimal 100 karakter"),
  type: z.enum(["PROJECT", "POST"]),
});

export const updateSchema = createSchema.partial();

// Filter query list admin: ?type=PROJECT|POST (opsional)
export const listQuerySchema = z.object({
  type: z.enum(["PROJECT", "POST"]).optional(),
});
