import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  const rawApi = env.VITE_API_URL || "";
  let apiOrigin = "";
  try {
    if (rawApi) {
      const u = new URL(rawApi);
      apiOrigin = u.origin;
    }
  } catch {}

  // Origin gambar pihak ketiga (Picsum) — preconnect agar unduhan gambar LCP lebih cepat.
  const IMAGE_ORIGINS = ["https://picsum.photos", "https://fastly.picsum.photos"];
  const imagePreconnect = IMAGE_ORIGINS
    .map((o) => `    <link rel="preconnect" href="${o}" crossorigin />\n`)
    .join("");
  // Preload gambar LCP hero lokal agar diunduh paralel sejak awal dokumen.
  const heroPreload = `    <link rel="preload" as="image" href="/hero-default.webp" type="image/webp" fetchpriority="high" />\n`;

  // ---- ARD (Agentic Resource Discovery) manifest ----
  // URL publik situs: VITE_SITE_URL → domain produksi Vercel → localhost.
  // Tidak ada domain yang di-hard-code.
  const rawSite = env.VITE_SITE_URL
    || (env.VERCEL_PROJECT_PRODUCTION_URL && `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`)
    || (env.VERCEL_URL && `https://${env.VERCEL_URL}`)
    || "http://localhost:5173";
  let siteOrigin = "http://localhost:5173";
  try {
    siteOrigin = new URL(rawSite).origin;
  } catch {}

  // Publisher = hostname pemilik domain (bagian pertama URN ARD: urn:air:<publisher>:<namespace>:<name>).
  const publisher = (() => {
    try {
      return new URL(siteOrigin).hostname;
    } catch {
      return "localhost";
    }
  })();
  const apiBase = rawApi || "http://localhost:4000/api";

  // Resource nyata yang memang dilayani server: REST JSON publik (tanpa autentikasi).
  const ARD_RESOURCES = [
    {
      name: "services",
      displayName: "Layanan Kontraktor Jaya Abadi",
      description:
        "Daftar layanan konstruksi terbit: konstruksi bangunan baru, renovasi, desain & RAB, dan finishing.",
      path: "/public/services",
      queries: [
        "layanan kontraktor bangunan",
        "jasa renovasi rumah",
        "desain arsitektur dan RAB",
      ],
      tags: ["konstruksi", "renovasi", "desain", "rab"],
    },
    {
      name: "projects",
      displayName: "Portofolio Proyek Jaya Abadi",
      description:
        "Daftar proyek terbit (paginasi, filter kategori/layanan/status/tahun) beserta lokasi, luas, dan durasi.",
      path: "/public/projects",
      queries: [
        "portofolio proyek kontraktor",
        "contoh proyek renovasi rumah",
        "proyek gedung komersial yang sudah selesai",
      ],
      tags: ["proyek", "portofolio", "konstruksi"],
    },
    {
      name: "posts",
      displayName: "Artikel & Wawasan Konstruksi Jaya Abadi",
      description:
        "Artikel terbit seputar tips konstruksi, panduan RAB, dan regulasi bangunan.",
      path: "/public/posts",
      queries: [
        "tips membangun rumah",
        "cara membaca RAB kontraktor",
        "regulasi PBG dan SLF",
      ],
      tags: ["artikel", "tips", "regulasi"],
    },
  ];

  const ardManifest = {
    entries: ARD_RESOURCES.map((r) => ({
      identifier: `urn:air:${publisher}:api:${r.name}`,
      displayName: r.displayName,
      type: "application/json",
      description: r.description,
      url: `${apiBase.replace(/\/$/, "")}${r.path}`,
      representativeQueries: r.queries,
      tags: r.tags,
    })),
  };

  return {
    plugins: [
      react(),
      tailwindcss(),
      // Preconnect otomatis & injeksi CSP dinamis mengikuti VITE_API_URL
      {
        name: "api-preconnect-and-csp",
        transformIndexHtml(html) {
          const apiSource = apiOrigin ? ` ${apiOrigin}` : "";
          const preconnect = apiOrigin && !/localhost|127\.0\.0\.1/.test(apiOrigin)
            ? `    <link rel="preconnect" href="${apiOrigin}" crossorigin />\n${imagePreconnect}${heroPreload}`
            : imagePreconnect + heroPreload;
          // Catatan: frame-ancestors TIDAK valid di <meta>, hanya valid di header HTTP.
          const csp = `    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://picsum.photos https://fastly.picsum.photos https://*.picsum.photos https://images.unsplash.com https://*.tile.openstreetmap.org https://i.ytimg.com${apiSource}; font-src 'self' data:; connect-src 'self'${apiSource} https://nominatim.openstreetmap.org; frame-src https://www.google.com https://www.youtube.com https://www.youtube-nocookie.com; base-uri 'self'; form-action 'self'; object-src 'none'" />\n`;
          // Penemuan ARD eksplisit: <link rel="ard"> di setiap halaman.
          const ardLink = `    <link rel="ard" href="/.well-known/ard.json" />\n`;
          return html.replace("</head>", `${preconnect}${ardLink}${csp}  </head>`);
        },
      },
      // Tulis /.well-known/ard.json ke dist saat build (bukan file statis hard-code,
      // agar identifier & URL mengikuti VITE_SITE_URL / VITE_API_URL).
      {
        name: "ard-manifest",
        apply: "build",
        writeBundle(options) {
          const outDir = options.dir || path.resolve(__dirname, "dist");
          const dir = path.join(outDir, ".well-known");
          fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(
            path.join(dir, "ard.json"),
            `${JSON.stringify(ardManifest, null, 2)}\n`,
            "utf8",
          );
          // robots.txt tidak lagi ditulis di sini; lihat client/public/robots.txt.
        },
      },
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) return "vendor-react";
            if (id.includes("node_modules/react-router") || id.includes("node_modules/react-router-dom")) return "vendor-router";
            if (id.includes("node_modules/@tanstack/react-query")) return "vendor-query";
          },
        },
      },
    },
    resolve: {
      alias: { "@": path.resolve(__dirname, "src") },
    },
  };
});
