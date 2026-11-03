// Konfigurasi multer untuk upload media (field "files", multi-file)
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";
import ApiError from "../../utils/api-error.js";
import { isImageMime } from "../../utils/image.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const UPLOAD_DIR = path.resolve(__dirname, "../../../uploads");

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_FILES = 10;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  // Ekstensi sementara diganti menjadi .webp setelah isi file diproses sharp.
  filename: (_req, _file, cb) => cb(null, `${crypto.randomUUID()}.source`),
});

const fileFilter = (_req, file, cb) => {
  if (!isImageMime(file.mimetype)) {
    cb(new ApiError(400, "Tipe file tidak didukung — hanya file gambar"));
    return;
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE, files: MAX_FILES } });

async function removeUploadedFiles(files) {
  await Promise.all((files ?? []).map((file) => fs.rm(file.path, { force: true }).catch(() => undefined)));
}

// Wrapper middleware: terjemahkan error multer menjadi respons yang ramah
export default function uploadMedia(req, res, next) {
  upload.array("files", MAX_FILES)(req, res, (err) => {
    if (!err) {
      next();
      return;
    }
    removeUploadedFiles(req.files).catch(() => undefined);
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
