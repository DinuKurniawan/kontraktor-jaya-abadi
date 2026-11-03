// Upload lampiran pesan publik — terpisah dari folder/record Media admin.
import crypto from "node:crypto";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";
import ApiError from "../../utils/api-error.js";
import { convertImageToWebp, isImageMime } from "../../utils/image.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const MESSAGE_UPLOAD_DIR = path.resolve(__dirname, "../../../uploads/messages");
fs.mkdirSync(MESSAGE_UPLOAD_DIR, { recursive: true });

const PDF_MIME = "application/pdf";
const MAX_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 3;

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, MESSAGE_UPLOAD_DIR),
  filename: (_req, file, callback) => callback(null, `${crypto.randomUUID()}${file.mimetype === PDF_MIME ? ".pdf" : ".source"}`),
});

const fileFilter = (_req, file, callback) => {
  if (!isImageMime(file.mimetype) && file.mimetype !== PDF_MIME) {
    callback(new ApiError(400, "Tipe file tidak didukung — hanya file gambar atau PDF"));
    return;
  }
  callback(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE, files: MAX_FILES } });

async function removeFiles(files) {
  await Promise.all((files ?? []).map((file) => fsPromises.rm(file.path, { force: true }).catch(() => undefined)));
}

async function convertImages(files) {
  try {
    for (const file of files ?? []) {
      if (!isImageMime(file.mimetype)) continue;

      const baseName = path.parse(file.filename).name;
      const filename = `${baseName}.webp`;
      const outputPath = path.join(MESSAGE_UPLOAD_DIR, filename);
      await convertImageToWebp(file.path, outputPath, { quality: 80 });
      await fsPromises.rm(file.path, { force: true }).catch(() => undefined);
      file.filename = filename;
      file.path = outputPath;
      file.mimetype = "image/webp";
      file.size = (await fsPromises.stat(outputPath)).size;
    }
  } catch {
    await removeFiles(files);
    throw new ApiError(400, "Gambar tidak dapat dikonversi menjadi WebP");
  }
}

export default function uploadMessageAttachments(req, res, next) {
  upload.array("files", MAX_FILES)(req, res, (error) => {
    if (!error) {
      convertImages(req.files).then(() => next()).catch(next);
      return;
    }
    for (const file of req.files ?? []) {
      try { fs.rmSync(file.path, { force: true }); } catch { /* best effort cleanup */ }
    }
    if (error.code === "LIMIT_FILE_SIZE") return next(new ApiError(400, "Ukuran file melebihi 5 MB"));
    if (error.code === "LIMIT_FILE_COUNT") return next(new ApiError(400, "Maksimal 3 file per unggahan"));
    if (error.code === "LIMIT_UNEXPECTED_FILE") return next(new ApiError(400, "Gunakan field \"files\" untuk mengunggah"));
    return next(error);
  });
}
