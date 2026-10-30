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
  website: z.string().max(300).optional(),
});

// Filter daftar admin: ?unread=true
export const listQuerySchema = z.object({
  unread: z.enum(["true", "false"]).optional(),
});
