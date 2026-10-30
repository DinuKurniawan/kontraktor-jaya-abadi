// Pattern validasi body untuk CRUD users
import { z } from "zod";

export const createSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "EDITOR"]),
  isActive: z.boolean().default(true),
});

export const updateSchema = z
  .object({
    name: z.string().min(2, "Nama minimal 2 karakter").optional(),
    email: z.email("Format email tidak valid").optional(),
    password: z.string().min(8, "Password minimal 8 karakter").optional(),
    role: z.enum(["SUPER_ADMIN", "ADMIN", "EDITOR"]).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "Tidak ada data yang dikirim" });
