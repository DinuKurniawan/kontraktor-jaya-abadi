// Normalisasi gambar layanan; default hanya dry-run dan tidak mengubah data.
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import prisma from "../src/config/prisma.js";
import { UPLOAD_DIR } from "../src/config/uploads.js";

const APPLY = process.argv.includes("--apply");
const SERVER_URL = (process.env.SERVER_URL || "http://localhost:4000").replace(/\/+$/, "");
const MIN_WIDTH = 800;
const PRESETS = {
  image: { width: 1200, height: 900, ratio: 4 / 3 },
  heroImage: { width: 1920, height: 1080, ratio: 16 / 9 },
};

function filenameFromUrl(value) {
  try { return path.basename(new URL(value).pathname); } catch { return path.basename(String(value).replaceAll("\\", "/")); }
}

async function readSource(value) {
  if (/^https?:\/\//i.test(value)) return Buffer.from(await (await fetch(value)).arrayBuffer());
  return fs.readFile(path.resolve(UPLOAD_DIR, filenameFromUrl(value)));
}

async function inspect(buffer) {
  const [metadata, stat] = await Promise.all([sharp(buffer).metadata(), Promise.resolve(buffer.length)]);
  return { width: metadata.width ?? 0, height: metadata.height ?? 0, size: stat };
}

async function normalize(buffer, preset) {
  return sharp(buffer).rotate().resize(preset.width, preset.height, { fit: "cover", position: "attention" }).webp({ quality: 80 }).toBuffer();
}

const services = await prisma.service.findMany({ select: { id: true, title: true, image: true, heroImage: true }, orderBy: { sortOrder: "asc" } });
let changed = 0;
try {
  for (const service of services) {
    for (const field of Object.keys(PRESETS)) {
      const sourceUrl = service[field];
      if (!sourceUrl) continue;
      try {
        const source = await readSource(sourceUrl);
        const before = await inspect(source);
        const preset = PRESETS[field];
        const ratio = before.width && before.height ? before.width / before.height : 0;
        const needs = !ratio || Math.abs(ratio - preset.ratio) / preset.ratio > 0.15 || before.width < MIN_WIDTH;
        if (!needs) {
          console.log(`${service.title} / ${field}: OK ${before.width}x${before.height}, ${Math.round(before.size / 1024)} KB`);
          continue;
        }
        const normalized = await normalize(source, preset);
        const after = await inspect(normalized);
        console.log(`${service.title} / ${field}: ${before.width}x${before.height}, ${Math.round(before.size / 1024)} KB -> ${after.width}x${after.height}, ${Math.round(after.size / 1024)} KB${APPLY ? " (ditulis)" : " (dry-run)"}`);
        changed += 1;
        if (!APPLY) continue;

        const base = `${crypto.randomUUID()}.webp`;
        const thumb = base.replace(/\.webp$/, "-thumb.webp");
        await fs.writeFile(path.join(UPLOAD_DIR, base), normalized);
        await fs.writeFile(path.join(UPLOAD_DIR, thumb), await sharp(normalized).resize({ width: 480, withoutEnlargement: true }).webp({ quality: 72 }).toBuffer());
        const url = `${SERVER_URL}/uploads/${base}`;
        await prisma.$transaction([
          prisma.media.create({ data: { url, filename: `service-${service.id}-${field}.webp`, mimeType: "image/webp", size: after.size } }),
          prisma.service.update({ where: { id: service.id }, data: { [field]: url } }),
        ]);
      } catch (error) {
        console.error(`${service.title} / ${field}: GAGAL — ${error.message}`);
      }
    }
  }
  console.log(`Ringkasan: ${changed} gambar ${APPLY ? "dinormalisasi" : "akan dinormalisasi (dry-run)"}.`);
} finally {
  await prisma.$disconnect();
}
