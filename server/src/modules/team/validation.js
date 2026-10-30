// Validasi team members
import { z } from "zod";

export const createSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  position: z.string().min(2, "Jabatan minimal 2 karakter").max(100),
  bio: z.string().max(1000).optional().nullable(),
  photo: z.string().optional().nullable(),
  department: z.enum(["MANAJEMEN", "TEKNIK", "ARSITEK_INTERIOR", "PENGAWAS", "ADMINISTRASI"]).optional(),
  email: z.union([z.email("Format email tidak valid").max(150), z.literal("")]).optional().nullable(),
  linkedin: z.string().url("URL LinkedIn tidak valid").max(300).optional().nullable().or(z.literal("")),
  instagram: z.string().url("URL Instagram tidak valid").max(300).optional().nullable().or(z.literal("")),
  sortOrder: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
});

export const updateSchema = createSchema.partial();

// Reorder — sama seperti layanan: urutan id hasil tombol naik/turun
export const reorderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "Daftar id tidak boleh kosong"),
});
