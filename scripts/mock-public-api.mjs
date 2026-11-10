/*
 * Mock API publik untuk audit.
 *
 * Audit kualitas publik mengukur frontend (a11y, gambar, font, chunk, Lighthouse),
 * bukan backend. CI tidak punya database, jadi request ke API lokal akan gagal
 * koneksi dan dulu menggagalkan audit sebagai "api-request-failed".
 *
 * Modul ini menyalakan server HTTP kecil di origin API yang dipakai build, hanya
 * bila origin itu lokal dan belum ada yang listen. Semua endpoint publik dibalas
 * dengan fixture minimal agar halaman benar-benar merender.
 */
import { createServer } from "node:http";

// Origin lokal yang boleh dimock; origin remote (API produksi) tidak pernah dimock.
export function isLocalOrigin(origin) {
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

export async function isReachable(origin, timeoutMs = 1500) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    await fetch(`${origin}/api/public/settings`, { signal: controller.signal });
    clearTimeout(timer);
    return true;
  } catch {
    return false;
  }
}

// Fixture per path. Bentuk mengikuti yang dibaca komponen publik.
const SETTINGS = {
  company_name: "Jaya Abadi",
  company_email: "halo@jayaabadi.example",
  company_phone: "021-0000000",
  company_whatsapp: "6281234567890",
  company_address: "Jakarta",
  work_hours_weekday: "08.00 – 17.00",
  work_hours_saturday: "08.00 – 12.00",
  homepage_stats_1: "20",
  homepage_stats_1_label: "Tahun Pengalaman",
  homepage_stats_2: "200",
  homepage_stats_2_label: "Proyek Selesai",
  homepage_stats_3: "150",
  homepage_stats_3_label: "Klien Puas",
  homepage_stats_4: "80",
  homepage_stats_4_label: "Tenaga Ahli",
  social_instagram: "",
  social_facebook: "",
  social_linkedin: "",
  social_youtube: "",
};

const paginated = (extra = {}) => ({
  data: [],
  meta: { total: 0, page: 1, limit: 12, totalPages: 0 },
  facets: { categories: [], tags: [] },
  ...extra,
});

function bodyFor(pathname) {
  const path = pathname.replace(/^\/api/, "").replace(/\/$/, "");

  if (path === "/public/settings") return { data: SETTINGS };
  if (path === "/public/posts" || path === "/public/projects" || path === "/public/gallery") return paginated();
  // Daftar sederhana: services, testimonials, team, certificates, milestones,
  // core-values, features, faqs, branches, categories, tags, hero-slides,
  // termasuk sub-path daftar seperti /public/posts/featured.
  if (path.startsWith("/public/")) return { data: [] };
  return { data: null };
}

/**
 * Nyalakan mock API. Mengembalikan handle { origin, close() } atau null bila
 * origin bukan lokal (audit memakai API nyata) atau port sudah dipakai.
 */
export async function startMockPublicApi(apiBase) {
  const origin = apiBase.replace(/\/api\/?$/, "");
  if (!isLocalOrigin(origin)) return null;
  if (await isReachable(origin)) return null; // backend asli jalan — jangan ganggu

  const { port } = new URL(origin);
  const server = createServer((req, res) => {
    const requestOrigin = req.headers.origin;
    const headers = {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": req.headers["access-control-request-headers"] ?? "content-type",
      "Cache-Control": "no-store",
    };
    if (requestOrigin) headers["Access-Control-Allow-Origin"] = requestOrigin;

    if (req.method === "OPTIONS") {
      res.writeHead(204, headers);
      res.end();
      return;
    }

    const { pathname } = new URL(req.url, origin);
    res.writeHead(200, headers);
    res.end(JSON.stringify(bodyFor(pathname)));
  });

  await new Promise((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(Number(port || 4000), "127.0.0.1", resolvePromise);
  });

  return {
    origin,
    close: () => new Promise((resolvePromise) => server.close(resolvePromise)),
  };
}
