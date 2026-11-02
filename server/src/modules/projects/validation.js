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
  // Spesifikasi (opsional)
  area: z.coerce.number().int().positive().max(1_000_000).optional().nullable(),
  durationMonths: z.coerce.number().int().positive().max(600).optional().nullable(),
  floors: z.coerce.number().int().min(0).max(200).optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  architect: z.string().max(150).optional().nullable(),
  videoUrl: z.url("URL video tidak valid").max(300).optional().or(z.literal("")).nullable(),
  serviceId: z.string().min(1).optional().nullable(),
  // Cerita proyek
  challenge: z.string().max(2000).optional().nullable(),
  solution: z.string().max(2000).optional().nullable(),
  result: z.string().max(2000).optional().nullable(),
  highlights: z.array(z.string().max(150)).max(10).optional().nullable(),
  tags: z.array(z.string().max(50)).max(15).optional().nullable(),
  // Lokasi
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  metaTitle: z.string().max(150).optional().nullable(),
  metaDescription: z.string().max(300).optional().nullable(),
});

export const updateSchema = createSchema.partial();

// Body aksi massal daftar proyek
export const bulkSchema = z.object({
  action: z.enum(["publish", "unpublish", "delete"]),
  ids: z.array(z.string().min(1)).min(1, "Pilih minimal satu proyek").max(50),
});

// Filter query list admin: ?status=&categoryId= (opsional; search ditangani paginate)
export const listQuerySchema = z.object({
  status: z.enum(["PLANNING", "ONGOING", "COMPLETED"]).optional(),
  categoryId: z.string().optional(),
});
