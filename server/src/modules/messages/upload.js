// Upload lampiran pesan publik — terpisah dari folder/record Media admin.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";
import ApiError from "../../utils/api-error.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const MESSAGE_UPLOAD_DIR = path.resolve(__dirname, "../../../uploads/messages");
fs.mkdirSync(MESSAGE_UPLOAD_DIR, { recursive: true });

const ALLOWED_TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};
const MAX_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 3;

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, MESSAGE_UPLOAD_DIR),
  filename: (_req, file, callback) => callback(null, `${crypto.randomUUID()}${ALLOWED_TYPES[file.mimetype] || ".bin"}`),
});

const fileFilter = (_req, file, callback) => {
  if (!ALLOWED_TYPES[file.mimetype]) {
    callback(new ApiError(400, "Tipe file tidak didukung — hanya JPG, PNG, WebP, atau PDF"));
    return;
  }
  callback(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE, files: MAX_FILES } });

export default function uploadMessageAttachments(req, res, next) {
  upload.array("files", MAX_FILES)(req, res, (error) => {
    if (!error) return next();
    for (const file of req.files ?? []) {
      try { fs.rmSync(file.path, { force: true }); } catch { /* best effort cleanup */ }
    }
    if (error.code === "LIMIT_FILE_SIZE") return next(new ApiError(400, "Ukuran file melebihi 5 MB"));
    if (error.code === "LIMIT_FILE_COUNT") return next(new ApiError(400, "Maksimal 3 file per unggahan"));
    if (error.code === "LIMIT_UNEXPECTED_FILE") return next(new ApiError(400, "Gunakan field \"files\" untuk mengunggah"));
    return next(error);
  });
}
