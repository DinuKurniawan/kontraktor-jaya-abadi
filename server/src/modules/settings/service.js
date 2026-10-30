// Logika bisnis site settings — key-value, upsert per key
import prisma from "../../config/prisma.js";

// Ambil semua settings sebagai objek { key: value }
export async function getAllSettings() {
  const rows = await prisma.siteSetting.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

// PUT (admin): upsert sekali untuk banyak key — body { key1: "v1", key2: "v2" }
export async function upsertSettings(body) {
  await prisma.$transaction(
    Object.entries(body).map(([key, value]) =>
      prisma.siteSetting.upsert({ where: { key }, update: { value: String(value) }, create: { key, value: String(value) } })
    )
  );
  return getAllSettings();
}
