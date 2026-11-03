// Utilitas gambar bersama untuk memastikan file gambar tersimpan sebagai WebP.
import sharp from "sharp";

export function isImageMime(mimetype) {
  return typeof mimetype === "string" && mimetype.startsWith("image/");
}

export async function convertImageToWebp(sourcePath, outputPath, { quality = 80, maxWidth } = {}) {
  let pipeline = sharp(sourcePath).rotate();
  if (maxWidth) pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true });
  await pipeline.webp({ quality }).toFile(outputPath);
  return outputPath;
}
