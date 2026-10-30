// Validasi posts
import { z } from "zod";

export const createSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter").max(150),
  excerpt: z.string().min(10, "Ringkasan minimal 10 karakter").max(300),
  content: z.string().min(20, "Konten minimal 20 karakter"), // HTML sederhana dari editor
  coverImage: z.string().min(1, "Cover wajib diunggah"),
  categoryId: z.string().min(1).optional().nullable(),
  isPublished: z.boolean().optional(),
  // readTime dihitung otomatis server; publishedAt diatur saat terbit
});

export const updateSchema = createSchema.partial();

// ?status=DRAFT|PUBLISHED (opsional)
export const listQuerySchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  categoryId: z.string().optional(),
});
