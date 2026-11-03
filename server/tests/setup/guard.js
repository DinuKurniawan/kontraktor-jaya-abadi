// Guard wajib: semua test hanya boleh memakai database PostgreSQL lokal *_test.
export function assertTestEnvironment() {
  const reasons = [];
  const productionKeys = Object.keys(process.env).filter((key) => /^DATABASE_URL_PROD/i.test(key));

  if (process.env.NODE_ENV !== "test") reasons.push("NODE_ENV harus bernilai test");
  if (productionKeys.length > 0) reasons.push("variabel DATABASE_URL_PROD* terdeteksi pada proses");

  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    reasons.push("DATABASE_URL tidak tersedia");
  } else {
    try {
      const url = new URL(rawUrl);
      const host = url.hostname.toLowerCase();
      const database = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
      if (!new Set(["localhost", "127.0.0.1"]).has(host)) reasons.push("host database bukan localhost atau 127.0.0.1");
      if (!database.toLowerCase().endsWith("_test")) reasons.push("nama database tidak berakhiran _test");
    } catch {
      reasons.push("DATABASE_URL bukan URL PostgreSQL yang valid");
    }
  }

  if (reasons.length > 0) {
    throw new Error(`[TEST GUARD] Tes dibatalkan: ${reasons.join("; ")}.`);
  }
}

assertTestEnvironment();
