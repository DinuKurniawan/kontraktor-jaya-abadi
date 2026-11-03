// Konfigurasi multer untuk upload media (field "files", multi-file)
import crypto from "node:crypto";
<<<<<<< HEAD
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";
import ApiError from "../../utils/api-error.js";
=======
import fs from "node:fs/promises";
import multer from "multer";
import ApiError from "../../utils/api-error.js";
import { isImageMime } from "../../utils/image.js";
import { UPLOAD_DIR } from "../../config/uploads.js";
>>>>>>> 6f3bcfb (memperbaiki gambar yang terkena cors)

export { UPLOAD_DIR } from "../../config/uploads.js";

// Mimetype yang diizinkan → ekstensi file
export const ALLOWED_TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_FILES = 10;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  // Nama file dibuat acak (uuid) — hindari bentrok & mencegah path traversal
  filename: (_req, file, cb) => {
    const ext = ALLOWED_TYPES[file.mimetype] || ".bin";
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (!ALLOWED_TYPES[file.mimetype]) {
    cb(new ApiError(400, "Tipe file tidak didukung — hanya JPG, PNG, atau WebP"));
    return;
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE, files: MAX_FILES } });

// Wrapper middleware: terjemahkan error multer menjadi respons yang ramah
export default function uploadMedia(req, res, next) {
  upload.array("files", MAX_FILES)(req, res, (err) => {
    if (!err) {
      next();
      return;
    }
    if (err.code === "LIMIT_FILE_SIZE") {
      next(new ApiError(400, "Ukuran file melebihi 5 MB"));
      return;
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      next(new ApiError(400, "Maksimal 10 file per unggahan"));
      return;
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      next(new ApiError(400, "Gunakan field \"files\" untuk mengunggah"));
      return;
    }
    // Termasuk ApiError dari fileFilter (tipe tidak didukung)
    next(err);
  });
}
