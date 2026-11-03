
// Logika bisnis media: simpan record, daftar, hapus (record + file fisik)
// Optimasi gambar: sharp → konversi WebP (maks 1600px) + thumbnail 480px
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error.js";
import { paginate, paginationMeta } from "../../utils/paginate.js";
import { UPLOAD_DIR } from "./upload.js";

const MIN_IMAGE_BYTES = 1024;

async function removeFile(filePath) {
  await fs.rm(filePath, { force: true, maxRetries: 3, retryDelay: 100 }).catch(() => undefined);
}

// Perkecil & konversi ke WebP; buat -thumb.webp (480px) untuk grid.
async function optimizeImage(filePath) {
  const parsed = path.parse(filePath);
  const webpPath = path.join(parsed.dir, `${parsed.name}.webp`);
  const thumbPath = webpPath.replace(/\.webp$/, "-thumb.webp");
  try {
    // Validasi buffer sebelum menulis agar hasil kosong tidak menjadi orphan di Windows.
    const webpBuffer = await sharp(filePath)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    if (webpBuffer.length < MIN_IMAGE_BYTES) {
      throw new ApiError(400, "Hasil konversi gambar terlalu kecil (minimal 1 KB)");
    }
    await fs.writeFile(webpPath, webpBuffer);
    await sharp(webpBuffer).resize({ width: 480, withoutEnlargement: true }).webp({ quality: 72 }).toFile(thumbPath);
    try { await fs.rm(filePath, { force: true }); } catch { /* EBUSY Windows — file sementara jadi orphan */ }
    return { webp: path.basename(webpPath), thumb: path.basename(thumbPath) };
  } catch (error) {
    await Promise.all([
      fs.rm(filePath, { force: true }).catch(() => undefined),
      fs.rm(webpPath, { force: true }).catch(() => undefined),
      fs.rm(thumbPath, { force: true }).catch(() => undefined),
    ]);
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, "Gambar tidak dapat dikonversi menjadi WebP");
  }
}

// URL absolut berbasis SERVER_URL dengan pemisah URL yang konsisten.
function absoluteUrl(value) {
  const serverUrl = (process.env.SERVER_URL || "http://localhost:4000").replace(/\\+|\/+$/g, "");
  const normalized = String(value ?? "").replaceAll("\\", "/");
  if (!normalized) return null;
  if (/^https?:\/\//i.test(normalized)) return normalized;
  return `${serverUrl}${normalized.startsWith("/") ? normalized : `/${normalized}`}`;
}

function toResponse(media) {
  const url = absoluteUrl(media.url);
  return {
    ...media,
    url,
    thumbUrl: url ? url.replace(/\.webp$/i, "-thumb.webp") : null,
  };
}

// Sumber pemakaian disusun per tabel agar pemeriksaan tidak menjadi N+1 query.
const USAGE_SOURCES = [
  { model: "project", select: { id: true, title: true, coverImage: true, description: true, challenge: true, solution: true, result: true }, module: "Proyek", label: (row) => row.title, editUrl: (row) => `/admin/proyek/${row.id}/edit`, fields: ["coverImage", "description", "challenge", "solution", "result"] },
  { model: "projectImage", select: { id: true, projectId: true, url: true, project: { select: { title: true } } }, module: "Galeri proyek", label: (row) => row.project?.title ?? "Proyek", editUrl: (row) => `/admin/proyek/${row.projectId}/edit`, fields: ["url"], fieldLabels: { url: "images.url" } },
  { model: "service", select: { id: true, title: true, image: true, heroImage: true, longDescription: true }, module: "Layanan", label: (row) => row.title, editUrl: (row) => `/admin/layanan/${row.id}/edit`, fields: ["image", "heroImage", "longDescription"] },
  { model: "post", select: { id: true, title: true, coverImage: true, content: true }, module: "Artikel", label: (row) => row.title, editUrl: (row) => `/admin/artikel/${row.id}/edit`, fields: ["coverImage", "content"] },
  { model: "testimonial", select: { id: true, name: true, avatar: true }, module: "Testimoni", label: (row) => row.name, editUrl: () => "/admin/testimoni", fields: ["avatar"] },
  { model: "teamMember", select: { id: true, name: true, photo: true }, module: "Tim", label: (row) => row.name, editUrl: () => "/admin/tim", fields: ["photo"] },
  { model: "heroSlide", select: { id: true, title: true, image: true }, module: "Hero slide", label: (row) => row.title, editUrl: () => "/admin/hero-slider", fields: ["image"] },
  { model: "partner", select: { id: true, name: true, logo: true }, module: "Mitra", label: (row) => row.name, editUrl: () => "/admin/partners", fields: ["logo"] },
  { model: "certificate", select: { id: true, title: true, image: true }, module: "Sertifikat", label: (row) => row.title, editUrl: () => "/admin/certificates", fields: ["image"] },
  { model: "beforeAfter", select: { id: true, title: true, beforeImage: true, afterImage: true }, module: "Before/After", label: (row) => row.title, editUrl: () => "/admin/before-after", fields: ["beforeImage", "afterImage"] },
  { model: "milestone", select: { id: true, title: true, image: true }, module: "Milestone", label: (row) => row.title, editUrl: () => "/admin/milestones", fields: ["image"] },
  { model: "galleryItem", select: { id: true, caption: true, image: true }, module: "Galeri", label: (row) => row.caption || "Foto galeri", editUrl: () => "/admin/gallery", fields: ["image"] },
  { model: "branch", select: { id: true, name: true, photo: true }, module: "Cabang", label: (row) => row.name, editUrl: () => "/admin/branches", fields: ["photo"] },
  { model: "user", select: { id: true, name: true, photo: true }, module: "Pengguna", label: (row) => row.name, editUrl: () => "/admin/pengguna", fields: ["photo"] },
  { model: "siteSetting", select: { id: true, key: true, value: true }, module: "Pengaturan", label: (row) => row.key, editUrl: () => "/admin/pengaturan", fields: ["value"], fieldLabels: { value: "value" } },
];

function rawPath(value) {
  const text = String(value ?? "").replaceAll("\\", "/");
  if (/^https?:\/\//i.test(text)) {
    try { return decodeURIComponent(new URL(text).pathname); } catch { return text; }
  }
  return text;
}

function storedFilename(value) {
  const normalized = rawPath(value);
  if (normalized.split("/").some((part) => part === "..")) {
    throw new ApiError(400, "Nama file media tidak valid");
  }
  const filename = path.basename(normalized);
  if (!filename || filename === "." || filename === "..") throw new ApiError(400, "Nama file media tidak valid");
  return filename;
}

function resolveUploadFile(filename) {
  const root = path.resolve(UPLOAD_DIR);
  const safeName = path.basename(filename);
  const resolved = path.resolve(root, safeName);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new ApiError(400, "Path file media tidak valid");
  }
  return resolved;
}

async function loadUsageSources() {
  return Promise.all(USAGE_SOURCES.map(async (source) => ({ source, rows: await prisma[source.model].findMany({ select: source.select }) })));
}

function valueContainsFilename(value, filename) {
  return typeof value === "string" && value.toLowerCase().includes(filename.toLowerCase());
}

function scanUsage(sourceRows, filename) {
  const usages = [];
  for (const { source, rows } of sourceRows) {
    for (const row of rows) {
      for (const field of source.fields) {
        if (!valueContainsFilename(row[field], filename)) continue;
        usages.push({
          module: source.module,
          label: source.label(row),
          recordId: row.id,
          field: source.fieldLabels?.[field] ?? field,
          editUrl: source.editUrl(row),
        });
      }
    }
  }
  return usages;
}

async function buildUsageIndex(mediaRows, sourceRows = null) {
  const loaded = sourceRows ?? await loadUsageSources();
  const index = new Map();
  for (const media of mediaRows) {
    const filename = storedFilename(media.url);
    index.set(filename, scanUsage(loaded, filename));
  }
  return index;
}

async function fileStatus(media) {
  const filename = storedFilename(media.url);
  const filePath = resolveUploadFile(filename);
  try {
    const stat = await fs.stat(filePath);
    if (stat.size < MIN_IMAGE_BYTES) return { isBroken: true, brokenReason: "Ukuran file di bawah 1 KB", diskSize: stat.size };
    return { isBroken: false, brokenReason: null, diskSize: stat.size };
  } catch (error) {
    if (error.code === "ENOENT") return { isBroken: true, brokenReason: "File tidak ditemukan di disk", diskSize: null };
    throw error;
  }
}

async function enrichMedia(rows, usageIndex) {
  return Promise.all(rows.map(async (media) => {
    const status = await fileStatus(media);
    const usages = usageIndex.get(storedFilename(media.url)) ?? [];
    return { ...toResponse(media), filename: media.filename, inUse: usages.length > 0, usageCount: usages.length, isBroken: status.isBroken, brokenReason: status.brokenReason };
  }));
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
      if (stat.size < MIN_IMAGE_BYTES) {
        await Promise.all([
          removeFile(path.join(UPLOAD_DIR, webp)),
          removeFile(path.join(UPLOAD_DIR, thumb)),
        ]);
        throw new ApiError(400, "Hasil konversi gambar terlalu kecil (minimal 1 KB)");
      }
      created.push(
        prisma.media.create({
          data: {
            url: absoluteUrl(`/uploads/${webp}`),
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
    await Promise.all(generatedFiles.map((name) => removeFile(path.join(UPLOAD_DIR, name))));
    await Promise.all(files.map((file) => removeFile(path.join(UPLOAD_DIR, file.filename))));
    throw error;
  }

}

// Daftar media dengan paginasi + pencarian nama file asli
export async function listMedia(query) {
  const { page, limit, skip, where } = paginate(query, { searchFields: ["filename"] });

  const [rows, total, allMedia, sourceRows] = await Promise.all([
    prisma.media.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.media.count({ where }),
    prisma.media.findMany({ select: { id: true, url: true, filename: true, size: true, mimeType: true, createdAt: true } }),
    loadUsageSources(),
  ]);

  const usageIndex = await buildUsageIndex(allMedia, sourceRows);
  return { data: await enrichMedia(rows, usageIndex), meta: paginationMeta(total, page, limit) };
}

// Cari seluruh pemakaian berdasarkan nama file, bukan domain URL.
export async function findMediaUsage(url) {
  const filename = storedFilename(url);
  return scanUsage(await loadUsageSources(), filename);
}

export async function getMediaUsageById(id) {
  const media = await prisma.media.findUnique({ where: { id }, select: { id: true, url: true } });
  if (!media) throw new ApiError(404, "Media tidak ditemukan");
  const usages = await findMediaUsage(media.url);
  return { usages, count: usages.length };
}

async function removePhysicalFiles(media) {
  const filename = storedFilename(media.url);
  const primaryPath = resolveUploadFile(filename);
  const names = [filename];
  if (/\.webp$/i.test(filename)) names.push(filename.replace(/\.webp$/i, "-thumb.webp"));
  let fileRemoved = true;
  for (const name of names) {
    const filePath = resolveUploadFile(name);
    try {
      await fs.rm(filePath, { force: true, maxRetries: 3, retryDelay: 100 });
    } catch (error) {
      if (error.code !== "ENOENT") {
        fileRemoved = false;
        console.error("[media] Gagal menghapus file", filePath, error.message);
      }
    }
  }
  // Memastikan path utama sudah divalidasi walaupun file fisiknya hilang.
  void primaryPath;
  return fileRemoved;
}

async function deleteEligibleMedia(mediaRows) {
  if (mediaRows.length === 0) return [];
  for (const media of mediaRows) {
    storedFilename(media.url);
  }
  await prisma.$transaction(async (tx) => {
    for (const media of mediaRows) await tx.media.delete({ where: { id: media.id } });
  });
  return Promise.all(mediaRows.map(async (media) => ({ id: media.id, filename: media.filename, fileRemoved: await removePhysicalFiles(media) })));
}

// Hapus record lalu file fisiknya; file yang sudah hilang tetap dianggap sukses.
export async function deleteMedia(id) {
  const media = await prisma.media.findUnique({ where: { id }, select: { id: true, url: true, filename: true } });
  if (!media) throw new ApiError(404, "Media tidak ditemukan");

  const usages = await findMediaUsage(media.url);
  if (usages.length > 0) throw new ApiError(409, `Gambar masih dipakai di ${usages.length} tempat. Ganti gambarnya terlebih dulu.`, usages);
  storedFilename(media.url);
  const [deleted] = await deleteEligibleMedia([media]);

  return { message: "Media berhasil dihapus", ...deleted };
}

export async function bulkDeleteMedia(ids) {
  const uniqueIds = [...new Set(ids)];
  const rows = await prisma.media.findMany({ where: { id: { in: uniqueIds } }, select: { id: true, url: true, filename: true } });
  const found = new Map(rows.map((row) => [row.id, row]));
  const sourceRows = await loadUsageSources();
  const usageIndex = await buildUsageIndex(rows, sourceRows);
  const skipped = [];
  const eligible = [];
  const failed = [];
  for (const id of uniqueIds) {
    const media = found.get(id);
    if (!media) {
      failed.push({ id, message: "Media tidak ditemukan" });
      continue;
    }
    const usages = usageIndex.get(storedFilename(media.url)) ?? [];
    if (usages.length > 0) skipped.push({ id, filename: media.filename, usages });
    else {
      try { storedFilename(media.url); eligible.push(media); } catch (error) { failed.push({ id, message: error.message }); }
    }
  }
  let deleted = [];
  try { deleted = await deleteEligibleMedia(eligible); } catch (error) {
    failed.push(...eligible.map((media) => ({ id: media.id, filename: media.filename, message: error.message })));
  }
  return { deleted, skipped, failed };
}

export async function listBrokenMedia() {
  const rows = await prisma.media.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, url: true, filename: true, size: true, mimeType: true, createdAt: true } });
  const usageIndex = await buildUsageIndex(rows);
  const broken = (await enrichMedia(rows, usageIndex)).filter((media) => media.isBroken);
  return broken.map((media) => ({ ...media, inUse: media.usageCount > 0 }));
}

export async function cleanupBrokenMedia(dryRun = true) {
  const broken = await listBrokenMedia();
  const candidates = broken.filter((media) => !media.inUse);
  const skipped = broken.filter((media) => media.inUse).map((media) => ({ id: media.id, filename: media.filename, usages: [] }));
  if (dryRun) return { dryRun: true, candidates, skipped, deleted: [], failed: [] };
  const result = await bulkDeleteMedia(candidates.map((media) => media.id));
  return { dryRun: false, candidates, skipped: [...skipped, ...result.skipped], deleted: result.deleted, failed: result.failed };
}
