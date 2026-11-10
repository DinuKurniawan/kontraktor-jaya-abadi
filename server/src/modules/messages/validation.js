// Validasi messages — publik & admin
import { z } from "zod";

// Form kontak publik — "website" = honeypot (bot mengisinya; dibiarkan lolos validasi,
// lalu ditolak diam-diam di controller agar bot tidak belajar).
// email & subject opsional: dipakai form CTA singkat (nama + WhatsApp saja)
export const publicCreateSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  email: z.union([z.email("Format email tidak valid").max(150), z.literal("")]).optional(),
  phone: z.string().min(6, "Nomor telepon minimal 6 karakter").max(20),
  subject: z.string().max(150).optional(),
  body: z.string().min(10, "Pesan minimal 10 karakter").max(2000),
  serviceId: z.string().min(1).max(40).optional(),
  budgetRange: z.enum(["KURANG_100JT", "100_500JT", "500JT_1M", "1M_5M", "LEBIH_5M", "BELUM_TAHU"]).optional(),
  projectLocation: z.string().max(200).optional(),
  projectArea: z.preprocess((value) => value === "" || value === null ? undefined : value, z.coerce.number().int().positive().max(100000).optional()),
  startEstimate: z.string().max(100).optional(),
  preferredContact: z.enum(["WHATSAPP", "TELEPON", "EMAIL"]).default("WHATSAPP"),
  preferredTime: z.enum(["PAGI", "SIANG", "SORE", "BEBAS"]).default("BEBAS"),
  attachments: z.array(z.union([
    z.string().regex(/^\/uploads\/messages\/[A-Za-z0-9._-]+$/, "URL lampiran tidak valid"),
    z.string().url("URL lampiran tidak valid"),
  ])).max(3, "Maksimal 3 lampiran").default([]),
  source: z.string().max(100).optional(),
  // Form lama/CTA singkat belum memiliki checkbox privasi; form konsultasi baru mengirim true.
  consent: z.boolean().refine((value) => value === true, "Anda harus menyetujui kebijakan privasi").optional(),
  website: z.string().max(300).optional(),
});

export const adminUpdateSchema = z.object({
  status: z.enum(["BARU", "DIPROSES", "SELESAI", "SPAM"]).optional(),
  adminNote: z.string().max(5000).nullable().optional(),
});

// Filter daftar admin: status, layanan, anggaran, dan rentang tanggal.
export const listQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().max(150).optional(),
  unread: z.enum(["true", "false"]).optional(),
  status: z.enum(["BARU", "DIPROSES", "SELESAI", "SPAM"]).optional(),
  serviceId: z.string().min(1).optional(),
  budgetRange: z.enum(["KURANG_100JT", "100_500JT", "500JT_1M", "1M_5M", "LEBIH_5M", "BELUM_TAHU"]).optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal mulai tidak valid").optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal akhir tidak valid").optional(),
});
