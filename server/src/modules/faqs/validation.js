// Validasi faq
import { z } from "zod";

export const createSchema = z.object({
  question: z.string().min(5, "Pertanyaan minimal 5 karakter").max(255),
  answer: z.string().min(5, "Jawaban minimal 5 karakter"),
  sortOrder: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
});

export const updateSchema = createSchema.partial();

export const reorderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "Daftar id tidak boleh kosong"),
});
