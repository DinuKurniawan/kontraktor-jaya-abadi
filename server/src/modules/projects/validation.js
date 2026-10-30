// Validasi body & query untuk projects
import { z } from "zod";

// Satu gambar galeri
const imageSchema = z.object({
  url: z.string().min(1, "URL gambar wajib diisi"),
  caption: z.string().max(200).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
});

export const createSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter").max(150),
  summary: z.string().min(10, "Ringkasan minimal 10 karakter").max(300),
  description: z.string().min(20, "Deskripsi minimal 20 karakter"),
  location: z.string().min(2, "Lokasi minimal 2 karakter").max(150),
  clientName: z.string().min(2, "Nama klien minimal 2 karakter").max(150),
  year: z.number({ invalid_type_error: "Tahun wajib diisi" }).int().min(1990).max(2100),
  value: z.string().max(100).optional().nullable(), // nilai kontrak, bebas format
  status: z.enum(["PLANNING", "ONGOING", "COMPLETED"]),
  categoryId: z.string().min(1).optional().nullable(),
  coverImage: z.string().min(1, "Cover image wajib diunggah"),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  images: z.array(imageSchema).max(10, "Maksimal 10 gambar galeri").optional(),
});

export const updateSchema = createSchema.partial();

// Filter query list admin: ?status=&categoryId= (opsional; search ditangani paginate)
export const listQuerySchema = z.object({
  status: z.enum(["PLANNING", "ONGOING", "COMPLETED"]).optional(),
  categoryId: z.string().optional(),
});
