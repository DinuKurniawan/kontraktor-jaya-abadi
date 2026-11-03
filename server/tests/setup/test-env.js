// Memuat environment tes dari satu file yang eksplisit.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, "../../..");
export const TEST_ENV_PATH = path.join(REPO_ROOT, "server", ".env.test");

export function loadTestEnv({ withUploads = false } = {}) {
  if (!fs.existsSync(TEST_ENV_PATH)) {
    throw new Error("Environment tes tidak ditemukan: buat server/.env.test dari server/.env.test.example");
  }

  // Jangan memakai dotenv/config karena itu dapat mencari file .env biasa.
  const result = dotenv.config({ path: TEST_ENV_PATH, override: true, quiet: true });
  if (result.error) throw new Error("Environment tes gagal dimuat dari server/.env.test");

  let uploadDir = null;
  if (withUploads) {
    uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), "jaya-abadi-test-uploads-"));
    process.env.TEST_UPLOAD_DIR = uploadDir;
  }

  return { uploadDir };
}
