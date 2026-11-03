// Logika bisnis media: simpan record, daftar, hapus (record + file fisik)
// Optimasi gambar: sharp → konversi WebP (maks 1600px) + thumbnail 480px
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error.js";
import { convertImageToWebp } from "../../utils/image.js";
import { paginate, paginationMeta } from "../../utils/paginate.js";
import { UPLOAD_DIR } from "./upload.js";

// Perkecil & konversi ke WebP; buat -thumb.webp (480px) untuk grid.
async function optimizeImage(filePath) {
  const parsed = path.parse(filePath);
  const webpPath = path.join(parsed.dir, `${parsed.name}.webp`);
  const thumbPath = webpPath.replace(/\.webp$/, "-thumb.webp");
  try {
    await convertImageToWebp(filePath, webpPath, { maxWidth: 1600, quality: 80 });
    await sharp(webpPath).resize({ width: 480, withoutEnlargement: true }).webp({ quality: 72 }).toFile(thumbPath);
    try { await fs.rm(filePath, { force: true }); } catch { /* EBUSY Windows — file sementara jadi orphan */ }
    return { webp: path.basename(webpPath), thumb: path.basename(thumbPath) };
  } catch {
    await Promise.all([
      fs.rm(filePath, { force: true }).catch(() => undefined),
      fs.rm(webpPath, { force: true }).catch(() => undefined),
      fs.rm(thumbPath, { force: true }).catch(() => undefined),
    ]);
    throw new ApiError(400, "Gambar tidak dapat dikonversi menjadi WebP");
  }
}

// URL absolut berbasis SERVER_URL — record di DB menyimpan path relatif "/uploads/..."
function toResponse(media) {
  const serverUrl = process.env.SERVER_URL || "http://localhost:4000";
  return {
    ...media,
    url: `${serverUrl}${media.url}`,
    thumbUrl: media.url ? `${serverUrl}${media.url.replace(/\.webp$/, "-thumb.webp")}` : null,
  };
}

// Simpan record Media: optimasi tiap file lalu tulis ke DB
export async function saveFiles(files) {
  if (!files || files.length === 0) {
    throw new ApiError(400, "Tidak ada file yang diunggah");
  }

  const created = [];
  const generatedFiles = [];
  try {
    for (const file of files) {
      const { webp, thumb } = await optimizeImage(path.join(UPLOAD_DIR, file.filename));
      generatedFiles.push(webp, thumb);
      const stat = await fs.stat(path.join(UPLOAD_DIR, webp));
      created.push(
        prisma.media.create({
          data: {
            url: `/uploads/${webp}`,
            filename: file.originalname,
            mimeType: "image/webp",
            size: stat.size,
          },
        })
      );
    }

    const rows = await prisma.$transaction(created);
    return rows.map(toResponse);
  } catch (error) {
    await Promise.all(generatedFiles.map((name) => fs.rm(path.join(UPLOAD_DIR, name), { force: true }).catch(() => undefined)));
    await Promise.all(files.map((file) => fs.rm(path.join(UPLOAD_DIR, file.filename), { force: true }).catch(() => undefined)));
    throw error;
  }
}

// Daftar media dengan paginasi + pencarian nama file asli
export async function listMedia(query) {
  const { page, limit, skip, where } = paginate(query, { searchFields: ["filename"] });

  const [rows, total] = await prisma.$transaction([
    prisma.media.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.media.count({ where }),
  ]);

  return { data: rows.map(toResponse), meta: paginationMeta(total, page, limit) };
}

// Hapus record + file fisiknya di folder uploads/
export async function deleteMedia(id) {
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) throw new ApiError(404, "Media tidak ditemukan");

  // basename mencegah path traversal dari nilai url
  const base = path.basename(media.url);
  // Hapus file utama + thumbnail berpasangan (-thumb.webp)
  // EBUSY/EPERM di Windows (indexer/antivirus) diabaikan — record tetap terhapus
  const removeQuiet = async (name) => {
    try {
      await fs.rm(path.join(UPLOAD_DIR, name), { force: true });
    } catch {
      /* file orphan — dibiarkan */
    }
  };
  await Promise.all([removeQuiet(base), removeQuiet(base.replace(/\.webp$/, "-thumb.webp"))]);
  await prisma.media.delete({ where: { id } });

  return { message: "Media berhasil dihapus" };
}
