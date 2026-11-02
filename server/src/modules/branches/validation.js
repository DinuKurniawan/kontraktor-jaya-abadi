// Validasi cabang admin.
import { z } from "zod";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format waktu harus HH:mm");
const hourSchema = z.object({
  hari: z.string().min(1).max(20),
  buka: z.string().max(5),
  tutup: z.string().max(5),
  libur: z.boolean(),
}).superRefine((row, context) => {
  if (row.libur) return;
  if (!time.safeParse(row.buka).success) context.addIssue({ code: "custom", path: ["buka"], message: "Jam buka tidak valid" });
  if (!time.safeParse(row.tutup).success) context.addIssue({ code: "custom", path: ["tutup"], message: "Jam tutup tidak valid" });
});

export const createSchema = z.object({
  name: z.string().min(2, "Nama cabang minimal 2 karakter").max(150),
  address: z.string().min(5, "Alamat minimal 5 karakter").max(300),
  city: z.string().min(2, "Kota minimal 2 karakter").max(100),
  phone: z.string().min(6, "Nomor telepon minimal 6 karakter").max(30),
  whatsapp: z.string().min(6, "Nomor WhatsApp minimal 6 karakter").max(30),
  email: z.email("Format email tidak valid").max(150),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  mapEmbedUrl: z.url("URL embed peta tidak valid").max(1000),
  openingHours: z.array(hourSchema).length(7, "Jam operasional harus berisi 7 hari"),
  photo: z.string().max(500).optional().nullable(),
  isMain: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(10000).optional(),
  isPublished: z.boolean().optional(),
});

export const updateSchema = createSchema.partial();

export const listQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().max(100).optional(),
});
