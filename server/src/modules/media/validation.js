// Validasi aksi penghapusan Media Library.
import { z } from "zod";

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1, "ID media tidak valid")).min(1, "Pilih minimal satu media").max(50, "Maksimal 50 media per permintaan"),
});

export const cleanupBrokenSchema = z.object({
  dryRun: z.boolean().default(true),
});
