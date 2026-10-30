// Validasi body & query untuk services
import { z } from "zod";

export const createSchema = z.object({
  title: z.string().min(2, "Judul minimal 2 karakter").max(100),
  shortDesc: z.string().min(5, "Deskripsi singkat minimal 5 karakter").max(200),
  description: z.string().min(20, "Deskripsi lengkap minimal 20 karakter"),
  icon: z.string().min(1, "Pilih ikon"), // nama ikon Lucide, mis. "Wrench"
  image: z.string().optional().nullable(),
  sortOrder: z.number({ invalid_type_error: "Urutan wajib berupa angka" }).int().min(0).optional(),
  isPublished: z.boolean().optional(),
});

export const updateSchema = createSchema.partial();

// Body reorder: array id dalam urutan tampil
export const reorderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "Daftar id tidak boleh kosong"),
});
