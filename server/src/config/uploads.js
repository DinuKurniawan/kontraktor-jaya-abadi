// Satu sumber path absolut untuk seluruh file upload.
// Di Vercel serverless filesystem bersifat read-only (kecuali /tmp), jadi
// folder upload dialihkan ke os.tmpdir() agar tidak melempar EROFS saat runtime.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const UPLOAD_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), "uploads")
  : path.resolve(__dirname, "../../uploads");

// Pastikan folder ada sebelum multer menulis (Vercel tidak menyediakan folder ini).
try {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
} catch (error) {
  console.error("[uploads] Gagal menyiapkan folder upload:", error.message);
}
