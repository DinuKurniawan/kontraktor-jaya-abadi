// Upload lampiran pesan publik — buffer di memori, file permanen di Supabase Storage.
import multer from "multer";
import ApiError from "../../utils/api-error.js";

export const ALLOWED_TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};
const MAX_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 3;

const storage = multer.memoryStorage();

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
    if (error.code === "LIMIT_FILE_SIZE") return next(new ApiError(400, "Ukuran file melebihi 5 MB"));
    if (error.code === "LIMIT_FILE_COUNT") return next(new ApiError(400, "Maksimal 3 file per unggahan"));
    if (error.code === "LIMIT_UNEXPECTED_FILE") return next(new ApiError(400, "Gunakan field \"files\" untuk mengunggah"));
    return next(error);
  });
}
