// Validasi posts
import { z } from "zod";

export const createSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter").max(150),
  excerpt: z.string().min(10, "Ringkasan minimal 10 karakter").max(300),
  content: z.string().min(20, "Konten minimal 20 karakter"), // HTML sederhana dari editor
  coverImage: z.string().min(1, "Cover wajib diunggah"),
  categoryId: z.string().min(1).optional().nullable(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  metaTitle: z.string().max(150).optional().nullable(),
  metaDescription: z.string().max(300).optional().nullable(),
  publishedAt: z.coerce.date().optional().nullable(),
  tagIds: z.array(z.string().min(1)).max(20).optional(),
  // readTime dihitung otomatis server; publishedAt diatur saat terbit
});

export const updateSchema = createSchema.partial();

export const bulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
  action: z.enum(["PUBLISH", "DRAFT", "FEATURE", "UNFEATURE", "DELETE"]),
});

// ?status=DRAFT|PUBLISHED (opsional)
export const listQuerySchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  categoryId: z.string().optional(),
});
