// Validasi harga estimasi
import { z } from "zod";

export const createSchema = z.object({
  buildingType: z.enum(["RUMAH", "RUKO", "RENOVASI", "INTERIOR"]),
  label: z.string().min(2, "Label minimal 2 karakter").max(100),
  pricePerM2Min: z.number().int().min(0, "Harga minimal 0"),
  pricePerM2Max: z.number().int().min(0, "Harga maksimal 0"),
  isPublished: z.boolean().optional(),
});

export const updateSchema = createSchema.partial();
